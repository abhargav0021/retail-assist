# Retail Assist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build "Retail Assist," an AI customer-support agent for a fictional hardware chain (Cedar & Bolt Hardware) with local keyword retrieval over a markdown knowledge base, mood detection, and escalation — deployable to Vercel with only `ANTHROPIC_API_KEY`.

**Architecture:** A single Next.js (App Router) + TypeScript app. One API route (`/api/chat`) runs a pure-TS BM25 keyword search over a folder of markdown docs, then makes a single Claude Sonnet call using tool-use for structured output that returns the reply plus mood/escalation/citation metadata. The UI shows the chat, the retrieved KB chunks, and a mood/escalation debug panel.

**Tech Stack:** Next.js 14 (App Router), TypeScript, React 18, Tailwind CSS, `@anthropic-ai/sdk`, Vitest.

## Global Constraints

- Runtime must work from a clean clone with only `ANTHROPIC_API_KEY` set: `npm install && npm run dev`.
- Model API: Anthropic only, via `@anthropic-ai/sdk`. Default model `claude-sonnet-4-6`, overridable via `ANTHROPIC_MODEL` env var.
- Retrieval is local, pure TypeScript. No external embedding API, no model downloads, no managed services.
- No authentication, no payments, no chat persistence, no database.
- Fictional business only: "Cedar & Bolt Hardware." No real company name, logo, or data. No references to Anthropic's quickstart or its demo data in UI/content.
- Accessibility: readable contrast, keyboard-navigable inputs and controls.
- Commit style: small logical commits. Do NOT add a `Co-Authored-By` / Claude trailer to commit messages.
- **Structured-output decision:** a single non-streaming Claude call using tool-use returns `{ reply, mood, escalate, escalateReason, citedChunkIds }`. (This supersedes the spec's "streaming" assumption for robustness; streaming is documented as a future enhancement.)

---

### Task 1: Project scaffold (Next.js + TS + Tailwind + Vitest)

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, `.gitignore`, `.env.example`, `vitest.config.ts`
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

**Interfaces:**
- Consumes: nothing.
- Produces: a running Next.js dev server and a working `npm test` runner for later tasks.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "retail-assist",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.1",
    "next": "14.2.15",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.4",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create config files**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`next.config.mjs` (ensures the KB folder is bundled for the API route on Vercel):
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/api/chat": ["./knowledge-base/**/*"],
  },
};
export default nextConfig;
```

`postcss.config.mjs`:
```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

`tailwind.config.ts`:
```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#1f6f54", dark: "#155540", light: "#e6f2ec" },
      },
    },
  },
  plugins: [],
};
export default config;
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["**/*.test.ts"] },
});
```

`.gitignore`:
```
node_modules/
.next/
out/
.env
.env.local
*.log
.DS_Store
next-env.d.ts
.vercel
```

`.env.example`:
```
# Required: your Anthropic API key
ANTHROPIC_API_KEY=sk-ant-...

# Optional: override the default model (claude-sonnet-4-6)
# ANTHROPIC_MODEL=claude-sonnet-4-6
```

- [ ] **Step 3: Create app shell**

`app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body { height: 100%; }
body { @apply bg-gray-50 text-gray-900 antialiased; }
```

`app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Retail Assist — Cedar & Bolt Hardware",
  description: "AI support assistant demo for a fictional hardware chain.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

`app/page.tsx` (temporary placeholder, replaced in Task 7):
```tsx
export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Retail Assist</h1>
      <p className="text-gray-600">Scaffold OK.</p>
    </main>
  );
}
```

- [ ] **Step 4: Install and verify dev server**

Run: `npm install`
Then run: `npm run dev` and open http://localhost:3000
Expected: page shows "Retail Assist" and "Scaffold OK." Stop the server (Ctrl-C).

- [ ] **Step 5: Verify the test runner works**

Run: `npm test`
Expected: Vitest runs and reports "No test files found" (exit 0) — confirms the runner is wired.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js + TypeScript + Tailwind + Vitest"
```

