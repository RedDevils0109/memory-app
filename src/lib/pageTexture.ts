import { CanvasTexture, SRGBColorSpace } from "three";
import { SITE_TITLE } from "@/config";
import { canvasFonts } from "@/lib/fonts";
import { endingTone, type MediaItem, type PageSpec } from "@/lib/memories";
import { collageSlots, PAGE_UNITS, type Slot } from "@/lib/draw/collage";
import { pick, range, seeded } from "@/lib/draw/random";
import {
  drawBow,
  drawCat,
  drawHeart,
  drawPaw,
  drawSakura,
  drawSparkle,
  drawWashiTape,
  heartPath,
  PALETTE,
  roundRect,
} from "@/lib/draw/stickers";

type Ctx = CanvasRenderingContext2D;
type Drawable = { source: CanvasImageSource; width: number; height: number };

/* ------------------------------------------------------------------ */
/* Asset loading                                                       */
/* ------------------------------------------------------------------ */

const MAX_ASSET_SIDE = 1100;
const ASSET_CACHE_LIMIT = 28;
const assetCache = new Map<string, Promise<Drawable | null>>();

function downscale(source: CanvasImageSource, width: number, height: number): Drawable {
  const scale = Math.min(1, MAX_ASSET_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
  return { source: canvas, width: canvas.width, height: canvas.height };
}

function loadImage(src: string): Promise<Drawable | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(downscale(img, img.naturalWidth, img.naturalHeight));
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function loadVideoPoster(src: string): Promise<Drawable | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    let settled = false;
    const finish = (value: Drawable | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), 8000);
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onloadeddata = () => {
      video.currentTime = Math.min(0.4, (video.duration || 1) / 3);
    };
    video.onseeked = () => {
      if (!video.videoWidth) return finish(null);
      finish(downscale(video, video.videoWidth, video.videoHeight));
    };
    video.onerror = () => finish(null);
    video.src = src;
  });
}

function loadMedia(item: MediaItem): Promise<Drawable | null> {
  const cached = assetCache.get(item.src);
  if (cached) {
    assetCache.delete(item.src);
    assetCache.set(item.src, cached);
    return cached;
  }
  const promise = item.kind === "video" ? loadVideoPoster(item.src) : loadImage(item.src);
  assetCache.set(item.src, promise);
  while (assetCache.size > ASSET_CACHE_LIMIT) {
    assetCache.delete(assetCache.keys().next().value!);
  }
  return promise;
}

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) =>
    Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}

function tonePalette(tone: number) {
  return {
    paper: mixHex("#FFF8F2", "#F7EEF5", tone),
    paperEdge: mixHex("#FFE9EF", "#E9DCEB", tone),
    accent: mixHex(PALETTE.hotPink, "#B97AA6", tone),
    soft: mixHex(PALETTE.rose, "#CDA4C4", tone),
    ink: mixHex(PALETTE.ink, "#5B3A5E", tone),
  };
}

type Palette = ReturnType<typeof tonePalette>;

function wrapLines(ctx: Ctx, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      out.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width <= maxWidth || !line) {
        line = test;
      } else {
        out.push(line);
        line = word;
      }
    }
    out.push(line);
  }
  return out;
}

function fitText(
  ctx: Ctx,
  text: string,
  font: (size: number) => string,
  maxWidth: number,
  maxHeight: number,
  maxSize: number,
  minSize: number,
  lineRatio: number,
) {
  for (let size = maxSize; size >= minSize; size -= 2) {
    ctx.font = font(size);
    const lines = wrapLines(ctx, text, maxWidth);
    const lineHeight = size * lineRatio;
    if (lines.length * lineHeight <= maxHeight) return { size, lines, lineHeight };
  }
  ctx.font = font(minSize);
  return { size: minSize, lines: wrapLines(ctx, text, maxWidth), lineHeight: minSize * lineRatio };
}

