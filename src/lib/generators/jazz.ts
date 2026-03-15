import { Exercise, GenerateResult, DurationName } from "@/lib/music/models";
import {
  buildJazzProgression,
  ChordSymbol,
  estimatedTempo,
  JazzDifficulty,
  JazzMode,
  JazzRole,
  modeLabel,
  progressionToDisplay,
  roleToLabel
} from "@/lib/music/jazz";
import { midiToSharpName, parsePitch, transposePitch } from "@/lib/music/noteUtils";
import { durationToQuarterLength } from "@/lib/music/rhythmUtils";
import { chunkIntoMeasures, uid } from "@/lib/generators/shared";
import { JazzSettings, validateJazzSettings } from "@/lib/validation/jazzValidation";

const MAX_LEAP_BY_DIFFICULTY: Record<JazzDifficulty, number> = {
  Beginner: 5,
  Intermediate: 8,
  Advanced: 12
};

type Slot = {
  duration: DurationName;
  beatPosition: number;
};

type PlannedEvent = {
  pitch: string;
  duration: DurationName;
  beatPosition: number;
  role: JazzRole;
};

type GeneratedMeasure = {
  chord: ChordSymbol;
  slots: Slot[];
  events: PlannedEvent[];
};

type RhythmMemory = {
  slots?: Slot[];
  motifSteps?: number[];
  motifRhythm?: Slot[];
};

type Rng = {
  next: () => number;
  chance: (probability: number) => boolean;
  pick: <T>(items: readonly T[]) => T;
  weighted: <T>(items: Array<{ item: T; weight: number }>) => T;
};

const RHYTHM_TEMPLATES: Record<JazzSettings["timeSignature"], Record<JazzDifficulty, DurationName[][]>> = {
  "2/4": {
    Beginner: [["half"], ["quarter", "quarter"]],
    Intermediate: [["quarter", "eighth", "eighth"], ["eighth", "eighth", "quarter"], ["quarter", "quarter"]],
    Advanced: [["eighth", "eighth", "eighth", "eighth"], ["quarter", "eighth", "eighth"], ["eighth", "eighth", "quarter"]]
  },
  "3/4": {
    Beginner: [["quarter", "quarter", "quarter"], ["half", "quarter"], ["quarter", "half"]],
    Intermediate: [["quarter", "eighth", "eighth", "quarter"], ["eighth", "eighth", "quarter", "quarter"], ["quarter", "quarter", "eighth", "eighth"]],
    Advanced: [["eighth", "eighth", "quarter", "eighth", "eighth"], ["quarter", "eighth", "eighth", "eighth", "eighth"], ["eighth", "eighth", "eighth", "eighth", "quarter"]]
  },
  "4/4": {
    Beginner: [["quarter", "quarter", "quarter", "quarter"], ["half", "half"], ["half", "quarter", "quarter"], ["quarter", "quarter", "half"]],
    Intermediate: [
      ["quarter", "eighth", "eighth", "quarter", "quarter"],
      ["eighth", "eighth", "quarter", "eighth", "eighth", "quarter"],
      ["half", "eighth", "eighth", "quarter"],
      ["quarter", "quarter", "eighth", "eighth", "quarter"]
    ],
    Advanced: [
      ["eighth", "eighth", "eighth", "eighth", "eighth", "eighth", "eighth", "eighth"],
      ["quarter", "eighth", "eighth", "eighth", "eighth", "quarter"],
      ["eighth", "eighth", "quarter", "eighth", "eighth", "quarter"],
      ["eighth", "eighth", "eighth", "eighth", "quarter", "quarter"]
    ]
  },
  "6/8": {
    Beginner: [["dotted quarter", "dotted quarter"], ["quarter", "eighth", "dotted quarter"], ["dotted quarter", "quarter", "eighth"]],
    Intermediate: [["quarter", "eighth", "quarter", "eighth"], ["eighth", "eighth", "quarter", "quarter"], ["dotted quarter", "eighth", "eighth", "quarter"]],
    Advanced: [["eighth", "eighth", "eighth", "eighth", "eighth", "eighth"], ["quarter", "eighth", "eighth", "eighth", "quarter"], ["eighth", "eighth", "quarter", "eighth", "eighth"]]
  }
};

