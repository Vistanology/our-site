"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Music2, VolumeX } from "lucide-react";
import { GlassEmblem } from "./brand";
import { asset } from "@/lib/asset";
import type { EntryChoice } from "@/lib/entry";

const DESKTOP_BG = "/images/aero-horizon.webp";
const MOBILE_BG = "/images/aero-horizon-mobile.webp";

const BUBBLES = [
  { left: "12%", size: 13, delay: 0.6, duration: 8.4, blur: 0 },
  { left: "24%", size: 8, delay: 2.6, duration: 9.8, blur: 1.5 },
  { left: "37%", size: 17, delay: 1.6, duration: 10.6, blur: 0 },
  { left: "52%", size: 9, delay: 3.4, duration: 8.8, blur: 2 },
  { left: "66%", size: 15, delay: 1.1, duration: 11.4, blur: 0 },
  { left: "79%", size: 7, delay: 4.1, duration: 9.2, blur: 2.5 },
  { left: "90%", size: 11, delay: 2.2, duration: 10, blur: 0 },
];

const MOTES = [
  { left: "7%", top: "46%", size: 3, delay: 0.4, duration: 8.2, drift: 26 },
  { left: "14%", top: "58%", size: 2, delay: 2.6, duration: 10, drift: -18 },
  { left: "22%", top: "36%", size: 4, delay: 1.2, duration: 9.4, drift: 22 },
  { left: "31%", top: "66%", size: 2, delay: 3.4, duration: 8.8, drift: -14 },
  { left: "39%", top: "30%", size: 3, delay: 0.9, duration: 11, drift: 20 },
  { left: "47%", top: "52%", size: 2, delay: 2, duration: 9.6, drift: -24 },
  { left: "55%", top: "42%", size: 3, delay: 1.7, duration: 10.6, drift: 16 },
  { left: "63%", top: "62%", size: 2, delay: 3, duration: 8.4, drift: -20 },
  { left: "70%", top: "34%", size: 4, delay: 0.6, duration: 9.8, drift: 24 },
  { left: "78%", top: "56%", size: 2, delay: 2.4, duration: 10.2, drift: -16 },
  { left: "85%", top: "44%", size: 3, delay: 1.4, duration: 9, drift: 18 },
  { left: "92%", top: "60%", size: 2, delay: 3.8, duration: 10.8, drift: -22 },
  { left: "44%", top: "70%", size: 3, delay: 2.2, duration: 11.4, drift: 14 },
  { left: "59%", top: "74%", size: 2, delay: 4.1, duration: 9.2, drift: -12 },
];

/** Each step awaits a real initialization milestone; the label describes what is actually happening. */
const LOAD_STEPS = [
  { label: "Inicializando ambiente…", weight: 0.42, minMs: 950, run: (backgroundSource: string) => decodeBackground(backgroundSource) },
  { label: "Preparando interfaces…", weight: 0.22, minMs: 700, run: () => document.fonts?.ready.then(() => undefined) ?? Promise.resolve() },
  { label: "Carregando experiências…", weight: 0.18, minMs: 700, run: () => nextFrame() },
  { label: "Sincronizando elementos visuais…", weight: 0.18, minMs: 700, run: () => waitForIdle() },
];
const READY_MESSAGE = "Tudo pronto para explorar.";
const STEP_TIMEOUT_MS = 5000;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
const waitForIdle = () => new Promise<void>((resolve) => {
  if ("requestIdleCallback" in window) requestIdleCallback(() => resolve());
  else setTimeout(resolve, 120);
});

function decodeBackground(source: string) {
  const image = new Image();
  image.src = asset(source);
  return image.decode().catch(() => undefined);
}

const subscribeCompact = (onChange: () => void) => {
  const query = window.matchMedia("(max-width: 700px)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const getCompact = () => window.matchMedia("(max-width: 700px)").matches;
const getServerCompact = () => false;

const welcomeContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } },
};
const welcomeItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 0.61, 0.36, 1] as const } },
};

