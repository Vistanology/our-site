"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { onEntryStart } from "@/lib/entry";
import { GlassEmblem } from "./brand";

export default function RouteTransition() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  // O boot cobre esta camada no primeiro carregamento, então a veil inicial nunca é vista.
  // Este contador re-monta a veil no instante em que a entrada termina: a página "nasce"
  // com a mesma transição usada para navegar entre páginas.
  const [entryNonce, setEntryNonce] = useState(0);
  useEffect(() => onEntryStart(() => setEntryNonce((n) => n + 1)), []);
  if (reduced) return null;

  return (
    <div className="route-transition" data-route-transition aria-hidden="true">
      <AnimatePresence>
        <motion.div
          key={`${pathname}:${entryNonce}`}
          className="route-transition__veil"
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 1, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.85, times: [0, 0.5, 1], ease: "easeInOut" }}
        >
          <div className="route-transition__loader">
            <span className="route-transition__orb"><GlassEmblem /></span>
            <p className="route-transition__word">Vistanology</p>
            <span className="route-transition__bar"><span className="route-transition__fill" /></span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