const hashSeed = (value: string): number => {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const createRng = (seed: string): Rng => {
  let state = hashSeed(seed) || 1;
  const next = () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    chance: (probability: number) => next() < probability,
    pick: <T,>(items: readonly T[]) => items[Math.floor(next() * items.length)] as T,
    weighted: <T,>(items: Array<{ item: T; weight: number }>) => {
      const total = items.reduce((sum, entry) => sum + Math.max(entry.weight, 0.001), 0);
      let cursor = next() * total;
      for (const entry of items) {
        cursor -= Math.max(entry.weight, 0.001);
        if (cursor <= 0) return entry.item;
      }
      return items[items.length - 1].item;
    }
  };
};

const pitchClassOf = (pitch: string): string => pitch.replace(/\d+$/, "");

const buildSlots = (template: DurationName[]): Slot[] => {
  let beatPosition = 1;
  return template.map((duration) => {
    const slot = { duration, beatPosition };
    beatPosition += durationToQuarterLength(duration);
    return slot;
  });
};

const strongBeats = (timeSignature: JazzSettings["timeSignature"]): number[] => {
  if (timeSignature === "4/4") return [1, 3];
  if (timeSignature === "6/8") return [1, 2.5];
  return [1];
};

const strongSlotIndexes = (slots: Slot[], timeSignature: JazzSettings["timeSignature"]): number[] => {
  const beats = strongBeats(timeSignature);
  return slots.flatMap((slot, index) => (beats.some((beat) => Math.abs(slot.beatPosition - beat) < 0.01) ? [index] : []));
};

const pitchCandidatesForClasses = (pitchClasses: readonly string[], low: string, high: string): string[] => {
  const lowMidi = parsePitch(low).midi;
  const highMidi = parsePitch(high).midi;
  const out: string[] = [];

  for (let octave = 2; octave <= 7; octave += 1) {
    for (const pitchClass of pitchClasses) {
      const pitch = `${pitchClass}${octave}`;
      const midi = parsePitch(pitch).midi;
      if (midi >= lowMidi && midi <= highMidi) out.push(pitch);
    }
  }

  return out;
};

const rangeCenterPitch = (settings: JazzSettings): string => {
  const lowMidi = parsePitch(settings.lowestNote).midi;
  const highMidi = parsePitch(settings.highestNote).midi;
  return midiToSharpName(Math.round((lowMidi + highMidi) / 2));
};

const choosePitchNear = (
  pitchClasses: readonly string[],
  referencePitch: string,
  settings: JazzSettings,
  rng: Rng,
  preferredPitchClasses: readonly string[] = []
): string => {
  const candidates = pitchCandidatesForClasses(pitchClasses, settings.lowestNote, settings.highestNote);
  const referenceMidi = parsePitch(referencePitch).midi;
  const maxLeap = MAX_LEAP_BY_DIFFICULTY[settings.difficulty];

  const weighted = candidates.map((candidate) => {
    const midi = parsePitch(candidate).midi;
    const distance = Math.abs(midi - referenceMidi);
    let weight = 1 / (1 + distance);
    if (distance <= 2) weight *= 2.8;
    else if (distance <= maxLeap) weight *= 1.5;
    else weight *= 0.2;
    if (preferredPitchClasses.includes(pitchClassOf(candidate))) weight *= 1.5;
    return { item: candidate, weight };
  });

  return rng.weighted(weighted.length ? weighted : [{ item: referencePitch, weight: 1 }]);
};

