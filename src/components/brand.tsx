import { useId } from "react";

export function GlassEmblem({ className = "" }: { className?: string }) {
  const id = useId().replaceAll(":", "");
  return <svg className={`glass-emblem ${className}`} viewBox="0 0 112 112" fill="none" aria-hidden="true">
    <defs>
      {[["#fffcb4", "#ff5e2f", "#b41686"], ["#d8ff93", "#7beb00", "#03a269"], ["#bdfbff", "#038aff", "#444bdb"], ["#ffffbf", "#ffe600", "#ff961a"]].map((colors, index) => <linearGradient key={index} id={`${id}-pane-${index}`} x1="0" y1="0" x2="1" y2="1">{colors.map((color, i) => <stop key={color} offset={`${i * 50}%`} stopColor={color} />)}</linearGradient>)}
      <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0.4" y2="1"><stop stopColor="white" stopOpacity=".95" /><stop offset=".45" stopColor="white" stopOpacity=".08" /><stop offset=".55" stopColor="white" stopOpacity="0" /><stop offset="1" stopColor="white" stopOpacity=".7" /></linearGradient>
      <filter id={`${id}-depth`} x="-30%" y="-30%" width="170%" height="170%"><feDropShadow dx="1" dy="4" stdDeviation="2" floodColor="#003277" floodOpacity=".6" /></filter>
    </defs>
    <g filter={`url(#${id}-depth)`} transform="rotate(8 56 56)">
      {["M17 12Q34 5 55 13L49 50Q29 43 11 51Z", "M61 15Q81 23 102 13L96 51Q74 60 55 52Z", "M10 57Q28 49 48 57L42 96Q23 87 4 97Z", "M54 59Q73 67 95 57L89 96Q68 107 47 98Z"].map((d, i) => <g key={d}><path d={d} fill={`url(#${id}-pane-${i})`} stroke="#e7ffff" strokeWidth="1.4" /><path d={d} fill={`url(#${id}-shine)`} stroke="white" strokeOpacity=".5" strokeWidth=".7" transform="translate(2 -2) scale(.97)" /></g>)}
    </g>
  </svg>;
}

export default function Brand({ compact = false }: { compact?: boolean }) {
  return <span className="brand"><GlassEmblem /><span>Vistanology{!compact && <span className="brand-caption">um futuro mais bonito</span>}</span></span>;
}
