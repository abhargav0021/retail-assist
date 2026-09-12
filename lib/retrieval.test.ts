import { describe, it, expect } from "vitest";
import { buildIndex, search } from "./retrieval";
import type { KbChunk } from "./types";

const chunks: KbChunk[] = [
  { id: "a#hours", docId: "a", docTitle: "Hours", heading: "Store Hours",
    text: "Our stores are open Monday through Saturday from 7am to 8pm." },
  { id: "b#returns", docId: "b", docTitle: "Returns", heading: "Return Window",
    text: "You can return items within 90 days with a receipt for a refund." },
  { id: "c#rental", docId: "c", docTitle: "Rental", heading: "Tool Rental",
    text: "Rent tools by the day or week; a deposit and photo ID are required." },
];

describe("search", () => {
  it("ranks the most relevant chunk first", () => {
    const index = buildIndex(chunks);
    const results = search(index, "how do I return something with my receipt");
    expect(results[0].chunk.id).toBe("b#returns");
  });

  it("returns no results for a query with no term overlap", () => {
    const index = buildIndex(chunks);
    const results = search(index, "zzzzz nonexistent unicorn");
    expect(results.length).toBe(0);
  });

  it("respects the k limit", () => {
    const index = buildIndex(chunks);
    const results = search(index, "store return tool", 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });
});
