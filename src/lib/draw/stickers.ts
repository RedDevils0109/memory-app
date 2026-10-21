type Ctx = CanvasRenderingContext2D;

export const PALETTE = {
  blush: "#FFD6E0",
  rose: "#FF8FAB",
  hotPink: "#FF5D8F",
  cream: "#FFF7F0",
  berry: "#C9184A",
  gold: "#E9C46A",
  ink: "#7A2244",
  lilac: "#D7B8F3",
  mint: "#BDE7D6",
};

export function heartPath(ctx: Ctx, x: number, y: number, size: number) {
  const w = size;
  const h = size;
  ctx.beginPath();
  ctx.moveTo(x, y - h * 0.22);
  ctx.bezierCurveTo(x, y - h * 0.52, x - w * 0.52, y - h * 0.52, x - w * 0.52, y - h * 0.14);
  ctx.bezierCurveTo(x - w * 0.52, y + h * 0.16, x - w * 0.1, y + h * 0.3, x, y + h * 0.5);
  ctx.bezierCurveTo(x + w * 0.1, y + h * 0.3, x + w * 0.52, y + h * 0.16, x + w * 0.52, y - h * 0.14);
  ctx.bezierCurveTo(x + w * 0.52, y - h * 0.52, x, y - h * 0.52, x, y - h * 0.22);
  ctx.closePath();
}

export function drawHeart(
  ctx: Ctx,
  x: number,
  y: number,
  size: number,
  color = PALETTE.rose,
  opts: { rotation?: number; outline?: string; shine?: boolean; alpha?: number } = {},
) {
  ctx.save();
  ctx.globalAlpha = opts.alpha ?? 1;
  ctx.translate(x, y);
  ctx.rotate(opts.rotation ?? 0);
  heartPath(ctx, 0, 0, size);
  ctx.fillStyle = color;
  ctx.fill();
  if (opts.outline) {
    ctx.lineWidth = Math.max(2, size * 0.06);
    ctx.strokeStyle = opts.outline;
    ctx.stroke();
  }
  if (opts.shine !== false) {
    ctx.beginPath();
    ctx.ellipse(-size * 0.22, -size * 0.18, size * 0.1, size * 0.06, -0.6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fill();
  }
  ctx.restore();
}

export function drawPaw(ctx: Ctx, x: number, y: number, size: number, color = PALETTE.rose, rotation = 0, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, size * 0.15, size * 0.32, size * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  const toes: [number, number][] = [
    [-0.34, -0.18],
    [-0.12, -0.36],
    [0.12, -0.36],
    [0.34, -0.18],
  ];
  for (const [tx, ty] of toes) {
    ctx.beginPath();
    ctx.ellipse(tx * size, ty * size, size * 0.12, size * 0.15, tx * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawSakura(ctx: Ctx, x: number, y: number, size: number, rotation = 0, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / 5);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-size * 0.28, -size * 0.12, -size * 0.26, -size * 0.42, -size * 0.06, -size * 0.5);
    ctx.lineTo(0, -size * 0.42);
    ctx.lineTo(size * 0.06, -size * 0.5);
    ctx.bezierCurveTo(size * 0.26, -size * 0.42, size * 0.28, -size * 0.12, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, -size * 0.5);
    g.addColorStop(0, "#FF9EBB");
    g.addColorStop(1, "#FFE3EC");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.gold;
  ctx.fill();
  ctx.restore();
}

export function drawSparkle(ctx: Ctx, x: number, y: number, size: number, color = "#FFFFFF", alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.5);
  ctx.quadraticCurveTo(size * 0.08, -size * 0.08, size * 0.5, 0);
  ctx.quadraticCurveTo(size * 0.08, size * 0.08, 0, size * 0.5);
  ctx.quadraticCurveTo(-size * 0.08, size * 0.08, -size * 0.5, 0);
  ctx.quadraticCurveTo(-size * 0.08, -size * 0.08, 0, -size * 0.5);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export function drawBow(ctx: Ctx, x: number, y: number, size: number, color = PALETTE.hotPink, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  const dark = shade(color, -0.18);
  ctx.fillStyle = dark;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, size * 0.05);
    ctx.lineTo(s * size * 0.22, size * 0.55);
    ctx.lineTo(s * size * 0.08, size * 0.48);
    ctx.lineTo(s * size * 0.02, size * 0.58);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = color;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(s * size * 0.2, -size * 0.38, s * size * 0.55, -size * 0.3, s * size * 0.5, 0);
    ctx.bezierCurveTo(s * size * 0.55, size * 0.3, s * size * 0.2, size * 0.32, 0, 0);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.1, size * 0.12, 0, 0, Math.PI * 2);
  ctx.fillStyle = dark;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-size * 0.28, -size * 0.08, size * 0.08, size * 0.04, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fill();
  ctx.restore();
}

type CatOptions = {
  fur?: string;
  sleeping?: boolean;
  wave?: boolean;
  collar?: boolean;
  rotation?: number;
};

