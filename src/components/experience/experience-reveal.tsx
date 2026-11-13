"use client";

import { useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import styles from "./experience.module.css";

function subscribeMotionPreference(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
function getMotionPreference() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useMotionChoice() {
  const reducedMotion = useSyncExternalStore(subscribeMotionPreference, getMotionPreference, () => true);
  const [motionChoice, setMotionChoice] = useState<boolean | null>(null);
  const motionEnabled = motionChoice ?? !reducedMotion;
  return { motionEnabled, toggleMotion: () => setMotionChoice(!motionEnabled) };
}

export default function ExperienceReveal({
  children,
  className,
  delay = 0,
  motionEnabled,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  motionEnabled: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial={motionEnabled ? { opacity: 0, y: 28 } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function ExperienceTilt({
  children,
  className,
  motionEnabled,
  maxTilt = 5,
}: {
  children: ReactNode;
  className?: string;
  motionEnabled: boolean;
  maxTilt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const springRx = useSpring(rx, { stiffness: 140, damping: 13, mass: 0.5 });
  const springRy = useSpring(ry, { stiffness: 140, damping: 13, mass: 0.5 });

  function move(event: ReactPointerEvent) {
    if (!motionEnabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ry.set(((event.clientX - rect.left) / rect.width - 0.5) * maxTilt * 2);
    rx.set(-((event.clientY - rect.top) / rect.height - 0.5) * maxTilt * 2);
  }
  function leave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX: springRx, rotateY: springRy, transformPerspective: 950 }}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      {children}
      <span className={styles.tiltSheen} aria-hidden="true" />
    </motion.div>
  );
}
