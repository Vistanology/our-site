"use client";

import { useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import {
  ArrowUpRight,
  Award,
  BookOpen,
  Briefcase,
  Coffee,
  Compass,
  Github,
  GraduationCap,
  Linkedin,
  MapPin,
  MessageCircle,
  PawPrint,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { asset } from "@/lib/asset";
import { site, whatsappUrl } from "@/data/site";
import { owner } from "@/data/owner";
import Navbar from "./navbar";
import styles from "./owner-page.module.css";

const OWNER_WHATSAPP = whatsappUrl(
  "Olá, César! Conheci a Vistanology e queria conversar sobre o seu trabalho e possíveis projetos.",
);

function subscribeMotionPreference(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
function getMotionPreference() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function Reveal({ children, className, delay = 0, motionEnabled }: { children: ReactNode; className?: string; delay?: number; motionEnabled: boolean }) {
  return (
    <motion.div
      className={className}
      initial={motionEnabled ? { opacity: 0, y: 26 } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function VistaMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="own-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd479" /><stop offset=".5" stopColor="#ff7ad9" /><stop offset="1" stopColor="#6fd7ff" />
        </linearGradient>
        <linearGradient id="own-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6fd7ff" /><stop offset=".55" stopColor="#4f8dff" /><stop offset="1" stopColor="#7dffc4" />
        </linearGradient>
        <linearGradient id="own-c" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#ff7ad9" /><stop offset=".55" stopColor="#9a7bff" /><stop offset="1" stopColor="#6fd7ff" />
        </linearGradient>
        <linearGradient id="own-d" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7dffc4" /><stop offset=".6" stopColor="#b8e986" /><stop offset="1" stopColor="#ffd479" />
        </linearGradient>
      </defs>
      <g stroke="rgba(230,246,255,.75)" strokeWidth=".8">
        <path d="M4 6.5 18 4.5 18.6 18.4 5 19.2Z" fill="url(#own-a)" fillOpacity=".82" />
        <path d="M21.5 4.2 35.5 6 34.8 19 21 18.4Z" fill="url(#own-b)" fillOpacity=".82" />
        <path d="M5 21.6 18.6 21 18 35 4.6 33.4Z" fill="url(#own-c)" fillOpacity=".82" />
        <path d="M21 21 34.8 21.5 35.6 33.8 21.6 35.4Z" fill="url(#own-d)" fillOpacity=".82" />
      </g>
    </svg>
  );
}

function Tilt({ children, className, motionEnabled, maxTilt = 7 }: { children: ReactNode; className?: string; motionEnabled: boolean; maxTilt?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const springRx = useSpring(rx, { stiffness: 150, damping: 14, mass: 0.5 });
  const springRy = useSpring(ry, { stiffness: 150, damping: 14, mass: 0.5 });
  function move(event: ReactPointerEvent<HTMLDivElement>) {
    if (!motionEnabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ry.set(((event.clientX - rect.left) / rect.width - 0.5) * maxTilt * 2);
    rx.set(-((event.clientY - rect.top) / rect.height - 0.5) * maxTilt * 2);
  }
  function leave() { rx.set(0); ry.set(0); }
  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX: springRx, rotateY: springRy, transformPerspective: 900 }}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      {children}
      <span className={styles.tiltSheen} aria-hidden="true" />
    </motion.div>
  );
}

// Fixed values keep SSR and client markup identical (no randomness).
const ambientBubbles = [
  { left: "10%", size: 18, dur: 24, delay: 0, drift: 30 },
  { left: "26%", size: 10, dur: 30, delay: -8, drift: -18 },
  { left: "44%", size: 26, dur: 34, delay: -16, drift: 40 },
  { left: "62%", size: 12, dur: 27, delay: -5, drift: -22 },
  { left: "78%", size: 20, dur: 32, delay: -12, drift: 34 },
  { left: "90%", size: 9, dur: 25, delay: -20, drift: -14 },
];

const heroContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const heroItem = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function OwnerPage() {
  const reducedMotion = useSyncExternalStore(subscribeMotionPreference, getMotionPreference, () => true);
  const [motionChoice, setMotionChoice] = useState<boolean | null>(null);
  const motionEnabled = motionChoice ?? !reducedMotion;
  const { scrollYProgress } = useScroll();
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", motionEnabled ? "7%" : "0%"]);
  const barScale = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });

  return (
    <div className={`${styles.page} vistanology`} data-page="dono" data-motion={motionEnabled ? "on" : "off"}>
      <a className={styles.skip} href="#conteudo">Pular para o conteúdo</a>
      <motion.div className={styles.progress} style={{ scaleX: barScale }} aria-hidden="true" />

      <div className={styles.bg} aria-hidden="true">
        <motion.div className={styles.bgImg} style={{ y: bgY }}>
          <picture>
            <source media="(max-width: 700px)" srcSet={asset("/images/owner-wallpaper-1000.webp")} />
            <img src={asset("/images/owner-wallpaper.webp")} alt="" />
          </picture>
        </motion.div>
        <div className={styles.bgScrim} />
      </div>

      <div className={styles.ambient} aria-hidden="true">
        <div className={styles.ambientGlowA} />
        <div className={styles.ambientGlowB} />
        <div className={styles.ambientShafts} />
        <div className={styles.ambientBubbles}>
          {ambientBubbles.map((b, i) => (
            <span key={i} style={{ left: b.left, width: b.size, height: b.size, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s`, ["--drift"]: `${b.drift}px` } as CSSProperties} />
          ))}
        </div>
      </div>

      <Navbar motionEnabled={motionEnabled} onToggleMotion={() => setMotionChoice(!motionEnabled)} />

      <main id="conteudo">
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <motion.div
              className={styles.heroCopy}
              variants={heroContainer}
              initial={motionEnabled ? "hidden" : "visible"}
              animate="visible"
            >
              <motion.p className={styles.eyebrow} variants={heroItem}><Sparkles size={14} /> Por trás da Vista</motion.p>
              <motion.h1 className={styles.title} variants={heroItem}>Quem é<br />o dono<span className={styles.titleDot}>?</span><span className={styles.titleSheen} aria-hidden="true" /></motion.h1>
              <motion.p className={styles.lead} variants={heroItem}>
                A Vista tem nome, marca e universo — mas também tem um rosto (e um urso).
                Por trás de tudo está <strong>{owner.name}</strong>, conhecido como <strong>{owner.alias}</strong>: {owner.role}.
              </motion.p>
              <motion.div className={styles.meta} variants={heroItem}>
                <span className={styles.metaItem}><MapPin size={14} /> {owner.location}</span>
                <span className={styles.metaItem}><GraduationCap size={14} /> {owner.school}</span>
                <span className={styles.metaItem}><Coffee size={14} /> {owner.studying}</span>
              </motion.div>
              <motion.div className={styles.trust} variants={heroItem}>
                <span className={styles.trustItem}><ShieldCheck size={14} /> {owner.certificates.length} certificados verificados no README</span>
                <span className={styles.trustItem}><Linkedin size={14} /> +2.376 seguidores no perfil</span>
              </motion.div>
              <motion.p className={styles.availability} variants={heroItem}>{owner.availability}</motion.p>
              <motion.div className={styles.ctaRow} variants={heroItem}>
                <a className={`${styles.ctaPrimary} aero-button aero-button-primary`} href={owner.links.github} target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRight size={16} /></a>
                <a className={`${styles.ctaGhost} aero-button aero-button-glass`} href={owner.links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <ArrowUpRight size={15} /></a>
                <a className={`${styles.ctaGhost} aero-button aero-button-glass`} href={OWNER_WHATSAPP} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> WhatsApp</a>
                <a className={styles.ctaLink} href="#certificados">Ver certificados <ArrowUpRight size={14} /></a>
              </motion.div>
            </motion.div>

            <div className={styles.portrait}>
              <motion.div
                className={styles.portraitFloat}
                animate={motionEnabled ? { y: [0, -10, 0] } : { y: 0 }}
                transition={motionEnabled ? { duration: 7, repeat: Infinity, ease: "easeInOut" } : { duration: 0 }}
              >
                <Tilt className={styles.portraitTilt} motionEnabled={motionEnabled}>
                <motion.div
                  className={styles.portraitFrame}
                  initial={motionEnabled ? { opacity: 0, scale: 0.95, y: 18 } : false}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Image className={styles.portraitImg} src={asset("/images/owner-dudu-hero.webp")} alt={`Ilustração de ${owner.alias}, o urso desenvolvedor, programando em um home office com a ${owner.companion} dormindo ao fundo`} width={1280} height={1024} priority />
                  <span className={styles.bubble} style={{ width: 54, height: 54, top: "-14px", left: "18%" }} aria-hidden="true" />
                  <span className={styles.bubble} style={{ width: 30, height: 30, bottom: "16%", right: "-10px" }} aria-hidden="true" />
                  <span className={styles.bubble} style={{ width: 20, height: 20, top: "30%", right: "8%" }} aria-hidden="true" />
                </motion.div>
                </Tilt>
              </motion.div>
              <p className={styles.portraitCaption}><PawPrint size={13} /> {owner.alias} no código, {owner.companion} no sofá.</p>
            </div>
          </div>
        </section>

        <section id="sobre" className={styles.section}>
          <div className={styles.sectionInner}>
            <Reveal motionEnabled={motionEnabled} className={styles.sectionHead}>
              <p className="eyebrow">Sobre o dono</p>
              <h2 className={styles.sectionTitle}>Um desenvolvedor que trata cada projeto <span>como um mundo próprio.</span></h2>
            </Reveal>
            <div className={styles.aboutGrid}>
              <div className={styles.aboutCol}>
                {owner.about.map((paragraph, i) => (
                  <Reveal key={i} motionEnabled={motionEnabled} delay={i * 0.05}>
                    <p className={styles.aboutText}>{paragraph}</p>
                  </Reveal>
                ))}
              </div>
              <div className={styles.aboutCol}>
                <Reveal motionEnabled={motionEnabled}>
                  <figure className={styles.quote}>
                    <blockquote>{owner.quote}</blockquote>
                    <figcaption>— {owner.alias}, {owner.role}</figcaption>
                  </figure>
                </Reveal>
                <Reveal motionEnabled={motionEnabled} delay={0.1}>
                  <p className={styles.closing}>{owner.closingLine}</p>
                </Reveal>
                <Reveal motionEnabled={motionEnabled} delay={0.15}>
                  <p className={styles.followNote}>{owner.linkedinFollowers} <span>(número citado no README do perfil)</span></p>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        <section id="stack" className={styles.section}>
          <div className={styles.sectionInner}>
            <Reveal motionEnabled={motionEnabled} className={styles.sectionHead}>
              <p className="eyebrow">Stack</p>
              <h2 className={styles.sectionTitle}>As ferramentas <span>com que trabalho.</span></h2>
            </Reveal>
            <div className={styles.stackGrid}>
              {owner.stack.map((group, i) => (
                <Reveal key={group.area} motionEnabled={motionEnabled} delay={i * 0.04} className={styles.stackCard}>
                  <h3 className={styles.stackArea}>{group.area}</h3>
                  <div className={styles.chipRow}>
                    {group.items.map((item) => <span key={item} className={styles.chip}>{item}</span>)}
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal motionEnabled={motionEnabled} className={styles.services}>
              <h3 className={styles.servicesTitle}>Serviços</h3>
              <div className={styles.chipRow}>
                {owner.services.map((service) => <span key={service} className={styles.serviceChip}>{service}</span>)}
              </div>
            </Reveal>
          </div>
        </section>

        <section id="experiencia" className={styles.section}>
          <div className={styles.sectionInner}>
            <Reveal motionEnabled={motionEnabled} className={styles.sectionHead}>
              <p className="eyebrow">Experiência e formação</p>
              <h2 className={styles.sectionTitle}>Onde aprendi <span>a construir de verdade.</span></h2>
            </Reveal>
            <div className={styles.timeline}>
              {owner.experience.map((job, i) => (
                <Reveal key={job.company} motionEnabled={motionEnabled} delay={i * 0.06} className={styles.role}>
                  <div className={styles.roleHead}>
                    <Briefcase size={18} className={styles.roleIcon} />
                    <div>
                      <h3 className={styles.roleTitle}>{job.role} · {job.company}</h3>
                      <p className={styles.roleMeta}>{job.meta}</p>
                    </div>
                  </div>
                  <p className={styles.roleSummary}>{job.summary}</p>
                  <ul className={styles.roleList}>
                    {job.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                  </ul>
                  <div className={styles.chipRow}>
                    {job.tags.map((tag) => <span key={tag} className={styles.chip}>{tag}</span>)}
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal motionEnabled={motionEnabled} className={styles.edu}>
              <div className={styles.roleHead}>
                <GraduationCap size={18} className={styles.roleIcon} />
                <div>
                  <h3 className={styles.roleTitle}>{owner.education.degree}</h3>
                  <p className={styles.roleMeta}>{owner.education.school} · {owner.education.period}</p>
                </div>
              </div>
              <ul className={styles.eduTopics}>
                {owner.education.topics.map((topic) => <li key={topic}>{topic}</li>)}
              </ul>
              <div className={styles.eduProjects}>
                <span className={styles.eduProjectsLabel}>Projetos da faculdade:</span>
                {owner.education.projects.map((project) => (
                  <a key={project.name} className={styles.eduProjectLink} href={project.url} target="_blank" rel="noopener noreferrer">{project.name}<ArrowUpRight size={13} /></a>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section id="certificados" className={styles.section}>
          <div className={styles.sectionInner}>
            <Reveal motionEnabled={motionEnabled} className={styles.sectionHead}>
              <p className="eyebrow"><Award size={13} /> Licenças e certificados</p>
              <h2 className={styles.sectionTitle}>Qualificação <span>comprovada.</span></h2>
              <p className={styles.sectionText}>Transcritos do README público do perfil. Cada credencial é exibida como texto, exatamente como na fonte.</p>
            </Reveal>
            <div className={styles.certGrid}>
              {owner.certificates.map((cert, i) => (
                <Reveal key={`${cert.name}-${i}`} motionEnabled={motionEnabled} delay={i * 0.03} className={styles.certCard}>
                  <h3 className={styles.certName}>{cert.name}</h3>
                  <p className={styles.certIssuer}>{cert.issuer}</p>
                  <p className={styles.certDate}>{cert.date}</p>
                  <p className={styles.certCred}><span>Credencial</span> {cert.credential}</p>
                </Reveal>
              ))}
            </div>
            <Reveal motionEnabled={motionEnabled} className={styles.certHighlight}>
              <BookOpen size={16} />
              <p>{owner.certificateHighlight}</p>
            </Reveal>
            <p className={styles.certNote}>{owner.certificateNote}</p>
          </div>
        </section>

        <section id="projetos" className={styles.section}>
          <div className={styles.sectionInner}>
            <Reveal motionEnabled={motionEnabled} className={styles.sectionHead}>
              <p className="eyebrow">Projetos</p>
              <h2 className={styles.sectionTitle}>O que ando <span>construindo.</span></h2>
            </Reveal>
            <div className={styles.projGrid}>
              {owner.projects.map((project, i) => (
                <Reveal key={project.name} motionEnabled={motionEnabled} delay={i * 0.05} className={styles.projCard}>
                  <h3 className={styles.projName}>{project.name}</h3>
                  <p className={styles.projDesc}>{project.description}</p>
                </Reveal>
              ))}
            </div>
            <div className={styles.projFoot}>
              <a className={`${styles.ctaGhost} aero-button aero-button-glass`} href={owner.links.github} target="_blank" rel="noopener noreferrer">Ver todos no GitHub <ArrowUpRight size={15} /></a>
              <p className={styles.projNote}>{owner.projectsNote}</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <Reveal motionEnabled={motionEnabled} className={styles.sectionHead}>
              <p className="eyebrow">Publicações</p>
              <h2 className={styles.sectionTitle}>O que escrevo <span>sobre o ofício.</span></h2>
            </Reveal>
            <ul className={styles.pubList}>
              {owner.publications.map((entry) => (
                <li key={entry} className={styles.pubItem}>{entry}</li>
              ))}
            </ul>
          </div>
        </section>

        <section id="contato" className={styles.section}>
          <div className={styles.sectionInner}>
            <Reveal motionEnabled={motionEnabled} className={styles.sectionHead}>
              <p className="eyebrow"><Send size={13} /> Contato</p>
              <h2 className={styles.sectionTitle}>Fale direto <span>com o dono.</span></h2>
            </Reveal>
            <div className={styles.contactGrid}>
              <a className={styles.contactCard} href={OWNER_WHATSAPP} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={22} />
                <span className={styles.contactLabel}>WhatsApp</span>
                <span className={styles.contactValue}>{site.whatsappDisplay}</span>
              </a>
              <a className={styles.contactCard} href={owner.links.linkedin} target="_blank" rel="noopener noreferrer">
                <Linkedin size={22} />
                <span className={styles.contactLabel}>LinkedIn</span>
                <span className={styles.contactValue}>/in/césar-rodrigues-ribeiro</span>
              </a>
              <a className={styles.contactCard} href={owner.links.github} target="_blank" rel="noopener noreferrer">
                <Github size={22} />
                <span className={styles.contactLabel}>GitHub</span>
                <span className={styles.contactValue}>@nuwget</span>
              </a>
            </div>
            <p className={styles.contactNote}>O site pessoal citado no perfil ainda não está no ar, então não aponto para um endereço que não responde.</p>
          </div>
        </section>

        <section className={styles.journey}>
          <div className={styles.journeyInner}>
            <Reveal motionEnabled={motionEnabled} className={styles.journeyCard}>
              <Compass size={24} className={styles.journeyIcon} />
              <h2 className={styles.journeyTitle}>Quer ver o que construo na prática?</h2>
              <p className={styles.journeyText}>O Experience reúne protótipos e estudos interativos que já estão no ar — um showroom em construção, sem promessas além do que existe.</p>
              <Link className={`${styles.journeyCta} aero-button aero-button-primary`} href="/experience">Explorar o Experience <ArrowUpRight size={16} /></Link>
            </Reveal>
            <Reveal motionEnabled={motionEnabled} delay={0.1} className={styles.journeyCard}>
              <Sparkles size={24} className={styles.journeyIcon} />
              <h2 className={styles.journeyTitle}>Já tem uma ideia de sistema?</h2>
              <p className={styles.journeyText}>Abra o convite dedicado e me conte o problema. A conversa começa pelo entendimento, não pelo código.</p>
              <Link className={`${styles.journeyCta} aero-button aero-button-glass`} href="/convite-para-criar-sistema">Abrir o convite <ArrowUpRight size={16} /></Link>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <VistaMark className={styles.brandMark} />
            <span><strong>VISTA</strong><small>Vistanology</small></span>
          </div>
          <nav className={styles.footerLinks} aria-label="Outras páginas">
            <Link href="/">Universo Vistanology</Link>
            <Link href="/convite-para-criar-sistema">Convite para criar um sistema</Link>
            <Link href="/experience">Experience</Link>
            <a href={OWNER_WHATSAPP} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a href={owner.links.github} target="_blank" rel="noopener noreferrer">GitHub</a>
          </nav>
          <p className={styles.footerNote}>© {new Date().getFullYear()} Vistanology · {owner.name} ({owner.alias}). Feito com visão, tecnologia e personalidade.</p>
        </div>
      </footer>
    </div>
  );
}