---

### Task 2: Knowledge base content

**Files:**
- Create: `knowledge-base/locations-and-hours.md`, `knowledge-base/products-and-services.md`, `knowledge-base/returns-and-warranties.md`, `knowledge-base/repairs.md`, `knowledge-base/orders-pickup-financing.md`, `knowledge-base/contractor-pro-desk.md`, `knowledge-base/escalation-policy.md`

**Interfaces:**
- Consumes: nothing.
- Produces: markdown docs each starting with a single `# Title` H1 and using `##` section headings (the chunker in Task 3 splits on `##`).

**Content rules:** plain, ops-like, specific, slightly imperfect — not marketing copy. All fictional. 12 stores across Dallas–Fort Worth and Austin metros. Every doc MUST begin with one `# ` H1 line, then `## ` sections.

- [ ] **Step 1: Write `knowledge-base/locations-and-hours.md`**

Include a `# Store Locations & Hours` H1, then a `## Standard Hours` section (e.g., Mon–Sat 7am–8pm, Sun 9am–6pm; note holidays), and a `## Store List` section listing 12 named stores with neighborhood/city and any per-store exceptions. Use fictional street-style names (e.g., "Cedar & Bolt — North Arlington", "Cedar & Bolt — Round Rock"). Cities: Dallas, Fort Worth, Arlington, Plano, Irving, Denton, Frisco (DFW); Austin, Round Rock, Cedar Park, San Marcos, Georgetown (Austin metro). Add a `## Holiday Closures` section.

- [ ] **Step 2: Write `knowledge-base/products-and-services.md`**

`# Products & In-Store Services` H1. Sections: `## Tool Rental` (daily/weekly rates as ranges, deposit, ID required), `## Paint Mixing & Color Matching`, `## Key Cutting`, `## Propane Exchange & Refill`, `## Product Categories` (lumber, plumbing, electrical, power tools, garden). Keep specifics realistic but fictional.

- [ ] **Step 3: Write `knowledge-base/returns-and-warranties.md`**

`# Returns & Warranties` H1. Sections: `## Return Window` (90 days with receipt; 30 days without, store credit), `## Non-Returnable Items` (cut lumber, mixed paint, clearance), `## Manufacturer Warranties`, `## Defective Items`. Include the "keep your receipt / lookup by card" nuance.

- [ ] **Step 4: Write `knowledge-base/repairs.md`**

`# Power Tool Repairs` H1. Sections: `## What We Service`, `## Repair Intake Process` (drop-off at any store, diagnostic fee applied to repair, 7–14 business days), `## Warranty vs. Paid Repairs`, `## Loaner Tools` (pro members only).

- [ ] **Step 5: Write `knowledge-base/orders-pickup-financing.md`**

`# Orders, Pickup & Financing` H1. Sections: `## Order Status` (how to check via order number + email; no account needed), `## In-Store & Curbside Pickup` (ready within 2 hours, ID required, held 5 days), `## Delivery`, `## Payment & Financing` (cards, store credit card, financing on purchases over $299).

- [ ] **Step 6: Write `knowledge-base/contractor-pro-desk.md`**

`# Contractor Pro Desk` H1. Sections: `## Pro Account Benefits` (volume pricing, dedicated desk, extended returns), `## Bulk & Special Orders` (lead times), `## Job-Site Delivery`, `## How to Enroll`.

- [ ] **Step 7: Write `knowledge-base/escalation-policy.md`**

`# When to Escalate to a Human` H1. Sections: `## Escalate Immediately` (safety issues, injury, gas/propane hazards, recalls), `## Escalate on Request or Frustration` (billing disputes, repeated failed resolution, angry/frustrated customers), `## How to Hand Off` (offer store phone line and "connect you with a team member"; provide the general support number as a fictional placeholder like `(555) 010-2400` and hours). This doc doubles as the agent's escalation rulebook.

