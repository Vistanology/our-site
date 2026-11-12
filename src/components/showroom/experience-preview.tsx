"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CircleDot, Layers, MousePointer2, RotateCcw, Shuffle, Sparkles } from "lucide-react";
import styles from "./showroom.module.css";
import { MiniButton, Slider, Switch } from "./controls";

type PaletteId = "aero" | "jardim" | "orbital";

const PALETTES: Record<PaletteId, { name: string; accent: string; accent2: string }> = {
  aero: { name: "Aero", accent: "#00d2ff", accent2: "#a8ff78" },
  jardim: { name: "Jardim", accent: "#7beb00", accent2: "#03a269" },
  orbital: { name: "Orbital", accent: "#b29cff", accent2: "#ff5ea8" },
};

const DEFAULTS = { palette: "aero" as PaletteId, scale: 100, glass: 60, radius: 18, micro: true, gradient: true, light: false };

export default function ExperiencePreview({ motionEnabled }: { motionEnabled: boolean }) {
  const [state, setState] = useState(DEFAULTS);
  const [ideas, setIdeas] = useState(0);
  const [detail, setDetail] = useState(false);
  const { palette, scale, glass, radius, micro, gradient, light } = state;
  const p = PALETTES[palette];
  const live = micro && motionEnabled;

  const vars = {
    "--sp-accent": p.accent,
    "--sp-accent2": p.accent2,
    "--sp-accent-text": light ? `color-mix(in srgb, ${p.accent} 52%, #06344f)` : p.accent,
    "--sp-ink": light ? "#06344f" : "#eaf7ff",
    "--sp-muted": light ? "#2a5a74" : "#c2e4f4",
    "--sp-surface": light ? "rgba(255,255,255,0.72)" : "rgba(3,42,74,0.55)",
    "--sp-border": light ? "rgba(6,52,79,0.22)" : "rgba(255,255,255,0.45)",
    "--sp-radius": `${radius}px`,
    "--sp-blur": `${(glass * 0.2).toFixed(1)}px`,
    "--sp-scale": String(scale / 100),
    background: light ? "linear-gradient(160deg, #eaf7ff, #c7ecff 58%, #dff4ff)" : undefined,
  } as React.CSSProperties;

  const randomize = () => {
    const keys = Object.keys(PALETTES) as PaletteId[];
    setState({
      palette: keys[Math.floor(Math.random() * keys.length)],
      scale: 70 + Math.round(Math.random() * 60),
      glass: Math.round(Math.random() * 100),
      radius: Math.round(Math.random() * 32),
      micro: Math.random() > 0.25,
      gradient: Math.random() > 0.25,
      light: Math.random() > 0.5,
    });
    setDetail(false);
  };

  return (
    <>
      <div className={`${styles.stage} ${styles.stageExp}`}>
        <div className={styles.expStage} style={vars} data-exp-stage>
          <div className={styles.expMesh} style={{ opacity: gradient ? 0.3 : 0 }} aria-hidden="true" />
          <motion.div
            className={styles.expOrb}
            style={{ width: 90, height: 90, left: "8%", top: "14%" }}
            animate={motionEnabled ? { y: [0, -14, 0] } : { y: 0 }}
            transition={{ duration: 7, repeat: motionEnabled ? Infinity : 0, ease: "easeInOut" }}
            aria-hidden="true"
          />
          <motion.div
            className={styles.expOrb}
            style={{ width: 54, height: 54, right: "10%", bottom: "16%" }}
            animate={motionEnabled ? { y: [0, 12, 0] } : { y: 0 }}
            transition={{ duration: 9, repeat: motionEnabled ? Infinity : 0, ease: "easeInOut" }}
            aria-hidden="true"
          />
          <div className={`${styles.specWrap} ${styles.scrollArea}`}>
            <motion.div
              className={styles.specCard}
              data-spec-card
              animate={live ? { y: [0, -4, 0] } : { y: 0 }}
              transition={{ duration: 8, repeat: live ? Infinity : 0, ease: "easeInOut" }}
            >
              <span className={styles.specEyebrow}><Sparkles size={12} /> EXPERIÊNCIA DIGITAL</span>
              <h4 className={styles.specTitle}>Design que <em>respira</em> com você.</h4>
              <p className={styles.specText}>Cada detalhe desta interface responde aos controles abaixo. Ajuste, sinta a diferença.</p>
              <div className={styles.specActions}>
                <motion.button
                  type="button"
                  className={styles.specBtnPrimary}
                  whileHover={live ? { scale: 1.05 } : undefined}
                  whileTap={live ? { scale: 0.95 } : undefined}
                  onClick={() => setIdeas((n) => n + 1)}
                >
                  <MousePointer2 size={14} /> Registrar ideia
                </motion.button>
                <motion.button
                  type="button"
                  className={styles.specBtnGhost}
                  aria-expanded={detail}
                  whileHover={live ? { scale: 1.04 } : undefined}
                  whileTap={live ? { scale: 0.96 } : undefined}
                  onClick={() => setDetail((d) => !d)}
                >
                  <Layers size={14} /> {detail ? "Ocultar detalhes" : "Ver detalhes"}
                </motion.button>
              </div>
              <div aria-live="polite">
                {ideas > 0 && (
                  <motion.span
                    className={styles.specChip}
                    initial={motionEnabled ? { opacity: 0, y: 6 } : false}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <CircleDot size={12} /> {ideas} {ideas === 1 ? "ideia registrada" : "ideias registradas"} neste protótipo
                  </motion.span>
                )}
              </div>
              <AnimatePresence initial={false}>
                {detail && (
                  <motion.div
                    className={styles.specDetail}
                    initial={motionEnabled ? { height: 0, opacity: 0 } : false}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={motionEnabled ? { height: 0, opacity: 0 } : undefined}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <p>Este cartão é um protótipo visual: tipografia, vidro, cor e microinterações são gerados em tempo real pelos controles. Nada aqui é um produto publicado.</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className={styles.paletteRow} role="radiogroup" aria-label="Paleta da interface">
                {(Object.keys(PALETTES) as PaletteId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={palette === id}
                    className={`${styles.paletteCard} ${palette === id ? styles.paletteOn : ""}`}
                    onClick={() => setState({ ...state, palette: id })}
                  >
                    <span className={styles.paletteSwatch} style={{ background: `linear-gradient(120deg, ${PALETTES[id].accent}, ${PALETTES[id].accent2})` }} />
                    {PALETTES[id].name}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <div className={styles.controls} role="group" aria-label="Controles da interface conceitual">
        <Slider label="Escala" value={scale} min={70} max={130} onChange={(v) => setState({ ...state, scale: v })} format={(v) => `${v}%`} />
        <Slider label="Vidro" value={glass} onChange={(v) => setState({ ...state, glass: v })} format={(v) => `${v}%`} />
        <Slider label="Raio" value={radius} max={32} onChange={(v) => setState({ ...state, radius: v })} format={(v) => `${v}px`} />
        <Switch label="Microinterações" on={micro} onChange={(v) => setState({ ...state, micro: v })} />
        <Switch label="Gradiente" on={gradient} onChange={(v) => setState({ ...state, gradient: v })} />
        <Switch label="Tema claro" on={light} onChange={(v) => setState({ ...state, light: v })} />
        <MiniButton onClick={randomize} title="Sortear uma combinação visual"><Shuffle size={13} /> Embaralhar</MiniButton>
        <MiniButton onClick={() => { setState(DEFAULTS); setIdeas(0); setDetail(false); }} title="Voltar ao visual inicial"><RotateCcw size={13} /> Restaurar</MiniButton>
      </div>
    </>
  );
}