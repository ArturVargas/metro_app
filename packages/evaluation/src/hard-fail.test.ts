import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HARD_FAIL_SCORE_CAP,
  applyHardFailPolicy,
  detectM1V2HardFails,
} from "./hard-fail.js";
import type { ScoreResult } from "./types.js";

const baseScore = (): ScoreResult => ({
  total: 88,
  eligible: null,
  rubricVersion: "rubric-m1-v2",
  notes: "Composite Score.",
  dimensions: [],
  routing: {
    action: "auto",
    confidenceSummary: "high",
    probabilitySummary: null,
  },
});

describe("detectM1V2HardFails", () => {
  it("flags weak vague prompts for missing select-connect, visible line, and web verify", () => {
    const fails = detectM1V2HardFails(
      "Haz que el tablero sea más divertido y conecta las estaciones de una manera bonita.",
    );
    assert.ok(fails.includes("missing-select-connect"));
    assert.ok(fails.includes("missing-visible-line"));
    assert.ok(fails.includes("missing-web-verify"));
    assert.ok(!fails.includes("alters-stations"));
    assert.ok(!fails.includes("requires-demand-or-backend"));
  });

  it("flags medium prompts missing web verify but not select/line when present", () => {
    const fails = detectM1V2HardFails(
      "Permite seleccionar dos estaciones y conectarlas con una línea visible. Conserva las ocho estaciones actuales.",
    );
    assert.deepEqual(fails, ["missing-web-verify"]);
  });

  it("accepts the golden Emily-style Mission 1 prompt with no hard fails", () => {
    const fails = detectM1V2HardFails(
      "Implementa en el tablero actual la interacción para seleccionar dos de las ocho estaciones, con mouse y pantalla táctil, y conectarlas. Al completar la conexión debe verse una línea clara entre los centros de ambas estaciones. Conserva las posiciones e identidades de las ocho estaciones y el cliente universal Expo/web. No agregues pasajeros, demanda ni backend del juego. Termina cuando una persona pueda abrir el build web, seleccionar dos estaciones, ver la línea y repetir la prueba en menos de un minuto.",
    );
    assert.deepEqual(fails, []);
  });

  it("hard-fails when the prompt alters station count/identity/positions", () => {
    const fails = detectM1V2HardFails(
      "Select and connect two stations with a visible line. Move the stations to new positions and use 6 stations. Verify in the web build under one minute.",
    );
    assert.ok(fails.includes("alters-stations"));
  });

  it("hard-fails when the prompt requires demand/passengers/backend", () => {
    const fails = detectM1V2HardFails(
      "Select and connect two stations with a visible line. Implement passenger demand and a game backend. Verify in the web build in under one minute.",
    );
    assert.ok(fails.includes("requires-demand-or-backend"));
  });

  it("does not hard-fail soft vague nicer/playable wording when hard requirements are present", () => {
    const fails = detectM1V2HardFails(
      "Make the board nicer while you select and connect two stations with a clearly visible line. Verify in the web build in less than a minute. Keep the eight stations. No passengers, no demand, no backend.",
    );
    assert.deepEqual(fails, []);
  });

  it("does not hard-fail ambiguous mouse/touch wording alone when hard requirements are present", () => {
    const fails = detectM1V2HardFails(
      " somehow select/connect stations somehow with mouse or touch maybe. Draw a visible line between them. Check the web build in under one minute. Keep eight stations. No passengers, demand, or game backend.",
    );
    assert.deepEqual(fails, []);
  });

  it("does not hard-fail incompatible tech alone when hard requirements are present", () => {
    const fails = detectM1V2HardFails(
      "Use Flutter instead of Expo if needed. Select and connect two stations with a visible line. Verify in the web build in less than a minute. Keep the eight stations. No passengers, no demand, no backend.",
    );
    assert.deepEqual(fails, []);
  });
});

describe("applyHardFailPolicy", () => {
  it("caps below 70 and forces ineligible when hard fails exist", () => {
    const applied = applyHardFailPolicy(baseScore(), ["missing-web-verify"]);
    assert.equal(applied.score.total, HARD_FAIL_SCORE_CAP);
    assert.equal(applied.score.eligible, false);
    assert.equal(applied.capped, true);
    assert.match(applied.score.notes, /Hard-fail policy/);
    assert.ok(HARD_FAIL_SCORE_CAP < 70);
  });

  it("leaves a high score eligible when there are no hard fails", () => {
    const applied = applyHardFailPolicy(baseScore(), []);
    assert.equal(applied.score.total, 88);
    assert.equal(applied.score.eligible, true);
    assert.equal(applied.capped, false);
  });

  it("keeps an already-low total uncapped but still ineligible on hard fail", () => {
    const low = baseScore();
    low.total = 40;
    const applied = applyHardFailPolicy(low, ["missing-select-connect"]);
    assert.equal(applied.score.total, 40);
    assert.equal(applied.score.eligible, false);
    assert.equal(applied.capped, false);
  });
});
