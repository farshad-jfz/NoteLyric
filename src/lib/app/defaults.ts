import type { AppSettings } from "@/lib/app/types";
import { defaultChordSettings, defaultJazzSettings, defaultScaleSettings, defaultSightSettings } from "@/lib/presets/presets";
import type { ChordSettings } from "@/lib/validation/chordsValidation";
import type { JazzSettings } from "@/lib/validation/jazzValidation";
import type { ScaleSettings } from "@/lib/validation/scalesValidation";
import type { SightReadingSettings } from "@/lib/validation/sightReadingValidation";

export const appDefaultsForScale = (settings: AppSettings): ScaleSettings => ({
  ...defaultScaleSettings,
  lowestNote: settings.instrumentLowNote,
  highestNote: settings.instrumentHighNote,
  showNoteNames: settings.showNoteNamesByDefault
});

export const appDefaultsForChord = (settings: AppSettings): ChordSettings => ({
  ...defaultChordSettings,
  lowestNote: settings.instrumentLowNote,
  highestNote: settings.instrumentHighNote,
  showNoteNames: settings.showNoteNamesByDefault
});

export const appDefaultsForJazz = (settings: AppSettings): JazzSettings => ({
  ...defaultJazzSettings,
  lowestNote: settings.instrumentLowNote,
  highestNote: settings.instrumentHighNote,
  difficulty: settings.defaultDifficulty,
  swingFeel: settings.preferSwingFeel
});

export const appDefaultsForSight = (settings: AppSettings): SightReadingSettings => ({
  ...defaultSightSettings,
  lowestNote: settings.instrumentLowNote,
  highestNote: settings.instrumentHighNote,
  difficulty: settings.defaultDifficulty,
  showNoteNames: settings.showNoteNamesByDefault
});
