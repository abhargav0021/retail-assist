# Retail Assist — Design Spec

**Date:** 2026-09-12
**Status:** Approved for planning
**Type:** Portfolio demo project

## What this is

Retail Assist is an AI customer-support agent for a fictional multi-location
retail business, **Cedar & Bolt Hardware** (a regional home-improvement /
hardware chain with 12 stores across the Dallas–Fort Worth and Austin metros).

It is a personal portfolio project — not built for or affiliated with any real
company. No real business name, logo, or private data appears anywhere. The
project is inspired by Anthropic's `customer-support-agent` quickstart but is
built from scratch as an original codebase.

**Goal:** read as "a working tool a real operations team could hand to store
staff," prioritizing clarity and business usefulness over technical cleverness.

## Constraints (fixed decisions)

- **Stack:** Next.js (App Router) + TypeScript. Chat UI, thinking/debug panel,
  and mood-detection/escalation feature are kept from the original concept.
- **Model API:** call the Anthropic API directly via `ANTHROPIC_API_KEY`, using
  Claude Sonnet by default. No other model providers.
- **Retrieval:** local, no managed services. **Keyword search** (BM25/TF-IDF-style
  lexical scorer) in pure TypeScript over a folder of markdown documents. No
  external embedding API, no model downloads. Embeddings documented as a future
  upgrade in the README.
- **No** authentication, payments, chat persistence, or any paid service beyond
  the Anthropic API.
- Must run from a clean clone with only `ANTHROPIC_API_KEY` set
  (`npm install && npm run dev`).
- Deploy target: Vercel (public URL).

## Git setup

The project lives in its own fresh git repository initialized inside the
`Project 4` directory (independent of the surrounding home-directory repo).
Work proceeds in small, logical commits with clear messages.

## Architecture

Single Next.js App Router application deployable to Vercel with only
`ANTHROPIC_API_KEY`.

### Frontend
One page with three zones:
- **Chat (center):** message thread + input. Streaming assistant responses.
- **Retrieval panel:** shows which KB document chunks were used to answer.
- **Thinking/debug panel:** detected user mood, escalation flag + reason, and
  the model's brief reasoning.

Clean, accessible, non-technical-friendly. Readable contrast, keyboard
navigation preserved.

### Backend
One API route (`/api/chat`) that:
1. Runs local keyword retrieval over the markdown KB.
2. Calls Claude Sonnet **once** with the retrieved context + conversation.
3. Returns the answer **plus structured metadata** (mood, escalation
   recommendation, cited docs) in a single response.

**Structural choice — single call vs. multi-call:** use **one Claude call**
that returns both the reply and the mood/escalation classification via
structured output (tool-use / JSON). Cheaper, simpler, lower-latency than a
separate classification call; accuracy is sufficient for a demo. A second
mood-only call was rejected as not worth the 2× cost/latency.

### Retrieval module
Pure-TypeScript module that loads and chunks the markdown KB at startup and
ranks chunks with a BM25/TF-IDF-style scorer. No external services. Returns
top-K chunks with source document attribution.

## Data flow

```
User message
  -> /api/chat
  -> retrieve top-K chunks from markdown KB
  -> build system prompt (persona + policies + retrieved context
     + explicit "say what you don't know" instruction)
  -> Claude Sonnet (streaming reply + structured metadata)
  -> { reply, mood, escalate, escalateReason, citedDocs }
  -> UI renders: reply in chat, docs in retrieval panel,
     mood/escalation in debug panel
```

## Knowledge base content (`/knowledge-base/*.md`)

Written plain and ops-like — specific, slightly imperfect, not marketing copy:

- `locations-and-hours.md` — 12 stores across DFW + Austin metros, with hours.
- `products-and-services.md` — tool rental, paint mixing, key cutting, propane.
- `returns-and-warranties.md` — returns window, receipts, warranty handling.
- `repairs.md` — power-tool repair intake and turnaround.
- `orders-pickup-financing.md` — order status, curbside/in-store pickup, financing.
- `contractor-pro-desk.md` — pro accounts, bulk/special orders.
- `escalation-policy.md` — when and how to hand off to a human.

## Mood detection & escalation

Claude classifies each user turn's mood (e.g., neutral / confused / frustrated /
angry). It sets `escalate: true` when:
- mood is frustrated or angry, **or**
- the topic matches the escalation policy (e.g., safety issues, billing
  disputes, legal matters).

When escalating, the reply offers a human handoff per the escalation policy.
The debug panel shows the detected mood and the escalation reason.

## Error handling & honesty

- **Low/no retrieval match:** the agent explicitly states it doesn't have that
  information and offers escalation rather than inventing an answer.
- **Missing API key:** clear setup error message.
- **API failure:** graceful UI error message, no crash.

## Testing

- **Unit tests** for the retrieval scorer: known query → expected top document(s).
- **Manual test checklist** in the README covering:
  - Happy path (answerable question returns correct, cited answer).
  - Unknown-question path (agent admits it doesn't know, offers escalation).
  - Frustrated-user path (mood detected → escalation offered).

## Deliverables / Definition of done

1. `npm install && npm run dev` works from a clean clone with only
   `ANTHROPIC_API_KEY`.
2. Agent answers realistic questions correctly from the fictional KB and
   gracefully says what it doesn't know.
3. Mood-detection/escalation feature works.
4. README explains the project, is honest that it's a portfolio demo (not a real
   company's tool), documents why local keyword retrieval instead of Bedrock,
   gives setup/run instructions, and includes a live deploy link once deployed.
5. Deployed to a public URL (Vercel), with required env vars noted in README.

## Assumptions

- **Streaming responses** are included (better UX).
- **No chat persistence** — session-only state, matching the no-auth/no-extra-
  services constraint.

## Out of scope

- Authentication, payments, user accounts.
- Real business data or branding.
- External vector databases, managed retrieval services, or non-Anthropic model
  providers.
