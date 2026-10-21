import { MUSIC_SRC } from "@/config";

let audio: HTMLAudioElement | null = null;

export async function detectMusic(): Promise<boolean> {
  try {
    const res = await fetch(MUSIC_SRC, { method: "HEAD" });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || type.includes("text/html")) return false;
    audio = new Audio(MUSIC_SRC);
    audio.loop = true;
    audio.volume = 0.45;
    audio.preload = "auto";
    return true;
  } catch {
    return false;
  }
}

export function playMusic(): Promise<boolean> {
  if (!audio) return Promise.resolve(false);
  return audio
    .play()
    .then(() => true)
    .catch(() => false);
}

export function pauseMusic() {
  audio?.pause();
}
