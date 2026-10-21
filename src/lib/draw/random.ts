export function seeded(seed: number) {
  let a = (seed * 2654435761) >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const range = (rand: () => number, min: number, max: number) => min + rand() * (max - min);

export const pick = <T,>(rand: () => number, list: readonly T[]): T => list[Math.floor(rand() * list.length)];
