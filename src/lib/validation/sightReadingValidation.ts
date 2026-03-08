import { DurationName, TimeSignature } from "@/lib/music/models";
import { buildFillableUnits, timeSignatureToQuarterBeats, toUnits } from "@/lib/music/rhythmUtils";
import { validateRange } from "@/lib/music/noteUtils";

export type SightReadingSettings = {
  lowestNote: string;
  highestNote: string;
  keyMode: "C Major / A Minor only" | "Major keys" | "Minor keys" | "Chromatic / random accidentals";
  specificKey: string;
  numBars: 2 | 4 | 8 | 12 | 16;
  timeSignature: TimeSignature;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  allowedValues: DurationName[];
  allowRests: boolean;
  maxLeap: "step only" | "up to 3rd" | "up to 4th" | "up to 5th" | "octave";
  repeatedNotes: boolean;
  showNoteNames: boolean;
};

export const validateSightReadingSettings = (settings: SightReadingSettings): string | undefined => {
  const rangeErr = validateRange(settings.lowestNote, settings.highestNote);
  if (rangeErr) return rangeErr;
  if (!settings.allowedValues.length) return "Please select at least one note duration.";
  const measureUnits = toUnits(timeSignatureToQuarterBeats(settings.timeSignature));
  const fillable = buildFillableUnits(settings.allowedValues, measureUnits);
  if (!fillable.has(measureUnits)) return "Selected note values cannot fill measures in this time signature.";
  return undefined;
};
