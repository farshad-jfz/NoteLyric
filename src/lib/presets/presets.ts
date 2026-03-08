import { ChordSettings } from "@/lib/validation/chordsValidation";
import { ScaleSettings } from "@/lib/validation/scalesValidation";
import { SightReadingSettings } from "@/lib/validation/sightReadingValidation";

export const defaultScaleSettings: ScaleSettings = {
  root: "C",
  scaleType: "Major",
  octaveSpan: 1,
  direction: "Up and Down",
  timeSignature: "4/4",
  noteValue: "quarter",
  lowestNote: "C4",
  highestNote: "C6",
  showNoteNames: false,
  showScaleDegrees: false
};

export const defaultChordSettings: ChordSettings = {
  root: "C",
  chordType: "Major triad",
  pattern: "Ascending arpeggio",
  octaveSpan: 1,
  timeSignature: "4/4",
  noteValue: "quarter",
  lowestNote: "C4",
  highestNote: "C6",
  showNoteNames: false,
  showChordTones: false
};

export const defaultSightSettings: SightReadingSettings = {
  lowestNote: "C4",
  highestNote: "C5",
  keyMode: "C Major / A Minor only",
  specificKey: "C major",
  numBars: 4,
  timeSignature: "4/4",
  difficulty: "Beginner",
  allowedValues: ["half", "quarter"],
  allowRests: false,
  maxLeap: "up to 3rd",
  repeatedNotes: true,
  showNoteNames: false
};

export const scalePresets: Record<string, Partial<ScaleSettings>> = {
  "C major scale, 1 octave, quarter notes": {
    root: "C",
    scaleType: "Major",
    octaveSpan: 1,
    direction: "Up and Down",
    noteValue: "quarter"
  },
  "All major scales style, 1 octave": {
    scaleType: "Major",
    octaveSpan: 1,
    direction: "Ascending",
    noteValue: "quarter"
  }
};

export const chordPresets: Record<string, Partial<ChordSettings>> = {
  "Minor arpeggios, 1 octave, quarter notes": {
    root: "C",
    chordType: "Minor triad",
    pattern: "Ascending arpeggio",
    octaveSpan: 1,
    noteValue: "quarter"
  }
};

export const sightPresets: Record<string, Partial<SightReadingSettings>> = {
  "Sight reading beginner, middle range, 4 bars": {
    lowestNote: "C4",
    highestNote: "C5",
    keyMode: "C Major / A Minor only",
    specificKey: "C major",
    numBars: 4,
    difficulty: "Beginner",
    allowedValues: ["half", "quarter"],
    allowRests: false,
    maxLeap: "up to 3rd"
  },
  "Sight reading intermediate, 8 bars": {
    lowestNote: "C4",
    highestNote: "D5",
    keyMode: "Major keys",
    specificKey: "G major",
    numBars: 8,
    difficulty: "Intermediate",
    allowedValues: ["half", "quarter", "eighth"],
    allowRests: true,
    maxLeap: "up to 4th"
  },
  "Sight reading advanced, chromatic mode, 8 bars": {
    lowestNote: "B3",
    highestNote: "E5",
    keyMode: "Chromatic / random accidentals",
    specificKey: "C major",
    numBars: 8,
    difficulty: "Advanced",
    allowedValues: ["quarter", "eighth", "dotted quarter"],
    allowRests: true,
    maxLeap: "up to 5th"
  }
};
