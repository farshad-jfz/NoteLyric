import { Exercise, GenerateResult, MusicEvent } from "@/lib/music/models";
import { parsePitch, transposePitch } from "@/lib/music/noteUtils";
import { chunkIntoMeasures, uid } from "@/lib/generators/shared";
import { ChordSettings, validateChordSettings } from "@/lib/validation/chordsValidation";

const CHORD_INTERVALS: Record<string, number[]> = {
  "Major triad": [0, 4, 7],
  "Minor triad": [0, 3, 7],
  "Diminished triad": [0, 3, 6],
  "Augmented triad": [0, 4, 8],
  "Dominant 7": [0, 4, 7, 10],
  "Major 7": [0, 4, 7, 11],
  "Minor 7": [0, 3, 7, 10]
};

const findRootOctave = (root: string, low: string, high: string, octaveSpan: number): number | undefined => {
  const lowMidi = parsePitch(low).midi;
  const highMidi = parsePitch(high).midi;
  for (let octave = 2; octave <= 7; octave += 1) {
    const start = parsePitch(`${root}${octave}`).midi;
    const end = parsePitch(`${root}${octave + octaveSpan}`).midi;
    if (start >= lowMidi && end <= highMidi) return octave;
  }
  return undefined;
};

export const generateChordExercise = (settings: ChordSettings): GenerateResult => {
  const err = validateChordSettings(settings);
  if (err) return { error: err };

  const intervals = CHORD_INTERVALS[settings.chordType];
  if (!intervals) return { error: "Unsupported chord type." };

  const rootOct = findRootOctave(settings.root, settings.lowestNote, settings.highestNote, settings.octaveSpan);
  if (rootOct === undefined) return { error: "This arpeggio pattern does not fit the selected range." };

  const lowMidi = parsePitch(settings.lowestNote).midi;
  const highMidi = parsePitch(settings.highestNote).midi;
  const rootPitch = `${settings.root}${rootOct}`;

  const tones: string[] = intervals.map((i) => transposePitch(rootPitch, i));

  const events: MusicEvent[] = [];

  if (settings.pattern === "Block chord") {
    for (let oct = 0; oct < settings.octaveSpan; oct += 1) {
      const chordTones = tones.map((p) => transposePitch(p, 12 * oct));
      if (chordTones.some((p) => {
        const midi = parsePitch(p).midi;
        return midi < lowMidi || midi > highMidi;
      })) {
        return { error: "This arpeggio pattern does not fit the selected range." };
      }
      events.push({
        kind: "note",
        pitch: chordTones[0],
        chord: chordTones,
        duration: settings.noteValue,
        lyric: settings.showChordTones ? chordTones.map((t) => t.replace(/\d/, "")).join(" ") : undefined
      });
    }
  } else {
    const seq: string[] = [];
    for (let oct = 0; oct < settings.octaveSpan; oct += 1) {
      for (const t of tones) seq.push(transposePitch(t, 12 * oct));
    }
    seq.push(transposePitch(rootPitch, 12 * settings.octaveSpan));

    const run = settings.pattern === "Descending arpeggio"
      ? [...seq].reverse()
      : settings.pattern === "Up and Down"
      ? [...seq, ...[...seq].reverse().slice(1)]
      : seq;

    for (const p of run) {
      const midi = parsePitch(p).midi;
      if (midi < lowMidi || midi > highMidi) return { error: "This arpeggio pattern does not fit the selected range." };
      const labels: string[] = [];
      if (settings.showNoteNames) labels.push(p);
      if (settings.showChordTones) labels.push(p.replace(/\d/, ""));
      events.push({ kind: "note", pitch: p, duration: settings.noteValue, lyric: labels.length ? labels.join(" / ") : undefined });
    }
  }

  const exercise: Exercise = {
    id: uid(),
    type: "chord",
    title: `${settings.root} ${settings.chordType} - ${settings.octaveSpan} Octave - ${settings.pattern}`,
    timeSignature: settings.timeSignature,
    clef: "treble",
    metadata: {
      root: settings.root,
      chordType: settings.chordType,
      pattern: settings.pattern,
      octaveSpan: settings.octaveSpan,
      range: `${settings.lowestNote}-${settings.highestNote}`
    },
    measures: chunkIntoMeasures(events, settings.timeSignature)
  };

  return { exercise };
};
