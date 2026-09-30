import type { FeedbackGenerator, FeedbackInput } from "./types.js";

export class HttpFeedbackGenerator implements FeedbackGenerator {
  async generate(_input: FeedbackInput): Promise<string> {
    throw new Error("HttpFeedbackGenerator is not configured");
  }
}
