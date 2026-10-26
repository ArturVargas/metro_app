import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { M3_FIELD_SPECS, planM3Fields } from "./ensure-fields.js";

describe("planM3Fields", () => {
  it("creates only missing fields and never touches existing ones", () => {
    const plan = planM3Fields([
      { name: "Pull request", dataType: "TEXT" },
      { name: "Status", dataType: "SINGLE_SELECT", options: ["Active"] },
    ]);
    assert.deepEqual(plan.ok, ["Pull request"]);
    assert.equal(plan.create.length, M3_FIELD_SPECS.length - 1);
    assert.deepEqual(plan.conflicts, []);
  });

  it("reports a conflicting type instead of changing it", () => {
    const plan = planM3Fields([{ name: "Queue state", dataType: "TEXT" }]);
    assert.match(plan.conflicts[0] ?? "", /Queue state/);
    assert.ok(!plan.create.some((spec) => spec.name === "Queue state"));
  });
});
