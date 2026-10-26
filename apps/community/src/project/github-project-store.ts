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

/** Fields added for PR missions (ADR-0011); only required when a snapshot carries a PR. */
export const M3_PROJECT_FIELDS = {
  queueState: { name: "Queue state", type: "single_select" },
  evaluatedSha: { name: "Evaluated SHA", type: "text" },
  headSha: { name: "Head SHA", type: "text" },
  baseSha: { name: "Base SHA", type: "text" },
  changeOrigin: { name: "Change origin", type: "single_select" },
  checks: { name: "Checks", type: "single_select" },
  queuedAt: { name: "Queued at", type: "text" },
  pullRequest: { name: "Pull request", type: "text" },
} as const;

export const ORIGIN_OPTIONS = { llm: "LLM", manual: "Manual", combined: "Combined" } as const;
export const CHECKS_OPTIONS = { pending: "Pending", success: "Success", failure: "Failure" } as const;

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

    const fields: Array<{ id: number; value: string | number }> = [
      { id: metadata.itemType.id, value: requireOption(metadata.itemType, "Prompt") },
      { id: metadata.mission.id, value: snapshot.missionId },
      { id: metadata.participant.id, value: snapshot.participantId },
      { id: metadata.attempts.id, value: snapshot.attempts },
      { id: metadata.latestScore.id, value: snapshot.latestScore },
      { id: metadata.eligible.id, value: requireOption(metadata.eligible, snapshot.eligible ? "Yes" : "No") },
    ];
    // PR missions select by queue order, not by vote.
    if (snapshot.pr) fields.push(...(await this.prFields(snapshot)));
    else fields.push({ id: metadata.voting.id, value: requireOption(metadata.voting, snapshot.voting) });

    await this.request(`${projectPath}/items/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ fields }),
    });

    return { itemId: String(item.id), created };
  }

  private async prFields(snapshot: ProjectPromptSnapshot): Promise<Array<{ id: number; value: string | number }>> {
    const pr = snapshot.pr!;
    const fields = await this.getFields();
    const field = (key: keyof typeof M3_PROJECT_FIELDS) =>
      requireField(fields, M3_PROJECT_FIELDS[key].name, M3_PROJECT_FIELDS[key].type);
    const values: Array<{ id: number; value: string | number }> = [
      { id: field("pullRequest").id, value: pr.prUrl },
      { id: field("evaluatedSha").id, value: pr.evaluatedSha },
      { id: field("baseSha").id, value: pr.baseSha },
      { id: field("changeOrigin").id, value: requireOption(field("changeOrigin"), ORIGIN_OPTIONS[pr.origin]) },
    ];
    const queue = snapshot.queue;
    if (queue) {
      values.push(
        { id: field("queueState").id, value: requireOption(field("queueState"), queue.state) },
        { id: field("headSha").id, value: queue.headSha },
        { id: field("checks").id, value: requireOption(field("checks"), CHECKS_OPTIONS[queue.checks]) },
        { id: field("queuedAt").id, value: queue.queuedAt ?? "" },
      );
    }
    return values;
  }

  private fieldsCache?: RestField[];

  private async getFields(): Promise<RestField[]> {
    if (this.fieldsCache) return this.fieldsCache;
    const path = `/users/${encodeURIComponent(this.config.owner)}/projectsV2/${this.config.projectNumber}/fields?per_page=100`;
    const fields = await this.request<RestField[]>(path);
    if (!Array.isArray(fields)) throw new Error("GitHub Project fields response is invalid");
    this.fieldsCache = fields;
    return fields;
  }

  private async getMetadata(): Promise<Metadata> {
    if (this.metadata) return this.metadata;
    const fields = await this.getFields();
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
