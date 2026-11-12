"use client";

import { useRef } from "react";
import { ArrowDown, ArrowRight, CodeXml, Globe2, Heart, Play, Sparkles } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import GlassTitle from "./glass-title";
import LivingBackground from "./living-background";
import { GlassEmblem } from "./brand";

export default function Hero({ onOrder, motionEnabled }: { onOrder: () => void; motionEnabled: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  // The strip dissolves before it slips under the fixed glass navbar, so its
  // text can never ghost through the blur at the #universo anchor.
  const { scrollYProgress } = useScroll({ target: bottomRef, offset: ["start 0.36", "start 0.12"] });
  const bottomOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  return <section id="inicio" className="home-world" aria-label="Bem-vindo à Vistanology">
    <LivingBackground motionEnabled={motionEnabled} />
    <div className="hero-content shell">
      <div className="hero-main">
        <p className="world-eyebrow"><span /> UM UNIVERSO DE POSSIBILIDADES</p>
        <GlassTitle motionEnabled={motionEnabled} />
        <div className="hero-copy">
          <p className="hero-tagline">{["Sonhe.", "Explore.", "Evolua."].map((word) => <motion.span key={word} whileHover={motionEnabled ? { color: "#c4ffb8", textShadow: "0 0 18px #b1ffff", y: -2 } : {}}>{word}</motion.span>)}</p>
          <p className="hero-description">Tecnologia, criatividade e nostalgia.<br />Um universo digital inspirado em um futuro mais bonito.</p>
          <div className="hero-actions">
            <motion.a href="#projetos" className="aero-button aero-button-primary" whileHover={motionEnabled ? { y: -3, scale: 1.02 } : {}} whileTap={{ scale: 0.98 }}><Play size={17} fill="currentColor" />Explorar projetos</motion.a>
            <motion.button onClick={onOrder} className="aero-button aero-button-glass" whileHover={motionEnabled ? { y: -3, scale: 1.02 } : {}} whileTap={{ scale: 0.98 }}><CodeXml size={20} />Pedir um software</motion.button>
          </div>
          <a className="hero-universe-link" href="#universo">Conhecer o universo <ArrowRight size={14} /></a>
        </div>
      </div>
    </div>
    <div className="world-dock shell">
      <a href="#sobre" className="intro-panel glass-panel">
        <span className="earth-orb" aria-hidden="true"><Globe2 strokeWidth={1} /></span>
        <div><h2>Sobre a Vistanology</h2><p>Uma jornada criativa que une arte,<br className="desktop-break" /> tecnologia e nostalgia. O melhor<br className="desktop-break" /> do passado, olhando para o futuro.</p><span className="small-glass-link">Saiba mais <ArrowRight size={13} /></span></div>
      </a>
      <a href="#universo" className="world-shortcut glass-panel"><span className="shortcut-icon globe-icon"><Globe2 /></span><span>Experiência<br />imersiva</span></a>
      <a href="#projetos" className="world-shortcut glass-panel"><GlassEmblem /><span>Inspiração<br />Frutiger Aero</span></a>
      <a href="#sobre" className="world-shortcut glass-panel"><span className="shortcut-icon heart-icon"><Heart fill="currentColor" /></span><span>Feito com<br />paixão</span></a>
    </div>
    <motion.div ref={bottomRef} className="world-bottom shell" style={{ opacity: bottomOpacity }}><span><Sparkles size={13} /> Vistanology · Mais que um portfólio, uma visão de futuro.</span><a href="#universo" className="icon-button" aria-label="Explorar o universo abaixo"><ArrowDown size={20} /></a></motion.div>
  </section>;
}
