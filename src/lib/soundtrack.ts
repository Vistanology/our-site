import { asset } from "./asset";
import { getPreferences, type Preferences } from "./sound-preferences";

export type SoundtrackState = "idle" | "playing" | "paused" | "blocked";
export type SoundtrackSnapshot = { state: SoundtrackState; unavailable: boolean };

const SERVER_SNAPSHOT: SoundtrackSnapshot = { state: "idle", unavailable: false };
let element: HTMLAudioElement | null = null;
let snapshot: SoundtrackSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

let ramping = false;
let rampFrame: number | null = null;

function cancelRamp() {
  if (rampFrame !== null) cancelAnimationFrame(rampFrame);
  rampFrame = null;
  ramping = false;
}

/** Eases the track volume from its current value toward the target so the entry sound rises gently. */
function rampVolumeTo(target: number, seconds: number) {
  if (!element) return;
  ramping = true;
  const from = element.volume;
  const start = performance.now();
  const tick = (now: number) => {
    if (!element) { cancelRamp(); return; }
    const progress = Math.min(1, (now - start) / (seconds * 1000));
    const eased = 1 - (1 - progress) * (1 - progress);
    element.volume = from + (target - from) * eased;
    if (progress < 1) rampFrame = requestAnimationFrame(tick);
    else cancelRamp();
  };
  rampFrame = requestAnimationFrame(tick);
}

function emit(next: SoundtrackSnapshot) {
  if (next.state === snapshot.state && next.unavailable === snapshot.unavailable) return;
  snapshot = next;
  listeners.forEach((listener) => listener());
}

export function applySoundtrackPreferences(preferences: Preferences) {
  if (!element) return;
  element.muted = preferences.muted;
  // While the entry ramp owns the level, do not snap it back to the stored value.
  if (!ramping) element.volume = preferences.volume;
}

function ensureElement() {
  if (element) return element;
  const audio = new Audio();
  audio.src = asset("/audio/sunlight-underwater.m4a");
  audio.loop = true;
  audio.preload = "auto";
  audio.hidden = true;
  audio.setAttribute("data-soundtrack", "");
  audio.addEventListener("play", () => emit({ state: "playing", unavailable: false }));
  audio.addEventListener("pause", () => {
    if (snapshot.state === "playing") emit({ ...snapshot, state: "paused" });
  });
  audio.addEventListener("error", () => emit({ state: "blocked", unavailable: true }));
  document.body.appendChild(audio);
  element = audio;
  applySoundtrackPreferences(getPreferences());
  return audio;
}

/** Must be reached from a user gesture; a rejected play() surfaces as "blocked", never as fake playback. */
export function startSoundtrack(options?: { rampSeconds?: number; from?: number }) {
  const audio = ensureElement();
  if (snapshot.unavailable) return;
  if (options?.rampSeconds) {
    cancelRamp();
    ramping = true;
    audio.volume = options.from ?? 0.04;
  }
  void audio.play()
    .then(() => {
      emit({ state: "playing", unavailable: false });
      if (options?.rampSeconds) rampVolumeTo(getPreferences().volume, options.rampSeconds);
    })
    .catch(() => {
      cancelRamp();
      if (snapshot.unavailable) return;
      emit({ state: "blocked", unavailable: false });
    });
}

export function pauseSoundtrack() {
  cancelRamp();
  if (element && !element.paused) element.pause();
}

export function subscribeSoundtrack(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getSoundtrackSnapshot() {
  return snapshot;
}

export const getServerSoundtrackSnapshot = () => SERVER_SNAPSHOT;