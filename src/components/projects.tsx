"use client";

import Showroom from "./showroom/showroom";
import styles from "./showroom/showroom.module.css";

export default function Projects({ motionEnabled }: { motionEnabled: boolean }) {
  return <section id="projetos" className="section projects-section"><div className="shell">
    <div className="section-heading heading-row"><div><span className="eyebrow">O QUE PODEMOS CRIAR</span><h2 className={styles.showroomTitle}>Não imaginamos apenas o futuro. <span>Construímos experiências para chegar até ele.</span></h2><p>Tecnologia, engenharia e criatividade trabalhando juntas para transformar ideias em experiências digitais reais.</p></div><span className="section-counter">SHOWROOM · 3 DEMONSTRAÇÕES</span></div>
    <Showroom motionEnabled={motionEnabled} />
  </div></section>;
}
