import { chunkIntoMeasures, uid } from "@/lib/generators/shared";
import type { DurationName, Exercise, MusicEvent } from "@/lib/music/models";
import { buildScalePitchClasses, parsePitch, scaleKeySignatureLabel } from "@/lib/music/noteUtils";

export type HarmonyScaleType = "Major" | "Natural Minor" | "Harmonic Minor" | "Melodic Minor";
export type HarmonyFunction = "Tonic" | "Predominant" | "Dominant" | "Color";
export type ArpeggioDirection = "Ascending" | "Descending" | "Up and Down";

export type HarmonyChord = {
  degree: number;
  roman: string;
  symbol: string;
  root: string;
  quality: string;
  tones: string[];
  pitches: string[];
  functionName: HarmonyFunction;
  functionDescription: string;
  resolution: string;
  improvisationFocus: string;
};

export type HarmonyProgression = {
  id: string;
  name: string;
  roman: string;
  degreeIndexes: number[];
  category: "Cadence" | "Functional" | "Popular";
  description: string;
};

export const HARMONY_SCALE_TYPES: HarmonyScaleType[] = ["Major", "Natural Minor", "Harmonic Minor", "Melodic Minor"];

const SCALE_INTERVALS: Record<HarmonyScaleType, number[]> = {
  Major: [0, 2, 4, 5, 7, 9, 11, 12],
  "Natural Minor": [0, 2, 3, 5, 7, 8, 10, 12],
  "Harmonic Minor": [0, 2, 3, 5, 7, 8, 11, 12],
  "Melodic Minor": [0, 2, 3, 5, 7, 9, 11, 12]
};

export const HARMONY_PROGRESSIONS: HarmonyProgression[] = [
  { id: "perfect-cadence", name: "Perfect Cadence", roman: "V-I", degreeIndexes: [4, 0], category: "Cadence", description: "The strongest tonal resolution: dominant tension resolving home." },
  { id: "plagal-cadence", name: "Plagal Cadence", roman: "IV-I", degreeIndexes: [3, 0], category: "Cadence", description: "The amen cadence: predominant color resolving to tonic stability." },
  { id: "deceptive-cadence", name: "Deceptive Cadence", roman: "V-vi", degreeIndexes: [4, 5], category: "Cadence", description: "The dominant points home, then delays resolution by moving to vi." },
  { id: "ii-v-i", name: "ii-V-I", roman: "ii-V-I", degreeIndexes: [1, 4, 0], category: "Functional", description: "The essential jazz cadence: preparation, tension, resolution." },
  { id: "i-vi-ii-v", name: "I-vi-ii-V", roman: "I-vi-ii-V", degreeIndexes: [0, 5, 1, 4], category: "Functional", description: "A classic turnaround that cycles from tonic through dominant preparation." },
  { id: "vi-ii-v-i", name: "vi-ii-V-I", roman: "vi-ii-V-I", degreeIndexes: [5, 1, 4, 0], category: "Functional", description: "An extended chain that increases forward motion into tonic resolution." },
  { id: "i-v-vi-iv", name: "I-V-vi-IV", roman: "I-V-vi-IV", degreeIndexes: [0, 4, 5, 3], category: "Popular", description: "A familiar pop progression balancing home, lift, contrast, and return." },
  { id: "vi-iv-i-v", name: "vi-IV-I-V", roman: "vi-IV-I-V", degreeIndexes: [5, 3, 0, 4], category: "Popular", description: "A pop loop that starts with relative-minor color and opens back into tonic." }
];

const qualityFromIntervals = (intervals: number[]): { quality: string; suffix: string } => {
  const key = intervals.join("-");
  const qualities: Record<string, { quality: string; suffix: string }> = {
    "0-4-7-11": { quality: "Major 7", suffix: "maj7" },
    "0-3-7-10": { quality: "Minor 7", suffix: "m7" },
    "0-4-7-10": { quality: "Dominant 7", suffix: "7" },
    "0-3-6-10": { quality: "Half-Diminished", suffix: "m7b5" },
    "0-3-6-9": { quality: "Diminished 7", suffix: "dim7" },
    "0-3-7-11": { quality: "Minor Major 7", suffix: "mMaj7" },
    "0-4-8-11": { quality: "Augmented Major 7", suffix: "maj7#5" },
    "0-4-8-10": { quality: "Augmented 7", suffix: "7#5" },
    "0-4-6-10": { quality: "Dominant 7 Flat 5", suffix: "7b5" }
  };
  return qualities[key] ?? { quality: "Seventh Chord", suffix: "7" };
};

const romanForChord = (degree: number, quality: string): string => {
  const base = ["I", "II", "III", "IV", "V", "VI", "VII"][degree - 1] ?? "I";
  const lower = quality.includes("Minor") || quality.includes("Diminished");
  const numeral = lower ? base.toLowerCase() : base;
  if (quality === "Half-Diminished") return `${numeral} half-dim`;
  if (quality === "Diminished 7") return `${numeral} dim`;
  return numeral;
};

const functionForDegree = (scaleType: HarmonyScaleType, degree: number): HarmonyFunction => {
  if (degree === 1 || degree === 3 || degree === 6) return "Tonic";
  if (degree === 2 || degree === 4) return "Predominant";
  if (degree === 5 || degree === 7) return "Dominant";
  return scaleType === "Melodic Minor" ? "Color" : "Tonic";
};

