"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Droplets, Music2, Pause, Play, Square, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  DEFAULTS,
  getPreferences,
  getServerPreferences,
  subscribePreferences,
  updatePreferences,
  type Preferences,
} from "@/lib/sound-preferences";
import {
  applySoundtrackPreferences,
  getServerSoundtrackSnapshot,
  getSoundtrackSnapshot,
  pauseSoundtrack,
  startSoundtrack,
  subscribeSoundtrack,
} from "@/lib/soundtrack";

/** A quiet, original D6/9 sound field; no recordings, songs or network requests. */
class Soundscape {
  readonly context: AudioContext;
  private nodes = new Set<AudioNode>();
  private sources = new Set<AudioScheduledSourceNode>();
  private interval: ReturnType<typeof setInterval> | null = null;
  private master: GainNode;
  private music: GainNode;
  private effects: GainNode;
  private preferences = DEFAULTS;
  private nextBell = 0;
  private nextBubble = 0;
  private noteIndex = 0;
  private disposed = false;
  playing = false;

  constructor(context: AudioContext) {
    this.context = context;
    // All construction is reached only from the explicit play handler.
    try {
      this.master = this.track(context.createGain());
      this.music = this.track(context.createGain());
      this.effects = this.track(context.createGain());
      this.master.gain.value = 0;
      this.music.connect(this.master);
      this.effects.connect(this.master);
      this.master.connect(context.destination);
      this.makePads();
      this.makeNature();
    } catch (error) {
      this.dispose();
      throw error;
    }
  }

  private track<T extends AudioNode>(node: T): T {
    this.nodes.add(node);
    return node;
  }

  private source<T extends AudioScheduledSourceNode>(node: T): T {
    this.sources.add(node);
    return this.track(node);
  }

  private lfo(parameter: AudioParam, frequency: number, depth: number) {
    const oscillator = this.source(this.context.createOscillator());
    const gain = this.track(this.context.createGain());
    oscillator.frequency.value = frequency;
    gain.gain.value = depth;
    oscillator.connect(gain).connect(parameter);
    oscillator.start();
  }

  private makePads() {
    [146.8324, 220, 329.6276, 369.9944, 493.8833].forEach((frequency, index) => {
      const oscillator = this.source(this.context.createOscillator());
      const gain = this.track(this.context.createGain());
      const pan = this.track(this.context.createStereoPanner());
      oscillator.type = index < 2 ? "triangle" : "sine";
      oscillator.frequency.value = frequency;
      gain.gain.value = index < 2 ? 0.023 : 0.016;
      pan.pan.value = (index - 2) * 0.2;
      oscillator.connect(gain).connect(pan).connect(this.music);
      this.lfo(gain.gain, 0.035 + index * 0.007, 0.003);
      this.lfo(oscillator.detune, 0.021 + index * 0.003, 1.4);
      oscillator.start();
    });
  }

  private makeNature() {
    const buffer = this.context.createBuffer(1, this.context.sampleRate * 8, this.context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
    const noise = this.source(this.context.createBufferSource());
    noise.buffer = buffer;
    noise.loop = true;
    // Filtering a continuous white-noise loop softens its wrap without a periodic fade/dip.
    [360, 1050].forEach((cutoff, index) => {
      const highpass = this.track(this.context.createBiquadFilter());
      const lowpass = this.track(this.context.createBiquadFilter());
      const gain = this.track(this.context.createGain());
      const pan = this.track(this.context.createStereoPanner());
      highpass.type = "highpass";
      highpass.frequency.value = index ? 170 : 65;
      highpass.Q.value = 0.5;
      lowpass.type = "lowpass";
      lowpass.frequency.value = cutoff;
      lowpass.Q.value = 0.5;
      gain.gain.value = index ? 0.032 : 0.045;
      pan.pan.value = index ? 0.45 : -0.45;
      noise.connect(highpass).connect(lowpass).connect(gain).connect(pan).connect(this.effects);
      this.lfo(gain.gain, index ? 0.047 : 0.029, 0.005);
      this.lfo(lowpass.frequency, index ? 0.019 : 0.013, cutoff * 0.12);
    });
    noise.start();
  }

  private tone(frequency: number, peak: number, duration: number, bubble = false) {
    const now = this.context.currentTime;
    const oscillator = this.source(this.context.createOscillator());
    const envelope = this.track(this.context.createGain());
    const pan = this.track(this.context.createStereoPanner());
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    if (bubble) oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.35, now + duration);
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(peak, now + (bubble ? 0.035 : 0.12));
    envelope.gain.exponentialRampToValueAtTime(0.00001, now + duration);
    pan.pan.value = Math.sin(this.noteIndex * 1.7) * 0.35;
    oscillator.connect(envelope).connect(pan).connect(bubble ? this.effects : this.music);
    oscillator.onended = () => {
      oscillator.onended = null;
      this.sources.delete(oscillator);
      [oscillator, envelope, pan].forEach((node) => {
        node.disconnect();
        this.nodes.delete(node);
      });
    };
    oscillator.start(now);
    oscillator.stop(now + duration + 0.05);
  }

