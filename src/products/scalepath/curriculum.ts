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
  scaleType: "Major" | "Natural Minor" | "Harmonic Minor" | "Melodic Minor" | "Blues";
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

const keySlug = (key: string): string => key.replace(/#/g, "-sharp").toLowerCase().replace(/[^a-z0-9]+/g, "-");

const scaleSlug = (scaleType: ScalePathLevel["scaleType"]): string => scaleType.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const buildLevels = (
  chapterId: string,
  scaleType: ScalePathLevel["scaleType"],
  keys: readonly string[],
  chapterOrder: number
): ScalePathLevel[] =>
  keys.map((key, index) => ({
    id: `${keySlug(key)}-${scaleSlug(scaleType)}`,
    chapterId,
    key,
    scaleType,
    order: (chapterOrder - 1) * keys.length + index + 1
  }));

const MAJOR_KEYS = ["C", "G", "F", "D", "Bb", "A", "Eb", "E", "Ab", "B", "Db", "Gb"] as const;
const MINOR_KEYS = ["A", "E", "D", "B", "G", "F#", "C", "C#", "F", "G#", "Bb", "Eb"] as const;

export const SCALEPATH_CHAPTERS: ScalePathChapter[] = [
  {
    id: "major-scales",
    name: "Major Scales",
    order: 1,
    levels: buildLevels("major-scales", "Major", MAJOR_KEYS, 1)
  },
  {
    id: "natural-minor",
    name: "Natural Minor",
    order: 2,
    levels: buildLevels("natural-minor", "Natural Minor", MINOR_KEYS, 2)
  },
  {
    id: "harmonic-minor",
    name: "Harmonic Minor",
    order: 3,
    levels: buildLevels("harmonic-minor", "Harmonic Minor", MINOR_KEYS, 3)
  },
  {
    id: "melodic-minor",
    name: "Melodic Minor",
    order: 4,
    levels: buildLevels("melodic-minor", "Melodic Minor", MINOR_KEYS, 4)
  },
  {
    id: "blues-scales",
    name: "Blues Scales",
    order: 5,
    levels: buildLevels("blues-scales", "Blues", MINOR_KEYS, 5)
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

export const findLevel = (levelId: string): ScalePathLevel | undefined => SCALEPATH_LEVELS.find((level) => level.id === levelId);

export const nextLevelAfter = (levelId: string): ScalePathLevel | undefined => {
  const current = findLevel(levelId);
  if (!current) return undefined;
  return SCALEPATH_LEVELS.find((level) => level.order === current.order + 1);
};

