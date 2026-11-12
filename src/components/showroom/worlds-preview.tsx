"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { animate, motion, useSpring, useTransform } from "framer-motion";
import { Move, MoonStar, RotateCcw, Shuffle, Sun, Sunrise, Sunset } from "lucide-react";
import styles from "./showroom.module.css";
import { MiniButton, Slider, Switch } from "./controls";

const W = 800;
const H = 450;
const HORIZON = 298;
const ISLAND_Y = 292;
const DAWN_HOUR = 5.7;
const DUSK_HOUR = 18.9;

type State = {
  hour: number;
  light: number;
  fog: number;
  particles: number;
  wind: number;
  rays: boolean;
  reflection: boolean;
  grid: boolean;
};

type SceneKey = "hour" | "light" | "fog" | "particles" | "wind";

const DEFAULTS: State = { hour: 9.6, light: 62, fog: 18, particles: 10, wind: 40, rays: true, reflection: true, grid: false };

const PRESETS: { id: string; label: string; icon: typeof Sun; values: Pick<State, SceneKey> }[] = [
  { id: "dawn", label: "Amanhecer", icon: Sunrise, values: { hour: 5.9, light: 46, fog: 44, particles: 9, wind: 22 } },
  { id: "noon", label: "Meio-dia", icon: Sun, values: { hour: 12.6, light: 88, fog: 8, particles: 12, wind: 34 } },
  { id: "golden", label: "Hora dourada", icon: Sunset, values: { hour: 18.4, light: 58, fog: 26, particles: 10, wind: 48 } },
  { id: "night", label: "Noite", icon: MoonStar, values: { hour: 22.4, light: 20, fog: 34, particles: 14, wind: 16 } },
];

const TOWERS: { x: number; w: number; h: number; cap: "dome" | "garden" | "spire" | "flat" }[] = [
  { x: 262, w: 44, h: 112, cap: "garden" },
  { x: 314, w: 58, h: 168, cap: "dome" },
  { x: 380, w: 36, h: 92, cap: "flat" },
  { x: 424, w: 54, h: 140, cap: "dome" },
  { x: 486, w: 30, h: 104, cap: "spire" },
];

const CLOUDS = [
  { x: 150, y: 78, s: 1 },
  { x: 430, y: 52, s: 0.72 },
  { x: 640, y: 118, s: 0.9 },
  { x: 292, y: 150, s: 0.55 },
];

const seed = (i: number) => {
  const v = Math.sin((i + 1) * 127.1) * 43758.5453;
  return q(v - Math.floor(v));
};

// Math.sin pode divergir na última casa entre o V8 do servidor e o do navegador;
// quantizar mantém os atributos do SVG idênticas nas duas renders.
function q(value: number) {
  return Math.round(value * 1e6) / 1e6;
}

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);

type RGB = [number, number, number];

