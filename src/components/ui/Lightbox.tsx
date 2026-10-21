"use client";

import useEmblaCarousel from "embla-carousel-react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { memories, type MediaItem, type MediaMemory } from "@/lib/memories";
import { useBookStore } from "@/store/useBookStore";
import { CuteCat } from "./CuteCat";

function MissingMedia({ kind }: { kind: MediaItem["kind"] }) {
  return (
    <div className="flex aspect-[4/5] w-[min(78vw,420px)] flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffe3ec] to-[#ffc2d4] text-[#c9184a]">
      <CuteCat mood="sleep" className="h-24 w-24" />
      <p className="mt-3 font-hand text-2xl">{kind === "video" ? "Video sắp có nè" : "Ảnh sắp có nè"} 💗</p>
    </div>
  );
}

function Slide({ item, active }: { item: MediaItem; active: boolean }) {
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!active) videoRef.current?.pause();
  }, [active]);

  return (
    <div className="flex h-full min-w-0 flex-[0_0_100%] items-center justify-center px-4">
      {failed ? (
        <MissingMedia kind={item.kind} />
      ) : item.kind === "video" ? (
        <video
          ref={videoRef}
          src={item.src}
          controls
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
          className="max-h-[62dvh] max-w-full rounded-2xl bg-black/10 shadow-2xl"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.src}
          alt=""
          draggable={false}
          onError={() => setFailed(true)}
          className="max-h-[62dvh] max-w-full select-none rounded-2xl border-[6px] border-white object-contain shadow-2xl"
        />
      )}
    </div>
  );
}

function Carousel({ memory, start }: { memory: MediaMemory; start: number }) {
  const [emblaRef, embla] = useEmblaCarousel({ startIndex: start, loop: false });
  const [selected, setSelected] = useState(start);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelected(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") embla?.scrollNext();
      if (e.key === "ArrowLeft") embla?.scrollPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [embla]);

  const many = memory.media.length > 1;

  return (
    <>
      <div className="relative w-full">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex h-[64dvh] touch-pan-y">
            {memory.media.map((item, i) => (
              <Slide key={`${item.src}-${i}`} item={item} active={i === selected} />
            ))}
          </div>
        </div>
        {many && (
          <>
            <button
              type="button"
              aria-label="Ảnh trước"
              onClick={() => embla?.scrollPrev()}
              disabled={selected === 0}
              className="glass absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-[#c9184a] disabled:opacity-30 sm:grid"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Ảnh sau"
              onClick={() => embla?.scrollNext()}
              disabled={selected === memory.media.length - 1}
              className="glass absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-[#c9184a] disabled:opacity-30 sm:grid"
            >
              ›
            </button>
          </>
        )}
      </div>
      {many && (
        <div className="mt-3 flex justify-center gap-2">
          {memory.media.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ảnh ${i + 1}`}
              onClick={() => embla?.scrollTo(i)}
              className={`text-sm transition ${i === selected ? "scale-125 opacity-100" : "opacity-40"}`}
            >
              💗
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export function Lightbox() {
  const lightbox = useBookStore((s) => s.lightbox);
  const close = useBookStore((s) => s.closeLightbox);
  const memory = lightbox ? memories[lightbox.memory] : null;

  const onDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (info.offset.y > 110 || info.velocity.y > 600) close();
    },
    [close],
  );

  return (
    <AnimatePresence>
      {lightbox && memory?.kind === "media" && (
        <motion.div
          key="lightbox"
          className="fixed inset-0 z-40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-[#ffd6e0]/60 backdrop-blur-md" onClick={close} />
          <motion.div
            className="relative flex w-full max-w-3xl flex-col items-center"
            initial={{ scale: 0.75, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            drag="y"
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Đóng"
              className="pink-button absolute -top-2 right-4 z-10 grid h-11 w-11 place-items-center rounded-full text-lg sm:right-6"
            >
              ✕
            </button>
            <Carousel memory={memory} start={lightbox.start} />
            <div className="glass mx-4 mt-3 max-w-xl rounded-3xl px-6 py-4 text-center">
              {memory.dateLabel && <p className="text-xs font-semibold uppercase tracking-widest text-[#ff5d8f]">♡ {memory.dateLabel}</p>}
              <p className="mt-1 font-hand text-2xl leading-snug text-[#7a2244] sm:text-3xl">{memory.caption}</p>
            </div>
            <p className="mt-2 text-xs text-[#9b3a5f]/70 sm:hidden">vuốt xuống để đóng</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
