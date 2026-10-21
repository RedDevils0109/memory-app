"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { Color, ExtrudeGeometry, InstancedMesh, Object3D, Shape } from "three";
import { memoryAtSpread } from "@/lib/memories";
import { useBookStore } from "@/store/useBookStore";
import { BOOK_THICKNESS, PAGE_H, PAGE_W } from "./dimensions";

let heartGeometry: ExtrudeGeometry | null = null;
export function getHeartGeometry() {
  if (heartGeometry) return heartGeometry;
  const s = new Shape();
  s.moveTo(0, 0.22);
  s.bezierCurveTo(0, 0.52, -0.52, 0.52, -0.52, 0.14);
  s.bezierCurveTo(-0.52, -0.16, -0.1, -0.3, 0, -0.5);
  s.bezierCurveTo(0.1, -0.3, 0.52, -0.16, 0.52, 0.14);
  s.bezierCurveTo(0.52, 0.52, 0, 0.52, 0, 0.22);
  heartGeometry = new ExtrudeGeometry(s, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 5,
    curveSegments: 18,
  });
  heartGeometry.center();
  return heartGeometry;
}

const COLORS = ["#FF8FAB", "#FF5D8F", "#FFC2D4", "#FFB3C8", "#F7A8C4", "#FFFFFF", "#FF7AA2"];

type Particle = {
  x: number;
  y: number;
  z: number;
  scale: number;
  speed: number;
  spin: number;
  phase: number;
};

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function FloatingHearts({ count = 36 }: { count?: number }) {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: count }, (_, i) => {
        const front = i % 6 === 0;
        return {
          x: front ? (Math.random() > 0.5 ? 1 : -1) * rand(2, 3.6) : rand(-6, 6),
          y: rand(-4, 4),
          z: front ? rand(0.4, 1.4) : rand(-6, -1.4),
          scale: front ? rand(0.08, 0.14) : rand(0.14, 0.38),
          speed: rand(0.08, 0.26),
          spin: rand(-0.6, 0.6),
          phase: rand(0, Math.PI * 2),
        };
      }),
    [count],
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const c = new Color();
    particles.forEach((_, i) => mesh.setColorAt(i, c.set(COLORS[i % COLORS.length])));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [particles]);

  useFrame((state, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    particles.forEach((p, i) => {
      p.y += p.speed * delta;
      if (p.y > 4.5) p.y = -4.5;
      dummy.position.set(p.x + Math.sin(t * 0.5 + p.phase) * 0.25, p.y, p.z);
      dummy.rotation.set(Math.sin(t * 0.7 + p.phase) * 0.3, t * p.spin + p.phase, Math.sin(t * 0.4 + p.phase) * 0.2);
      dummy.scale.setScalar(p.scale * (1 + Math.sin(t * 2 + p.phase) * 0.06));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[getHeartGeometry(), undefined, count]} frustumCulled={false}>
      <meshStandardMaterial roughness={0.25} metalness={0} emissive="#ff8fab" emissiveIntensity={0.3} />
    </instancedMesh>
  );
}

const marginX = () => (Math.random() > 0.5 ? rand(0.03, 0.15) : rand(PAGE_W - 0.15, PAGE_W - 0.03));

/** Small hearts that float up off the right page while a letter is open. */
export function PageHearts({ count = 14 }: { count?: number }) {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const level = useRef({ v: 0 });
  const particles = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: marginX(),
        life: Math.random(),
        speed: rand(0.12, 0.22),
        scale: rand(0.035, 0.07),
        phase: rand(0, Math.PI * 2),
      })),
    [count],
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const c = new Color();
    particles.forEach((_, i) => mesh.setColorAt(i, c.set(COLORS[i % 3])));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [particles]);

  useFrame((state, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    const st = useBookStore.getState();
    const active = memoryAtSpread(st.current)?.kind === "letter" && !st.drag && !st.lightbox;
    easing.damp(level.current, "v", active ? 1 : 0, 0.5, delta);
    const lv = level.current.v;
    mesh.visible = lv > 0.01;
    if (!mesh.visible) return;
    const t = state.clock.elapsedTime;
    particles.forEach((p, i) => {
      p.life += p.speed * delta;
      if (p.life > 1) {
        p.life = 0;
        p.x = marginX();
      }
      const y = -PAGE_H * 0.35 + p.life * PAGE_H * 0.95;
      const fade = Math.sin(Math.PI * p.life);
      dummy.position.set(p.x + Math.sin(t * 1.5 + p.phase) * 0.03, y, BOOK_THICKNESS + 0.04 + p.life * 0.25);
      dummy.rotation.set(0, Math.sin(t * 2 + p.phase) * 0.6, Math.sin(t + p.phase) * 0.25);
      dummy.scale.setScalar(p.scale * fade * lv + 1e-4);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[getHeartGeometry(), undefined, count]} frustumCulled={false}>
      <meshStandardMaterial roughness={0.3} emissive="#ff5d8f" emissiveIntensity={0.25} transparent opacity={0.92} />
    </instancedMesh>
  );
}
