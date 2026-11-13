"use client";

import type { ReactNode } from "react";
import ExperienceReveal, { ExperienceTilt } from "./experience-reveal";
import styles from "./experience.module.css";

export default function ExperienceCard({
  index,
  name,
  category,
  description,
  badge,
  motionEnabled,
  delay = 0,
  children,
}: {
  index: string;
  name: string;
  category: string;
  description: string;
  badge: string;
  motionEnabled: boolean;
  delay?: number;
  children: ReactNode;
}) {
  return (
    <ExperienceReveal motionEnabled={motionEnabled} delay={delay} className={styles.revealFill}>
      <ExperienceTilt motionEnabled={motionEnabled} maxTilt={3.5} className={`${styles.demoCard} ${styles.tiltCard} glass-panel`}>
        <div className={styles.demoInfo}>
          <p className={styles.demoIndex}>DEMO {index}</p>
          <h3 className={styles.demoName}>
            <span className={styles.nameSheen}>{name}</span>
          </h3>
          <p className={styles.demoCategory}>{category}</p>
          <p className={styles.demoDescription}>{description}</p>
          <div className={styles.demoStatus}>
            <span className={styles.statusDot} aria-hidden="true" />
            Em desenvolvimento
          </div>
        </div>
        <div className={styles.demoStage}>
          <div className={styles.stageHalo} aria-hidden="true" />
          <span className={`${styles.stageMote} ${styles.stageMoteA}`} aria-hidden="true" />
          <span className={`${styles.stageMote} ${styles.stageMoteB}`} aria-hidden="true" />
          <span className={`${styles.stageMote} ${styles.stageMoteC}`} aria-hidden="true" />
          <div className={styles.demoVisual} aria-hidden="true">{children}</div>
          <p className={styles.demoBadge}>{badge}</p>
          <div data-demo-slot hidden />
        </div>
      </ExperienceTilt>
    </ExperienceReveal>
  );
}
