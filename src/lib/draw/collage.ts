/** Page layout units: every page is 1000 x 1400, scaled to the canvas size. */
export const PAGE_UNITS = { w: 1000, h: 1400 };

export type Slot = { cx: number; cy: number; w: number; h: number; rot: number };

const deg = (d: number) => (d * Math.PI) / 180;

const LAYOUTS: Record<number, Slot[]> = {
  1: [{ cx: 500, cy: 640, w: 760, h: 900, rot: deg(-2) }],
  2: [
    { cx: 385, cy: 420, w: 560, h: 610, rot: deg(-5) },
    { cx: 615, cy: 930, w: 560, h: 610, rot: deg(4) },
  ],
  3: [
    { cx: 500, cy: 385, w: 620, h: 570, rot: deg(-2) },
    { cx: 285, cy: 950, w: 450, h: 490, rot: deg(-6) },
    { cx: 715, cy: 960, w: 450, h: 490, rot: deg(5) },
  ],
  4: [
    { cx: 280, cy: 395, w: 430, h: 500, rot: deg(-5) },
    { cx: 720, cy: 405, w: 430, h: 500, rot: deg(4) },
    { cx: 285, cy: 935, w: 430, h: 500, rot: deg(3) },
    { cx: 715, cy: 945, w: 430, h: 500, rot: deg(-4) },
  ],
  5: [
    { cx: 270, cy: 330, w: 400, h: 440, rot: deg(-6) },
    { cx: 730, cy: 320, w: 400, h: 440, rot: deg(5) },
    { cx: 270, cy: 1040, w: 400, h: 440, rot: deg(4) },
    { cx: 730, cy: 1050, w: 400, h: 440, rot: deg(-5) },
    { cx: 500, cy: 690, w: 450, h: 490, rot: deg(-1) },
  ],
};

function gridLayout(count: number): Slot[] {
  const cols = 3;
  const rows = Math.ceil(count / cols);
  const cellW = 900 / cols;
  const cellH = 1100 / rows;
  return Array.from({ length: count }, (_, i) => ({
    cx: 50 + cellW * ((i % cols) + 0.5),
    cy: 110 + cellH * (Math.floor(i / cols) + 0.5),
    w: cellW * 0.9,
    h: Math.min(cellH * 0.9, cellW * 1.1),
    rot: deg(((i * 37) % 9) - 4),
  }));
}

export function collageSlots(count: number): Slot[] {
  return LAYOUTS[count] ?? gridLayout(count);
}

/** Returns the media index under a point in page units (topmost slot wins), or -1. */
export function hitTestSlots(count: number, px: number, py: number): number {
  const slots = collageSlots(count);
  for (let i = slots.length - 1; i >= 0; i--) {
    const s = slots[i];
    const dx = px - s.cx;
    const dy = py - s.cy;
    const cos = Math.cos(-s.rot);
    const sin = Math.sin(-s.rot);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    if (Math.abs(lx) <= s.w / 2 && Math.abs(ly) <= s.h / 2) return i;
  }
  return -1;
}
