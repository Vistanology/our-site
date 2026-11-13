import { updatePreferences } from "./sound-preferences";
import { startSoundtrack } from "./soundtrack";

export type EntryChoice = "sound" | "muted";
export const ENTRY_KEY = "vistanology:entry:v1";
/** Flag usada apenas pelo setup de testes para abrir a página direto, sem a intro. */
export const SKIP_KEY = "vistanology:skip-boot:v1";

// O boot toca a cada recarga completa (F5): este sinal é por documento e reinicia
// quando o bundle recarrega. Dentro da mesma visita, navegação entre páginas não
// reabre a intro.
let bootedThisDocument = false;
const listeners = new Set<() => void>();
const startListeners = new Set<() => void>();

function readShowBoot(): boolean {
  try {
    if (window.sessionStorage.getItem(SKIP_KEY)) return false;
  } catch {
    /* Storage unavailable: fall back to showing the boot. */
  }
  return !bootedThisDocument;
}

export function getShowBoot() {
  return readShowBoot();
}

export const getServerShowBoot = () => false;

export function subscribeEntry(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Aviso de "página iniciada": disparado no instante em que o boot fecha, para a veil de transição tocar a entrada. */
export function onEntryStart(listener: () => void) {
  startListeners.add(listener);
  return () => { startListeners.delete(listener); };
}

export function completeEntry(choice: EntryChoice) {
  try { window.sessionStorage.setItem(ENTRY_KEY, choice); } catch { /* The choice still applies for this visit. */ }
  bootedThisDocument = true;
  listeners.forEach((listener) => listener());
  startListeners.forEach((listener) => listener());
  updatePreferences({ muted: choice === "muted" });
  if (choice === "sound") startSoundtrack({ rampSeconds: 3, from: 0.04 });
}
