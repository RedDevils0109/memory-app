"use client";

import { useEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import { loadCanvasFonts } from "@/lib/fonts";
import { pageFor } from "@/lib/memories";
import {
  cancelTextureJob,
  createPageTexture,
  scheduleTextureJob,
  type PageTextureHandle,
} from "@/lib/pageTexture";
import { useBookStore } from "@/store/useBookStore";
import { sheetDistance } from "./dimensions";

export function usePageTexture(sheet: number, side: "front" | "back", want: boolean, keep: boolean) {
  const gl = useThree((s) => s.gl);
  const [handle, setHandle] = useState<PageTextureHandle | null>(null);
  const handleRef = useRef<PageTextureHandle | null>(null);
  handleRef.current = handle;
  const key = `${sheet}-${side}`;

  useEffect(() => {
    if (!want || handleRef.current) return;
    let cancelled = false;
    scheduleTextureJob({
      key,
      priority: () => sheetDistance(sheet, useBookStore.getState().current) + (side === "back" ? 0.1 : 0),
      run: async () => {
        await loadCanvasFonts();
        if (cancelled) return;
        const created = await createPageTexture(pageFor(sheet, side));
        if (cancelled) {
          created.dispose();
          return;
        }
        created.texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
        setHandle(created);
      },
    });
    return () => {
      cancelled = true;
      cancelTextureJob(key);
    };
  }, [want, key, sheet, side, gl]);

  useEffect(() => {
    if (keep || !handle) return;
    setHandle(null);
    setTimeout(() => handle.dispose(), 200);
  }, [keep, handle]);

  useEffect(() => () => handleRef.current?.dispose(), []);

  return handle;
}
