"use client";

import { useDrag } from "@use-gesture/react";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useBookStore } from "@/store/useBookStore";

const Experience = dynamic(() => import("./three/Experience"), { ssr: false });

const COMMIT_THRESHOLD = 0.35;
const PAN_THRESHOLD = 45;

export function BookStage() {
  const mode = useRef<"flip" | "pan" | null>(null);
  const dirRef = useRef<1 | -1>(1);

  useEffect(() => {
    const update = () => useBookStore.getState().setPortrait(window.innerWidth / window.innerHeight < 0.85);
    update();
    window.addEventListener("resize", update);
    const fallback = setTimeout(() => useBookStore.getState().setReady(), 9000);
    return () => {
      window.removeEventListener("resize", update);
      clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = useBookStore.getState();
      if (e.key === "Escape") return st.closeLightbox();
      if (st.lightbox || !st.unlocked) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") st.forward();
      if (e.key === "ArrowLeft" || e.key === "PageUp") st.backward();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const bind = useDrag(
    ({ first, last, movement: [mx], swipe: [sx], cancel, tap }) => {
      if (tap) return;
      const st = useBookStore.getState();
      if (!st.unlocked || st.lightbox) {
        cancel();
        return;
      }

      if (first) {
        dirRef.current = mx < 0 ? 1 : -1;
        mode.current = st.beginDrag(dirRef.current);
      }
      const dir = dirRef.current;
      const pageWidthPx = window.innerWidth * (st.portrait ? 0.8 : 0.36);
      const progress = Math.max(0, (-mx * dir) / pageWidthPx);

      if (mode.current === "flip") {
        st.updateDrag(progress);
        if (last) {
          const flicked = sx === -dir;
          st.endDrag(progress > COMMIT_THRESHOLD || flicked);
        }
      } else if (mode.current === "pan" && last) {
        if (Math.abs(mx) > PAN_THRESHOLD || sx !== 0) {
          if (dir === 1) st.forward();
          else st.backward();
        }
      }
      if (last) mode.current = null;
    },
    { axis: "x", filterTaps: true, threshold: 6, pointer: { touch: true } },
  );

  return (
    <div {...bind()} className="book-stage absolute inset-0">
      <Experience />
    </div>
  );
}
