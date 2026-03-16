"use client";

import { useEffect, useMemo, useState } from "react";

import type { ExportFormat, LibraryEntry } from "@/lib/app/types";
import { appDefaultsForScale } from "@/lib/app/defaults";
import { defaultAppSettings, loadAppSettings, recordExerciseHistory, updateLibraryEntry } from "@/lib/app/storage";
import ExerciseControls from "@/components/ExerciseControls";
import ExportButtons from "@/components/ExportButtons";
import PracticeWorkspace from "@/components/PracticeWorkspace";
import PresetSelector from "@/components/PresetSelector";
import PageHeader from "@/components/ui/PageHeader";
import TimerPill from "@/components/ui/TimerPill";
import { usePracticeTimer } from "@/hooks/usePracticeTimer";
import { useRegenerateShortcut } from "@/hooks/useRegenerateShortcut";
import { generateScaleExercise } from "@/lib/generators/scales";
import { DIRECTIONS, NOTE_OPTIONS, ROOT_OPTIONS, SCALE_TYPES, TIME_SIGNATURES } from "@/lib/music/constants";
import { SCALE_EXPLANATIONS } from "@/lib/music/education";
import { exerciseToMusicXml } from "@/lib/music/xmlBuilder";
import { scalePresets } from "@/lib/presets/presets";
import { type ScaleSettings } from "@/lib/validation/scalesValidation";

const STORAGE_KEY = "notelyric:v2:scales-settings";

type GenerationState = {
  title?: string;
  xml?: string;
  error?: string;
  entry?: LibraryEntry;
  notice?: string;
};

