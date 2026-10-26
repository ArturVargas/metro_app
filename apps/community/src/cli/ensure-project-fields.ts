#!/usr/bin/env node
import { requireProjectConfig } from "../project/config.js";
import { planM3Fields, type ExistingField } from "../project/ensure-fields.js";

// Dry run by default; --apply creates only the missing M3 fields.
type GraphQLResponse<T> = { data?: T; errors?: Array<{ message: string }> };

async function graphql<T>(token: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await response.json()) as GraphQLResponse<T>;
  if (!response.ok || json.errors?.length || !json.data) {
    throw new Error(`GitHub GraphQL failed (${response.status}): ${json.errors?.map((error) => error.message).join("; ") ?? ""}`);
  }
  return json.data;
}

type ProjectQuery = {
  user: {
    projectV2: {
      id: string;
      title: string;
      fields: { nodes: Array<{ name?: string; dataType?: string; options?: Array<{ name: string }> }> };
    } | null;
  } | null;
};

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const config = requireProjectConfig();
  const data = await graphql<ProjectQuery>(
    config.token,
    `query($login: String!, $number: Int!) {
      user(login: $login) { projectV2(number: $number) { id title fields(first: 100) { nodes {
        ... on ProjectV2FieldCommon { name dataType }
        ... on ProjectV2SingleSelectField { options { name } }
      } } } }
    }`,
    { login: config.owner, number: config.projectNumber },
  );
  const project = data.user?.projectV2;
  if (!project) throw new Error("GitHub Project not found");
  const existing: ExistingField[] = project.fields.nodes
    .filter((node) => node.name && node.dataType)
    .map((node) => ({ name: node.name!, dataType: node.dataType!, options: node.options?.map((option) => option.name) }));
  const plan = planM3Fields(existing);

  const created: string[] = [];
  if (apply && plan.conflicts.length === 0) {
    for (const spec of plan.create) {
      await graphql(
        config.token,
        `mutation($input: CreateProjectV2FieldInput!) { createProjectV2Field(input: $input) { projectV2Field { ... on ProjectV2FieldCommon { name } } } }`,
        {
          input: {
            projectId: project.id,
            dataType: spec.dataType,
            name: spec.name,
            ...(spec.options
              ? { singleSelectOptions: spec.options.map((name) => ({ name, color: "GRAY", description: "" })) }
              : {}),
          },
        },
      );
      created.push(spec.name);
    }
  }
  process.stdout.write(
    `${JSON.stringify({ project: project.title, apply, create: plan.create.map((spec) => spec.name), created, ok: plan.ok, conflicts: plan.conflicts }, null, 2)}\n`,
  );
  if (plan.conflicts.length) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
