import { MAX_EVALUATIONS_PER_MISSION_PER_PARTICIPANT } from "@metro/evaluation";

export function attemptNumberFromComment(
  body: string,
  missionId: string,
  participantId: string,
): number | null {
  const firstLine = body.split(/\r?\n/, 1)[0] ?? "";
  const match = firstLine.match(
    /^<!-- metro-attempt: mission:([A-Za-z0-9][A-Za-z0-9._-]*) participant:([A-Za-z0-9][A-Za-z0-9._-]*) attempt:(\d+) -->$/,
  );
  if (!match || match[1] !== missionId || match[2] !== participantId) return null;
  return Number(match[3]);
}

export function assertNextAttempt(
  commentBodies: string[],
  missionId: string,
  participantId: string,
  requestedAttempt: number,
): void {
  const attempts = commentBodies
    .map((body) => attemptNumberFromComment(body, missionId, participantId))
    .filter((attempt): attempt is number => attempt !== null)
    .sort((a, b) => a - b);

  if (attempts.some((attempt, index) => attempt !== index + 1)) {
    throw new Error(`Attempt history is inconsistent for ${missionId}/${participantId}`);
  }
  if (attempts.length >= MAX_EVALUATIONS_PER_MISSION_PER_PARTICIPANT) {
    throw new Error(
      `Participant reached the maximum of ${MAX_EVALUATIONS_PER_MISSION_PER_PARTICIPANT} evaluations for ${missionId}`,
    );
  }
  const expected = attempts.length + 1;
  if (requestedAttempt !== expected) {
    throw new Error(
      `Invalid attempt ${requestedAttempt} for ${missionId}/${participantId}; next attempt is ${expected}`,
    );
  }
}