function drawPaper(ctx: Ctx, rand: () => number, spine: "left" | "right", pal: Palette, ruled?: number[]) {
  const { w, h } = PAGE_UNITS;
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, pal.paper);
  g.addColorStop(1, pal.paperEdge);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(160, 90, 110, 0.05)";
  for (let i = 0; i < 2200; i++) {
    ctx.fillRect(rand() * w, rand() * h, 1.6, 1.6);
  }

  if (ruled) {
    ctx.strokeStyle = "rgba(255, 143, 171, 0.35)";
    ctx.lineWidth = 2;
    for (const y of ruled) {
      ctx.beginPath();
      ctx.moveTo(90, y);
      ctx.lineTo(w - 70, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255, 93, 143, 0.35)";
    ctx.beginPath();
    ctx.moveTo(130, 60);
    ctx.lineTo(130, h - 60);
    ctx.stroke();
  } else {
    ctx.fillStyle = "rgba(255, 143, 171, 0.16)";
    for (let y = 70; y < h - 40; y += 48) {
      for (let x = 70; x < w - 40; x += 48) {
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.save();
  ctx.setLineDash([14, 12]);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255, 143, 171, 0.35)";
  roundRect(ctx, 34, 34, w - 68, h - 68, 28);
  ctx.stroke();
  ctx.restore();

  const gutter = spine === "left" ? ctx.createLinearGradient(0, 0, 110, 0) : ctx.createLinearGradient(w, 0, w - 110, 0);
  gutter.addColorStop(0, "rgba(120, 50, 80, 0.22)");
  gutter.addColorStop(1, "rgba(120, 50, 80, 0)");
  ctx.fillStyle = gutter;
  ctx.fillRect(spine === "left" ? 0 : w - 110, 0, 110, h);
}

function drawLeather(ctx: Ctx, rand: () => number, spine: "left" | "right") {
  const { w, h } = PAGE_UNITS;
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#FFB3C8");
  g.addColorStop(0.5, "#FF8FAB");
  g.addColorStop(1, "#F2668F");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = rand() > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(120,20,60,0.05)";
    ctx.fillRect(rand() * w, rand() * h, 2, 2);
  }

  const shine = ctx.createRadialGradient(w * 0.3, h * 0.2, 50, w * 0.3, h * 0.2, w);
  shine.addColorStop(0, "rgba(255,255,255,0.28)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, w, h);

  const sx = spine === "left" ? 0 : w - 70;
  const sg = ctx.createLinearGradient(sx, 0, sx + 70, 0);
  sg.addColorStop(spine === "left" ? 0 : 1, "rgba(120, 20, 60, 0.35)");
  sg.addColorStop(spine === "left" ? 1 : 0, "rgba(120, 20, 60, 0.05)");
  ctx.fillStyle = sg;
  ctx.fillRect(sx, 0, 70, h);

  const gold = ctx.createLinearGradient(0, 0, w, h);
  gold.addColorStop(0, "#FFF1B8");
  gold.addColorStop(0.5, PALETTE.gold);
  gold.addColorStop(1, "#C9973A");
  ctx.strokeStyle = gold;
  ctx.lineWidth = 7;
  roundRect(ctx, 80, 80, w - 160, h - 160, 40);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  roundRect(ctx, 100, 100, w - 200, h - 200, 30);
  ctx.stroke();

  ctx.save();
  ctx.setLineDash([12, 10]);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 3;
  roundRect(ctx, 46, 46, w - 92, h - 92, 34);
  ctx.stroke();
  ctx.restore();

  const corners: [number, number][] = [
    [100, 100],
    [w - 100, 100],
    [100, h - 100],
    [w - 100, h - 100],
  ];
  for (const [x, y] of corners) drawHeart(ctx, x, y, 46, PALETTE.gold, { outline: "#FFF1B8" });

  for (let i = 0; i < 18; i++) {
    drawHeart(ctx, range(rand, 140, w - 140), range(rand, 140, h - 140), range(rand, 18, 40), "#FFFFFF", {
      alpha: 0.22,
      rotation: range(rand, -0.5, 0.5),
      shine: false,
    });
  }
  for (let i = 0; i < 10; i++) {
    drawSparkle(ctx, range(rand, 140, w - 140), range(rand, 140, h - 140), range(rand, 20, 40), "#FFF8E1", 0.8);
  }
}

function drawCover(ctx: Ctx) {
  const rand = seeded(7);
  const { w } = PAGE_UNITS;
  drawLeather(ctx, rand, "left");

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = `400 128px ${canvasFonts.title}`;
  ctx.fillStyle = PALETTE.berry;
  ctx.fillText(SITE_TITLE, w / 2 + 4, 330 + 6);
  const tg = ctx.createLinearGradient(0, 260, 0, 400);
  tg.addColorStop(0, "#FFFFFF");
  tg.addColorStop(1, "#FFF1F5");
  ctx.fillStyle = tg;
  ctx.fillText(SITE_TITLE, w / 2, 330);

  ctx.beginPath();
  ctx.arc(w / 2, 860, 250, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255,241,184,0.9)";
  ctx.stroke();

  drawCat(ctx, w / 2, 800, 270, { wave: true, collar: true });
  drawHeart(ctx, w / 2 - 210, 680, 70, PALETTE.hotPink, { outline: "#FFFFFF", rotation: -0.3 });
  drawHeart(ctx, w / 2 + 215, 990, 56, "#FFFFFF", { outline: PALETTE.hotPink, rotation: 0.3 });
  drawBow(ctx, w / 2 - 70, 640, 90, PALETTE.berry, -0.25);
}

function drawBackCover(ctx: Ctx) {
  const rand = seeded(99);
  const { w } = PAGE_UNITS;
  drawLeather(ctx, rand, "right");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < 7; i++) {
    drawSakura(ctx, range(rand, 170, w - 170), range(rand, 180, 520), range(rand, 50, 90), rand() * 6, 0.9);
  }

  drawCat(ctx, w / 2, 760, 300, { sleeping: true, collar: true });

  ctx.font = `700 70px ${canvasFonts.hand}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("Cảm ơn vì những ngày đã qua", w / 2, 1060);
  ctx.font = `600 34px ${canvasFonts.ui}`;
  ctx.fillStyle = "#FFF6DA";
  ctx.fillText(`${SITE_TITLE}  ·  21.10.2026`, w / 2, 1180);
}

/* ------------------------------------------------------------------ */
/* Media pages                                                         */
/* ------------------------------------------------------------------ */

function drawImageCover(ctx: Ctx, img: Drawable, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img.source, sx, sy, sw, sh, x, y, w, h);
}

function drawPolaroid(ctx: Ctx, slot: Slot, asset: Drawable | null, item: MediaItem, rand: () => number, pal: Palette) {
  ctx.save();
  ctx.translate(slot.cx, slot.cy);
  ctx.rotate(slot.rot);
  const { w, h } = slot;
  const pad = w * 0.055;
  const chin = pad * 2.6;

  ctx.shadowColor = "rgba(122, 34, 68, 0.28)";
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, -w / 2, -h / 2, w, h, 8);
  ctx.fill();
  ctx.shadowColor = "transparent";

  const px = -w / 2 + pad;
  const py = -h / 2 + pad;
  const pw = w - pad * 2;
  const ph = h - pad - chin;

  ctx.save();
  roundRect(ctx, px, py, pw, ph, 4);
  ctx.clip();
  if (asset) {
    drawImageCover(ctx, asset, px, py, pw, ph);
  } else {
    const g = ctx.createLinearGradient(px, py, px + pw, py + ph);
    g.addColorStop(0, "#FFE3EC");
    g.addColorStop(1, "#FFC2D4");
    ctx.fillStyle = g;
    ctx.fillRect(px, py, pw, ph);
    for (let i = 0; i < 6; i++) {
      drawHeart(ctx, px + rand() * pw, py + rand() * ph, range(rand, 16, 34), "#FFFFFF", { alpha: 0.5, shine: false });
    }
    drawCat(ctx, 0, py + ph * 0.45, Math.min(pw, ph) * 0.42, { sleeping: true });
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${Math.round(pw * 0.065)}px ${canvasFonts.ui}`;
    ctx.fillStyle = pal.accent;
    ctx.fillText(item.kind === "video" ? "video sắp có nè" : "ảnh sắp có nè", 0, py + ph * 0.82);
  }
  ctx.restore();

  if (item.kind === "video") {
    const r = Math.min(pw, ph) * 0.12;
    ctx.beginPath();
    ctx.arc(0, py + ph / 2, r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-r * 0.32, py + ph / 2 - r * 0.45);
    ctx.lineTo(r * 0.5, py + ph / 2);
    ctx.lineTo(-r * 0.32, py + ph / 2 + r * 0.45);
    ctx.closePath();
    ctx.fillStyle = PALETTE.hotPink;
    ctx.fill();
  }

  const chinY = h / 2 - chin / 2;
  if (item.kind === "video") {
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${Math.round(chin * 0.32)}px ${canvasFonts.ui}`;
    ctx.fillStyle = pal.soft;
    ctx.fillText("▶ video", px + 4, chinY);
  }
  drawHeart(ctx, w / 2 - pad - chin * 0.25, chinY, chin * 0.38, pal.soft, { rotation: 0.2 });

  ctx.restore();

  const tapeW = Math.min(170, w * 0.36);
  const tapeColors = ["rgba(255,143,171,0.72)", "rgba(215,184,243,0.72)", "rgba(189,231,214,0.75)", "rgba(255,214,224,0.85)"];
  const tx = slot.cx + Math.sin(slot.rot) * (h / 2);
  const ty = slot.cy - Math.cos(slot.rot) * (h / 2);
  drawWashiTape(ctx, tx, ty, tapeW, 46, slot.rot + range(rand, -0.25, 0.25), pick(rand, tapeColors));
}

function drawMediaLeft(ctx: Ctx, spec: Extract<PageSpec, { kind: "mediaLeft" }>, assets: (Drawable | null)[]) {
  const { memory } = spec;
  const rand = seeded(memory.index * 31 + 3);
  const pal = tonePalette(endingTone(memory.index + 1));
  drawPaper(ctx, rand, "right", pal);

  const slots = collageSlots(memory.media.length);
  memory.media.forEach((item, i) => drawPolaroid(ctx, slots[i], assets[i] ?? null, item, rand, pal));

  for (let i = 0; i < 3; i++) {
    const corner = pick(rand, [
      [90, 1250],
      [910, 1270],
      [910, 110],
      [90, 110],
    ] as const);
    drawHeart(ctx, corner[0] + range(rand, -20, 20), corner[1] + range(rand, -20, 20), range(rand, 30, 50), pal.soft, {
      rotation: range(rand, -0.4, 0.4),
    });
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `500 28px ${canvasFonts.ui}`;
  ctx.fillStyle = pal.soft;
  ctx.fillText("chạm vào ảnh để xem nha 💗", PAGE_UNITS.w / 2, 1335);
}

function drawRibbon(ctx: Ctx, text: string, cx: number, cy: number, pal: Palette) {
  ctx.font = `600 40px ${canvasFonts.ui}`;
  const tw = ctx.measureText(text).width + 110;
  const h = 76;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.02);
  ctx.fillStyle = pal.soft;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * (tw / 2 - 20), -h / 2 + 14);
    ctx.lineTo(s * (tw / 2 + 50), -h / 2 + 14);
    ctx.lineTo(s * (tw / 2 + 28), 14);
    ctx.lineTo(s * (tw / 2 + 50), h / 2 + 14);
    ctx.lineTo(s * (tw / 2 - 20), h / 2 + 14);
    ctx.closePath();
    ctx.fill();
  }
  ctx.shadowColor = "rgba(122,34,68,0.25)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = pal.accent;
  roundRect(ctx, -tw / 2, -h / 2, tw, h, 10);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(text, 0, 2);
  ctx.restore();
}

function drawMediaRight(ctx: Ctx, spec: Extract<PageSpec, { kind: "mediaRight" }>) {
  const { memory } = spec;
  const rand = seeded(memory.index * 17 + 11);
  const pal = tonePalette(endingTone(memory.index + 1));
  const { w } = PAGE_UNITS;
  drawPaper(ctx, rand, "left", pal);

  if (memory.dateLabel) {
    drawRibbon(ctx, `♡ ${memory.dateLabel}`, w / 2, 190, pal);
  } else {
    drawHeart(ctx, w / 2, 190, 110, pal.accent, { outline: "#FFFFFF" });
  }

  const { lines, lineHeight } = fitText(
    ctx,
    memory.caption,
    (size) => `700 ${size}px ${canvasFonts.hand}`,
    760,
    640,
    84,
    40,
    1.32,
  );
  const blockH = lines.length * lineHeight;
  const startY = 330 + (640 - blockH) / 2 + lineHeight / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = pal.ink;
  lines.forEach((line, i) => ctx.fillText(line, w / 2, startY + i * lineHeight));

  const catLeft = rand() > 0.5;
  drawCat(ctx, catLeft ? 220 : 780, 1145, 210, {
    sleeping: rand() > 0.6,
    wave: rand() > 0.4 ? true : undefined,
    rotation: range(rand, -0.12, 0.12),
  });
  drawPaw(ctx, catLeft ? 640 : 360, 1210, 60, pal.soft, range(rand, -0.6, 0.6), 0.55);
  drawPaw(ctx, catLeft ? 740 : 260, 1130, 52, pal.soft, range(rand, -0.6, 0.6), 0.4);
  drawHeart(ctx, catLeft ? 860 : 140, 1060, 60, pal.accent, { rotation: range(rand, -0.4, 0.4) });

  drawSakura(ctx, 120, 120, 70, rand() * 6, 0.9);
  if (rand() > 0.5) drawBow(ctx, 880, 110, 90, pal.accent, 0.3);
  else drawSakura(ctx, 880, 120, 60, rand() * 6, 0.9);

  ctx.font = `64px ${canvasFonts.ui}`;
  ctx.fillText(pick(rand, ["💗", "🎀", "🌸", "🐱", "🍓", "🧸", "💌"]), catLeft ? 860 : 140, 1230);

  ctx.font = `500 28px ${canvasFonts.ui}`;
  ctx.fillStyle = pal.soft;
  ctx.fillText(`— ${memory.index + 1} —`, w / 2, 1335);
}

/* ------------------------------------------------------------------ */
/* Letter pages                                                        */
/* ------------------------------------------------------------------ */

function drawLetterLeft(ctx: Ctx, spec: Extract<PageSpec, { kind: "letterLeft" }>) {
  const { memory } = spec;
  const rand = seeded(memory.index * 13 + 5);
  const pal = tonePalette(endingTone(memory.index + 1));
  const { w } = PAGE_UNITS;
  drawPaper(ctx, rand, "right", pal);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const ex = w / 2;
  const ey = 780;
  const ew = 640;
  const eh = 420;

  drawCat(ctx, ex + 120, ey - eh / 2 - 40, 230, { rotation: 0.12 });

  ctx.save();
  ctx.shadowColor = "rgba(122,34,68,0.25)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = "#FFE3EC";
  roundRect(ctx, ex - ew / 2, ey - eh / 2, ew, eh, 18);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "rgba(201,24,74,0.25)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ex - ew / 2, ey + eh / 2);
  ctx.lineTo(ex, ey + 20);
  ctx.lineTo(ex + ew / 2, ey + eh / 2);
  ctx.stroke();

  ctx.fillStyle = "#FFD0DE";
  ctx.beginPath();
  ctx.moveTo(ex - ew / 2, ey - eh / 2);
  ctx.lineTo(ex, ey + 30);
  ctx.lineTo(ex + ew / 2, ey - eh / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(ex, ey + 20, 62, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.berry;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#A3123B";
  ctx.stroke();
  heartPath(ctx, ex, ey + 22, 64);
  ctx.fillStyle = "#E23A68";
  ctx.fill();

  for (let i = 0; i < 6; i++) {
    drawSakura(ctx, range(rand, 120, w - 120), range(rand, 1060, 1260), range(rand, 40, 70), rand() * 6, 0.85);
  }
  drawPaw(ctx, 150, 420, 50, pal.soft, -0.4, 0.5);
  drawPaw(ctx, 210, 520, 46, pal.soft, -0.2, 0.4);

  ctx.font = `600 44px ${canvasFonts.hand}`;
  ctx.fillStyle = pal.soft;
  ctx.fillText("with love 🐾", w / 2, 1320);
}

let finalRevealDone = false;
export const markFinalRevealDone = () => {
  finalRevealDone = true;
};
export const isFinalRevealDone = () => finalRevealDone;

function letterLayout(ctx: Ctx, text: string) {
  return fitText(ctx, text, (size) => `600 ${size}px ${canvasFonts.hand}`, 740, 960, 72, 34, 1.42);
}

function drawLetterRight(ctx: Ctx, spec: Extract<PageSpec, { kind: "letterRight" }>, reveal: number) {
  const { memory } = spec;
  const rand = seeded(memory.index * 19 + 7);
  const pal = tonePalette(endingTone(memory.index + 1));
  const { w } = PAGE_UNITS;

  const layout = letterLayout(ctx, memory.text);
  const top = 220 + Math.max(0, (960 - layout.lines.length * layout.lineHeight) / 2) * 0.5;
  const baselines = layout.lines.map((_, i) => top + (i + 1) * layout.lineHeight - layout.lineHeight * 0.28);
  const ruled: number[] = [];
  for (let y = top + layout.lineHeight - layout.lineHeight * 0.18; y < 1260; y += layout.lineHeight) ruled.push(y);
  for (let y = top + layout.lineHeight - layout.lineHeight * 0.18 - layout.lineHeight; y > 90; y -= layout.lineHeight) {
    ruled.push(y);
  }
  drawPaper(ctx, rand, "left", pal, ruled);

  drawBow(ctx, 140, 110, 110, pal.accent, -0.3);
  drawHeart(ctx, 880, 120, 64, pal.soft, { rotation: 0.25 });
  drawSparkle(ctx, 820, 90, 36, PALETTE.gold);

  ctx.font = `600 ${layout.size}px ${canvasFonts.hand}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = pal.ink;

  const total = layout.lines.reduce((n, l) => n + [...l].length, 0);
  let budget = Math.floor(total * Math.max(0, Math.min(1, reveal)));
  let penX = -1;
  let penY = -1;
  for (let i = 0; i < layout.lines.length && budget > 0; i++) {
    const chars = [...layout.lines[i]];
    const visible = chars.slice(0, budget).join("");
    budget -= chars.length;
    ctx.fillText(visible, 160, baselines[i]);
    penX = 160 + ctx.measureText(visible).width;
    penY = baselines[i];
  }
  if (reveal < 1 && penX > 0) {
    drawHeart(ctx, penX + 22, penY - layout.size * 0.3, layout.size * 0.5, pal.accent, { rotation: 0.2 });
  }

  if (reveal >= 1 || !spec.final) {
    drawCat(ctx, 820, 1230, 150, { sleeping: true });
  }
}

/* ------------------------------------------------------------------ */
/* Texture handles                                                     */
/* ------------------------------------------------------------------ */

export type PageTextureHandle = {
  texture: CanvasTexture;
  redraw: (reveal: number) => void;
  dispose: () => void;
};

export function textureSize() {
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const width = small ? 768 : 1024;
  return { width, height: Math.round(width * 1.4) };
}

export async function createPageTexture(spec: PageSpec): Promise<PageTextureHandle> {
  const assets =
    spec.kind === "mediaLeft" ? await Promise.all(spec.memory.media.map((m) => loadMedia(m))) : [];

  const { width, height } = textureSize();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const scale = width / PAGE_UNITS.w;

  const draw = (reveal: number) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    switch (spec.kind) {
      case "cover":
        return drawCover(ctx);
      case "backCover":
        return drawBackCover(ctx);
      case "mediaLeft":
        return drawMediaLeft(ctx, spec, assets);
      case "mediaRight":
        return drawMediaRight(ctx, spec);
      case "letterLeft":
        return drawLetterLeft(ctx, spec);
      case "letterRight":
        return drawLetterRight(ctx, spec, reveal);
    }
  };

  const isPendingReveal = spec.kind === "letterRight" && spec.final && !finalRevealDone;
  draw(isPendingReveal ? 0 : 1);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;

  return {
    texture,
    redraw: (reveal) => {
      draw(reveal);
      texture.needsUpdate = true;
    },
    dispose: () => {
      texture.dispose();
      canvas.width = 1;
      canvas.height = 1;
    },
  };
}

export function createPlaceholderTexture(kind: "paper" | "leather"): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 250;
  canvas.height = 350;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(canvas.width / PAGE_UNITS.w, canvas.height / PAGE_UNITS.h);
  const rand = seeded(1);
  if (kind === "leather") drawLeather(ctx, rand, "left");
  else drawPaper(ctx, rand, "left", tonePalette(0));
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/* ------------------------------------------------------------------ */
/* Priority build queue                                                */
/* ------------------------------------------------------------------ */

type Job = { key: string; priority: () => number; run: () => Promise<void> };
const pending = new Map<string, Job>();
let pumping = false;

export function scheduleTextureJob(job: Job) {
  pending.set(job.key, job);
  void pump();
}

export function cancelTextureJob(key: string) {
  pending.delete(key);
}

async function pump() {
  if (pumping) return;
  pumping = true;
  while (pending.size) {
    let best: Job | null = null;
    for (const job of pending.values()) {
      if (!best || job.priority() < best.priority()) best = job;
    }
    pending.delete(best!.key);
    try {
      await best!.run();
    } catch (err) {
      console.error("page texture failed", err);
    }
    await new Promise((r) => setTimeout(r, 0));
  }
  pumping = false;
}
