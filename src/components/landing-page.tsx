"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, MotionConfig } from "framer-motion";
import { ArrowUp, ArrowUpRight, CodeXml, Github, Heart, Mail, MessageCircle } from "lucide-react";
import { site, whatsappUrl } from "@/data/site";
import Brand from "./brand";
import Navbar from "./navbar";
import Hero from "./hero";
import { OceanDepth } from "./living-background";
import Universe from "./universe";
import Projects from "./projects";
import SoftwareCatalog from "./software-catalog";
import Principles from "./principles";
import Faq from "./faq";
import SoundscapePlayer from "./soundscape-player";
import VistaBoot from "./vista-boot";
import { completeEntry, getServerShowBoot, getShowBoot, resumeRememberedSoundtrack, subscribeEntry } from "@/lib/entry";

const RequestWizard = dynamic(() => import("./request-wizard"), { ssr: false });

function subscribeMotionPreference(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getMotionPreference() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function LandingPage() {
  const reducedMotion = useSyncExternalStore(subscribeMotionPreference, getMotionPreference, () => true);
  const [motionChoice, setMotionChoice] = useState<boolean | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const showBoot = useSyncExternalStore(subscribeEntry, getShowBoot, getServerShowBoot);
  const motionEnabled = motionChoice ?? !reducedMotion;
  const openRequest = () => setRequestOpen(true);

  useEffect(() => {
    resumeRememberedSoundtrack();
  }, []);

  return <MotionConfig reducedMotion={motionEnabled ? "never" : "always"} transition={{ type: "spring", stiffness: 260, damping: 26 }}>
    <div className="vistanology" data-motion={motionEnabled ? "on" : "off"}>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <Navbar onOrder={openRequest} motionEnabled={motionEnabled} onToggleMotion={() => setMotionChoice(!motionEnabled)} />
      <main id="conteudo"><Hero onOrder={openRequest} motionEnabled={motionEnabled} /><div className="ocean-content"><OceanDepth motionEnabled={motionEnabled} /><Universe motionEnabled={motionEnabled} /><Projects motionEnabled={motionEnabled} /><SoftwareCatalog onOrder={openRequest} /><Principles motionEnabled={motionEnabled} /><Faq motionEnabled={motionEnabled} />
        <section id="contato" className="section contact-section shell"><div className="contact-window glass-panel"><div className="contact-orb" aria-hidden="true"><Mail size={40} strokeWidth={1.2} /></div><span className="eyebrow">A PRÓXIMA IDEIA PODE SER SUA</span><h2>Vamos criar um futuro<br /><span>um pouco mais bonito?</span></h2><p>Conte o que você imagina. Uma ferramenta, uma experiência,<br className="desktop-break" /> uma solução que ainda não existe. Toda boa ideia começa com uma conversa.</p><div className="contact-actions"><button className="aero-button aero-button-primary" onClick={openRequest}><CodeXml size={18} />Pedir um software<ArrowUpRight size={17} /></button><a href={whatsappUrl("Olá, César! Vi o site da Vistanology e quero conversar sobre um projeto.")} target="_blank" rel="noreferrer" className="aero-button aero-button-glass"><MessageCircle size={18} />Conversar no WhatsApp</a><a href={site.github} target="_blank" rel="noreferrer" className="aero-button aero-button-glass"><Github size={18} />Visitar o GitHub<ArrowUpRight size={16} /></a></div><Link className="text-link contact-invite-link" style={{ display: "block", margin: "16px auto 0" }} href="/convite-para-criar-sistema">Prefere um convite dedicado? Abrir a página de convite<ArrowUpRight size={15} /></Link><a className="text-link contact-faq-link" href="#duvidas">Perguntas frequentes antes de enviar<ArrowUpRight size={15} /></a>{!site.requestEndpoint && !site.contactEmail && <small className="contact-notice">Prepare seu briefing agora. O recebimento online ainda não está configurado.</small>}</div></section>
      </div></main>
      <footer className="footer shell"><div className="footer-main"><a href="#inicio" aria-label="Vistanology — voltar ao início"><Brand compact /></a><p>Tecnologia com alma. Um universo em construção.</p><nav className="footer-nav" aria-label="Seções de apoio"><a href="#principios">Princípios</a><a href="#duvidas">Dúvidas</a><Link href="/convite-para-criar-sistema">Convite</Link><Link href="/quem-e-o-dono">Quem é o dono?</Link><a href={whatsappUrl("Olá, César! Vi o site da Vistanology e quero conversar sobre um projeto.")} target="_blank" rel="noreferrer">WhatsApp</a></nav><a className="text-link" href="#inicio">Voltar ao céu<ArrowUp size={15} /></a></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Vistanology. Feito com cuidado.</span><span><Heart size={12} /> Inspirado por um futuro que ainda vale imaginar.</span></div></footer>
      <SoundscapePlayer motionEnabled={motionEnabled} />
      {showBoot && <VistaBoot motionEnabled={motionEnabled} onEnter={completeEntry} />}
      <AnimatePresence>{requestOpen && <RequestWizard key="request" onClose={() => setRequestOpen(false)} />}</AnimatePresence>
    </div>
  </MotionConfig>;
}
