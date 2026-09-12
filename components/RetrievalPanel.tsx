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
