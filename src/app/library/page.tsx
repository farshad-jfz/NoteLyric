"use client";

import { useEffect, useMemo, useState } from "react";

import type { LibraryEntry, LibraryState } from "@/lib/app/types";
import { loadLibraryState, updateLibraryEntry } from "@/lib/app/storage";
import ExportButtons from "@/components/ExportButtons";
import ScoreViewer from "@/components/ScoreViewer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { exerciseToMusicXml } from "@/lib/music/xmlBuilder";

type Selection =
  | { kind: "entry"; id: string }
  | { kind: "session"; id: string }
  | undefined;

export default function LibraryPage() {
  const [library, setLibrary] = useState<LibraryState>({ entries: [], sessions: [] });
  const [selection, setSelection] = useState<Selection>();
  const [svg, setSvg] = useState<string | undefined>();

  useEffect(() => {
    const state = loadLibraryState();
    setLibrary(state);
    if (state.entries[0]) {
      setSelection({ kind: "entry", id: state.entries[0].id });
    } else if (state.sessions[0]) {
      setSelection({ kind: "session", id: state.sessions[0].sessionId });
    }
  }, []);

  const savedEntries = useMemo(() => library.entries.filter((entry) => entry.saved), [library.entries]);
  const favoriteEntries = useMemo(() => library.entries.filter((entry) => entry.favorite), [library.entries]);
  const selectedEntry = selection?.kind === "entry" ? library.entries.find((entry) => entry.id === selection.id) : undefined;
  const selectedSession = selection?.kind === "session" ? library.sessions.find((session) => session.sessionId === selection.id) : undefined;
  const selectedXml = selectedEntry ? exerciseToMusicXml(selectedEntry.exercise) : undefined;

  const selectEntry = (entry: LibraryEntry) => {
    setSelection({ kind: "entry", id: entry.id });
    const nextState = updateLibraryEntry(entry.id, (current) => ({ ...current, lastOpenedAt: new Date().toISOString() }));
    setLibrary(nextState);
  };

  const toggleEntry = (field: "saved" | "favorite") => {
    if (!selectedEntry) return;
    const nextState = updateLibraryEntry(selectedEntry.id, (entry) => ({ ...entry, [field]: !entry[field] }));
    setLibrary(nextState);
  };

  return (
    <>
      <PageHeader
        eyebrow="Library"
        title="Saved Exercises and History"
        description="Everything here is stored locally as full snapshots, so saved items and history keep working even when the generator changes later."
      />

      <div className="library-grid">
        <div className="stack">
          <SectionCard title="Saved Exercises" description="Exercises you marked for repeat practice.">
            <div className="library-list">
              {savedEntries.length ? savedEntries.map((entry) => (
                <button key={entry.id} type="button" className={selection?.kind === "entry" && selection.id === entry.id ? "listing-button is-selected" : "listing-button"} onClick={() => selectEntry(entry)}>
                  <strong>{entry.title}</strong>
                  <small>{entry.source} - {entry.createdAt.slice(0, 10)}</small>
                </button>
              )) : <p className="empty-state">No saved exercises yet.</p>}
            </div>
          </SectionCard>

          <SectionCard title="Recent History" description="The latest generated exercises, even if they were not explicitly saved.">
            <div className="library-list">
              {library.entries.length ? library.entries.slice(0, 8).map((entry) => (
                <button key={entry.id} type="button" className={selection?.kind === "entry" && selection.id === entry.id ? "listing-button is-selected" : "listing-button"} onClick={() => selectEntry(entry)}>
                  <strong>{entry.title}</strong>
                  <small>{entry.source} - {entry.lastOpenedAt.slice(0, 10)}</small>
                </button>
              )) : <p className="empty-state">Recent exercises will appear here after you generate a score.</p>}
            </div>
          </SectionCard>

          <SectionCard title="Favorites" description="Your strongest keepers across any mode.">
            <div className="library-list">
              {favoriteEntries.length ? favoriteEntries.map((entry) => (
                <button key={entry.id} type="button" className={selection?.kind === "entry" && selection.id === entry.id ? "listing-button is-selected" : "listing-button"} onClick={() => selectEntry(entry)}>
                  <strong>{entry.title}</strong>
                  <small>{entry.source} - favorite</small>
                </button>
              )) : <p className="empty-state">Favorite exercises will appear here once you mark them.</p>}
            </div>
          </SectionCard>

          <SectionCard title="Guided Session History" description="Completed daily sessions stay here as a practice log.">
            <div className="library-list">
              {library.sessions.length ? library.sessions.map((session) => (
                <button key={session.sessionId} type="button" className={selection?.kind === "session" && selection.id === session.sessionId ? "listing-button is-selected" : "listing-button"} onClick={() => setSelection({ kind: "session", id: session.sessionId })}>
                  <strong>{session.dateKey}</strong>
                  <small>{session.key} - {session.difficulty} - {session.estimatedMinutes} min</small>
                </button>
              )) : <p className="empty-state">Completed guided sessions will appear here.</p>}
            </div>
          </SectionCard>
        </div>

        <div className="stack">
          {selectedEntry ? (
            <>
              <ScoreViewer title={selectedEntry.title} musicXml={selectedXml} onSvgReady={setSvg} />
              <SectionCard title="Exercise Details" description="Reopen, export, save, and favorite directly from the Library preview.">
                <div className="summary-badges">
                  <span className="chip">{selectedEntry.source}</span>
                  <span className="chip">{selectedEntry.exercise.timeSignature}</span>
                  {selectedEntry.tags.map((tag) => (
                    <span key={tag} className="chip">{tag}</span>
                  ))}
                </div>
                {selectedXml ? (
                  <ExportButtons
                    title={selectedEntry.title}
                    musicXml={selectedXml}
                    getSvg={() => svg}
                    onSave={() => toggleEntry("saved")}
                    onFavorite={() => toggleEntry("favorite")}
                    isSaved={selectedEntry.saved}
                    isFavorite={selectedEntry.favorite}
                  />
                ) : null}
              </SectionCard>
            </>
          ) : selectedSession ? (
            <SectionCard title="Session Details" description="A completed guided session stays grouped as one practice log entry.">
              <div className="summary-badges">
                <span className="chip">{selectedSession.dateKey}</span>
                <span className="chip">{selectedSession.key}</span>
                <span className="chip">{selectedSession.difficulty}</span>
                <span className="chip">{selectedSession.estimatedMinutes} min</span>
              </div>
              <div className="session-steps">
                {selectedSession.steps.map((step) => (
                  <div key={step.stepId} className="session-step">
                    <strong>{step.title}</strong>
                    <p>{step.description}</p>
                    <div className="session-step__meta">
                      <span className="chip">{step.minutes} min</span>
                      <span className="chip">{step.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : (
            <SectionCard title="Library Preview" description="Pick an exercise or a session from the left to inspect it here.">
              <p className="empty-state">No saved data yet.</p>
            </SectionCard>
          )}
        </div>
      </div>
    </>
  );
}

