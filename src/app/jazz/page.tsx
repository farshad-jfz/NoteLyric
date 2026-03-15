"use client";

import { useEffect, useMemo, useState } from "react";

import ContextExplanationCard from "@/components/ContextExplanationCard";
import ExerciseControls from "@/components/ExerciseControls";
import ExportButtons from "@/components/ExportButtons";
import PresetSelector from "@/components/PresetSelector";
import ScoreViewer from "@/components/ScoreViewer";
import SettingsSummary from "@/components/SettingsSummary";
import { generateJazzExercise, previewJazzProgression } from "@/lib/generators/jazz";
import { NOTE_OPTIONS } from "@/lib/music/constants";
import {
  displayTempoSummary,
  estimatedTempo,
  getValidJazzBarOptions,
  JAZZ_DIFFICULTY_OPTIONS,
  JAZZ_KEY_OPTIONS,
  JAZZ_MODE_EXPLANATIONS,
  JAZZ_MODE_OPTIONS,
  JAZZ_PROGRESSION_OPTIONS,
  JAZZ_TIME_SIGNATURES,
  modeLabel,
  supportsSwingFeel
} from "@/lib/music/jazz";
import { parsePitch } from "@/lib/music/noteUtils";
import { exerciseToMusicXml } from "@/lib/music/xmlBuilder";
import { defaultJazzSettings, jazzPresets } from "@/lib/presets/presets";
import { JazzSettings, validateJazzSettings } from "@/lib/validation/jazzValidation";

const STORAGE_KEY = "harmonica_jazz_settings_v1";

