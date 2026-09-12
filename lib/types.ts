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
