import type { Exercise } from "@/lib/music/models";
import type { JazzMode } from "@/lib/music/jazz";

export type AppDifficulty = "Beginner" | "Intermediate" | "Advanced";
export type ExportFormat = "png" | "svg" | "musicxml" | "pdf";
export type LibrarySource = "scales" | "chords" | "sight-reading" | "jazz" | "guided-practice";
export type StepStatus = "not-started" | "in-progress" | "completed" | "skipped";
export type SessionStatus = "not-started" | "in-progress" | "completed";

export type AppSettings = {
  instrumentLowNote: string;
  instrumentHighNote: string;
  defaultDifficulty: AppDifficulty;
  preferSwingFeel: boolean;
  showNoteNamesByDefault: boolean;
  defaultExportFormat: ExportFormat;
};

export type LibraryEntry = {
  id: string;
  createdAt: string;
  lastOpenedAt: string;
  title: string;
  source: LibrarySource;
  tags: string[];
  saved: boolean;
  favorite: boolean;
  exercise: Exercise;
};

export type PracticeStepKind = "warm-up" | "harmony" | "guide-tones" | "jazz-language" | "creative";

export type PracticeStep = {
  stepId: string;
  kind: PracticeStepKind;
  title: string;
  description: string;
  minutes: number;
  status: StepStatus;
  source: LibrarySource;
  exercise: Exercise;
  jazzMode?: JazzMode;
};

export type PracticeSession = {
  sessionId: string;
  dateKey: string;
  key: string;
  difficulty: AppDifficulty;
  estimatedMinutes: number;
  status: SessionStatus;
  activeStepId?: string;
  startedAt?: string;
  completedAt?: string;
  steps: PracticeStep[];
};

export type CurriculumProfile = {
  allowedModes: JazzMode[];
  disallowedModes: JazzMode[];
  preferredModesByPhase: Record<PracticeStepKind, JazzMode[]>;
  rhythmComplexity: "low" | "medium" | "high";
  chromaticism: "none" | "light" | "moderate";
  rangeUsage: "narrow" | "moderate" | "full";
  repetitionBias: "high" | "medium" | "low";
};

export type LibraryState = {
  entries: LibraryEntry[];
  sessions: PracticeSession[];
};

export type VersionedEnvelope<T> = {
  version: number;
  updatedAt: string;
  data: T;
};
