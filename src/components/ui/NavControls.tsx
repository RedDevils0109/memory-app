"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SITE_TITLE } from "@/config";
import { MEMORY_COUNT, SHEET_COUNT } from "@/lib/memories";
import { detectMusic, pauseMusic, playMusic } from "@/lib/music";
import { useBookStore } from "@/store/useBookStore";
import { CuteCat } from "./CuteCat";

function RoundButton({
  onClick,
  label,
  disabled,
  children,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="pink-button grid h-12 w-12 place-items-center rounded-full text-lg disabled:pointer-events-none disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      {dir === "left" ? <path d="M15 5l-7 7 7 7" /> : <path d="M9 5l7 7-7 7" />}
    </svg>
  );
}

export function NavControls() {
  const unlocked = useBookStore((s) => s.unlocked);
  const current = useBookStore((s) => s.current);
  const lightbox = useBookStore((s) => s.lightbox);
  const musicAvailable = useBookStore((s) => s.musicAvailable);
  const musicOn = useBookStore((s) => s.musicOn);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    void detectMusic().then((ok) => useBookStore.getState().setMusic({ musicAvailable: ok }));
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    const show = setTimeout(() => setHint(true), 1800);
    const hide = setTimeout(() => setHint(false), 7500);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [unlocked]);

  const { forward, backward, goTo, setMusic } = useBookStore.getState();
  const atEnd = current >= SHEET_COUNT;
  const label = current === 0 ? "Bìa" : atEnd ? "Hết rồi" : `${current} / ${MEMORY_COUNT}`;

  const toggleMusic = () => {
    if (musicOn) {
      pauseMusic();
      setMusic({ musicOn: false });
    } else {
      void playMusic().then((ok) => setMusic({ musicOn: ok }));
    }
  };

  return (
    <AnimatePresence>
      {unlocked && !lightbox && (
        <motion.div key="nav" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 1 } }} exit={{ opacity: 0 }}>
          <div className="fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-20 flex gap-2">
            {musicAvailable && (
              <button
                type="button"
                onClick={toggleMusic}
                aria-label={musicOn ? "Tắt nhạc" : "Bật nhạc"}
                className="glass grid h-11 w-11 place-items-center rounded-full text-lg"
              >
                {musicOn ? "🎵" : "🔇"}
              </button>
            )}
            <button
              type="button"
              onClick={() => goTo(0)}
              aria-label="Về bìa"
              title="Về bìa"
              className="glass grid h-11 w-11 place-items-center rounded-full text-lg"
            >
              📕
            </button>
          </div>

          <div className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 flex items-center justify-center gap-3">
            <RoundButton onClick={backward} label="Trang trước" disabled={current === 0}>
              <Arrow dir="left" />
            </RoundButton>
            <div className="glass flex min-w-[132px] flex-col items-center rounded-full px-5 py-2">
              <span className="text-sm font-semibold text-[#c9184a]">💗 {label}</span>
              <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-[#ffd6e0]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#ff8fab] to-[#ff5d8f]"
                  animate={{ width: `${(current / SHEET_COUNT) * 100}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                />
              </div>
            </div>
            <RoundButton onClick={forward} label="Trang sau" disabled={atEnd}>
              <Arrow dir="right" />
            </RoundButton>
          </div>

          <AnimatePresence>
            {hint && (
              <motion.div
                key="hint"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="glass fixed inset-x-0 bottom-24 z-20 mx-auto w-fit max-w-[90vw] rounded-full px-5 py-2 text-center text-sm text-[#9b3a5f]"
              >
                Kéo hoặc vuốt trang để lật 💗 Chạm vào ảnh để xem nha
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {atEnd && (
              <motion.div
                key="end"
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 1.2, duration: 0.8 } }}
                exit={{ opacity: 0 }}
                className="glass fixed inset-x-0 top-[max(1.5rem,env(safe-area-inset-top))] z-20 mx-auto flex w-fit items-center gap-3 rounded-full py-2 pl-2 pr-5"
              >
                <CuteCat mood="sleep" className="h-10 w-10" />
                <div className="text-left">
                  <p className="font-title text-xl leading-tight text-[#ff5d8f]">{SITE_TITLE}</p>
                  <p className="text-xs text-[#9b3a5f]">21.10.2026</p>
                </div>
                <button type="button" onClick={() => goTo(1)} className="pink-button ml-2 rounded-full px-4 py-2 text-sm font-semibold">
                  Đọc lại từ đầu 💗
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
