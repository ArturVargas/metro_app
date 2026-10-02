import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readProjectConfig, requireProjectConfig } from "./config.js";

describe("Project config", () => {
  it("is disabled when no Project variables are present", () => {
    assert.equal(readProjectConfig({}), null);
  });

  it("rejects partial and invalid configuration without exposing the token", () => {
    const token = "secret-project-token";
    for (const env of [
      { GITHUB_PROJECT_TOKEN: token },
      { GITHUB_PROJECT_NUMBER: "1" },
      { GITHUB_PROJECT_TOKEN: token, GITHUB_PROJECT_NUMBER: "0" },
      { GITHUB_PROJECT_TOKEN: token, GITHUB_PROJECT_NUMBER: "1.5" },
    ]) {
      assert.throws(
        () => readProjectConfig(env),
        (error: Error) => !error.message.includes(token),
      );
    }
    assert.throws(() => requireProjectConfig({}), /not configured/);
  });

  it("returns the Project and repository target with safe defaults", () => {
    assert.deepEqual(
      readProjectConfig({
        GITHUB_PROJECT_TOKEN: "token",
        GITHUB_PROJECT_NUMBER: "1",
      }),
      {
        token: "token",
        owner: "ArturVargas",
        projectNumber: 1,
        repoOwner: "ArturVargas",
        repo: "metro_app",
      },
    );
  });
});
