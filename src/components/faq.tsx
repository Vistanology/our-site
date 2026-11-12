"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQ = [
  { q: "Preciso ter a ideia pronta para conversar?", a: "Não. Muita coisa boa começa como uma sensação ou um problema solto. A conversa serve justamente para descobrir o que é possível construir — clareza também se constrói conversando." },
  { q: "Como o preço de um projeto é definido?", a: "Não trabalhamos com pacotes engessados. O investimento depende da complexidade, das funcionalidades, do prazo e do escopo. Tudo isso é conversado e alinhado antes de qualquer compromisso." },
  { q: "O que acontece depois que eu envio um convite?", a: "Depende do canal configurado no momento. Com recebimento online ativo, você só vê confirmação quando o serviço confirma de verdade. Sem isso, o site oferece rascunho local ou de e-mail — e avisa, com todas as letras, que nada foi enviado automaticamente." },
  { q: "Vocês hospedam e mantêm o que constroem?", a: "Combinamos isso por projeto. Esta página, por exemplo, é publicada como site estático no GitHub Pages: sem backend escondido e sem serviço persistente que não existe. Cada entrega define onde vive e quem cuida dela." },
  { q: "Posso acompanhar o desenvolvimento?", a: "Sim. Trabalhamos com conversas frequentes e entregas parciais visíveis, para você ver o projeto ganhar forma antes da versão final." },
  { q: "E se eu quiser apenas explorar possibilidades?", a: "Perfeito. Explorar também é um começo legítimo. Sem compromisso e sem pressão: quando (e se) fizer sentido, seguimos juntos." },
];

export default function Faq({ motionEnabled }: { motionEnabled: boolean }) {
  const [open, setOpen] = useState<number | null>(0);
  return <section id="duvidas" className="section faq-section shell">
    <div className="section-heading faq-heading">
      <span className="eyebrow"><HelpCircle size={14} /> CONVERSA FRANCA</span>
      <h2>Perguntas que talvez <span>você esteja fazendo.</span></h2>
      <p>Respostas diretas, sem letra miúda. Se a sua dúvida não estiver aqui, ela cabe na nossa conversa.</p>
    </div>
    <div className="faq-window glass-panel">
      <div className="window-titlebar"><span><HelpCircle size={15} /> Central de dúvidas</span><span className="window-dots" aria-hidden="true"><i /><i /><i /></span></div>
      <div className="faq-list">
        {FAQ.map((item, index) => {
          const expanded = open === index;
          return <div key={item.q} className={`faq-item${expanded ? " faq-open" : ""}`}>
            <h3>
              <button aria-expanded={expanded} aria-controls={`faq-panel-${index}`} id={`faq-button-${index}`} onClick={() => setOpen(expanded ? null : index)}>
                <span>{item.q}</span>
                <ChevronDown size={18} aria-hidden="true" />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {expanded && <motion.div
                key="panel"
                id={`faq-panel-${index}`}
                role="region"
                aria-labelledby={`faq-button-${index}`}
                className="faq-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: motionEnabled ? 0.32 : 0, ease: [0.22, 1, 0.36, 1] }}
              >
                <p>{item.a}</p>
              </motion.div>}
            </AnimatePresence>
          </div>;
        })}
      </div>
    </div>
  </section>;
}