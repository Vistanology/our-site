"use client";

import { motion } from "framer-motion";
import styles from "./showroom.module.css";
import WorldsPreview from "./worlds-preview";
import SystemsPreview from "./systems-preview";
import ExperiencePreview from "./experience-preview";

const CARDS = [
  {
    index: "01",
    kind: "IMMERSIVE WORLDS",
    title: "Mundos que parecem vivos.",
    desc: "Experiências interativas, ambientes exploráveis, atmosferas, arquitetura digital e mundos construídos com identidade própria.",
    chips: ["Roblox Studio", "Luau", "Worldbuilding", "Game Design", "Ambientes 3D"],
    points: [
      "Arraste a hora do dia: céu, água, janelas e sombras acompanham o astro.",
      "Parallax de quatro camadas responde ao cursor como uma câmera.",
      "Presets de composição entram em cena com transição animada.",
    ],
    badge: "PREVIEW CONCEITUAL · NÃO É GAMEPLAY.",
    badgeClass: styles.badgeWorlds,
    Preview: WorldsPreview,
    previewClass: undefined,
    reverse: false,
  },
  {
    index: "02",
    kind: "DIGITAL SYSTEMS",
    title: "Ferramentas que transformam ideias em sistemas.",
    desc: "Software, aplicações, ferramentas digitais e soluções pensadas para resolver problemas e tornar processos mais claros.",
    chips: ["Desenvolvimento de software", "Engenharia de sistemas", "Interfaces administrativas", "Automação", "Arquitetura digital"],
    points: [
      "Cinco áreas navegáveis com dados fictícios e estados reais de interface.",
      "Busca, período, toggles e exportação CSV funcionam aqui no navegador.",
    ],
    badge: "MOCKUP DE INTERFACE · DADOS FICTÍCIOS.",
    badgeClass: styles.badgeSystems,
    Preview: SystemsPreview,
    previewClass: styles.previewTall,
    reverse: false,
  },
  {
    index: "03",
    kind: "DIGITAL EXPERIENCES",
    title: "Interfaces que dão forma à imaginação.",
    desc: "Experiências digitais, sistemas visuais e interfaces que unem clareza, identidade, acessibilidade e tecnologia.",
    chips: ["UI/UX Design", "Design digital", "Microinterações", "Prototipagem", "Experiências web"],
    points: [
      "Paleta, forma e tema claro/escuro são aplicados ao vivo no protótipo.",
      "Microinterações de registro e detalhes acontecem de verdade no componente.",
    ],
    badge: "PROTÓTIPO VISUAL · EXEMPLO CONCEITUAL.",
    badgeClass: styles.badgeExperience,
    Preview: ExperiencePreview,
    previewClass: undefined,
    reverse: false,
  },
];

export default function Showroom({ motionEnabled }: { motionEnabled: boolean }) {
  return (
    <div className={styles.showroom}>
      {CARDS.map((card) => (
        <motion.article
          key={card.index}
          className={`${styles.card} ${card.reverse ? styles.cardReverse : ""}`}
          initial={motionEnabled ? { opacity: 0, y: 24 } : { opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className={`${styles.preview} ${card.previewClass ?? ""}`}>
            <card.Preview motionEnabled={motionEnabled} />
          </div>
          <div className={styles.copy}>
            <div className={styles.indexRow}>
              <span className={styles.index}>{card.index}</span>
              <span className={styles.kind}>{card.kind}</span>
            </div>
            <h3 className={styles.cardTitle}>{card.title}</h3>
            <p className={styles.cardDesc}>{card.desc}</p>
            <div className={styles.chips}>{card.chips.map((chip) => <span key={chip} className={styles.chip}>{chip}</span>)}</div>
            <ul className={styles.points}>
              {card.points.map((point) => <li key={point} className={styles.point}>{point}</li>)}
            </ul>
            <span className={`${styles.badge} ${card.badgeClass}`}>{card.badge}</span>
          </div>
        </motion.article>
      ))}
    </div>
  );
}