- [ ] **Step 8: Commit**

```bash
git add knowledge-base
git commit -m "content: add Cedar & Bolt fictional knowledge base"
```

---

### Task 3: Types + knowledge-base loader/chunker (TDD)

**Files:**
- Create: `lib/types.ts`
- Create: `lib/knowledgeBase.ts`
- Test: `lib/knowledgeBase.test.ts`

**Interfaces:**
- Consumes: markdown files from Task 2.
- Produces:
  - `interface KbChunk { id: string; docId: string; docTitle: string; heading: string; text: string; }`
  - `function chunkMarkdown(docId: string, markdown: string): KbChunk[]` — splits on `## ` headings; `docTitle` is the `# ` H1; each chunk `id` is `` `${docId}#${slug(heading)}` ``; `text` includes the heading line + body.
  - `function loadKnowledgeBase(dir?: string): KbChunk[]` — reads all `*.md` in `knowledge-base/`, returns all chunks.

- [ ] **Step 1: Write `lib/types.ts`**

```ts
export interface KbChunk {
  id: string;
  docId: string;
  docTitle: string;
  heading: string;
  text: string;
}

export type Mood = "neutral" | "confused" | "frustrated" | "angry";

export interface SupportResponse {
  reply: string;
  mood: Mood;
  escalate: boolean;
  escalateReason: string | null;
  citedChunkIds: string[];
}

export interface CitedDoc {
  id: string;
  docTitle: string;
  heading: string;
}

export interface ChatApiResponse {
  reply: string;
  mood: Mood;
  escalate: boolean;
  escalateReason: string | null;
  citedDocs: CitedDoc[];
}
```

- [ ] **Step 2: Write the failing test**

`lib/knowledgeBase.test.ts`:
```ts
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `chunkMarkdown` is not exported / not defined.

- [ ] **Step 4: Implement `lib/knowledgeBase.ts`**

```ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS — all four `chunkMarkdown` tests green.

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/knowledgeBase.ts lib/knowledgeBase.test.ts
git commit -m "feat: add KB types and markdown chunker with tests"
```

---

### Task 4: BM25 index + search (TDD)

**Files:**
- Create: `lib/retrieval.ts`
- Test: `lib/retrieval.test.ts`

**Interfaces:**
- Consumes: `KbChunk` from `lib/types.ts`.
- Produces:
  - `interface RetrievalResult { chunk: KbChunk; score: number; }`
  - `interface Bm25Index { /* opaque */ }`
  - `function buildIndex(chunks: KbChunk[]): Bm25Index`
  - `function search(index: Bm25Index, query: string, k?: number): RetrievalResult[]` — default `k = 4`, returns results sorted by descending score, excludes zero-score chunks.

- [ ] **Step 1: Write the failing test**

`lib/retrieval.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `buildIndex`/`search` not defined.

- [ ] **Step 3: Implement `lib/retrieval.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — all three `search` tests green (plus Task 3 tests still green).

- [ ] **Step 5: Commit**

```bash
git add lib/retrieval.ts lib/retrieval.test.ts
git commit -m "feat: add BM25 keyword retrieval with tests"
```

---

### Task 5: Anthropic client, prompt builder, structured response

**Files:**
- Create: `lib/prompt.ts`
- Create: `lib/anthropic.ts`
- Test: `lib/prompt.test.ts`

**Interfaces:**
- Consumes: `RetrievalResult` (Task 4), `SupportResponse`, `Mood` (Task 3 types).
- Produces:
  - `function buildSystemPrompt(context: RetrievalResult[]): string`
  - `function getSupportResponse(params: { messages: { role: "user" | "assistant"; content: string }[]; context: RetrievalResult[]; }): Promise<SupportResponse>`

- [ ] **Step 1: Write the failing test for the prompt builder**

`lib/prompt.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `buildSystemPrompt` not defined.

- [ ] **Step 3: Implement `lib/prompt.ts`**

