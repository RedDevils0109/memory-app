"use client";

import { BookStage } from "@/components/BookStage";
import { ToneBackground } from "@/components/ToneBackground";
import { Lightbox } from "@/components/ui/Lightbox";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { NavControls } from "@/components/ui/NavControls";
import { PasswordGate } from "@/components/ui/PasswordGate";

export default function Home() {
  return (
    <main className="relative h-[100dvh] w-full overflow-hidden">
      <ToneBackground />
      <BookStage />
      <PasswordGate />
      <NavControls />
      <Lightbox />
      <LoadingScreen />
    </main>
  );
}
