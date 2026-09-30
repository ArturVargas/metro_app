#!/usr/bin/env node
/**
 * CLI: read AttemptResult JSON from stdin (or --fixture path) and either
 * dry-run (print markdown) or persist via GitHubIssueStore.
 *
 *   pnpm --filter @metro/community github:record-attempt < fixtures/attempt.json
 *   DRY_RUN=1 pnpm --filter @metro/community github:record-attempt -- --fixture fixtures/attempt.json
 *
 * Env: GITHUB_TOKEN or GH_TOKEN (required unless DRY_RUN=1).
 * Optional: GITHUB_OWNER (default ArturVargas), GITHUB_REPO (default metro_app).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  formatAttemptCommentMarkdown,
  type AttemptResult,
} from "@metro/evaluation";
import {
  readGitHubEnvConfig,
  requireGitHubStoreConfig,
} from "../github/config.js";
import { GitHubIssueStore } from "../github/issue-store.js";

function parseArgs(argv: string[]): { fixture?: string; dryRun: boolean } {
  let fixture: string | undefined;
  let dryRun = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") dryRun = true;
    if (a === "--fixture" && argv[i + 1]) {
      fixture = argv[++i];
    }
  }
  return { fixture, dryRun };
}

async function readInput(fixture?: string): Promise<string> {
  if (fixture) {
    return readFileSync(resolve(process.cwd(), fixture), "utf8");
  }
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const text = Buffer.concat(chunks).toString("utf8").trim();
  if (!text) {
    throw new Error(
      "No JSON on stdin. Pipe a fixture or pass --fixture path/to.json",
    );
  }
  return text;
}

function assertAttempt(raw: unknown): AttemptResult {
  if (!raw || typeof raw !== "object") {
    throw new Error("Attempt JSON must be an object");
  }
  const obj = raw as Record<string, unknown>;
  if (!obj.state || !obj.score || typeof obj.feedback !== "string") {
    throw new Error(
      "Attempt JSON requires { state, score, feedback } (AttemptResult shape)",
    );
  }
  return raw as AttemptResult;
}

async function main(): Promise<void> {
  const { fixture, dryRun } = parseArgs(process.argv.slice(2));
  const jsonText = await readInput(fixture);
  const attempt = assertAttempt(JSON.parse(jsonText) as unknown);

  if (dryRun) {
    const env = readGitHubEnvConfig();
    const markdown = formatAttemptCommentMarkdown(attempt);
    process.stdout.write(
      JSON.stringify(
        {
          dryRun: true,
          target: `${env.owner}/${env.repo}`,
          hasToken: env.hasToken,
          markdown,
        },
        null,
        2,
      ) + "\n",
    );
    return;
  }

  const config = requireGitHubStoreConfig();
  const store = new GitHubIssueStore(config);
  const persisted = await store.addAttemptComment(attempt);
  process.stdout.write(
    JSON.stringify(
      {
        dryRun: false,
        issueNumber: persisted.issueNumber,
        githubIssueUrl: persisted.githubIssueUrl,
        githubCommentUrl: persisted.githubCommentUrl,
      },
      null,
      2,
    ) + "\n",
  );
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exitCode = 1;
});