type GenerationState = {
  title?: string;
  xml?: string;
  error?: string;
  appliedSeed?: string;
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

export default function JazzPage() {
  const [viewMode, setViewMode] = useState<"Quick" | "Advanced">("Quick");
  const [settings, setSettings] = useState<JazzSettings>(defaultJazzSettings);
  const [presetName, setPresetName] = useState(Object.keys(jazzPresets)[0]);
  const [state, setState] = useState<GenerationState>({});
  const [svg, setSvg] = useState<string | undefined>();

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { viewMode: "Quick" | "Advanced"; settings: JazzSettings };
      setViewMode(parsed.viewMode);
      setSettings({ ...defaultJazzSettings, ...parsed.settings });
    } catch {
      // Ignore corrupt local storage.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ viewMode, settings }));
  }, [viewMode, settings]);

  const validBarOptions = useMemo(() => getValidJazzBarOptions(settings.progressionType), [settings.progressionType]);

  const lowestNoteOptions = useMemo(
    () => NOTE_OPTIONS.filter((option) => parsePitch(option).midi < parsePitch(settings.highestNote).midi),
    [settings.highestNote]
  );

  const highestNoteOptions = useMemo(
    () => NOTE_OPTIONS.filter((option) => parsePitch(option).midi > parsePitch(settings.lowestNote).midi),
    [settings.lowestNote]
  );

  const modeOptions = useMemo(
    () =>
      JAZZ_MODE_OPTIONS.map((option) => {
        const swingFeel = supportsSwingFeel(option.value) ? settings.swingFeel : false;
        return {
          ...option,
          disabled: Boolean(validateJazzSettings({ ...settings, mode: option.value, swingFeel }))
        };
      }),
    [settings]
  );

  const blockingSettingsError = useMemo(() => validateJazzSettings(settings), [settings]);

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

  useEffect(() => {
    setState((current) => (current.error ? { ...current, error: undefined } : current));
  }, [settings]);

  const applyPreset = () => {
    setSettings((current) => ({ ...current, ...jazzPresets[presetName] }));
  };

  const generate = (reuseSeed: boolean) => {
    if (blockingSettingsError) {
      setState((current) => ({ ...current, error: blockingSettingsError }));
      return;
    }

    const seed = reuseSeed ? settings.seed.trim() || freshSeed() : freshSeed();
    const nextSettings = { ...settings, seed };
    setSettings(nextSettings);

    const result = generateJazzExercise(nextSettings);
    if (!result.exercise) {
      setState((current) => ({ ...current, error: result.error, appliedSeed: seed }));
      return;
    }

    setState({
      title: result.exercise.title,
      xml: exerciseToMusicXml(result.exercise),
      error: undefined,
      appliedSeed: seed
    });
  };

  const progressionPreview = useMemo(
    () => previewJazzProgression({ key: settings.key, progressionType: settings.progressionType, numBars: settings.numBars }),
    [settings.key, settings.progressionType, settings.numBars]
  );

  const summary = useMemo(
    () => [
      modeLabel(settings.mode),
      settings.progressionType,
      `${settings.key} key`,
      `${settings.numBars} bars`,
      settings.difficulty,
      displayTempoSummary(settings.difficulty, settings.swingFeel),
      `range ${settings.lowestNote}-${settings.highestNote}`,
      state.appliedSeed ? `seed ${state.appliedSeed}` : "seed auto"
    ],
    [settings, state.appliedSeed]
  );

  const displayedTempo = supportsSwingFeel(settings.mode)
    ? `${estimatedTempo(settings.difficulty, settings.swingFeel)} bpm${settings.swingFeel ? " swing" : ""}`
    : `${estimatedTempo(settings.difficulty, false)} bpm`;

  return (
    <>
      <ExerciseControls title="Jazz Practice" mode={viewMode} onModeChange={setViewMode}>
        <PresetSelector presets={Object.keys(jazzPresets)} selected={presetName} onSelect={setPresetName} onApply={applyPreset} />

        <div className="grid-2">
          <label>
            Practice mode
            <select
              value={settings.mode}
              onChange={(e) => {
                const mode = e.target.value as JazzSettings["mode"];
                setSettings({ ...settings, mode, swingFeel: supportsSwingFeel(mode) ? settings.swingFeel : false });
              }}
            >
              {modeOptions.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled && option.value !== settings.mode}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Progression
            <select value={settings.progressionType} onChange={(e) => setSettings({ ...settings, progressionType: e.target.value as JazzSettings["progressionType"] })}>
              {JAZZ_PROGRESSION_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label>
            Key
            <select value={settings.key} onChange={(e) => setSettings({ ...settings, key: e.target.value })}>
              {JAZZ_KEY_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label>
            Difficulty
            <select value={settings.difficulty} onChange={(e) => setSettings({ ...settings, difficulty: e.target.value as JazzSettings["difficulty"] })}>
              {JAZZ_DIFFICULTY_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        <ContextExplanationCard explanation={JAZZ_MODE_EXPLANATIONS[settings.mode]} />

        <section className="progression-strip" aria-label="Current progression preview">
          <p className="progression-strip__label">Current progression</p>
          <p className="progression-strip__value">{progressionPreview}</p>
        </section>

        {viewMode === "Advanced" ? (
          <details open>
            <summary>Advanced settings</summary>
            <div className="grid-3">
              <label>
                Time signature
                <select value={settings.timeSignature} onChange={(e) => setSettings({ ...settings, timeSignature: e.target.value as JazzSettings["timeSignature"] })}>
                  {JAZZ_TIME_SIGNATURES.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label>
                Number of bars
                <select value={settings.numBars} onChange={(e) => setSettings({ ...settings, numBars: Number(e.target.value) })}>
                  {validBarOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tempo (display only)
                <input type="text" readOnly value={displayedTempo} />
              </label>
              <label>
                Lowest playable note
                <select value={settings.lowestNote} onChange={(e) => setSettings({ ...settings, lowestNote: e.target.value })}>
                  {lowestNoteOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label>
                Highest playable note
                <select value={settings.highestNote} onChange={(e) => setSettings({ ...settings, highestNote: e.target.value })}>
                  {highestNoteOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label>
                Seed (optional)
                <input type="text" value={settings.seed} onChange={(e) => setSettings({ ...settings, seed: e.target.value.replace(/[^0-9]/g, "") })} placeholder="Auto-generate on new" />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={settings.swingFeel}
                  disabled={!supportsSwingFeel(settings.mode)}
                  onChange={(e) => setSettings({ ...settings, swingFeel: e.target.checked })}
                />
                Swing feel
              </label>
            </div>
          </details>
        ) : null}

        <div className="button-row">
          <button type="button" className="primary" onClick={() => generate(false)} disabled={Boolean(blockingSettingsError)}>
            Generate new seed
          </button>
          <button type="button" onClick={() => generate(true)} disabled={Boolean(blockingSettingsError)}>
            Regenerate current seed
          </button>
        </div>

        <SettingsSummary items={summary} />
        {blockingSettingsError ? <p className="error">{blockingSettingsError}</p> : null}
        {!blockingSettingsError && state.error ? <p className="error">{state.error}</p> : null}
      </ExerciseControls>

      <ScoreViewer title={state.title} musicXml={state.xml} onSvgReady={setSvg} />
      {state.xml && state.title ? <ExportButtons title={state.title} musicXml={state.xml} getSvg={() => svg} /> : null}
    </>
  );
}
