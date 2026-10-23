import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { parsePrBody } from "./body.js";
import { DEV_SHA, filledBody } from "./fixtures.js";

describe("parsePrBody", () => {
  it("parses a filled template, keeping headings inside the prompt block", () => {
    const result = parsePrBody(filledBody());
    assert.ok(result.ok);
    assert.equal(result.value.participantId, "p-026");
    assert.equal(result.value.missionId, "mission-m3");
    assert.equal(result.value.prompt, "## Objetivo\nMuestra un contador que empieza en 0.");
    assert.equal(result.value.baseSha, DEV_SHA);
    assert.equal(result.value.changeOrigin, "combined");
    assert.match(result.value.changeDeclaration, /corregí el valor inicial/);
    assert.match(result.value.tests, /pnpm lint/);
  });

  it("accepts an id with a collision suffix", () => {
    const result = parsePrBody(filledBody({ participant: "Participante: p-123b\nMisión: mission-m3" }));
    assert.ok(result.ok);
    assert.equal(result.value.participantId, "p-123b");
  });

  it("rejects the untouched repository template", () => {
    const template = readFileSync(new URL("../../../../.github/pull_request_template.md", import.meta.url), "utf8");
    const result = parsePrBody(template);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.problems.some((problem) => /prompt exacto/i.test(problem)));
      assert.ok(result.problems.some((problem) => /Pruebas|pruebas/.test(problem)));
      assert.ok(result.problems.some((problem) => /exactamente una opción/.test(problem)));
      assert.ok(result.problems.some((problem) => /privacidad/.test(problem)));
    }
  });

  it("requires exactly one origin, a full SHA and the privacy confirmation", () => {
    const two = parsePrBody(filledBody({ origin: "- [x] LLM\n- [x] Manual\n\nExplicación: ambos." }));
    assert.equal(two.ok, false);
    const shortSha = parsePrBody(filledBody({ base: "2e3f805" }));
    assert.equal(shortSha.ok, false);
    const privacy = parsePrBody(filledBody({ privacy: "- [ ] Este PR no incluye archivos .env." }));
    assert.equal(privacy.ok, false);
  });

  it("reports every missing section of an empty body", () => {
    const result = parsePrBody("");
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.problems.length, 8);
  });
});
