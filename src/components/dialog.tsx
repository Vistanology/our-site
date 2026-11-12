"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function GlassDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    if (!dialog?.open) dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <motion.dialog ref={ref} aria-label={title} className="glass-dialog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <motion.div className="dialog-window glass-panel" initial={{ y: 24, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 15, scale: 0.98 }} transition={{ type: "spring", stiffness: 280, damping: 27 }}>
      <div className="window-titlebar"><span>{title}</span><button className="window-close" aria-label="Fechar janela" onClick={onClose}><X size={18} /></button></div>
      <div className="dialog-body">{children}</div>
    </motion.div>
  </motion.dialog>;
}
