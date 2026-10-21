import raw from "../../data.json";
import { MEDIA_BASE } from "@/config";

type RawLetter = { type: "letter"; content: string };
type RawMedia = { type: "media"; content: string[]; date?: string; caption?: string };
type RawEntry = RawLetter | RawMedia;

export type MediaItem = { kind: "image" | "video"; src: string };

export type LetterMemory = {
  kind: "letter";
  index: number;
  text: string;
};

export type MediaMemory = {
  kind: "media";
  index: number;
  media: MediaItem[];
  caption: string;
  dateLabel: string | null;
  dateShort: string | null;
};

export type Memory = LetterMemory | MediaMemory;

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)$/i;

export function toPublicPath(path: string): string {
  return path;
}

function parseDate(raw?: string): { label: string; short: string } | null {
  if (!raw || !/^\d{8}$/.test(raw)) return null;
  const d = Number(raw.slice(0, 2));
  const m = Number(raw.slice(2, 4));
  const y = raw.slice(4);
  return {
    label: `${d} tháng ${m}, ${y}`,
    short: `${raw.slice(0, 2)}.${raw.slice(2, 4)}.${y}`,
  };
}

export const memories: Memory[] = (raw as RawEntry[]).map((entry, index) => {
  if (entry.type === "letter") {
    return { kind: "letter", index, text: entry.content.trim() };
  }
  const date = parseDate(entry.date);
  return {
    kind: "media",
    index,
    media: entry.content.map((p) => ({
      kind: VIDEO_EXT.test(p) ? "video" : "image",
      src: toPublicPath(p),
    })),
    caption: (entry.caption ?? "").trim(),
    dateLabel: date?.label ?? null,
    dateShort: date?.short ?? null,
  };
});

export const MEMORY_COUNT = memories.length;

/**
 * Sheet i: front = right page of memory i-1 (sheet 0 front = cover),
 * back = left page of memory i (last sheet back = back cover).
 * `current` = number of turned sheets; 0 = closed on the cover,
 * SHEET_COUNT = closed on the back cover, otherwise spread of memory current-1.
 */
export const SHEET_COUNT = MEMORY_COUNT + 1;

export type PageSpec =
  | { kind: "cover" }
  | { kind: "backCover" }
  | { kind: "mediaLeft"; memory: MediaMemory }
  | { kind: "mediaRight"; memory: MediaMemory }
  | { kind: "letterLeft"; memory: LetterMemory }
  | { kind: "letterRight"; memory: LetterMemory; final: boolean };

export function pageFor(sheet: number, side: "front" | "back"): PageSpec {
  if (side === "front") {
    if (sheet === 0) return { kind: "cover" };
    const memory = memories[sheet - 1];
    return memory.kind === "media"
      ? { kind: "mediaRight", memory }
      : { kind: "letterRight", memory, final: memory.index === MEMORY_COUNT - 1 };
  }
  if (sheet === SHEET_COUNT - 1) return { kind: "backCover" };
  const memory = memories[sheet];
  return memory.kind === "media" ? { kind: "mediaLeft", memory } : { kind: "letterLeft", memory };
}

export function memoryAtSpread(current: number): Memory | null {
  if (current <= 0 || current >= SHEET_COUNT) return null;
  return memories[current - 1];
}

/** 0 for most of the book, easing to 1 over the last few spreads. */
export function endingTone(current: number): number {
  const start = MEMORY_COUNT - 5;
  const t = (current - start) / 5;
  return Math.min(1, Math.max(0, t));
}
