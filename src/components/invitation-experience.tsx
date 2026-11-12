"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Check, Compass, Lightbulb, MessageCircle, X } from "lucide-react";
import InvitationForm from "./invitation-form";
import Navbar from "./navbar";
import { asset } from "@/lib/asset";
import { site, whatsappUrl } from "@/data/site";
import styles from "./invitation-experience.module.css";

type InvitationExperienceProps = { endpoint?: string; contactEmail?: string };

const STARS = Array.from({ length: 46 }, (_, i) => {
  const a = ((i * 73 + 29) % 100) / 100;
  const b = ((i * 137 + 61) % 100) / 100;
  const c = ((i * 41 + 13) % 100) / 100;
  return {
    left: `${(a * 98 + 1).toFixed(2)}%`,
    top: `${(b * 96 + 2).toFixed(2)}%`,
    size: c > 0.86 ? 2.5 : 1.5,
    delay: `${(c * 9).toFixed(2)}s`,
    duration: `${(5 + b * 7).toFixed(2)}s`,
  };
});

const SOLUTIONS = [
  { kind: "panes", title: "Sites e experiências digitais", text: "Páginas e interfaces que recebem as pessoas com identidade, ritmo e cuidado em cada detalhe." },
  { kind: "cube", title: "Sistemas personalizados", text: "Software desenhado para o seu processo real, não para caber em um molde pronto." },
  { kind: "layers", title: "Plataformas e ferramentas", text: "Estruturas que conectam pessoas, dados e rotinas em um mesmo lugar coerente." },
  { kind: "flow", title: "Automação de processos", text: "Tarefas repetidas viram fluxos silenciosos, para o seu tempo voltar ao que importa." },
  { kind: "prism", title: "Soluções tecnológicas sob medida", text: "Quando a ideia não tem nome ainda, nós ajudamos a descobrir a forma certa de construí-la." },
] as const;

const CONTACT_STEPS = [
  { Icon: Lightbulb, title: "Você conta a ideia", text: "Do jeito que ela existir hoje, mesmo incompleta." },
  { Icon: MessageCircle, title: "Nós conversamos", text: "Entendemos o projeto e exploramos as possibilidades." },
  { Icon: Compass, title: "Direção juntos", text: "Escopo, prazo e investimento alinhados antes de construir." },
];

const CONTACT_BUBBLES = [
  { left: "6%", size: 26, delay: "-2s", duration: "21s" },
  { left: "14%", size: 12, delay: "-9s", duration: "17s" },
  { left: "23%", size: 40, delay: "-14s", duration: "26s" },
  { left: "37%", size: 16, delay: "-5s", duration: "19s" },
  { left: "49%", size: 30, delay: "-18s", duration: "24s" },
  { left: "58%", size: 10, delay: "-11s", duration: "16s" },
  { left: "69%", size: 22, delay: "-3s", duration: "22s" },
  { left: "78%", size: 46, delay: "-20s", duration: "29s" },
  { left: "88%", size: 14, delay: "-7s", duration: "18s" },
  { left: "94%", size: 28, delay: "-16s", duration: "25s" },
];

