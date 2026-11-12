import { updatePreferences } from "./sound-preferences";
import { startSoundtrack } from "./soundtrack";

export type EntryChoice = "sound" | "muted";
export const ENTRY_KEY = "vistanology:entry:v1";

let snapshot: boolean | undefined;
const listeners = new Set<() => void>();

function readShowBoot(): boolean {
  try {
    const stored = window.sessionStorage.getItem(ENTRY_KEY);
    return stored !== "sound" && stored !== "muted";
  } catch {
    return true;
  }
}

export function getShowBoot() {
  return (snapshot ??= readShowBoot());
}

export const getServerShowBoot = () => false;

export function subscribeEntry(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function completeEntry(choice: EntryChoice) {
  try { window.sessionStorage.setItem(ENTRY_KEY, choice); } catch { /* The choice still applies for this visit. */ }
  snapshot = false;
  listeners.forEach((listener) => listener());
  updatePreferences({ muted: choice === "muted" });
  if (choice === "sound") startSoundtrack({ rampSeconds: 3, from: 0.04 });
}

/** A remembered "sound" choice may still be blocked by the browser on reload; the player shows an honest invite then. */
export function resumeRememberedSoundtrack() {
  try {
    if (window.sessionStorage.getItem(ENTRY_KEY) === "sound") startSoundtrack({ rampSeconds: 3, from: 0.04 });
  } catch { /* Nothing to resume without storage. */ }
}