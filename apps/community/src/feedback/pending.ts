import type {
  FeedbackGenerator,
  FeedbackInput,
  FeedbackResult,
} from "./types.js";

export class HttpFeedbackGenerator implements FeedbackGenerator {
  async generate(_input: FeedbackInput): Promise<FeedbackResult> {
    throw new Error("HttpFeedbackGenerator is not configured");
  }
}
