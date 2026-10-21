"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { easing } from "maath";
import { Group, MeshPhysicalMaterial, MeshStandardMaterial } from "three";
import { memoryAtSpread, SHEET_COUNT } from "@/lib/memories";
import { hitTestSlots, PAGE_UNITS } from "@/lib/draw/collage";
import { createPlaceholderTexture } from "@/lib/pageTexture";
import { useBookStore } from "@/store/useBookStore";
import { BOOK_THICKNESS, COVER_SCALE, PAGE_H, PAGE_W } from "./dimensions";
import { PageHearts } from "./FloatingHearts";
import { Sheet } from "./Sheet";

const TAP_TOLERANCE = 8;

export function Book() {
  const outer = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const wobble = useRef(0);

  const materials = useMemo(
    () => ({
      edge: new MeshStandardMaterial({ color: "#FFF6F0", roughness: 0.95 }),
      coverEdge: new MeshPhysicalMaterial({ color: "#F2668F", roughness: 0.45, clearcoat: 0.5 }),
      spine: new MeshPhysicalMaterial({ color: "#E85A86", roughness: 0.4, clearcoat: 0.6 }),
      paper: createPlaceholderTexture("paper"),
      leather: createPlaceholderTexture("leather"),
    }),
    [],
  );

  useEffect(
    () => () => {
      materials.edge.dispose();
      materials.coverEdge.dispose();
      materials.spine.dispose();
      materials.paper.dispose();
      materials.leather.dispose();
    },
    [materials],
  );

  useEffect(
    () =>
      useBookStore.subscribe((s, prev) => {
        if (s.wrongAttempts !== prev.wrongAttempts) wobble.current = 1;
      }),
    [],
  );

  useFrame((state, delta) => {
    const st = useBookStore.getState();
    const t = state.clock.elapsedTime;
    if (inner.current) {
      const offset = st.current === 0 ? -PAGE_W / 2 : st.current === SHEET_COUNT ? PAGE_W / 2 : 0;
      easing.damp(inner.current.position, "x", offset, 0.45, delta);
    }
    if (!outer.current) return;
    const px = st.portrait ? 0 : state.pointer.x;
    const py = st.portrait ? 0 : state.pointer.y;
    const targetRotY = st.unlocked ? px * 0.06 : -0.38 + Math.sin(t * 0.6) * 0.06;
    const targetRotX = st.unlocked ? -0.2 + py * 0.04 : -0.12 + Math.sin(t * 0.8) * 0.03;
    easing.damp(outer.current.rotation, "y", targetRotY, 0.6, delta);
    easing.damp(outer.current.rotation, "x", targetRotX, 0.6, delta);
    wobble.current = Math.max(0, wobble.current - delta * 1.6);
    outer.current.rotation.z = Math.sin(t * 38) * 0.05 * wobble.current;
    outer.current.position.y = Math.sin(t * 1.1) * (st.unlocked ? 0.015 : 0.04);
  });

  const handleTap = (side: "left" | "right") => (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > TAP_TOLERANCE) return;
    const st = useBookStore.getState();
    if (!st.unlocked || st.lightbox || st.drag) return;
    const memory = memoryAtSpread(st.current);
    if (!memory || memory.kind !== "media") return;
    e.stopPropagation();
    if (side === "right" || !e.uv) {
      st.openLightbox(memory.index, 0);
      return;
    }
    const hit = hitTestSlots(memory.media.length, e.uv.x * PAGE_UNITS.w, (1 - e.uv.y) * PAGE_UNITS.h);
    st.openLightbox(memory.index, Math.max(0, hit));
  };

  const hover = (on: boolean) => () => {
    const st = useBookStore.getState();
    const memory = memoryAtSpread(st.current);
    document.body.style.cursor = on && st.unlocked && memory?.kind === "media" ? "pointer" : "";
  };

  const sheets = useMemo(() => Array.from({ length: SHEET_COUNT }, (_, i) => i), []);

  return (
    <group ref={outer}>
      <group ref={inner}>
        {sheets.map((i) => (
          <Sheet
            key={i}
            index={i}
            edgeMaterial={materials.edge}
            coverEdgeMaterial={materials.coverEdge}
            paperPlaceholder={materials.paper}
            leatherPlaceholder={materials.leather}
          />
        ))}

        <mesh position={[-0.006, 0, BOOK_THICKNESS / 2]} material={materials.spine} castShadow>
          <boxGeometry args={[0.012, PAGE_H * COVER_SCALE.h, BOOK_THICKNESS]} />
        </mesh>

        {(["left", "right"] as const).map((side) => (
          <mesh
            key={side}
            position={[side === "left" ? -PAGE_W / 2 : PAGE_W / 2, 0, BOOK_THICKNESS + 0.02]}
            onClick={handleTap(side)}
            onPointerOver={hover(true)}
            onPointerOut={hover(false)}
          >
            <planeGeometry args={[PAGE_W, PAGE_H]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
          </mesh>
        ))}

        <PageHearts />
      </group>
    </group>
  );
}
