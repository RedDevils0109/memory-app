import { SHEET_COUNT } from "@/lib/memories";

export const PAGE_W = 1.28;
export const PAGE_H = 1.792;
export const PAGE_DEPTH = 0.0028;
export const COVER_DEPTH = 0.016;
export const COVER_SCALE = { w: 1.025, h: 1.035 };
export const SEGMENTS = 28;

export const isCoverSheet = (index: number) => index === 0 || index === SHEET_COUNT - 1;

const thickness = Array.from({ length: SHEET_COUNT }, (_, i) => (isCoverSheet(i) ? COVER_DEPTH : PAGE_DEPTH));
export const BOOK_THICKNESS = thickness.reduce((a, b) => a + b, 0);

/** z of a sheet's center when resting on the right stack (unturned). */
export const zRight = thickness.map((t, i) => thickness.slice(i + 1).reduce((a, b) => a + b, 0) + t / 2);
/** z of a sheet's center when resting on the left stack (turned). */
export const zLeft = thickness.map((t, i) => thickness.slice(0, i).reduce((a, b) => a + b, 0) + t / 2);

/** How many page positions a sheet is away from the currently visible spread. */
export function sheetDistance(index: number, current: number) {
  return index >= current ? index - current : current - 1 - index;
}
