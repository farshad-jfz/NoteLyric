"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { ExportFormat, LibraryEntry, PracticeSession, PracticeStep } from "@/lib/app/types";
import { defaultAppSettings, loadAppSettings, loadDailySession, recordExerciseHistory, saveDailySession, storeCompletedSession, upsertLibraryEntry } from "@/lib/app/storage";
import ExportButtons from "@/components/ExportButtons";
import ScoreViewer from "@/components/ScoreViewer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import TimerPill from "@/components/ui/TimerPill";
import { usePracticeTimer } from "@/hooks/usePracticeTimer";
import { generatePracticeSession, getTodayDateKey } from "@/lib/guidedPractice/session";
import { exerciseToMusicXml } from "@/lib/music/xmlBuilder";

const hydrateSession = (): PracticeSession => {
  const appSettings = loadAppSettings();
  const stored = loadDailySession();
  const today = getTodayDateKey();
  if (stored && stored.dateKey === today) return stored;
  return generatePracticeSession(appSettings ?? defaultAppSettings, today);
};

export default function GuidedPracticePage() {
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | undefined>();
  const [svg, setSvg] = useState<string | undefined>();
  const [defaultExportFormat, setDefaultExportFormat] = useState<ExportFormat>(defaultAppSettings.defaultExportFormat);
  const [entry, setEntry] = useState<LibraryEntry | undefined>();
  const [notice, setNotice] = useState<string | undefined>();
  const [loadError, setLoadError] = useState<string | undefined>();
  const timer = usePracticeTimer(session?.status === "in-progress");

  const loadSession = (message?: string) => {
    try {
      const settings = loadAppSettings();
      setDefaultExportFormat(settings.defaultExportFormat);
      const nextSession = hydrateSession();
      setSession(nextSession);
      setActiveStepId(nextSession.activeStepId ?? nextSession.steps[0]?.stepId);
      setLoadError(undefined);
      if (message) {
        setNotice(message);
      }
    } catch (error) {
      setSession(null);
      setActiveStepId(undefined);
      setLoadError(error instanceof Error ? error.message : "Unable to generate today's guided practice session.");
      if (message) {
        setNotice(undefined);
      }
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (!session) return;
    saveDailySession(session);
  }, [session]);

  const activeStep = useMemo<PracticeStep | undefined>(() => session?.steps.find((step) => step.stepId === activeStepId) ?? session?.steps[0], [activeStepId, session]);
  const activeXml = activeStep ? exerciseToMusicXml(activeStep.exercise) : undefined;

  const updateStepStatus = (stepId: string, status: PracticeStep["status"]) => {
    setSession((current) => {
      if (!current) return current;
      const nextSteps = current.steps.map((step) => (step.stepId === stepId ? { ...step, status } : step));
      const completed = nextSteps.every((step) => step.status === "completed" || step.status === "skipped");
      return {
        ...current,
        activeStepId: stepId,
        status: completed ? "completed" : "in-progress",
        startedAt: current.startedAt ?? new Date().toISOString(),
        completedAt: completed ? new Date().toISOString() : current.completedAt,
        steps: nextSteps
      };
    });
  };

  const startStep = (step: PracticeStep) => {
    setActiveStepId(step.stepId);
    setNotice(undefined);
    updateStepStatus(step.stepId, "in-progress");
  };

  const saveCurrentStep = (favorite = false) => {
    if (!activeStep) return;
    const historyEntry = recordExerciseHistory(activeStep.exercise, "guided-practice");
    const nextEntry = favorite
      ? upsertLibraryEntry({ ...historyEntry, exercise: activeStep.exercise, source: "guided-practice", saved: true, favorite: !historyEntry.favorite })
      : upsertLibraryEntry({ ...historyEntry, exercise: activeStep.exercise, source: "guided-practice", saved: true });
    setEntry(nextEntry);
    setNotice(favorite ? (nextEntry.favorite ? "Step added to favorites." : "Favorite removed.") : "Step saved to Library.");
  };

  const completeSession = () => {
    if (!session) return;
    const completedSession = { ...session, status: "completed" as const, completedAt: new Date().toISOString() };
    setSession(completedSession);
    storeCompletedSession(completedSession);
    setNotice("Session marked complete and added to history.");
  };

  const regenerateSession = () => {
    try {
      const next = generatePracticeSession(loadAppSettings(), getTodayDateKey());
      setSession(next);
      setActiveStepId(next.steps[0]?.stepId);
      setEntry(undefined);
      setLoadError(undefined);
      setNotice("Today's practice was regenerated.");
    } catch (error) {
      setSession(null);
      setActiveStepId(undefined);
      setLoadError(error instanceof Error ? error.message : "Unable to regenerate today's guided practice session.");
      setNotice(undefined);
    }
  };

  if (!session) {
    return (
      <>
        <PageHeader
          eyebrow="Guided Practice"
          title="Today's Practice"
          description="The app keeps one guided session per day. If generation fails, you can adjust settings and try again without crashing the page."
        />
        <SectionCard
          title="Session unavailable"
          description={loadError ?? "Loading today's practice..."}
          accent
        >
          <div className="button-row">
            <button type="button" className="button button--primary" onClick={regenerateSession}>
              Try again
            </button>
            <Link href="/settings" className="button button--ghost">
              Open settings
            </Link>
          </div>
        </SectionCard>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Guided Practice"
        title="Today's Practice"
        description={`A structured ${session.estimatedMinutes} minute session in ${session.key}. Stay in one key, complete the steps in order, and use the score as the center of the workflow.`}
        actions={<TimerPill label="Session timer" value={timer} />}
      />

      <div className="guided-grid">
        <SectionCard title="Session Overview" description="The app keeps the same session for the whole day so you can stop and resume without losing context." accent>
          <div className="summary-badges">
            <span className="chip">Key {session.key}</span>
            <span className="chip">{session.difficulty}</span>
            <span className="chip">{session.estimatedMinutes} min</span>
            <span className="chip">{session.status}</span>
          </div>
          <div className="session-steps">
            {session.steps.map((step, index) => (
              <div key={step.stepId} className={step.stepId === activeStepId ? "session-step is-active" : "session-step"}>
                <strong>{index + 1}. {step.title}</strong>
                <p>{step.description}</p>
                <div className="session-step__meta">
                  <span className="chip">{step.minutes} min</span>
                  <span className="chip">{step.status}</span>
                  {step.jazzMode ? <span className="chip">{step.jazzMode}</span> : null}
                </div>
                <div className="session-step__actions">
                  <button type="button" className="button button--primary" onClick={() => startStep(step)}>
                    {step.status === "not-started" ? "Start" : "Resume"}
                  </button>
                  <button type="button" className="button button--ghost" onClick={() => updateStepStatus(step.stepId, "completed")}>
                    Mark complete
                  </button>
                  <button type="button" className="button button--ghost" onClick={() => updateStepStatus(step.stepId, "skipped")}>
                    Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="button-row">
            <button type="button" className="button button--primary" onClick={completeSession}>
              Mark session complete
            </button>
            <button type="button" className="button button--ghost" onClick={regenerateSession}>
              Regenerate today's session
            </button>
          </div>
          {notice ? <div className="notice notice--success">{notice}</div> : null}
        </SectionCard>

        {activeStep ? (
          <div className="stack">
            <ScoreViewer title={activeStep.exercise.title} musicXml={activeXml} onSvgReady={setSvg} />
            <SectionCard title={activeStep.title} description={activeStep.description}>
              <div className="summary-badges">
                <span className="chip">{activeStep.minutes} min</span>
                <span className="chip">{activeStep.status}</span>
                <span className="chip">{activeStep.exercise.timeSignature}</span>
              </div>
              {activeXml ? (
                <ExportButtons
                  title={activeStep.exercise.title}
                  musicXml={activeXml}
                  getSvg={() => svg}
                  defaultFormat={defaultExportFormat}
                  onSave={() => saveCurrentStep(false)}
                  onFavorite={() => saveCurrentStep(true)}
                  isSaved={entry?.saved}
                  isFavorite={entry?.favorite}
                />
              ) : null}
            </SectionCard>
          </div>
        ) : null}
      </div>
    </>
  );
}
