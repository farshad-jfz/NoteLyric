"use client";

import { useEffect, useState } from "react";

import type { AppSettings } from "@/lib/app/types";
import { defaultAppSettings, loadAppSettings, saveAppSettings } from "@/lib/app/storage";
import { NOTE_OPTIONS } from "@/lib/music/constants";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultAppSettings);
  const [notice, setNotice] = useState<string | undefined>();

  useEffect(() => {
    setSettings(loadAppSettings());
  }, []);

  const save = () => {
    saveAppSettings(settings);
    setNotice("Settings saved. New sessions and new generator tabs will use these defaults.");
  };

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Practice Defaults"
        description="Keep this page small. These defaults seed new generator pages, guided sessions, and export behavior across the app."
      />

      <div className="settings-grid">
        <SectionCard title="Instrument Range" description="The most important default for harmonica generation.">
          <div className="field-grid">
            <label>
              <span>Low note</span>
              <select value={settings.instrumentLowNote} onChange={(event) => setSettings({ ...settings, instrumentLowNote: event.target.value })}>
                {NOTE_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              <span>High note</span>
              <select value={settings.instrumentHighNote} onChange={(event) => setSettings({ ...settings, instrumentHighNote: event.target.value })}>
                {NOTE_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Difficulty and Rhythm" description="These values seed guided sessions and jazz defaults.">
          <div className="field-grid">
            <label>
              <span>Default difficulty</span>
              <select value={settings.defaultDifficulty} onChange={(event) => setSettings({ ...settings, defaultDifficulty: event.target.value as AppSettings["defaultDifficulty"] })}>
                {(["Beginner", "Intermediate", "Advanced"] as const).map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={settings.preferSwingFeel} onChange={(event) => setSettings({ ...settings, preferSwingFeel: event.target.checked })} />
              <span>Prefer swing feel when the mode supports it</span>
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={settings.showNoteNamesByDefault} onChange={(event) => setSettings({ ...settings, showNoteNamesByDefault: event.target.checked })} />
              <span>Show note names by default on new pages</span>
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Export" description="The quick export button uses this format first.">
          <label>
            <span>Default export format</span>
            <select value={settings.defaultExportFormat} onChange={(event) => setSettings({ ...settings, defaultExportFormat: event.target.value as AppSettings["defaultExportFormat"] })}>
              {(["png", "svg", "musicxml", "pdf"] as const).map((option) => (
                <option key={option} value={option}>
                  {option.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
        </SectionCard>

        <SectionCard title="Save" description="These settings stay local to this device and browser.">
          <div className="button-row">
            <button type="button" className="button button--primary" onClick={save}>
              Save settings
            </button>
            <button type="button" className="button button--ghost" onClick={() => setSettings(defaultAppSettings)}>
              Reset to defaults
            </button>
          </div>
          {notice ? <div className="notice notice--success">{notice}</div> : null}
        </SectionCard>
      </div>
    </>
  );
}
