import { describe, expect, it } from "vitest";

import { generateScaleExercise } from "@/lib/generators/scales";
import { exerciseToMusicXml } from "@/lib/music/xmlBuilder";
import { defaultScaleSettings } from "@/lib/presets/presets";

const notePitches = (scaleType: string, root: string): string[] => {
  const result = generateScaleExercise({
    ...defaultScaleSettings,
    root,
    scaleType,
    direction: "Ascending"
  });

  expect(result.error).toBeUndefined();
  expect(result.exercise).toBeDefined();

  return result.exercise!.measures.flatMap((measure) =>
    measure.events.flatMap((event) => (event.kind === "note" ? [event.pitch] : []))
  );
};

describe("scale notation", () => {
  it("spells B major to match its key signature", () => {
    const result = generateScaleExercise({
      ...defaultScaleSettings,
      root: "B",
      scaleType: "Major",
      direction: "Ascending"
    });

    expect(result.exercise?.keySignature).toBe("B major");
    expect(notePitches("Major", "B")).toEqual(["B4", "C#5", "D#5", "E5", "F#5", "G#5", "A#5", "B5"]);

    const xml = exerciseToMusicXml(result.exercise!);
    expect(xml).toContain("<fifths>5</fifths>");
    expect(xml).not.toContain("<step>E</step><alter>-1</alter>");
    expect(xml).not.toContain("<step>A</step><alter>-1</alter>");
  });

  it("spells Bb major with flats instead of enharmonic sharps", () => {
    const result = generateScaleExercise({
      ...defaultScaleSettings,
      root: "Bb",
      scaleType: "Major",
      direction: "Ascending"
    });

    expect(result.exercise?.keySignature).toBe("Bb major");
    expect(notePitches("Major", "Bb")).toEqual(["Bb4", "C5", "D5", "Eb5", "F5", "G5", "A5", "Bb5"]);

    const xml = exerciseToMusicXml(result.exercise!);
    expect(xml).toContain("<fifths>-2</fifths>");
    expect(xml).not.toContain("<step>A</step><alter>1</alter>");
  });

  it("uses the relative minor key signature for D harmonic minor", () => {
    const result = generateScaleExercise({
      ...defaultScaleSettings,
      root: "D",
      scaleType: "Harmonic Minor",
      direction: "Ascending"
    });

    expect(result.exercise?.keySignature).toBe("D minor");
    expect(notePitches("Harmonic Minor", "D")).toEqual(["D4", "E4", "F4", "G4", "A4", "Bb4", "C#5", "D5"]);

    const xml = exerciseToMusicXml(result.exercise!);
    expect(xml).toContain("<fifths>-1</fifths>");
    expect(xml).toContain("<step>B</step><alter>-1</alter>");
    expect(xml).toContain("<step>C</step><alter>1</alter>");
  });
});
