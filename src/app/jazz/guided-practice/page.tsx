"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { PracticeSession, PracticeStep } from "@/lib/app/types";
import { defaultAppSettings, loadAppSettings, loadDailySession, saveDailySession, storeCompletedSession } from "@/lib/app/storage";
import ContextExplanationCard from "@/components/ContextExplanationCard";
import ScoreViewer from "@/components/ScoreViewer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import TimerPill from "@/components/ui/TimerPill";
import { usePracticeTimer } from "@/hooks/usePracticeTimer";
import type { ContextExplanation } from "@/lib/music/education";
import { CHORD_EXPLANATIONS, SCALE_EXPLANATIONS } from "@/lib/music/education";
import { generatePracticeSession, getTodayDateKey } from "@/lib/guidedPractice/session";
import { JAZZ_MODE_EXPLANATIONS } from "@/lib/music/jazz";
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

const metadataText = (step: PracticeStep | undefined, key: string): string | undefined => {
  if (!step) return undefined;
  const value = step.exercise.metadata[key];
  return value === undefined || value === null ? undefined : String(value);
};

const explanationForStep = (step: PracticeStep | undefined): ContextExplanation | undefined => {
  if (!step) return undefined;

  if (step.exercise.type === "jazz" && step.jazzMode) {
    return JAZZ_MODE_EXPLANATIONS[step.jazzMode];
  }

  if (step.exercise.type === "scale") {
    const scaleType = metadataText(step, "scaleType");
    if (scaleType && SCALE_EXPLANATIONS[scaleType]) {
      return SCALE_EXPLANATIONS[scaleType];
    }
  }

  if (step.exercise.type === "chord") {
    const chordType = metadataText(step, "chordType");
    if (chordType && CHORD_EXPLANATIONS[chordType]) {
      return CHORD_EXPLANATIONS[chordType];
    }
  }

  if (step.kind === "creative") {
    return {
      title: "Creative Response",
      definition: "Use the written material as a starting point, then shape it into something that sounds conversational and musical.",
      formulaLabel: "Focus",
      formula: "Repeat the idea, vary the ending, then leave a little space.",
      example: "Play the phrase once, answer it with a shorter variation.",
      tip: "Aim for clear phrasing before adding extra notes."
    };
  }

  return undefined;
};

const focusInfoForStep = (step: PracticeStep | undefined): { label: string; value: string } | undefined => {
  if (!step) return undefined;

  if (step.exercise.measureAnnotations?.length) {
    return {
      label: "Current progression",
      value: step.exercise.measureAnnotations.join(" | ")
    };
  }

  if (step.exercise.type === "scale") {
    const root = metadataText(step, "root");
    const scaleType = metadataText(step, "scaleType");
    const direction = metadataText(step, "direction");
    return {
      label: "Current pattern",
      value: [root, scaleType, direction].filter(Boolean).join(" - ")
    };
  }

  if (step.exercise.type === "chord") {
    const root = metadataText(step, "root");
    const chordType = metadataText(step, "chordType");
    const pattern = metadataText(step, "pattern");
    return {
      label: "Current pattern",
      value: [root, chordType, pattern].filter(Boolean).join(" - ")
    };
  }

  return undefined;
};

