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
