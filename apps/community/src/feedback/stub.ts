import { buildTemplateFeedback } from "@metro/evaluation";
import type { FeedbackGenerator, FeedbackInput, FeedbackResult } from "./types.js";

export class StubFeedbackGenerator implements FeedbackGenerator {
  async generate(input: FeedbackInput): Promise<FeedbackResult> {
    return buildTemplateFeedback(input.scoreResult);
  }
}
