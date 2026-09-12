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
