"use client";

import Image from "next/image";
import ExperienceReveal, { ExperienceTilt } from "./experience-reveal";
import { asset } from "@/lib/asset";
import styles from "./experience.module.css";

const universes = [
  {
    title: "Litoral Vivo",
    kind: "Universo conceitual",
    text: "Um mundo de costa, luz e água que serve de palco para experimentos visuais da Vistanology.",
    image: "/images/coastal-world-1000.webp",
    width: 1000,
    height: 571,
    featured: true,
  },
  {
    title: "Continuação subaquática",
    kind: "Universo conceitual",
    text: "A exploração desce abaixo da superfície: profundidade, caustics e silêncio como identidade.",
    image: "/images/underwater-world-1000.webp",
    width: 1000,
    height: 571,
    featured: false,
  },
  {
    title: "Jardim de vidro",
    kind: "Estudo de atmosfera",
    text: "Um recorte da lagoa que pesquisa como elementos naturais e superfícies translúcidas conversam.",
    image: "/images/lagoon-concept.webp",
    width: 800,
    height: 800,
    featured: false,
  },
];

export default function ExploreSection({ motionEnabled }: { motionEnabled: boolean }) {
  const [featured, ...rest] = universes;

  return (
    <section className={styles.section} id="explore">
      <div className={styles.sectionInner}>
        <ExperienceReveal motionEnabled={motionEnabled} className={styles.sectionHead}>
          <p className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" /> Explore</p>
          <h2 className={styles.sectionTitle}>
            Não são apenas projetos. <span>São possibilidades.</span>
          </h2>
          <p className={styles.sectionText}>Conheça alguns dos universos digitais que estamos desenvolvendo.</p>
        </ExperienceReveal>

        <div className={styles.exploreGrid}>
          <ExperienceReveal motionEnabled={motionEnabled} className={styles.revealFill}>
            <ExperienceTilt motionEnabled={motionEnabled} className={`${styles.exploreFeature} ${styles.tiltCard} glass-panel`}>
              <div className={styles.exploreImage}>
                <Image
                  src={asset(featured.image)}
                  alt={`Arte conceitual do universo ${featured.title}: paisagem costeira com céu azul e água cristalina`}
                  width={featured.width}
                  height={featured.height}
                  sizes="(max-width: 960px) 100vw, 62vw"
                />
              </div>
              <div className={styles.exploreBody}>
                <p className={styles.exploreBadge}>{featured.kind} · em desenvolvimento</p>
                <h3 className={styles.exploreTitle}>{featured.title}</h3>
                <p className={styles.exploreText}>{featured.text}</p>
              </div>
            </ExperienceTilt>
          </ExperienceReveal>

          <div className={styles.exploreSide}>
            {rest.map((universe) => (
              <ExperienceReveal key={universe.title} delay={0.08} motionEnabled={motionEnabled} className={styles.revealFill}>
                <ExperienceTilt motionEnabled={motionEnabled} maxTilt={4} className={`${styles.exploreItem} ${styles.tiltCard} glass-panel`}>
                  <div className={styles.exploreThumb}>
                    <Image
                      src={asset(universe.image)}
                      alt={`Arte conceitual do estudo ${universe.title}`}
                      width={universe.width}
                      height={universe.height}
                      sizes="(max-width: 960px) 100vw, 30vw"
                    />
                  </div>
                  <div className={styles.exploreBody}>
                    <p className={styles.exploreBadge}>{universe.kind} · em desenvolvimento</p>
                    <h3 className={styles.exploreTitleSmall}>{universe.title}</h3>
                    <p className={styles.exploreText}>{universe.text}</p>
                  </div>
                </ExperienceTilt>
              </ExperienceReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