```ts
import type { RetrievalResult } from "./retrieval";

export function buildSystemPrompt(context: RetrievalResult[]): string {
  const contextBlock = context.length
    ? context
        .map(
          (r) =>
            `[source: ${r.chunk.id}] (${r.chunk.docTitle} — ${r.chunk.heading})\n${r.chunk.text}`,
        )
        .join("\n\n---\n\n")
    : "(no relevant knowledge base entries were found for this question)";

  return `You are "Retail Assist," the customer-support assistant for Cedar & Bolt Hardware, a fictional regional hardware chain with 12 stores across the Dallas–Fort Worth and Austin metro areas.

Answer customer questions using ONLY the knowledge base context below. The context is the single source of truth about store policies, hours, and services.

Rules:
- If the answer is not clearly supported by the context, say you don't know and offer to connect the customer with a team member. Never invent policies, prices, phone numbers, or store details.
- Be concise, friendly, and practical — write the way a helpful store employee would.
- When you use a piece of context, record its [source: ...] id in citedChunkIds.
- Detect the customer's mood. If they are frustrated or angry, or if the escalation policy applies (safety issues, injuries, gas/propane hazards, recalls, billing disputes, or repeated failed resolution), set escalate to true and offer a handoff to a human per the escalation policy.
- Keep escalateReason short and specific, or null when not escalating.

Knowledge base context:
${contextBlock}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — the three `buildSystemPrompt` tests green.

- [ ] **Step 5: Implement `lib/anthropic.ts`**

```ts
import Anthropic from "@anthropic-ai/sdk";
import type { RetrievalResult } from "./retrieval";
import type { Mood, SupportResponse } from "./types";
import { buildSystemPrompt } from "./prompt";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

const MOODS: Mood[] = ["neutral", "confused", "frustrated", "angry"];

const responseTool: Anthropic.Tool = {
  name: "provide_support_response",
  description: "Return the reply to the customer plus support metadata.",
  input_schema: {
    type: "object",
    properties: {
      reply: { type: "string", description: "The message shown to the customer." },
      mood: { type: "string", enum: MOODS, description: "Detected customer mood." },
      escalate: { type: "boolean", description: "Whether to hand off to a human." },
      escalateReason: {
        type: ["string", "null"],
        description: "Short reason for escalation, or null.",
      },
      citedChunkIds: {
        type: "array",
        items: { type: "string" },
        description: "The [source: ...] ids used to answer.",
      },
    },
    required: ["reply", "mood", "escalate", "escalateReason", "citedChunkIds"],
  },
};

export async function getSupportResponse(params: {
  messages: { role: "user" | "assistant"; content: string }[];
  context: RetrievalResult[];
}): Promise<SupportResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local and add your key.",
    );
  }
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(params.context),
    tools: [responseTool],
    tool_choice: { type: "tool", name: "provide_support_response" },
    messages: params.messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const toolUse = message.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );
  if (!toolUse) throw new Error("Model did not return a structured response.");

  const input = toolUse.input as Partial<SupportResponse>;
  return {
    reply: input.reply ?? "Sorry, I couldn't generate a response. Please try again.",
    mood: (MOODS as string[]).includes(input.mood as string)
      ? (input.mood as Mood)
      : "neutral",
    escalate: Boolean(input.escalate),
    escalateReason: input.escalateReason ?? null,
    citedChunkIds: Array.isArray(input.citedChunkIds) ? input.citedChunkIds : [],
  };
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/prompt.ts lib/prompt.test.ts lib/anthropic.ts
git commit -m "feat: add prompt builder and Claude structured-response client"
```

---

### Task 6: `/api/chat` route

**Files:**
- Create: `app/api/chat/route.ts`

**Interfaces:**
- Consumes: `loadKnowledgeBase` (Task 3), `buildIndex`/`search` (Task 4), `getSupportResponse` (Task 5), types (Task 3).
- Produces: `POST /api/chat` accepting `{ messages: { role: "user" | "assistant"; content: string }[] }` and returning `ChatApiResponse` JSON. On error returns `{ error: string }` with status 500 (or 400 for bad input).

