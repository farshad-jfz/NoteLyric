"use client";

import type { AppSettings, LibraryEntry, LibraryState, PracticeSession, VersionedEnvelope } from "@/lib/app/types";
import type { Exercise } from "@/lib/music/models";

const STORAGE_VERSION = 2;

const SETTINGS_KEY = "notelyric:v2:settings";
const LIBRARY_KEY = "notelyric:v2:library";
const SESSION_KEY = "notelyric:v2:daily-session";

export const defaultAppSettings: AppSettings = {
  instrumentLowNote: "C4",
  instrumentHighNote: "C6",
  defaultDifficulty: "Beginner",
  preferSwingFeel: false,
  showNoteNamesByDefault: false,
  defaultExportFormat: "png"
};

const defaultLibraryState: LibraryState = {
  entries: [],
  sessions: []
};

const isBrowser = (): boolean => typeof window !== "undefined";

const readEnvelope = <T,>(key: string, fallback: T): T => {
  if (!isBrowser()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<VersionedEnvelope<T>> | T;
    if (typeof parsed === "object" && parsed !== null && "version" in parsed && "data" in parsed) {
      return (parsed as VersionedEnvelope<T>).data;
    }
    return parsed as T;
  } catch {
    return fallback;
  }
};

const writeEnvelope = <T,>(key: string, value: T): void => {
  if (!isBrowser()) return;
  const envelope: VersionedEnvelope<T> = {
    version: STORAGE_VERSION,
    updatedAt: new Date().toISOString(),
    data: value
  };
  window.localStorage.setItem(key, JSON.stringify(envelope));
};

export const loadAppSettings = (): AppSettings => ({
  ...defaultAppSettings,
  ...readEnvelope<AppSettings>(SETTINGS_KEY, defaultAppSettings)
});

export const saveAppSettings = (settings: AppSettings): void => {
  writeEnvelope(SETTINGS_KEY, settings);
};

export const loadLibraryState = (): LibraryState => {
  const state = readEnvelope<LibraryState>(LIBRARY_KEY, defaultLibraryState);
  return {
    entries: state.entries ?? [],
    sessions: state.sessions ?? []
  };
};

export const saveLibraryState = (state: LibraryState): void => {
  writeEnvelope(LIBRARY_KEY, state);
};

export const loadDailySession = (): PracticeSession | undefined => {
  return readEnvelope<PracticeSession | undefined>(SESSION_KEY, undefined);
};

export const saveDailySession = (session: PracticeSession): void => {
  writeEnvelope(SESSION_KEY, session);
};

export const clearDailySession = (): void => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(SESSION_KEY);
};

const deriveTags = (exercise: Exercise, source: LibraryEntry["source"]): string[] => {
  const tags: string[] = [source, exercise.timeSignature];
  const key = typeof exercise.metadata.key === "string" ? exercise.metadata.key : exercise.keySignature;
  if (key) tags.push(String(key));
  const mode = typeof exercise.metadata.mode === "string" ? exercise.metadata.mode : undefined;
  if (mode) tags.push(mode);
  return Array.from(new Set(tags));
};

export const upsertLibraryEntry = (
  entry: Pick<LibraryEntry, "exercise" | "source"> & Partial<Omit<LibraryEntry, "exercise" | "source">>
): LibraryEntry => {
  const state = loadLibraryState();
  const now = new Date().toISOString();
  const nextEntry: LibraryEntry = {
    id: entry.id ?? entry.exercise.id,
    createdAt: entry.createdAt ?? now,
    lastOpenedAt: entry.lastOpenedAt ?? now,
    title: entry.title ?? entry.exercise.title,
    source: entry.source,
    tags: entry.tags ?? deriveTags(entry.exercise, entry.source),
    saved: entry.saved ?? false,
    favorite: entry.favorite ?? false,
    exercise: entry.exercise
  };

  const nextEntries = [nextEntry, ...state.entries.filter((item) => item.id !== nextEntry.id)].slice(0, 80);
  saveLibraryState({ ...state, entries: nextEntries });
  return nextEntry;
};

export const recordExerciseHistory = (exercise: Exercise, source: LibraryEntry["source"]): LibraryEntry => {
  const existing = loadLibraryState().entries.find((entry) => entry.id === exercise.id);
  return upsertLibraryEntry({
    ...(existing ?? {}),
    exercise,
    source,
    lastOpenedAt: new Date().toISOString()
  });
};

export const updateLibraryEntry = (entryId: string, updater: (entry: LibraryEntry) => LibraryEntry): LibraryState => {
  const state = loadLibraryState();
  const nextEntries = state.entries.map((entry) => (entry.id === entryId ? updater(entry) : entry));
  const nextState = { ...state, entries: nextEntries };
  saveLibraryState(nextState);
  return nextState;
};

export const storeCompletedSession = (session: PracticeSession): LibraryState => {
  const state = loadLibraryState();
  const nextSessions = [session, ...state.sessions.filter((item) => item.sessionId !== session.sessionId)].slice(0, 30);
  const nextState = { ...state, sessions: nextSessions };
  saveLibraryState(nextState);
  return nextState;
};
