import fs from "node:fs";
import path from "node:path";
import type { KbChunk } from "./types";

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function chunkMarkdown(docId: string, markdown: string): KbChunk[] {
  const lines = markdown.split("\n");
  let docTitle = docId;
  const chunks: KbChunk[] = [];
  let heading: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (heading === null) return;
    const text = [`## ${heading}`, ...buffer].join("\n").trim();
    chunks.push({
      id: `${docId}#${slug(heading)}`,
      docId,
      docTitle,
      heading,
      text,
    });
    buffer = [];
  };

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.*)$/);
    const h2 = line.match(/^##\s+(.*)$/);
    if (h1) {
      docTitle = h1[1].trim();
      continue;
    }
    if (h2) {
      flush();
      heading = h2[1].trim();
      continue;
    }
    if (heading !== null) buffer.push(line);
  }
  flush();
  // Backfill docTitle for chunks captured before the H1 was seen (defensive).
  return chunks.map((c) => ({ ...c, docTitle }));
}

export function loadKnowledgeBase(
  dir: string = path.join(process.cwd(), "knowledge-base"),
): KbChunk[] {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  return files.flatMap((f) => {
    const docId = f.replace(/\.md$/, "");
    const md = fs.readFileSync(path.join(dir, f), "utf8");
    return chunkMarkdown(docId, md);
  });
}
