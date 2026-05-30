"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type BrowserWindowWithAudioContext = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

type MetronomeSettings = {
  bpm: number;
  beatsPerMeasure: number;
  accentFirstBeat: boolean;
};

type MetronomeContextValue = MetronomeSettings & {
  isPlaying: boolean;
  currentBeat: number;
  setBpm: (bpm: number) => void;
  setBeatsPerMeasure: (beatsPerMeasure: number) => void;
  setAccentFirstBeat: (accentFirstBeat: boolean) => void;
  start: () => void;
  stop: () => void;
  toggle: () => void;
};

const STORAGE_KEY = "notelyric:v2:metronome";
const DEFAULT_SETTINGS: MetronomeSettings = {
  bpm: 96,
  beatsPerMeasure: 4,
  accentFirstBeat: true
};

const MIN_BPM = 30;
const MAX_BPM = 240;
const SCHEDULE_AHEAD_SECONDS = 0.1;
const LOOKAHEAD_MS = 25;

const MetronomeContext = createContext<MetronomeContextValue | undefined>(undefined);

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const normalizeSettings = (settings: Partial<MetronomeSettings>): MetronomeSettings => ({
  bpm: clamp(Number.isFinite(settings.bpm) ? Math.round(settings.bpm ?? DEFAULT_SETTINGS.bpm) : DEFAULT_SETTINGS.bpm, MIN_BPM, MAX_BPM),
  beatsPerMeasure: clamp(
    Number.isFinite(settings.beatsPerMeasure) ? Math.round(settings.beatsPerMeasure ?? DEFAULT_SETTINGS.beatsPerMeasure) : DEFAULT_SETTINGS.beatsPerMeasure,
    1,
    12
  ),
  accentFirstBeat: typeof settings.accentFirstBeat === "boolean" ? settings.accentFirstBeat : DEFAULT_SETTINGS.accentFirstBeat
});

const readStoredSettings = (): MetronomeSettings => {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<MetronomeSettings>;
    return normalizeSettings(parsed);
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const click = (audioContext: AudioContext, time: number, accented: boolean): void => {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.frequency.value = accented ? 1320 : 880;
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(accented ? 0.45 : 0.28, time + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.055);

  oscillator.start(time);
  oscillator.stop(time + 0.06);
};

export function MetronomeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<MetronomeSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(1);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
  const nextBeatRef = useRef(1);
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    setSettings(readStoredSettings());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [hydrated, settings]);

  const stopScheduler = useCallback(() => {
    if (timerRef.current === null) return;
    window.clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const schedule = useCallback(() => {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    while (nextNoteTimeRef.current < audioContext.currentTime + SCHEDULE_AHEAD_SECONDS) {
      const { bpm, beatsPerMeasure, accentFirstBeat } = settingsRef.current;
      const beat = nextBeatRef.current;
      click(audioContext, nextNoteTimeRef.current, accentFirstBeat && beat === 1);
      window.setTimeout(() => setCurrentBeat(beat), Math.max(0, (nextNoteTimeRef.current - audioContext.currentTime) * 1000));
      nextNoteTimeRef.current += 60 / bpm;
      nextBeatRef.current = beat >= beatsPerMeasure ? 1 : beat + 1;
    }
  }, []);

  const start = useCallback(() => {
    if (typeof window === "undefined") return;

    const browserWindow = window as BrowserWindowWithAudioContext;
    const AudioContextCtor = browserWindow.AudioContext || browserWindow.webkitAudioContext;
    if (!AudioContextCtor) return;

    const audioContext = audioContextRef.current ?? new AudioContextCtor();
    audioContextRef.current = audioContext;

    void audioContext.resume().then(() => {
      stopScheduler();
      nextBeatRef.current = 1;
      setCurrentBeat(1);
      nextNoteTimeRef.current = audioContext.currentTime + 0.05;
      schedule();
      timerRef.current = window.setInterval(schedule, LOOKAHEAD_MS);
      setIsPlaying(true);
    });
  }, [schedule, stopScheduler]);

  const stop = useCallback(() => {
    stopScheduler();
    setIsPlaying(false);
    setCurrentBeat(1);
    nextBeatRef.current = 1;
  }, [stopScheduler]);

  useEffect(() => stop, [stop]);

  const value = useMemo<MetronomeContextValue>(
    () => ({
      ...settings,
      isPlaying,
      currentBeat,
      setBpm: (bpm: number) => setSettings((current) => normalizeSettings({ ...current, bpm })),
      setBeatsPerMeasure: (beatsPerMeasure: number) => setSettings((current) => normalizeSettings({ ...current, beatsPerMeasure })),
      setAccentFirstBeat: (accentFirstBeat: boolean) => setSettings((current) => normalizeSettings({ ...current, accentFirstBeat })),
      start,
      stop,
      toggle: () => (isPlaying ? stop() : start())
    }),
    [currentBeat, isPlaying, settings, start, stop]
  );

  return <MetronomeContext.Provider value={value}>{children}</MetronomeContext.Provider>;
}

export function useMetronome() {
  const context = useContext(MetronomeContext);
  if (!context) {
    throw new Error("useMetronome must be used within MetronomeProvider");
  }
  return context;
}

