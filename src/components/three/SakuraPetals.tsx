"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { Color, DoubleSide, InstancedMesh, Object3D, Shape, ShapeGeometry } from "three";
import { endingTone, SHEET_COUNT } from "@/lib/memories";
import { useBookStore } from "@/store/useBookStore";

const MAX = 140;

function petalGeometry() {
  const s = new Shape();
  s.moveTo(0, -0.5);
  s.bezierCurveTo(0.45, -0.25, 0.4, 0.35, 0.1, 0.5);
  s.lineTo(0, 0.4);
  s.lineTo(-0.1, 0.5);
  s.bezierCurveTo(-0.4, 0.35, -0.45, -0.25, 0, -0.5);
  return new ShapeGeometry(s, 10);
}

export function SakuraPetals() {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const geometry = useMemo(() => petalGeometry(), []);
  const density = useRef({ v: 0.25 });
  const petals = useMemo(
    () =>
      Array.from({ length: MAX }, () => ({
        x: Math.random() * 12 - 6,
        y: Math.random() * 9 - 4.5,
        z: Math.random() * 5.6 - 4,
        fall: 0.18 + Math.random() * 0.3,
        sway: 0.2 + Math.random() * 0.5,
        spin: 0.5 + Math.random() * 1.5,
        scale: 0.05 + Math.random() * 0.06,
        phase: Math.random() * Math.PI * 2,
      })),
    [],
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const c = new Color();
    const tints = ["#FFD1DC", "#FFC0D0", "#FFE4EC", "#FFB7C9"];
    petals.forEach((_, i) => mesh.setColorAt(i, c.set(tints[i % tints.length])));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [petals]);

  useFrame((state, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    const { current } = useBookStore.getState();
    const target = current >= SHEET_COUNT ? 1 : 0.22 + endingTone(current) * 0.7;
    easing.damp(density.current, "v", target, 1.5, delta);
    const active = Math.round(MAX * density.current.v);
    mesh.count = active;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < active; i++) {
      const p = petals[i];
      p.y -= p.fall * delta;
      p.x += Math.sin(t * p.sway + p.phase) * 0.12 * delta + 0.04 * delta;
      if (p.y < -4.8) {
        p.y = 4.8;
        p.x = Math.random() * 12 - 6;
      }
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(t * p.spin + p.phase, Math.sin(t * 0.8 + p.phase) * 1.2, t * p.spin * 0.5);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geometry, undefined, MAX]} frustumCulled={false}>
      <meshStandardMaterial side={DoubleSide} roughness={0.6} transparent opacity={0.9} emissive="#ffb3c8" emissiveIntensity={0.25} />
    </instancedMesh>
  );
}
