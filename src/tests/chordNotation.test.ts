import { describe, expect, it } from "vitest";

import { generateChordExercise } from "@/lib/generators/chords";
import { defaultChordSettings } from "@/lib/presets/presets";

const notePitches = (settings: Partial<typeof defaultChordSettings>): string[] => {
  const result = generateChordExercise({
    ...defaultChordSettings,
    ...settings
  });

  expect(result.error).toBeUndefined();
  expect(result.exercise).toBeDefined();

  return result.exercise!.measures.flatMap((measure) =>
    measure.events.flatMap((event) => (event.kind === "note" ? [event.pitch] : []))
  );
};

describe("chord notation", () => {
  it("spells B major arpeggios with sharps instead of flats", () => {
    expect(notePitches({ root: "B", chordType: "Major triad", pattern: "Ascending arpeggio" })).toEqual([
      "B4",
      "D#5",
      "F#5",
      "B5"
    ]);
  });

  it("spells C# major triads with E# instead of F natural", () => {
    expect(notePitches({ root: "C#", chordType: "Major triad", pattern: "Ascending arpeggio" })).toEqual([
      "C#4",
      "E#4",
      "G#4",
      "C#5"
    ]);
  });

  it("keeps flat spellings in Bb minor 7 block chords", () => {
    const result = generateChordExercise({
      ...defaultChordSettings,
      root: "Bb",
      chordType: "Minor 7",
      pattern: "Block chord"
    });

    expect(result.error).toBeUndefined();
    expect(result.exercise?.measures[0]?.events[0]).toMatchObject({
      kind: "note",
      pitch: "Bb4",
      chord: ["Bb4", "Db5", "F5", "Ab5"]
    });
  });
});
