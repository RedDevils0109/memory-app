import { create } from "zustand";
import { SHEET_COUNT } from "@/lib/memories";

export type Side = "left" | "right";
export type DragState = { sheet: number; dir: 1 | -1; progress: number };

interface BookState {
  ready: boolean;
  unlocked: boolean;
  current: number;
  focus: Side;
  portrait: boolean;
  drag: DragState | null;
  lightbox: { memory: number; start: number } | null;
  wrongAttempts: number;
  musicAvailable: boolean;
  musicOn: boolean;

  setReady: () => void;
  setPortrait: (portrait: boolean) => void;
  registerWrong: () => void;
  unlock: () => void;
  forward: () => void;
  backward: () => void;
  goTo: (target: number) => void;
  beginDrag: (dir: 1 | -1) => "flip" | "pan" | null;
  updateDrag: (progress: number) => void;
  endDrag: (commit: boolean) => void;
  openLightbox: (memory: number, start?: number) => void;
  closeLightbox: () => void;
  setMusic: (patch: Partial<Pick<BookState, "musicAvailable" | "musicOn">>) => void;
}

let jumpTimer: ReturnType<typeof setInterval> | null = null;
const stopJump = () => {
  if (jumpTimer) clearInterval(jumpTimer);
  jumpTimer = null;
};

const isOpen = (current: number) => current > 0 && current < SHEET_COUNT;

export const useBookStore = create<BookState>()((set, get) => ({
  ready: false,
  unlocked: false,
  current: 0,
  focus: "left",
  portrait: false,
  drag: null,
  lightbox: null,
  wrongAttempts: 0,
  musicAvailable: false,
  musicOn: false,

  setReady: () => set({ ready: true }),
  setPortrait: (portrait) => set({ portrait }),
  registerWrong: () => set((s) => ({ wrongAttempts: s.wrongAttempts + 1 })),

  unlock: () => {
    set({ unlocked: true });
    setTimeout(() => get().goTo(1), 900);
  },

  forward: () => {
    const { current, focus, portrait, unlocked, drag } = get();
    if (!unlocked || drag) return;
    stopJump();
    if (portrait && isOpen(current) && focus === "left") {
      set({ focus: "right" });
      return;
    }
    if (current < SHEET_COUNT) set({ current: current + 1, focus: "left" });
  },

  backward: () => {
    const { current, focus, portrait, unlocked, drag } = get();
    if (!unlocked || drag) return;
    stopJump();
    if (portrait && isOpen(current) && focus === "right") {
      set({ focus: "left" });
      return;
    }
    if (current > 0) set({ current: current - 1, focus: "right" });
  },

  goTo: (target) => {
    stopJump();
    const clamped = Math.max(0, Math.min(SHEET_COUNT, target));
    const step = () => {
      const { current } = get();
      if (current === clamped) {
        stopJump();
        return;
      }
      const forward = clamped > current;
      set({ current: current + (forward ? 1 : -1), focus: forward ? "left" : "right" });
    };
    step();
    jumpTimer = setInterval(step, 110);
  },

  beginDrag: (dir) => {
    const { current, focus, portrait, unlocked, lightbox } = get();
    if (!unlocked || lightbox) return null;
    stopJump();
    if (dir === 1) {
      if (current >= SHEET_COUNT) return null;
      if (portrait && isOpen(current) && focus === "left") return "pan";
      set({ drag: { sheet: current, dir, progress: 0 } });
      return "flip";
    }
    if (current <= 0) return null;
    if (portrait && isOpen(current) && focus === "right") return "pan";
    set({ drag: { sheet: current - 1, dir, progress: 0 } });
    return "flip";
  },

  updateDrag: (progress) => {
    const { drag } = get();
    if (!drag) return;
    set({ drag: { ...drag, progress: Math.max(0, Math.min(1, progress)) } });
  },

  endDrag: (commit) => {
    const { drag, current } = get();
    if (!drag) return;
    if (!commit) {
      set({ drag: null });
      return;
    }
    set({
      drag: null,
      current: current + drag.dir,
      focus: drag.dir === 1 ? "left" : "right",
    });
  },

  openLightbox: (memory, start = 0) => set({ lightbox: { memory, start } }),
  closeLightbox: () => set({ lightbox: null }),
  setMusic: (patch) => set(patch),
}));
