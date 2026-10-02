import type { ProjectPromptSnapshot, ProjectStore } from "./types.js";

export type ReconcileResult = {
  synced: number;
  failed: Array<{ issueNumber: number; error: string }>;
};

export async function reconcileProject(
  snapshots: ProjectPromptSnapshot[],
  store: ProjectStore,
): Promise<ReconcileResult> {
  const failed: ReconcileResult["failed"] = [];
  let synced = 0;
  for (const snapshot of snapshots) {
    try {
      await store.syncPrompt(snapshot);
      synced += 1;
    } catch {
      failed.push({
        issueNumber: snapshot.issueNumber,
        error: "Project sync failed",
      });
    }
  }
  return { synced, failed };
}
