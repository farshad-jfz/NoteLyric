"use client";

import { useEffect, useMemo, useState } from "react";

import ExerciseControls from "@/components/ExerciseControls";
import ExportButtons from "@/components/ExportButtons";
import PresetSelector from "@/components/PresetSelector";
import ScoreViewer from "@/components/ScoreViewer";
import SettingsSummary from "@/components/SettingsSummary";
import { ARPEGGIO_PATTERNS, CHORD_TYPES, NOTE_OPTIONS, ROOT_OPTIONS, TIME_SIGNATURES } from "@/lib/music/constants";
import { exerciseToMusicXml } from "@/lib/music/xmlBuilder";
import { generateChordExercise } from "@/lib/generators/chords";
import { chordPresets, defaultChordSettings } from "@/lib/presets/presets";
import { ChordSettings } from "@/lib/validation/chordsValidation";

const STORAGE_KEY = "harmonica_chords_settings_v1";

type GenerationState = {
  title?: string;
  xml?: string;
  error?: string;
};

export default function ChordsPage() {
  const [mode, setMode] = useState<"Quick" | "Advanced">("Quick");
  const [settings, setSettings] = useState<ChordSettings>(defaultChordSettings);
  const [presetName, setPresetName] = useState(Object.keys(chordPresets)[0]);
  const [state, setState] = useState<GenerationState>({});
  const [svg, setSvg] = useState<string | undefined>();

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { mode: "Quick" | "Advanced"; settings: ChordSettings };
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
    setSettings((cur) => ({ ...cur, ...chordPresets[presetName] }));
  };

  const generate = () => {
    const result = generateChordExercise(settings);
    if (!result.exercise) {
      setState({ error: result.error });
      return;
    }
    setState({ title: result.exercise.title, xml: exerciseToMusicXml(result.exercise), error: undefined });
  };

  const summary = useMemo(
    () => [
      `${settings.root} ${settings.chordType}`,
      settings.pattern === "Up and Down" ? "Ascend + Descend" : settings.pattern,
      `${settings.octaveSpan} oct`,
      settings.timeSignature,
      settings.noteValue,
      `range ${settings.lowestNote}-${settings.highestNote}`
    ],
    [settings]
  );

  return (
    <>
      <ExerciseControls title="Chords / Arpeggios" mode={mode} onModeChange={setMode}>
        <PresetSelector presets={Object.keys(chordPresets)} selected={presetName} onSelect={setPresetName} onApply={applyPreset} />

        <div className="grid-2">
          <label>
            Root note
            <select value={settings.root} onChange={(e) => setSettings({ ...settings, root: e.target.value })}>
              {ROOT_OPTIONS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Chord type
            <select value={settings.chordType} onChange={(e) => setSettings({ ...settings, chordType: e.target.value })}>
              {CHORD_TYPES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Pattern
            <select value={settings.pattern} onChange={(e) => setSettings({ ...settings, pattern: e.target.value as ChordSettings["pattern"] })}>
              {ARPEGGIO_PATTERNS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Octave span
            <select value={settings.octaveSpan} onChange={(e) => setSettings({ ...settings, octaveSpan: Number(e.target.value) })}>
              {[1, 2].map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
        </div>

        {mode === "Advanced" ? (
          <details open>
            <summary>Advanced settings</summary>
            <div className="grid-3">
              <label>
                Time signature
                <select value={settings.timeSignature} onChange={(e) => setSettings({ ...settings, timeSignature: e.target.value as ChordSettings["timeSignature"] })}>
                  {TIME_SIGNATURES.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Note value
                <select value={settings.noteValue} onChange={(e) => setSettings({ ...settings, noteValue: e.target.value as ChordSettings["noteValue"] })}>
                  {["half", "quarter", "eighth"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
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
                <input
                  type="checkbox"
                  checked={settings.showNoteNames}
                  onChange={(e) => setSettings({ ...settings, showNoteNames: e.target.checked })}
                />
                Show note names
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={settings.showChordTones}
                  onChange={(e) => setSettings({ ...settings, showChordTones: e.target.checked })}
                />
                Show chord tones
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
