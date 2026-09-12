import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "./prompt";
import type { RetrievalResult } from "./retrieval";

const context: RetrievalResult[] = [
  {
    score: 3.2,
    chunk: {
      id: "returns-and-warranties#return-window",
      docId: "returns-and-warranties",
      docTitle: "Returns & Warranties",
      heading: "Return Window",
      text: "## Return Window\n90 days with a receipt.",
    },
  },
];

describe("buildSystemPrompt", () => {
  it("identifies the assistant as Cedar & Bolt support", () => {
    expect(buildSystemPrompt(context)).toContain("Cedar & Bolt");
  });

  it("embeds the retrieved context text and its chunk id", () => {
    const prompt = buildSystemPrompt(context);
    expect(prompt).toContain("90 days with a receipt");
    expect(prompt).toContain("returns-and-warranties#return-window");
  });

  it("instructs the model to admit when it does not know", () => {
    expect(buildSystemPrompt(context).toLowerCase()).toContain("don't know");
  });
});