  private schedule = () => {
    if (!this.playing || this.context.state !== "running") return;
    const now = this.context.currentTime;
    const audible = !this.preferences.muted && this.preferences.volume > 0;
    if (now >= this.nextBell) {
      // Uneven, spacious pentatonic notes, not a quoted melody or rhythmic loop.
      const pitches = [587.3295, 659.2551, 739.9888, 880, 987.7666];
      const order = [0, 3, 1, 4, 2, 1, 3, 0, 4, 2];
      const frequency = pitches[order[this.noteIndex % order.length]];
      if (audible && this.preferences.music) {
        this.tone(frequency, 0.021, 4.8);
        this.tone(frequency * 2, 0.0025, 2.6);
      }
      this.nextBell = now + [7.2, 9.4, 8.1, 11.3, 8.8][this.noteIndex % 5];
      this.noteIndex++;
    }
    if (now >= this.nextBubble) {
      if (audible && this.preferences.effects) this.tone(310, 0.006, 0.3, true);
      this.nextBubble = now + 13 + Math.random() * 7;
    }
  };

  setPreferences(preferences: Preferences) {
    this.preferences = preferences;
    if (this.disposed || this.context.state === "closed") return;
    const now = this.context.currentTime;
    // Source gains are deliberately tiny; this master scales the whole field into an audible
    // range while leaving headroom, so even volume 100% stays well under clipping.
    this.master.gain.setTargetAtTime(this.playing && !preferences.muted ? preferences.volume * 4 : 0, now, 0.18);
    this.music.gain.setTargetAtTime(preferences.music ? 1 : 0, now, 0.3);
    this.effects.gain.setTargetAtTime(preferences.effects ? 1 : 0, now, 0.3);
  }

  start(preferences: Preferences) {
    if (this.disposed || this.context.state !== "running") throw new Error("Audio is not running");
    this.playing = true;
    this.setPreferences(preferences);
    this.nextBell = this.context.currentTime + 4;
    this.nextBubble = this.context.currentTime + 10;
    if (this.interval === null) this.interval = setInterval(this.schedule, 750);
  }

  private halt() {
    this.playing = false;
    if (this.interval !== null) clearInterval(this.interval);
    this.interval = null;
    if (!this.disposed && this.master) {
      this.master.gain.cancelScheduledValues(this.context.currentTime);
      this.master.gain.setValueAtTime(0, this.context.currentTime);
    }
  }

  async pause() {
    this.halt();
    if (!this.disposed && this.context.state !== "closed") await this.context.suspend();
  }

  dispose() {
    if (this.disposed) return;
    this.halt();
    this.disposed = true;
    this.context.onstatechange = null;
    this.sources.forEach((source) => {
      source.onended = null;
      try { source.stop(); } catch { /* An already-ended source needs only disconnection. */ }
    });
    this.nodes.forEach((node) => node.disconnect());
    this.sources.clear();
    this.nodes.clear();
    if (this.context.state !== "closed") void this.context.close().catch(() => {});
  }
}

type Playback = "stopped" | "starting" | "playing" | "paused";
type PauseReason = "manual" | "hidden" | "interrupted";
const focusClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-900";

function ActivityBars({ active, motionEnabled }: { active: boolean; motionEnabled: boolean }) {
  const animate = active && motionEnabled;
  return (
    <span aria-hidden="true" className="flex h-4 w-5 shrink-0 items-end gap-[2px]">
      {[0, 1, 2, 3].map((bar) => (
        <motion.span
          key={bar}
          className="h-full w-[3px] origin-bottom rounded-full bg-cyan-200"
          initial={false}
          animate={{ scaleY: animate ? [0.25, 0.65 + bar * 0.1, 0.4, 0.25] : active ? 0.65 : 0.2, opacity: active ? 1 : 0.45 }}
          transition={animate ? { duration: 2.5 + bar * 0.4, repeat: Infinity, delay: bar * 0.18, ease: "easeInOut" } : { duration: 0 }}
        />
      ))}
    </span>
  );
}

