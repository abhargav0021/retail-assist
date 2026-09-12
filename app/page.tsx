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
