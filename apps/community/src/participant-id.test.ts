import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertParticipantId } from "./participant-id.js";

describe("assertParticipantId", () => {
  it("accepts p-NNN and collision suffixes b..z", () => {
    for (const id of ["p-007", "p-123b", "p-123z"]) assert.equal(assertParticipantId(id), id);
  });
  it("rejects other shapes", () => {
    for (const id of ["p-12", "p-1234", "p-123a", "p-123B", "p-123bb", "whatsapp-user", "p-alpha", "573001234567", " p-123"]) {
      assert.throws(() => assertParticipantId(id), /expected p-NNN/);
    }
  });
});
