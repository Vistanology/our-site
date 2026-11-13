"use client";

import { useId, type ReactNode } from "react";
import styles from "./showroom.module.css";

export function Slider({ label, value, min = 0, max = 100, step = 1, onChange, format }: {
  label: string; value: number; min?: number; max?: number; step?: number; onChange: (value: number) => void; format?: (value: number) => string;
}) {
  const id = useId();
  // Durante os glides (presets/aleatório) o valor é um float em movimento; sem este
  // ajuste a linha mostraria 50.86221377007314% e empurraria o rótulo para duas linhas.
  const decimals = step >= 1 ? 0 : Math.min(3, Math.round(-Math.log10(step)));
  const shown = Number(value.toFixed(decimals));
  const fill = `${Math.round(((shown - min) / (max - min)) * 100)}%`;
  return (
    <div className={styles.ctl}>
      <label className={styles.ctlLabel} htmlFor={id}>
        <span>{label}</span>
        <span className={styles.ctlValue}>{format ? format(shown) : shown}</span>
      </label>
      <input id={id} className={styles.range} type="range" min={min} max={max} step={step} value={shown} style={{ "--sr-range-fill": fill } as React.CSSProperties} onChange={(event) => onChange(Number(event.target.value))} />
    </div>
  );
}

export function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`${styles.switch} ${on ? styles.switchOn : ""}`}>
      <span className={styles.switchTrack} aria-hidden="true"><span className={styles.switchKnob} /></span>
      <span className={styles.switchText}>{label}</span>
    </button>
  );
}

export function MiniButton({ children, onClick, title }: { children: ReactNode; onClick: () => void; title?: string }) {
  return <button type="button" className={styles.miniBtn} onClick={onClick} title={title}>{children}</button>;
}