const nearestScaleStep = (
  currentPitch: string,
  targetPitch: string,
  chord: ChordSymbol,
  settings: JazzSettings,
  rng: Rng,
  slotsUntilTarget: number,
  mode: JazzMode
): PlannedEvent => {
  const currentMidi = parsePitch(currentPitch).midi;
  const targetMidi = parsePitch(targetPitch).midi;

  if (mode === "bebop-lines" && settings.difficulty !== "Beginner" && slotsUntilTarget <= 1) {
    const approachCandidates = [transposePitch(targetPitch, -1), transposePitch(targetPitch, 1)].filter((pitch) => {
      const midi = parsePitch(pitch).midi;
      const lowMidi = parsePitch(settings.lowestNote).midi;
      const highMidi = parsePitch(settings.highestNote).midi;
      return midi >= lowMidi && midi <= highMidi && midi !== targetMidi;
    });

    if (approachCandidates.length) {
      const chosen = choosePitchNear(approachCandidates.map(pitchClassOf), currentPitch, settings, rng, [pitchClassOf(targetPitch)]);
      return {
        pitch: chosen,
        duration: "quarter",
        beatPosition: 1,
        role: "chromatic-approach"
      };
    }
  }

  const scaleCandidates = pitchCandidatesForClasses(chord.scaleTones, settings.lowestNote, settings.highestNote).filter((pitch) => pitch !== currentPitch);
  const direction = targetMidi === currentMidi ? (rng.chance(0.5) ? 1 : -1) : Math.sign(targetMidi - currentMidi);

  const weighted = scaleCandidates.map((candidate) => {
    const midi = parsePitch(candidate).midi;
    const movement = Math.abs(midi - currentMidi);
    const towardTarget = Math.abs(targetMidi - midi) < Math.abs(targetMidi - currentMidi);
    let weight = movement <= 2 ? 4 : movement <= 4 ? 2 : 0.7;
    if ((midi - currentMidi) * direction > 0) weight *= 1.8;
    if (towardTarget) weight *= 1.6;
    if (slotsUntilTarget <= 1 && Math.abs(targetMidi - midi) <= 2) weight *= 2;
    if (chord.chordTones.includes(pitchClassOf(candidate))) weight *= 1.15;
    return { item: candidate, weight };
  });

  const chosen = rng.weighted(weighted.length ? weighted : [{ item: targetPitch, weight: 1 }]);
  const chosenPitchClass = pitchClassOf(chosen);

  return {
    pitch: chosen,
    duration: "quarter",
    beatPosition: 1,
    role: chord.chordTones.includes(chosenPitchClass) ? "chord-tone" : settings.difficulty === "Beginner" ? "scale-tone" : "passing-tone"
  };
};

const selectAnchorPitchClasses = (mode: JazzMode, chord: ChordSymbol, strongIndex: number): string[] => {
  if (mode === "guide-tones") return chord.guideTones;
  if (mode === "voice-leading") return strongIndex === 0 ? [...chord.guideTones, ...chord.chordTones] : chord.guideTones;
  if (mode === "target-tones") return strongIndex === 0 ? [chord.guideTones[0], chord.guideTones[1], chord.chordTones[2]] : chord.chordTones;
  if (mode === "bebop-lines") return strongIndex === 0 ? [chord.guideTones[0], chord.guideTones[1], chord.chordTones[0], chord.chordTones[2]] : chord.chordTones;
  return strongIndex === 0 ? chord.chordTones : [...chord.guideTones, ...chord.chordTones];
};

const anchorRole = (mode: JazzMode, chord: ChordSymbol, pitch: string): JazzRole => {
  const pitchClass = pitchClassOf(pitch);
  if (mode === "guide-tones") return "guide-tone";
  if (mode === "target-tones") return "target-tone";
  if (mode === "bebop-lines") return chord.guideTones.includes(pitchClass) ? "target-tone" : "chord-tone";
  if (mode === "voice-leading") return chord.guideTones.includes(pitchClass) ? "guide-tone" : "chord-tone";
  return "chord-tone";
};

const chooseTemplate = (settings: JazzSettings, mode: JazzMode, rng: Rng): DurationName[] => {
  const templates = RHYTHM_TEMPLATES[settings.timeSignature][settings.difficulty];

  if (mode === "guide-tones") {
    const simpler = templates.filter((template) => template.filter((duration) => duration === "eighth").length <= 2);
    return rng.pick((simpler.length ? simpler : templates) as readonly DurationName[][]);
  }

  if (mode === "bebop-lines") {
    const denser = templates.filter((template) => template.filter((duration) => duration === "eighth").length >= 4);
    return rng.pick((denser.length ? denser : templates) as readonly DurationName[][]);
  }

  if (mode === "voice-leading") {
    const moderate = templates.filter((template) => template.length <= 5);
    return rng.pick((moderate.length ? moderate : templates) as readonly DurationName[][]);
  }

  return rng.pick(templates as readonly DurationName[][]);
};

