import type { DurationName } from "@/lib/music/models";

export type ScalePathStageId = "whole" | "half" | "quarter" | "eighth" | "sixteenth";

export type ScalePathStage = {
  id: ScalePathStageId;
  label: string;
  noteValue: Extract<DurationName, "whole" | "half" | "quarter" | "eighth" | "sixteenth">;
};

export type ScalePathLevel = {
  id: string;
  chapterId: string;
  key: string;
  scaleType: "Major";
  order: number;
};

export type ScalePathChapter = {
  id: string;
  name: string;
  order: number;
  levels: ScalePathLevel[];
};

export type ScalePathCheckpoint = {
  id: string;
  levelId: string;
  stageId: ScalePathStageId;
  stageLabel: string;
  noteValue: ScalePathStage["noteValue"];
  tempo: number;
  order: number;
};

export const SCALEPATH_TEMPOS = [60, 70, 80, 90, 100, 110, 120] as const;

export const SCALEPATH_STAGES: ScalePathStage[] = [
  { id: "whole", label: "Whole Notes", noteValue: "whole" },
  { id: "half", label: "Half Notes", noteValue: "half" },
  { id: "quarter", label: "Quarter Notes", noteValue: "quarter" },
  { id: "eighth", label: "Eighth Notes", noteValue: "eighth" },
  { id: "sixteenth", label: "Sixteenth Notes", noteValue: "sixteenth" }
];

const MAJOR_KEYS = ["C", "G", "F", "D", "Bb", "A", "Eb", "E", "Ab", "B", "Db", "Gb"] as const;

export const SCALEPATH_CHAPTERS: ScalePathChapter[] = [
  {
    id: "major-scales",
    name: "Major Scales",
    order: 1,
    levels: MAJOR_KEYS.map((key, index) => ({
      id: `${key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-major`,
      chapterId: "major-scales",
      key,
      scaleType: "Major",
      order: index + 1
    }))
  }
];

export const SCALEPATH_LEVELS = SCALEPATH_CHAPTERS.flatMap((chapter) => chapter.levels);

export const checkpointId = (levelId: string, stageId: ScalePathStageId, tempo: number): string => `${levelId}:${stageId}:${tempo}`;

export const checkpointsForLevel = (levelId: string): ScalePathCheckpoint[] =>
  SCALEPATH_STAGES.flatMap((stage, stageIndex) =>
    SCALEPATH_TEMPOS.map((tempo, tempoIndex) => ({
      id: checkpointId(levelId, stage.id, tempo),
      levelId,
      stageId: stage.id,
      stageLabel: stage.label,
      noteValue: stage.noteValue,
      tempo,
      order: stageIndex * SCALEPATH_TEMPOS.length + tempoIndex + 1
    }))
  );

export const currentChapter = SCALEPATH_CHAPTERS[0];

export const findLevel = (levelId: string): ScalePathLevel | undefined => SCALEPATH_LEVELS.find((level) => level.id === levelId);

export const nextLevelAfter = (levelId: string): ScalePathLevel | undefined => {
  const current = findLevel(levelId);
  if (!current) return undefined;
  return SCALEPATH_LEVELS.find((level) => level.order === current.order + 1);
};

