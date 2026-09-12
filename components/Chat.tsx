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
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(
        msg.includes("ANTHROPIC_API_KEY")
          ? "The server is missing an Anthropic API key. Add ANTHROPIC_API_KEY to .env.local and restart."
          : msg,
      );
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
