export type ProjectConfig = {
  token: string;
  owner: string;
  projectNumber: number;
  repoOwner: string;
  repo: string;
};

const DEFAULT_OWNER = "ArturVargas";
const DEFAULT_REPO = "metro_app";

function value(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

export function readProjectConfig(
  env: NodeJS.ProcessEnv = process.env,
): ProjectConfig | null {
  const token = value(env.GITHUB_PROJECT_TOKEN);
  const number = value(env.GITHUB_PROJECT_NUMBER);
  const ownerOverride = value(env.GITHUB_PROJECT_OWNER);
  if (!token && !number && !ownerOverride) return null;
  if (!token || !number || !/^[1-9]\d*$/.test(number)) {
    throw new Error(
      "Invalid GitHub Project configuration: set GITHUB_PROJECT_TOKEN and a positive integer GITHUB_PROJECT_NUMBER",
    );
  }
  return {
    token,
    owner: ownerOverride ?? DEFAULT_OWNER,
    projectNumber: Number(number),
    repoOwner: value(env.GITHUB_OWNER) ?? DEFAULT_OWNER,
    repo: value(env.GITHUB_REPO) ?? DEFAULT_REPO,
  };
}

export function requireProjectConfig(
  env: NodeJS.ProcessEnv = process.env,
): ProjectConfig {
  const config = readProjectConfig(env);
  if (!config) throw new Error("GitHub Project synchronization is not configured");
  return config;
}
