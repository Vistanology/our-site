"use client";

import Link from "next/link";
import Navbar from "../navbar";
import ExperienceBackground from "./experience-background";
import ExperienceHero from "./experience-hero";
import ExperienceNavigation from "./experience-navigation";
import ExploreSection from "./explore-section";
import ExperimentsSection from "./experiments-section";
import DiscoverSection from "./discover-section";
import ExperienceDivider from "./experience-divider";
import BuildSection from "./build-section";
import { useMotionChoice } from "./experience-reveal";
import styles from "./experience.module.css";

export default function ExperiencePage() {
  const { motionEnabled, toggleMotion } = useMotionChoice();

  return (
    <div className={`${styles.page} vistanology`} data-page="experience" data-motion={motionEnabled ? "on" : "off"}>
      <a className="skip-link" href="#experience-conteudo">Pular para o conteúdo</a>

      <ExperienceBackground motionEnabled={motionEnabled} />

      <Navbar motionEnabled={motionEnabled} onToggleMotion={toggleMotion} />

      <main id="experience-conteudo">
        <ExperienceHero motionEnabled={motionEnabled} />
        <ExperienceNavigation />
        <ExploreSection motionEnabled={motionEnabled} />
        <ExperimentsSection motionEnabled={motionEnabled} />
        <DiscoverSection motionEnabled={motionEnabled} />
        <ExperienceDivider />
        <BuildSection motionEnabled={motionEnabled} />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerTitle}><span>VISTANOLOGY</span> EXPERIENCE</p>
          <nav className={styles.footerLinks} aria-label="Outras páginas">
            <Link href="/">Universo Vistanology</Link>
            <Link href="/convite-para-criar-sistema">Convite para criar um sistema</Link>
            <Link href="/quem-e-o-dono">Quem é o dono?</Link>
          </nav>
          <p className={styles.footerNote}>Ideas become experiences. Um showroom em construção — sem promessas além do que já existe.</p>
        </div>
      </footer>
    </div>
  );
}
