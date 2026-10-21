import type { Metadata, Viewport } from "next";
import { handwriting, titleFont, uiFont } from "@/lib/fonts";
import { SITE_TITLE } from "@/config";
import "./globals.css";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: "Những kỷ niệm của tụi mình 💗",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffd6e0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${handwriting.variable} ${uiFont.variable} ${titleFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
