import type { ChecksState, PrQueueState } from "../pr/queue.js";

/** Latest PR evaluation recorded on the Issue (M3+). */
export type ProjectPrSnapshot = {
  prUrl: string;
  evaluatedSha: string;
  baseSha: string;
  origin: "llm" | "manual" | "combined";
  evaluatedAt: string;
  qualifies: boolean;
  labels: string[];
};

/** Live PR state read from GitHub when reconciling. */
export type ProjectQueueSnapshot = {
  state: PrQueueState;
  headSha: string;
  checks: ChecksState;
  queuedAt: string | null;
};

export type ProjectPromptSnapshot = {
  issueNumber: number;
  issueUrl: string;
  missionId: string;
  participantId: string;
  attempts: number;
  latestScore: number;
  eligible: boolean;
  voting: "Candidate" | "Not eligible";
  pr?: ProjectPrSnapshot;
  queue?: ProjectQueueSnapshot;
};

export type ProjectSyncResult = { itemId: string; created: boolean };

export interface ProjectStore {
  syncPrompt(snapshot: ProjectPromptSnapshot): Promise<ProjectSyncResult>;
}
