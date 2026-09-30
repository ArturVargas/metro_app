/**
 * GitHub auth and repo targeting for the community writer.
 * Token from GITHUB_TOKEN or GH_TOKEN — never commit secrets.
 */

export type GitHubStoreConfig = {
  owner: string;
  repo: string;
  /** PAT or GitHub App installation token. */
  token: string;
};

export type GitHubEnvConfig = {
  owner: string;
  repo: string;
  /** True when token is present. */
  hasToken: boolean;
};

const DEFAULT_OWNER = "ArturVargas";
const DEFAULT_REPO = "metro_app";

export function readGitHubToken(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const raw = env.GITHUB_TOKEN ?? env.GH_TOKEN;
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function readGitHubEnvConfig(
  env: NodeJS.ProcessEnv = process.env,
): GitHubEnvConfig {
  const owner = (env.GITHUB_OWNER ?? DEFAULT_OWNER).trim() || DEFAULT_OWNER;
  const repo = (env.GITHUB_REPO ?? DEFAULT_REPO).trim() || DEFAULT_REPO;
  return {
    owner,
    repo,
    hasToken: Boolean(readGitHubToken(env)),
  };
}

export function requireGitHubStoreConfig(
  env: NodeJS.ProcessEnv = process.env,
): GitHubStoreConfig {
  const token = readGitHubToken(env);
  if (!token) {
    throw new Error(
      "Missing GITHUB_TOKEN or GH_TOKEN. Set a token with repo issue/comment scope; do not commit secrets.",
    );
  }
  const { owner, repo } = readGitHubEnvConfig(env);
  return { owner, repo, token };
}
