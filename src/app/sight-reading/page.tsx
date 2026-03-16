"use client";

import { useEffect, useMemo, useState } from "react";

import type { ExportFormat, LibraryEntry } from "@/lib/app/types";
import { appDefaultsForSight } from "@/lib/app/defaults";
import { defaultAppSettings, loadAppSettings, recordExerciseHistory, updateLibraryEntry } from "@/lib/app/storage";
import ExerciseControls from "@/components/ExerciseControls";
import ExportButtons from "@/components/ExportButtons";
import PresetSelector from "@/components/PresetSelector";
import ScoreViewer from "@/components/ScoreViewer";
import SettingsSummary from "@/components/SettingsSummary";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import TimerPill from "@/components/ui/TimerPill";
import { usePracticeTimer } from "@/hooks/usePracticeTimer";
import { useRegenerateShortcut } from "@/hooks/useRegenerateShortcut";
import { availableKeysForMode, generateSightReadingExercise } from "@/lib/generators/sightReading";
import { DISPLAY_NOTE_VALUES, NOTE_OPTIONS, TIME_SIGNATURES } from "@/lib/music/constants";
import { exerciseToMusicXml } from "@/lib/music/xmlBuilder";
import { sightPresets } from "@/lib/presets/presets";
import { type SightReadingSettings } from "@/lib/validation/sightReadingValidation";

const STORAGE_KEY = "notelyric:v2:sight-settings";

type GenerationState = {
  title?: string;
  xml?: string;
  error?: string;
  entry?: LibraryEntry;
  notice?: string;
};

const difficultyAllowed: Record<SightReadingSettings["difficulty"], SightReadingSettings["allowedValues"]> = {
  Beginner: ["whole", "half", "quarter"],
  Intermediate: ["whole", "half", "quarter", "eighth"],
  Advanced: DISPLAY_NOTE_VALUES
};

