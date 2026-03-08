import { validateRange } from "@/lib/music/noteUtils";

export type ScaleSettings = {
  root: string;
  scaleType: string;
  octaveSpan: number;
  direction: "Ascending" | "Descending" | "Up and Down";
  timeSignature: "2/4" | "3/4" | "4/4" | "6/8";
  noteValue: "whole" | "half" | "quarter" | "eighth";
  lowestNote: string;
  highestNote: string;
  showNoteNames: boolean;
  showScaleDegrees: boolean;
};

export const validateScaleSettings = (settings: ScaleSettings): string | undefined => {
  return validateRange(settings.lowestNote, settings.highestNote);
};
