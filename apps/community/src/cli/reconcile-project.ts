#!/usr/bin/env node
import { requireGitHubStoreConfig } from "../github/config.js";
import { GitHubIssueStore } from "../github/issue-store.js";
import { requireProjectConfig } from "../project/config.js";
import { GitHubProjectStore } from "../project/github-project-store.js";
import { reconcileProject } from "../project/reconcile.js";

async function main(): Promise<void> {
  const issueStore = new GitHubIssueStore(requireGitHubStoreConfig());
  const projectStore = new GitHubProjectStore(requireProjectConfig());
  const snapshots = await issueStore.listOpenProjectSnapshots();
  const result = await reconcileProject(snapshots, projectStore);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.failed.length > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