/** A chubby cartoon cat. (x, y) is the center of the head; size is the head width. */
export function drawCat(ctx: Ctx, x: number, y: number, size: number, opts: CatOptions = {}) {
  const fur = opts.fur ?? "#FFFFFF";
  const line = "#5A2A3A";
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(opts.rotation ?? 0);
  ctx.lineWidth = Math.max(2, s * 0.035);
  ctx.strokeStyle = line;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  if (opts.wave !== undefined || opts.collar) {
    // body
    ctx.beginPath();
    ctx.ellipse(0, s * 0.62, s * 0.42, s * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = fur;
    ctx.fill();
    ctx.stroke();
    // belly patch
    ctx.beginPath();
    ctx.ellipse(0, s * 0.7, s * 0.22, s * 0.22, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#FFEFF4";
    ctx.fill();
  }

  if (opts.wave) {
    ctx.save();
    ctx.translate(s * 0.42, s * 0.28);
    ctx.rotate(-0.5);
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.12, s * 0.11, s * 0.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = fur;
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.22, s * 0.05, s * 0.05, 0, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.rose;
    ctx.fill();
    ctx.restore();
  }

  // ears
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * s * 0.42, -s * 0.12);
    ctx.lineTo(side * s * 0.36, -s * 0.52);
    ctx.lineTo(side * s * 0.08, -s * 0.34);
    ctx.closePath();
    ctx.fillStyle = fur;
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(side * s * 0.35, -s * 0.2);
    ctx.lineTo(side * s * 0.33, -s * 0.42);
    ctx.lineTo(side * s * 0.16, -s * 0.31);
    ctx.closePath();
    ctx.fillStyle = PALETTE.rose;
    ctx.fill();
  }

  // head
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.5, s * 0.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = fur;
  ctx.fill();
  ctx.stroke();

  // eyes
  ctx.lineWidth = Math.max(2, s * 0.04);
  if (opts.sleeping) {
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(side * s * 0.2, -s * 0.02, s * 0.07, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
  } else {
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * s * 0.2, -s * 0.03, s * 0.055, s * 0.07, 0, 0, Math.PI * 2);
      ctx.fillStyle = line;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(side * s * 0.2 + s * 0.02, -s * 0.06, s * 0.02, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
    }
  }

  // blush
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * s * 0.32, s * 0.1, s * 0.08, s * 0.05, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,120,160,0.55)";
    ctx.fill();
  }

  // nose + mouth
  ctx.beginPath();
  ctx.moveTo(-s * 0.035, s * 0.05);
  ctx.lineTo(s * 0.035, s * 0.05);
  ctx.lineTo(0, s * 0.09);
  ctx.closePath();
  ctx.fillStyle = PALETTE.hotPink;
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, s * 0.025);
  ctx.beginPath();
  ctx.arc(-s * 0.045, s * 0.1, s * 0.045, 0, Math.PI);
  ctx.arc(s * 0.045, s * 0.1, s * 0.045, 0, Math.PI);
  ctx.stroke();

  // whiskers
  ctx.lineWidth = Math.max(1, s * 0.015);
  for (const side of [-1, 1]) {
    for (const dy of [-0.02, 0.05]) {
      ctx.beginPath();
      ctx.moveTo(side * s * 0.4, s * (0.06 + dy));
      ctx.lineTo(side * s * 0.62, s * (0.02 + dy * 1.6));
      ctx.stroke();
    }
  }

  if (opts.collar) {
    ctx.beginPath();
    ctx.ellipse(0, s * 0.36, s * 0.3, s * 0.06, 0, 0, Math.PI);
    ctx.lineWidth = s * 0.07;
    ctx.strokeStyle = PALETTE.berry;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, s * 0.46, s * 0.07, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.gold;
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, s * 0.015);
    ctx.strokeStyle = "#B8860B";
    ctx.stroke();
  }

  if (opts.sleeping) {
    ctx.font = `700 ${Math.round(s * 0.22)}px sans-serif`;
    ctx.fillStyle = PALETTE.rose;
    ctx.fillText("z", s * 0.5, -s * 0.4);
    ctx.font = `700 ${Math.round(s * 0.16)}px sans-serif`;
    ctx.fillText("z", s * 0.68, -s * 0.58);
  }
  ctx.restore();
}

export function drawWashiTape(
  ctx: Ctx,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
  color = "rgba(255,143,171,0.75)",
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  const teeth = 6;
  ctx.beginPath();
  ctx.moveTo(-width / 2, -height / 2);
  ctx.lineTo(width / 2, -height / 2);
  for (let i = 1; i <= teeth; i++) {
    const ty = -height / 2 + (height * i) / teeth;
    ctx.lineTo(width / 2 + (i % 2 ? -4 : 0), ty);
  }
  ctx.lineTo(-width / 2, height / 2);
  for (let i = teeth - 1; i >= 0; i--) {
    const ty = -height / 2 + (height * i) / teeth;
    ctx.lineTo(-width / 2 + (i % 2 ? 4 : 0), ty);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  for (let i = -width; i < width; i += height * 0.6) {
    ctx.beginPath();
    ctx.arc(i, 0, height * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + 255 * amount)));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