export default function SoundscapeMenu({ motionEnabled }: { motionEnabled: boolean }) {
  // A stable server snapshot avoids hydration differences and effect-driven state hydration.
  const preferences = useSyncExternalStore(subscribePreferences, getPreferences, getServerPreferences);
  const soundtrack = useSyncExternalStore(subscribeSoundtrack, getSoundtrackSnapshot, getServerSoundtrackSnapshot);
  const [open, setOpen] = useState(false);
  const [playback, setPlayback] = useState<Playback>("stopped");
  const [pauseReason, setPauseReason] = useState<PauseReason>("manual");
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<Soundscape | null>(null);
  const mountedRef = useRef(false);
  const intentRef = useRef(false);
  const operationRef = useRef<symbol | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const panelId = `${id}-panel`;
  const volumeId = `${id}-volume`;

  const fail = useCallback((message: string, engine: Soundscape | null) => {
    intentRef.current = false;
    operationRef.current = null;
    if (engineRef.current === engine) engineRef.current = null;
    engine?.dispose();
    if (mountedRef.current) {
      setPlayback("stopped");
      setError(message);
    }
  }, []);

  const pause = useCallback((reason: PauseReason) => {
    intentRef.current = false;
    const operation = Symbol();
    operationRef.current = operation;
    const engine = engineRef.current;
    setPlayback("paused");
    setPauseReason(reason);
    void engine?.pause().catch(() => {
      if (mountedRef.current && operationRef.current === operation) {
        fail("Não foi possível pausar o áudio. A paisagem sonora foi encerrada.", engine);
      }
    });
  }, [fail]);

  useEffect(() => {
    mountedRef.current = true;
    const onVisibility = () => {
      if (!document.hidden) return;
      pauseSoundtrack();
      if (!intentRef.current) return;
      intentRef.current = false;
      const operation = Symbol();
      operationRef.current = operation;
      const engine = engineRef.current;
      setPlayback("paused");
      setPauseReason("hidden");
      void engine?.pause().catch(() => {
        if (!mountedRef.current || operationRef.current !== operation) return;
        engineRef.current = null;
        engine?.dispose();
        setPlayback("stopped");
        setError("O áudio foi encerrado. Toque em reproduzir para tentar novamente.");
      });
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      mountedRef.current = false;
      intentRef.current = false;
      operationRef.current = null;
      document.removeEventListener("visibilitychange", onVisibility);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setPreferences(preferences);
    applySoundtrackPreferences(preferences);
  }, [preferences]);

  // Only one sound source plays at a time: starting the soundtrack yields the synth.
  useEffect(() => {
    if (soundtrack.state === "playing" && intentRef.current) pause("manual");
  }, [soundtrack.state, pause]);

  async function togglePlayback() {
    if (playback === "playing") return pause("manual");
    if (playback === "starting" || document.hidden) return;
    const operation = Symbol();
    operationRef.current = operation;
    intentRef.current = true;
    setError(null);
    setPlayback("starting");
    let engine = engineRef.current;
    try {
      if (!engine || engine.context.state === "closed") {
        engine?.dispose();
        const AudioContextClass = window.AudioContext ?? (window as Window & {
          webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;
        if (!AudioContextClass) {
          fail("Seu navegador não oferece síntese de áudio. Experimente um navegador atualizado.", engine);
          return;
        }
        engine = new Soundscape(new AudioContextClass());
        engineRef.current = engine;
        const current = engine;
        current.context.onstatechange = () => {
          if (!mountedRef.current || engineRef.current !== current) return;
          if (current.context.state !== "running" && current.playing) {
            // Native interruptions must never leave an animated, falsely playing UI.
            pause("interrupted");
          } else if (current.context.state === "running" && !intentRef.current) {
            // Some browsers resume contexts on focus. Do not turn sound back on for them.
            void current.pause().catch(() => {
              if (engineRef.current === current && !intentRef.current) {
                fail("O áudio foi encerrado. Toque em reproduzir para tentar novamente.", current);
              }
            });
          }
        };
      }
      // This is the only resume call: still directly within an explicit click gesture.
      await engine.context.resume();
      if (!mountedRef.current || operationRef.current !== operation || engineRef.current !== engine) return;
      if (document.hidden || !intentRef.current) {
        pause("hidden");
        return;
      }
      engine.start(getPreferences());
      pauseSoundtrack();
      setPlayback("playing");
    } catch {
      if (mountedRef.current && operationRef.current === operation) {
        fail("Não foi possível iniciar o áudio. Verifique a permissão de som do navegador e tente novamente.", engine);
      }
    }
  }

  function stop() {
    intentRef.current = false;
    operationRef.current = null;
    const engine = engineRef.current;
    engineRef.current = null;
    engine?.dispose();
    setPlayback("stopped");
    setError(null);
  }

  function toggleSoundtrack() {
    if (soundtrack.state === "playing") pauseSoundtrack();
    else startSoundtrack();
  }

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Viewport-fixed anchoring measured from the trigger. Left-edge anchoring is used because
  // right offsets resolved against a stale containing block in some engines and pushed the
  // panel off the left edge; the 340px max width keeps the clamp exact.
  const [panelAnchor, setPanelAnchor] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const panelWidth = Math.min(340, window.innerWidth - 60);
      const left = Math.max(12, Math.min(window.innerWidth - panelWidth - 12, rect.right - panelWidth));
      setPanelAnchor({ left, top: rect.bottom + 14 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  const playing = playback === "playing";
  const audible = playing && !preferences.muted && preferences.volume > 0;
  const hasLayers = preferences.music || preferences.effects;
  const status = playback === "paused"
    ? pauseReason === "hidden" ? "Pausado ao sair da aba. Toque para retomar."
      : pauseReason === "interrupted" ? "Áudio interrompido. Toque para retomar." : "Pausado. Retome quando quiser."
    : playback === "stopped" ? "Som desligado. Toque para ouvir."
      : playback === "starting" ? "Preparando sua paisagem sonora…"
        : !hasLayers ? "Reprodução ativa, com as duas camadas desligadas."
          : preferences.muted ? "Reprodução ativa, com o som silenciado."
            : preferences.volume === 0 ? "Reprodução ativa, com o volume em zero." : "Um fluxo suave, sem pressa.";
  const volumePercent = Math.round(preferences.volume * 100);

  const soundtrackPlaying = soundtrack.state === "playing";
  const soundtrackStatus = soundtrack.unavailable
    ? "A faixa não pôde ser carregada neste navegador."
    : soundtrack.state === "blocked"
      ? "O navegador bloqueou o início automático. Toque em reproduzir para ouvir."
      : soundtrackPlaying
        ? preferences.muted ? "Tocando em loop, com o som silenciado."
          : preferences.volume === 0 ? "Tocando em loop, com o volume em zero." : "Tocando em loop, baixinho."
        : soundtrack.state === "paused" ? "Pausada. Toque para retomar."
          : "Começa no seu clique de entrada — ou aqui.";
  const soundtrackLabel = soundtrackPlaying ? "Pausar Sunlight Underwater" : "Reproduzir Sunlight Underwater";

  return (
    <div ref={wrapRef} className="sound-menu">
      <button
        ref={triggerRef}
        type="button"
        className="icon-button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Fechar controles de som" : "Abrir controles de som"}
      >
        {preferences.muted ? <VolumeX size={19} /> : audible || soundtrackPlaying ? <Volume2 size={19} /> : <Music2 size={19} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.section
            id={panelId}
            aria-label="Paisagem sonora VISTANOLOGY"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="sound-popover"
            style={panelAnchor ? { left: panelAnchor.left, top: panelAnchor.top } : { visibility: "hidden" }}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-[9px] font-semibold tracking-[0.22em] text-cyan-100">VISTANOLOGY</p>
                <h2 className="mt-1 text-base font-medium">Um respiro azul</h2>
              </div>
              <button type="button" onClick={close} aria-label="Fechar controles de áudio" className={`grid size-11 shrink-0 place-items-center rounded-full hover:bg-white/10 ${focusClass}`}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-blue-100">A trilha de fundo e uma síntese original de água e acordes. Escolha o que acompanha você.</p>

            <div className="mb-4 rounded-2xl border border-cyan-100/25 bg-white/[0.06] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium">Sunlight Underwater</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-blue-100">Trilha de fundo · faixa fornecida para a experiência</p>
                </div>
                <button
                  type="button"
                  onClick={toggleSoundtrack}
                  disabled={soundtrack.unavailable}
                  aria-label={soundtrackLabel}
                  className={`grid size-10 shrink-0 place-items-center rounded-full border border-cyan-100/60 bg-gradient-to-b from-white/30 to-cyan-300/10 hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40 ${focusClass}`}
                >
                  {soundtrackPlaying ? <Pause size={16} fill="currentColor" aria-hidden="true" /> : <Play size={16} fill="currentColor" className="ml-0.5" aria-hidden="true" />}
                </button>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-cyan-100">{soundtrackStatus}</p>
            </div>

            <div className="mb-4 rounded-2xl border border-cyan-100/25 bg-white/[0.06] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium">Águas de amanhã</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-blue-100">Síntese original de água e acordes, gerada no navegador</p>
                </div>
                <button
                  type="button"
                  onClick={() => void togglePlayback()}
                  disabled={playback === "starting"}
                  aria-busy={playback === "starting"}
                  aria-label={playing ? "Pausar Águas de amanhã" : playback === "paused" ? "Retomar Águas de amanhã" : "Reproduzir Águas de amanhã"}
                  className={`grid size-10 shrink-0 place-items-center rounded-full border border-cyan-100/60 bg-gradient-to-b from-white/30 to-cyan-300/10 hover:bg-white/25 disabled:cursor-wait disabled:opacity-60 ${focusClass}`}
                >
                  {playing ? <Pause size={16} fill="currentColor" aria-hidden="true" /> : <Play size={16} fill="currentColor" className="ml-0.5" aria-hidden="true" />}
                </button>
              </div>
              <p role="status" className="mt-2 text-[10px] leading-relaxed text-cyan-100">{status}</p>
            </div>

            <div className="mb-4 rounded-2xl border border-cyan-100/25 bg-white/[0.06] p-3">
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <label htmlFor={volumeId} className="font-medium">Volume</label>
                <output htmlFor={volumeId} className="tabular-nums text-cyan-100">{volumePercent}%</output>
              </div>
              <input
                id={volumeId}
                type="range"
                min={2}
                max={5}
                step={1}
                value={volumePercent}
                aria-valuetext={`${volumePercent} por cento${preferences.muted ? ", som silenciado" : ""}`}
                onChange={(event) => updatePreferences({ volume: Number(event.target.value) / 100 })}
                className={`h-9 w-full cursor-pointer rounded-lg accent-cyan-200 ${focusClass}`}
              />
              <p className="text-[10px] leading-relaxed text-blue-100">Volume travado entre 2% e 5% — um fundo discreto. Use o botão para silenciar.</p>
            </div>

            <div className="space-y-2">
              {([
                { key: "music", label: "Camada musical", detail: "Acordes e sinos suaves", Icon: Music2 },
                { key: "effects", label: "Sons da natureza", detail: "Água, vento e pequenas bolhas", Icon: Droplets },
              ] as const).map(({ key, label, detail, Icon }) => (
                <button
                  key={key}
                  type="button"
                  role="switch"
                  aria-checked={preferences[key]}
                  aria-label={label}
                  onClick={() => updatePreferences({ [key]: !preferences[key] })}
                  className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border border-cyan-100/20 bg-white/[0.05] px-3 py-2 text-left hover:bg-white/10 ${focusClass}`}
                >
                  <Icon size={19} className="shrink-0 text-cyan-100" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium">{label}</span>
                    <span className="mt-0.5 block text-[10px] leading-relaxed text-blue-100">{detail}</span>
                  </span>
                  <ActivityBars active={audible && preferences[key]} motionEnabled={motionEnabled} />
                  <span aria-hidden="true" className={`flex h-6 w-10 shrink-0 items-center rounded-full border p-[3px] ${preferences[key] ? "border-cyan-100/60 bg-cyan-200/30" : "border-white/30 bg-blue-950/25"}`}>
                    <motion.span initial={false} animate={{ x: preferences[key] ? 16 : 0 }} transition={{ duration: motionEnabled ? 0.16 : 0 }} className="size-4 rounded-full bg-white shadow-sm" />
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" aria-label="Silenciar áudio" aria-pressed={preferences.muted} onClick={() => updatePreferences({ muted: !preferences.muted })} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cyan-100/30 bg-white/10 text-xs hover:bg-white/15 ${focusClass}`}>
                {preferences.muted ? <VolumeX size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
                {preferences.muted ? "Silenciado" : "Silenciar"}
              </button>
              <button type="button" onClick={stop} disabled={playback === "stopped"} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cyan-100/30 bg-white/10 text-xs hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 ${focusClass}`}>
                <Square size={13} aria-hidden="true" /> Parar
              </button>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-blue-100">A trilha de fundo inicia no seu clique de entrada. Ao sair da aba, todo o som pausa até você retomar.</p>
            {error && <p role="alert" className="mt-3 rounded-xl border border-white/20 bg-blue-950/20 px-3 py-2 text-xs leading-relaxed text-white">{error}</p>}
          </motion.section>
        )}
      </AnimatePresence>
      {!open && error && <p role="alert" className="sr-only">{error}</p>}
    </div>
  );
}
