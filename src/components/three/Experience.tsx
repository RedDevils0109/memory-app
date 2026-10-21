"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { easing } from "maath";
import { PerspectiveCamera } from "three";
import { SHEET_COUNT } from "@/lib/memories";
import { useBookStore } from "@/store/useBookStore";
import { Book } from "./Book";
import { PAGE_H, PAGE_W } from "./dimensions";
import { FloatingHearts } from "./FloatingHearts";
import { SakuraPetals } from "./SakuraPetals";

function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);

  useFrame((_, delta) => {
    const st = useBookStore.getState();
    const closed = st.current === 0 || st.current === SHEET_COUNT;
    const aspect = size.width / size.height;
    const tanHalf = Math.tan((camera.fov * Math.PI) / 360);

    const contentW = st.portrait ? PAGE_W * 1.12 : closed ? PAGE_W * 1.5 : PAGE_W * 2.16;
    const contentH = PAGE_H * (st.portrait ? 1.3 : 1.34);
    let dist = Math.max(contentH / 2 / tanHalf, contentW / 2 / (tanHalf * aspect));

    let x = 0;
    let y = -0.04;
    if (st.portrait && !closed) x = st.focus === "left" ? -PAGE_W / 2 : PAGE_W / 2;
    if (!st.unlocked) {
      dist *= st.portrait ? 1.45 : 1.2;
      y = st.portrait ? -PAGE_H * 0.36 : -PAGE_H * 0.12;
      if (!st.portrait) x = PAGE_W * 0.5;
    }
    easing.damp3(camera.position, [x, y, dist], st.unlocked ? 0.55 : 0.9, delta);
    camera.lookAt(camera.position.x, camera.position.y, 0);
  });

  return null;
}

export default function Experience() {
  return (
    <Canvas
      shadows
      flat
      dpr={[1, 2]}
      camera={{ fov: 32, position: [0, -0.5, 9], near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <ambientLight intensity={0.74} />
      <hemisphereLight args={["#fff5f8", "#ffc2d4", 0.32]} />
      <directionalLight
        position={[1.6, 3, 4.5]}
        intensity={0.78}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
        shadow-camera-left={-2.2}
        shadow-camera-right={2.2}
        shadow-camera-top={2.2}
        shadow-camera-bottom={-2.2}
        shadow-camera-near={1}
        shadow-camera-far={12}
      />
      <CameraRig />
      <Book />
      <FloatingHearts />
      <SakuraPetals />
      <Sparkles count={70} scale={[10, 6, 5]} position={[0, 0, -1.5]} size={3} speed={0.35} opacity={0.85} color="#fff4f8" />
    </Canvas>
  );
}
