import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GitHubProjectStore } from "./github-project-store.js";
import type { ProjectPromptSnapshot } from "./types.js";

const fields = [
  { id: 1, name: "Item type", data_type: "single_select", options: [{ id: "prompt", name: { raw: "Prompt" } }] },
  { id: 2, name: "Mission", data_type: "text" },
  { id: 3, name: "Participant", data_type: "text" },
  { id: 4, name: "Attempts", data_type: "number" },
  { id: 5, name: "Latest score", data_type: "number" },
  { id: 6, name: "Eligible", data_type: "single_select", options: [
    { id: "eligible-yes", name: { raw: "Yes" } },
    { id: "eligible-no", name: { raw: "No" } },
  ] },
  { id: 7, name: "Voting", data_type: "single_select", options: [
    { id: "candidate", name: { raw: "Candidate" } },
    { id: "not-eligible", name: { raw: "Not eligible" } },
  ] },
];

const snapshot: ProjectPromptSnapshot = {
  issueNumber: 21,
  issueUrl: "https://github.com/ArturVargas/metro_app/issues/21",
  missionId: "mission-m1",
  participantId: "p-alpha",
  attempts: 2,
  latestScore: 62,
  eligible: false,
  voting: "Not eligible",
};

type FakeOptions = { existing?: boolean; failPatchOnce?: boolean };

function fakeGitHub(options: FakeOptions = {}) {
  let item = options.existing
    ? { id: 900, content: { number: 21, repository: { full_name: "ArturVargas/metro_app" } } }
    : null;
  let shouldFailPatch = Boolean(options.failPatchOnce);
  const calls: Array<{ method: string; url: string; body?: unknown }> = [];

  const fetchImpl: typeof fetch = async (input, init = {}) => {
    const url = String(input);
    const method = init.method ?? "GET";
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, url, body });

    if (url.endsWith("/fields?per_page=100")) return Response.json(fields);
    if (url.endsWith("/items?per_page=100")) return Response.json(item ? [item] : []);
    if (url.endsWith("/repos/ArturVargas/metro_app/issues/21")) {
      return Response.json({ id: 2100, number: 21 });
    }
    if (method === "POST" && url.endsWith("/items")) {
      item = { id: 900, content: { number: 21, repository: { full_name: "ArturVargas/metro_app" } } };
      return Response.json({ value: item }, { status: 201 });
    }
    if (method === "PATCH" && url.endsWith("/items/900")) {
      if (shouldFailPatch) {
        shouldFailPatch = false;
        return Response.json({ message: "temporary" }, { status: 500 });
      }
      return Response.json({ value: item });
    }
    return Response.json({ message: "unexpected request" }, { status: 404 });
  };

  return { calls, fetchImpl };
}

const config = {
  token: "project-token",
  owner: "ArturVargas",
  projectNumber: 1,
  repoOwner: "ArturVargas",
  repo: "metro_app",
};

describe("GitHubProjectStore", () => {
  it("updates an existing item with the complete prompt snapshot", async () => {
    const fake = fakeGitHub({ existing: true });
    const result = await new GitHubProjectStore(config, fake.fetchImpl).syncPrompt(snapshot);

    assert.deepEqual(result, { itemId: "900", created: false });
    assert.equal(fake.calls.some((call) => call.method === "POST"), false);
    const patch = fake.calls.find((call) => call.method === "PATCH");
    assert.deepEqual(patch?.body, {
      fields: [
        { id: 1, value: "prompt" },
        { id: 2, value: "mission-m1" },
        { id: 3, value: "p-alpha" },
        { id: 4, value: 2 },
        { id: 5, value: 62 },
        { id: 6, value: "eligible-no" },
        { id: 7, value: "not-eligible" },
      ],
    });
  });

  it("adds a missing Issue once and reuses the item on the next sync", async () => {
    const fake = fakeGitHub();
    const store = new GitHubProjectStore(config, fake.fetchImpl);

    assert.deepEqual(await store.syncPrompt(snapshot), { itemId: "900", created: true });
    assert.deepEqual(await store.syncPrompt(snapshot), { itemId: "900", created: false });
    assert.equal(fake.calls.filter((call) => call.method === "POST").length, 1);
    assert.deepEqual(
      fake.calls.find((call) => call.method === "POST")?.body,
      { type: "Issue", id: 2100 },
    );
  });

  it("converges on retry after the item was added but its update failed", async () => {
    const fake = fakeGitHub({ failPatchOnce: true });
    const store = new GitHubProjectStore(config, fake.fetchImpl);

    await assert.rejects(() => store.syncPrompt(snapshot), /PATCH.*500/);
    assert.deepEqual(await store.syncPrompt(snapshot), { itemId: "900", created: false });
    assert.equal(fake.calls.filter((call) => call.method === "POST").length, 1);
    assert.equal(fake.calls.filter((call) => call.method === "PATCH").length, 2);
  });
});
