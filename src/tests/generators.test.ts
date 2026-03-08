import { describe, expect, it } from "vitest";

import { generateChordExercise } from "@/lib/generators/chords";
import { generateScaleExercise } from "@/lib/generators/scales";
import { generateSightReadingExercise } from "@/lib/generators/sightReading";
import { defaultChordSettings, defaultScaleSettings, defaultSightSettings } from "@/lib/presets/presets";

describe("generators", () => {
  it("builds a major scale exercise", () => {
    const result = generateScaleExercise(defaultScaleSettings);
    expect(result.error).toBeUndefined();
    expect(result.exercise?.measures.length).toBeGreaterThan(0);
  });

  it("builds a minor arpeggio exercise", () => {
    const result = generateChordExercise({ ...defaultChordSettings, chordType: "Minor triad" });
    expect(result.error).toBeUndefined();
    expect(result.exercise?.title).toContain("Minor triad");
  });

  it("builds rhythmically complete sight reading exercise", () => {
    const result = generateSightReadingExercise(defaultSightSettings);
    expect(result.error).toBeUndefined();
    expect(result.exercise?.measures.length).toBe(defaultSightSettings.numBars);
  });
});
