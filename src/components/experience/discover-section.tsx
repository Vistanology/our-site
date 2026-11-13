"use client";

import { Boxes, Globe2, LayoutTemplate, Plug, Shapes, Workflow } from "lucide-react";
import ExperienceReveal, { ExperienceTilt } from "./experience-reveal";
import styles from "./experience.module.css";

const areas = [
  { Icon: Boxes, name: "Sistemas personalizados", text: "Ferramentas desenhadas para o jeito que o seu trabalho acontece." },
  { Icon: Globe2, name: "Experiências digitais", text: "Ambientes interativos com identidade, profundidade e movimento." },
  { Icon: LayoutTemplate, name: "Websites e plataformas", text: "Presenças digitais que unem estética e engenharia." },
  { Icon: Workflow, name: "Automação de processos", text: "Rotinas repetitivas transformadas em fluxos claros." },
  { Icon: Plug, name: "Integrações", text: "Conexão entre as ferramentas que já fazem parte do seu dia." },
  { Icon: Shapes, name: "Experiências interativas e 3D", text: "Universos exploráveis e composições visuais em tempo real." },
];

export default function DiscoverSection({ motionEnabled }: { motionEnabled: boolean }) {
  return (
    <section className={styles.section} id="descubra">
      <div className={styles.sectionInner}>
        <ExperienceReveal motionEnabled={motionEnabled} className={styles.sectionHead}>
          <p className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" /> Descubra</p>
          <h2 className={styles.sectionTitle}>
            Uma ideia pode se transformar <span>em muita coisa.</span>
          </h2>
          <p className={styles.sectionText}>
            Áreas onde gostamos de trabalhar. O alcance de cada projeto é conversado de perto, com o que está
            comprovadamente dentro das nossas capacidades.
          </p>
        </ExperienceReveal>

        <div className={styles.areaGrid}>
          {areas.map(({ Icon, name, text }, i) => (
            <ExperienceReveal key={name} delay={i * 0.05} motionEnabled={motionEnabled} className={styles.revealFill}>
              <ExperienceTilt motionEnabled={motionEnabled} maxTilt={4} className={`${styles.areaCard} ${styles.tiltCard} glass-panel`}>
                <span className={styles.areaIcon}><Icon size={20} aria-hidden="true" /></span>
                <div>
                  <h3 className={styles.areaName}>{name}</h3>
                  <p className={styles.areaText}>{text}</p>
                </div>
              </ExperienceTilt>
            </ExperienceReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
