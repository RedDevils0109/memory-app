"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import {
  Bone,
  BoxGeometry,
  Float32BufferAttribute,
  Group,
  Material,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
  Texture,
  Uint16BufferAttribute,
  Vector3,
} from "three";
import { pageFor } from "@/lib/memories";
import { isFinalRevealDone, markFinalRevealDone } from "@/lib/pageTexture";
import { useBookStore } from "@/store/useBookStore";
import {
  COVER_DEPTH,
  COVER_SCALE,
  isCoverSheet,
  PAGE_DEPTH,
  PAGE_H,
  PAGE_W,
  SEGMENTS,
  sheetDistance,
  zLeft,
  zRight,
} from "./dimensions";
import { usePageTexture } from "./usePageTexture";

const CURL = 0.55;

function buildGeometry(width: number, height: number, depth: number) {
  const geometry = new BoxGeometry(width, height, depth, SEGMENTS, 2);
  geometry.translate(width / 2, 0, 0);
  const segW = width / SEGMENTS;
  const position = geometry.attributes.position;
  const v = new Vector3();
  const indices: number[] = [];
  const weights: number[] = [];
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i);
    const seg = Math.max(0, Math.min(SEGMENTS - 1, Math.floor(v.x / segW)));
    const w = Math.min(1, Math.max(0, (v.x - seg * segW) / segW));
    indices.push(seg, seg + 1, 0, 0);
    weights.push(1 - w, w, 0, 0);
  }
  geometry.setAttribute("skinIndex", new Uint16BufferAttribute(indices, 4));
  geometry.setAttribute("skinWeight", new Float32BufferAttribute(weights, 4));
  return geometry;
}

let sharedGeometries: { page: BoxGeometry; cover: BoxGeometry } | null = null;
function geometries() {
  sharedGeometries ??= {
    page: buildGeometry(PAGE_W, PAGE_H, PAGE_DEPTH),
    cover: buildGeometry(PAGE_W * COVER_SCALE.w, PAGE_H * COVER_SCALE.h, COVER_DEPTH),
  };
  return sharedGeometries;
}

type SheetProps = {
  index: number;
  edgeMaterial: Material;
  coverEdgeMaterial: Material;
  paperPlaceholder: Texture;
  leatherPlaceholder: Texture;
};

export function Sheet({ index, edgeMaterial, coverEdgeMaterial, paperPlaceholder, leatherPlaceholder }: SheetProps) {
  const group = useRef<Group>(null);
  const cover = isCoverSheet(index);
  const current = useBookStore((s) => s.current);
  const dist = sheetDistance(index, current);
  const front = usePageTexture(index, "front", dist <= 2, dist <= 4);
  const back = usePageTexture(index, "back", dist <= 2, dist <= 4);

  const frontSpec = useMemo(() => pageFor(index, "front"), [index]);
  const backSpec = useMemo(() => pageFor(index, "back"), [index]);
  const frontPlaceholder = frontSpec.kind === "cover" ? leatherPlaceholder : paperPlaceholder;
  const backPlaceholder = backSpec.kind === "backCover" ? leatherPlaceholder : paperPlaceholder;

  const { mesh, frontMat, backMat, bones } = useMemo(() => {
    const makeMat = (map: Texture, leather: boolean) =>
      leather
        ? new MeshPhysicalMaterial({ map, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.35 })
        : new MeshStandardMaterial({ map, roughness: 0.92 });
    const frontMat = makeMat(frontPlaceholder, frontSpec.kind === "cover");
    const backMat = makeMat(backPlaceholder, backSpec.kind === "backCover");
    const edge = cover ? coverEdgeMaterial : edgeMaterial;

    const bones: Bone[] = [];
    const segW = (cover ? PAGE_W * COVER_SCALE.w : PAGE_W) / SEGMENTS;
    for (let i = 0; i <= SEGMENTS; i++) {
      const bone = new Bone();
      bone.position.x = i === 0 ? 0 : segW;
      if (i > 0) bones[i - 1].add(bone);
      bones.push(bone);
    }
    const geo = cover ? geometries().cover : geometries().page;
    const mesh = new SkinnedMesh(geo, [edge, edge, edge, edge, frontMat, backMat]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.add(bones[0]);
    mesh.bind(new Skeleton(bones));
    return { mesh, frontMat, backMat, bones };
  }, [cover, edgeMaterial, coverEdgeMaterial, frontPlaceholder, backPlaceholder, frontSpec.kind, backSpec.kind]);

  useEffect(
    () => () => {
      frontMat.dispose();
      backMat.dispose();
    },
    [frontMat, backMat],
  );

  useEffect(() => {
    frontMat.map = front?.texture ?? frontPlaceholder;
  }, [front, frontMat, frontPlaceholder]);

  useEffect(() => {
    backMat.map = back?.texture ?? backPlaceholder;
  }, [back, backMat, backPlaceholder]);

  useEffect(() => {
    if (index === 0 && front) useBookStore.getState().setReady();
  }, [index, front]);

  const isFinalLetter = frontSpec.kind === "letterRight" && frontSpec.final;
  useEffect(() => {
    if (!isFinalLetter || !front || current !== index || isFinalRevealDone()) return;
    const text = frontSpec.kind === "letterRight" ? frontSpec.memory.text : "";
    const duration = Math.min(16000, Math.max(4000, [...text].length * 38));
    let raf = 0;
    let last = 0;
    const startAt = performance.now() + 900;
    const tick = (now: number) => {
      const t = Math.max(0, (now - startAt) / duration);
      if (now - last > 33 || t >= 1) {
        front.redraw(Math.min(1, t));
        last = now;
      }
      if (t < 1) raf = requestAnimationFrame(tick);
      else markFinalRevealDone();
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (!isFinalRevealDone()) {
        markFinalRevealDone();
        front.redraw(1);
      }
    };
  }, [isFinalLetter, front, current, index, frontSpec]);

  const anim = useRef({ p: index < current ? 1 : 0, applied: -1 });

  useFrame((_, delta) => {
    const st = useBookStore.getState();
    const drag = st.drag?.sheet === index ? st.drag : null;
    let target = index < st.current ? 1 : 0;
    if (drag) target = drag.dir === 1 ? drag.progress : 1 - drag.progress;

    const a = anim.current;
    easing.damp(a, "p", target, drag ? 0.06 : 0.28, delta, Infinity, undefined, 0.0005);
    if (Math.abs(a.p - a.applied) < 1e-5) return;
    a.applied = a.p;
    const p = a.p;

    if (group.current) group.current.position.z = zRight[index] + (zLeft[index] - zRight[index]) * p;

    const bend = cover ? 0 : Math.sin(Math.PI * p) * CURL;
    let prev = 0;
    for (let i = 0; i < bones.length; i++) {
      const s = i / SEGMENTS;
      const g = Math.min(1, Math.max(0, p + bend * (s - 0.3)));
      const angle = -Math.PI * g;
      bones[i].rotation.y = angle - prev;
      prev = angle;
    }
  });

  return (
    <group ref={group}>
      <primitive object={mesh} />
    </group>
  );
}
