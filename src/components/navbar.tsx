"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Compass, Github, Globe2, House, Info, LayoutGrid, Mail, Menu, MessageCircle, Monitor, Pause, Play, Sparkles, UserRound, X } from "lucide-react";
import { site, whatsappUrl } from "@/data/site";
import Brand from "./brand";
import SoundscapeMenu from "./soundscape-menu";

const sectionLinks = [
  { label: "Início", href: "#inicio", Icon: House },
  { label: "Universo", href: "#universo", Icon: Globe2 },
  { label: "Sobre", href: "#sobre", Icon: Info },
  { label: "Projetos", href: "#projetos", Icon: LayoutGrid },
  { label: "Softwares", href: "#softwares", Icon: Monitor },
  { label: "Contato", href: "#contato", Icon: Mail },
];

const pageLinks = [
  { label: "Início", href: "/", Icon: House },
  { label: "Convite", href: "/convite-para-criar-sistema", Icon: Sparkles },
  { label: "Dono", href: "/quem-e-o-dono", Icon: UserRound },
  { label: "Experience", href: "/experience", Icon: Compass },
];

export default function Navbar({ onOrder, motionEnabled, onToggleMotion }: { onOrder?: () => void; motionEnabled: boolean; onToggleMotion: () => void }) {
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "";
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("#inicio");
  const menuButton = useRef<HTMLButtonElement>(null);

  function isActivePage(href: string) {
    return href === "/" ? isHome : pathname === href || pathname.startsWith(`${href}/`);
  }

  useEffect(() => {
    if (!isHome) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) setActive(`#${entry.target.id}`); });
    }, { rootMargin: "-15% 0px -65% 0px", threshold: 0 });
    sectionLinks.forEach(({ href }) => { const el = document.querySelector(href); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [isHome]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenuOpen(false); menuButton.current?.focus(); }
    };
    const media = window.matchMedia("(min-width: 1180px)");
    const onResize = () => { if (media.matches) setMenuOpen(false); };
    document.addEventListener("keydown", close);
    media.addEventListener("change", onResize);
    return () => { document.removeEventListener("keydown", close); media.removeEventListener("change", onResize); };
  }, [menuOpen]);

  return <header className="header-wrap">
    <nav className="navbar glass-panel" aria-label="Navegação principal">
      {isHome
        ? <a href="#inicio" aria-label="Vistanology — início" className="brand-link"><Brand compact /></a>
        : <Link href="/" aria-label="Vistanology — início" className="brand-link"><Brand compact /></Link>}
      <div className="desktop-links">{isHome
        ? <>{sectionLinks.map(({ label, href, Icon }) => <a href={href} key={href} aria-current={active === href ? "location" : undefined}><Icon size={15} />{label}</a>)}<span className="nav-divider" aria-hidden="true" /><Link href="/convite-para-criar-sistema"><Sparkles size={15} />Convite</Link><Link href="/quem-e-o-dono"><UserRound size={15} />Dono</Link><Link href="/experience"><Compass size={15} />Experience</Link></>
        : pageLinks.map(({ label, href, Icon }, i) => <Fragment key={href}>{i === 1 && <span className="nav-divider" aria-hidden="true" />}<Link href={href} aria-current={isActivePage(href) ? "page" : undefined}><Icon size={15} />{label}</Link></Fragment>)}
      </div>
      <span className="nav-divider nav-tools-divider" aria-hidden="true" />
      <div className="nav-tools">
        <a className="icon-button nav-whatsapp" href={whatsappUrl("Olá, César! Vi o site da Vistanology e quero conversar sobre um projeto.")} target="_blank" rel="noreferrer" aria-label="Conversar no WhatsApp (nova aba)"><MessageCircle size={20} /></a>
        <a className="icon-button" href={site.github} target="_blank" rel="noreferrer" aria-label="Visitar GitHub (nova aba)"><Github size={22} /></a>
        <SoundscapeMenu motionEnabled={motionEnabled} />
        <button className="icon-button motion-toggle" onClick={onToggleMotion} aria-label={motionEnabled ? "Pausar animações" : "Ativar animações"} aria-pressed={!motionEnabled}>{motionEnabled ? <Pause size={18} /> : <Play size={18} />}</button>
        <button ref={menuButton} className="icon-button menu-toggle" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
    </nav>
    <AnimatePresence>{menuOpen && <motion.div id="mobile-navigation" className="mobile-navigation glass-panel" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ type: "spring", stiffness: 300, damping: 28 }}>
      {isHome ? <>
        {sectionLinks.map(({ label, href, Icon }) => <a key={href} href={href} aria-current={active === href ? "location" : undefined} onClick={() => setMenuOpen(false)}><Icon size={18} />{label}<ArrowUpRight size={16} /></a>)}
        <span className="nav-sep" aria-hidden="true" />
        <Link href="/convite-para-criar-sistema" onClick={() => setMenuOpen(false)}><Sparkles size={18} />Convite para criar um sistema<ArrowUpRight size={16} /></Link>
        <Link href="/quem-e-o-dono" onClick={() => setMenuOpen(false)}><UserRound size={18} />Quem é o dono?<ArrowUpRight size={16} /></Link>
        <Link href="/experience" onClick={() => setMenuOpen(false)}><Compass size={18} />Experience<ArrowUpRight size={16} /></Link>
        {onOrder && <><span className="nav-sep" aria-hidden="true" /><button onClick={() => { setMenuOpen(false); onOrder(); }}>Pedir um software<ArrowUpRight size={16} /></button></>}
      </> : pageLinks.map(({ label, href, Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} aria-current={isActivePage(href) ? "page" : undefined}><Icon size={18} />{label}<ArrowUpRight size={16} /></Link>)}
    </motion.div>}</AnimatePresence>
  </header>;
}
