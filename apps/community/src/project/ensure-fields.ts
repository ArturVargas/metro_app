import { PR_QUEUE_STATES } from "../pr/queue.js";
import { CHECKS_OPTIONS, M3_PROJECT_FIELDS, ORIGIN_OPTIONS } from "./github-project-store.js";

export type FieldSpec = { name: string; dataType: "TEXT" | "SINGLE_SELECT"; options?: string[] };

export const M3_FIELD_SPECS: FieldSpec[] = [
  { name: M3_PROJECT_FIELDS.queueState.name, dataType: "SINGLE_SELECT", options: [...PR_QUEUE_STATES] },
  { name: M3_PROJECT_FIELDS.evaluatedSha.name, dataType: "TEXT" },
  { name: M3_PROJECT_FIELDS.headSha.name, dataType: "TEXT" },
  { name: M3_PROJECT_FIELDS.baseSha.name, dataType: "TEXT" },
  { name: M3_PROJECT_FIELDS.changeOrigin.name, dataType: "SINGLE_SELECT", options: Object.values(ORIGIN_OPTIONS) },
  { name: M3_PROJECT_FIELDS.checks.name, dataType: "SINGLE_SELECT", options: Object.values(CHECKS_OPTIONS) },
  { name: M3_PROJECT_FIELDS.queuedAt.name, dataType: "TEXT" },
  { name: M3_PROJECT_FIELDS.pullRequest.name, dataType: "TEXT" },
];

export type ExistingField = { name: string; dataType: string; options?: string[] };

export type FieldPlan = {
  create: FieldSpec[];
  ok: string[];
  conflicts: string[];
};

/** Additive only: existing fields are never renamed, retyped or given new options here. */
export function planM3Fields(existing: ExistingField[], specs: FieldSpec[] = M3_FIELD_SPECS): FieldPlan {
  const plan: FieldPlan = { create: [], ok: [], conflicts: [] };
  for (const spec of specs) {
    const field = existing.find((candidate) => candidate.name === spec.name);
    if (!field) {
      plan.create.push(spec);
    } else if (field.dataType !== spec.dataType) {
      plan.conflicts.push(`${spec.name}: exists as ${field.dataType}, expected ${spec.dataType}`);
    } else {
      const missing = (spec.options ?? []).filter((option) => !field.options?.includes(option));
      if (missing.length) plan.conflicts.push(`${spec.name}: missing options ${missing.join(", ")}`);
      else plan.ok.push(spec.name);
    }
  }
  return plan;
}
