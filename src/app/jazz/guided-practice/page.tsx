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

const formatStatusLabel = (value: string): string =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function GuidedPracticePage() {
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | undefined>();
  const [svg, setSvg] = useState<string | undefined>();
  const [defaultExportFormat, setDefaultExportFormat] = useState<ExportFormat>(defaultAppSettings.defaultExportFormat);
  const [entry, setEntry] = useState<LibraryEntry | undefined>();
  const [notice, setNotice] = useState<string | undefined>();
  const [loadError, setLoadError] = useState<string | undefined>();
  const timer = usePracticeTimer(session?.status === "in-progress");

  const focusStep = (stepId: string | undefined) => {
    if (!stepId) return;
    setActiveStepId(stepId);
    setSession((current) => (current ? { ...current, activeStepId: stepId } : current));
  };

  const loadSession = () => {
    try {
      const settings = loadAppSettings();
      setDefaultExportFormat(settings.defaultExportFormat);
      const nextSession = hydrateSession();
      setSession(nextSession);
      setActiveStepId(nextSession.activeStepId ?? nextSession.steps[0]?.stepId);
      setLoadError(undefined);
    } catch (error) {
      setSession(null);
      setActiveStepId(undefined);
      setLoadError(error instanceof Error ? error.message : "Unable to generate today's guided practice session.");
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (!session) return;
    saveDailySession(session);
  }, [session]);

  const activeStep = useMemo<PracticeStep | undefined>(
    () => session?.steps.find((step) => step.stepId === activeStepId) ?? session?.steps[0],
    [activeStepId, session]
  );

  const activeStepIndex = useMemo(() => {
    if (!session || !activeStep) return -1;
    return session.steps.findIndex((step) => step.stepId === activeStep.stepId);
  }, [activeStep, session]);

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
    setActiveStepId(stepId);
  };

  const moveStep = (direction: -1 | 1) => {
    if (!session || activeStepIndex < 0) return;
    const nextStep = session.steps[activeStepIndex + direction];
    if (!nextStep) return;
    focusStep(nextStep.stepId);
    setNotice(undefined);
  };

  const startStep = (step: PracticeStep) => {
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
        <SectionCard title="Session unavailable" description={loadError ?? "Loading today's practice..."} accent>
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
        <SectionCard title="Session Overview" accent>
          {activeStep ? (
            <div className="guided-overview">
              <div className="guided-overview__hero">
                <div>
                  <p className="guided-overview__eyebrow">Current focus</p>
                  <h3 className="guided-overview__title">
                    {activeStepIndex + 1}. {activeStep.title}
                  </h3>
                  <p className="guided-overview__description">{activeStep.description}</p>
                </div>
                <div className="guided-overview__progress">
                  <span className="guided-overview__step-pill">Step {activeStepIndex + 1} of {session.steps.length}</span>
                  <div className="guided-overview__dots">
                    {session.steps.map((step, index) => {
                      const statusClassName =
                        step.stepId === activeStep.stepId
                          ? "guided-overview__dot guided-overview__dot--active"
                          : step.status === "completed"
                            ? "guided-overview__dot guided-overview__dot--completed"
                            : step.status === "skipped"
                              ? "guided-overview__dot guided-overview__dot--skipped"
                              : step.status === "in-progress"
                                ? "guided-overview__dot guided-overview__dot--in-progress"
                                : "guided-overview__dot";

                      return (
                        <button
                          key={step.stepId}
                          type="button"
                          className={statusClassName}
                          onClick={() => focusStep(step.stepId)}
                          aria-label={`Go to step ${index + 1}: ${step.title}`}
                          title={`Step ${index + 1}: ${step.title}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="guided-overview__meta">
                <span className="chip">Key {session.key}</span>
                <span className="chip">{session.difficulty}</span>
                <span className="chip">{session.estimatedMinutes} min</span>
                <span className="chip">{formatStatusLabel(session.status)}</span>
                <span className="chip">{activeStep.minutes} min focus</span>
                <span className="chip">{formatStatusLabel(activeStep.status)}</span>
                {activeStep.jazzMode ? <span className="chip">{activeStep.jazzMode}</span> : null}
              </div>

              <div className="guided-overview__nav">
                <div className="guided-overview__nav-copy">
                  <h3>Move through the session</h3>
                  <p>Use the step controls to navigate, then start or complete the current focus when you are ready.</p>
                </div>
                <div className="guided-overview__actions">
                  <button type="button" className="button button--ghost" onClick={() => moveStep(-1)} disabled={activeStepIndex <= 0}>
                    Previous step
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => moveStep(1)}
                    disabled={activeStepIndex < 0 || activeStepIndex >= session.steps.length - 1}
                  >
                    Next step
                  </button>
                  <button type="button" className="button button--primary" onClick={() => startStep(activeStep)}>
                    {activeStep.status === "not-started" ? "Start step" : "Resume step"}
                  </button>
                  <button type="button" className="button button--ghost" onClick={() => updateStepStatus(activeStep.stepId, "completed")}>
                    Mark complete
                  </button>
                  <button type="button" className="button button--ghost" onClick={() => updateStepStatus(activeStep.stepId, "skipped")}>
                    Skip
                  </button>
                </div>
              </div>

              <div className="guided-overview__session-actions">
                <button type="button" className="button button--primary" onClick={completeSession}>
                  Mark session complete
                </button>
                <button type="button" className="button button--ghost" onClick={regenerateSession}>
                  Regenerate today's session
                </button>
              </div>

              {notice ? <div className="notice notice--success">{notice}</div> : null}
            </div>
          ) : null}
        </SectionCard>

        {activeStep ? (
          <div className="stack">
            <ScoreViewer title={activeStep.exercise.title} musicXml={activeXml} onSvgReady={setSvg} />
            <SectionCard title={activeStep.title} description={activeStep.description}>
              <div className="summary-badges">
                <span className="chip">{activeStep.minutes} min</span>
                <span className="chip">{formatStatusLabel(activeStep.status)}</span>
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
