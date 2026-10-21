"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useBookStore } from "@/store/useBookStore";
import { CuteCat } from "./CuteCat";

export function LoadingScreen() {
  const ready = useBookStore((s) => s.ready);
  return (
    <AnimatePresence>
      {!ready && (
        <motion.div
          key="loading"
          className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-gradient-to-b from-[#ffe4ec] to-[#ffc2d4]"
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
        >
          <div className="flex items-end gap-3">
            <CuteCat className="animate-cat-bounce h-24 w-24 drop-shadow-lg" />
            <span className="animate-heart-run mb-6 text-4xl">💗</span>
          </div>
          <p className="mt-6 font-hand text-3xl text-[#c9184a]">Đang chuẩn bị kỷ niệm...</p>
          <div className="mt-4 h-2 w-48 overflow-hidden rounded-full bg-white/70">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#ff8fab] to-[#ff5d8f]"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
