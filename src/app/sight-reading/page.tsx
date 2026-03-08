"use client";

import { useEffect, useMemo, useState } from "react";

import ExerciseControls from "@/components/ExerciseControls";
import ExportButtons from "@/components/ExportButtons";
import PresetSelector from "@/components/PresetSelector";
import ScoreViewer from "@/components/ScoreViewer";
import SettingsSummary from "@/components/SettingsSummary";
import { DISPLAY_NOTE_VALUES, NOTE_OPTIONS, TIME_SIGNATURES } from "@/lib/music/constants";
import { exerciseToMusicXml } from "@/lib/music/xmlBuilder";
import { availableKeysForMode, generateSightReadingExercise } from "@/lib/generators/sightReading";
import { defaultSightSettings, sightPresets } from "@/lib/presets/presets";
import { SightReadingSettings } from "@/lib/validation/sightReadingValidation";

const STORAGE_KEY = "harmonica_sight_settings_v1";

type GenerationState = {
  title?: string;
  xml?: string;
  error?: string;
};

const difficultyAllowed: Record<SightReadingSettings["difficulty"], SightReadingSettings["allowedValues"]> = {
  Beginner: ["whole", "half", "quarter"],
  Intermediate: ["whole", "half", "quarter", "eighth"],
  Advanced: DISPLAY_NOTE_VALUES
};

export default function SightReadingPage() {
  const [mode, setMode] = useState<"Quick" | "Advanced">("Quick");
  const [settings, setSettings] = useState<SightReadingSettings>(defaultSightSettings);
  const [presetName, setPresetName] = useState(Object.keys(sightPresets)[0]);
  const [state, setState] = useState<GenerationState>({});
  const [svg, setSvg] = useState<string | undefined>();

  const keys = availableKeysForMode(settings.keyMode);

  useEffect(() => {
    if (!keys.includes(settings.specificKey)) {
      setSettings((cur) => ({ ...cur, specificKey: keys[0] }));
    }
  }, [keys, settings.specificKey]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { mode: "Quick" | "Advanced"; settings: SightReadingSettings };
      setMode(parsed.mode);
      setSettings(parsed.settings);
    } catch {
      // Ignore corrupt local storage.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, settings }));
  }, [mode, settings]);

  const applyPreset = () => {
    setSettings((cur) => ({ ...cur, ...sightPresets[presetName] }));
  };

  const generate = () => {
    const result = generateSightReadingExercise(settings);
    if (!result.exercise) {
      setState({ error: result.error });
      return;
    }
    setState({ title: result.exercise.title, xml: exerciseToMusicXml(result.exercise), error: undefined });
  };

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
      <ExerciseControls title="Sight Reading" mode={mode} onModeChange={setMode}>
        <PresetSelector presets={Object.keys(sightPresets)} selected={presetName} onSelect={setPresetName} onApply={applyPreset} />

        <div className="grid-2">
          <label>
            Key mode
            <select value={settings.keyMode} onChange={(e) => setSettings({ ...settings, keyMode: e.target.value as SightReadingSettings["keyMode"] })}>
              {["C Major / A Minor only", "Major keys", "Minor keys", "Chromatic / random accidentals"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Specific key
            <select
              value={settings.specificKey}
              onChange={(e) => setSettings({ ...settings, specificKey: e.target.value })}
              disabled={settings.keyMode === "Chromatic / random accidentals"}
            >
              {keys.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Number of bars
            <select value={settings.numBars} onChange={(e) => setSettings({ ...settings, numBars: Number(e.target.value) as SightReadingSettings["numBars"] })}>
              {[2, 4, 8, 12, 16].map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          <label>
            Difficulty
            <select
              value={settings.difficulty}
              onChange={(e) => {
                const difficulty = e.target.value as SightReadingSettings["difficulty"];
                setSettings((cur) => ({
                  ...cur,
                  difficulty,
                  allowedValues: cur.allowedValues.filter((d) => difficultyAllowed[difficulty].includes(d))
                }));
              }}
            >
              {["Beginner", "Intermediate", "Advanced"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        </div>

        {mode === "Advanced" ? (
          <details open>
            <summary>Advanced settings</summary>
            <div className="grid-3">
              <label>
                Lowest playable note
                <select value={settings.lowestNote} onChange={(e) => setSettings({ ...settings, lowestNote: e.target.value })}>
                  {NOTE_OPTIONS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Highest playable note
                <select value={settings.highestNote} onChange={(e) => setSettings({ ...settings, highestNote: e.target.value })}>
                  {NOTE_OPTIONS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Time signature
                <select value={settings.timeSignature} onChange={(e) => setSettings({ ...settings, timeSignature: e.target.value as SightReadingSettings["timeSignature"] })}>
                  {TIME_SIGNATURES.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Largest jump
                <select value={settings.maxLeap} onChange={(e) => setSettings({ ...settings, maxLeap: e.target.value as SightReadingSettings["maxLeap"] })}>
                  {["step only", "up to 3rd", "up to 4th", "up to 5th", "octave"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Allowed note durations
                <select
                  multiple
                  value={settings.allowedValues}
                  onChange={(e) => {
                    const vals = Array.from(e.target.selectedOptions).map((o) => o.value as SightReadingSettings["allowedValues"][number]);
                    setSettings({ ...settings, allowedValues: vals });
                  }}
                >
                  {allowedDurations.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={settings.allowRests}
                  onChange={(e) => setSettings({ ...settings, allowRests: e.target.checked })}
                />
                Allow rests
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={settings.repeatedNotes}
                  onChange={(e) => setSettings({ ...settings, repeatedNotes: e.target.checked })}
                />
                Repeated notes allowed
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={settings.showNoteNames}
                  onChange={(e) => setSettings({ ...settings, showNoteNames: e.target.checked })}
                />
                Show note names
              </label>
            </div>
          </details>
        ) : null}

        <div className="button-row">
          <button type="button" className="primary" onClick={generate}>
            Generate new
          </button>
          <button type="button" onClick={generate}>
            Regenerate same settings
          </button>
        </div>

        <SettingsSummary items={summary} />
        {state.error ? <p className="error">{state.error}</p> : null}
      </ExerciseControls>

      <ScoreViewer title={state.title} musicXml={state.xml} onSvgReady={setSvg} />
      {state.xml && state.title ? <ExportButtons title={state.title} musicXml={state.xml} getSvg={() => svg} /> : null}
    </>
  );
}