const buildStandardMeasure = (
  chord: ChordSymbol,
  settings: JazzSettings,
  mode: JazzMode,
  previousPitch: string,
  rng: Rng,
  forcedSlots?: Slot[]
): GeneratedMeasure => {
  const slots = forcedSlots ?? buildSlots(chooseTemplate(settings, mode, rng));
  const strongIndexes = strongSlotIndexes(slots, settings.timeSignature);
  const anchors = new Map<number, PlannedEvent>();
  let reference = previousPitch;

  for (const strongIndex of strongIndexes.length ? strongIndexes : [0]) {
    const choices = selectAnchorPitchClasses(mode, chord, strongIndex);
    const pitch = choosePitchNear(choices, reference, settings, rng, chord.guideTones);
    anchors.set(strongIndex, {
      pitch,
      duration: slots[strongIndex].duration,
      beatPosition: slots[strongIndex].beatPosition,
      role: anchorRole(mode, chord, pitch)
    });
    reference = pitch;
  }

  const events: PlannedEvent[] = [];
  let currentPitch = previousPitch;

  for (let index = 0; index < slots.length; index += 1) {
    const slot = slots[index];
    const anchor = anchors.get(index);
    if (anchor) {
      events.push({ ...anchor, duration: slot.duration, beatPosition: slot.beatPosition });
      currentPitch = anchor.pitch;
      continue;
    }

    const nextAnchorIndex = Array.from(anchors.keys()).find((candidate) => candidate > index);
    const nextAnchor = nextAnchorIndex === undefined ? undefined : anchors.get(nextAnchorIndex);
    const fallbackPitch = choosePitchNear(chord.chordTones, currentPitch, settings, rng, chord.guideTones);
    const targetPitch = nextAnchor?.pitch ?? fallbackPitch;
    const connector = nearestScaleStep(currentPitch, targetPitch, chord, settings, rng, nextAnchorIndex === undefined ? 2 : nextAnchorIndex - index, mode);
    events.push({ ...connector, duration: slot.duration, beatPosition: slot.beatPosition });
    currentPitch = connector.pitch;
  }

  return { chord, slots, events };
};

const scalePoolForChord = (chord: ChordSymbol, settings: JazzSettings): string[] =>
  pitchCandidatesForClasses(chord.scaleTones, settings.lowestNote, settings.highestNote);

const moveByScaleStep = (
  currentPitch: string,
  chord: ChordSymbol,
  stepOffset: number,
  settings: JazzSettings
): string => {
  const pool = scalePoolForChord(chord, settings);
  if (!pool.length) return currentPitch;
  const currentMidi = parsePitch(currentPitch).midi;
  const closestIndex = pool.reduce((bestIndex, pitch, index) => {
    const bestDistance = Math.abs(parsePitch(pool[bestIndex]).midi - currentMidi);
    const distance = Math.abs(parsePitch(pitch).midi - currentMidi);
    return distance < bestDistance ? index : bestIndex;
  }, 0);
  const targetIndex = Math.min(pool.length - 1, Math.max(0, closestIndex + stepOffset));
  return pool[targetIndex] ?? currentPitch;
};

const buildMotifMeasures = (
  chords: ChordSymbol[],
  settings: JazzSettings,
  startingPitch: string,
  rng: Rng,
  memory: RhythmMemory
): GeneratedMeasure[] => {
  const motifSteps = memory.motifSteps ?? (rng.chance(0.5) ? [1, 1, -1] : [1, 2, -1]);
  const motifSlots = memory.motifRhythm ?? buildSlots(chooseTemplate({ ...settings, difficulty: settings.difficulty === "Advanced" ? "Intermediate" : settings.difficulty }, "motif-development", rng));
  memory.motifSteps = motifSteps;
  memory.motifRhythm = motifSlots;

  const measures: GeneratedMeasure[] = [];
  let previousPitch = startingPitch;

  for (const [measureIndex, chord] of chords.entries()) {
    const slots = motifSlots.map((slot) => ({ ...slot }));
    const basePitch = choosePitchNear([chord.chordTones[0], chord.chordTones[1], chord.chordTones[2]], previousPitch, settings, rng, chord.guideTones);
    const events: PlannedEvent[] = [];
    let currentPitch = basePitch;

    for (let index = 0; index < slots.length; index += 1) {
      const slot = slots[index];
      if (index === 0) {
        events.push({ pitch: currentPitch, duration: slot.duration, beatPosition: slot.beatPosition, role: "target-tone" });
        continue;
      }

      const rawStep = motifSteps[(index - 1) % motifSteps.length];
      const variation = measureIndex === 0 ? rawStep : measureIndex % 2 === 0 ? rawStep : rawStep * -1;
      currentPitch = moveByScaleStep(currentPitch, chord, variation, settings);
      events.push({
        pitch: currentPitch,
        duration: slot.duration,
        beatPosition: slot.beatPosition,
        role: chord.chordTones.includes(pitchClassOf(currentPitch)) ? "chord-tone" : "scale-tone"
      });
    }

    previousPitch = events[events.length - 1]?.pitch ?? previousPitch;
    measures.push({ chord, slots, events });
  }

  return measures;
};

