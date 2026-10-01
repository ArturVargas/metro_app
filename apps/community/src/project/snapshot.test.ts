import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PersistAttemptResult } from "../github/issue-store.js";
import { parseIssueIdentity } from "../github/markers.js";
import {
  latestProjectSnapshot,
  snapshotFromPersistedAttempt,
} from "./snapshot.js";

const issueBody = "<!-- metro-issue: mission:mission-m1 participant:p-alpha -->";

function comment(attempt: number, score: number, eligible: "yes" | "no"): string {
  return [
    `<!-- metro-attempt: mission:mission-m1 participant:p-alpha attempt:${attempt} -->`,
    "",
    "### Tags",
    "",
    `attempt:${attempt} score:${score} routing:auto eligible:${eligible}`,
    "",
  ].join("\n");
}

function snapshot(comments: string[]) {
  return latestProjectSnapshot({
    issueNumber: 21,
    issueUrl: "https://github.com/ArturVargas/metro_app/issues/21",
    issueBody,
    comments,
  });
}

describe("parseIssueIdentity", () => {
  it("parses the stable participant marker", () => {
    assert.deepEqual(parseIssueIdentity(issueBody), {
      missionId: "mission-m1",
      participantId: "p-alpha",
    });
  });

  it("rejects mission and malformed markers", () => {
    assert.equal(parseIssueIdentity("<!-- metro-mission: mission:mission-m1 -->"), null);
    assert.equal(
      parseIssueIdentity("<!-- metro-issue: mission:mission-m1 participant: -->"),
      null,
    );
  });
});

describe("latestProjectSnapshot", () => {
  it("uses the newest attempt even when eligibility drops", () => {
    assert.deepEqual(snapshot([comment(1, 80, "yes"), comment(2, 62, "no")]), {
      issueNumber: 21,
      issueUrl: "https://github.com/ArturVargas/metro_app/issues/21",
      missionId: "mission-m1",
      participantId: "p-alpha",
      attempts: 2,
      latestScore: 62,
      eligible: false,
      voting: "Not eligible",
    });
  });

  it("rejects duplicate attempts, gaps, invalid scores, and missing tags", () => {
    assert.equal(snapshot([comment(1, 80, "yes"), comment(1, 90, "yes")]), null);
    assert.equal(snapshot([comment(1, 80, "yes"), comment(3, 90, "yes")]), null);
    assert.equal(snapshot([comment(1, 101, "yes")]), null);
    assert.equal(
      snapshot([
        "<!-- metro-attempt: mission:mission-m1 participant:p-alpha attempt:1 -->",
      ]),
      null,
    );
  });

  it("ignores ordinary comments without an attempt marker", () => {
    assert.deepEqual(snapshot(["human note", comment(1, 70, "yes")])?.attempts, 1);
  });
});

describe("snapshotFromPersistedAttempt", () => {
  it("derives the Project fields from the confirmed attempt", () => {
    const attempt = {
      issueNumber: 21,
      githubIssueUrl: "https://github.com/ArturVargas/metro_app/issues/21",
      state: { missionId: "mission-m1", participantId: "p-alpha", attempt: 2 },
      score: { total: 74.6, eligible: true },
    } as PersistAttemptResult;

    assert.deepEqual(snapshotFromPersistedAttempt(attempt), {
      issueNumber: 21,
      issueUrl: "https://github.com/ArturVargas/metro_app/issues/21",
      missionId: "mission-m1",
      participantId: "p-alpha",
      attempts: 2,
      latestScore: 75,
      eligible: true,
      voting: "Candidate",
    });
  });
});