- [ ] **Step 1: Implement `app/api/chat/route.ts`**

```ts
import { NextResponse } from "next/server";
import { loadKnowledgeBase } from "@/lib/knowledgeBase";
import { buildIndex, search } from "@/lib/retrieval";
import { getSupportResponse } from "@/lib/anthropic";
import type { ChatApiResponse, CitedDoc, KbChunk } from "@/lib/types";

// Build the index once per server process.
let indexCache: ReturnType<typeof buildIndex> | null = null;
let chunksById: Map<string, KbChunk> | null = null;

function getIndex() {
  if (!indexCache || !chunksById) {
    const chunks = loadKnowledgeBase();
    indexCache = buildIndex(chunks);
    chunksById = new Map(chunks.map((c) => [c.id, c]));
  }
  return { index: indexCache, chunksById };
}

export async function POST(req: Request) {
  let body: { messages?: { role: "user" | "assistant"; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages is required." }, { status: 400 });
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return NextResponse.json({ error: "No user message found." }, { status: 400 });
  }

  try {
    const { index, chunksById } = getIndex();
    const context = search(index, lastUser.content);
    const result = await getSupportResponse({ messages, context });

    const citedDocs: CitedDoc[] = result.citedChunkIds
      .map((id) => chunksById.get(id))
      .filter((c): c is KbChunk => Boolean(c))
      .map((c) => ({ id: c.id, docTitle: c.docTitle, heading: c.heading }));

    const response: ChatApiResponse = {
      reply: result.reply,
      mood: result.mood,
      escalate: result.escalate,
      escalateReason: result.escalateReason,
      citedDocs,
    };
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Manually verify the route (requires `ANTHROPIC_API_KEY`)**

Create `.env.local` with a real key. Run `npm run dev`, then in a second terminal:
```bash
curl -s http://localhost:3000/api/chat \
  -H 'content-type: application/json' \
  -d '{"messages":[{"role":"user","content":"What is your return policy?"}]}' | head -c 800
```
Expected: JSON containing `reply`, `mood`, `escalate`, `citedDocs` with at least one doc from `returns-and-warranties`. Stop the server.

(If you don't have a key handy, skip the live call — the route compiles and is exercised end-to-end in Task 7's manual test.)

- [ ] **Step 3: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "feat: add /api/chat route wiring retrieval + Claude"
```

---

### Task 7: Chat UI (page + chat component)

**Files:**
- Create: `components/Chat.tsx`
- Modify: `app/page.tsx` (replace placeholder)

**Interfaces:**
- Consumes: `ChatApiResponse`, `CitedDoc`, `Mood` (Task 3 types); `POST /api/chat` (Task 6).
- Produces: a client `Chat` component that owns message state and exposes the latest response's metadata via props to `page.tsx` for the side panels (Task 8). Exports:
  - `interface UiMessage { role: "user" | "assistant"; content: string; }`
  - `interface LatestMeta { mood: Mood; escalate: boolean; escalateReason: string | null; citedDocs: CitedDoc[]; }`
  - `function Chat({ onMeta }: { onMeta: (meta: LatestMeta | null) => void }): JSX.Element`

- [ ] **Step 1: Implement `components/Chat.tsx`**

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatApiResponse, CitedDoc, Mood } from "@/lib/types";

export interface UiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LatestMeta {
  mood: Mood;
  escalate: boolean;
  escalateReason: string | null;
  citedDocs: CitedDoc[];
}

