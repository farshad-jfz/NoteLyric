import { DurationName, TimeSignature } from "@/lib/music/models";

export const ROOT_OPTIONS = [
  "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"
] as const;

export const SCALE_TYPES = [
  "Major",
  "Natural Minor",
  "Harmonic Minor",
  "Melodic Minor",
  "Major Pentatonic",
  "Minor Pentatonic",
  "Blues",
  "Chromatic"
] as const;

export const CHORD_TYPES = [
  "Major triad",
  "Minor triad",
  "Diminished triad",
  "Augmented triad",
  "Dominant 7",
  "Major 7",
  "Minor 7"
] as const;

export const ARPEGGIO_PATTERNS = ["Block chord", "Ascending arpeggio", "Descending arpeggio", "Up and Down"] as const;
export const DIRECTIONS = ["Ascending", "Descending", "Up and Down"] as const;

export const TIME_SIGNATURES: TimeSignature[] = ["2/4", "3/4", "4/4", "6/8"];

export const DISPLAY_NOTE_VALUES: DurationName[] = ["whole", "half", "quarter", "eighth", "dotted half", "dotted quarter"];

export const DURATION_TO_QUARTERS: Record<DurationName, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  "dotted half": 3,
  "dotted quarter": 1.5
};

export const LEAP_LIMITS = {
  "step only": 2,
  "up to 3rd": 4,
  "up to 4th": 5,
  "up to 5th": 7,
  octave: 12
} as const;

export const NOTE_OPTIONS = (() => {
  const pcs = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
  const out: string[] = [];
  for (let octave = 3; octave <= 7; octave += 1) {
    for (const pc of pcs) out.push(`${pc}${octave}`);
  }
  return out;
})();

export const MAJOR_KEYS = ["C", "G", "D", "A", "E", "B", "F", "Bb", "Eb", "Ab"];
export const MINOR_KEYS = ["A", "E", "B", "F#", "C#", "G#", "D", "G", "C", "F"];
