import { MAX_EVALUATIONS_PER_MISSION_PER_PARTICIPANT } from "@metro/evaluation";

export const PR_QUEUE_STATES = [
  "draft",
  "evaluating",
  "needs-revision",
  "technical-queue",
  "approved",
  "selected-a",
  "selected-b",
  "selected-c",
  "not-selected",
] as const;

export type PrQueueState = (typeof PR_QUEUE_STATES)[number];
export type ChecksState = "pending" | "success" | "failure";
export type Slot = "a" | "b" | "c";

/** Issue labels the reviewer sets by hand; a new evaluation clears `review:*`. */
export const REVIEW_APPROVED_LABEL = "review:approved";
export const REVIEW_CHANGES_LABEL = "review:changes-requested";
export const SLOT_LABEL_PREFIX = "slot:";

export type QueueInput = {
  prOpen: boolean;
  headSha: string;
  checks: ChecksState;
  attemptsUsed: number;
  latest?: { sha: string; qualifies: boolean };
  labels: string[];
};

export function slotFromLabels(labels: string[]): Slot | "none" | null {
  const slot = labels.find((label) => label.startsWith(SLOT_LABEL_PREFIX))?.slice(SLOT_LABEL_PREFIX.length);
  return slot === "a" || slot === "b" || slot === "c" || slot === "none" ? slot : null;
}

// ADR-0011: only the latest evaluation counts and only for the SHA it scored.
export function deriveQueueState(input: QueueInput): PrQueueState {
  const current = input.latest && input.latest.sha === input.headSha ? input.latest : undefined;
  const exhausted = input.attemptsUsed >= MAX_EVALUATIONS_PER_MISSION_PER_PARTICIPANT;
  if (!input.prOpen) return "not-selected";
  if (!current) return exhausted ? "not-selected" : "draft";
  if (!current.qualifies || input.checks === "failure" || input.labels.includes(REVIEW_CHANGES_LABEL)) {
    return exhausted ? "not-selected" : "needs-revision";
  }
  if (input.checks !== "success") return "evaluating";

  const slot = slotFromLabels(input.labels);
  if (slot && slot !== "none") return `selected-${slot}`;
  if (slot === "none") return "not-selected";
  if (input.labels.includes(REVIEW_APPROVED_LABEL)) return "approved";
  return "technical-queue";
}

export type QueueEntry = { prUrl: string; state: PrQueueState; queuedAt: string | null };

/** Technical review order: earliest time the same SHA passed the score and the checks. */
export function technicalQueue(entries: QueueEntry[]): QueueEntry[] {
  return entries
    .filter((entry) => entry.state === "technical-queue" && entry.queuedAt)
    .sort((a, b) => a.queuedAt!.localeCompare(b.queuedAt!) || a.prUrl.localeCompare(b.prUrl));
}

/** Next free A/B/C slot for an approved PR, or null when all three are taken. */
export function nextSlot(entries: QueueEntry[]): Slot | null {
  const taken = new Set(entries.map((entry) => entry.state));
  for (const slot of ["a", "b", "c"] as const) {
    if (!taken.has(`selected-${slot}`)) return slot;
  }
  return null;
}

export function queuedAt(evaluatedAt: string, checksCompletedAt: string | null): string | null {
  if (!checksCompletedAt) return null;
  return evaluatedAt > checksCompletedAt ? evaluatedAt : checksCompletedAt;
}
