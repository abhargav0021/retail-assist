import type { KbChunk } from "./types";

export interface RetrievalResult {
  chunk: KbChunk;
  score: number;
}

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "is", "are",
  "do", "i", "my", "with", "how", "can", "you", "your", "it", "this", "that",
  "at", "be", "as", "we", "our", "from", "by", "me",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

interface Doc {
  chunk: KbChunk;
  tf: Map<string, number>;
  length: number;
}

export interface Bm25Index {
  docs: Doc[];
  df: Map<string, number>;
  avgLen: number;
  n: number;
}

export function buildIndex(chunks: KbChunk[]): Bm25Index {
  const docs: Doc[] = chunks.map((chunk) => {
    const tokens = tokenize(chunk.text);
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    return { chunk, tf, length: tokens.length };
  });
  const df = new Map<string, number>();
  for (const d of docs) {
    for (const term of d.tf.keys()) df.set(term, (df.get(term) ?? 0) + 1);
  }
  const totalLen = docs.reduce((s, d) => s + d.length, 0);
  return { docs, df, avgLen: docs.length ? totalLen / docs.length : 0, n: docs.length };
}

export function search(index: Bm25Index, query: string, k = 4): RetrievalResult[] {
  const k1 = 1.5;
  const b = 0.75;
  const terms = tokenize(query);
  const scored: RetrievalResult[] = index.docs.map((d) => {
    let score = 0;
    for (const term of terms) {
      const f = d.tf.get(term);
      if (!f) continue;
      const df = index.df.get(term) ?? 0;
      const idf = Math.log(1 + (index.n - df + 0.5) / (df + 0.5));
      const denom = f + k1 * (1 - b + (b * d.length) / (index.avgLen || 1));
      score += idf * ((f * (k1 + 1)) / denom);
    }
    return { chunk: d.chunk, score };
  });
  return scored
    .filter((r) => r.score > 0)
    .sort((a, b2) => b2.score - a.score)
    .slice(0, k);
}
