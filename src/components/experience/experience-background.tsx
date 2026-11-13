"use client";

import type { CSSProperties } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { asset } from "@/lib/asset";
import styles from "./experience.module.css";

// Fixed values keep SSR and client markup identical (no randomness).
const bubbles = [
  { size: 26, left: "8%", dur: 26, delay: 0, drift: 34 },
  { size: 14, left: "18%", dur: 32, delay: -9, drift: -22 },
  { size: 40, left: "31%", dur: 38, delay: -20, drift: 46 },
  { size: 10, left: "44%", dur: 24, delay: -5, drift: -16 },
  { size: 22, left: "57%", dur: 30, delay: -14, drift: 28 },
  { size: 12, left: "68%", dur: 27, delay: -22, drift: -30 },
  { size: 34, left: "79%", dur: 40, delay: -8, drift: 40 },
  { size: 16, left: "91%", dur: 29, delay: -17, drift: -20 },
];

const shootingStars = [
  { top: "12%", left: "58%", delay: 0, dur: 14, scale: 1 },
  { top: "30%", left: "22%", delay: -7.5, dur: 19, scale: 0.7 },
];

export default function ExperienceBackground({ motionEnabled }: { motionEnabled: boolean }) {
  const { scrollY } = useScroll();
  const yNebula = useTransform(scrollY, [0, 2600], [0, motionEnabled ? -170 : 0]);
  const yStars = useTransform(scrollY, [0, 2600], [0, motionEnabled ? -90 : 0]);
  const yBubbles = useTransform(scrollY, [0, 2600], [0, motionEnabled ? -300 : 0]);
  const yShafts = useTransform(scrollY, [0, 2600], [0, motionEnabled ? -60 : 0]);
  const yGrid = useTransform(scrollY, [0, 2600], [0, motionEnabled ? -220 : 0]);

  return (
    <>
      {/* Wallpaper stays pinned to the viewport (a fixed layer), so it is never stretched by the
          full-height background stack behind it. */}
      <div className={styles.wallpaper} aria-hidden="true">
        <picture>
          <source media="(max-width: 700px)" srcSet={asset("/images/coastal-world-1000.webp")} />
          <img src={asset("/images/coastal-world.webp")} alt="" width={1792} height={1024} fetchPriority="high" />
        </picture>
        <div className={styles.wallpaperScrim} />
      </div>

      <div className={styles.bg} aria-hidden="true">
        <motion.div className={styles.nebulaA} style={{ y: yNebula }} />
        <motion.div className={styles.nebulaB} style={{ y: yNebula }} />

        <div className={styles.auroraWrap}>
          <div className={`${styles.aurora} ${styles.auroraCyan}`} />
          <div className={`${styles.aurora} ${styles.auroraViolet}`} />
          <div className={`${styles.aurora} ${styles.auroraGreen}`} />
        </div>

        <motion.div className={styles.shafts} style={{ y: yShafts }} />

        <motion.div className={styles.starLayers} style={{ y: yStars }}>
          <div className={`${styles.starLayer} ${styles.starLayerA}`} />
          <div className={`${styles.starLayer} ${styles.starLayerB}`} />
          <div className={`${styles.starLayer} ${styles.starLayerC}`} />
        </motion.div>

        {shootingStars.map((star, i) => (
          <div
            key={i}
            className={styles.shootingStar}
            style={{ top: star.top, left: star.left, animationDelay: `${star.delay}s`, animationDuration: `${star.dur}s`, scale: `${star.scale}` }}
          />
        ))}

        <motion.div className={styles.bubbleField} style={{ y: yBubbles }}>
          {bubbles.map((bubble, i) => (
            <span
              key={i}
              className={styles.risingBubble}
              style={{
                width: bubble.size,
                height: bubble.size,
                left: bubble.left,
                animationDuration: `${bubble.dur}s`,
                animationDelay: `${bubble.delay}s`,
                "--drift": `${bubble.drift}px`,
              } as CSSProperties}
            />
          ))}
        </motion.div>

        <motion.div className={styles.causticGrid} style={{ y: yGrid }} />
        <div className={styles.bgVignette} />
      </div>
    </>
  );
}
