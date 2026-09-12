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
