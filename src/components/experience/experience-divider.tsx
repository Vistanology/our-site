"use client";

import styles from "./experience.module.css";

// Divisor decorativo entre seções; puramente visual, por isso fica fora da árvore de acessibilidade.
export default function ExperienceDivider() {
  return (
    <div className={styles.divider} aria-hidden="true">
      <span className={styles.dividerLine} />
      <span className={styles.dividerGem} />
    </div>
  );
}
