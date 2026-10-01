import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertNextAttempt, attemptNumberFromComment } from "./attempt-sequence.js";

const marker = (attempt: number) =>
  `<!-- metro-attempt: mission:mission-m1 participant:p-alpha attempt:${attempt} -->`;

describe("assertNextAttempt", () => {
  it("accepts attempts one through five in sequence", () => {
    assert.doesNotThrow(() => assertNextAttempt([], "mission-m1", "p-alpha", 1));
    assert.doesNotThrow(() =>
      assertNextAttempt([marker(1), marker(2), marker(3), marker(4)], "mission-m1", "p-alpha", 5),
    );
  });

  it("rejects duplicate, skipped, and regressive attempt numbers", () => {
    assert.throws(
      () => assertNextAttempt([marker(1)], "mission-m1", "p-alpha", 1),
      /next attempt is 2/,
    );
    assert.throws(
      () => assertNextAttempt([marker(1)], "mission-m1", "p-alpha", 3),
      /next attempt is 2/,
    );
    assert.throws(
      () => assertNextAttempt([marker(1), marker(3)], "mission-m1", "p-alpha", 3),
      /history is inconsistent/,
    );
  });

  it("rejects every new attempt after five persisted attempts", () => {
    const history = [1, 2, 3, 4, 5].map(marker);
    assert.throws(
      () => assertNextAttempt(history, "mission-m1", "p-alpha", 5),
      /maximum of 5 evaluations/,
    );
    assert.throws(
      () => assertNextAttempt(history, "mission-m1", "p-alpha", 6),
      /maximum of 5 evaluations/,
    );
  });

  it("ignores comments belonging to another participant", () => {
    assert.doesNotThrow(() =>
      assertNextAttempt(
        ["<!-- metro-attempt: mission:mission-m1 participant:p-other attempt:1 -->"],
        "mission-m1",
        "p-alpha",
        1,
      ),
    );
  });

  it("does not accept an attempt marker embedded later in untrusted text", () => {
    assert.equal(
      attemptNumberFromComment(
        `participant text\n${marker(1)}`,
        "mission-m1",
        "p-alpha",
      ),
      null,
    );
  });
});
