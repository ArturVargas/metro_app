import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { reconcileProject } from "./reconcile.js";
import type { ProjectPromptSnapshot, ProjectStore } from "./types.js";

function snapshot(issueNumber: number): ProjectPromptSnapshot {
  return {
    issueNumber,
    issueUrl: `https://github.com/example/issues/${issueNumber}`,
    missionId: "mission-m1",
    participantId: `p-${issueNumber}`,
    attempts: 1,
    latestScore: 78,
    eligible: true,
    voting: "Candidate",
  };
}

describe("reconcileProject", () => {
  it("attempts every snapshot and returns safe per-Issue failures", async () => {
    const calls: number[] = [];
    const store: ProjectStore = {
      async syncPrompt(input) {
        calls.push(input.issueNumber);
        if (input.issueNumber === 21) {
          throw new Error("token-secret SECRET PROMPT");
        }
        return { itemId: String(input.issueNumber), created: false };
      },
    };

    const result = await reconcileProject([snapshot(21), snapshot(22)], store);

    assert.deepEqual(calls, [21, 22]);
    assert.deepEqual(result, {
      synced: 1,
      failed: [{ issueNumber: 21, error: "Project sync failed" }],
    });
    assert.doesNotMatch(JSON.stringify(result), /token-secret|SECRET PROMPT/);
  });
});
