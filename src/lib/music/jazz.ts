import type { ContextExplanation } from "@/lib/music/education";
import { ROOT_OPTIONS } from "@/lib/music/constants";
import { DurationName, TimeSignature } from "@/lib/music/models";
import { accidentalFromAlter, buildScalePitchClasses, parsePitch, transposePitch } from "@/lib/music/noteUtils";

export type JazzMode =
  | "ii-v-i"
  | "guide-tones"
  | "target-tones"
  | "bebop-lines"
  | "voice-leading"
  | "motif-development"
  | "call-response";

export type JazzProgressionType = "II-V-I" | "Minor II-V-I" | "12-Bar Blues" | "Turnaround";
export type JazzDifficulty = "Beginner" | "Intermediate" | "Advanced";
export type ChordQuality = "m7" | "7" | "maj7" | "m7b5";
export type JazzRole =
  | "guide-tone"
  | "target-tone"
  | "chord-tone"
  | "scale-tone"
  | "passing-tone"
  | "chromatic-approach";

export type ChordSymbol = {
  root: string;
  quality: ChordQuality;
  symbol: string;
  scale?: string;
  chordTones: string[];
  guideTones: string[];
  scaleTones: string[];
};

export type MeasureHarmony = {
  measureIndex: number;
  chord: ChordSymbol;
};

export type Progression = {
  name: JazzProgressionType;
  key: string;
  measures: MeasureHarmony[];
};

const LETTER_TO_SEMITONE: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11
};

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const SCALE_STEP_OFFSETS = [0, 1, 2, 3, 4, 5, 6, 7];
const CHORD_STEP_OFFSETS = [0, 2, 4, 6];
const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11, 12];
const NATURAL_MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10, 12];

const JAZZ_SCALE_INTERVALS: Record<ChordQuality, number[]> = {
  m7: [0, 2, 3, 5, 7, 9, 10, 12],
  "7": [0, 2, 4, 5, 7, 9, 10, 12],
  maj7: [0, 2, 4, 5, 7, 9, 11, 12],
  m7b5: [0, 1, 3, 5, 6, 8, 10, 12]
};

