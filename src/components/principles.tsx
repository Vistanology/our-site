"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, MessagesSquare, ShieldCheck, Sparkles, Waves } from "lucide-react";

const PRINCIPLES = [
  { Icon: MessagesSquare, tint: "cyan", title: "Clareza antes de código", text: "Conversamos até a ideia fazer sentido. Escopo, prazo e investimento alinhados antes da primeira linha." },
  { Icon: Sparkles, tint: "magenta", title: "Estética com propósito", text: "Cada cor, vidro e movimento existe para comunicar algo. Beleza que ajuda a usar, não que atrapalha." },
  { Icon: ShieldCheck, tint: "green", title: "Honestidade radical", text: "Sem sucesso falso, sem promessa vazia. Se algo ainda não existe ou não está pronto, dizemos exatamente isso." },
  { Icon: Waves, tint: "violet", title: "Vida em cada detalhe", text: "Interfaces que respiram: luz, reflexos e resposta ao seu toque. Tecnologia que parece sentir." },
];

const MATERIALS = ["Next.js", "React", "TypeScript", "Tailwind CSS", "Framer Motion", "Web Audio API", "SVG & Canvas", "Roblox Luau", "GitHub Pages"];

export default function Principles({ motionEnabled }: { motionEnabled: boolean }) {
  return <section id="principios" className="section principles-section">
    <div className="shell">
      <div className="section-heading principles-heading">
        <span className="eyebrow"><Sparkles size={14} /> NOSSO JEITO DE CONSTRUIR</span>
        <h2>Princípios que não <span>saem de moda.</span></h2>
        <p>O futuro que imaginamos não é só visual. É também como trabalhamos, conversamos e entregamos.</p>
      </div>
      <div className="principles-grid">
        {PRINCIPLES.map(({ Icon, tint, title, text }, index) => (
          <motion.article
            key={title}
            className={`principle-card glass-panel principle-${tint}`}
            initial={motionEnabled ? { opacity: 0, y: 26 } : false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="principle-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <motion.span className="principle-orb" aria-hidden="true" animate={motionEnabled ? { y: [0, -7, 0] } : { y: 0 }} transition={{ duration: 7 + index, repeat: motionEnabled ? Infinity : 0, ease: "easeInOut" }}>
              <Icon size={22} strokeWidth={1.6} />
            </motion.span>
            <h3>{title}</h3>
            <p>{text}</p>
          </motion.article>
        ))}
      </div>
      <div className="materials-strip glass-panel">
        <span className="materials-label">Matéria-prima digital</span>
        {motionEnabled ? (
          <div className="materials-marquee">
            <motion.div className="materials-flow" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 32, repeat: Infinity, ease: "linear" }}>
              <ul className="materials-track">{MATERIALS.map((item) => <li key={item}>{item}</li>)}</ul>
              <ul className="materials-track" aria-hidden="true">{MATERIALS.map((item) => <li key={item}>{item}</li>)}</ul>
            </motion.div>
          </div>
        ) : (
          <ul className="materials-track materials-static">{MATERIALS.map((item) => <li key={item}>{item}</li>)}</ul>
        )}
        <a className="text-link materials-link" href="#duvidas">Como isso chega até você<ArrowUpRight size={16} /></a>
      </div>
    </div>
  </section>;
}