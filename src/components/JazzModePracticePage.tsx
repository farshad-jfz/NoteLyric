"use client";

import { useEffect, useMemo, useState } from "react";

import type { ExportFormat, LibraryEntry } from "@/lib/app/types";
import { appDefaultsForJazz } from "@/lib/app/defaults";
import { defaultAppSettings, loadAppSettings, recordExerciseHistory, updateLibraryEntry } from "@/lib/app/storage";
import ExerciseControls from "@/components/ExerciseControls";
import ExportButtons from "@/components/ExportButtons";
import PracticeWorkspace from "@/components/PracticeWorkspace";
import PresetSelector from "@/components/PresetSelector";
import PageHeader from "@/components/ui/PageHeader";
import TimerPill from "@/components/ui/TimerPill";
import { usePracticeTimer } from "@/hooks/usePracticeTimer";
import { useRegenerateShortcut } from "@/hooks/useRegenerateShortcut";
import { generateJazzExercise, previewJazzProgression } from "@/lib/generators/jazz";
import { NOTE_OPTIONS } from "@/lib/music/constants";
import {
  displayTempoSummary,
  estimatedTempo,
  getValidJazzBarOptions,
  JAZZ_DIFFICULTY_OPTIONS,
  JAZZ_KEY_OPTIONS,
  JAZZ_MODE_EXPLANATIONS,
  JAZZ_PROGRESSION_OPTIONS,
  JAZZ_TIME_SIGNATURES,
  modeLabel,
  supportsSwingFeel,
  type JazzMode
} from "@/lib/music/jazz";
import { parsePitch } from "@/lib/music/noteUtils";
import { exerciseToMusicXml } from "@/lib/music/xmlBuilder";
import { jazzPresets } from "@/lib/presets/presets";
import { type JazzSettings, validateJazzSettings } from "@/lib/validation/jazzValidation";

const STORAGE_KEY = "notelyric:v2:jazz-settings";

type GenerationState = {
  exerciseId?: string;
  title?: string;
  xml?: string;
  error?: string;
  appliedSeed?: string;
  entry?: LibraryEntry;
  notice?: string;
};

const freshSeed = (): string => `${Date.now()}`;

const closestNumberOption = (target: number, options: readonly number[]): number => {
  if (!options.length) return target;

  return options.reduce((best, option) => {
    const optionDistance = Math.abs(option - target);
    const bestDistance = Math.abs(best - target);
    if (optionDistance !== bestDistance) return optionDistance < bestDistance ? option : best;
    return option < best ? option : best;
  }, options[0]);
};

