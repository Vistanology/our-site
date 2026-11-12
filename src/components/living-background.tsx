"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { asset } from "@/lib/asset";

const bubbles = [
  { left: "8%", top: "25%", size: 44, duration: 23 },
  { left: "18%", top: "49%", size: 58, duration: 29 },
  { left: "43%", top: "18%", size: 32, duration: 24 },
  { left: "56%", top: "26%", size: 45, duration: 26 },
  { left: "66%", top: "9%", size: 100, duration: 33 },
  { left: "75%", top: "43%", size: 31, duration: 22 },
  { left: "91%", top: "66%", size: 75, duration: 28 },
  { left: "39%", top: "76%", size: 18, duration: 25 },
];

export function Bubbles({ motionEnabled }: { motionEnabled: boolean }) {
  return <div className="bubbles" aria-hidden="true">{bubbles.map((bubble, index) => <motion.span key={bubble.left} className="soap-bubble" style={{ left: bubble.left, top: bubble.top, width: bubble.size, height: bubble.size }}
    animate={motionEnabled ? { y: [0, -85, 0], x: [0, index % 2 ? 22 : -18, 0] } : { y: 0, x: 0 }}
    transition={{ duration: bubble.duration, repeat: motionEnabled ? Infinity : 0, ease: "easeInOut" }} />)}</div>;
}

export function OceanDepth({ motionEnabled }: { motionEnabled: boolean }) {
  const { scrollYProgress } = useScroll();
  const depth = useTransform(scrollYProgress, [0, 1], [0, -65]);
  const shade = useTransform(scrollYProgress, [0, 0.5, 1], [0.4, 0.52, 0.64]);

  return <div className="ocean-depth" aria-hidden="true">
    <motion.div className="ocean-depth-scene" style={{ y: motionEnabled ? depth : 0 }}>
      <picture><source media="(max-width: 700px)" srcSet={asset("/images/underwater-world-1000.webp")} /><img src={asset("/images/underwater-world.webp")} alt="" width="1792" height="1024" loading="lazy" /></picture>
    </motion.div>
    <motion.div className="ocean-depth-shade" style={{ opacity: motionEnabled ? shade : 0.55 }} />
    <div className="ocean-depth-edge" />
  </div>;
}

export default function LivingBackground({ motionEnabled }: { motionEnabled: boolean }) {
  return <div className="living-background" aria-hidden="true">
    <picture className="world-picture"><source media="(max-width: 700px)" srcSet={asset("/images/coastal-world-1000.webp")} /><img src={asset("/images/coastal-world.webp")} alt="" width="1792" height="1024" fetchPriority="high" /></picture>
    <div className="world-tint" />
    <motion.div className="sunbeams" animate={motionEnabled ? { opacity: [0.3, 0.55, 0.3], rotate: [-3, 3, -3] } : { opacity: 0.3, rotate: 0 }} transition={{ duration: 24, repeat: motionEnabled ? Infinity : 0, ease: "easeInOut" }} />
    <motion.div className="water-caustics" transformTemplate={(_, generated) => `perspective(500px) rotateX(28deg) ${generated}`} animate={motionEnabled ? { x: ["0%", "7%", "0%"], y: ["0%", "5%", "0%"], opacity: [0.2, 0.42, 0.2] } : { opacity: 0.2 }} transition={{ duration: 20, repeat: motionEnabled ? Infinity : 0, ease: "easeInOut" }} />
    <Bubbles motionEnabled={motionEnabled} />
    <div className="world-fade" />
  </div>;
}
