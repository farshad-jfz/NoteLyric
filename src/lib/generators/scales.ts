import { Exercise, GenerateResult, MusicEvent } from "@/lib/music/models";
import { buildScaleDegreeLabels } from "@/lib/music/education";
import { buildScalePitchClasses, parsePitch, scaleKeySignatureLabel } from "@/lib/music/noteUtils";
import { chunkIntoMeasures, uid } from "@/lib/generators/shared";
import { ScaleSettings, validateScaleSettings } from "@/lib/validation/scalesValidation";

const SCALE_INTERVALS: Record<string, number[]> = {
  Major: [0, 2, 4, 5, 7, 9, 11, 12],
  "Natural Minor": [0, 2, 3, 5, 7, 8, 10, 12],
  "Harmonic Minor": [0, 2, 3, 5, 7, 8, 11, 12],
  "Melodic Minor": [0, 2, 3, 5, 7, 9, 11, 12],
  "Major Pentatonic": [0, 2, 4, 7, 9, 12],
  "Minor Pentatonic": [0, 3, 5, 7, 10, 12],
  Blues: [0, 3, 5, 6, 7, 10, 12],
  Chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
};

const findStartOctave = (root: string, low: string, high: string, octaveSpan: number): number | undefined => {
  const lowMidi = parsePitch(low).midi;
  const highMidi = parsePitch(high).midi;
  for (let octave = 2; octave <= 7; octave += 1) {
    const start = parsePitch(`${root}${octave}`).midi;
    const end = parsePitch(`${root}${octave + octaveSpan}`).midi;
    if (start >= lowMidi && end <= highMidi) return octave;
  }
  return undefined;
};

const buildScaleNotes = (settings: ScaleSettings): { notes?: string[]; error?: string } => {
  const intervals = SCALE_INTERVALS[settings.scaleType];
  if (!intervals) return { error: "Unsupported scale type." };
  const startOct = findStartOctave(settings.root, settings.lowestNote, settings.highestNote, settings.octaveSpan);
  if (startOct === undefined) return { error: "Selected range is too small for this scale." };

  const template = buildScalePitchClasses(settings.root, settings.scaleType, intervals);
  const asc: string[] = [];

  for (let oct = 0; oct < settings.octaveSpan; oct += 1) {
    for (let i = 0; i < template.length - 1; i += 1) {
      const degree = template[i];
      asc.push(`${degree.pitchClass}${startOct + oct + degree.octaveOffset}`);
    }
  }

  const top = template[template.length - 1];
  asc.push(`${top.pitchClass}${startOct + settings.octaveSpan - 1 + top.octaveOffset}`);

  if (settings.direction === "Ascending") return { notes: asc };
  if (settings.direction === "Descending") return { notes: [...asc].reverse() };
  return { notes: [...asc, ...[...asc].reverse().slice(1)] };
};

export const generateScaleExercise = (settings: ScaleSettings): GenerateResult => {
  const err = validateScaleSettings(settings);
  if (err) return { error: err };

  const built = buildScaleNotes(settings);
  if (built.error || !built.notes) return { error: built.error ?? "Unable to generate scale." };

  const degreeLabels = buildScaleDegreeLabels(settings.scaleType, settings.octaveSpan, settings.direction);

  const events: MusicEvent[] = built.notes.map((pitch, idx) => {
    const labels: string[] = [];
    if (settings.showNoteNames) labels.push(pitch);
    if (settings.showScaleDegrees && degreeLabels[idx]) labels.push(degreeLabels[idx]);
    return { kind: "note", pitch, duration: settings.noteValue, lyrics: labels.length ? labels : undefined };
  });

  const exercise: Exercise = {
    id: uid(),
    type: "scale",
    title: `${settings.root} ${settings.scaleType} Scale - ${settings.octaveSpan} Octaves - ${settings.direction}`,
    tempo: "80",
    timeSignature: settings.timeSignature,
    keySignature: scaleKeySignatureLabel(settings.root, settings.scaleType),
    clef: "treble",
    metadata: {
      root: settings.root,
      scaleType: settings.scaleType,
      octaveSpan: settings.octaveSpan,
      direction: settings.direction,
      range: `${settings.lowestNote}-${settings.highestNote}`
    },
    measures: chunkIntoMeasures(events, settings.timeSignature)
  };

  return { exercise };
};
