"use client";

import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useState, type FormEvent } from "react";
import { PASSWORD, PASSWORD_HINT, SITE_TITLE } from "@/config";
import { playMusic } from "@/lib/music";
import { useBookStore } from "@/store/useBookStore";
import { CuteCat } from "./CuteCat";
import { HeartBurst } from "./HeartBurst";

const numericPassword = /^\d+$/.test(PASSWORD);

function matches(input: string) {
  const value = numericPassword ? input.replace(/\D/g, "") : input.trim().toLowerCase();
  return value === (numericPassword ? PASSWORD : PASSWORD.toLowerCase());
}

export function PasswordGate() {
  const ready = useBookStore((s) => s.ready);
  const unlocked = useBookStore((s) => s.unlocked);
  const portrait = useBookStore((s) => s.portrait);
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);
  const [bursting, setBursting] = useState(false);
  const shake = useAnimationControls();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (bursting) return;
    if (!matches(value)) {
      setWrong(true);
      useBookStore.getState().registerWrong();
      void shake.start({ x: [0, -14, 12, -10, 8, -4, 0], transition: { duration: 0.5 } });
      return;
    }
    setWrong(false);
    setBursting(true);
    void playMusic().then((ok) => ok && useBookStore.getState().setMusic({ musicOn: true }));
    setTimeout(() => useBookStore.getState().unlock(), 650);
    setTimeout(() => setBursting(false), 2200);
  };

  const show = ready && !unlocked;

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            key="gate"
            className={
              portrait
                ? "fixed inset-x-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-30"
                : "fixed right-[7%] top-1/2 z-30 w-[380px] -translate-y-1/2"
            }
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9, transition: { duration: 0.45 } }}
            transition={{ type: "spring", stiffness: 160, damping: 18, delay: 0.3 }}
          >
            <motion.form animate={shake} onSubmit={submit} className="glass rounded-[28px] px-6 pb-6 pt-5 text-center">
              <div className="mx-auto -mt-14 mb-1 h-20 w-20">
                <motion.div
                  key={wrong ? "sad" : "happy"}
                  initial={{ rotate: 0 }}
                  animate={wrong ? { rotate: [0, -12, 12, -12, 12, 0] } : { y: [0, -6, 0] }}
                  transition={wrong ? { duration: 0.7 } : { duration: 2, repeat: Infinity }}
                >
                  <CuteCat mood={wrong ? "sad" : bursting ? "love" : "happy"} className="h-20 w-20 drop-shadow-md" />
                </motion.div>
              </div>
              <h1 className="font-title text-4xl text-[#ff5d8f] drop-shadow-sm">{SITE_TITLE}</h1>
              <p className="mt-2 text-sm text-[#9b3a5f]">Nhập mật khẩu để mở cuốn sách nhỏ này nha 💗</p>

              <div className="mt-4 flex items-center gap-2">
                <input
                  type="password"
                  inputMode={numericPassword ? "numeric" : "text"}
                  autoComplete="off"
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    if (wrong) setWrong(false);
                  }}
                  placeholder="••••••••"
                  aria-label="Mật khẩu"
                  className="min-w-0 flex-1 rounded-full border-2 border-[#ffc2d4] bg-white/80 px-5 py-3 text-center text-lg tracking-[0.3em] text-[#7a2244] outline-none transition focus:border-[#ff8fab] focus:bg-white"
                />
                <button type="submit" className="pink-button grid h-12 w-12 shrink-0 place-items-center rounded-full text-xl" aria-label="Mở sách">
                  <span className="animate-heartbeat">💗</span>
                </button>
              </div>

              <div className="mt-3 min-h-[1.5rem] text-sm">
                <AnimatePresence mode="wait">
                  {wrong ? (
                    <motion.p
                      key="wrong"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="font-semibold text-[#c9184a]"
                    >
                      Sai rồi nha 😾 thử lại đi
                    </motion.p>
                  ) : (
                    <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[#b45c7e]">
                      Gợi ý: {PASSWORD_HINT}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
      {bursting && <HeartBurst />}
    </>
  );
}
