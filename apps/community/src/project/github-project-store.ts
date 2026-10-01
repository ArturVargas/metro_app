import type { ProjectConfig } from "./config.js";
import type {
  ProjectPromptSnapshot,
  ProjectStore,
  ProjectSyncResult,
} from "./types.js";

type RestOption = { id: string; name: { raw: string } };
type RestField = {
  id: number;
  name: string;
  data_type: string;
  options?: RestOption[];
};
type RestItem = {
  id: number;
  content?: {
    number?: number;
    repository?: { full_name?: string };
  };
};

type Metadata = {
  itemType: RestField;
  mission: RestField;
  participant: RestField;
  attempts: RestField;
  latestScore: RestField;
  eligible: RestField;
  voting: RestField;
};

const API = "https://api.github.com";

function requireField(fields: RestField[], name: string, type: string): RestField {
  const field = fields.find((candidate) => candidate.name === name);
  if (!field || field.data_type !== type) {
    throw new Error(`GitHub Project field ${name} (${type}) is missing`);
  }
  return field;
}

function requireOption(field: RestField, name: string): string {
  const option = field.options?.find((candidate) => candidate.name.raw === name);
  if (!option) throw new Error(`GitHub Project option ${field.name}/${name} is missing`);
  return option.id;
}

export class GitHubProjectStore implements ProjectStore {
  private metadata?: Metadata;

  constructor(
    private readonly config: ProjectConfig,
    private readonly fetchImpl: typeof fetch = globalThis.fetch,
  ) {}

  async syncPrompt(snapshot: ProjectPromptSnapshot): Promise<ProjectSyncResult> {
    const metadata = await this.getMetadata();
    const projectPath = `/users/${encodeURIComponent(this.config.owner)}/projectsV2/${this.config.projectNumber}`;
    // ponytail: one 100-item page covers the pilot; follow Link pagination if it grows.
    const items = await this.request<RestItem[]>(`${projectPath}/items?per_page=100`);
    const fullName = `${this.config.repoOwner}/${this.config.repo}`;
    let item = items.find(
      (candidate) =>
        candidate.content?.number === snapshot.issueNumber &&
        candidate.content.repository?.full_name === fullName,
    );
    const created = !item;

    if (!item) {
      const issue = await this.request<{ id?: number }>(
        `/repos/${encodeURIComponent(this.config.repoOwner)}/${encodeURIComponent(this.config.repo)}/issues/${snapshot.issueNumber}`,
      );
      if (!Number.isInteger(issue.id)) throw new Error("GitHub Issue ID is missing");
      const added = await this.request<{ value?: RestItem }>(`${projectPath}/items`, {
        method: "POST",
        body: JSON.stringify({ type: "Issue", id: issue.id }),
      });
      item = added.value;
      if (!item || !Number.isInteger(item.id)) {
        throw new Error("GitHub Project item ID is missing");
      }
    }

    await this.request(`${projectPath}/items/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        fields: [
          { id: metadata.itemType.id, value: requireOption(metadata.itemType, "Prompt") },
          { id: metadata.mission.id, value: snapshot.missionId },
          { id: metadata.participant.id, value: snapshot.participantId },
          { id: metadata.attempts.id, value: snapshot.attempts },
          { id: metadata.latestScore.id, value: snapshot.latestScore },
          { id: metadata.eligible.id, value: requireOption(metadata.eligible, snapshot.eligible ? "Yes" : "No") },
          { id: metadata.voting.id, value: requireOption(metadata.voting, snapshot.voting) },
        ],
      }),
    });

    return { itemId: String(item.id), created };
  }

  private async getMetadata(): Promise<Metadata> {
    if (this.metadata) return this.metadata;
    const path = `/users/${encodeURIComponent(this.config.owner)}/projectsV2/${this.config.projectNumber}/fields?per_page=100`;
    const fields = await this.request<RestField[]>(path);
    if (!Array.isArray(fields)) throw new Error("GitHub Project fields response is invalid");
    this.metadata = {
      itemType: requireField(fields, "Item type", "single_select"),
      mission: requireField(fields, "Mission", "text"),
      participant: requireField(fields, "Participant", "text"),
      attempts: requireField(fields, "Attempts", "number"),
      latestScore: requireField(fields, "Latest score", "number"),
      eligible: requireField(fields, "Eligible", "single_select"),
      voting: requireField(fields, "Voting", "single_select"),
    };
    return this.metadata;
  }

  private async request<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await this.fetchImpl(`${API}${path}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.config.token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2026-03-10",
        ...init.headers,
      },
    });
    if (!response.ok) {
      throw new Error(`GitHub Project request failed: ${init.method ?? "GET"} ${path} (${response.status})`);
    }
    return (await response.json()) as T;
  }
}
