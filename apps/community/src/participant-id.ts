// Participant ids are `p-` + last 3 phone digits, plus b..z on collisions.
// Never store the phone itself; ~/bin/metro-participant-id resolves ids.
export const PARTICIPANT_ID_PATTERN = /^p-\d{3}[b-z]?$/;

export function assertParticipantId(id: string): string {
  if (!PARTICIPANT_ID_PATTERN.test(id)) {
    throw new Error("Invalid participant id; expected p-NNN or p-NNN[b-z]");
  }
  return id;
}