function subscribeMotionPreference(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
function getMotionPreference() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function httpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function VistaMark({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd479" /><stop offset=".5" stopColor="#ff7ad9" /><stop offset="1" stopColor="#6fd7ff" />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6fd7ff" /><stop offset=".55" stopColor="#4f8dff" /><stop offset="1" stopColor="#7dffc4" />
        </linearGradient>
        <linearGradient id={`${id}-c`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#ff7ad9" /><stop offset=".55" stopColor="#9a7bff" /><stop offset="1" stopColor="#6fd7ff" />
        </linearGradient>
        <linearGradient id={`${id}-d`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7dffc4" /><stop offset=".6" stopColor="#b8e986" /><stop offset="1" stopColor="#ffd479" />
        </linearGradient>
      </defs>
      <g stroke="rgba(230,246,255,.75)" strokeWidth=".8">
        <path d="M4 6.5 18 4.5 18.6 18.4 5 19.2Z" fill={`url(#${id}-a)`} fillOpacity=".82" />
        <path d="M21.5 4.2 35.5 6 34.8 19 21 18.4Z" fill={`url(#${id}-b)`} fillOpacity=".82" />
        <path d="M5 21.6 18.6 21 18 35 4.6 33.4Z" fill={`url(#${id}-c)`} fillOpacity=".82" />
        <path d="M21 21 34.8 21.5 35.6 33.8 21.6 35.4Z" fill={`url(#${id}-d)`} fillOpacity=".82" />
      </g>
    </svg>
  );
}

function Reveal({ children, className, delay = 0, motionEnabled }: { children: ReactNode; className?: string; delay?: number; motionEnabled: boolean }) {
  return (
    <motion.div
      className={className}
      initial={motionEnabled ? { opacity: 0, y: 28 } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SolutionVisual({ kind }: { kind: (typeof SOLUTIONS)[number]["kind"] }) {
  const id = useId();
  if (kind === "panes") {
    return (
      <div className={`${styles.visual} ${styles.visPanes}`} aria-hidden="true">
        <span className={styles.paneBack} />
        <span className={styles.paneMid} />
        <span className={styles.paneFront}><i /><i /><i /></span>
      </div>
    );
  }
  if (kind === "cube") {
    return (
      <div className={`${styles.visual} ${styles.visCube}`} aria-hidden="true">
        <span className={styles.cube}>
          <i className={styles.cubeFront} /><i className={styles.cubeBack} /><i className={styles.cubeLeft} />
          <i className={styles.cubeRight} /><i className={styles.cubeTop} /><i className={styles.cubeBottom} />
        </span>
      </div>
    );
  }
  if (kind === "layers") {
    return (
      <div className={`${styles.visual} ${styles.visLayers}`} aria-hidden="true">
        <span className={styles.layer1} /><span className={styles.layer2} /><span className={styles.layer3} /><span className={styles.layer4} />
      </div>
    );
  }
  if (kind === "flow") {
    return (
      <div className={`${styles.visual} ${styles.visFlow}`} aria-hidden="true">
        <svg viewBox="0 0 200 140">
          <defs>
            <linearGradient id={`${id}-flow`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#6fd7ff" /><stop offset=".5" stopColor="#9a7bff" /><stop offset="1" stopColor="#7dffc4" />
            </linearGradient>
          </defs>
          <path className={styles.flowGlow} d="M22 104 C 58 26, 142 22, 178 66 S 132 128, 66 112" fill="none" stroke={`url(#${id}-flow)`} strokeWidth="7" strokeLinecap="round" />
          <path className={styles.flowPath} d="M22 104 C 58 26, 142 22, 178 66 S 132 128, 66 112" fill="none" stroke={`url(#${id}-flow)`} strokeWidth="2.4" strokeLinecap="round" />
          <circle className={styles.flowNodeA} cx="22" cy="104" r="6" />
          <circle className={styles.flowNodeB} cx="178" cy="66" r="6" />
          <circle className={styles.flowNodeC} cx="66" cy="112" r="4.5" />
        </svg>
      </div>
    );
  }
  return (
    <div className={`${styles.visual} ${styles.visPrism}`} aria-hidden="true">
      <span className={styles.prism}><i className={styles.prismFacetA} /><i className={styles.prismFacetB} /></span>
    </div>
  );
}

export default function InvitationExperience({ endpoint = "", contactEmail = "" }: InvitationExperienceProps) {
  const reducedMotion = useSyncExternalStore(subscribeMotionPreference, getMotionPreference, () => true);
  const [hidden, setHidden] = useState(false);
  const [motionChoice, setMotionChoice] = useState<boolean | null>(null);
  const [priceOpen, setPriceOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const motionEnabled = (motionChoice ?? !reducedMotion) && !hidden;

  const pointerX = useMotionValue(0.66);
  const pointerY = useMotionValue(0.36);
  const springX = useSpring(pointerX, { stiffness: 55, damping: 18 });
  const springY = useSpring(pointerY, { stiffness: 55, damping: 18 });
  const lightX = useTransform(springX, [0, 1], [10, 90]);
  const lightY = useTransform(springY, [0, 1], [14, 86]);
  const heroLight = useMotionTemplate`radial-gradient(760px 520px at ${lightX}% ${lightY}%, rgba(111,215,255,0.13), rgba(154,123,255,0.06) 46%, transparent 74%)`;
  const sheen = useMotionTemplate`radial-gradient(430px 330px at ${lightX}% ${lightY}%, rgba(255,255,255,0.22), rgba(111,215,255,0.1) 42%, transparent 72%)`;
  const tiltY = useTransform(springX, [0, 1], [-7, 7]);
  const tiltX = useTransform(springY, [0, 1], [6, -6]);
  const consoleX = useMotionValue(0.5);
  const consoleY = useMotionValue(0.3);
  const consoleSpringX = useSpring(consoleX, { stiffness: 60, damping: 20 });
  const consoleSpringY = useSpring(consoleY, { stiffness: 60, damping: 20 });
  const consoleLightX = useTransform(consoleSpringX, [0, 1], [12, 88]);
  const consoleLightY = useTransform(consoleSpringY, [0, 1], [10, 90]);
  const consoleSheen = useMotionTemplate`radial-gradient(560px 400px at ${consoleLightX}% ${consoleLightY}%, rgba(111,215,255,0.1), rgba(154,123,255,0.05) 46%, transparent 76%)`;
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 900], [0, 130]);
  const sculptureY = useTransform(scrollY, [0, 900], [0, -70]);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (priceOpen && !dialog.open) dialog.showModal();
    if (!priceOpen && dialog.open) dialog.close();
    const overflow = document.body.style.overflow;
    if (priceOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [priceOpen]);

  function onHeroPointer(event: React.PointerEvent<HTMLElement>) {
    if (!motionEnabled || event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width);
    pointerY.set((event.clientY - rect.top) / rect.height);
  }

  function onConsolePointer(event: React.PointerEvent<HTMLDivElement>) {
    if (!motionEnabled || event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    consoleX.set((event.clientX - rect.left) / rect.width);
    consoleY.set((event.clientY - rect.top) / rect.height);
  }

  const instagram = httpsUrl(site.instagram);
  const linkedin = httpsUrl(site.linkedin);
  const whatsapp = whatsappUrl("Olá, César! Recebi o convite da Vistanology e quero conversar sobre uma ideia.");

  return (
    <div className={styles.page} data-page="convite" data-motion={motionEnabled ? "on" : "off"}>
      <a className={styles.skipLink} href="#conteudo">Pular para o conteúdo</a>
      <div className={styles.starfield} aria-hidden="true">
        {STARS.map((star, i) => (
          <span key={i} style={{ left: star.left, top: star.top, width: star.size, height: star.size, animationDelay: star.delay, animationDuration: star.duration }} />
        ))}
      </div>

      <Navbar motionEnabled={motionEnabled} onToggleMotion={() => setMotionChoice(!motionEnabled)} />

      <main id="conteudo">
        <section id="inicio" className={styles.hero} onPointerMove={onHeroPointer}>
          <motion.div className={styles.heroBackground} style={motionEnabled ? { y: backgroundY } : undefined} aria-hidden="true">
            <picture>
              <source media="(max-width: 700px)" srcSet={asset("/images/invitation-cosmos-mobile.webp")} />
              <img src={asset("/images/invitation-cosmos.webp")} alt="" width="1792" height="1024" fetchPriority="high" />
            </picture>
          </motion.div>
          <div className={styles.heroVeil} aria-hidden="true" />
          <motion.div className={styles.heroLight} style={motionEnabled ? { background: heroLight } : undefined} aria-hidden="true" />
          <div className={`${styles.ribbon} ${styles.ribbonLeft}`} aria-hidden="true" />
          <div className={`${styles.ribbon} ${styles.ribbonRight}`} aria-hidden="true" />
          <svg className={styles.horizonWave} viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="inv-horizon" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#6fd7ff" stopOpacity="0" />
                <stop offset=".3" stopColor="#6fd7ff" stopOpacity=".8" />
                <stop offset=".55" stopColor="#9a7bff" stopOpacity=".9" />
                <stop offset=".8" stopColor="#7dffc4" stopOpacity=".7" />
                <stop offset="1" stopColor="#7dffc4" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path className={styles.waveGlow} d="M0 70 C 240 30, 480 96, 720 62 S 1200 34, 1440 74" fill="none" stroke="url(#inv-horizon)" strokeWidth="6" />
            <path className={styles.wavePath} d="M0 70 C 240 30, 480 96, 720 62 S 1200 34, 1440 74" fill="none" stroke="url(#inv-horizon)" strokeWidth="1.6" />
          </svg>

          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <motion.p className={styles.heroEyebrow} initial={motionEnabled ? { opacity: 0, y: 14 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
                <VistaMark className={styles.eyebrowMark} /> Vista · Vistanology
              </motion.p>
              <motion.h1 initial={motionEnabled ? { opacity: 0, y: 26 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                Você foi<br />convidado<span className={styles.heroDot}>.</span>
              </motion.h1>
              <motion.p className={styles.heroLead} initial={motionEnabled ? { opacity: 0, y: 18 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.55 }}>
                Uma experiência começa quando uma ideia encontra as pessoas certas.
              </motion.p>
              <motion.p className={styles.heroSupport} initial={motionEnabled ? { opacity: 0, y: 18 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.7 }}>
                A Vista transforma ideias em experiências digitais, sites e sistemas desenvolvidos com visão, tecnologia e personalidade.
              </motion.p>
              <motion.div className={styles.heroActions} initial={motionEnabled ? { opacity: 0, y: 18 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.85 }}>
                <a className={styles.ctaPrimary} href="#contato">Aceitar convite <ArrowRight size={17} aria-hidden="true" /></a>
                <a className={styles.ctaGhost} href="#sobre">Conheça a Vista</a>
                <a className={styles.ctaGhost} href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} aria-hidden="true" /> Falar no WhatsApp</a>
              </motion.div>
            </div>

            <motion.div className={styles.sculptureStage} style={motionEnabled ? { y: sculptureY } : undefined} initial={motionEnabled ? { opacity: 0, scale: 0.94 } : false} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}>
              <span className={`${styles.sphere} ${styles.sphereA}`} aria-hidden="true" />
              <span className={`${styles.sphere} ${styles.sphereB}`} aria-hidden="true" />
              <span className={`${styles.sphere} ${styles.sphereC}`} aria-hidden="true" />
              <span className={`${styles.sphere} ${styles.sphereD}`} aria-hidden="true" />
              <motion.div className={styles.sculptureTilt} style={motionEnabled ? { rotateX: tiltX, rotateY: tiltY } : undefined}>
                <div className={styles.sculptureFloat}>
                  <Image className={styles.sculpture} src={asset("/images/invitation-glass-alpha.webp")} alt="Símbolo holográfico da Vista: quatro painéis de vidro iridescente" width={900} height={900} fetchPriority="high" />
                  <motion.div className={styles.sculptureSheen} style={motionEnabled ? { background: sheen } : undefined} aria-hidden="true" />
                </div>
              </motion.div>
              <div className={styles.sculptureReflection} aria-hidden="true">
                <Image src={asset("/images/invitation-glass-alpha.webp")} alt="" width={900} height={900} loading="lazy" />
              </div>
              <div className={styles.sculptureHalo} aria-hidden="true" />
            </motion.div>
          </div>

          <a className={styles.scrollCue} href="#sobre">
            <span className={styles.scrollLine} aria-hidden="true"><i /></span>
            continue explorando
          </a>
        </section>

        <section id="sobre" className={styles.about}>
          <Reveal motionEnabled={motionEnabled} className={styles.aboutInner}>
            <p className={styles.eyebrow}>Sobre a Vista</p>
            <h2 className={styles.aboutTitle}>
              Não queremos apenas desenvolver mais um projeto.<br />
              <em>Queremos construir algo que tenha sentido.</em>
            </h2>
            <div className={styles.aboutColumns}>
              <p className={styles.aboutLead}>Na Vista, unimos criatividade, tecnologia e propósito para transformar ideias em realidade.</p>
              <p className={styles.aboutText}>
                Somos uma equipe de criação e desenvolvimento que trata cada projeto como um mundo próprio:
                entendemos o que você precisa, desenhamos a experiência com cuidado e construímos com tecnologia
                de verdade. O resultado não é apenas um sistema funcionando — é algo que parece ter sido feito
                exatamente para você.
              </p>
            </div>
          </Reveal>
          <div className={styles.aboutGlow} aria-hidden="true" />
        </section>

        <section id="solucoes" className={styles.solutions}>
          <Reveal motionEnabled={motionEnabled} className={styles.solutionsHead}>
            <p className={styles.eyebrow}>Áreas de atuação</p>
            <h2>O que podemos construir juntos</h2>
            <p>Cinco formas de dar dimensão a uma ideia. Todas partem da mesma conversa: o que faz sentido para o seu projeto.</p>
          </Reveal>
          <div className={styles.solutionGrid}>
            {SOLUTIONS.map((solution, i) => (
              <Reveal key={solution.kind} motionEnabled={motionEnabled} delay={i * 0.08} className={`${styles.solutionCard} ${i < 2 ? styles.solutionWide : ""}`}>
                <SolutionVisual kind={solution.kind} />
                <div className={styles.solutionCopy}>
                  <span className={styles.solutionIndex} aria-hidden="true">0{i + 1}</span>
                  <h3>{solution.title}</h3>
                  <p>{solution.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className={styles.conversation} aria-labelledby="conversation-title">
          <Reveal motionEnabled={motionEnabled} className={styles.conversationInner}>
            <span className={`${styles.sphere} ${styles.sphereConversation}`} aria-hidden="true" />
            <h2 id="conversation-title">Tem uma ideia?<br /><em>Vamos conversar sobre ela.</em></h2>
            <p>Você apresenta o que precisa. Nós entendemos o projeto, conversamos sobre as possibilidades e encontramos juntos uma direção.</p>
            <button className={styles.priceCall} type="button" onClick={() => setPriceOpen(true)}>
              Vamos dialogar sobre o preço? <ArrowRight size={17} aria-hidden="true" />
            </button>
          </Reveal>
        </section>

        <section id="contato" className={styles.contact}>
          <div className={styles.contactAmbient} aria-hidden="true">
            <div className={`${styles.ribbon} ${styles.contactRibbonLeft}`} />
            <div className={`${styles.ribbon} ${styles.contactRibbonRight}`} />
            <div className={styles.contactHorizon} />
            {CONTACT_BUBBLES.map((bubble, index) => (
              <span
                key={index}
                className={styles.contactBubble}
                style={{ left: bubble.left, width: bubble.size, height: bubble.size, animationDelay: bubble.delay, animationDuration: bubble.duration }}
              />
            ))}
          </div>
          <div className={styles.contactInner}>
            <Reveal motionEnabled={motionEnabled} className={styles.contactHead}>
              <p className={styles.eyebrow}>Primeiro contato</p>
              <h2>Seu convite começa aqui.</h2>
              <p className={styles.contactLead}>
                Conte um pouco sobre o que você está imaginando. Não precisa ter tudo definido.
                A conversa também serve para descobrir o que é possível construir.
              </p>
            </Reveal>
            <Reveal motionEnabled={motionEnabled} delay={0.08} className={styles.contactBridge}>
              <ol className={styles.timeline}>
                {CONTACT_STEPS.map((step, i) => (
                  <li key={step.title} className={styles.timelineNode}>
                    <span className={styles.timelineBadge}>
                      <step.Icon size={22} aria-hidden="true" />
                      <span className={styles.timelineIndex} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                    </span>
                    <strong>{step.title}</strong>
                    <span>{step.text}</span>
                  </li>
                ))}
              </ol>
              <ul className={styles.timelineChips}>
                <li><Check size={14} aria-hidden="true" /> Sem pacotes engessados: cada projeto tem o seu próprio desenho.</li>
                <li><Check size={14} aria-hidden="true" /> O investimento é conversado conforme complexidade, funcionalidades, prazo e escopo.</li>
                <li><Check size={14} aria-hidden="true" /> Ideias ainda indefinidas são bem-vindas — clareza também se constrói conversando.</li>
              </ul>
            </Reveal>
            <div className={styles.contactLink} aria-hidden="true">
              <div className={styles.contactPortal}>
                <span className={styles.portalRingA} />
                <span className={styles.portalRingB} />
                <span className={styles.portalSatellite} />
                <VistaMark className={styles.portalMark} />
              </div>
              <div className={styles.beamWrap}>
                <svg className={styles.connectionBeam} viewBox="0 0 80 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="inv-beam" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#7dffc4" stopOpacity=".2" />
                      <stop offset=".5" stopColor="#6fd7ff" stopOpacity=".85" />
                      <stop offset="1" stopColor="#9a7bff" stopOpacity=".9" />
                    </linearGradient>
                  </defs>
                  <path className={styles.beamGlow} d="M40 2 C 56 38, 24 82, 40 118" fill="none" stroke="url(#inv-beam)" strokeWidth="5" />
                  <path className={styles.beamPath} d="M40 2 C 56 38, 24 82, 40 118" fill="none" stroke="url(#inv-beam)" strokeWidth="1.4" />
                </svg>
                <span className={`${styles.beamNode} ${styles.beamNodeA}`} />
                <span className={`${styles.beamNode} ${styles.beamNodeB}`} />
              </div>
            </div>
            <Reveal motionEnabled={motionEnabled} delay={0.1} className={styles.contactConsole}>
              <span className={`${styles.sphere} ${styles.consoleSphereA}`} aria-hidden="true" />
              <span className={`${styles.sphere} ${styles.consoleSphereB}`} aria-hidden="true" />
              <div className={styles.consoleFrame} onPointerMove={onConsolePointer}>
                <span className={styles.consoleCornerA} aria-hidden="true" />
                <span className={styles.consoleCornerB} aria-hidden="true" />
                <span className={styles.consoleCornerC} aria-hidden="true" />
                <span className={styles.consoleCornerD} aria-hidden="true" />
                <InvitationForm endpoint={endpoint} contactEmail={contactEmail} />
                <motion.div className={styles.consoleSheen} style={motionEnabled ? { background: consoleSheen } : undefined} aria-hidden="true" />
              </div>
              <div className={styles.consolePool} aria-hidden="true">
                <span className={styles.poolRingA} />
                <span className={styles.poolRingB} />
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <VistaMark className={styles.footerMark} />
            <span><strong>VISTA</strong><small>Vistanology</small></span>
          </div>
          <p className={styles.footerPhrase}>Ideias que ganham outra dimensão.</p>
          <nav className={styles.footerLinks} aria-label="Canais oficiais">
            <Link href="/">Universo Vistanology</Link>
            <Link href="/quem-e-o-dono">Quem é o dono?</Link>
            <a href={site.github} target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href={whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
            {linkedin && <a href={linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
          </nav>
          <p className={styles.footerNote}>© {new Date().getFullYear()} Vistanology · Feito com visão, tecnologia e personalidade.</p>
        </div>
        <div className={styles.footerHorizon} aria-hidden="true" />
      </footer>

      <dialog
        ref={dialogRef}
        className={styles.priceDialog}
        aria-labelledby="inv-price-title"
        onCancel={() => setPriceOpen(false)}
        onClose={() => setPriceOpen(false)}
        onClick={(event) => { if (event.target === event.currentTarget) setPriceOpen(false); }}
      >
        <div className={styles.priceWindow}>
          <div className={styles.priceHead}>
            <p className={styles.eyebrow}>Conversa transparente</p>
            <button className={styles.priceClose} type="button" onClick={() => setPriceOpen(false)} aria-label="Fechar explicação sobre investimento"><X size={18} /></button>
          </div>
          <h2 id="inv-price-title">Vamos dialogar sobre o preço.</h2>
          <p>
            Não trabalhamos com preços aleatórios nem com pacotes engessados. Cada projeto nasce de uma
            conversa, e o investimento é definido junto com você, a partir do que a sua ideia realmente precisa.
          </p>
          <ul className={styles.priceFactors}>
            <li><strong>Complexidade</strong><span>O desafio técnico e criativo por trás da solução.</span></li>
            <li><strong>Funcionalidades</strong><span>O que o sistema precisa fazer, e o que pode esperar.</span></li>
            <li><strong>Prazo</strong><span>O tempo disponível para construir com qualidade.</span></li>
            <li><strong>Escopo</strong><span>O tamanho do mundo que vamos desenhar juntos.</span></li>
          </ul>
          <p className={styles.priceNote}>
            Depois do primeiro contato, entendemos o projeto e apresentamos uma direção clara antes de qualquer
            compromisso. Ideias ainda indefinidas também são bem-vindas.
          </p>
          <div className={styles.priceActions}>
            <a className={styles.ctaPrimary} href="#contato" onClick={() => setPriceOpen(false)}>Aceitar convite <ArrowRight size={16} aria-hidden="true" /></a>
            <button className={styles.ctaGhost} type="button" onClick={() => setPriceOpen(false)}>Entendi</button>
          </div>
        </div>
      </dialog>
    </div>
  );
}