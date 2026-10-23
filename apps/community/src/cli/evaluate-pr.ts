#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MockJevClient } from "@metro/evaluation";
import { evaluate } from "../evaluate.js";
import { requireGitHubStoreConfig } from "../github/config.js";
import { GitHubIssueStore } from "../github/issue-store.js";
import { assertParticipantId } from "../participant-id.js";
import { GitHubPullRequests } from "../pr/github-pr.js";
import { preparePrSubmission } from "../pr/prepare.js";

// Exit codes: 0 evaluated (JSON), 2 refused before consuming an attempt (Spanish lines), 1 failure.
type Args = { pr?: number; participant?: string; mission: string; brief?: string; record: boolean; mock: boolean };

function parseArgs(argv: string[]): Args {
  const out: Args = { mission: "mission-m3", record: false, mock: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = () => {
      const next = argv[++i];
      if (!next) throw new Error(`Missing value for ${arg}`);
      return next;
    };
    if (arg === "--") continue;
    else if (arg === "--record") out.record = true;
    else if (arg === "--mock") out.mock = true;
    else if (arg === "--pr") out.pr = Number(value());
    else if (arg === "--participant") out.participant = value();
    else if (arg === "--mission") out.mission = value();
    else if (arg === "--brief") out.brief = value();
    else throw new Error(`Unknown argument ${arg}`);
  }
  if (!out.pr || !Number.isInteger(out.pr) || out.pr < 1) throw new Error("--pr must be a PR number");
  if (!out.participant) throw new Error("--participant is required");
  assertParticipantId(out.participant);
  if (!out.brief) throw new Error("--brief is required");
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const devSha = process.env.M3_DEV_SHA?.trim() ?? "";
  if (!/^[0-9a-f]{40}$/.test(devSha)) throw new Error("M3_DEV_SHA must be the frozen 40-char dev SHA");
  const config = requireGitHubStoreConfig();

  const prepared = await preparePrSubmission(new GitHubPullRequests(config), {
    prNumber: args.pr!,
    participantId: args.participant!,
    missionId: args.mission,
    devSha,
    repoFullName: `${config.owner}/${config.repo}`,
  });
  if (!prepared.ok) {
    process.stdout.write(`${prepared.reasons.join("\n")}\n`);
    process.exitCode = 2;
    return;
  }

  const attempt = args.record
    ? await new GitHubIssueStore(config).nextAttempt(args.mission, args.participant!)
    : 1;
  const result = await evaluate(
    {
      missionId: args.mission,
      participantId: args.participant!,
      participantPrompt: prepared.prompt,
      publicBrief: readFileSync(resolve(process.cwd(), args.brief!), "utf8"),
      attempt,
      submission: prepared.submission,
    },
    { record: args.record, client: args.mock ? new MockJevClient() : undefined },
  );
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