export default function GuidedPracticePage() {
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | undefined>();
  const [loadError, setLoadError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();
  const timer = usePracticeTimer(session?.status === "in-progress");

  const focusStep = (stepId: string | undefined) => {
    if (!stepId) return;
    setActiveStepId(stepId);
    setSession((current) => (current ? { ...current, activeStepId: stepId } : current));
  };

  const loadSession = () => {
    try {
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

  const currentExplanation = useMemo(() => explanationForStep(activeStep), [activeStep]);
  const currentFocusInfo = useMemo(() => focusInfoForStep(activeStep), [activeStep]);
  const activeXml = activeStep ? exerciseToMusicXml(activeStep.exercise) : undefined;

  const advanceToNeighbor = (current: PracticeSession, stepId: string): string | undefined => {
    const index = current.steps.findIndex((step) => step.stepId === stepId);
    if (index < 0) return current.activeStepId;
    return current.steps[index + 1]?.stepId ?? current.steps[index - 1]?.stepId ?? stepId;
  };

  const updateStepStatus = (stepId: string, status: PracticeStep["status"], options?: { advance?: boolean }) => {
    setSession((current) => {
      if (!current) return current;
      const nextSteps = current.steps.map((step) => (step.stepId === stepId ? { ...step, status } : step));
      const completed = nextSteps.every((step) => step.status === "completed" || step.status === "skipped");
      const nextActiveStepId = options?.advance ? advanceToNeighbor({ ...current, steps: nextSteps }, stepId) : stepId;
      setActiveStepId(nextActiveStepId);

      return {
        ...current,
        activeStepId: nextActiveStepId,
        status: completed ? "completed" : "in-progress",
        startedAt: current.startedAt ?? new Date().toISOString(),
        completedAt: completed ? new Date().toISOString() : current.completedAt,
        steps: nextSteps
      };
    });
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

  const completeCurrentStep = () => {
    if (!activeStep) return;
    setNotice("Step completed. Moving to the next focus.");
    updateStepStatus(activeStep.stepId, "completed", { advance: true });
  };

  const skipCurrentStep = () => {
    if (!activeStep) return;
    setNotice("Step skipped. Moving forward in the session.");
    updateStepStatus(activeStep.stepId, "skipped", { advance: true });
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

              <ScoreViewer musicXml={activeXml} hideHeader />

              <div className="guided-overview__summary">
                <div className="guided-overview__summary-item">
                  <span>Session key</span>
                  <strong>{session.key}</strong>
                </div>
                <div className="guided-overview__summary-item">
                  <span>Level</span>
                  <strong>{session.difficulty}</strong>
                </div>
                <div className="guided-overview__summary-item">
                  <span>Session status</span>
                  <strong>{formatStatusLabel(session.status)}</strong>
                </div>
                <div className="guided-overview__summary-item">
                  <span>Current step</span>
                  <strong>{formatStatusLabel(activeStep.status)}</strong>
                </div>
                <div className="guided-overview__summary-item">
                  <span>Step time</span>
                  <strong>{activeStep.minutes} min</strong>
                </div>
                <div className="guided-overview__summary-item">
                  <span>Total session</span>
                  <strong>{session.estimatedMinutes} min</strong>
                </div>
              </div>

              {(currentExplanation || currentFocusInfo) ? (
                <div className="guided-overview__context-grid">
                  {currentExplanation ? <ContextExplanationCard explanation={currentExplanation} /> : null}
                  {currentFocusInfo ? (
                    <section className="progression-strip" aria-label={currentFocusInfo.label}>
                      <p className="progression-strip__label">{currentFocusInfo.label}</p>
                      <p className="progression-strip__value">{currentFocusInfo.value}</p>
                    </section>
                  ) : null}
                </div>
              ) : null}

              <div className="guided-overview__nav">
                <div className="guided-overview__nav-copy">
                  <h3>Move through the session</h3>
                  <p>Finish or skip the current focus to move forward. Use previous when you want to revisit an earlier step.</p>
                </div>
                <div className="guided-overview__actions">
                  <button type="button" className="button button--ghost" onClick={() => moveStep(-1)} disabled={activeStepIndex <= 0}>
                    Previous step
                  </button>
                  <button type="button" className="button button--primary" onClick={() => startStep(activeStep)}>
                    {activeStep.status === "not-started" ? "Start step" : "Resume step"}
                  </button>
                  <button type="button" className="button button--ghost" onClick={completeCurrentStep}>
                    Mark complete
                  </button>
                  <button type="button" className="button button--ghost" onClick={skipCurrentStep}>
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
      </div>
    </>
  );
}