/** Context lines around each change sent to the evaluator (GitHub's compare diff has 3). */
export const PR_DIFF_CONTEXT_LINES = 25;

/** More base files than this are not fetched; the whole diff keeps GitHub's context. */
export const MAX_WIDENED_FILES = 20;

/**
 * How much context the evaluated diff carries. Calibration used `widened`; `fallback` is an
 * intentional, reported exception; `incomplete` means a base file could not be fetched and
 * the evaluation must not run.
 */
export type DiffContextReport =
  | { status: "widened"; contextLines: number; files: number }
  | {
      status: "fallback";
      contextLines: 3;
      files: number;
      reason: "diff-too-large" | "too-many-files";
    }
  | { status: "incomplete"; missing: string[] };

/** Base-side paths of text hunks whose content is needed to widen the diff, in diff order. */
export function widenablePaths(diff: string): string[] {
  return [
    ...new Set(
      splitDiffFiles(diff)
        .filter((block) => /^@@ /m.test(block))
        .map(oldPathOf)
        .filter((path): path is string => path !== null),
    ),
  ];
}

type Op = { kind: " " | "-" | "+" | "\\"; text: string };

const HUNK = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

/** Old-side path of a file block (`--- a/path`), or null for new, quoted or unparseable files. */
export function oldPathOf(block: string): string | null {
  const match = block.match(/^--- a\/(.+)$/m);
  if (!match || match[1]!.startsWith('"')) return null;
  return match[1]!.replace(/\t.*$/, "");
}

/** Splits a unified diff into per-file blocks, each starting at `diff --git`. */
export function splitDiffFiles(diff: string): string[] {
  const starts = [...diff.matchAll(/^diff --git /gm)].map((m) => m.index!);
  if (starts.length === 0) return diff ? [diff] : [];
  const blocks = starts.map((start, i) => diff.slice(start, starts[i + 1] ?? diff.length));
  return starts[0]! > 0 ? [diff.slice(0, starts[0]), ...blocks] : blocks;
}

function baseLines(content: string): string[] {
  const lines = content.split("\n");
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

/**
 * Re-renders one file block with `context` unchanged lines around each change, taking the
 * unchanged lines from the base file. Returns the block untouched when it cannot be widened
 * safely (no hunks, binary, or the hunks do not match the base content).
 */
export function widenFileBlock(block: string, baseContent: string, context: number): string {
  const lines = block.replace(/\n$/, "").split("\n");
  const firstHunk = lines.findIndex((line) => HUNK.test(line));
  if (firstHunk < 0) return block;
  const header = lines.slice(0, firstHunk);
  const base = baseLines(baseContent);

  const ops: Op[] = [];
  let oldLine = 1;
  let current: Op[] | null = null;
  for (const line of lines.slice(firstHunk)) {
    const hunk = line.match(HUNK);
    if (hunk) {
      const oldStart = Number(hunk[1]);
      const oldLen = hunk[2] === undefined ? 1 : Number(hunk[2]);
      const start = oldLen === 0 ? oldStart + 1 : oldStart;
      if (start < oldLine) return block;
      for (; oldLine < start; oldLine++) ops.push({ kind: " ", text: base[oldLine - 1] ?? "" });
      current = ops;
      continue;
    }
    if (!current) return block;
    const kind = line[0];
    const text = line.slice(1);
    if (kind === " " || kind === "-") {
      if (base[oldLine - 1] !== text) return block;
      ops.push({ kind, text });
      oldLine++;
    } else if (kind === "+" || kind === "\\") {
      ops.push({ kind, text });
    } else if (line === "") {
      // Trailing empty line of the block.
    } else {
      return block;
    }
  }
  for (; oldLine <= base.length; oldLine++) ops.push({ kind: " ", text: base[oldLine - 1]! });

  const changed = ops.map((op, i) => (op.kind === "+" || op.kind === "-" ? i : -1)).filter((i) => i >= 0);
  if (changed.length === 0) return block;
  const keep = new Array<boolean>(ops.length).fill(false);
  for (const index of changed) {
    for (let i = Math.max(0, index - context); i <= Math.min(ops.length - 1, index + context); i++) keep[i] = true;
  }
  // A "\ No newline" marker belongs to the line before it.
  for (let i = 1; i < ops.length; i++) if (ops[i]!.kind === "\\" && keep[i - 1]) keep[i] = true;

  const out = [...header];
  let oldBefore = 0;
  let newBefore = 0;
  for (let i = 0; i < ops.length; ) {
    if (!keep[i]) {
      const op = ops[i]!;
      if (op.kind === " " || op.kind === "-") oldBefore++;
      if (op.kind === " " || op.kind === "+") newBefore++;
      i++;
      continue;
    }
    let end = i;
    while (end < ops.length && keep[end]) end++;
    const range = ops.slice(i, end);
    const oldLen = range.filter((op) => op.kind === " " || op.kind === "-").length;
    const newLen = range.filter((op) => op.kind === " " || op.kind === "+").length;
    const oldStart = oldLen === 0 ? oldBefore : oldBefore + 1;
    const newStart = newLen === 0 ? newBefore : newBefore + 1;
    out.push(`@@ -${oldStart},${oldLen} +${newStart},${newLen} @@`);
    for (const op of range) out.push(`${op.kind}${op.text}`);
    oldBefore += oldLen;
    newBefore += newLen;
    i = end;
  }
  return `${out.join("\n")}\n`;
}

/**
 * Widens every file block whose base content is known. Blocks without base content
 * (new files, quoted paths, fetch failures) keep GitHub's context.
 */
export function widenDiffContext(
  diff: string,
  baseContentByPath: ReadonlyMap<string, string>,
  context: number = PR_DIFF_CONTEXT_LINES,
): string {
  return splitDiffFiles(diff)
    .map((block) => {
      const path = oldPathOf(block);
      const content = path === null ? undefined : baseContentByPath.get(path);
      return content === undefined ? block : widenFileBlock(block, content, context);
    })
    .join("");
}
