import { DURATION_TO_QUARTERS } from "@/lib/music/constants";
import { DurationName, TimeSignature } from "@/lib/music/models";

export const timeSignatureToQuarterBeats = (ts: TimeSignature): number => {
  const [beats, beatValue] = ts.split("/").map(Number);
  return beats * (4 / beatValue);
};

export const durationToQuarterLength = (duration: DurationName): number => DURATION_TO_QUARTERS[duration];

export const toUnits = (quarters: number): number => Math.round(quarters * 2);

export const durationToUnits = (duration: DurationName): number => toUnits(durationToQuarterLength(duration));

export const buildFillableUnits = (durations: DurationName[], measureUnits: number): Set<number> => {
  const units = [...new Set(durations.map(durationToUnits))];
  const fillable = new Set<number>([0]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const cur of Array.from(fillable)) {
      for (const u of units) {
        const nxt = cur + u;
        if (nxt <= measureUnits && !fillable.has(nxt)) {
          fillable.add(nxt);
          changed = true;
        }
      }
    }
  }
  return fillable;
};
