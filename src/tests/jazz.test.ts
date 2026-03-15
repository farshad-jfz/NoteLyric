import { describe, expect, it } from "vitest";

import { generateJazzExercise } from "@/lib/generators/jazz";
import { buildJazzProgression, getValidJazzBarOptions } from "@/lib/music/jazz";
import { defaultJazzSettings } from "@/lib/presets/presets";
import { validateJazzSettings } from "@/lib/validation/jazzValidation";

const noteEvents = (result: ReturnType<typeof generateJazzExercise>) =>
  result.exercise?.measures.flatMap((measure) => measure.events.flatMap((event) => (event.kind === "note" ? [event] : []))) ?? [];

describe("jazz practice", () => {
  it("builds a transposed II-V-I progression in C major", () => {
    const progression = buildJazzProgression("C", "II-V-I", 6);
    expect(progression.key).toBe("C major");
    expect(progression.measures.map((measure) => measure.chord.symbol)).toEqual(["Dm7", "G7", "Cmaj7", "Dm7", "G7", "Cmaj7"]);
  });

  it("builds a minor II-V-I progression in A minor", () => {
    const progression = buildJazzProgression("A", "Minor II-V-I", 6);
    expect(progression.key).toBe("A minor");
    expect(progression.measures.slice(0, 3).map((measure) => measure.chord.symbol)).toEqual(["Bm7b5", "E7", "Am7"]);
  });

  it("limits 12-bar blues to valid bar counts", () => {
    expect(getValidJazzBarOptions("12-Bar Blues")).toEqual([12]);
    expect(getValidJazzBarOptions("Turnaround")).toEqual([4, 8, 12, 16]);
  });

  it("rejects guide-tone settings when the selected range has no guide tones", () => {
    const error = validateJazzSettings({
      ...defaultJazzSettings,
      mode: "guide-tones",
      progressionType: "II-V-I",
      numBars: 6,
      lowestNote: "C4",
      highestNote: "D4"
    });

    expect(error).toBe("The selected range must include at least one guide tone for each chord in this progression.");
  });

  it("rejects bebop settings when the range is too narrow for passing tones", () => {
    const error = validateJazzSettings({
      ...defaultJazzSettings,
      mode: "bebop-lines",
      progressionType: "II-V-I",
      numBars: 6,
      lowestNote: "C4",
      highestNote: "E4"
    });

    expect(error).toBe("Bebop Lines needs a wider range so passing tones and approach notes can fit.");
  });

  it("generates guide-tone practice with guide labels on strong notes", () => {
    const result = generateJazzExercise({
      ...defaultJazzSettings,
      mode: "guide-tones",
      progressionType: "II-V-I",
      numBars: 6,
      seed: "10101"
    });

    expect(result.error).toBeUndefined();
    expect(result.exercise?.measureAnnotations?.length).toBe(6);

    const firstLabels = result.exercise?.measures.map((measure) => {
      const firstNote = measure.events.find((event) => event.kind === "note");
      return firstNote?.kind === "note" ? firstNote.lyrics?.[0] : undefined;
    });

    expect(firstLabels?.every((label) => label === "guide")).toBe(true);
  });

  it("generates bebop lines with at least one chromatic approach at advanced difficulty", () => {
    const result = generateJazzExercise({
      ...defaultJazzSettings,
      mode: "bebop-lines",
      progressionType: "Turnaround",
      numBars: 8,
      difficulty: "Advanced",
      swingFeel: true,
      seed: "20202"
    });

    expect(result.error).toBeUndefined();
    expect(noteEvents(result).some((event) => event.lyrics?.includes("approach"))).toBe(true);
  });
});
