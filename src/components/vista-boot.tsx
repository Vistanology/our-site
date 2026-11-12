"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Music2, VolumeX } from "lucide-react";
import { GlassEmblem } from "./brand";
import type { EntryChoice } from "@/lib/entry";

const BUBBLES = [
  { left: "14%", size: 12, delay: 0, duration: 6.4 },
  { left: "27%", size: 7, delay: 1.6, duration: 7.8 },
  { left: "41%", size: 16, delay: 0.8, duration: 8.6 },
  { left: "58%", size: 9, delay: 2.4, duration: 6.9 },
  { left: "69%", size: 14, delay: 0.4, duration: 9.2 },
  { left: "82%", size: 8, delay: 1.9, duration: 7.2 },
  { left: "91%", size: 11, delay: 3.1, duration: 8.1 },
];

export default function VistaBoot({ motionEnabled, onEnter }: { motionEnabled: boolean; onEnter: (choice: EntryChoice) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [phase, setPhase] = useState<"boot" | "welcome">("boot");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => setPhase("welcome"), motionEnabled ? 3400 : 900);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, [motionEnabled]);

  const duration = (seconds: number) => (motionEnabled ? seconds : 0);

  return (
    <dialog
      ref={dialogRef}
      className="vista-boot"
      aria-label="Tela de entrada Vistanology"
      onCancel={(event) => event.preventDefault()}
    >
      <div className="boot-scene" aria-hidden="true">
        <motion.span
          className="boot-sun"
          initial={motionEnabled ? { y: 140, opacity: 0, scale: 0.6 } : false}
          animate={{ y: 0, opacity: 0.95, scale: 1 }}
          transition={{ duration: duration(2.6), ease: "easeOut" }}
        />
        <motion.span
          className="boot-rays"
          initial={motionEnabled ? { opacity: 0 } : false}
          animate={{ opacity: 0.5 }}
          transition={{ duration: duration(3), ease: "easeInOut" }}
        />
        <div className="boot-aurora">
          <motion.span
            className="boot-aurora-a"
            animate={motionEnabled ? { x: [0, 70, -34, 0], y: [0, -28, 14, 0], opacity: [0.55, 0.9, 0.6, 0.55] } : {}}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            className="boot-aurora-b"
            animate={motionEnabled ? { x: [0, -60, 28, 0], y: [0, 20, -16, 0], opacity: [0.4, 0.75, 0.45, 0.4] } : {}}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <div className="boot-water">
          <motion.span
            className="boot-water-shimmer"
            animate={motionEnabled ? { x: ["-8%", "8%", "-8%"], opacity: [0.35, 0.6, 0.35] } : {}}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        {motionEnabled && BUBBLES.map((bubble, index) => (
          <motion.span
            key={index}
            className="boot-bubble"
            style={{ left: bubble.left, width: bubble.size, height: bubble.size }}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: -320, opacity: [0, 0.85, 0] }}
            transition={{ duration: bubble.duration, repeat: Infinity, delay: bubble.delay, ease: "easeIn" }}
          />
        ))}
      </div>

      {phase === "boot" ? (
        <div className="boot-stage">
          <motion.div
            className="boot-emblem"
            initial={motionEnabled ? { scale: 0.5, opacity: 0, filter: "blur(8px)" } : false}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: duration(1.6), ease: "easeOut" }}
          >
            <motion.span
              className="boot-emblem-glow"
              animate={motionEnabled ? { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] } : {}}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <GlassEmblem />
          </motion.div>
          <motion.p
            className="boot-wordmark"
            initial={motionEnabled ? { opacity: 0, y: 14 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration(1.1), delay: duration(0.7), ease: "easeOut" }}
          >
            Vistanology
          </motion.p>
          <div className="boot-bar" role="progressbar" aria-label="Carregando a experiência Vistanology">
            <motion.span
              className="boot-scan"
              animate={motionEnabled ? { x: ["-130%", "330%"] } : { x: "90%" }}
              transition={{ duration: 1.15, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <p className="boot-status">Iniciando sua experiência…</p>
        </div>
      ) : (
        <motion.div
          className="boot-welcome"
          initial={motionEnabled ? { opacity: 0, y: 18 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration(0.5), ease: "easeOut" }}
        >
          <div className="welcome-tile">
            <span className="welcome-avatar" aria-hidden="true"><GlassEmblem /></span>
            <div className="welcome-copy">
              <h2 className="welcome-title">Bem-vindo à Vistanology</h2>
              <p className="welcome-sub">Tecnologia, criatividade e nostalgia. Um futuro mais bonito espera por você.</p>
            </div>
          </div>
          <div className="welcome-actions">
            <button type="button" autoFocus className="aero-button aero-button-primary" onClick={() => onEnter("sound")}>
              <Music2 size={17} aria-hidden="true" />Entrar com som
            </button>
            <button type="button" className="aero-button aero-button-glass" onClick={() => onEnter("muted")}>
              <VolumeX size={17} aria-hidden="true" />Entrar sem som
            </button>
          </div>
          <p className="welcome-note">
            A trilha “Sunlight Underwater” começa baixinho apenas depois do seu clique.
            Você pode silenciar tudo a qualquer momento no topo da página.
          </p>
        </motion.div>
      )}

      {phase === "boot" && (
        <button type="button" className="boot-skip" onClick={() => setPhase("welcome")}>Pular introdução</button>
      )}
      <p className="boot-footer">© Vistanology · um futuro mais bonito</p>
    </dialog>
  );
}
