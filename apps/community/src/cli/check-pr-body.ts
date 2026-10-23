#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { parsePrBody } from "../pr/body.js";

// Reads the PR body from the Actions event payload, or from --file for local checks.
function readBody(argv: string[]): string {
  const fileFlag = argv.indexOf("--file");
  if (fileFlag !== -1) return readFileSync(argv[fileFlag + 1] ?? "", "utf8");
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) throw new Error("Need GITHUB_EVENT_PATH or --file");
  const event = JSON.parse(readFileSync(eventPath, "utf8")) as {
    pull_request?: { body?: string | null };
  };
  return event.pull_request?.body ?? "";
}

const result = parsePrBody(readBody(process.argv.slice(2)));
if (result.ok) {
  process.stdout.write("La descripción del PR tiene todas las secciones requeridas.\n");
} else {
  process.stdout.write("La descripción del PR está incompleta:\n");
  for (const problem of result.problems) process.stdout.write(`- ${problem}\n`);
  process.exitCode = 1;
}
