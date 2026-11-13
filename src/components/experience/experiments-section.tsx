"use client";

import type { CSSProperties } from "react";
import ExperienceCard from "./experience-card";
import ExperienceReveal from "./experience-reveal";
import styles from "./experience.module.css";

function VistanovaTeaser() {
  return (
    <div className={styles.mockDash}>
      <div className={styles.mockDashTop}>
        <span /><span /><span />
        <div className={styles.mockDashTitle} />
      </div>
      <div className={styles.mockDashBody}>
        <div className={styles.mockDashSide}>
          <div className={styles.mockDashItemActive} />
          <div className={styles.mockDashItem} />
          <div className={styles.mockDashItem} />
          <div className={styles.mockDashItem} />
        </div>
        <div className={styles.mockDashMain}>
          <div className={styles.mockKpis}>
            <div className={styles.mockKpi} style={{ "--mock-w": "72%" } as CSSProperties} />
            <div className={styles.mockKpi} style={{ "--mock-w": "48%" } as CSSProperties} />
            <div className={styles.mockKpi} style={{ "--mock-w": "88%" } as CSSProperties} />
          </div>
          <div className={styles.mockChart}>
            {[38, 62, 45, 78, 56, 90, 64].map((height, i) => (
              <span key={i} className={styles.mockBar} style={{ height: `${height}%`, animationDelay: `${-i * 0.7}s` }} />
            ))}
            <svg className={styles.mockSpark} viewBox="0 0 200 46" preserveAspectRatio="none" aria-hidden="true">
              <path className={styles.sparkLine} d="M0 38 C 22 34, 30 20, 48 24 S 78 40, 96 30 S 128 8, 148 16 S 182 34, 200 22" />
              <path className={styles.sparkGlow} d="M0 38 C 22 34, 30 20, 48 24 S 78 40, 96 30 S 128 8, 148 16 S 182 34, 200 22" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function DigitalPresenceTeaser() {
  return (
    <div className={styles.mockSite}>
      <div className={styles.mockBrowserBar}>
        <span /><span /><span />
        <div className={styles.mockAddress}>
          <span className={styles.mockAddressLock} aria-hidden="true" />
          <span className={styles.mockAddressText} />
        </div>
      </div>
      <div className={styles.mockSiteNav}>
        <i /><i /><i /><i className={styles.mockNavActive} />
      </div>
      <div className={styles.mockSiteHero}>
        <div className={styles.mockSiteMedia}>
          <span className={styles.mockSiteMediaShine} aria-hidden="true" />
        </div>
        <div className={styles.mockSiteCopy}>
          <div className={styles.mockSiteHeadline} />
          <div className={styles.mockSiteLine} />
          <div className={styles.mockSiteLineShort} />
          <span className={styles.mockSiteCta} />
        </div>
        <span className={styles.mockCursor} aria-hidden="true" />
      </div>
      <div className={styles.mockSiteCards}>
        <div className={styles.mockSiteCard}><i /><em /></div>
        <div className={styles.mockSiteCard}><i /><em /></div>
        <div className={styles.mockSiteCard}><i /><em /></div>
      </div>
      <div className={styles.mockSiteFoot}>
        <span /><span /><span />
      </div>
    </div>
  );
}

function FlowEngineTeaser() {
  return (
    <div className={styles.mockFlowWrap}>
      <svg className={styles.mockFlow} viewBox="0 0 420 200" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="exp-flow-a" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#7ff3ff" stopOpacity=".9" />
            <stop offset=".5" stopColor="#b29cff" stopOpacity=".85" />
            <stop offset="1" stopColor="#9dffcf" stopOpacity=".9" />
          </linearGradient>
          <radialGradient id="exp-flow-node" cx=".35" cy=".3" r=".9">
            <stop offset="0" stopColor="#eaffff" />
            <stop offset=".55" stopColor="#5fd8ff" />
            <stop offset="1" stopColor="#1479c2" />
          </radialGradient>
        </defs>
        <g fill="none" stroke="url(#exp-flow-a)" strokeWidth="2" className={styles.mockFlowPaths}>
          <path d="M60 60 C 130 60, 150 100, 210 100" />
          <path d="M60 140 C 130 140, 150 100, 210 100" />
          <path d="M210 100 C 280 100, 300 55, 360 55" />
          <path d="M210 100 C 280 100, 300 145, 360 145" />
        </g>
        <circle cx="60" cy="60" r="14" fill="url(#exp-flow-node)" />
        <circle cx="60" cy="140" r="14" fill="url(#exp-flow-node)" />
        <circle cx="210" cy="100" r="20" fill="url(#exp-flow-node)" />
        <circle cx="210" cy="100" r="30" fill="none" stroke="#aef4ff" strokeOpacity=".55" strokeWidth="1.5" className={styles.flowRing} />
        <rect x="334" y="35" width="52" height="40" rx="10" fill="url(#exp-flow-node)" fillOpacity=".9" />
        <rect x="334" y="125" width="52" height="40" rx="10" fill="url(#exp-flow-node)" fillOpacity=".9" />
        <circle r="4" className={`${styles.flowPulse} ${styles.flowPulseA}`} />
        <circle r="4" className={`${styles.flowPulse} ${styles.flowPulseB}`} />
        <circle r="4" className={`${styles.flowPulse} ${styles.flowPulseC}`} />
      </svg>
    </div>
  );
}

const demos = [
  {
    index: "01",
    name: "VISTANOVA",
    category: "Sistemas empresariais",
    description:
      "Uma experiência de gerenciamento que demonstra como dados, operações e inteligência podem se encontrar em uma única plataforma.",
    badge: "Prévia de interface · dados fictícios",
    Teaser: VistanovaTeaser,
  },
  {
    index: "02",
    name: "DIGITAL PRESENCE",
    category: "Experiências web",
    description:
      "Uma demonstração de como uma presença digital pode combinar identidade visual, engenharia e experiências interativas.",
    badge: "Protótipo visual · exemplo conceitual",
    Teaser: DigitalPresenceTeaser,
  },
  {
    index: "03",
    name: "FLOW ENGINE",
    category: "Automação e integração",
    description:
      "Uma visão de como processos podem ser conectados, automatizados e transformados em experiências inteligentes.",
    badge: "Representação visual · não é um produto",
    Teaser: FlowEngineTeaser,
  },
];

export default function ExperimentsSection({ motionEnabled }: { motionEnabled: boolean }) {
  return (
    <section className={styles.section} id="experimente">
      <div className={styles.sectionInner}>
        <ExperienceReveal motionEnabled={motionEnabled} className={styles.sectionHead}>
          <p className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" /> Experimente</p>
          <h2 className={styles.sectionTitle}>
            Entre e descubra <span>o que podemos construir.</span>
          </h2>
          <p className={styles.sectionText}>
            Três demonstrações estão sendo preparadas. Por enquanto, cada espaço apresenta a sua intenção — nada aqui
            finge estar pronto.
          </p>
        </ExperienceReveal>

        <div className={styles.demoList}>
          {demos.map(({ index, name, category, description, badge, Teaser }, i) => (
            <ExperienceCard
              key={name}
              index={index}
              name={name}
              category={category}
              description={description}
              badge={badge}
              motionEnabled={motionEnabled}
              delay={i * 0.06}
            >
              <Teaser />
            </ExperienceCard>
          ))}
        </div>
      </div>
    </section>
  );
}
