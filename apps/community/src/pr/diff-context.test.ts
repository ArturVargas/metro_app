import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { oldPathOf, splitDiffFiles, widenDiffContext, widenFileBlock } from "./diff-context.js";

const base = Array.from({ length: 60 }, (_, i) => `line ${i + 1}`);
const baseText = `${base.join("\n")}\n`;

/** GitHub-style 3-line diff that replaces line 30 and inserts one line after line 50. */
const narrow = [
  "diff --git a/src/a.ts b/src/a.ts",
  "index 1111111..2222222 100644",
  "--- a/src/a.ts",
  "+++ b/src/a.ts",
  "@@ -27,7 +27,7 @@ fn",
  " line 27",
  " line 28",
  " line 29",
  "-line 30",
  "+line 30 changed",
  " line 31",
  " line 32",
  " line 33",
  "@@ -48,6 +48,7 @@ fn",
  " line 48",
  " line 49",
  " line 50",
  "+inserted",
  " line 51",
  " line 52",
  " line 53",
  "",
].join("\n");

function hunks(diff: string): string[] {
  return diff.split("\n").filter((line) => line.startsWith("@@"));
}

describe("widenFileBlock", () => {
  it("adds base lines around each change and keeps the changes intact", () => {
    const wide = widenFileBlock(narrow, baseText, 5);
    assert.deepEqual(hunks(wide), ["@@ -25,11 +25,11 @@", "@@ -46,10 +46,11 @@"]);
    assert.match(wide, /^ line 25$/m);
    assert.match(wide, /^-line 30\n\+line 30 changed$/m);
    assert.match(wide, /^ line 55$/m);
    assert.doesNotMatch(wide, /^ line 24$/m);
  });

  it("merges hunks whose context overlaps", () => {
    const wide = widenFileBlock(narrow, baseText, 25);
    assert.deepEqual(hunks(wide), ["@@ -5,56 +5,57 @@"]);
    assert.equal(wide.split("\n").filter((line) => line.startsWith("+")).length, 3);
  });

  it("keeps the original block when the base does not match the hunks", () => {
    assert.equal(widenFileBlock(narrow, baseText.replace("line 29", "other"), 25), narrow);
  });

  it("keeps the no-newline marker with its line", () => {
    const block = [
      "diff --git a/b.txt b/b.txt",
      "--- a/b.txt",
      "+++ b/b.txt",
      "@@ -2,1 +2,1 @@",
      "-two",
      "\\ No newline at end of file",
      "+TWO",
      "\\ No newline at end of file",
      "",
    ].join("\n");
    const wide = widenFileBlock(block, "one\ntwo", 3);
    assert.equal(wide, block.replace("@@ -2,1 +2,1 @@", "@@ -1,2 +1,2 @@\n one"));
  });
});

describe("widenDiffContext", () => {
  it("widens only files with known base content and leaves new files alone", () => {
    const added = ["diff --git a/src/new.ts b/src/new.ts", "new file mode 100644", "--- /dev/null", "+++ b/src/new.ts", "@@ -0,0 +1 @@", "+x", ""].join("\n");
    const diff = narrow + added;
    assert.deepEqual(splitDiffFiles(diff).map(oldPathOf), ["src/a.ts", null]);
    const wide = widenDiffContext(diff, new Map([["src/a.ts", baseText]]), 25);
    assert.ok(wide.endsWith(added));
    assert.deepEqual(hunks(wide), ["@@ -5,56 +5,57 @@", "@@ -0,0 +1 @@"]);
    assert.equal(widenDiffContext(diff, new Map(), 25), diff);
  });
});
