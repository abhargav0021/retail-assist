"use client";

import { useState } from "react";
import { Chat, type LatestMeta } from "@/components/Chat";
import { DebugPanel } from "@/components/DebugPanel";
import { RetrievalPanel } from "@/components/RetrievalPanel";

export default function Home() {
  const [meta, setMeta] = useState<LatestMeta | null>(null);

  return (
    <main className="mx-auto flex h-screen max-w-6xl flex-col p-4">
      <a
        href="#chat-input"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-white focus:px-3 focus:py-1 focus:ring-2 focus:ring-brand"
      >
        Skip to chat input
      </a>
      <header className="mb-4">
        <h1 className="text-xl font-semibold text-brand-dark">Retail Assist</h1>
        <p className="text-sm text-gray-500">
          Cedar &amp; Bolt Hardware — customer support assistant
        </p>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-3">
        <section
          className="min-h-0 rounded-lg bg-gray-100 md:col-span-2"
          aria-label="Chat with Retail Assist"
        >
          <Chat onMeta={setMeta} />
        </section>
        <aside
          className="min-h-0 space-y-4 overflow-y-auto"
          aria-label="Agent insight and sources"
        >
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
      </div>
    </main>
  );
}
