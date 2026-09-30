/**
 * Stable markers for find-or-create of one GitHub Issue per (mission × participant).
 */

export function issueBodyMarker(missionId: string, participantId: string): string {
  return `<!-- metro-issue: mission:${missionId} participant:${participantId} -->`;
}

/** Plain-text keys also embedded in the issue body for search. */
export function missionKey(missionId: string): string {
  return `mission:${missionId}`;
}

export function participantKey(participantId: string): string {
  return `participant:${participantId}`;
}

export function buildIssueTitle(missionId: string, participantId: string): string {
  return `Mission ${missionId} · participant ${participantId}`;
}

export function buildIssueBody(missionId: string, participantId: string): string {
  return [
    issueBodyMarker(missionId, participantId),
    "",
    "Evaluation record for one participant on one mission.",
    "Each evaluation attempt is a comment on this issue.",
    "",
    `- ${missionKey(missionId)}`,
    `- ${participantKey(participantId)}`,
    "",
    "Do not store phone numbers, tokens, or secrets on this issue.",
    "",
  ].join("\n");
}

/** Labels reflecting the latest attempt (states + mission; score stays on comment tags). */
export function latestAttemptLabels(input: {
  missionId: string;
  routing: string;
  eligible: "eligible:yes" | "eligible:no";
  attempt: number;
}): string[] {
  return [
    missionKey(input.missionId),
    `routing:${input.routing}`,
    input.eligible,
    `attempt:${input.attempt}`,
  ];
}
