# Retail Assist

Retail Assist is an AI customer-support assistant demo for **Cedar & Bolt
Hardware**, a *fictional* regional hardware chain with 12 stores across the
Dallas–Fort Worth and Austin metro areas. It answers customer questions about
hours, returns, tool rental, repairs, pickup, and financing from a small local
knowledge base, and it flags when a conversation should be handed off to a
human.

> This is a personal **portfolio demo** — it is not built for, affiliated with,
> or endorsed by any real company. Every store, policy, price, and phone number
> is invented for the demo.

## Live demo

**https://retail-assist-six.vercel.app**

## What it does

- **Chat support** grounded in a folder of markdown knowledge-base documents.
- **Retrieval panel** showing which knowledge-base sections were used to answer.
- **Mood & escalation panel** ("Agent insight") showing the detected customer
  mood and whether the agent recommends escalating to a human — with the reason.
- **Honest fallbacks:** when the knowledge base doesn't cover a question, the
  agent says so and offers a handoff instead of inventing an answer.

## Tech stack

- **Next.js (App Router) + TypeScript** — UI and the `/api/chat` route.
- **Tailwind CSS** — styling.
- **`@anthropic-ai/sdk`** — a single Claude call (default `claude-sonnet-4-6`)
  using tool-use to return the reply plus structured mood/escalation/citation
  metadata.
- **Pure-TypeScript BM25 retrieval** — no external services.
- **Vitest** — unit tests for the chunker, retrieval scorer, and prompt builder.

## Why local keyword retrieval (not Bedrock)

The project this demo is modeled on used Amazon Bedrock Knowledge Bases for
retrieval. That adds an AWS account, managed infrastructure, and cost — a lot of
friction for a small portfolio project. Instead, Retail Assist uses a
pure-TypeScript **BM25 keyword search** over a folder of markdown documents. It
runs from a clean clone with only an Anthropic API key, has no cold-start model
downloads, and deploys cleanly to Vercel. For a curated knowledge base of this
size, keyword search is accurate enough. Semantic (embedding) search or a hybrid
keyword-plus-embedding approach is a natural future upgrade if the knowledge
base grows.

## Setup

```bash
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm install
npm run dev                  # http://localhost:3000
```

Environment variables:

- `ANTHROPIC_API_KEY` (required) — your Anthropic API key.
- `ANTHROPIC_MODEL` (optional) — override the default `claude-sonnet-4-6`.

## Tests

```bash
npm test
```

Runs the unit tests for the markdown chunker, the BM25 retrieval scorer, and the
system-prompt builder.

## Manual test checklist

With `ANTHROPIC_API_KEY` set and `npm run dev` running:

1. **Happy path:** ask "What are your store hours?" → you get correct hours, and
   the retrieval panel lists the "Store Locations & Hours" document.
2. **Unknown path:** ask "Do you sell live plants for aquariums?" → the agent
   says it doesn't have that information and offers a human handoff; it does not
   invent a policy.
3. **Escalation path:** send a frustrated message (e.g. "This is the third time
   your store gave me the wrong part, I'm furious") → the Agent insight panel
   shows a frustrated/angry mood and "Escalation: Recommended" with a reason.
4. **Missing-key path:** unset `ANTHROPIC_API_KEY` and restart → sending a
   message shows a friendly "missing an Anthropic API key" hint instead of a raw
   error.

## Knowledge base

The knowledge base is plain markdown in `knowledge-base/`. Each file starts with
a single `#` title and uses `##` section headings; the app splits documents into
one retrievable chunk per `##` section. To change what the agent knows, edit or
add markdown files there — no code changes needed.

## Deploy (Vercel)

1. Push the repo to GitHub and import it into Vercel.
2. Set `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`) in the Vercel
   project's environment variables.
3. Deploy.

`next.config.mjs` uses `outputFileTracingIncludes` to bundle the
`knowledge-base/` folder with the `/api/chat` serverless function so retrieval
works in production.