export default function JazzModePracticePage({ initialMode }: { initialMode: JazzMode }) {
  const [viewMode, setViewMode] = useState<"Quick" | "Advanced">("Quick");
  const [settings, setSettings] = useState<JazzSettings>({ ...appDefaultsForJazz(defaultAppSettings), mode: initialMode });
  const [presetName, setPresetName] = useState(Object.keys(jazzPresets)[0]);
  const [state, setState] = useState<GenerationState>({});
  const [svg, setSvg] = useState<string | undefined>();
  const [defaultExportFormat, setDefaultExportFormat] = useState<ExportFormat>(defaultAppSettings.defaultExportFormat);
  const [ready, setReady] = useState(false);
  const timer = usePracticeTimer(Boolean(state.xml));

  useEffect(() => {
    const appSettings = loadAppSettings();
    setDefaultExportFormat(appSettings.defaultExportFormat);

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setSettings({ ...appDefaultsForJazz(appSettings), mode: initialMode });
      setReady(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { viewMode: "Quick" | "Advanced"; settings: JazzSettings };
      setViewMode(parsed.viewMode);
      setSettings({ ...appDefaultsForJazz(appSettings), ...parsed.settings, mode: initialMode });
    } catch {
      setSettings({ ...appDefaultsForJazz(appSettings), mode: initialMode });
    } finally {
      setReady(true);
    }
  }, [initialMode]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ viewMode, settings: { ...settings, mode: initialMode } }));
  }, [initialMode, ready, settings, viewMode]);

  useEffect(() => {
    setSettings((current) => ({ ...current, mode: initialMode, swingFeel: supportsSwingFeel(initialMode) ? current.swingFeel : false }));
  }, [initialMode]);

  const validBarOptions = useMemo(() => getValidJazzBarOptions(settings.progressionType), [settings.progressionType]);

  const lowestNoteOptions = useMemo(
    () => NOTE_OPTIONS.filter((option) => parsePitch(option).midi < parsePitch(settings.highestNote).midi),
    [settings.highestNote]
  );

  const highestNoteOptions = useMemo(
    () => NOTE_OPTIONS.filter((option) => parsePitch(option).midi > parsePitch(settings.lowestNote).midi),
    [settings.lowestNote]
  );

  const blockingSettingsError = useMemo(
    () => validateJazzSettings({ ...settings, mode: initialMode, swingFeel: supportsSwingFeel(initialMode) ? settings.swingFeel : false }),
    [initialMode, settings]
  );

  useEffect(() => {
    if (validBarOptions.includes(settings.numBars)) return;
    const nextBars = closestNumberOption(settings.numBars, validBarOptions);
    setSettings((current) => (current.numBars === nextBars ? current : { ...current, numBars: nextBars }));
  }, [settings.numBars, validBarOptions]);

  useEffect(() => {
    const lowMidi = parsePitch(settings.lowestNote).midi;
    const highMidi = parsePitch(settings.highestNote).midi;
    if (lowMidi < highMidi) return;

    const lowIndex = NOTE_OPTIONS.indexOf(settings.lowestNote);
    const highIndex = NOTE_OPTIONS.indexOf(settings.highestNote);

    if (highIndex < NOTE_OPTIONS.length - 1) {
      const nextHigh = NOTE_OPTIONS[Math.max(highIndex, lowIndex) + 1] ?? NOTE_OPTIONS[NOTE_OPTIONS.length - 1];
      setSettings((current) => ({ ...current, highestNote: nextHigh }));
      return;
    }

    const nextLow = NOTE_OPTIONS[Math.max(0, Math.min(lowIndex, highIndex) - 1)] ?? NOTE_OPTIONS[0];
    setSettings((current) => ({ ...current, lowestNote: nextLow }));
  }, [settings.highestNote, settings.lowestNote]);

  const handlePresetSelect = (name: string) => {
    setPresetName(name);
    setSettings((current) => ({ ...current, ...jazzPresets[name], mode: initialMode }));
  };

  const saveEntry = (toggleFavorite = false) => {
    if (!state.entry) return;
    const nextState = updateLibraryEntry(state.entry.id, (entry) => ({
      ...entry,
      saved: true,
      favorite: toggleFavorite ? !entry.favorite : entry.favorite,
      lastOpenedAt: new Date().toISOString()
    }));
    const entry = nextState.entries.find((item) => item.id === state.entry?.id);
    setState((current) => ({
      ...current,
      entry,
      notice: toggleFavorite ? (entry?.favorite ? "Added to favorites." : "Removed from favorites.") : "Exercise saved to Library."
    }));
  };

  const generate = (reuseSeed: boolean) => {
    if (blockingSettingsError) {
      setState((current) => ({ ...current, error: blockingSettingsError }));
      return;
    }

    const seed = reuseSeed ? settings.seed.trim() || freshSeed() : freshSeed();
    const nextSettings = { ...settings, mode: initialMode, seed };
    setSettings(nextSettings);

    const result = generateJazzExercise(nextSettings);
    if (!result.exercise) {
      setState((current) => ({ ...current, error: result.error, appliedSeed: seed }));
      return;
    }

    const entry = recordExerciseHistory(result.exercise, "jazz");
    setState({
      exerciseId: result.exercise.id,
      title: result.exercise.title,
      xml: exerciseToMusicXml(result.exercise),
      error: undefined,
      appliedSeed: seed,
      entry,
      notice: "Exercise added to recent history."
    });
  };

  useRegenerateShortcut(() => generate(true), ready);

  const progressionPreview = useMemo(
    () => previewJazzProgression({ key: settings.key, progressionType: settings.progressionType, numBars: settings.numBars }),
    [settings.key, settings.progressionType, settings.numBars]
  );

  const summaryItems = useMemo(
    () => [
      { label: "Mode", value: modeLabel(initialMode) },
      { label: "Progression", value: settings.progressionType },
      { label: "Key", value: settings.key },
      { label: "Bars", value: `${settings.numBars}` },
      { label: "Tempo", value: displayTempoSummary(settings.difficulty, settings.swingFeel) },
      { label: "Range", value: `${settings.lowestNote}-${settings.highestNote}` }
    ],
    [initialMode, settings]
  );

  const displayedTempo = supportsSwingFeel(initialMode)
    ? `${estimatedTempo(settings.difficulty, settings.swingFeel)} bpm${settings.swingFeel ? " swing" : ""}`
    : `${estimatedTempo(settings.difficulty, false)} bpm`;

  return (
    <>
      <PageHeader
        eyebrow="Jazz Practice"
        title={modeLabel(initialMode)}
        description={JAZZ_MODE_EXPLANATIONS[initialMode].definition}
        actions={<TimerPill label="Practice timer" value={timer} />}
      />

      <div className="exercise-layout">
        <ExerciseControls title={modeLabel(initialMode)} mode={viewMode} onModeChange={setViewMode}>
          <PresetSelector presets={Object.keys(jazzPresets)} selected={presetName} onSelect={handlePresetSelect} />

          <div className="field-grid">
            <label>
              <span>Progression</span>
              <select value={settings.progressionType} onChange={(event) => setSettings({ ...settings, progressionType: event.target.value as JazzSettings["progressionType"] })}>
                {JAZZ_PROGRESSION_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Key</span>
              <select value={settings.key} onChange={(event) => setSettings({ ...settings, key: event.target.value })}>
                {JAZZ_KEY_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Difficulty</span>
              <select value={settings.difficulty} onChange={(event) => setSettings({ ...settings, difficulty: event.target.value as JazzSettings["difficulty"] })}>
                {JAZZ_DIFFICULTY_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Bars</span>
              <select value={settings.numBars} onChange={(event) => setSettings({ ...settings, numBars: Number(event.target.value) })}>
                {validBarOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {viewMode === "Advanced" ? (
            <details open>
              <summary>Advanced settings</summary>
              <div className="field-grid field-grid--three">
                <label>
                  <span>Time signature</span>
                  <select value={settings.timeSignature} onChange={(event) => setSettings({ ...settings, timeSignature: event.target.value as JazzSettings["timeSignature"] })}>
                    {JAZZ_TIME_SIGNATURES.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Tempo guide</span>
                  <input type="text" readOnly value={displayedTempo} />
                </label>
                <label>
                  <span>Seed</span>
                  <input type="text" value={settings.seed} onChange={(event) => setSettings({ ...settings, seed: event.target.value.replace(/[^0-9]/g, "") })} placeholder="Auto-generate on new" />
                </label>
                <label>
                  <span>Lowest note</span>
                  <select value={settings.lowestNote} onChange={(event) => setSettings({ ...settings, lowestNote: event.target.value })}>
                    {lowestNoteOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Highest note</span>
                  <select value={settings.highestNote} onChange={(event) => setSettings({ ...settings, highestNote: event.target.value })}>
                    {highestNoteOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={settings.swingFeel}
                    disabled={!supportsSwingFeel(initialMode)}
                    onChange={(event) => setSettings({ ...settings, swingFeel: event.target.checked })}
                  />
                  <span>Swing feel</span>
                </label>
              </div>
            </details>
          ) : null}

          <div className="button-row">
            <button type="button" className="button button--primary" onClick={() => generate(false)} disabled={Boolean(blockingSettingsError)}>
              Generate new seed
            </button>
            <button type="button" className="button button--ghost" onClick={() => generate(true)} disabled={Boolean(blockingSettingsError)}>
              Regenerate current seed
            </button>
          </div>
        </ExerciseControls>

        <PracticeWorkspace
          title={state.title ?? modeLabel(initialMode)}
          description="Keep the harmonic concept, score, and progression preview together while you regenerate. The page stays centered on one musical idea at a time."
          musicXml={state.xml}
          onSvgReady={setSvg}
          summaryItems={summaryItems}
          explanation={JAZZ_MODE_EXPLANATIONS[initialMode]}
          focusBlock={{ label: "Current progression", value: progressionPreview }}
          exports={state.xml && state.title ? (
            <ExportButtons
              title={state.title}
              musicXml={state.xml}
              getSvg={() => svg}
              defaultFormat={defaultExportFormat}
              onSave={() => saveEntry(false)}
              onFavorite={() => saveEntry(true)}
              isSaved={state.entry?.saved}
              isFavorite={state.entry?.favorite}
            />
          ) : undefined}
          notices={
            <>
              {blockingSettingsError ? <div className="notice notice--error">{blockingSettingsError}</div> : null}
              {!blockingSettingsError && state.error ? <div className="notice notice--error">{state.error}</div> : null}
              {state.notice ? <div className="notice notice--success">{state.notice}</div> : null}
            </>
          }
        />
      </div>
    </>
  );
}