const CHORD_INTERVALS: Record<ChordQuality, number[]> = {
  m7: [0, 3, 7, 10],
  "7": [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7b5: [0, 3, 6, 10]
};

const SCALE_NAMES: Record<ChordQuality, string> = {
  m7: "Dorian",
  "7": "Mixolydian",
  maj7: "Ionian",
  m7b5: "Locrian"
};

const QUALITY_SUFFIX: Record<ChordQuality, string> = {
  m7: "m7",
  "7": "7",
  maj7: "maj7",
  m7b5: "m7b5"
};

const mod = (value: number, base: number): number => ((value % base) + base) % base;

const normalizeAlter = (targetPitchClass: number, naturalPitchClass: number): number => {
  const delta = mod(targetPitchClass - naturalPitchClass, 12);
  return delta > 6 ? delta - 12 : delta;
};

const buildSpelledPitchClasses = (root: string, intervals: number[], stepOffsets: number[]): string[] => {
  const tonic = parsePitch(`${root}4`);
  const fallback = intervals.map((interval) => transposePitch(`${root}4`, interval).replace(/\d$/, ""));
  const rootIndex = LETTERS.indexOf(tonic.step as (typeof LETTERS)[number]);
  const tonicPitchClass = mod(tonic.midi, 12);

  return intervals.map((interval, idx) => {
    const stepOffset = stepOffsets[idx];
    const stepIndex = rootIndex + stepOffset;
    const step = LETTERS[stepIndex % LETTERS.length];
    const targetPitchClass = mod(tonicPitchClass + interval, 12);
    const alter = normalizeAlter(targetPitchClass, LETTER_TO_SEMITONE[step]);

    if (alter < -2 || alter > 2) return fallback[idx];
    return `${step}${accidentalFromAlter(alter)}`;
  });
};

const degreeRoot = (key: string, degree: number, family: "major" | "minor"): string => {
  const scale = buildScalePitchClasses(key, family === "major" ? "Major" : "Natural Minor", family === "major" ? MAJOR_INTERVALS : NATURAL_MINOR_INTERVALS);
  return scale[(degree - 1) % 7].pitchClass;
};

const buildChord = (root: string, quality: ChordQuality): ChordSymbol => {
  const chordTones = buildSpelledPitchClasses(root, CHORD_INTERVALS[quality], CHORD_STEP_OFFSETS);
  const scaleTones = buildSpelledPitchClasses(root, JAZZ_SCALE_INTERVALS[quality], SCALE_STEP_OFFSETS).slice(0, -1);

  return {
    root,
    quality,
    symbol: `${root}${QUALITY_SUFFIX[quality]}`,
    scale: `${root} ${SCALE_NAMES[quality]}`,
    chordTones,
    guideTones: [chordTones[1], chordTones[3]],
    scaleTones
  };
};

const progressionSpec = (progression: JazzProgressionType): { family: "major" | "minor"; chords: Array<{ degree: number; quality: ChordQuality }> } => {
  if (progression === "II-V-I") {
    return {
      family: "major",
      chords: [
        { degree: 2, quality: "m7" },
        { degree: 5, quality: "7" },
        { degree: 1, quality: "maj7" }
      ]
    };
  }

  if (progression === "Minor II-V-I") {
    return {
      family: "minor",
      chords: [
        { degree: 2, quality: "m7b5" },
        { degree: 5, quality: "7" },
        { degree: 1, quality: "m7" }
      ]
    };
  }

  if (progression === "Turnaround") {
    return {
      family: "major",
      chords: [
        { degree: 1, quality: "maj7" },
        { degree: 6, quality: "7" },
        { degree: 2, quality: "m7" },
        { degree: 5, quality: "7" }
      ]
    };
  }

  return {
    family: "major",
    chords: [
      { degree: 1, quality: "7" },
      { degree: 4, quality: "7" },
      { degree: 1, quality: "7" },
      { degree: 1, quality: "7" },
      { degree: 4, quality: "7" },
      { degree: 4, quality: "7" },
      { degree: 1, quality: "7" },
      { degree: 6, quality: "7" },
      { degree: 2, quality: "m7" },
      { degree: 5, quality: "7" },
      { degree: 1, quality: "7" },
      { degree: 5, quality: "7" }
    ]
  };
};

export const JAZZ_MODE_OPTIONS: Array<{ value: JazzMode; label: string }> = [
  { value: "ii-v-i", label: "II-V-I Progressions" },
  { value: "guide-tones", label: "Guide Tones" },
  { value: "target-tones", label: "Target Tones" },
  { value: "bebop-lines", label: "Bebop Lines" },
  { value: "voice-leading", label: "Voice Leading" },
  { value: "motif-development", label: "Motif Development" },
  { value: "call-response", label: "Call & Response" }
];

export const JAZZ_PROGRESSION_OPTIONS: JazzProgressionType[] = ["II-V-I", "Minor II-V-I", "12-Bar Blues", "Turnaround"];
export const JAZZ_DIFFICULTY_OPTIONS: JazzDifficulty[] = ["Beginner", "Intermediate", "Advanced"];
export const JAZZ_BAR_OPTIONS = [3, 4, 6, 8, 12, 16] as const;
export const JAZZ_KEY_OPTIONS = [...ROOT_OPTIONS];
export const JAZZ_TIME_SIGNATURES: TimeSignature[] = ["2/4", "3/4", "4/4", "6/8"];

export const progressionBaseLength = (progression: JazzProgressionType): number => progressionSpec(progression).chords.length;

export const getValidJazzBarOptions = (progression: JazzProgressionType): number[] => {
  const baseLength = progressionBaseLength(progression);
  return JAZZ_BAR_OPTIONS.filter((bars) => bars >= baseLength && bars % baseLength === 0);
};

export const progressionKeyLabel = (key: string, progression: JazzProgressionType): string =>
  progression === "Minor II-V-I" ? `${key} minor` : `${key} major`;

export const estimatedTempo = (difficulty: JazzDifficulty, swingFeel: boolean): string => {
  if (difficulty === "Beginner") return swingFeel ? "72" : "76";
  if (difficulty === "Intermediate") return "96";
  return swingFeel ? "128" : "120";
};

export const buildJazzProgression = (key: string, progression: JazzProgressionType, bars: number): Progression => {
  const spec = progressionSpec(progression);
  const base = spec.chords.map(({ degree, quality }) => buildChord(degreeRoot(key, degree, spec.family), quality));
  const measures = Array.from({ length: bars }, (_, idx) => ({
    measureIndex: idx,
    chord: base[idx % base.length]
  }));

  return {
    name: progression,
    key: progressionKeyLabel(key, progression),
    measures
  };
};

export const progressionToDisplay = (progression: Progression): string => progression.measures.map((measure) => measure.chord.symbol).join(" | ");

export const modeLabel = (mode: JazzMode): string => JAZZ_MODE_OPTIONS.find((item) => item.value === mode)?.label ?? mode;

export const JAZZ_MODE_EXPLANATIONS: Record<JazzMode, ContextExplanation> = {
  "ii-v-i": {
    title: "II-V-I Progression",
    definition: "Practice the most common jazz chord progression. These exercises help you hear how chords resolve and how melodies move through harmonic changes.",
    formulaLabel: "Focus",
    formula: "Chord tones on strong beats, smooth harmonic movement",
    example: "Dm7 -> G7 -> Cmaj7"
  },
  "guide-tones": {
    title: "Guide Tones",
    definition: "Guide tones are the 3rd and 7th of each chord. Practicing them helps you hear the essential notes that define jazz harmony.",
    formulaLabel: "Focus",
    formula: "3rd and 7th with minimal movement",
    example: "F -> B -> E"
  },
  "target-tones": {
    title: "Target Tones",
    definition: "Target tones are notes that melodies aim for on strong beats. These exercises help you outline the harmony clearly while improvising.",
    formulaLabel: "Focus",
    formula: "Resolve to chord tones on beats 1 and 3",
    example: "F -> B -> E"
  },
  "bebop-lines": {
    title: "Bebop Lines",
    definition: "Bebop lines connect chord tones with passing notes and chromatic approaches. This develops jazz vocabulary and phrasing.",
    formulaLabel: "Focus",
    formula: "Chord tones plus passing notes and chromatic approaches",
    example: "F -> D# -> E"
  },
  "voice-leading": {
    title: "Voice Leading",
    definition: "Voice leading is the smooth movement between chords. These exercises focus on connecting notes with the smallest possible motion.",
    formulaLabel: "Focus",
    formula: "Nearest chord tones with singable contour",
    example: "F -> F -> E"
  },
  "motif-development": {
    title: "Motif Development",
    definition: "A motif is a short musical idea that can be repeated and varied. These exercises help you build coherent melodic phrases.",
    formulaLabel: "Focus",
    formula: "Repeat a short idea with small pitch or rhythm changes",
    example: "C D E / D E F / E F G"
  },
  "call-response": {
    title: "Call & Response",
    definition: "Call and response creates a musical conversation between phrases. These exercises help develop phrasing and musical interaction.",
    formulaLabel: "Focus",
    formula: "Related phrases with shared rhythm or contour",
    example: "Call: C D E G / Response: G F E D"
  }
};

export const roleToLabel = (role: JazzRole): string => {
  if (role === "guide-tone") return "guide";
  if (role === "target-tone") return "target";
  if (role === "chord-tone") return "chord";
  if (role === "scale-tone") return "scale";
  if (role === "passing-tone") return "passing";
  return "approach";
};

export const supportsSwingFeel = (mode: JazzMode): boolean => mode === "bebop-lines" || mode === "call-response" || mode === "voice-leading";

export const displayTempoSummary = (difficulty: JazzDifficulty, swingFeel: boolean): string =>
  swingFeel ? `tempo ${estimatedTempo(difficulty, swingFeel)} swing` : `tempo ${estimatedTempo(difficulty, swingFeel)}`;

export const jazzNoteValuePool = (difficulty: JazzDifficulty): DurationName[] => {
  if (difficulty === "Beginner") return ["half", "quarter", "eighth"];
  if (difficulty === "Intermediate") return ["quarter", "eighth"];
  return ["quarter", "eighth"];
};
