import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveQueueState, nextSlot, technicalQueue, type QueueInput } from "./queue.js";

const sha = "a".repeat(40);
const base: QueueInput = {
  prOpen: true,
  headSha: sha,
  checks: "success",
  attemptsUsed: 1,
  latest: { sha, qualifies: true },
  labels: [],
};

describe("deriveQueueState", () => {
  it("queues a qualified SHA with green checks", () => {
    assert.equal(deriveQueueState(base), "technical-queue");
  });

  it("drops eligibility when a new commit arrives", () => {
    assert.equal(deriveQueueState({ ...base, headSha: "b".repeat(40) }), "draft");
  });

  it("needs revision on a low score, red checks or a human finding", () => {
    assert.equal(deriveQueueState({ ...base, latest: { sha, qualifies: false } }), "needs-revision");
    assert.equal(deriveQueueState({ ...base, checks: "failure" }), "needs-revision");
    assert.equal(deriveQueueState({ ...base, labels: ["review:changes-requested"] }), "needs-revision");
  });

  it("waits while checks are pending", () => {
    assert.equal(deriveQueueState({ ...base, checks: "pending" }), "evaluating");
  });

  it("is not selected once the fifth evaluation fails", () => {
    assert.equal(deriveQueueState({ ...base, attemptsUsed: 5, latest: { sha, qualifies: false } }), "not-selected");
    assert.equal(deriveQueueState({ ...base, attemptsUsed: 5, headSha: "c".repeat(40) }), "not-selected");
  });

  it("follows reviewer labels for approval and slots", () => {
    assert.equal(deriveQueueState({ ...base, labels: ["review:approved"] }), "approved");
    assert.equal(deriveQueueState({ ...base, labels: ["review:approved", "slot:b"] }), "selected-b");
    assert.equal(deriveQueueState({ ...base, labels: ["slot:none"] }), "not-selected");
  });

  it("does not let review or slot labels bypass SHA, checks, or PR guards", () => {
    assert.equal(deriveQueueState({ ...base, checks: "failure", labels: ["review:approved"] }), "needs-revision");
    assert.equal(
      deriveQueueState({ ...base, headSha: "b".repeat(40), labels: ["slot:a"] }),
      "draft",
    );
    assert.equal(deriveQueueState({ ...base, prOpen: false, labels: ["slot:a"] }), "not-selected");
  });
});

describe("queue order", () => {
  it("orders the technical queue by qualification time and fills A, B, C in order", () => {
    const entries = [
      { prUrl: "u/2", state: "technical-queue" as const, queuedAt: "2026-11-03T10:00:00Z" },
      { prUrl: "u/1", state: "technical-queue" as const, queuedAt: "2026-11-03T09:00:00Z" },
      { prUrl: "u/3", state: "draft" as const, queuedAt: null },
    ];
    assert.deepEqual(technicalQueue(entries).map((entry) => entry.prUrl), ["u/1", "u/2"]);
    assert.equal(nextSlot([]), "a");
    assert.equal(nextSlot([{ prUrl: "x", state: "selected-a", queuedAt: null }]), "b");
    assert.equal(
      nextSlot((["a", "b", "c"] as const).map((slot) => ({ prUrl: slot, state: `selected-${slot}` as const, queuedAt: null }))),
      null,
    );
  });
});