export default function VistaBoot({ motionEnabled, onEnter }: { motionEnabled: boolean; onEnter: (choice: EntryChoice) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [phase, setPhase] = useState<"boot" | "welcome">("boot");
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState<EntryChoice | null>(null);
  const compact = useSyncExternalStore(subscribeCompact, getCompact, getServerCompact);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    const backgroundSource = window.matchMedia("(max-width: 700px)").matches ? MOBILE_BG : DESKTOP_BG;
    (async () => {
      let cumulative = 0;
      for (const step of LOAD_STEPS) {
        await Promise.all([
          Promise.race([step.run(backgroundSource), sleep(STEP_TIMEOUT_MS)]),
          motionEnabled ? sleep(step.minMs) : Promise.resolve(),
        ]);
        if (cancelled) return;
        cumulative += step.weight;
        setProgress(cumulative);
      }
      setProgress(1);
      timers.push(window.setTimeout(() => { if (!cancelled) setPhase("welcome"); }, motionEnabled ? 1100 : 200));
    })();
    return () => { cancelled = true; timers.forEach((timer) => clearTimeout(timer)); };
  }, [motionEnabled]);

  const duration = (seconds: number) => (motionEnabled ? seconds : 0);

  const stepIndex = progress >= 1
    ? -1
    : LOAD_STEPS.findIndex((_, index) => LOAD_STEPS.slice(0, index + 1).reduce((sum, step) => sum + step.weight, 0) > progress);
  const motes = useMemo(() => (compact ? MOTES.slice(0, 7) : MOTES), [compact]);
  const bubbles = useMemo(() => (compact ? BUBBLES.slice(0, 5) : BUBBLES), [compact]);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 42, damping: 20 });
  const smoothY = useSpring(pointerY, { stiffness: 42, damping: 20 });
  const bgX = useTransform(smoothX, (value) => value * -12);
  const bgY = useTransform(smoothY, (value) => value * -8);
  const bloomX = useTransform(smoothX, (value) => value * 16);
  const bloomY = useTransform(smoothY, (value) => value * 10);

  const handlePointerMove = (event: React.PointerEvent<HTMLDialogElement>) => {
    if (!motionEnabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX / rect.width) - 0.5) * 2);
    pointerY.set(((event.clientY / rect.height) - 0.5) * 2);
  };
  const resetPointer = () => { pointerX.set(0); pointerY.set(0); };

  const handleEnter = (choice: EntryChoice) => {
    if (exiting) return;
    setExiting(choice);
    window.setTimeout(() => onEnter(choice), motionEnabled ? 820 : 30);
  };

  return (
    <dialog
      ref={dialogRef}
      className="vista-boot"
      aria-label="Tela de entrada Vistanology"
      onCancel={(event) => event.preventDefault()}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <div className="boot-scene" aria-hidden="true">
        <motion.picture className="boot-bg-frame" style={{ x: bgX, y: bgY }}>
          <source media="(max-width: 700px)" srcSet={asset(MOBILE_BG)} />
          <motion.img
            className="boot-bg"
            src={asset(DESKTOP_BG)}
            alt=""
            width={1782}
            height={883}
            fetchPriority="high"
            initial={motionEnabled ? { opacity: 0, scale: 1.14 } : false}
            animate={{ opacity: 1, scale: 1.05 }}
            transition={{ duration: duration(2.6), ease: [0.22, 0.61, 0.36, 1] }}
          />
        </motion.picture>
        <motion.span className="boot-haze" initial={motionEnabled ? { opacity: 0 } : false} animate={{ opacity: 0.9 }} transition={{ duration: duration(1.8), delay: duration(0.2) }} />
        <motion.span className="boot-mist" initial={motionEnabled ? { opacity: 0 } : false} animate={{ opacity: 0.95 }} transition={{ duration: duration(2), delay: duration(0.4) }} />
        <motion.span className="boot-rays" initial={motionEnabled ? { opacity: 0 } : false} animate={{ opacity: 0.4 }} transition={{ duration: duration(2.8), delay: duration(0.8) }} />
        <motion.span className="boot-vignette" initial={motionEnabled ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ duration: duration(2.2) }} />
        <motion.span className="boot-bloom" style={{ x: bloomX, y: bloomY }} initial={motionEnabled ? { opacity: 0, scale: 0.9 } : false} animate={{ opacity: 1, scale: 1 }} transition={{ duration: duration(2), delay: duration(0.6), ease: "easeOut" }} />
        {motionEnabled && (
          <motion.span
            className="boot-sheen"
            initial={{ x: "-60vw", opacity: 0 }}
            animate={{ x: "60vw", opacity: [0, 0.55, 0.55, 0] }}
            transition={{ duration: 3.4, delay: 1.1, times: [0, 0.25, 0.75, 1], ease: "easeInOut" }}
          />
        )}
        {motionEnabled && motes.map((mote, index) => (
          <motion.span
            key={`mote-${index}`}
            className="boot-mote"
            style={{ left: mote.left, top: mote.top, width: mote.size, height: mote.size }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.7, 0.45, 0.7, 0],
              y: [0, -16, -30, -44, -60],
              x: [0, mote.drift * 0.3, mote.drift * 0.6, mote.drift * 0.85, mote.drift],
            }}
            transition={{ duration: mote.duration, repeat: Infinity, delay: mote.delay, ease: "easeInOut" }}
          />
        ))}
        {motionEnabled && bubbles.map((bubble, index) => (
          <motion.span
            key={`bubble-${index}`}
            className="boot-bubble"
            style={{ left: bubble.left, width: bubble.size, height: bubble.size, filter: `blur(${bubble.blur}px)` }}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: -420, opacity: [0, 0.85, 0] }}
            transition={{ duration: bubble.duration, repeat: Infinity, delay: bubble.delay, ease: "easeIn" }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {phase === "boot" ? (
          <motion.div
            key="boot-stage"
            className="boot-stage"
            exit={motionEnabled ? { opacity: 0, y: -26, filter: "blur(6px)", transition: { duration: 0.55, ease: "easeIn" } } : undefined}
          >
            <motion.div
              className="boot-emblem"
              initial={motionEnabled ? { opacity: 0, scale: 0.82, filter: "blur(10px)" } : false}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: duration(1.6), delay: duration(0.9), ease: [0.22, 0.61, 0.36, 1] }}
            >
              <motion.span className="boot-halo" initial={motionEnabled ? { opacity: 0, scale: 0.7 } : false} animate={{ opacity: 1, scale: 1 }} transition={{ duration: duration(1.8), delay: duration(0.7), ease: "easeOut" }} />
              <motion.span className="boot-halo-breath" animate={motionEnabled ? { opacity: [0.55, 0.95, 0.55], scale: [1, 1.06, 1] } : {}} transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 2.2 }} />
              <span className="boot-sphere">
                <GlassEmblem />
                {motionEnabled && (
                  <motion.span
                    className="boot-sphere-sheen"
                    initial={{ x: "-240%" }}
                    animate={{ x: "240%" }}
                    transition={{ duration: 1.5, delay: 2, ease: "easeInOut" }}
                  />
                )}
              </span>
            </motion.div>
            <motion.p
              className="boot-wordmark"
              initial={motionEnabled ? { opacity: 0, y: 18 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration(1.2), delay: duration(1.7), ease: "easeOut" }}
            >
              Vistanology
            </motion.p>
            <motion.div
              className="boot-loading"
              initial={motionEnabled ? { opacity: 0, y: 12 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration(0.9), delay: duration(1.7) }}
            >
              <div
                className="boot-bar"
                role="progressbar"
                aria-label="Carregando a experiência Vistanology"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
              >
                <motion.span
                  className="boot-fill"
                  animate={{ width: `${Math.max(progress * 100, 4)}%` }}
                  transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                >
                  {!progress && motionEnabled && (
                    <motion.span className="boot-fill-sheen" animate={{ x: ["-220%", "220%"] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} />
                  )}
                </motion.span>
                <motion.span
                  className="boot-tip"
                  aria-hidden="true"
                  animate={{ left: `${Math.max(progress * 100, 4)}%` }}
                  transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
              <div className="boot-status-slot">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={progress >= 1 ? "ready" : `step-${stepIndex}`}
                    className="boot-status"
                    initial={motionEnabled ? { opacity: 0, y: 8 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    exit={motionEnabled ? { opacity: 0, y: -8, transition: { duration: 0.28 } } : undefined}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                  >
                    {progress >= 1 ? READY_MESSAGE : LOAD_STEPS[stepIndex].label}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="boot-welcome"
            className="boot-welcome"
            data-motion={motionEnabled ? "on" : "off"}
            initial={motionEnabled ? { opacity: 0, y: 18 } : false}
            animate={exiting ? { opacity: 0.3, scale: 0.96, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: duration(0.5), ease: "easeOut" }}
          >
            <div className="welcome-card">
              <div className="welcome-aurora" aria-hidden="true">
                <span className="welcome-aurora-a" />
                <span className="welcome-aurora-b" />
                <span className="welcome-aurora-c" />
              </div>
              <span className="welcome-glow" aria-hidden="true" />
              <motion.div className="welcome-inner" variants={welcomeContainer} initial={motionEnabled ? "hidden" : false} animate="show">
                <motion.div className="welcome-head" variants={welcomeItem}>
                  <span className="welcome-orb" aria-hidden="true">
                    <GlassEmblem />
                    {motionEnabled && (
                      <motion.span
                        className="welcome-orb-sheen"
                        initial={{ x: "-170%" }}
                        animate={{ x: "170%" }}
                        transition={{ duration: 1.7, delay: 0.9, ease: "easeInOut" }}
                      />
                    )}
                  </span>
                  <div className="welcome-head-copy">
                    <span className="welcome-kicker">VISTANOLOGY</span>
                    <h2 className="welcome-title">Bem-vindo à Vistanology</h2>
                    <p className="welcome-sub">Tecnologia, criatividade e nostalgia. Um futuro mais bonito espera por você.</p>
                  </div>
                </motion.div>
                <motion.div className="welcome-actions" variants={welcomeItem}>
                  <button type="button" autoFocus className="welcome-choice welcome-choice-sound" onClick={() => handleEnter("sound")}>
                    <span className="welcome-choice-icon"><Music2 size={20} aria-hidden="true" /></span>
                    <span className="welcome-choice-text">
                      <span className="welcome-choice-label">Entrar com som</span>
                      <span className="welcome-choice-hint">Trilha ambiente começa baixinho</span>
                    </span>
                    <span className="welcome-choice-sheen" aria-hidden="true" />
                  </button>
                  <button type="button" className="welcome-choice welcome-choice-muted" onClick={() => handleEnter("muted")}>
                    <span className="welcome-choice-icon"><VolumeX size={20} aria-hidden="true" /></span>
                    <span className="welcome-choice-text">
                      <span className="welcome-choice-label">Entrar sem som</span>
                      <span className="welcome-choice-hint">Silêncio total, sem autoplay</span>
                    </span>
                    <span className="welcome-choice-sheen" aria-hidden="true" />
                  </button>
                </motion.div>
                <motion.p className="welcome-note" variants={welcomeItem}>
                  A trilha “Sunlight Underwater” começa baixinho apenas depois do seu clique.
                  Você pode silenciar tudo a qualquer momento no topo da página.
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "boot" && (
        <button type="button" className="boot-skip" onClick={() => setPhase("welcome")}>Pular introdução</button>
      )}
      {exiting && (
        <motion.span className="boot-exit-bloom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.72, ease: "easeIn" }} aria-hidden="true" />
      )}
      <p className="boot-footer">© Vistanology · Um futuro mais bonito</p>
    </dialog>
  );
}
