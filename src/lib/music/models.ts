export type ExerciseType = "scale" | "chord" | "sight-reading";
export type Clef = "treble";
export type TimeSignature = "2/4" | "3/4" | "4/4" | "6/8";
export type DurationName = "whole" | "half" | "quarter" | "eighth" | "dotted half" | "dotted quarter";

export type MusicEvent =
  | {
      kind: "note";
      pitch: string;
      duration: DurationName;
      dots?: number;
      lyric?: string;
      lyrics?: string[];
      chord?: string[];
    }
  | {
      kind: "rest";
      duration: DurationName;
      dots?: number;
    };

export type Measure = {
  events: MusicEvent[];
};

export type Exercise = {
  id: string;
  type: ExerciseType;
  title: string;
  tempo?: string;
  timeSignature: TimeSignature;
  keySignature?: string;
  clef: Clef;
  metadata: Record<string, string | number | boolean>;
  measures: Measure[];
};

export type GenerateResult = {
  exercise?: Exercise;
  error?: string;
};
