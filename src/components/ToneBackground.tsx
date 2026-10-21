"use client";

import { motion } from "framer-motion";
import { endingTone, SHEET_COUNT } from "@/lib/memories";
import { useBookStore } from "@/store/useBookStore";

function mix(a: [number, number, number], b: [number, number, number], t: number) {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

const BRIGHT = { top: [255, 236, 242], mid: [255, 205, 220], bottom: [255, 168, 196] } as const;
const DUSK = { top: [246, 226, 238], mid: [222, 192, 220], bottom: [176, 140, 186] } as const;

export function ToneBackground() {
  const current = useBookStore((s) => s.current);
  const t = current >= SHEET_COUNT ? 1 : endingTone(current);
  const top = mix([...BRIGHT.top], [...DUSK.top], t);
  const mid = mix([...BRIGHT.mid], [...DUSK.mid], t);
  const bottom = mix([...BRIGHT.bottom], [...DUSK.bottom], t);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      animate={{
        background: `radial-gradient(120% 90% at 50% 35%, ${top} 0%, ${mid} 55%, ${bottom} 100%)`,
      }}
      transition={{ duration: 2.2, ease: "easeInOut" }}
    />
  );
}
