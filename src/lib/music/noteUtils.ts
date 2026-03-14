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
const SHARP_ORDER = ["F", "C", "G", "D", "A", "E", "B"];
const FLAT_ORDER = ["B", "E", "A", "D", "G", "C", "F"];
const MAJOR_KEY_FIFTHS: Record<string, number> = {
  "cb major": -7,
  "gb major": -6,
  "db major": -5,
  "ab major": -4,
  "eb major": -3,
  "bb major": -2,
  "f major": -1,
  "c major": 0,
  "g major": 1,
  "d major": 2,
  "a major": 3,
  "e major": 4,
  "b major": 5,
  "f# major": 6,
  "c# major": 7
};
const MINOR_KEY_FIFTHS: Record<string, number> = {
  "ab minor": -7,
  "eb minor": -6,
  "bb minor": -5,
  "f minor": -4,
  "c minor": -3,
  "g minor": -2,
  "d minor": -1,
  "a minor": 0,
  "e minor": 1,
  "b minor": 2,
  "f# minor": 3,
  "c# minor": 4,
  "g# minor": 5,
  "d# minor": 6,
  "a# minor": 7
};
const SCALE_STEP_OFFSETS: Record<string, number[] | undefined> = {
  Major: [0, 1, 2, 3, 4, 5, 6, 7],
  "Natural Minor": [0, 1, 2, 3, 4, 5, 6, 7],
  "Harmonic Minor": [0, 1, 2, 3, 4, 5, 6, 7],
  "Melodic Minor": [0, 1, 2, 3, 4, 5, 6, 7],
  "Major Pentatonic": [0, 1, 2, 4, 5, 7],
  "Minor Pentatonic": [0, 2, 3, 4, 6, 7],
  Blues: [0, 2, 3, 4, 4, 6, 7]
};
const SCALE_KEY_MODES: Record<string, "major" | "minor" | undefined> = {
  Major: "major",
  "Natural Minor": "minor",
  "Harmonic Minor": "minor",
  "Melodic Minor": "minor",
  "Major Pentatonic": "major",
  "Minor Pentatonic": "minor",
  Blues: "minor",
  Chromatic: undefined
};

export type SpelledScaleDegree = {
  pitchClass: string;
  octaveOffset: number;
};

const mod = (value: number, base: number): number => ((value % base) + base) % base;

const normalizeAlter = (targetPitchClass: number, naturalPitchClass: number): number => {
  const delta = mod(targetPitchClass - naturalPitchClass, 12);
  return delta > 6 ? delta - 12 : delta;
};

export const parsePitch = (name: string): { midi: number; step: string; alter: number; octave: number } => {
  const m = name.match(/^([A-G])(#{1,2}|b{1,2})?(\d)$/);
  if (!m) throw new Error(`Invalid pitch: ${name}`);
  const step = m[1];
  const acc = m[2] ?? "";
  const octave = Number(m[3]);
  const alter = acc.split("").reduce((sum, c) => sum + (c === "#" ? 1 : -1), 0);
  const midi = 12 * (octave + 1) + LETTER_TO_SEMITONE[step] + alter;
  return { midi, step, alter, octave };
};

export const midiToSharpName = (midi: number): string => {
  const pcs = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
  const pc = pcs[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${pc}${octave}`;
};

export const validateRange = (low: string, high: string): string | undefined => {
  if (parsePitch(low).midi >= parsePitch(high).midi) return "Lowest note must be lower than highest note.";
  return undefined;
};

export const accidentalFromAlter = (alter: number): string => {
  if (alter === 2) return "##";
  if (alter === 1) return "#";
  if (alter === -1) return "b";
  if (alter === -2) return "bb";
  return "";
};

export const buildDiatonicScale = (root: string, intervals: number[]): string[] => {
  const tonic = parsePitch(`${root}4`);
  return intervals.map((i) => midiToSharpName(tonic.midi + i).replace(/\d/, ""));
};

export const keySignatureFifths = (keyLabel: string): number => {
  const normalized = keyLabel.toLowerCase();
  if (normalized in MAJOR_KEY_FIFTHS) return MAJOR_KEY_FIFTHS[normalized];
  if (normalized in MINOR_KEY_FIFTHS) return MINOR_KEY_FIFTHS[normalized];
  return 0;
};

export const scaleAccidentalMapFromFifths = (fifths: number): Record<string, number> => {
  const map: Record<string, number> = { C: 0, D: 0, E: 0, F: 0, G: 0, A: 0, B: 0 };
  if (fifths > 0) {
    for (const step of SHARP_ORDER.slice(0, fifths)) map[step] = 1;
  }
  if (fifths < 0) {
    for (const step of FLAT_ORDER.slice(0, Math.abs(fifths))) map[step] = -1;
  }
  return map;
};

export const transposePitch = (pitchName: string, semitones: number): string => {
  return midiToSharpName(parsePitch(pitchName).midi + semitones);
};

export const buildScalePitchClasses = (root: string, scaleType: string, intervals: number[]): SpelledScaleDegree[] => {
  const tonic = parsePitch(`${root}4`);
  const fallback = intervals.map((interval) => {
    const name = transposePitch(`${root}4`, interval);
    const parsed = parsePitch(name);
    return {
      pitchClass: name.replace(/\d$/, ""),
      octaveOffset: parsed.octave - tonic.octave
    };
  });

  const stepOffsets = SCALE_STEP_OFFSETS[scaleType];
  if (!stepOffsets || stepOffsets.length !== intervals.length) return fallback;

  const rootIndex = LETTERS.indexOf(tonic.step as (typeof LETTERS)[number]);
  const tonicPitchClass = mod(tonic.midi, 12);

  return intervals.map((interval, idx) => {
    const stepOffset = stepOffsets[idx];
    const stepIndex = rootIndex + stepOffset;
    const step = LETTERS[stepIndex % LETTERS.length];
    const targetPitchClass = mod(tonicPitchClass + interval, 12);
    const alter = normalizeAlter(targetPitchClass, LETTER_TO_SEMITONE[step]);

    if (alter < -2 || alter > 2) return fallback[idx];

    return {
      pitchClass: `${step}${accidentalFromAlter(alter)}`,
      octaveOffset: Math.floor(stepIndex / LETTERS.length)
    };
  });
};

export const scaleKeySignatureLabel = (root: string, scaleType: string): string | undefined => {
  const mode = SCALE_KEY_MODES[scaleType];
  if (!mode) return undefined;

  const label = `${root} ${mode}`;
  const normalized = label.toLowerCase();

  if (normalized in MAJOR_KEY_FIFTHS || normalized in MINOR_KEY_FIFTHS) return label;
  return undefined;
};
