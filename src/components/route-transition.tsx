"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export default function RouteTransition() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  if (reduced) return null;

  return (
    <div className="route-transition" data-route-transition aria-hidden="true">
      <AnimatePresence>
        <motion.div
          key={pathname}
          className="route-transition__veil"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </AnimatePresence>
    </div>
  );
}
