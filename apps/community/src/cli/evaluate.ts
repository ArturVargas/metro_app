#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MockJevClient } from "@metro/evaluation";
import { evaluate } from "../evaluate.js";

type Args = {
  fixture?: string;
  missionId?: string;
  participantId?: string;
  prompt?: string;
  brief?: string;
  attempt?: number;
  record: boolean;
  mock: boolean;
};

function parseArgs(argv: string[]): Args {
  const out: Args = { record: false, mock: false };
  const next = (flag: string, i: number): [string, number] => {
    const value = argv[i + 1];
    if (!value) throw new Error(`Missing value for ${flag}`);
    return [value, i + 1];
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--") continue;
    else if (arg === "--record") out.record = true;
    else if (arg === "--mock") out.mock = true;
    else if (arg === "--fixture") [out.fixture, i] = next(arg, i);
    else if (arg === "--mission") [out.missionId, i] = next(arg, i);
    else if (arg === "--participant") [out.participantId, i] = next(arg, i);
    else if (arg === "--prompt") [out.prompt, i] = next(arg, i);
    else if (arg === "--brief") [out.brief, i] = next(arg, i);
    else if (arg === "--attempt") {
      const [raw, j] = next(arg, i);
      i = j;
      const attempt = Number(raw);
      if (!Number.isInteger(attempt)) throw new Error("--attempt must be an integer");
      out.attempt = attempt;
    } else {
      throw new Error(`Unknown argument ${arg}`);
    }
  }
  return out;
}

type Fixture = {
  missionId?: string;
  participantId?: string;
  participantPrompt?: string;
  publicBrief?: string;
  attempt?: number;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  let fixture: Fixture = {};
  if (args.fixture) {
    fixture = JSON.parse(readFileSync(resolve(process.cwd(), args.fixture), "utf8")) as Fixture;
  }
  const missionId = args.missionId ?? fixture.missionId;
  const participantId = args.participantId ?? fixture.participantId;
  const participantPrompt = args.prompt ?? fixture.participantPrompt;
  const publicBrief = args.brief ?? fixture.publicBrief;
  const attempt = args.attempt ?? fixture.attempt ?? 1;
  if (!missionId || !participantId || !participantPrompt || !publicBrief) {
    throw new Error("Need mission, participant, prompt, and brief via flags or --fixture");
  }
  const result = await evaluate(
    { missionId, participantId, participantPrompt, publicBrief, attempt },
    { record: args.record, client: args.mock ? new MockJevClient() : undefined },
  );
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exitCode = 1;
});