const buildCallResponseMeasures = (
  chords: ChordSymbol[],
  settings: JazzSettings,
  startingPitch: string,
  rng: Rng,
  memory: RhythmMemory
): GeneratedMeasure[] => {
  const measures: GeneratedMeasure[] = [];
  let previousPitch = startingPitch;
  let callSlots: Slot[] | undefined = memory.slots;

  for (const [measureIndex, chord] of chords.entries()) {
    const isResponse = measureIndex % 2 === 1;
    const measure = buildStandardMeasure(chord, settings, isResponse ? "target-tones" : "call-response", previousPitch, rng, isResponse ? callSlots : undefined);

    if (!isResponse) callSlots = measure.slots;
    previousPitch = measure.events[measure.events.length - 1]?.pitch ?? previousPitch;
    measures.push(measure);
  }

  memory.slots = callSlots;
  return measures;
};

const buildMeasures = (settings: JazzSettings, rng: Rng): GeneratedMeasure[] => {
  const progression = buildJazzProgression(settings.key, settings.progressionType, settings.numBars);
  const startingPitch = rangeCenterPitch(settings);

  if (settings.mode === "motif-development") {
    return buildMotifMeasures(progression.measures.map((measure) => measure.chord), settings, startingPitch, rng, {});
  }

  if (settings.mode === "call-response") {
    return buildCallResponseMeasures(progression.measures.map((measure) => measure.chord), settings, startingPitch, rng, {});
  }

  const measures: GeneratedMeasure[] = [];
  let previousPitch = startingPitch;

  for (const measure of progression.measures) {
    const generated = buildStandardMeasure(measure.chord, settings, settings.mode, previousPitch, rng);
    previousPitch = generated.events[generated.events.length - 1]?.pitch ?? previousPitch;
    measures.push(generated);
  }

  return measures;
};

const validateContour = (events: PlannedEvent[], difficulty: JazzDifficulty): boolean => {
  const maxLeap = MAX_LEAP_BY_DIFFICULTY[difficulty];
  let repeatedCount = 1;
  let largeLeapChain = 0;

  for (let index = 1; index < events.length; index += 1) {
    const interval = Math.abs(parsePitch(events[index].pitch).midi - parsePitch(events[index - 1].pitch).midi);
    if (interval === 0) repeatedCount += 1;
    else repeatedCount = 1;

    if (repeatedCount >= 4) return false;
    if (interval > maxLeap) return false;

    if (interval >= 8) largeLeapChain += 1;
    else largeLeapChain = 0;
    if (largeLeapChain >= 2) return false;
  }

  return true;
};

const validateModeBehavior = (measures: GeneratedMeasure[], settings: JazzSettings): boolean => {
  const strongChecks = measures.every((measure) => {
    const strongIndexes = strongSlotIndexes(measure.slots, settings.timeSignature);
    const strongEvents = strongIndexes.map((index) => measure.events[index]).filter(Boolean);
    if (!strongEvents.length) return true;

    if (settings.mode === "guide-tones") {
      return strongEvents.every((event) => measure.chord.guideTones.includes(pitchClassOf(event.pitch)));
    }

    if (settings.mode === "target-tones" || settings.mode === "ii-v-i" || settings.mode === "call-response") {
      return strongEvents.every((event) => measure.chord.chordTones.includes(pitchClassOf(event.pitch)));
    }

    if (settings.mode === "bebop-lines") {
      return strongEvents.every((event) => measure.chord.chordTones.includes(pitchClassOf(event.pitch)));
    }

    if (settings.mode === "voice-leading") {
      return strongEvents.every((event) => measure.chord.chordTones.includes(pitchClassOf(event.pitch)));
    }

    return true;
  });

  if (!strongChecks) return false;

  if (settings.mode === "bebop-lines" && settings.difficulty !== "Beginner") {
    return measures.some((measure) => measure.events.some((event) => event.role === "chromatic-approach"));
  }

  if (settings.mode === "call-response") {
    for (let index = 1; index < measures.length; index += 2) {
      const call = measures[index - 1];
      const response = measures[index];
      if (call.slots.length !== response.slots.length) return false;
      const sameRhythm = call.slots.every((slot, slotIndex) => slot.duration === response.slots[slotIndex].duration);
      if (!sameRhythm) return false;
    }
  }

  if (settings.mode === "motif-development" && measures.length >= 2) {
    const first = measures[0].events.slice(0, Math.min(4, measures[0].events.length));
    const second = measures[1].events.slice(0, Math.min(4, measures[1].events.length));
    if (first.length < 2 || second.length < 2) return false;
    const firstDurations = first.map((event) => event.duration).join("|");
    const secondDurations = second.map((event) => event.duration).join("|");
    return firstDurations === secondDurations;
  }

  return true;
};

