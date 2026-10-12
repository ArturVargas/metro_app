// Participant ids are `p-` + last 3 phone digits; never store the phone itself.
export const PARTICIPANT_ID_PATTERN = /^p-\d{3}$/;

export function assertParticipantId(id: string): string {
  if (!PARTICIPANT_ID_PATTERN.test(id)) {
    throw new Error("Invalid participant id; expected p-NNN (last 3 phone digits)");
  }
  return id;
}
