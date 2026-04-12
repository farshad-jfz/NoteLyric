import { describe, expect, it } from "vitest";

import type { Exercise, MusicEvent, TimeSignature } from "@/lib/music/models";
import { exerciseToMusicXml } from "@/lib/music/xmlBuilder";

const beamSequence = (xml: string): string[] => [...xml.matchAll(/<beam number="1">(.*?)<\/beam>/g)].map((match) => match[1]);

const makeExercise = (timeSignature: TimeSignature, events: MusicEvent[]): Exercise => ({
  id: "beam-test",
  type: "sight-reading",
  title: "Beam Test",
  timeSignature,
  clef: "treble",
  metadata: {},
  measures: [{ events }]
});

const eighthRun = (count: number): MusicEvent[] =>
  Array.from({ length: count }, (_, index) => ({
    kind: "note",
    pitch: index % 2 === 0 ? "C4" : "D4",
    duration: "eighth"
  }));

describe("MusicXML beaming", () => {
  it("groups continuous eighth notes into half-measure beams in 4/4", () => {
    const xml = exerciseToMusicXml(makeExercise("4/4", eighthRun(8)));
    expect(beamSequence(xml)).toEqual(["begin", "continue", "continue", "end", "begin", "continue", "continue", "end"]);
  });

  it("breaks beams at rests and resumes on the next valid group", () => {
    const xml = exerciseToMusicXml(makeExercise("4/4", [
      { kind: "note", pitch: "C4", duration: "eighth" },
      { kind: "note", pitch: "D4", duration: "eighth" },
      { kind: "rest", duration: "quarter" },
      { kind: "note", pitch: "E4", duration: "eighth" },
      { kind: "note", pitch: "F4", duration: "eighth" },
      { kind: "rest", duration: "quarter" }
    ]));

    expect(beamSequence(xml)).toEqual(["begin", "end", "begin", "end"]);
  });

  it("uses compound-meter grouping in 6/8", () => {
    const xml = exerciseToMusicXml(makeExercise("6/8", eighthRun(6)));
    expect(beamSequence(xml)).toEqual(["begin", "continue", "end", "begin", "continue", "end"]);
  });

  it("groups the first two beats together in 3/4 before breaking for beat three", () => {
    const xml = exerciseToMusicXml(makeExercise("3/4", eighthRun(6)));
    expect(beamSequence(xml)).toEqual(["begin", "continue", "continue", "end", "begin", "end"]);
  });
});
