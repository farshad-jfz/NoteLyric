import { DurationName, Measure, MusicEvent, TimeSignature } from "@/lib/music/models";
import { durationToUnits, timeSignatureToQuarterBeats, toUnits } from "@/lib/music/rhythmUtils";

export const chunkIntoMeasures = (events: MusicEvent[], timeSignature: TimeSignature): Measure[] => {
  const measureUnits = toUnits(timeSignatureToQuarterBeats(timeSignature));
  const measures: Measure[] = [];
  let current: MusicEvent[] = [];
  let remaining = measureUnits;

  for (const event of events) {
    const units = durationToUnits(event.duration as DurationName);
    if (units > remaining) {
      measures.push({ events: current });
      current = [];
      remaining = measureUnits;
    }
    current.push(event);
    remaining -= units;
    if (remaining === 0) {
      measures.push({ events: current });
      current = [];
      remaining = measureUnits;
    }
  }

  if (current.length) measures.push({ events: current });
  return measures;
};

export const uid = () => Math.random().toString(36).slice(2, 10);