export default function ScalesPage() {
  const [mode, setMode] = useState<"Quick" | "Advanced">("Quick");
  const [settings, setSettings] = useState<ScaleSettings>(appDefaultsForScale(defaultAppSettings));
  const [presetName, setPresetName] = useState(Object.keys(scalePresets)[0]);
  const [state, setState] = useState<GenerationState>({});
  const [svg, setSvg] = useState<string | undefined>();
  const [ready, setReady] = useState(false);
  const [defaultExportFormat, setDefaultExportFormat] = useState<ExportFormat>(defaultAppSettings.defaultExportFormat);
  const timer = usePracticeTimer(Boolean(state.xml));

  useEffect(() => {
    const appSettings = loadAppSettings();
    setDefaultExportFormat(appSettings.defaultExportFormat);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setSettings(appDefaultsForScale(appSettings));
      setReady(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { mode: "Quick" | "Advanced"; settings: ScaleSettings };
      setMode(parsed.mode);
      setSettings({ ...appDefaultsForScale(appSettings), ...parsed.settings });
    } catch {
      setSettings(appDefaultsForScale(appSettings));
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, settings }));
  }, [mode, ready, settings]);

  const handlePresetSelect = (name: string) => {
    setPresetName(name);
    setSettings((current) => ({ ...current, ...scalePresets[name] }));
  };

  const saveEntry = (favorite = false) => {
    if (!state.entry) return;
    const nextState = updateLibraryEntry(state.entry.id, (entry) => ({ ...entry, saved: true, favorite: favorite ? !entry.favorite : entry.favorite }));
    const entry = nextState.entries.find((item) => item.id === state.entry?.id);
    setState((current) => ({ ...current, entry, notice: favorite ? (entry?.favorite ? "Added to favorites." : "Removed from favorites.") : "Exercise saved to Library." }));
  };

  const generate = () => {
    const result = generateScaleExercise(settings);
    if (!result.exercise) {
      setState({ error: result.error });
      return;
    }
    const entry = recordExerciseHistory(result.exercise, "scales");
    setState({ title: result.exercise.title, xml: exerciseToMusicXml(result.exercise), error: undefined, entry, notice: "Exercise added to recent history." });
  };

  useRegenerateShortcut(generate, ready);

  const summaryItems = useMemo(
    () => [
      { label: "Root", value: settings.root },
      { label: "Scale", value: settings.scaleType },
      { label: "Direction", value: settings.direction === "Up and Down" ? "Ascend and descend" : settings.direction },
      { label: "Octaves", value: `${settings.octaveSpan}` },
      { label: "Rhythm", value: `${settings.noteValue} in ${settings.timeSignature}` },
      { label: "Range", value: `${settings.lowestNote}-${settings.highestNote}` }
    ],
    [settings]
  );

  return (
    <>
      <PageHeader
        eyebrow="Practice"
        title="Scales"
        description="Practice scales to build technique and note familiarity. Keep the range realistic, regenerate often, and keep the score in view while you work."
        actions={<TimerPill label="Practice timer" value={timer} />}
      />

      <div className="exercise-layout">
        <ExerciseControls title="Scales" mode={mode} onModeChange={setMode}>
          <PresetSelector presets={Object.keys(scalePresets)} selected={presetName} onSelect={handlePresetSelect} />

          <div className="field-grid">
            <label>
              <span>Root note</span>
              <select value={settings.root} onChange={(event) => setSettings({ ...settings, root: event.target.value })}>
                {ROOT_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Scale type</span>
              <select value={settings.scaleType} onChange={(event) => setSettings({ ...settings, scaleType: event.target.value })}>
                {SCALE_TYPES.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Direction</span>
              <select value={settings.direction} onChange={(event) => setSettings({ ...settings, direction: event.target.value as ScaleSettings["direction"] })}>
                {DIRECTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Octave span</span>
              <select value={settings.octaveSpan} onChange={(event) => setSettings({ ...settings, octaveSpan: Number(event.target.value) })}>
                {[1, 2, 3].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          {mode === "Advanced" ? (
            <details open>
              <summary>Advanced settings</summary>
              <div className="field-grid field-grid--three">
                <label>
                  <span>Time signature</span>
                  <select value={settings.timeSignature} onChange={(event) => setSettings({ ...settings, timeSignature: event.target.value as ScaleSettings["timeSignature"] })}>
                    {TIME_SIGNATURES.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Note value</span>
                  <select value={settings.noteValue} onChange={(event) => setSettings({ ...settings, noteValue: event.target.value as ScaleSettings["noteValue"] })}>
                    {(["whole", "half", "quarter", "eighth"] as const).map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Lowest note</span>
                  <select value={settings.lowestNote} onChange={(event) => setSettings({ ...settings, lowestNote: event.target.value })}>
                    {NOTE_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Highest note</span>
                  <select value={settings.highestNote} onChange={(event) => setSettings({ ...settings, highestNote: event.target.value })}>
                    {NOTE_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="checkbox">
                  <input type="checkbox" checked={settings.showNoteNames} onChange={(event) => setSettings({ ...settings, showNoteNames: event.target.checked })} />
                  <span>Show note names</span>
                </label>
                <label className="checkbox">
                  <input type="checkbox" checked={settings.showScaleDegrees} onChange={(event) => setSettings({ ...settings, showScaleDegrees: event.target.checked })} />
                  <span>Show scale degrees</span>
                </label>
              </div>
            </details>
          ) : null}

          <div className="button-row">
            <button type="button" className="button button--primary" onClick={generate}>Generate exercise</button>
            <button type="button" className="button button--ghost" onClick={generate}>Regenerate</button>
          </div>
        </ExerciseControls>

        <PracticeWorkspace
          title={state.title ?? `${settings.root} ${settings.scaleType}`}
          description="Keep the same pattern in view while you regenerate. The score, explanation, and pattern summary stay together so the exercise feels like one focused practice surface."
          musicXml={state.xml}
          onSvgReady={setSvg}
          summaryItems={summaryItems}
          explanation={SCALE_EXPLANATIONS[settings.scaleType]}
          focusBlock={{ label: "Current pattern", value: `${settings.root} - ${settings.scaleType} - ${settings.direction}` }}
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
              {state.error ? <div className="notice notice--error">{state.error}</div> : null}
              {state.notice ? <div className="notice notice--success">{state.notice}</div> : null}
            </>
          }
        />
      </div>
    </>
  );
}