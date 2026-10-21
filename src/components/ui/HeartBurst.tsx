"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

const HEARTS = ["💗", "💖", "💕", "🌸", "💞", "🎀"];

export function HeartBurst({ count = 30 }: { count?: number }) {
  const parts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const dist = 160 + Math.random() * 260;
        return {
          emoji: HEARTS[i % HEARTS.length],
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          size: 22 + Math.random() * 26,
          rotate: Math.random() * 120 - 60,
          delay: Math.random() * 0.15,
        };
      }),
    [count],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      {parts.map((p, i) => (
        <motion.span
          key={i}
          className="absolute select-none"
          style={{ fontSize: p.size }}
          initial={{ x: 0, y: 0, scale: 0.2, opacity: 1 }}
          animate={{ x: p.x, y: p.y, scale: 1, opacity: 0, rotate: p.rotate }}
          transition={{ duration: 1.4, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  );
}
