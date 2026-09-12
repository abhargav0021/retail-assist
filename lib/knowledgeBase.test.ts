import { describe, it, expect } from "vitest";
import { chunkMarkdown } from "./knowledgeBase";

describe("chunkMarkdown", () => {
  const md = `# Returns & Warranties

Intro line.

## Return Window

90 days with receipt.

## Non-Returnable Items

Cut lumber and mixed paint.
`;

  it("uses the H1 as docTitle for every chunk", () => {
    const chunks = chunkMarkdown("returns-and-warranties", md);
    expect(chunks.every((c) => c.docTitle === "Returns & Warranties")).toBe(true);
  });

  it("creates one chunk per ## section", () => {
    const chunks = chunkMarkdown("returns-and-warranties", md);
    const headings = chunks.map((c) => c.heading);
    expect(headings).toContain("Return Window");
    expect(headings).toContain("Non-Returnable Items");
  });

  it("builds slugged ids scoped to the doc", () => {
    const chunks = chunkMarkdown("returns-and-warranties", md);
    expect(chunks.find((c) => c.heading === "Return Window")?.id).toBe(
      "returns-and-warranties#return-window",
    );
  });

  it("includes the section body in text", () => {
    const chunks = chunkMarkdown("returns-and-warranties", md);
    const rw = chunks.find((c) => c.heading === "Return Window");
    expect(rw?.text).toContain("90 days with receipt");
  });
});
