const LETTER_TO_SEMITONE: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11
};

const SHARP_ORDER = ["F", "C", "G", "D", "A", "E", "B"];
const FLAT_ORDER = ["B", "E", "A", "D", "G", "C", "F"];

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
  const majorMap: Record<string, number> = {
    "c major": 0,
    "g major": 1,
    "d major": 2,
    "a major": 3,
    "e major": 4,
    "b major": 5,
    "f# major": 6,
    "db major": -5,
    "ab major": -4,
    "eb major": -3,
    "bb major": -2,
    "f major": -1
  };
  const minorMap: Record<string, number> = {
    "a minor": 0,
    "e minor": 1,
    "b minor": 2,
    "f# minor": 3,
    "c# minor": 4,
    "g# minor": 5,
    "d minor": -1,
    "g minor": -2,
    "c minor": -3,
    "f minor": -4
  };
  if (normalized in majorMap) return majorMap[normalized];
  if (normalized in minorMap) return minorMap[normalized];
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
