import { TimeSignature } from "@/lib/music/models";
import { buildJazzProgression, JazzDifficulty, JazzMode, JazzProgressionType, progressionBaseLength } from "@/lib/music/jazz";
import { parsePitch, validateRange } from "@/lib/music/noteUtils";

export type JazzSettings = {
  mode: JazzMode;
  progressionType: JazzProgressionType;
  key: string;
  timeSignature: TimeSignature;
  numBars: number;
  lowestNote: string;
  highestNote: string;
  difficulty: JazzDifficulty;
  swingFeel: boolean;
  seed: string;
};

const availablePitchCount = (pitchClasses: readonly string[], low: string, high: string): number => {
  const lowMidi = parsePitch(low).midi;
  const highMidi = parsePitch(high).midi;
  let count = 0;

  for (let octave = 2; octave <= 7; octave += 1) {
    for (const pitchClass of pitchClasses) {
      const midi = parsePitch(`${pitchClass}${octave}`).midi;
      if (midi >= lowMidi && midi <= highMidi) count += 1;
    }
  }

  return count;
};

export const getJazzGeneratabilityIssue = (settings: JazzSettings): string | undefined => {
  const progression = buildJazzProgression(settings.key, settings.progressionType, settings.numBars);

  for (const measure of progression.measures) {
    const chordToneCount = availablePitchCount(measure.chord.chordTones, settings.lowestNote, settings.highestNote);
    const guideToneCount = availablePitchCount(measure.chord.guideTones, settings.lowestNote, settings.highestNote);
    const scaleToneCount = availablePitchCount(measure.chord.scaleTones, settings.lowestNote, settings.highestNote);

    if (chordToneCount === 0) {
      return "The selected range does not contain chord tones for every chord in this progression.";
    }

    if ((settings.mode === "guide-tones" || settings.mode === "voice-leading") && guideToneCount === 0) {
      return "The selected range must include at least one guide tone for each chord in this progression.";
    }

    if (settings.mode === "motif-development" && scaleToneCount < 3) {
      return "Motif Development needs a slightly wider range so the motif can be varied musically.";
    }

    if (settings.mode === "bebop-lines" && scaleToneCount < 4) {
      return "Bebop Lines needs a wider range so passing tones and approach notes can fit.";
    }
  }

  return undefined;
};

export const validateJazzSettings = (settings: JazzSettings): string | undefined => {
  const rangeErr = validateRange(settings.lowestNote, settings.highestNote);
  if (rangeErr) return rangeErr;

  const baseLength = progressionBaseLength(settings.progressionType);
  if (settings.numBars < baseLength) {
    return `The selected progression needs at least ${baseLength} bars.`;
  }

  if (settings.numBars % baseLength !== 0) {
    return `Number of bars must be a multiple of ${baseLength} for ${settings.progressionType}.`;
  }

  if (settings.seed.trim() && !/^\d+$/.test(settings.seed.trim())) {
    return "Seed must be numeric.";
  }

  return getJazzGeneratabilityIssue(settings);
};