export function Chat({ onMeta }: { onMeta: (meta: LatestMeta | null) => void }) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    const next: UiMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await res.json()) as ChatApiResponse | { error: string };
      if (!res.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Request failed.");
      }
      setMessages([...next, { role: "assistant", content: data.reply }]);
      onMeta({
        mood: data.mood,
        escalate: data.escalate,
        escalateReason: data.escalateReason,
        citedDocs: data.citedDocs,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
        {messages.length === 0 && (
          <p className="text-sm text-gray-500">
            Ask about store hours, returns, tool rental, repairs, pickup, or financing.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[80%] rounded-lg bg-brand px-3 py-2 text-white"
                  : "max-w-[80%] rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-gray-200"
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && <p className="text-sm text-gray-400">Retail Assist is typing…</p>}
        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <div ref={endRef} />
      </div>
      <form
        className="flex gap-2 border-t border-gray-200 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <label htmlFor="chat-input" className="sr-only">
          Your message
        </label>
        <input
          id="chat-input"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          placeholder="Type your question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Replace `app/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Chat, type LatestMeta } from "@/components/Chat";

export default function Home() {
  const [meta, setMeta] = useState<LatestMeta | null>(null);

  return (
    <main className="mx-auto flex h-screen max-w-6xl flex-col p-4">
      <header className="mb-4">
        <h1 className="text-xl font-semibold text-brand-dark">Retail Assist</h1>
        <p className="text-sm text-gray-500">
          Cedar &amp; Bolt Hardware — customer support assistant
        </p>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-3">
        <section className="min-h-0 rounded-lg bg-gray-100 md:col-span-2">
          <Chat onMeta={setMeta} />
        </section>
        <aside className="min-h-0 space-y-4 overflow-y-auto">
          {/* Panels added in Task 8. Temporary readout: */}
          <pre className="rounded bg-white p-3 text-xs ring-1 ring-gray-200">
            {meta ? JSON.stringify(meta, null, 2) : "No response yet."}
          </pre>
        </aside>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Manual verification (requires `ANTHROPIC_API_KEY` in `.env.local`)**

Run `npm run dev`, open http://localhost:3000, ask "What are your store hours?"
Expected: an assistant reply appears; the right-side `<pre>` shows mood/escalate/citedDocs JSON. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add components/Chat.tsx app/page.tsx
git commit -m "feat: add chat UI and wire it to /api/chat"
```

---

### Task 8: Retrieval panel + debug (mood/escalation) panel

**Files:**
- Create: `components/RetrievalPanel.tsx`
- Create: `components/DebugPanel.tsx`
- Modify: `app/page.tsx` (replace the temporary `<pre>` readout)

**Interfaces:**
- Consumes: `LatestMeta` (Task 7), `CitedDoc`/`Mood` (Task 3).
- Produces:
  - `function RetrievalPanel({ citedDocs }: { citedDocs: CitedDoc[] }): JSX.Element`
  - `function DebugPanel({ mood, escalate, escalateReason }: { mood: Mood; escalate: boolean; escalateReason: string | null }): JSX.Element`

- [ ] **Step 1: Implement `components/DebugPanel.tsx`**

```tsx
import type { Mood } from "@/lib/types";

const MOOD_STYLES: Record<Mood, string> = {
  neutral: "bg-gray-100 text-gray-700",
  confused: "bg-amber-100 text-amber-800",
  frustrated: "bg-orange-100 text-orange-800",
  angry: "bg-red-100 text-red-800",
};

export function DebugPanel({
  mood,
  escalate,
  escalateReason,
}: {
  mood: Mood;
  escalate: boolean;
  escalateReason: string | null;
}) {
  return (
    <div className="rounded-lg bg-white p-3 ring-1 ring-gray-200">
      <h2 className="mb-2 text-sm font-semibold text-gray-700">Agent insight</h2>
      <div className="mb-2 flex items-center gap-2 text-sm">
        <span className="text-gray-500">Detected mood:</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${MOOD_STYLES[mood]}`}>
          {mood}
        </span>
      </div>
      <div className="text-sm">
        <span className="text-gray-500">Escalation: </span>
        {escalate ? (
          <span className="font-medium text-red-700">Recommended</span>
        ) : (
          <span className="font-medium text-green-700">Not needed</span>
        )}
      </div>
      {escalate && escalateReason && (
        <p className="mt-1 text-xs text-gray-600">Reason: {escalateReason}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Implement `components/RetrievalPanel.tsx`**

```tsx
import type { CitedDoc } from "@/lib/types";

export function RetrievalPanel({ citedDocs }: { citedDocs: CitedDoc[] }) {
  return (
    <div className="rounded-lg bg-white p-3 ring-1 ring-gray-200">
      <h2 className="mb-2 text-sm font-semibold text-gray-700">Knowledge base used</h2>
      {citedDocs.length === 0 ? (
        <p className="text-xs text-gray-500">No knowledge base entries were cited.</p>
      ) : (
        <ul className="space-y-2">
          {citedDocs.map((d) => (
            <li key={d.id} className="rounded border border-gray-100 bg-gray-50 p-2">
              <p className="text-sm font-medium text-gray-800">{d.docTitle}</p>
              <p className="text-xs text-gray-500">{d.heading}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Wire panels into `app/page.tsx`**

Replace the `<aside>` block's temporary `<pre>` with the panels. The full updated `<aside>`:
```tsx
        <aside className="min-h-0 space-y-4 overflow-y-auto">
          {meta ? (
            <>
              <DebugPanel
                mood={meta.mood}
                escalate={meta.escalate}
                escalateReason={meta.escalateReason}
              />
              <RetrievalPanel citedDocs={meta.citedDocs} />
            </>
          ) : (
            <div className="rounded-lg bg-white p-3 text-sm text-gray-500 ring-1 ring-gray-200">
              Ask a question to see the agent&apos;s mood read and the knowledge base it used.
            </div>
          )}
        </aside>
```
And add the imports at the top of `app/page.tsx`:
```tsx
import { DebugPanel } from "@/components/DebugPanel";
import { RetrievalPanel } from "@/components/RetrievalPanel";
```

- [ ] **Step 4: Manual verification**

Run `npm run dev`. Ask "What are your hours?" → RetrievalPanel lists the hours doc, DebugPanel shows mood "neutral", escalation "Not needed." Then ask something angry like "This is the third time your store gave me the wrong part, I'm furious." → DebugPanel shows a frustrated/angry mood and "Escalation: Recommended" with a reason. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add components/RetrievalPanel.tsx components/DebugPanel.tsx app/page.tsx
git commit -m "feat: add retrieval and mood/escalation debug panels"
```

---

### Task 9: Error states, empty-key handling, and accessibility polish

**Files:**
- Modify: `components/Chat.tsx` (surface a friendly setup hint when the API key is missing)
- Modify: `app/page.tsx` (skip-to-content link + landmark roles)

**Interfaces:**
- Consumes: existing components.
- Produces: no new exported symbols; behavior/accessibility improvements only.

- [ ] **Step 1: Friendly missing-key message in `components/Chat.tsx`**

In the `catch` block of `send()`, map the known key error to a clearer hint. Replace the existing `catch` body with:
```tsx
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(
        msg.includes("ANTHROPIC_API_KEY")
          ? "The server is missing an Anthropic API key. Add ANTHROPIC_API_KEY to .env.local and restart."
          : msg,
      );
    } finally {
```

- [ ] **Step 2: Accessibility landmarks in `app/page.tsx`**

Add a skip link as the first child of `<main>` and give the chat/aside regions accessible labels. Add at the top of `<main>`:
```tsx
        <a
          href="#chat-input"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-white focus:px-3 focus:py-1 focus:ring-2 focus:ring-brand"
        >
          Skip to chat input
        </a>
```
Add `aria-label="Chat with Retail Assist"` to the chat `<section>` and `aria-label="Agent insight and sources"` to the `<aside>`.

- [ ] **Step 3: Manual verification**

Run `npm run dev` with NO `ANTHROPIC_API_KEY` set (temporarily rename `.env.local`). Send a message → the chat shows the friendly "missing an Anthropic API key" alert instead of a raw error. Restore `.env.local`. Tab through the page → the "Skip to chat input" link appears on focus and jumps to the input.

- [ ] **Step 4: Commit**

```bash
git add components/Chat.tsx app/page.tsx
git commit -m "feat: friendly missing-key message and accessibility polish"
```

---

### Task 10: README and manual test checklist

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: the whole project.
- Produces: setup/run docs, the "why local retrieval" rationale, the honest portfolio-demo note, and a manual test checklist. Deploy link left as a placeholder to fill after deployment.

- [ ] **Step 1: Write `README.md`**

Include these sections:
- **Retail Assist** — one-paragraph description: an AI support-agent demo for a fictional hardware chain, Cedar & Bolt Hardware. State clearly it is a portfolio demo, not a real company's tool, and uses only invented data.
- **Live demo** — `TODO: add Vercel URL after deploy`.
- **What it does** — chat support over a local markdown knowledge base, with a retrieval panel and a mood/escalation debug panel.
- **Tech stack** — Next.js (App Router), TypeScript, Tailwind, `@anthropic-ai/sdk` (Claude Sonnet), Vitest.
- **Why local keyword retrieval (not Bedrock)** — 2–3 sentences: the original quickstart used Amazon Bedrock Knowledge Bases; this uses a pure-TS BM25 search over markdown to cut setup friction and cost and to run from a clean clone with only an Anthropic key. Note embeddings/hybrid search as a documented future upgrade.
- **Setup** —
  ```bash
  cp .env.example .env.local   # add your ANTHROPIC_API_KEY
  npm install
  npm run dev                  # http://localhost:3000
  ```
  Note optional `ANTHROPIC_MODEL`.
- **Tests** — `npm test` (retrieval + prompt unit tests).
- **Manual test checklist:**
  1. Happy path: ask "What are your store hours?" → correct answer, hours doc shown in the retrieval panel.
  2. Unknown path: ask "Do you sell live plants for aquariums?" → the agent says it doesn't know and offers a human handoff; no fabricated policy.
  3. Escalation path: send a frustrated message (e.g., "This is the third wrong part, I'm furious") → mood shows frustrated/angry and escalation is Recommended.
  4. Missing-key path: unset `ANTHROPIC_API_KEY` → chat shows the friendly setup hint.
- **Deploy (Vercel)** — import the repo, set `ANTHROPIC_API_KEY` (and optional `ANTHROPIC_MODEL`) in project env vars, deploy. Note that `next.config.mjs` bundles the `knowledge-base/` folder for the API route.

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup, rationale, and manual test checklist"
```

---

## Deployment (manual, user-run)

Deployment to Vercel is performed by the user (requires their Vercel account). After deploy, fill the live URL into the README "Live demo" section and commit `docs: add live deploy link`.

## Self-Review Notes

- **Spec coverage:** architecture (Tasks 1,6,7,8), local keyword retrieval (Tasks 3,4), Anthropic single structured call (Task 5), KB content 7 docs/12 stores (Task 2), mood + escalation (Tasks 5,8), honesty/error handling (Tasks 5,9), tests (Tasks 3,4,5) + manual checklist (Task 10), README + rationale (Task 10), deploy notes (Task 10 + Deployment section). Streaming assumption intentionally revised to a single structured call (see Global Constraints) — documented as a future enhancement.
- **Type consistency:** `KbChunk`, `Mood`, `SupportResponse`, `CitedDoc`, `ChatApiResponse` defined once in `lib/types.ts` and reused; `RetrievalResult`/`Bm25Index` from `lib/retrieval.ts`; `getSupportResponse` / `buildSystemPrompt` / `buildIndex` / `search` / `loadKnowledgeBase` / `chunkMarkdown` signatures match across consuming tasks.
- **Placeholder scan:** the only intentional TODO is the post-deploy live URL in the README, which cannot be known until the user deploys.
