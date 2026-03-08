import { LEAP_LIMITS, MAJOR_KEYS, MINOR_KEYS } from "@/lib/music/constants";
import { Exercise, GenerateResult, MusicEvent } from "@/lib/music/models";
import { parsePitch, scaleAccidentalMapFromFifths, keySignatureFifths, midiToSharpName } from "@/lib/music/noteUtils";
import { buildFillableUnits, durationToUnits, timeSignatureToQuarterBeats, toUnits } from "@/lib/music/rhythmUtils";
import { chunkIntoMeasures, uid } from "@/lib/generators/shared";
import { SightReadingSettings, validateSightReadingSettings } from "@/lib/validation/sightReadingValidation";

const choose = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const availableKeysForMode = (mode: SightReadingSettings["keyMode"]): string[] => {
  if (mode === "C Major / A Minor only") return ["C major", "A minor"];
  if (mode === "Major keys") return MAJOR_KEYS.map((k) => `${k} major`);
  if (mode === "Minor keys") return MINOR_KEYS.map((k) => `${k} minor`);
  return ["C major"];
};

const candidatePitches = (settings: SightReadingSettings): string[] => {
  const lowMidi = parsePitch(settings.lowestNote).midi;
  const highMidi = parsePitch(settings.highestNote).midi;

  if (settings.keyMode === "Chromatic / random accidentals") {
    const arr: string[] = [];
    for (let midi = lowMidi; midi <= highMidi; midi += 1) arr.push(midiToSharpName(midi));
    return arr;
  }

  const fifths = keySignatureFifths(settings.specificKey);
  const accidentalMap = scaleAccidentalMapFromFifths(fifths);

  const pitches: string[] = [];
  for (let midi = lowMidi; midi <= highMidi; midi += 1) {
    const p = midiToSharpName(midi);
    const { step, alter } = parsePitch(p);
    if ((accidentalMap[step] ?? 0) === alter) pitches.push(p);
  }
  return pitches;
};

const pickDuration = (
  remaining: number,
  allowedDurations: SightReadingSettings["allowedValues"],
  fillable: Set<number>,
  difficulty: SightReadingSettings["difficulty"]
) => {
  const options = allowedDurations.filter((d) => {
    const u = durationToUnits(d);
    return u <= remaining && fillable.has(remaining - u);
  });

  if (!options.length) return allowedDurations[0];

  if (difficulty === "Beginner") {
    const sorted = [...options].sort((a, b) => durationToUnits(b) - durationToUnits(a));
    return choose(sorted.slice(0, Math.max(1, Math.ceil(sorted.length * 0.7))));
  }
  if (difficulty === "Advanced") {
    const sorted = [...options].sort((a, b) => durationToUnits(a) - durationToUnits(b));
    return choose(sorted.slice(0, Math.max(1, Math.ceil(sorted.length * 0.7))));
  }

  return choose(options);
};

const chooseNextPitch = (
  candidates: string[],
  last?: string,
  beforeLast?: string,
  maxLeap?: number,
  repeated = true
): string => {
  if (!last) return choose(candidates);

  const lastMidi = parsePitch(last).midi;
  const filtered = candidates.filter((p) => {
    const dist = Math.abs(parsePitch(p).midi - lastMidi);
    if (!repeated && dist === 0) return false;
    return maxLeap === undefined ? true : dist <= maxLeap;
  });
  const pool = filtered.length ? filtered : [last];

  const scored = pool.map((p) => {
    const midi = parsePitch(p).midi;
    const dist = Math.abs(midi - lastMidi);
    let score = 1;
    if (dist <= 2) score += 8;
    else if (dist <= 4) score += 3;
    else if (dist >= 7) score *= 0.4;

    if (beforeLast) {
      const prev = parsePitch(beforeLast).midi;
      const prevDir = lastMidi - prev;
      const dir = midi - lastMidi;
      if (Math.abs(prevDir) >= 5) {
        if (prevDir * dir < 0) score *= 1.9;
        else if (Math.abs(dir) <= 2) score *= 1.5;
      }
    }
    return { p, score };
  });

  const total = scored.reduce((sum, s) => sum + s.score, 0);
  let r = Math.random() * total;
  for (const s of scored) {
    r -= s.score;
    if (r <= 0) return s.p;
  }
  return scored[scored.length - 1].p;
};

export const generateSightReadingExercise = (settings: SightReadingSettings): GenerateResult => {
  const err = validateSightReadingSettings(settings);
  if (err) return { error: err };

  const candidates = candidatePitches(settings);
  if (!candidates.length) return { error: "No pitches available for selected range/key." };

  const measureUnits = toUnits(timeSignatureToQuarterBeats(settings.timeSignature));
  const fillable = buildFillableUnits(settings.allowedValues, measureUnits);
  const maxLeap = LEAP_LIMITS[settings.maxLeap];

  const events: MusicEvent[] = [];
  let last: string | undefined;
  let beforeLast: string | undefined;

  const restChance = settings.difficulty === "Beginner" ? 0.05 : settings.difficulty === "Intermediate" ? 0.12 : 0.15;

  for (let bar = 0; bar < settings.numBars; bar += 1) {
    let remaining = measureUnits;
    while (remaining > 0) {
      const duration = pickDuration(remaining, settings.allowedValues, fillable, settings.difficulty);
      const units = durationToUnits(duration);
      remaining -= units;

      const makeRest = settings.allowRests && Math.random() < restChance;
      if (makeRest) {
        events.push({ kind: "rest", duration });
      } else {
        const p = chooseNextPitch(candidates, last, beforeLast, maxLeap, settings.repeatedNotes);
        events.push({ kind: "note", pitch: p, duration, lyric: settings.showNoteNames ? p : undefined });
        beforeLast = last;
        last = p;
      }
    }
  }

  const keyLabel = settings.keyMode === "Chromatic / random accidentals" ? "Chromatic" : settings.specificKey;

  const exercise: Exercise = {
    id: uid(),
    type: "sight-reading",
    title: `Sight Reading - ${keyLabel} - ${settings.numBars} Bars - ${settings.difficulty}`,
    timeSignature: settings.timeSignature,
    keySignature: settings.keyMode === "Chromatic / random accidentals" ? undefined : settings.specificKey,
    clef: "treble",
    metadata: {
      bars: settings.numBars,
      difficulty: settings.difficulty,
      maxLeap: settings.maxLeap,
      range: `${settings.lowestNote}-${settings.highestNote}`,
      keyMode: settings.keyMode
    },
    measures: chunkIntoMeasures(events, settings.timeSignature)
  };

  return { exercise };
};
