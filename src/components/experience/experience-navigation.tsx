"use client";

import { useEffect, useState } from "react";
import styles from "./experience.module.css";

const destinations = [
  { number: "01", label: "Explore", href: "#explore" },
  { number: "02", label: "Experimente", href: "#experimente" },
  { number: "03", label: "Descubra", href: "#descubra" },
  { number: "04", label: "Construa", href: "#construa" },
];

export default function ExperienceNavigation() {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    destinations.forEach(({ href }) => {
      const el = document.querySelector(href);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <nav className={styles.expNav} aria-label="Seções do Experience">
      <div className={styles.expNavTrack}>
        {destinations.map(({ number, label, href }) => (
          <a
            key={href}
            href={href}
            className={styles.expNavLink}
            aria-current={active === href ? "location" : undefined}
          >
            <span className={styles.expNavDot} aria-hidden="true" />
            <span className={styles.expNavNumber}>{number}</span> {label}
          </a>
        ))}
      </div>
    </nav>
  );
}