const serializeMeasures = (measures: GeneratedMeasure[]): Exercise["measures"] =>
  chunkIntoMeasures(
    measures.flatMap((measure) =>
      measure.events.map((event) => ({
        kind: "note" as const,
        pitch: event.pitch,
        duration: event.duration,
        lyrics: [roleToLabel(event.role)]
      }))
    ),
    "4/4"
  );

const buildExerciseFromMeasures = (measures: GeneratedMeasure[], settings: JazzSettings, seed: string): Exercise => {
  const progression = buildJazzProgression(settings.key, settings.progressionType, settings.numBars);
  const tempo = estimatedTempo(settings.difficulty, settings.swingFeel);

  return {
    id: uid(),
    type: "jazz",
    title: `${modeLabel(settings.mode)} - ${progression.name} - ${progression.key}`,
    tempo,
    timeSignature: settings.timeSignature,
    keySignature: progression.key,
    clef: "treble",
    metadata: {
      mode: modeLabel(settings.mode),
      progression: progression.name,
      key: progression.key,
      bars: settings.numBars,
      difficulty: settings.difficulty,
      swingFeel: settings.swingFeel,
      seed,
      tempo,
      range: `${settings.lowestNote}-${settings.highestNote}`
    },
    measureAnnotations: progression.measures.map((measure) => measure.chord.symbol),
    measures: chunkIntoMeasures(
      measures.flatMap((measure) =>
        measure.events.map((event) => ({
          kind: "note" as const,
          pitch: event.pitch,
          duration: event.duration,
          lyrics: [roleToLabel(event.role)]
        }))
      ),
      settings.timeSignature
    )
  };
};

const validateGeneratedMeasures = (measures: GeneratedMeasure[], settings: JazzSettings): boolean => {
  const allEvents = measures.flatMap((measure) => measure.events);
  const lowMidi = parsePitch(settings.lowestNote).midi;
  const highMidi = parsePitch(settings.highestNote).midi;

  if (allEvents.some((event) => {
    const midi = parsePitch(event.pitch).midi;
    return midi < lowMidi || midi > highMidi;
  })) {
    return false;
  }

  if (!validateContour(allEvents, settings.difficulty)) return false;
  return validateModeBehavior(measures, settings);
};

const simplifyDifficulty = (difficulty: JazzDifficulty): JazzDifficulty => {
  if (difficulty === "Advanced") return "Intermediate";
  if (difficulty === "Intermediate") return "Beginner";
  return "Beginner";
};

export const generateJazzExercise = (settings: JazzSettings): GenerateResult => {
  const error = validateJazzSettings(settings);
  if (error) return { error };

  const baseSeed = settings.seed.trim() || `${Date.now()}`;

  for (let attempt = 0; attempt < 7; attempt += 1) {
    const effectiveSettings = attempt < 5 ? settings : { ...settings, difficulty: simplifyDifficulty(settings.difficulty) };
    const rng = createRng(`${baseSeed}:${attempt}`);

    try {
      const measures = buildMeasures(effectiveSettings, rng);
      if (validateGeneratedMeasures(measures, effectiveSettings)) {
        return { exercise: buildExerciseFromMeasures(measures, effectiveSettings, baseSeed) };
      }
    } catch {
      // Retry with another attempt or simplified settings.
    }
  }

  return { error: "Unable to generate a musical jazz exercise for the selected settings. Try a wider range or an easier difficulty." };
};

export const previewJazzProgression = (settings: Pick<JazzSettings, "key" | "progressionType" | "numBars">): string =>
  progressionToDisplay(buildJazzProgression(settings.key, settings.progressionType, settings.numBars));