export const functionDescription = (functionName: HarmonyFunction): string => {
  if (functionName === "Tonic") return "Provides stability, rest, and resolution. This is the harmonic home base.";
  if (functionName === "Predominant") return "Creates movement and prepares the ear for dominant tension.";
  if (functionName === "Dominant") return "Creates tension and strongly wants to resolve toward tonic.";
  return "Adds color and modal flavor. Use it to expand the basic functional sound.";
};

const resolutionForFunction = (functionName: HarmonyFunction, tonicSymbol: string): string => {
  if (functionName === "Tonic") return "Often receives resolution or moves outward to begin a phrase.";
  if (functionName === "Predominant") return "Often moves to a dominant-function chord.";
  if (functionName === "Dominant") return `Typically resolves to ${tonicSymbol}.`;
  return "Usually resolves by voice leading into a nearby functional chord.";
};

const improvisationFocus = (chord: { tones: string[]; functionName: HarmonyFunction }): string => {
  const guideTones = [chord.tones[1], chord.tones[3]].filter(Boolean).join(" and ");
  if (chord.functionName === "Dominant") return `Target ${guideTones}; these tones define the tension and resolution.`;
  if (chord.functionName === "Predominant") return `Outline ${guideTones} to make the preparation clear.`;
  return `Use ${guideTones} as stable chord tones before adding passing notes.`;
};

export const harmonizeScale = (root: string, scaleType: HarmonyScaleType): HarmonyChord[] => {
  const degrees = buildScalePitchClasses(root, scaleType, SCALE_INTERVALS[scaleType]).slice(0, 7);
  const tonicRoot = degrees[0].pitchClass;
  const tonicSymbol = `${tonicRoot}${scaleType === "Major" ? "maj7" : "m7"}`;

  return degrees.map((degree, degreeIndex) => {
    const chordDegreeOffsets = [0, 2, 4, 6];
    const pitches = chordDegreeOffsets.map((offset) => {
      const index = (degreeIndex + offset) % degrees.length;
      const wrap = Math.floor((degreeIndex + offset) / degrees.length);
      const tone = degrees[index];
      return `${tone.pitchClass}${4 + tone.octaveOffset + wrap}`;
    });
    const tones = pitches.map((pitch) => pitch.replace(/\d$/, ""));
    const rootMidi = parsePitch(pitches[0]).midi;
    const intervals = pitches.map((pitch) => parsePitch(pitch).midi - rootMidi);
    const quality = qualityFromIntervals(intervals);
    const functionName = functionForDegree(scaleType, degreeIndex + 1);
    const chord = {
      degree: degreeIndex + 1,
      roman: romanForChord(degreeIndex + 1, quality.quality),
      symbol: `${degree.pitchClass}${quality.suffix}`,
      root: degree.pitchClass,
      quality: quality.quality,
      tones,
      pitches,
      functionName,
      functionDescription: functionDescription(functionName),
      resolution: resolutionForFunction(functionName, tonicSymbol),
      improvisationFocus: ""
    };
    return { ...chord, improvisationFocus: improvisationFocus(chord) };
  });
};

export const chordsForProgression = (root: string, scaleType: HarmonyScaleType, progressionId: string): { progression: HarmonyProgression; chords: HarmonyChord[] } => {
  const progression = HARMONY_PROGRESSIONS.find((item) => item.id === progressionId) ?? HARMONY_PROGRESSIONS[0];
  const harmony = harmonizeScale(root, scaleType);
  return { progression, chords: progression.degreeIndexes.map((index) => harmony[index]).filter(Boolean) };
};

const arpeggioSequence = (pitches: string[], direction: ArpeggioDirection): string[] => {
  if (direction === "Descending") return [...pitches].reverse();
  if (direction === "Up and Down") return [...pitches, ...[...pitches].reverse().slice(1)];
  return pitches;
};

export const buildHarmonyExercise = ({
  title,
  key,
  scaleType,
  chords,
  mode,
  direction = "Ascending",
  noteValue = "quarter",
  tempo = 90
}: {
  title: string;
  key: string;
  scaleType: HarmonyScaleType;
  chords: HarmonyChord[];
  mode: "block" | "arpeggio";
  direction?: ArpeggioDirection;
  noteValue?: Extract<DurationName, "quarter" | "eighth" | "half" | "whole">;
  tempo?: number;
}): Exercise => {
  const events: MusicEvent[] = [];

  for (const chord of chords) {
    if (mode === "block") {
      events.push({ kind: "note", pitch: chord.pitches[0], chord: chord.pitches, duration: "whole", lyrics: [chord.symbol, chord.roman] });
      continue;
    }

    arpeggioSequence(chord.pitches, direction).forEach((pitch, index) => {
      events.push({ kind: "note", pitch, duration: noteValue, lyrics: index === 0 ? [chord.symbol] : undefined });
    });
  }

  return {
    id: uid(),
    type: "chord",
    title,
    tempo: `${tempo}`,
    timeSignature: "4/4",
    keySignature: scaleKeySignatureLabel(key, scaleType),
    clef: "treble",
    metadata: { product: "Harmony", key, scaleType, mode },
    measureAnnotations: chords.map((chord) => `${chord.roman} ${chord.symbol}`),
    measures: chunkIntoMeasures(events, "4/4")
  };
};
