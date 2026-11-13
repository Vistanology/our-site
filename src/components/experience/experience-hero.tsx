"use client";

import Link from "next/link";
import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Compass, MousePointerClick, Sparkles } from "lucide-react";
import styles from "./experience.module.css";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } },
};

function usePointerDepth(enabled: boolean) {
  const ref = useRef<HTMLElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 55, damping: 16, mass: 0.7 });
  const sy = useSpring(py, { stiffness: 55, damping: 16, mass: 0.7 });

  function track(event: ReactPointerEvent) {
    if (!enabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width - 0.5);
    py.set((event.clientY - rect.top) / rect.height - 0.5);
  }
  function release() {
    px.set(0);
    py.set(0);
  }

  return { ref, track, release, sx, sy };
}

export default function ExperienceHero({ motionEnabled }: { motionEnabled: boolean }) {
  const { ref, track, release, sx, sy } = usePointerDepth(motionEnabled);
  const deepX = useTransform(sx, [-0.5, 0.5], [26, -26]);
  const deepY = useTransform(sy, [-0.5, 0.5], [18, -18]);
  const midX = useTransform(sx, [-0.5, 0.5], [14, -14]);
  const midY = useTransform(sy, [-0.5, 0.5], [9, -9]);
  const tiltX = useTransform(sy, [-0.5, 0.5], [7, -7]);
  const tiltY = useTransform(sx, [-0.5, 0.5], [-9, 9]);

  return (
    <section
      ref={ref}
      className={styles.hero}
      id="experience-topo"
      onPointerMove={track}
      onPointerLeave={release}
    >
      <div className={styles.heroShards} aria-hidden="true">
        <motion.span className={`${styles.shard} ${styles.shardA}`} style={{ x: deepX, y: deepY }} />
        <motion.span className={`${styles.shard} ${styles.shardB}`} style={{ x: midX, y: midY }} />
        <motion.span className={`${styles.shard} ${styles.shardC}`} style={{ x: deepX, y: midY }} />
        <motion.span className={`${styles.shard} ${styles.shardD}`} style={{ x: midX, y: deepY }} />
      </div>

      <motion.div
        className={styles.heroInner}
        variants={container}
        initial={motionEnabled ? "hidden" : "visible"}
        animate="visible"
      >
        <motion.p className={`${styles.heroEyebrow} world-eyebrow`} variants={item}>
          <span aria-hidden="true" /> VISTANOLOGY EXPERIENCE
        </motion.p>
        <motion.h1 className={styles.heroTitle} variants={item}>
          <span className={styles.titleSheenWrap}>
            Ideias que merecem ser <em>experimentadas.</em>
            <span className={styles.titleSheen} aria-hidden="true" />
          </span>
        </motion.h1>
        <motion.p className={styles.heroLead} variants={item}>
          Um espaço para explorar possibilidades, conhecer tecnologias e descobrir o que podemos construir juntos.
        </motion.p>
        <motion.div className={styles.heroActions} variants={item}>
          <a className={`${styles.ctaPrimary} aero-button aero-button-primary`} href="#explore">
            <Compass size={17} /> Explorar experiências
          </a>
          <Link className={`${styles.ctaGhost} aero-button aero-button-glass`} href="/convite-para-criar-sistema">
            <Sparkles size={16} /> Construir algo comigo
          </Link>
        </motion.div>

        <motion.div className={styles.heroEmblem} variants={item} style={{ x: midX, y: midY }}>
          <motion.div className={styles.emblemTilt} style={{ rotateX: tiltX, rotateY: tiltY }}>
            <div className={styles.emblemOrbitTop} />
            <div className={styles.emblemCore}>
              <div className={`${styles.emblemLiquid} ${styles.emblemLiquidA}`} />
              <div className={`${styles.emblemLiquid} ${styles.emblemLiquidB}`} />
              <div className={styles.emblemFlare} />
            </div>
            <div className={styles.emblemOrbitBottom} />
            <div className={styles.emblemRadar}>
              <span className={styles.radarFlare} />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div className={styles.scrollCue} variants={item} initial={motionEnabled ? "hidden" : "visible"} animate="visible">
        <MousePointerClick size={14} aria-hidden="true" />
        <span>Deslize para entrar</span>
        <span className={styles.cueArrow} aria-hidden="true" />
      </motion.div>

      <div className={styles.heroFade} aria-hidden="true" />
    </section>
  );
}
