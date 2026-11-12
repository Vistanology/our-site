"use client";

import { useEffect, useId, useRef } from "react";
import { motion, useMotionValue, useMotionValueEvent, useSpring, useTransform } from "framer-motion";
import { GlassEmblem } from "./brand";

const MotionPointLight = motion.create("fePointLight");
const MotionLinearGradient = motion.create("linearGradient");

export default function GlassTitle({ motionEnabled }: { motionEnabled: boolean }) {
  const id = useId().replaceAll(":", "");
  const colorMatrix = useRef<SVGFEColorMatrixElement>(null);
  const sculptureRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(350);
  const y = useMotionValue(20);
  const lightX = useSpring(x, { stiffness: 110, damping: 24 });
  const lightY = useSpring(y, { stiffness: 110, damping: 24 });
  const hue = useTransform(lightX, [0, 800], [-80, 80]);
  const gradientTransform = useTransform(hue, (value) => `translate(${value / 350}, 0)`);
  const rotation = useTransform(lightX, [0, 800], [-1.4, 1.4]);

  // Framer Motion reserves `values`, so update this SVG attribute directly.
  useMotionValueEvent(hue, "change", (value) => colorMatrix.current?.setAttribute("values", String(value)));

  useEffect(() => {
    if (!motionEnabled) {
      x.set(350);
      y.set(20);
      return;
    }
    // The carved light leans toward the pointer while it is near the title and
    // rests in its neutral position otherwise.
    const onMove = (event: PointerEvent) => {
      const sculpture = sculptureRef.current;
      if (!sculpture || event.pointerType === "touch") return;
      const rect = sculpture.getBoundingClientRect();
      const near = event.clientX >= rect.left - 140 && event.clientX <= rect.right + 140
        && event.clientY >= rect.top - 140 && event.clientY <= rect.bottom + 140;
      if (near) {
        const px = ((event.clientX - rect.left) / rect.width) * 850;
        const py = ((event.clientY - rect.top) / rect.height) * 130;
        x.set(Math.min(970, Math.max(-120, px)));
        y.set(Math.min(190, Math.max(-60, py)));
      } else {
        x.set(350);
        y.set(20);
      }
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [motionEnabled, x, y]);

  return (
    <motion.div ref={sculptureRef} className="brand-sculpture" style={{ rotateY: motionEnabled ? rotation : 0 }}>
      <span className="brand-orbit orbit-back" aria-hidden="true" />
      <div className="title-emblem"><GlassEmblem /><span className="emblem-flare" /></div>
      <h1 className="glass-wordmark" aria-label="Vistanology">
        <svg viewBox="-10 -15 850 175" aria-hidden="true" focusable="false">
          <defs>
            <MotionLinearGradient id={`${id}-spectrum`} x1="0" y1="0" x2="1" y2=".6" gradientTransform={gradientTransform}>
              <stop offset="0" stopColor="#baffff" /><stop offset=".16" stopColor="#00bddd" /><stop offset=".29" stopColor="#a0ffff" /><stop offset=".40" stopColor="#0788fb" /><stop offset=".55" stopColor="#354be2" /><stop offset=".68" stopColor="#b29cff" /><stop offset=".78" stopColor="#04c8f4" /><stop offset=".9" stopColor="#17dda1" /><stop offset="1" stopColor="#eaff6b" />
            </MotionLinearGradient>
            <linearGradient id={`${id}-bevel`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff" /><stop offset=".38" stopColor="#b4ffff" /><stop offset=".49" stopColor="#005ab9" /><stop offset=".52" stopColor="#ecffff" /><stop offset=".78" stopColor="#003393" /><stop offset="1" stopColor="#adffff" /></linearGradient>
            <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2=".12" y2="1"><stop stopColor="white" stopOpacity=".75" /><stop offset=".35" stopColor="white" stopOpacity=".03" /><stop offset=".46" stopColor="#001d8c" stopOpacity=".65" /><stop offset=".49" stopColor="white" stopOpacity=".88" /><stop offset=".55" stopColor="white" stopOpacity=".06" /><stop offset=".91" stopColor="#082679" stopOpacity=".35" /><stop offset="1" stopColor="white" stopOpacity=".8" /></linearGradient>
            <filter id={`${id}-carved`} x="-10%" y="-35%" width="130%" height="180%" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.35" result="height" />
              <feSpecularLighting in="height" surfaceScale="7" specularConstant="1.5" specularExponent="24" lightingColor="#e7ffff" result="light"><MotionPointLight x={lightX} y={lightY} z="55" /></feSpecularLighting>
              <feComposite in="light" in2="SourceAlpha" operator="in" result="clipped-light" />
              <feColorMatrix ref={colorMatrix} in="SourceGraphic" type="hueRotate" values={String(hue.get())} result="iridescent" />
              <feComposite in="iridescent" in2="clipped-light" operator="arithmetic" k1="0" k2="1" k3=".85" k4="0" />
            </filter>
          </defs>
          <g fontFamily="Segoe UI, Arial, sans-serif" fontSize="132" fontStyle="italic" fontWeight="600" letterSpacing="-5">
            <text x="3" y="125" fill="#034386" stroke="#003374" strokeWidth="3" opacity=".65">Vistanology</text>
            <text x="1" y="119" fill="#0183be" stroke="#96f8ff" strokeWidth="2">Vistanology</text>
            <text y="114" fill={`url(#${id}-spectrum)`} stroke={`url(#${id}-bevel)`} strokeWidth="2.1" paintOrder="stroke" filter={`url(#${id}-carved)`}>Vistanology</text>
            <text y="114" fill={`url(#${id}-gloss)`} opacity=".65">Vistanology</text>
          </g>
        </svg>
      </h1>
      <span className="brand-orbit orbit-front" aria-hidden="true" />
      <span className="orbit-flare" aria-hidden="true" />
    </motion.div>
  );
}
