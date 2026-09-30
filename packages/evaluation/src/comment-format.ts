/**
 * Pure markdown builder for GitHub attempt comments.
 * Participant-facing text must never name Jev.
 */

import type { AttemptResult } from "./attempt.js";
import {
  formatAttemptTagsLine,
  resolveEligible,
  scoreTagValue,
} from "./attempt.js";
import { ELIGIBILITY_THRESHOLD } from "./attempt.js";

/** HTML comment marker embedded in attempt comments for tooling. */
export function attemptCommentMarker(result: AttemptResult): string {
  const { missionId, participantId, attempt } = result.state;
  return `<!-- metro-attempt: mission:${missionId} participant:${participantId} attempt:${attempt} -->`;
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function formatDimensionsTable(result: AttemptResult): string {
  const rows = result.score.dimensions.map((d) => {
    const level = d.level === null ? "—" : String(d.level);
    const normalized =
      d.normalized === null ? "—" : d.normalized.toFixed(2);
    const weight = d.weight.toFixed(2);
    return `| ${escapeCell(d.questionId)} | ${level} | ${normalized} | ${weight} |`;
  });
  if (rows.length === 0) {
    return "_No score dimensions recorded._";
  }
  return [
    "| Dimension | Level (0–4) | Normalized | Weight |",
    "| --- | ---: | ---: | ---: |",
    ...rows,
  ].join("\n");
}

/**
 * Structured markdown body for one evaluation attempt comment.
 * Includes prompt, total score, per-dimension levels, feedback, and tags line.
 */
export function formatAttemptCommentMarkdown(result: AttemptResult): string {
  const { state, score, feedback } = result;
  const eligible = resolveEligible(score);
  const totalDisplay = scoreTagValue(score.total);
  const tagsLine = formatAttemptTagsLine(result);

  const sections = [
    attemptCommentMarker(result),
    "",
    `## Evaluation attempt ${state.attempt}`,
    "",
    `- **Mission:** \`${state.missionId}\``,
    `- **Participant:** \`${state.participantId}\``,
    `- **Rubric:** \`${state.rubricVersion}\``,
    "",
    "### Prompt",
    "",
    "```",
    state.participantPrompt.trim(),
    "```",
    "",
    "### Score",
    "",
    `- **Total:** ${totalDisplay} / 100`,
    `- **Eligible:** ${eligible ? "yes" : "no"} (threshold ≥${ELIGIBILITY_THRESHOLD})`,
    `- **Routing:** \`${score.routing.action}\``,
    "",
    formatDimensionsTable(result),
    "",
    "### Feedback",
    "",
    feedback.trim() || "_No feedback provided._",
    "",
    "### Tags",
    "",
    tagsLine,
    "",
  ];

  return sections.join("\n");
}
