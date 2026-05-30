import { generateScaleExercise } from "@/lib/generators/scales";
import type { Exercise } from "@/lib/music/models";
import { exerciseToMusicXml } from "@/lib/music/xmlBuilder";
import type { ScaleSettings } from "@/lib/validation/scalesValidation";
import { checkpointId, checkpointsForLevel, findLevel, type ScalePathCheckpoint, type ScalePathLevel } from "@/products/scalepath/curriculum";
import type { ScalePathReview, ScalePathSettings } from "@/products/scalepath/progress";

export type ScalePathExercise = {
  level: ScalePathLevel;
  checkpoint: ScalePathCheckpoint;
  exercise: Exercise;
  musicXml: string;
};

export const reviewCheckpointForLevel = (levelId: string): ScalePathCheckpoint => {
  const checkpoints = checkpointsForLevel(levelId);
  return checkpoints.find((checkpoint) => checkpoint.id === checkpointId(levelId, "quarter", 100)) ?? checkpoints[0];
};

export const buildScalePathExercise = (
  level: ScalePathLevel,
  checkpoint: ScalePathCheckpoint,
  settings: ScalePathSettings
): ScalePathExercise | { error: string } => {
  const scaleSettings: ScaleSettings = {
    root: level.key,
    scaleType: level.scaleType,
    octaveSpan: settings.octaveSpan,
    direction: settings.direction,
    timeSignature: "4/4",
    noteValue: checkpoint.noteValue,
    lowestNote: settings.lowestNote,
    highestNote: settings.highestNote,
    showNoteNames: false,
    showScaleDegrees: settings.showScaleDegrees
  };

  const result = generateScaleExercise(scaleSettings);
  if (!result.exercise) return { error: result.error ?? "Unable to create this ScalePath exercise." };

  const exercise: Exercise = {
    ...result.exercise,
    id: checkpoint.id,
    title: `${level.key} ${level.scaleType} - ${checkpoint.stageLabel} - ${checkpoint.tempo} BPM`,
    tempo: `${checkpoint.tempo}`,
    metadata: {
      ...result.exercise.metadata,
      product: "ScalePath",
      levelId: level.id,
      checkpointId: checkpoint.id,
      tempo: checkpoint.tempo,
      stage: checkpoint.stageLabel
    }
  };

  return {
    level,
    checkpoint,
    exercise,
    musicXml: exerciseToMusicXml(exercise)
  };
};

export const buildReviewExercise = (review: ScalePathReview, settings: ScalePathSettings): ScalePathExercise | { error: string } => {
  const level = findLevel(review.levelId);
  if (!level) return { error: "Review level was not found." };
  return buildScalePathExercise(level, reviewCheckpointForLevel(review.levelId), settings);
};