export default function SightReadingPage() {
  const [mode, setMode] = useState<"Quick" | "Advanced">("Quick");
  const [settings, setSettings] = useState<SightReadingSettings>(appDefaultsForSight(defaultAppSettings));
  const [presetName, setPresetName] = useState(Object.keys(sightPresets)[0]);
  const [state, setState] = useState<GenerationState>({});
  const [svg, setSvg] = useState<string | undefined>();
  const [ready, setReady] = useState(false);
  const [defaultExportFormat, setDefaultExportFormat] = useState<ExportFormat>(defaultAppSettings.defaultExportFormat);
  const timer = usePracticeTimer(Boolean(state.xml));

  const keys = availableKeysForMode(settings.keyMode);

  useEffect(() => {
    const appSettings = loadAppSettings();
    setDefaultExportFormat(appSettings.defaultExportFormat);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setSettings(appDefaultsForSight(appSettings));
      setReady(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { mode: "Quick" | "Advanced"; settings: SightReadingSettings };
      setMode(parsed.mode);
      setSettings({ ...appDefaultsForSight(appSettings), ...parsed.settings });
    } catch {
      setSettings(appDefaultsForSight(appSettings));
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!keys.includes(settings.specificKey)) {
      setSettings((current) => ({ ...current, specificKey: keys[0] }));
    }
  }, [keys, settings.specificKey]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, settings }));
  }, [mode, ready, settings]);

  const applyPreset = () => {
    setSettings((current) => ({ ...current, ...sightPresets[presetName] }));
  };

  const saveEntry = (favorite = false) => {
    if (!state.entry) return;
    const nextState = updateLibraryEntry(state.entry.id, (entry) => ({ ...entry, saved: true, favorite: favorite ? !entry.favorite : entry.favorite }));
    const entry = nextState.entries.find((item) => item.id === state.entry?.id);
    setState((current) => ({ ...current, entry, notice: favorite ? (entry?.favorite ? "Added to favorites." : "Removed from favorites.") : "Exercise saved to Library." }));
  };

  const generate = () => {
    const result = generateSightReadingExercise(settings);
    if (!result.exercise) {
      setState({ error: result.error });
      return;
    }
    const entry = recordExerciseHistory(result.exercise, "sight-reading");
    setState({ title: result.exercise.title, xml: exerciseToMusicXml(result.exercise), error: undefined, entry, notice: "Exercise added to recent history." });
  };

  useRegenerateShortcut(generate, ready);

  const summary = useMemo(
    () => [
      settings.keyMode === "Chromatic / random accidentals" ? "Chromatic" : settings.specificKey,
      `${settings.numBars} bars`,
      settings.difficulty,
      settings.timeSignature,
      settings.maxLeap,
      `range ${settings.lowestNote}-${settings.highestNote}`
    ],
    [settings]
  );

  const allowedDurations = difficultyAllowed[settings.difficulty];

  return (
    <>
      <PageHeader
        eyebrow="Practice"
        title="Sight Reading"
        description="Generate unfamiliar melodies inside a chosen range and keep the rhythms valid enough to read straight from the page."
        actions={<TimerPill label="Practice timer" value={timer} />}
      />

      <div className="exercise-layout">
        <div className="stack">
          <ExerciseControls title="Sight Reading" mode={mode} onModeChange={setMode}>
            <PresetSelector presets={Object.keys(sightPresets)} selected={presetName} onSelect={setPresetName} onApply={applyPreset} />

            <div className="field-grid">
              <label>
                <span>Key mode</span>
                <select value={settings.keyMode} onChange={(event) => setSettings({ ...settings, keyMode: event.target.value as SightReadingSettings["keyMode"] })}>
                  {(["C Major / A Minor only", "Major keys", "Minor keys", "Chromatic / random accidentals"] as const).map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Specific key</span>
                <select value={settings.specificKey} onChange={(event) => setSettings({ ...settings, specificKey: event.target.value })} disabled={settings.keyMode === "Chromatic / random accidentals"}>
                  {keys.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Bars</span>
                <select value={settings.numBars} onChange={(event) => setSettings({ ...settings, numBars: Number(event.target.value) as SightReadingSettings["numBars"] })}>
                  {[2, 4, 8, 12, 16].map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Difficulty</span>
                <select
                  value={settings.difficulty}
                  onChange={(event) => {
                    const difficulty = event.target.value as SightReadingSettings["difficulty"];
                    setSettings((current) => ({
                      ...current,
                      difficulty,
                      allowedValues: current.allowedValues.filter((value) => difficultyAllowed[difficulty].includes(value))
                    }));
                  }}
                >
                  {(["Beginner", "Intermediate", "Advanced"] as const).map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>

            {mode === "Advanced" ? (
              <details open>
                <summary>Advanced settings</summary>
                <div className="field-grid field-grid--three">
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
                  <label>
                    <span>Time signature</span>
                    <select value={settings.timeSignature} onChange={(event) => setSettings({ ...settings, timeSignature: event.target.value as SightReadingSettings["timeSignature"] })}>
                      {TIME_SIGNATURES.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Largest jump</span>
                    <select value={settings.maxLeap} onChange={(event) => setSettings({ ...settings, maxLeap: event.target.value as SightReadingSettings["maxLeap"] })}>
                      {(["step only", "up to 3rd", "up to 4th", "up to 5th", "octave"] as const).map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Allowed note values</span>
                    <select
                      multiple
                      value={settings.allowedValues}
                      onChange={(event) => {
                        const values = Array.from(event.target.selectedOptions).map((option) => option.value as SightReadingSettings["allowedValues"][number]);
                        setSettings({ ...settings, allowedValues: values });
                      }}
                    >
                      {allowedDurations.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label className="checkbox">
                    <input type="checkbox" checked={settings.allowRests} onChange={(event) => setSettings({ ...settings, allowRests: event.target.checked })} />
                    <span>Allow rests</span>
                  </label>
                  <label className="checkbox">
                    <input type="checkbox" checked={settings.repeatedNotes} onChange={(event) => setSettings({ ...settings, repeatedNotes: event.target.checked })} />
                    <span>Repeated notes allowed</span>
                  </label>
                  <label className="checkbox">
                    <input type="checkbox" checked={settings.showNoteNames} onChange={(event) => setSettings({ ...settings, showNoteNames: event.target.checked })} />
                    <span>Show note names</span>
                  </label>
                </div>
              </details>
            ) : null}

            <div className="button-row">
              <button type="button" className="button button--primary" onClick={generate}>Generate exercise</button>
              <button type="button" className="button button--ghost" onClick={generate}>Regenerate</button>
            </div>

            <SettingsSummary items={summary} />
            {state.error ? <div className="notice notice--error">{state.error}</div> : null}
            {state.notice ? <div className="notice notice--success">{state.notice}</div> : null}
          </ExerciseControls>
        </div>

        <div className="stack">
          <ScoreViewer title={state.title} musicXml={state.xml} onSvgReady={setSvg} />
          {state.xml && state.title ? (
            <SectionCard title="Save and export" description="Keep the best reading examples in your library for later reuse.">
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
            </SectionCard>
          ) : null}
        </div>
      </div>
    </>
  );
}
