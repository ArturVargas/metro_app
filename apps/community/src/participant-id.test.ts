import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertParticipantId } from "./participant-id.js";

describe("assertParticipantId", () => {
  it("accepts p-NNN", () => {
    assert.equal(assertParticipantId("p-007"), "p-007");
  });
  it("rejects other shapes", () => {
    for (const id of ["p-12", "p-1234", "whatsapp-user", "p-alpha", "573001234567", " p-123"]) {
      assert.throws(() => assertParticipantId(id), /expected p-NNN/);
    }
  });
});
