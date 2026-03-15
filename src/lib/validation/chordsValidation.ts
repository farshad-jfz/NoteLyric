import { validateRange } from "@/lib/music/noteUtils";

export type ChordSettings = {
  root: string;
  chordType: string;
  pattern: "Block chord" | "Ascending arpeggio" | "Descending arpeggio" | "Up and Down";
  octaveSpan: number;
  timeSignature: "2/4" | "3/4" | "4/4" | "6/8";
  noteValue: "half" | "quarter" | "eighth";
  lowestNote: string;
  highestNote: string;
  showNoteNames: boolean;
  showChordTones: boolean;
  showScaleDegrees: boolean;
};

export const validateChordSettings = (settings: ChordSettings): string | undefined => {
  return validateRange(settings.lowestNote, settings.highestNote);
};
