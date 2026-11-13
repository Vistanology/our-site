"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ExperienceReveal from "./experience-reveal";
import styles from "./experience.module.css";

export default function BuildSection({ motionEnabled }: { motionEnabled: boolean }) {
  return (
    <section className={styles.section} id="construa">
      <div className={styles.sectionInner}>
        <ExperienceReveal motionEnabled={motionEnabled} className={styles.buildPanel}>
          <div className={`${styles.buildCard} glass-panel`}>
            <span className={styles.buildHalo} aria-hidden="true" />
            <p className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" /> Construa</p>
            <h2 className={styles.buildTitle}>E se construíssemos <span>sua próxima ideia?</span></h2>
            <p className={styles.buildText}>
              Conte o que você está imaginando. A Vistanology pode ajudar a transformar essa possibilidade em algo real.
            </p>
            <Link
              className={`${styles.ctaPrimary} aero-button aero-button-primary`}
              href="/convite-para-criar-sistema"
            >
              Começar um projeto <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <p className={styles.buildNote}>O convite abre a mesma experiência de briefing que já existe neste site.</p>
          </div>
        </ExperienceReveal>
      </div>
    </section>
  );
}
