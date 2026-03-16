import type { AppDifficulty, AppSettings, CurriculumProfile, PracticeSession, PracticeStep, PracticeStepKind } from "@/lib/app/types";
import { appDefaultsForChord, appDefaultsForJazz, appDefaultsForScale } from "@/lib/app/defaults";
import { generateChordExercise } from "@/lib/generators/chords";
import { uid } from "@/lib/generators/shared";
import { generateJazzExercise } from "@/lib/generators/jazz";
import { generateScaleExercise } from "@/lib/generators/scales";
import { ROOT_OPTIONS } from "@/lib/music/constants";
import { JAZZ_MODE_OPTIONS, type JazzMode } from "@/lib/music/jazz";
import type { JazzSettings } from "@/lib/validation/jazzValidation";

const hashString = (value: string): number => {
  let hash = 0;
  for (const char of value) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getTodayDateKey = (date = new Date()): string => date.toISOString().slice(0, 10);

export const getKeyOfTheDay = (dateKey: string): string => ROOT_OPTIONS[hashString(dateKey) % ROOT_OPTIONS.length] ?? "C";

const numericSeed = (value: string): string => `${hashString(value)}`;

export const curriculumProfiles: Record<AppDifficulty, CurriculumProfile> = {
  Beginner: {
    allowedModes: ["ii-v-i", "guide-tones", "call-response"],
    disallowedModes: ["bebop-lines", "motif-development", "target-tones", "voice-leading"],
    preferredModesByPhase: {
      "warm-up": ["ii-v-i"],
      "harmony": ["ii-v-i"],
      "guide-tones": ["guide-tones"],
      "jazz-language": ["ii-v-i"],
      "creative": ["call-response"]
    },
    rhythmComplexity: "low",
    chromaticism: "none",
    rangeUsage: "narrow",
    repetitionBias: "high"
  },
  Intermediate: {
    allowedModes: ["ii-v-i", "guide-tones", "target-tones", "motif-development", "call-response", "voice-leading"],
    disallowedModes: ["bebop-lines"],
    preferredModesByPhase: {
      "warm-up": ["ii-v-i"],
      "harmony": ["voice-leading", "ii-v-i"],
      "guide-tones": ["guide-tones", "target-tones"],
      "jazz-language": ["target-tones", "voice-leading"],
      "creative": ["motif-development", "call-response"]
    },
    rhythmComplexity: "medium",
    chromaticism: "light",
    rangeUsage: "moderate",
    repetitionBias: "medium"
  },
  Advanced: {
    allowedModes: JAZZ_MODE_OPTIONS.map((mode) => mode.value),
    disallowedModes: [],
    preferredModesByPhase: {
      "warm-up": ["ii-v-i"],
      "harmony": ["voice-leading", "ii-v-i"],
      "guide-tones": ["guide-tones", "target-tones"],
      "jazz-language": ["bebop-lines", "target-tones", "voice-leading"],
      "creative": ["call-response", "motif-development"]
    },
    rhythmComplexity: "high",
    chromaticism: "moderate",
    rangeUsage: "full",
    repetitionBias: "low"
  }
};

const pickJazzMode = (difficulty: AppDifficulty, kind: PracticeStepKind, dateKey: string): JazzMode => {
  const preferred = curriculumProfiles[difficulty].preferredModesByPhase[kind];
  const pool = preferred.filter((mode) => !curriculumProfiles[difficulty].disallowedModes.includes(mode));
  return pool[hashString(`${dateKey}:${kind}`) % pool.length] ?? "ii-v-i";
};

const uniqueModes = (modes: JazzMode[]): JazzMode[] => Array.from(new Set(modes)) as JazzMode[];

const simplifyDifficulty = (difficulty: AppDifficulty): AppDifficulty => {
  if (difficulty === "Advanced") return "Intermediate";
  if (difficulty === "Intermediate") return "Beginner";
  return "Beginner";
};

const buildStep = (
  kind: PracticeStepKind,
  title: string,
  description: string,
  minutes: number,
  exercise: PracticeStep["exercise"],
  jazzMode?: JazzMode
): PracticeStep => ({
  stepId: uid(),
  kind,
  title,
  description,
  minutes,
  status: "not-started",
  source: "guided-practice",
  exercise,
  jazzMode
});

const requireExercise = <T extends { exercise?: PracticeStep["exercise"]; error?: string }>(result: T, label: string): PracticeStep["exercise"] => {
  if (!result.exercise) {
    throw new Error(result.error ?? `Unable to generate ${label}.`);
  }
  return result.exercise;
};

type GuidedJazzRequest = {
  dateKey: string;
  phase: "guide" | "language" | "creative";
  sessionKey: string;
  difficulty: AppDifficulty;
  baseSettings: JazzSettings;
  primaryMode: JazzMode;
  fallbackModes: JazzMode[];
  progressionType: JazzSettings["progressionType"];
  numBars: number;
  swingFeel: boolean;
};

const generateGuidedJazzExercise = ({
  dateKey,
  phase,
  sessionKey,
  difficulty,
  baseSettings,
  primaryMode,
  fallbackModes,
  progressionType,
  numBars,
  swingFeel
}: GuidedJazzRequest): { exercise: PracticeStep["exercise"]; mode: JazzMode } => {
  const primaryPool = uniqueModes([primaryMode, ...fallbackModes]);
  const simplifiedDifficulty = simplifyDifficulty(difficulty);
  const simplifiedPool = uniqueModes(["guide-tones", "ii-v-i", "call-response"]);
  const attempts: JazzSettings[] = [];
  const seen = new Set<string>();

  const pushAttempt = (mode: JazzMode, nextProgressionType: JazzSettings["progressionType"], nextNumBars: number, nextDifficulty: AppDifficulty, nextSwingFeel: boolean) => {
    const key = [mode, nextProgressionType, nextNumBars, nextDifficulty, nextSwingFeel ? "swing" : "straight"].join(":");
    if (seen.has(key)) return;
    seen.add(key);
    attempts.push({
      ...baseSettings,
      mode,
      key: sessionKey,
      progressionType: nextProgressionType,
      numBars: nextNumBars,
      difficulty: nextDifficulty,
      swingFeel: nextSwingFeel,
      seed: numericSeed(`${dateKey}:${phase}:${sessionKey}:${nextDifficulty}:${key}`)
    });
  };

  for (const mode of primaryPool) {
    pushAttempt(mode, progressionType, numBars, difficulty, swingFeel);
  }

  for (const mode of primaryPool) {
    pushAttempt(mode, "II-V-I", 6, difficulty, false);
  }

  for (const mode of simplifiedPool) {
    pushAttempt(mode, "II-V-I", 6, simplifiedDifficulty, false);
  }

  let lastError = "Unable to generate a musical jazz exercise for this guided practice step.";

  for (const attempt of attempts) {
    const result = generateJazzExercise(attempt);
    if (result.exercise) {
      return { exercise: result.exercise, mode: attempt.mode };
    }
    if (result.error) {
      lastError = result.error;
    }
  }

  throw new Error(lastError);
};

export const generatePracticeSession = (settings: AppSettings, dateKey = getTodayDateKey()): PracticeSession => {
  const difficulty = settings.defaultDifficulty;
  const sessionKey = getKeyOfTheDay(dateKey);
  const scaleSettings = appDefaultsForScale(settings);
  const chordSettings = appDefaultsForChord(settings);
  const jazzSettings = appDefaultsForJazz(settings);

  const warmupExercise = requireExercise(
    generateScaleExercise({
      ...scaleSettings,
      root: sessionKey,
      scaleType: difficulty === "Advanced" ? "Chromatic" : "Major",
      octaveSpan: difficulty === "Beginner" ? 1 : 2,
      direction: "Up and Down"
    }),
    "warm-up"
  );

  const harmonyExercise = requireExercise(
    generateChordExercise({
      ...chordSettings,
      root: sessionKey,
      chordType: difficulty === "Beginner" ? "Major triad" : difficulty === "Intermediate" ? "Major 7" : "Dominant 7",
      pattern: difficulty === "Beginner" ? "Ascending arpeggio" : "Up and Down",
      octaveSpan: difficulty === "Beginner" ? 1 : 2
    }),
    "harmony"
  );

  const guideMode = pickJazzMode(difficulty, "guide-tones", dateKey);
  const guideResult = generateGuidedJazzExercise({
    dateKey,
    phase: "guide",
    sessionKey,
    difficulty,
    baseSettings: jazzSettings,
    primaryMode: guideMode === "target-tones" ? "target-tones" : "guide-tones",
    fallbackModes: ["guide-tones", "ii-v-i", "call-response"],
    progressionType: difficulty === "Advanced" ? "Turnaround" : "II-V-I",
    numBars: difficulty === "Beginner" ? 6 : 8,
    swingFeel: false
  });

  const jazzLanguageMode = pickJazzMode(difficulty, "jazz-language", dateKey);
  const jazzLanguageResult = generateGuidedJazzExercise({
    dateKey,
    phase: "language",
    sessionKey,
    difficulty,
    baseSettings: jazzSettings,
    primaryMode: jazzLanguageMode,
    fallbackModes: [jazzLanguageMode, "ii-v-i", "guide-tones", "call-response"],
    progressionType: difficulty === "Advanced" ? "12-Bar Blues" : "II-V-I",
    numBars: difficulty === "Advanced" ? 12 : 6,
    swingFeel: difficulty !== "Beginner" ? settings.preferSwingFeel : false
  });

  const creativeMode = pickJazzMode(difficulty, "creative", dateKey);
  const creativeResult = generateGuidedJazzExercise({
    dateKey,
    phase: "creative",
    sessionKey,
    difficulty,
    baseSettings: jazzSettings,
    primaryMode: creativeMode,
    fallbackModes: ["call-response", "ii-v-i", "guide-tones"],
    progressionType: "II-V-I",
    numBars: 6,
    swingFeel: difficulty === "Advanced" && settings.preferSwingFeel
  });

  const steps = [
    buildStep("warm-up", "Warm-up", "Get comfortable with the instrument and range before the session opens up.", 3, warmupExercise),
    buildStep("harmony", "Harmony", "Lock in the chord tones for today's key before moving into jazz language.", 4, harmonyExercise),
    buildStep("guide-tones", "Guide Tones", "Hear the movement between chords by focusing on strong harmonic notes.", 4, guideResult.exercise, guideResult.mode),
    buildStep("jazz-language", "Jazz Language", "Practice a direct jazz idea that matches today's level and key.", 5, jazzLanguageResult.exercise, jazzLanguageResult.mode),
    buildStep("creative", "Creative Exercise", "Finish with a musical response exercise instead of another drill.", 5, creativeResult.exercise, creativeResult.mode)
  ];

  return {
    sessionId: `session-${dateKey}`,
    dateKey,
    key: sessionKey,
    difficulty,
    estimatedMinutes: steps.reduce((total, step) => total + step.minutes, 0),
    status: "not-started",
    steps
  };
};
