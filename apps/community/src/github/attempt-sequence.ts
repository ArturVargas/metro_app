import { MAX_EVALUATIONS_PER_MISSION_PER_PARTICIPANT } from "@metro/evaluation";

function attemptNumber(
  body: string,
  missionId: string,
  participantId: string,
): number | null {
  const prefix = `<!-- metro-attempt: mission:${missionId} participant:${participantId} attempt:`;
  const start = body.indexOf(prefix);
  if (start < 0) return null;
  const value = body.slice(start + prefix.length).split(" -->", 1)[0];
  if (!value || !/^\d+$/.test(value)) return null;
  return Number(value);
}

export function assertNextAttempt(
  commentBodies: string[],
  missionId: string,
  participantId: string,
  requestedAttempt: number,
): void {
  const attempts = commentBodies
    .map((body) => attemptNumber(body, missionId, participantId))
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
