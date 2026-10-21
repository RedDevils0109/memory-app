import { Be_Vietnam_Pro, Dancing_Script, Pacifico } from "next/font/google";

export const handwriting = Dancing_Script({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700"],
  variable: "--nf-hand",
  display: "swap",
});

export const uiFont = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--nf-ui",
  display: "swap",
});

export const titleFont = Pacifico({
  subsets: ["latin", "vietnamese"],
  weight: "400",
  variable: "--nf-title",
  display: "swap",
});

const EMOJI_FALLBACK = `"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"`;
const JP_FALLBACK = `"Hiragino Maru Gothic ProN", "Hiragino Sans", "Noto Sans JP", "Yu Gothic", sans-serif`;

export const canvasFonts = {
  hand: `${handwriting.style.fontFamily}, ${EMOJI_FALLBACK}, cursive`,
  ui: `${uiFont.style.fontFamily}, ${EMOJI_FALLBACK}, sans-serif`,
  title: `${titleFont.style.fontFamily}, ${JP_FALLBACK}, ${EMOJI_FALLBACK}`,
};

let fontsReady: Promise<void> | null = null;

export function loadCanvasFonts(): Promise<void> {
  if (fontsReady) return fontsReady;
  const sample = "Our Memories Lam ơi ạ ữ ằ ố 0123";
  fontsReady = Promise.all([
    document.fonts.load(`400 48px ${handwriting.style.fontFamily}`, sample),
    document.fonts.load(`700 48px ${handwriting.style.fontFamily}`, sample),
    document.fonts.load(`400 48px ${uiFont.style.fontFamily}`, sample),
    document.fonts.load(`600 48px ${uiFont.style.fontFamily}`, sample),
    document.fonts.load(`400 48px ${titleFont.style.fontFamily}`, sample),
  ])
    .then(() => document.fonts.ready)
    .then(() => undefined)
    .catch(() => undefined);
  return fontsReady;
}
