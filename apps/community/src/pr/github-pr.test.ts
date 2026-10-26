import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Octokit } from "@octokit/rest";
import { M3_MAX_DIFF_CHARS } from "@metro/evaluation";
import { MAX_WIDENED_FILES } from "./diff-context.js";
import { GitHubPullRequests } from "./github-pr.js";

const BASE = "b".repeat(40);
const HEAD = "c".repeat(40);
const baseText = `${Array.from({ length: 60 }, (_, i) => `line ${i + 1}`).join("\n")}\n`;

function block(path: string, changed = "line 30 changed"): string {
  return [
    `diff --git a/${path} b/${path}`,
    "--- a/" + path,
    "+++ b/" + path,
    "@@ -29,3 +29,3 @@",
    " line 29",
    "-line 30",
    `+${changed}`,
    " line 31",
    "",
  ].join("\n");
}

const newFile = ["diff --git a/src/new.ts b/src/new.ts", "new file mode 100644", "--- /dev/null", "+++ b/src/new.ts", "@@ -0,0 +1 @@", "+x", ""].join("\n");

type ContentResult = string | { status: number };

/** Fake Octokit: `content(path, call)` returns the base text or an error status for each call. */
function fakeOctokit(diff: string, content: (path: string, call: number) => ContentResult) {
  const calls = new Map<string, number>();
  const octokit = {
    rest: {
      repos: {
        async compareCommitsWithBasehead(params: { mediaType?: unknown }) {
          return params.mediaType ? { data: diff } : { data: { merge_base_commit: { sha: BASE } } };
        },
        async getContent({ path }: { path: string }) {
          const call = (calls.get(path) ?? 0) + 1;
          calls.set(path, call);
          const result = content(path, call);
          if (typeof result === "string") return { data: result };
          throw Object.assign(new Error(`HTTP ${result.status}`), { status: result.status });
        },
      },
    },
  };
  return { octokit: octokit as unknown as Octokit, calls };
}

function reader(octokit: Octokit, logs: string[] = [], sleeps: number[] = []) {
  return new GitHubPullRequests({ owner: "o", repo: "r", token: "test" }, octokit, {
    retryDelaysMs: [10, 20],
    sleep: async (ms) => {
      sleeps.push(ms);
    },
    log: (line) => logs.push(line),
  });
}

describe("GitHubPullRequests.diffFromBase", () => {
  it("widens every modified file and reports it; new files need no base", async () => {
    const { octokit, calls } = fakeOctokit(block("src/a.ts") + newFile, () => baseText);
    const result = await reader(octokit).diffFromBase(BASE, HEAD);
    assert.deepEqual(result.context, { status: "widened", contextLines: 25, files: 1 });
    assert.match(result.diff, /^ line 5$/m);
    assert.deepEqual([...calls.keys()], ["src/a.ts"]);
  });

  it("retries transient failures before widening", async () => {
    const sleeps: number[] = [];
    const { octokit, calls } = fakeOctokit(block("src/a.ts"), (_, call) => (call < 3 ? { status: call === 1 ? 429 : 502 } : baseText));
    const result = await reader(octokit, [], sleeps).diffFromBase(BASE, HEAD);
    assert.equal(result.context.status, "widened");
    assert.equal(calls.get("src/a.ts"), 3);
    assert.deepEqual(sleeps, [10, 20]);
  });

  it("reports incomplete context instead of silently using the 3-line diff", async () => {
    const logs: string[] = [];
    const { octokit, calls } = fakeOctokit(block("src/a.ts") + block("src/b.ts"), (path) =>
      path === "src/b.ts" ? { status: 503 } : baseText,
    );
    const result = await reader(octokit, logs).diffFromBase(BASE, HEAD);
    assert.deepEqual(result.context, { status: "incomplete", missing: ["src/b.ts"] });
    assert.equal(calls.get("src/b.ts"), 3);
    assert.match(logs.join("\n"), /incomplete/);
  });

  it("does not retry a non-transient failure", async () => {
    const { octokit, calls } = fakeOctokit(block("src/a.ts"), () => ({ status: 404 }));
    const result = await reader(octokit).diffFromBase(BASE, HEAD);
    assert.equal(result.context.status, "incomplete");
    assert.equal(calls.get("src/a.ts"), 1);
  });

  it("falls back explicitly, and logs it, when the widened diff exceeds the size limit", async () => {
    const logs: string[] = [];
    const big = `${Array.from({ length: 60 }, (_, i) => `line ${i + 1}`.padEnd(3_000, "x")).join("\n")}\n`;
    const diff = [
      "diff --git a/src/a.ts b/src/a.ts",
      "--- a/src/a.ts",
      "+++ b/src/a.ts",
      "@@ -30,1 +30,1 @@",
      `-${"line 30".padEnd(3_000, "x")}`,
      "+changed",
      "",
    ].join("\n");
    const { octokit } = fakeOctokit(diff, () => big);
    const result = await reader(octokit, logs).diffFromBase(BASE, HEAD);
    assert.ok(diff.length < M3_MAX_DIFF_CHARS);
    assert.deepEqual(result.context, { status: "fallback", contextLines: 3, files: 1, reason: "diff-too-large" });
    assert.equal(result.diff, diff);
    assert.match(logs.join("\n"), /fallback: diff-too-large/);
  });

  it("falls back explicitly above the file limit without fetching base files", async () => {
    const paths = Array.from({ length: MAX_WIDENED_FILES + 1 }, (_, i) => `src/f${i}.ts`);
    const diff = paths.map((path) => block(path)).join("");
    const { octokit, calls } = fakeOctokit(diff, () => baseText);
    const result = await reader(octokit).diffFromBase(BASE, HEAD);
    assert.deepEqual(result.context, {
      status: "fallback",
      contextLines: 3,
      files: MAX_WIDENED_FILES + 1,
      reason: "too-many-files",
    });
    assert.equal(result.diff, diff);
    assert.equal(calls.size, 0);
  });
});
