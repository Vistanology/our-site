// Only these preferences are persisted. Playback always starts off.
export type Preferences = { volume: number; music: boolean; effects: boolean; muted: boolean };

// The soundtrack is a discreet ambient bed, so the level is held within a narrow low band.
export const VOLUME_MIN = 0.02;
export const VOLUME_MAX = 0.05;
export const clampVolume = (value: number) => Math.min(VOLUME_MAX, Math.max(VOLUME_MIN, value));

export const DEFAULTS: Preferences = { volume: 0.03, music: true, effects: true, muted: false };
const STORAGE_KEY = "vistanology:soundscape:v1";
let preferenceSnapshot: Preferences | undefined;
const preferenceListeners = new Set<() => void>();

function readPreferences(): Preferences {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!value || typeof value !== "object") return DEFAULTS;
    const saved = value as Record<string, unknown>;
    return {
      volume: typeof saved.volume === "number" && Number.isFinite(saved.volume)
        ? clampVolume(saved.volume) : DEFAULTS.volume,
      music: typeof saved.music === "boolean" ? saved.music : DEFAULTS.music,
      effects: typeof saved.effects === "boolean" ? saved.effects : DEFAULTS.effects,
      muted: typeof saved.muted === "boolean" ? saved.muted : DEFAULTS.muted,
    };
  } catch {
    return DEFAULTS;
  }
}

export function getPreferences() {
  return (preferenceSnapshot ??= readPreferences());
}

function publishPreferences(next: Preferences) {
  const previous = preferenceSnapshot;
  if (previous && (Object.keys(DEFAULTS) as (keyof Preferences)[])
    .every((key) => previous[key] === next[key])) return;
  preferenceSnapshot = next;
  preferenceListeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent) {
  if (event.key === STORAGE_KEY || event.key === null) publishPreferences(readPreferences());
}

export function subscribePreferences(listener: () => void) {
  preferenceListeners.add(listener);
  if (preferenceListeners.size === 1) {
    window.addEventListener("storage", onStorage);
    publishPreferences(readPreferences());
  }
  return () => {
    preferenceListeners.delete(listener);
    if (!preferenceListeners.size) window.removeEventListener("storage", onStorage);
  };
}

export function updatePreferences(patch: Partial<Preferences>) {
  const next = { ...getPreferences(), ...patch };
  next.volume = clampVolume(next.volume);
  publishPreferences(next);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private browsing/storage policies must not prevent in-session controls.
  }
}

export const getServerPreferences = () => DEFAULTS;