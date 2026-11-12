"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useInView, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowDown, ArrowUpRight, Droplets, Leaf, Sun, Waves } from "lucide-react";
import { asset } from "@/lib/asset";

const regions = [
  { name: "A superfície", key: "surface", Icon: Sun, label: "01 / PRIMEIRA LUZ", title: "O horizonte ainda está aberto.", description: "Céu sem pressa. Água cristalina. Arquitetura que respira junto com a natureza. Um convite a olhar para o futuro com curiosidade outra vez." },
  { name: "Sob a água", key: "underwater", Icon: Waves, label: "02 / OUTRA PERSPECTIVA", title: "Às vezes, o começo está lá embaixo.", description: "A luz atravessa a água, as bolhas encontram o caminho e o mundo desacelera. Uma pequena pausa antes de emergir para novas possibilidades." },
  { name: "O jardim", key: "garden", Icon: Leaf, label: "03 / NATUREZA DIGITAL", title: "Tecnologia também pode florescer.", description: "O verde encontra o vidro. Jardins, formas orgânicas e luz natural lembram que um futuro bonito precisa deixar espaço para a vida." },
];

export default function Universe({ motionEnabled }: { motionEnabled: boolean }) {
  const [selected, setSelected] = useState(0);
  const region = regions[selected];
  return <>
    <section id="universo" className="section universe-section">
      <div className="shell">
        <div className="section-heading"><span className="eyebrow"><GlobeMark /> ENTRE, O MUNDO É SEU</span><h2>Um lugar que você ainda não conheceu.<br /><span>Uma sensação que você já conhece.</span></h2><p>Explore as atmosferas de um futuro onde natureza e tecnologia coexistem.</p></div>
        <div className={`universe-window glass-panel region-${region.key}`}>
          <div className="window-titlebar"><span><Droplets size={15} /> Explorador de atmosferas</span><span className="window-dots" aria-hidden="true"><i /><i /><i /></span></div>
          <div className="region-tabs" role="group" aria-label="Escolher atmosfera">{regions.map(({ name, Icon }, index) => <button key={name} aria-pressed={index === selected} onClick={() => setSelected(index)}><Icon size={17} />{name}</button>)}</div>
          <div className="region-body">
            <div className="region-scene" aria-hidden="true">
              <Image src={asset("/images/lagoon-concept.webp")} width="800" height="800" alt="" loading="lazy" />
              <div className="region-filter" /><div className="region-grid" />
              <motion.div className="region-sphere" animate={motionEnabled ? { y: [0, -12, 0] } : { y: 0 }} transition={{ duration: 7, repeat: motionEnabled ? Infinity : 0, ease: "easeInOut" }}><span /></motion.div>
              <span className="scene-caption">ESTUDO DE ATMOSFERA · ARTE CONCEITUAL</span>
            </div>
            <div className="region-copy" aria-live="polite"><AnimatePresence mode="wait"><motion.div key={region.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: motionEnabled ? 0.2 : 0 }}><span className="eyebrow">{region.label}</span><h3>{region.title}</h3><p>{region.description}</p><a className="text-link" href="#projetos">Descobrir o projeto <ArrowUpRight size={17} /></a></motion.div></AnimatePresence></div>
          </div>
        </div>
      </div>
    </section>
    <AboutWindow motionEnabled={motionEnabled} />
  </>;
}

function AboutWindow({ motionEnabled }: { motionEnabled: boolean }) {
  const section = useRef<HTMLElement>(null);
  const visible = useInView(section, { amount: 0.1 });
  const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "end start"] });
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const mouseX = useSpring(pointerX, { stiffness: 75, damping: 24 });
  const mouseY = useSpring(pointerY, { stiffness: 75, damping: 24 });
  const scrollOffset = useTransform(scrollYProgress, [0, 1], [35, -35]);
  const imageX = useTransform(mouseX, [-1, 1], [16, -16]);
  const imageY = useTransform(() => scrollOffset.get() - mouseY.get() * 12);
  const lightX = useTransform(mouseX, [-1, 1], [0, 100]);
  const lightY = useTransform(mouseY, [-1, 1], [0, 100]);
  const reflection = useMotionTemplate`radial-gradient(ellipse 480px 340px at ${lightX}% ${lightY}%, #c1ffff32, transparent 72%)`;
  const illuminated = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.2, 0.85, 0.85, 0.2]);
  const animate = motionEnabled && visible;

  return <section ref={section} id="sobre" className="section about-section shell">
    <div className="about-window glass-panel"
      onPointerMove={(event) => {
        if (!motionEnabled || event.pointerType === "touch") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        pointerX.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1);
        pointerY.set(((event.clientY - bounds.top) / bounds.height) * 2 - 1);
      }}
      onPointerLeave={() => { pointerX.set(0); pointerY.set(0); }}>
      <div className="window-titlebar"><span><Sun size={15} /> Uma janela para o que nos inspira</span><span className="window-dots" aria-hidden="true"><i /><i /><i /></span></div>
      <div className="about-body">
        <div className="about-quote">
          <div className="about-landscape" aria-hidden="true">
            <motion.div className="about-landscape-image" style={{ x: motionEnabled ? imageX : 0, y: motionEnabled ? imageY : 0 }}>
              <Image src={asset("/images/coastal-world-1000.webp")} alt="" width={1000} height={571} sizes="(max-width: 899px) 100vw, 50vw" />
            </motion.div>
            <div className="about-landscape-shade" />
            <motion.div className="about-water-light" style={{ rotateX: 40, transformPerspective: 350 }} animate={animate ? { x: [-15, 15, -15], opacity: [0.25, 0.55, 0.25] } : { x: 0, opacity: 0.25 }} transition={{ type: "tween", duration: 12, repeat: animate ? Infinity : 0, ease: "easeInOut" }} />
            {[0, 1, 2].map((index) => <motion.span key={index} className={`soap-bubble about-bubble about-bubble-${index}`} animate={animate ? { y: [0, -35 - index * 8, 0], x: [0, 9, 0] } : { y: 0, x: 0 }} transition={{ type: "tween", duration: 9 + index * 3, repeat: animate ? Infinity : 0, ease: "easeInOut" }} />)}
          </div>
          <div className="about-quote-content"><span className="eyebrow">A NOSSA RAZÃO DE EXISTIR</span><h2>“Parece que eu<br />voltei <em>pra casa.</em>”</h2><div className="quote-line" /><p>THE FUTURE THEY PROMISED US.</p></div>
          <span className="about-scene-caption">Um futuro para sentir em casa.<small>PAISAGEM CONCEITUAL</small></span>
        </div>
        <div className="about-copy"><span className="eyebrow">MUITO ALÉM DA NOSTALGIA</span><h3>Lembra quando o futuro <br />parecia um lugar bonito?</h3><p>Janelas de vidro, oceanos azuis e a sensação de que a tecnologia nos levaria a algum lugar extraordinário. A Vistanology nasce desse sentimento — não para viver no passado, mas para criar o que ainda pode existir.</p><p>Somos um universo criativo em construção. Transformamos ideias em software, experimentos visuais e mundos digitais que buscam ser mais do que funcionais: <strong>queremos que façam sentido para quem entra.</strong></p><a href="#softwares" className="text-link">Que a gente construa um pouco de cor hoje. <ArrowDown size={16} /></a></div>
      </div>
      <motion.div className="about-glass-light" aria-hidden="true" style={{ background: motionEnabled ? reflection : "none", opacity: motionEnabled ? illuminated : 0 }} />
    </div>
  </section>;
}

function GlobeMark() { return <span className="eyebrow-dot" aria-hidden="true" />; }
