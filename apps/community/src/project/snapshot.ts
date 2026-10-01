import {
  MAX_EVALUATIONS_PER_MISSION_PER_PARTICIPANT,
  resolveEligible,
  scoreTagValue,
} from "@metro/evaluation";
import { attemptNumberFromComment } from "../github/attempt-sequence.js";
import type { PersistAttemptResult } from "../github/issue-store.js";
import { parseIssueIdentity } from "../github/markers.js";
import type { ProjectPromptSnapshot } from "./types.js";

type AttemptSnapshot = {
  attempt: number;
  score: number;
  eligible: boolean;
};

const attemptMarkerPrefix = "<!-- metro-attempt:";
const tagsPattern =
  /\n### Tags\r?\n\r?\nattempt:(\d+) score:(\d+) routing:(auto|caution|defer) eligible:(yes|no)\r?\n?$/;

function parseAttempt(
  body: string,
  missionId: string,
  participantId: string,
): AttemptSnapshot | null | undefined {
  const firstLine = body.split(/\r?\n/, 1)[0] ?? "";
  if (!firstLine.startsWith(attemptMarkerPrefix)) return undefined;

  const attempt = attemptNumberFromComment(body, missionId, participantId);
  const tags = body.match(tagsPattern);
  if (!attempt || !tags) return null;

  const taggedAttempt = Number(tags[1]);
  const score = Number(tags[2]);
  if (
    taggedAttempt !== attempt ||
    attempt > MAX_EVALUATIONS_PER_MISSION_PER_PARTICIPANT ||
    score < 0 ||
    score > 100
  ) {
    return null;
  }
  return { attempt, score, eligible: tags[4] === "yes" };
}

export function latestProjectSnapshot(input: {
  issueNumber: number;
  issueUrl: string;
  issueBody: string;
  comments: string[];
}): ProjectPromptSnapshot | null {
  const identity = parseIssueIdentity(input.issueBody);
  if (!identity) return null;

  const attempts: AttemptSnapshot[] = [];
  for (const body of input.comments) {
    const attempt = parseAttempt(body, identity.missionId, identity.participantId);
    if (attempt === null) return null;
    if (attempt) attempts.push(attempt);
  }
  attempts.sort((a, b) => a.attempt - b.attempt);
  if (
    attempts.length === 0 ||
    attempts.some((attempt, index) => attempt.attempt !== index + 1)
  ) {
    return null;
  }

  const latest = attempts.at(-1)!;
  return {
    issueNumber: input.issueNumber,
    issueUrl: input.issueUrl,
    missionId: identity.missionId,
    participantId: identity.participantId,
    attempts: latest.attempt,
    latestScore: latest.score,
    eligible: latest.eligible,
    voting: latest.eligible ? "Candidate" : "Not eligible",
  };
}

export function snapshotFromPersistedAttempt(
  attempt: PersistAttemptResult,
): ProjectPromptSnapshot {
  const eligible = resolveEligible(attempt.score);
  return {
    issueNumber: attempt.issueNumber,
    issueUrl: attempt.githubIssueUrl,
    missionId: attempt.state.missionId,
    participantId: attempt.state.participantId,
    attempts: attempt.state.attempt,
    latestScore: scoreTagValue(attempt.score.total),
    eligible,
    voting: eligible ? "Candidate" : "Not eligible",
  };
}