function hex(value: string): RGB {
  const n = parseInt(value.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixArr(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

const css = (c: RGB) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
const alpha = (c: RGB, a: number) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${Math.round(a * 1000) / 1000})`;

export function formatHour(value: number) {
  const total = Math.round((((value % 24) + 24) % 24) * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function buildPalette(hour: number, light: number, fog: number) {
  const expo = 0.44 + (light / 100) * 1.14;
  const sunPath = clamp01((hour - 5.4) / 14.4);
  const arc = q(Math.sin(Math.PI * sunPath));
  const dayAmt = clamp01(arc * 1.5 * expo);
  const dawnWindow = Math.min(
    1,
    clamp01(1 - Math.abs(hour - DAWN_HOUR) / 2.3) + clamp01(1 - Math.abs(hour - DUSK_HOUR) / 2.6),
  );
  const dawnAmt = clamp01(dawnWindow * expo);
  const nightAmt = clamp01(1 - Math.min(1, dayAmt * 1.15 + dawnAmt * 0.6));

  const tone = (night: string, dawn: string, day: string) =>
    mixArr(mixArr(hex(night), hex(day), dayAmt), hex(dawn), dawnAmt * 0.72);

  const skyTop = tone("#040e26", "#2a3a72", "#3fbfff");
  const skyMid = tone("#061a34", "#8a6aa6", "#8fdcff");
  const skyBot = tone("#0a2340", "#ff9d5c", "#ddf8ff");
  const haze = tone("#0c2740", "#ffc38a", "#c4f0ff");
  const rock = tone("#0a1a26", "#3f3a54", "#8ea6b4");
  const grass = tone("#0a2c1f", "#33493a", "#5ed085");
  const foliage = tone("#08241a", "#26402e", "#3fae68");
  const waterTop = tone("#03141f", "#a86a48", "#54c8ec");
  const waterMid = tone("#02101a", "#4a4260", "#1d94c4");
  const waterBot = tone("#01090f", "#22304a", "#075f8c");
  const sunCore = mixArr(mixArr(hex("#ffdca0"), hex("#fffef8"), dayAmt), hex("#ff8f36"), dawnAmt * 0.85);
  const glow = mixArr(hex("#fff2c8"), hex("#ffae5e"), dawnAmt);

  const moonPath = clamp01(((hour + 24 - 19.6) % 24) / 10.6);
  const moonArc = q(Math.sin(Math.PI * moonPath));
  const sunVis = clamp01(arc * 7);

  return {
    sunX: 66 + sunPath * 668,
    sunY: HORIZON - 16 - arc * 244,
    moonX: 72 + moonPath * 656,
    moonY: HORIZON - 24 - moonArc * 214,
    sunVis,
    moonVis: clamp01(moonArc * 5) * nightAmt,
    starOpacity: nightAmt * 0.95,
    windowOpacity: clamp01(nightAmt * 0.9 + dawnAmt * 0.45),
    rimOpacity: clamp01(dayAmt * 0.55 + dawnAmt * 0.75),
    rayOpacity: clamp01(arc * (0.26 + dawnAmt * 0.34) * expo),
    glitterOpacity: clamp01(sunVis * (0.3 + dawnAmt * 0.4) * expo),
    fogOpacity: (fog / 100) * (0.42 + 0.4 * dayAmt),
    cloudOpacity: 0.26 + 0.44 * clamp01(dayAmt + dawnAmt),
    gradeNight: nightAmt * 0.34,
    gradeDawn: dawnAmt * 0.2,
    dayAmt,
    dawnAmt,
    nightAmt,
    c: {
      skyTop: css(skyTop),
      skyMid: css(skyMid),
      skyBot: css(skyBot),
      haze: css(haze),
      rock: css(rock),
      rockDark: css(mixArr(rock, hex("#01090f"), 0.42)),
      grass: css(grass),
      islandGrass: css(mixArr(grass, haze, 0.24)),
      grassDark: css(mixArr(grass, hex("#02170f"), 0.45)),
      foliage: css(foliage),
      foliageDark: css(mixArr(foliage, hex("#01120b"), 0.5)),
      waterTop: css(waterTop),
      waterMid: css(waterMid),
      waterBot: css(waterBot),
      sunCore: css(sunCore),
      glow: css(glow),
      glassTop: alpha(mixArr(mixArr(hex("#ffffff"), skyBot, 0.22), sunCore, dawnAmt * 0.4), 0.92),
      glassMid: alpha(mixArr(hex("#7fd8f5"), waterMid, 0.45), 0.78),
      glassBot: alpha(mixArr(hex("#0a3f76"), waterBot, 0.45), 0.92),
      window: "rgb(255, 215, 154)",
      cloud: alpha(mixArr(hex("#e9fbff"), skyBot, 0.25), 0.92),
      cloudWarm: alpha(mixArr(hex("#ffffff"), hex("#ffb573"), dawnAmt * 0.8), 0.9),
      star: "rgb(233, 250, 255)",
    },
  };
}

function windowTiles() {
  const tiles: { x: number; y: number; w: number; a: number }[] = [];
  TOWERS.forEach((tower, ti) => {
    const cols = Math.max(2, Math.floor((tower.w - 12) / 11));
    const rows = Math.max(3, Math.floor((tower.h - 20) / 16));
    const cw = (tower.w - 12) / cols;
    for (let col = 0; col < cols; col += 1) {
      for (let row = 0; row < rows; row += 1) {
        const s = seed(ti * 91 + col * 13 + row * 7);
        if (s < 0.55) continue;
        tiles.push({
          x: tower.x + 6 + col * cw,
          y: ISLAND_Y - tower.h + 12 + row * 16,
          w: Math.max(3, cw - 5),
          a: 0.45 + s * 0.55,
        });
      }
    }
  });
  return tiles;
}

const WINDOWS = windowTiles();

const STARS = Array.from({ length: 34 }, (_, i) => ({
  x: 12 + seed(i * 5 + 1) * 776,
  y: 8 + seed(i * 5 + 2) * 208,
  r: 0.5 + seed(i * 5 + 3) * 1.1,
  base: 0.35 + seed(i * 5 + 4) * 0.65,
  dur: 2.2 + seed(i * 5 + 5) * 3.4,
  delay: -seed(i * 5 + 6) * 5,
}));

const f2 = (value: number) => value.toFixed(2);

// Fronda de palmeira paramétrica: espinha arqueada com gravidade e borda serrilhada.
function frondPath(cx: number, cy: number, angle: number, len: number, droop: number, width: number) {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const nx = -dy;
  const ny = dx;
  const steps = 13;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const px = cx + dx * len * t;
    const py = cy + dy * len * t + droop * len * t * t;
    const w = Math.sin(Math.PI * t) * width * (1 - t * 0.3);
    const serr = i % 2 === 0 ? 1.2 : 0.72;
    left.push(`${f2(px + nx * w * serr)} ${f2(py + ny * w * serr)}`);
    right.push(`${f2(px - nx * w * serr)} ${f2(py - ny * w * serr)}`);
  }
  const tip = `${f2(cx + dx * len)} ${f2(cy + dy * len + droop * len)}`;
  const mid = `${f2(cx + dx * len * 0.55)} ${f2(cy + dy * len * 0.55 + droop * len * 0.3)}`;
  return {
    blade: `M${left[0]} L${left.slice(1).join(" L")} L${tip} L${right.reverse().join(" L")} Z`,
    rib: `M${f2(cx)} ${f2(cy)} Q${mid} ${tip}`,
  };
}

const PALM_CROWN = { x: 122, y: 256 };
const FRONDS = [
  { a: 178, l: 118, d: 0.34, w: 12 },
  { a: 208, l: 104, d: 0.26, w: 11 },
  { a: 240, l: 88, d: 0.2, w: 10 },
  { a: 272, l: 84, d: 0.22, w: 9.5 },
  { a: 302, l: 96, d: 0.26, w: 10.5 },
  { a: 332, l: 112, d: 0.34, w: 12 },
  { a: 8, l: 104, d: 0.4, w: 11 },
].map((f) => frondPath(PALM_CROWN.x, PALM_CROWN.y, f.a, f.l, f.d, f.w));

// Tufos de capim ao longo da borda da ilha.
const TUFTS = Array.from({ length: 13 }, (_, i) => {
  const t = seed(i * 19 + 7);
  const x = 224 + i * 25 + t * 10;
  const lift = Math.sqrt(Math.max(0, 1 - ((x - 386) / 168) ** 2));
  return { x, y: ISLAND_Y + 2 + lift * 12, h: 7 + seed(i * 23 + 8) * 9, lean: -3 + seed(i * 29 + 9) * 7 };
});

const emptySubscribe = () => () => {};const alwaysTrue = () => true;
const alwaysFalse = () => false;

export default function WorldsPreview({ motionEnabled }: { motionEnabled: boolean }) {
  const [state, setState] = useState<State>(DEFAULTS);
  const [hinted, setHinted] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, alwaysTrue, alwaysFalse);
  const { hour, light, fog, particles, wind, rays, reflection, grid } = state;
  const p = useMemo(() => buildPalette(hour, light, fog), [hour, light, fog]);
  const count = Math.round(particles);
  // As estruturas animadas só entram após a hidratação, para que o HTML do servidor
  // e o primeiro render do cliente sejam idênticos mesmo com motion ligado.
  const animated = mounted && motionEnabled;

  const px = useSpring(0, { stiffness: 40, damping: 17 });
  const py = useSpring(0, { stiffness: 40, damping: 17 });
  const farX = useTransform(px, (v) => v * 0.6);
  const farY = useTransform(py, (v) => v * 0.35);
  const midX = useTransform(px, (v) => v * 1.6);
  const midY = useTransform(py, (v) => v * 0.8);
  const nearX = useTransform(px, (v) => v * 3);
  const nearY = useTransform(py, (v) => v * 1.5);
  const foreX = useTransform(px, (v) => v * 4.6);
  const foreY = useTransform(py, (v) => v * 2.4);

  const tweens = useRef(new Map<SceneKey, { controls: { stop: () => void }; from: number }>());

  const stopTweens = useCallback(() => {
    tweens.current.forEach((entry) => entry.controls.stop());
    tweens.current.clear();
  }, []);

  useEffect(() => stopTweens, [stopTweens]);

  const glide = useCallback(
    (target: Partial<Pick<State, SceneKey>>, duration = 1.25) => {
      if (!motionEnabled) {
        stopTweens();
        setState((current) => ({ ...current, ...target }));
        return;
      }
      const keys = Object.keys(target) as SceneKey[];
      setState((current) => {
        keys.forEach((key) => {
          const active = tweens.current.get(key);
          if (active) active.controls.stop();
          const from = active ? active.from : current[key];
          const controls = animate(from, target[key]!, {
            duration,
            ease: [0.4, 0, 0.15, 1],
            onUpdate: (value) => {
              const entry = tweens.current.get(key);
              if (!entry || entry.controls !== controls) return;
              entry.from = value;
              setState((prev) => ({ ...prev, [key]: value }));
            },
            onComplete: () => tweens.current.delete(key),
          });
          tweens.current.set(key, { controls, from });
        });
        return current;
      });
    },
    [motionEnabled, stopTweens],
  );

  useEffect(() => {
    if (!motionEnabled) stopTweens();
  }, [motionEnabled, stopTweens]);

  const bubbles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const dur = Math.max(5, 9 + seed(i * 7 + 2) * 11 - wind * 0.04);
        return {
          x: 30 + seed(i * 3 + 1) * 740,
          r: 2.2 + seed(i * 11 + 3) * 8,
          dur,
          delay: -seed(i * 13 + 4) * dur,
          sway: 5 + wind * 0.26,
          staticY: 428 - seed(i * 17 + 5) * 356,
        };
      }),
    [count, wind],
  );

  const ripples = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const rx = 26 + seed(i * 31 + 13) * 46;
        return {
          cx: 90 + seed(i * 23 + 9) * 620,
          cy: HORIZON + 18 + seed(i * 29 + 11) * 118,
          rx,
          dur: Math.max(6, 13 - wind * 0.05 + seed(i * 37 + 17) * 6),
          delay: -seed(i * 41 + 19) * 9,
        };
      }),
    [wind],
  );

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!motionEnabled) return;
    if (!hinted) setHinted(true);
    const rect = event.currentTarget.getBoundingClientRect();
    px.set(((event.clientX - rect.left) / rect.width - 0.5) * -26);
    py.set(((event.clientY - rect.top) / rect.height - 0.5) * -16);
  };

  const activePreset = PRESETS.find((preset) =>
    (Object.keys(preset.values) as SceneKey[]).every((key) => Math.abs(state[key] - preset.values[key]) < 0.05),
  );

  const randomize = () =>
    glide({
      hour: Math.round(Math.random() * 239) / 10,
      light: Math.round(20 + Math.random() * 80),
      fog: Math.round(Math.random() * 60),
      wind: Math.round(Math.random() * 100),
      particles: 4 + Math.round(Math.random() * 14),
    });

  const restore = () => {
    stopTweens();
    setState(DEFAULTS);
  };

  const driftDur = Math.max(9, 26 - wind * 0.18);
  const cloudDur = Math.max(14, 46 - wind * 0.3);
  const swayDur = Math.max(2.4, 7.4 - wind * 0.05);
  const palmSway = 0.7 + wind * 0.022;
  const fallSpeed = Math.max(0.7, 2.6 - wind * 0.019);

  return (
    <>
      <div
        className={`${styles.stage} ${styles.worldStage}`}
        onPointerMove={handleMove}
        onPointerLeave={() => {
          px.set(0);
          py.set(0);
        }}
      >
        <span className={styles.stageChrome} aria-hidden="true" />
        <span className={styles.sceneTag} aria-hidden="true">
          <em>{formatHour(hour)}</em>
          <span>{activePreset ? activePreset.label : "Cena livre"}</span>
          <b>{Math.round(light)}%</b>
        </span>
        <span className={`${styles.stageHud} ${hinted ? styles.stageHudGone : ""}`}>
          <Move size={12} /> Mova o cursor para explorar a câmera
        </span>

        <svg
          className={styles.worldSvg}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid slice"
          role="img"
          aria-label={`Cena conceitual de um mundo Frutiger Aero com cidade de vidro sobre a água, ${formatHour(
            hour,
          )}, luz ${Math.round(light)} por cento e ${count} partículas`}
        >
          <defs>
            <linearGradient id="sr-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={p.c.skyTop} />
              <stop offset="0.58" stopColor={p.c.skyMid} />
              <stop offset="1" stopColor={p.c.skyBot} />
            </linearGradient>
            <linearGradient id="sr-water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={p.c.waterTop} />
              <stop offset="0.5" stopColor={p.c.waterMid} />
              <stop offset="1" stopColor={p.c.waterBot} />
            </linearGradient>
            <linearGradient id="sr-glass" x1="0" y1="0" x2="0.35" y2="1">
              <stop offset="0" stopColor={p.c.glassTop} />
              <stop offset="0.42" stopColor={p.c.glassMid} />
              <stop offset="1" stopColor={p.c.glassBot} />
            </linearGradient>
            <linearGradient id="sr-rock" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={p.c.rock} />
              <stop offset="1" stopColor={p.c.rockDark} />
            </linearGradient>
            <linearGradient id="sr-trunk" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={p.c.foliageDark} />
              <stop offset="0.55" stopColor={p.c.rock} />
              <stop offset="1" stopColor={p.c.grassDark} />
            </linearGradient>
            <linearGradient id="sr-haze" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={p.c.haze} stopOpacity="0" />
              <stop offset="0.55" stopColor={p.c.haze} stopOpacity="0.85" />
              <stop offset="1" stopColor={p.c.haze} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="sr-fog" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(222,248,255,0.08)" />
              <stop offset="0.62" stopColor="rgba(222,248,255,0.9)" />
              <stop offset="1" stopColor="rgba(178,230,255,0.35)" />
            </linearGradient>
            <linearGradient id="sr-ray" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(255,252,232,0.85)" />
              <stop offset="0.55" stopColor="rgba(255,246,208,0.3)" />
              <stop offset="1" stopColor="rgba(255,246,208,0)" />
            </linearGradient>
            <linearGradient id="sr-fall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(238,252,255,0.92)" />
              <stop offset="0.5" stopColor="rgba(198,240,255,0.7)" />
              <stop offset="1" stopColor="rgba(198,240,255,0.18)" />
            </linearGradient>
            <radialGradient id="sr-sun-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor={p.c.glow} stopOpacity="0.85" />
              <stop offset="0.45" stopColor={p.c.glow} stopOpacity="0.3" />
              <stop offset="1" stopColor={p.c.glow} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sr-moon-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="rgba(214,240,255,0.7)" />
              <stop offset="1" stopColor="rgba(214,240,255,0)" />
            </radialGradient>
            <radialGradient id="sr-glitter" cx="0.5" cy="0" r="0.62">
              <stop offset="0" stopColor={p.c.glow} stopOpacity="0.75" />
              <stop offset="1" stopColor={p.c.glow} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sr-vignette" cx="0.5" cy="0.44" r="0.78">
              <stop offset="0.45" stopColor="rgba(2,14,28,0)" />
              <stop offset="1" stopColor="rgba(2,14,28,0.6)" />
            </radialGradient>
            <filter id="sr-soft" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="2.2" />
            </filter>
            <filter id="sr-reflect" x="-25%" y="-25%" width="150%" height="150%">
              <feTurbulence type="fractalNoise" baseFrequency="0.011 0.048" numOctaves="2" seed="9" result="wave">
                {animated ? (
                  <animate
                    attributeName="baseFrequency"
                    dur="18s"
                    values="0.011 0.048;0.016 0.062;0.011 0.048"
                    repeatCount="indefinite"
                  />
                ) : null}
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="wave" scale="11" xChannelSelector="R" yChannelSelector="G" />
              <feGaussianBlur stdDeviation="1.5" />
            </filter>
            <filter id="sr-grain" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="2" seed="17" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.55 0 0 0 0 0.62 0 0 0 0 0.7 0.34 0.34 0.34 0 -0.28" />
            </filter>
            <clipPath id="sr-frame">
              <rect x="0" y="0" width={W} height={H} />
            </clipPath>
          </defs>

          {/* Céu distante: astro, estrelas, nuvens e serras. */}
          <motion.g style={{ x: farX, y: farY }}>
            <rect x="-60" y="-60" width="920" height="380" fill="url(#sr-sky)" />

            <g data-world-stars opacity={p.starOpacity}>
              {STARS.map((star, i) =>
                animated ? (
                  <motion.circle
                    key={`st-${i}`}
                    cx={star.x}
                    cy={star.y}
                    r={star.r}
                    fill={p.c.star}
                    opacity={star.base}
                    animate={{ opacity: [star.base * 0.35, star.base, star.base * 0.35] }}
                    transition={{ duration: star.dur, repeat: Infinity, ease: "easeInOut", delay: star.delay }}
                  />
                ) : (
                  <circle key={`st-${i}`} cx={star.x} cy={star.y} r={star.r} fill={p.c.star} opacity={star.base} />
                ),
              )}
            </g>

            <g data-world-moon opacity={p.moonVis}>
              <circle cx={p.moonX} cy={p.moonY} r="58" fill="url(#sr-moon-glow)" />
              <circle cx={p.moonX} cy={p.moonY} r="19" fill="#eef8ff" />
              <g fill="#c5dcf0" opacity="0.7">
                <circle cx={p.moonX - 6} cy={p.moonY - 5} r="4.2" />
                <circle cx={p.moonX + 5} cy={p.moonY + 3} r="3" />
                <circle cx={p.moonX - 2} cy={p.moonY + 9} r="2.2" />
              </g>
            </g>

            <g data-world-sun opacity={p.sunVis}>
              <circle cx={p.sunX} cy={p.sunY} r="132" fill="url(#sr-sun-glow)" />
              <circle cx={p.sunX} cy={p.sunY} r="27" fill={p.c.sunCore} />
              <circle cx={p.sunX} cy={p.sunY} r="40" fill="none" stroke={p.c.glow} strokeWidth="1.6" opacity="0.45" />
            </g>

            <motion.g
              animate={motionEnabled ? { x: [0, 42, 0] } : { x: 0 }}
              transition={{ duration: cloudDur, repeat: motionEnabled ? Infinity : 0, ease: "easeInOut" }}
              opacity={p.cloudOpacity}
            >
              {CLOUDS.map((cloud, i) => (
                <g
                  key={`cl-${i}`}
                  transform={`translate(${cloud.x} ${cloud.y}) scale(${cloud.s})`}
                  fill={p.dayAmt > p.dawnAmt ? p.c.cloud : p.c.cloudWarm}
                >
                  <ellipse cx="0" cy="0" rx="58" ry="15" />
                  <ellipse cx="34" cy="-9" rx="40" ry="13" />
                  <ellipse cx="-30" cy="-4" rx="32" ry="11" />
                </g>
              ))}
            </motion.g>

            <path
              d={`M-20 ${HORIZON - 6} L60 214 L128 240 L196 196 L268 252 L340 226 L360 ${HORIZON} Z`}
              fill={p.c.rock}
              opacity="0.34"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.2"
            />
            <path
              d={`M420 ${HORIZON} L470 228 L520 252 L578 206 L640 246 L700 220 L820 ${HORIZON} Z`}
              fill={p.c.rock}
              opacity="0.34"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.2"
            />
            <path
              d={`M-20 ${HORIZON} L52 252 L120 276 L186 244 L250 ${HORIZON} Z`}
              fill={p.c.rock}
              opacity="0.55"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1.2"
            />
            <path
              d={`M560 ${HORIZON} L636 240 L706 268 L772 236 L826 ${HORIZON} Z`}
              fill={p.c.rock}
              opacity="0.55"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1.2"
            />
            <rect x="-60" y={HORIZON - 122} width="920" height="126" fill="url(#sr-haze)" opacity={0.22 + p.fogOpacity * 0.55} />
          </motion.g>

          {/* Cidade de vidro, ilha suspensa, água e reflexo. */}
          <motion.g style={{ x: midX, y: midY }}>
            <motion.g
              animate={motionEnabled ? { x: [0, 5, 0] } : { x: 0 }}
              transition={{ duration: driftDur, repeat: motionEnabled ? Infinity : 0, ease: "easeInOut" }}
            >
              <ellipse cx="386" cy={ISLAND_Y + 18} rx="190" ry="15" fill={p.c.waterBot} opacity="0.4" filter="url(#sr-soft)" />
              <ellipse cx="386" cy={ISLAND_Y + 2} rx="176" ry="17" fill={p.c.islandGrass} />
              <path
                d={`M210 ${ISLAND_Y + 2} A176 17 0 0 0 562 ${ISLAND_Y + 2}`}
                fill="none"
                stroke="rgba(255,252,238,0.55)"
                strokeWidth="1.4"
                opacity={p.rimOpacity}
              />
              <path d={`M232 ${ISLAND_Y + 4} Q386 ${ISLAND_Y + 46} 540 ${ISLAND_Y + 4} Z`} fill="url(#sr-rock)" opacity="0.9" />
              <ellipse cx="386" cy={ISLAND_Y - 2} rx="150" ry="9" fill={p.c.grassDark} opacity="0.4" />
              <ellipse cx="330" cy={ISLAND_Y - 7} rx="92" ry="7" fill="rgba(255,255,246,0.18)" />
              <g fill={p.c.rock} stroke={p.c.rockDark} strokeWidth="0.9">
                <ellipse cx="238" cy={ISLAND_Y + 13} rx="19" ry="7" />
                <ellipse cx="262" cy={ISLAND_Y + 17} rx="12" ry="5" />
                <ellipse cx="532" cy={ISLAND_Y + 12} rx="15" ry="6" />
              </g>

              <g fill={p.c.grassDark} opacity="0.55" filter="url(#sr-soft)" stroke="none">
                {TOWERS.map((tower, i) => {
                  const cx = tower.x + tower.w / 2;
                  const away = cx < p.sunX ? -1 : 1;
                  return <ellipse key={`sh-${i}`} cx={cx + away * tower.w * 0.75} cy={ISLAND_Y + 2} rx={tower.w * 0.8} ry="6" />;
                })}
              </g>
              <g stroke="rgba(226,252,255,0.6)" strokeWidth="1.1">
                {TOWERS.map((tower, i) => {
                  const top = ISLAND_Y - tower.h;
                  return (
                    <g key={`tw-${i}`}>
                      <rect x={tower.x} y={top} width={tower.w} height={tower.h} rx={tower.w * 0.26} fill="url(#sr-glass)" />
                      {tower.cap === "dome" ? (
                        <path
                          d={`M${tower.x + 3} ${top + 4} Q${tower.x + tower.w / 2} ${top - tower.w * 0.42} ${tower.x + tower.w - 3} ${
                            top + 4
                          } Z`}
                          fill="url(#sr-glass)"
                        />
                      ) : null}
                      {tower.cap === "garden" ? (
                        <g>
                          <ellipse cx={tower.x + tower.w / 2} cy={top + 2} rx={tower.w * 0.52} ry="8" fill={p.c.grass} />
                          <ellipse cx={tower.x + tower.w / 2 - 8} cy={top - 1} rx="10" ry="5" fill={p.c.foliage} />
                        </g>
                      ) : null}
                      {tower.cap === "spire" ? (
                        <path
                          d={`M${tower.x + tower.w / 2} ${top - 34} L${tower.x + tower.w - 6} ${top + 6} L${tower.x + 6} ${top + 6} Z`}
                          fill="url(#sr-glass)"
                        />
                      ) : null}
                      <g stroke="rgba(210,246,255,0.32)" strokeWidth="0.9">
                        {Array.from({ length: Math.floor(tower.h / 22) }, (_, row) => (
                          <line
                            key={row}
                            x1={tower.x + 3}
                            y1={top + 14 + row * 22}
                            x2={tower.x + tower.w - 3}
                            y2={top + 14 + row * 22}
                          />
                        ))}
                      </g>
                      <rect
                        x={p.sunX > tower.x + tower.w / 2 ? tower.x + tower.w - 7 : tower.x + 2}
                        y={top + 5}
                        width="5"
                        height={tower.h - 10}
                        rx="2.5"
                        fill="rgba(255,252,238,0.9)"
                        stroke="none"
                        opacity={p.rimOpacity}
                      />
                    </g>
                  );
                })}
                <rect x="336" y={ISLAND_Y - 118} width="128" height="9" rx="4.5" fill="url(#sr-glass)" />
                <rect
                  x="336"
                  y={ISLAND_Y - 118}
                  width="128"
                  height="2.5"
                  rx="1.25"
                  fill="rgba(238,252,255,0.7)"
                  stroke="none"
                />
              </g>
              <g fill={p.c.foliage} stroke={p.c.foliageDark} strokeWidth="0.7">
                {TUFTS.map((tuft, i) => (
                  <path
                    key={`tf-${i}`}
                    d={`M${f2(tuft.x - 2.6)} ${f2(tuft.y)} Q${f2(tuft.x + tuft.lean * 0.3)} ${f2(tuft.y - tuft.h * 0.6)} ${f2(
                      tuft.x + tuft.lean,
                    )} ${f2(tuft.y - tuft.h)} Q${f2(tuft.x + tuft.lean * 0.2)} ${f2(tuft.y - tuft.h * 0.4)} ${f2(tuft.x + 2.6)} ${f2(
                      tuft.y,
                    )} Z`}
                  />
                ))}
              </g>
            </motion.g>

            <motion.g
              style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
              animate={motionEnabled ? { y: [0, -9, 0] } : { y: 0 }}
              transition={{ duration: Math.max(5, 11 - wind * 0.05), repeat: motionEnabled ? Infinity : 0, ease: "easeInOut" }}
            >
              <path
                d="M600 162 Q654 180 708 162 L690 200 Q672 228 654 234 Q636 228 618 200 Z"
                fill="url(#sr-rock)"
                stroke={p.c.rockDark}
                strokeWidth="1"
              />
              <path
                d="M600 162 Q654 180 708 162"
                fill="none"
                stroke="rgba(255,252,238,0.6)"
                strokeWidth="1.6"
                opacity={0.25 + p.rimOpacity * 0.7}
              />
              <g stroke={p.c.foliageDark} strokeWidth="1.4" fill="none" opacity="0.85">
                <path d="M624 206 Q618 228 626 248" />
                <path d="M654 232 Q650 252 658 268" />
                <path d="M684 204 Q692 226 684 244" />
              </g>
              <ellipse cx="654" cy="160" rx="58" ry="14" fill={p.c.grass} />
              <ellipse cx="654" cy="155" rx="36" ry="8" fill={p.c.grassDark} opacity="0.45" />
              <ellipse cx="640" cy="152" rx="14" ry="5" fill={p.c.foliage} opacity="0.8" />
              <rect x="640" y="170" width="28" height="128" rx="12" fill="url(#sr-fall)" opacity="0.9" />
              <g stroke="rgba(255,255,255,0.72)" strokeWidth="1.4" strokeLinecap="round" fill="none">
                {[646, 654, 662].map((x, i) =>
                  animated ? (
                    <motion.line
                      key={x}
                      x1={x}
                      y1="174"
                      x2={x}
                      y2="292"
                      animate={{ y: [0, 14, 0] }}
                      transition={{ duration: fallSpeed, repeat: Infinity, ease: "linear", delay: -i * 0.4 }}
                    />
                  ) : (
                    <line key={x} x1={x} y1="180" x2={x} y2="290" />
                  ),
                )}
              </g>
              <ellipse cx="654" cy={HORIZON + 2} rx="34" ry="8" fill="rgba(232,250,255,0.5)" filter="url(#sr-soft)" />
            </motion.g>

            <rect x="-60" y={HORIZON} width="920" height="180" fill="url(#sr-water)" />
            <rect x="-60" y={HORIZON - 14} width="920" height="18" fill="url(#sr-haze)" opacity={0.3 + p.dayAmt * 0.3} />
            <rect x="-60" y={HORIZON - 1} width="920" height="1.6" fill="rgba(232,252,255,0.8)" opacity={0.18 + p.dayAmt * 0.34} />

            {reflection ? (
              <g data-world-reflection clipPath="url(#sr-frame)" opacity="0.4" filter="url(#sr-reflect)">
                <g transform={`translate(0 ${2 * HORIZON}) scale(1 -1)`}>
                  {TOWERS.map((tower, i) => (
                    <rect
                      key={`rf-${i}`}
                      x={tower.x}
                      y={ISLAND_Y - tower.h}
                      width={tower.w}
                      height={tower.h}
                      rx={tower.w * 0.26}
                      fill="url(#sr-glass)"
                    />
                  ))}
                  <ellipse cx="386" cy={ISLAND_Y} rx="176" ry="17" fill={p.c.islandGrass} />
                  <path
                    d="M600 162 Q654 180 708 162 L690 200 Q672 228 654 234 Q636 228 618 200 Z"
                    fill="url(#sr-rock)"
                    stroke="none"
                  />
                  <ellipse cx="654" cy="160" rx="58" ry="14" fill={p.c.grass} />
                  <rect x="640" y="170" width="28" height="128" rx="12" fill="url(#sr-fall)" />
                  {p.sunVis > 0.02 ? <circle cx={p.sunX} cy={p.sunY} r="27" fill={p.c.sunCore} opacity={p.sunVis * 0.6} /> : null}
                  {p.moonVis > 0.02 ? (
                    <circle cx={p.moonX} cy={p.moonY} r="17" fill="#eef8ff" opacity={p.moonVis * 0.6} />
                  ) : null}
                </g>
              </g>
            ) : null}

            <g stroke="rgba(226,252,255,0.5)" strokeWidth="1.4" fill="none">
              {ripples.map((r, i) =>
                animated ? (
                  <motion.ellipse
                    key={`rp-${i}`}
                    cx={r.cx}
                    cy={r.cy}
                    rx={r.rx}
                    ry={r.rx / 5}
                    style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
                    animate={{ scale: [0.32, 1], opacity: [0.55, 0] }}
                    transition={{ duration: r.dur, repeat: Infinity, ease: "easeOut", delay: r.delay }}
                  />
                ) : (
                  <ellipse key={`rp-${i}`} cx={r.cx} cy={r.cy} rx={r.rx / 2} ry={r.rx / 12} opacity="0.35" />
                ),
              )}
            </g>
          </motion.g>

          {/* Vegetação próxima. */}
          <motion.g style={{ x: nearX, y: nearY }}>
            <g fill={p.c.grassDark} stroke="rgba(226,252,255,0.32)" strokeWidth="1">
              <ellipse cx="700" cy="368" rx="52" ry="15" />
              <ellipse cx="640" cy="404" rx="40" ry="12" />
              <ellipse cx="150" cy="382" rx="46" ry="13" />
            </g>
            <g fill={p.c.grass} opacity="0.5">
              <ellipse cx="694" cy="364" rx="30" ry="8" />
              <ellipse cx="146" cy="378" rx="26" ry="7" />
            </g>
          </motion.g>

          {/* Primeiro plano: palmeira e caniços. */}
          <motion.g style={{ x: foreX, y: foreY }}>
            <motion.g
              style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
              animate={motionEnabled ? { rotate: [-palmSway * 0.8, palmSway, -palmSway * 0.8] } : { rotate: 0 }}
              transition={{ duration: swayDur, repeat: motionEnabled ? Infinity : 0, ease: "easeInOut" }}
            >
              <path
                d="M48 458 C56 402 68 350 92 306 C102 286 112 272 118 256 L126 258 C120 276 112 292 102 312 C80 356 70 406 68 458 Z"
                fill="url(#sr-trunk)"
                stroke={p.c.rockDark}
                strokeWidth="0.8"
              />
              <g stroke={p.c.rockDark} strokeWidth="1.3" opacity="0.5" fill="none">
                <path d="M54 424 Q62 419 70 424" />
                <path d="M62 386 Q70 381 78 386" />
                <path d="M74 344 Q82 339 90 344" />
                <path d="M90 306 Q98 301 104 306" />
              </g>
              <g fill={p.c.foliage} stroke={p.c.foliageDark} strokeWidth="0.9" strokeLinejoin="round">
                {FRONDS.map((frond, i) => (
                  <path key={`fr-${i}`} d={frond.blade} />
                ))}
              </g>
              <g stroke={p.c.foliageDark} strokeWidth="1.3" fill="none" opacity="0.8">
                {FRONDS.map((frond, i) => (
                  <path key={`rib-${i}`} d={frond.rib} />
                ))}
              </g>
              <g fill={p.c.rockDark} stroke="rgba(255,252,238,0.4)" strokeWidth="0.7">
                <circle cx="117" cy="262" r="4.6" />
                <circle cx="127" cy="265" r="4.1" />
                <circle cx="122" cy="257" r="3.6" />
              </g>
            </motion.g>

            <motion.g
              style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
              animate={motionEnabled ? { rotate: [-palmSway * 1.3, palmSway * 1.5, -palmSway * 1.3] } : { rotate: 0 }}
              transition={{ duration: swayDur * 0.78, repeat: motionEnabled ? Infinity : 0, ease: "easeInOut" }}
              stroke={p.c.grassDark}
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            >
              <path d="M746 456 Q740 398 752 352" />
              <path d="M770 456 Q776 402 766 360" />
              <path d="M792 456 Q800 408 788 372" />
            </motion.g>
          </motion.g>

          {/* Correção de cor da cena. */}
          <rect x="0" y="0" width={W} height={H} fill="#0a2044" opacity={p.gradeNight} style={{ mixBlendMode: "multiply" }} />
          <rect x="0" y="0" width={W} height={H} fill="#ff9f57" opacity={p.gradeDawn} style={{ mixBlendMode: "soft-light" }} />

          {/* Camada emissiva: janelas, reflexo do astro e raios. */}
          <g opacity={p.windowOpacity} style={{ mixBlendMode: "screen" }}>
            {WINDOWS.map((tile, i) => (
              <rect key={`wn-${i}`} x={tile.x} y={tile.y} width={tile.w} height="5" rx="1.5" fill={p.c.window} opacity={tile.a} />
            ))}
          </g>

          <g opacity={p.glitterOpacity} style={{ mixBlendMode: "screen" }} transform={`translate(${p.sunX - 400} 0)`}>
            <ellipse cx="400" cy={HORIZON + 58} rx="112" ry="84" fill="url(#sr-glitter)" />
          </g>

          {rays ? (
            <g data-world-rays opacity={p.rayOpacity} style={{ mixBlendMode: "screen" }}>
              <g transform={`translate(${p.sunX} ${Math.max(p.sunY, 40)})`}>
                <polygon points="0,0 -224,410 -128,410" fill="url(#sr-ray)" />
                <polygon points="0,0 -74,410 8,410" fill="url(#sr-ray)" />
                <polygon points="0,0 62,410 152,410" fill="url(#sr-ray)" />
                <polygon points="0,0 190,410 262,410" fill="url(#sr-ray)" />
              </g>
            </g>
          ) : null}

          {bubbles.map((b, i) =>
            animated ? (
              <motion.g
                key={`bb-${i}`}
                data-world-bubble
                animate={{ y: [0, -520], opacity: [0, 0.85, 0.85, 0] }}
                transition={{ duration: b.dur, repeat: Infinity, ease: "linear", delay: b.delay, times: [0, 0.12, 0.8, 1] }}
              >
                <motion.g
                  animate={{ x: [0, b.sway, 0, -b.sway, 0] }}
                  transition={{ duration: b.dur * 0.6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <circle cx={b.x} cy="462" r={b.r} fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.1" />
                  <circle cx={b.x - b.r * 0.3} cy={462 - b.r * 0.3} r={b.r * 0.28} fill="rgba(255,255,255,0.85)" />
                </motion.g>
              </motion.g>
            ) : (
              <g key={`bb-${i}`} data-world-bubble opacity={0.55}>
                <circle cx={b.x} cy={b.staticY} r={b.r} fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.1" />
                <circle cx={b.x - b.r * 0.3} cy={b.staticY - b.r * 0.3} r={b.r * 0.28} fill="rgba(255,255,255,0.8)" />
              </g>
            ),
          )}

          <g opacity={p.fogOpacity}>
            <rect x="-60" y={HORIZON - 126} width="920" height="150" fill="url(#sr-fog)" />
            <rect x="-60" y={HORIZON - 40} width="920" height="92" fill="url(#sr-fog)" opacity="0.6" />
          </g>

          <rect x="0" y="0" width={W} height={H} fill="url(#sr-vignette)" />
          <rect x="0" y="0" width={W} height={H} filter="url(#sr-grain)" opacity="0.05" style={{ mixBlendMode: "overlay" }} />

          {grid ? (
            <g data-world-grid fill="none">
              <g stroke="rgba(2,22,40,0.4)" strokeWidth="2.4">
                <line x1={W / 3} y1="0" x2={W / 3} y2={H} />
                <line x1={(2 * W) / 3} y1="0" x2={(2 * W) / 3} y2={H} />
                <line x1="0" y1={H / 3} x2={W} y2={H / 3} />
                <line x1="0" y1={(2 * H) / 3} x2={W} y2={(2 * H) / 3} />
              </g>
              <g stroke="rgba(226,250,255,0.9)" strokeWidth="1">
                <line x1={W / 3} y1="0" x2={W / 3} y2={H} />
                <line x1={(2 * W) / 3} y1="0" x2={(2 * W) / 3} y2={H} />
                <line x1="0" y1={H / 3} x2={W} y2={H / 3} />
                <line x1="0" y1={(2 * H) / 3} x2={W} y2={(2 * H) / 3} />
              </g>
              <g stroke="rgba(2,22,40,0.45)" strokeWidth="3.4">
                <circle cx={W / 2} cy={H / 2} r="16" />
                <path d="M22 46 L22 22 L46 22 M754 22 L778 22 L778 46 M22 404 L22 428 L46 428 M778 404 L778 428 L754 428" />
              </g>
              <g stroke="rgba(226,250,255,0.95)" strokeWidth="1.4">
                <circle cx={W / 2} cy={H / 2} r="16" />
                <line x1={W / 2} y1={H / 2 - 26} x2={W / 2} y2={H / 2 - 8} />
                <line x1={W / 2} y1={H / 2 + 8} x2={W / 2} y2={H / 2 + 26} />
                <line x1={W / 2 - 26} y1={H / 2} x2={W / 2 - 8} y2={H / 2} />
                <line x1={W / 2 + 8} y1={H / 2} x2={W / 2 + 26} y2={H / 2} />
                <path d="M22 46 L22 22 L46 22 M754 22 L778 22 L778 46 M22 404 L22 428 L46 428 M778 404 L778 428 L754 428" />
              </g>
            </g>
          ) : null}
        </svg>
      </div>

      <div className={styles.console} role="group" aria-label="Controles do mundo conceitual">
        <div className={styles.consoleTop}>
          <span className={styles.consoleLegend}>Cena</span>
          <div className={styles.presets}>
            {PRESETS.map((preset) => {
              const active = activePreset?.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`${styles.preset} ${active ? styles.presetOn : ""}`}
                  aria-pressed={active}
                  title={`Carregar a composição ${preset.label.toLowerCase()}`}
                  onClick={() => glide(preset.values)}
                >
                  <preset.icon size={13} /> {preset.label}
                </button>
              );
            })}
          </div>
          <div className={styles.consoleActions}>
            <MiniButton onClick={randomize} title="Sortear novos parâmetros">
              <Shuffle size={13} /> Aleatório
            </MiniButton>
            <MiniButton onClick={restore} title="Voltar aos valores iniciais">
              <RotateCcw size={13} /> Restaurar
            </MiniButton>
          </div>
        </div>

        <div className={styles.consoleGrid}>
          <Slider
            label="Hora do dia"
            value={hour}
            min={0}
            max={23.9}
            step={0.1}
            onChange={(v) => setState((c) => ({ ...c, hour: v }))}
            format={formatHour}
          />
          <Slider label="Luz do dia" value={light} onChange={(v) => setState((c) => ({ ...c, light: v }))} format={(v) => `${v}%`} />
          <Slider label="Névoa" value={fog} onChange={(v) => setState((c) => ({ ...c, fog: v }))} format={(v) => `${v}%`} />
          <Slider label="Vento" value={wind} onChange={(v) => setState((c) => ({ ...c, wind: v }))} format={(v) => `${v}%`} />
          <Slider label="Partículas" value={count} max={18} onChange={(v) => setState((c) => ({ ...c, particles: v }))} />
        </div>

        <div className={styles.toggles}>
          <Switch label="Raios de sol" on={rays} onChange={(v) => setState((c) => ({ ...c, rays: v }))} />
          <Switch label="Reflexo na água" on={reflection} onChange={(v) => setState((c) => ({ ...c, reflection: v }))} />
          <Switch label="Grade da câmera" on={grid} onChange={(v) => setState((c) => ({ ...c, grid: v }))} />
        </div>
      </div>
    </>
  );
}
