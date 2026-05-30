"use client";

import { useEffect, useMemo, useState } from "react";

import ExportButtons from "@/components/ExportButtons";
import ScoreViewer from "@/components/ScoreViewer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { useMetronome } from "@/components/metronome/MetronomeProvider";
import { NOTE_OPTIONS } from "@/lib/music/constants";
import { buildReviewExercise, buildScalePathExercise, reviewCheckpointForLevel, type ScalePathExercise } from "@/products/scalepath/exercise";
import { checkpointsForLevel, currentChapter, findLevel, SCALEPATH_LEVELS, SCALEPATH_STAGES, SCALEPATH_TEMPOS } from "@/products/scalepath/curriculum";
import {
  completeCheckpoint,
  completeReview,
  defaultScalePathProgress,
  dueReviews,
  isLevelCompleted,
  levelProgressLabel,
  loadScalePathProgress,
  nextCheckpointForLevel,
  nextPracticeAction,
  recommendedLevel,
  saveScalePathProgress,
  scalePathStats,
  type ScalePathProgressState
} from "@/products/scalepath/progress";

type ActiveTarget =
  | { type: "checkpoint"; checkpointId: string }
  | { type: "review"; reviewId: string };

const checkpointById = (checkpointId: string) => {
  const levelId = checkpointId.split(":")[0];
  return checkpointsForLevel(levelId).find((checkpoint) => checkpoint.id === checkpointId);
};

const buildActiveExercise = (state: ScalePathProgressState, activeTarget: ActiveTarget | undefined): ScalePathExercise | { error: string } | undefined => {
  if (!activeTarget) return undefined;

  if (activeTarget.type === "review") {
    const review = state.reviews.find((item) => item.id === activeTarget.reviewId);
    if (!review) return { error: "Review was not found." };
    return buildReviewExercise(review, state.settings);
  }

  const checkpoint = checkpointById(activeTarget.checkpointId);
  if (!checkpoint) return { error: "Checkpoint was not found." };
  const level = findLevel(checkpoint.levelId);
  if (!level) return { error: "Level was not found." };
  return buildScalePathExercise(level, checkpoint, state.settings);
};

export default function ScalePathApp() {
  const [state, setState] = useState<ScalePathProgressState>(defaultScalePathProgress);
  const [ready, setReady] = useState(false);
  const [activeTarget, setActiveTarget] = useState<ActiveTarget>();
  const [svg, setSvg] = useState<string | undefined>();
  const { bpm, setBpm } = useMetronome();

  useEffect(() => {
    const loaded = loadScalePathProgress();
    setState(loaded);
    const action = nextPracticeAction(loaded);
    if (action.type === "review") {
      setActiveTarget({ type: "review", reviewId: action.review.id });
    } else if (action.checkpoint) {
      setActiveTarget({ type: "checkpoint", checkpointId: action.checkpoint.id });
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveScalePathProgress(state);
  }, [ready, state]);

  const stats = useMemo(() => scalePathStats(state), [state]);
  const reviewsDue = useMemo(() => dueReviews(state), [state]);
  const recommended = useMemo(() => recommendedLevel(state), [state]);
  const activeExercise = useMemo(() => buildActiveExercise(state, activeTarget), [activeTarget, state]);
  const renderedExercise = activeExercise && !("error" in activeExercise) ? activeExercise : undefined;

  useEffect(() => {
    if (!renderedExercise || bpm === renderedExercise.checkpoint.tempo) return;
    setBpm(renderedExercise.checkpoint.tempo);
  }, [bpm, renderedExercise, setBpm]);

  const activeLevel = renderedExercise?.level ?? recommended;
  const activeCheckpoint = renderedExercise?.checkpoint ?? nextCheckpointForLevel(state, activeLevel.id);
  const activeCheckpointIndex = activeCheckpoint ? activeCheckpoint.order - 1 : 0;
  const activeStageIndex = activeCheckpoint ? SCALEPATH_STAGES.findIndex((stage) => stage.id === activeCheckpoint.stageId) : 0;
  const completedInActiveLevel = checkpointsForLevel(activeLevel.id).filter((checkpoint) => state.checkpointStatuses[checkpoint.id] === "completed").length;
  const activeTitle = renderedExercise ? renderedExercise.exercise.title : `${recommended.key} ${recommended.scaleType}`;
  const activeDescription = activeTarget?.type === "review"
    ? "Review checkpoint. Pass it to keep the spaced repetition schedule moving."
    : activeCheckpoint
      ? `${activeCheckpoint.stageLabel} at ${activeCheckpoint.tempo} BPM. Complete it and move to the next checkpoint.`
      : "All checkpoints are complete for this level.";

  const startRecommended = () => {
    const action = nextPracticeAction(state);
    if (action.type === "review") {
      setActiveTarget({ type: "review", reviewId: action.review.id });
      return;
    }
    if (action.checkpoint) {
      setActiveTarget({ type: "checkpoint", checkpointId: action.checkpoint.id });
    }
  };

  const moveCheckpoint = (direction: -1 | 1) => {
    if (!activeCheckpoint) return;
    const checkpoints = checkpointsForLevel(activeCheckpoint.levelId);
    const next = checkpoints[activeCheckpointIndex + direction];
    if (next) setActiveTarget({ type: "checkpoint", checkpointId: next.id });
  };

  const markCurrentCheckpointComplete = () => {
    if (!activeTarget || activeTarget.type !== "checkpoint") return;
    const next = completeCheckpoint(state, activeTarget.checkpointId);
    setState(next);
    const action = nextPracticeAction(next);
    if (action.type === "review") {
      setActiveTarget({ type: "review", reviewId: action.review.id });
    } else if (action.checkpoint) {
      setActiveTarget({ type: "checkpoint", checkpointId: action.checkpoint.id });
    }
  };

  const markCurrentReview = (result: "pass" | "needs-review") => {
    if (!activeTarget || activeTarget.type !== "review") return;
    const next = completeReview(state, activeTarget.reviewId, result);
    setState(next);
    const action = nextPracticeAction(next);
    if (action.type === "review") {
      setActiveTarget({ type: "review", reviewId: action.review.id });
    } else if (action.checkpoint) {
      setActiveTarget({ type: "checkpoint", checkpointId: action.checkpoint.id });
    }
  };

  const updateSettings = (patch: Partial<ScalePathProgressState["settings"]>) => {
    setState((current) => ({ ...current, settings: { ...current.settings, ...patch } }));
  };

  return (
    <>
      <PageHeader
        eyebrow="ScalePath"
        title="Major Scale Path"
        description="A focused path through all 12 major scales. The next action stays visible, the metronome follows the checkpoint, and progress stays tied to the curriculum."
        actions={
          <button type="button" className="button button--primary" onClick={startRecommended}>
            Practice today
          </button>
        }
      />

      <div className="guided-grid">
        <SectionCard title="Practice Path" accent>
          <div className="guided-overview scalepath-guided">
            <div className="guided-overview__hero scalepath-guided__hero">
              <div>
                <p className="guided-overview__eyebrow">Current checkpoint</p>
                <h3 className="guided-overview__title">{activeTitle}</h3>
                <p className="guided-overview__description">{activeDescription}</p>
              </div>
              <div className="guided-overview__progress">
                <span className="guided-overview__step-pill">
                  {activeTarget?.type === "review" ? "Review" : `Checkpoint ${activeCheckpointIndex + 1} of 35`}
                </span>
                <div className="guided-overview__dots scalepath-stage-dots">
                  {SCALEPATH_STAGES.map((stage, index) => {
                    const stageCheckpoints = checkpointsForLevel(activeLevel.id).filter((checkpoint) => checkpoint.stageId === stage.id);
                    const stageComplete = stageCheckpoints.every((checkpoint) => state.checkpointStatuses[checkpoint.id] === "completed");
                    const className =
                      index === activeStageIndex
                        ? "guided-overview__dot guided-overview__dot--active"
                        : stageComplete
                          ? "guided-overview__dot guided-overview__dot--completed"
                          : "guided-overview__dot";
                    return (
                      <button
                        key={stage.id}
                        type="button"
                        className={className}
                        onClick={() => {
                          const target = stageCheckpoints.find((checkpoint) => state.checkpointStatuses[checkpoint.id] !== "completed") ?? stageCheckpoints[0];
                          if (target) setActiveTarget({ type: "checkpoint", checkpointId: target.id });
                        }}
                        aria-label={`Go to ${stage.label}`}
                        title={stage.label}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="scalepath-tempo-rail" aria-label="Tempo checkpoints">
              {SCALEPATH_TEMPOS.map((tempo) => {
                const checkpoint = activeCheckpoint ? checkpointsForLevel(activeLevel.id).find((item) => item.stageId === activeCheckpoint.stageId && item.tempo === tempo) : undefined;
                const isActive = checkpoint?.id === activeCheckpoint?.id;
                const isComplete = checkpoint ? state.checkpointStatuses[checkpoint.id] === "completed" : false;
                return (
                  <button
                    key={tempo}
                    type="button"
                    className={isActive ? "scalepath-tempo-rail__item scalepath-tempo-rail__item--active" : isComplete ? "scalepath-tempo-rail__item scalepath-tempo-rail__item--complete" : "scalepath-tempo-rail__item"}
                    onClick={() => checkpoint ? setActiveTarget({ type: "checkpoint", checkpointId: checkpoint.id }) : undefined}
                  >
                    {tempo}
                  </button>
                );
              })}
            </div>

            {activeExercise && "error" in activeExercise ? <div className="notice notice--error">{activeExercise.error}</div> : null}
            {renderedExercise ? <ScoreViewer musicXml={renderedExercise.musicXml} onSvgReady={setSvg} hideHeader /> : null}

            <div className="guided-overview__summary">
              <div className="guided-overview__summary-item">
                <span>Fluency</span>
                <strong>{stats.fluency}%</strong>
              </div>
              <div className="guided-overview__summary-item">
                <span>Level progress</span>
                <strong>{completedInActiveLevel}/35</strong>
              </div>
              <div className="guided-overview__summary-item">
                <span>Chapter</span>
                <strong>{stats.completedLevels}/{stats.totalLevels}</strong>
              </div>
              <div className="guided-overview__summary-item">
                <span>Reviews due</span>
                <strong>{stats.dueReviews}</strong>
              </div>
              <div className="guided-overview__summary-item">
                <span>Review pass</span>
                <strong>{stats.reviewSuccessRate}%</strong>
              </div>
              <div className="guided-overview__summary-item">
                <span>Streak</span>
                <strong>{stats.streak}d</strong>
              </div>
            </div>

            <div className="guided-overview__context-grid">
              <section className="progression-strip" aria-label="Current scale path">
                <p className="progression-strip__label">Path</p>
                <p className="progression-strip__value">
                  {activeLevel.key} {activeLevel.scaleType} - {activeCheckpoint?.stageLabel ?? "Complete"} - {activeCheckpoint?.tempo ?? 120} BPM
                </p>
              </section>
              <section className="progression-strip" aria-label="Daily priority">
                <p className="progression-strip__label">Daily priority</p>
                <p className="progression-strip__value">
                  {reviewsDue.length ? `${reviewsDue.length} review${reviewsDue.length === 1 ? "" : "s"} before new checkpoints.` : "Continue the recommended level."}
                </p>
              </section>
            </div>

            <div className="guided-overview__nav">
              <div className="guided-overview__nav-copy">
                <h3>Move through the path</h3>
                <p>Use the current checkpoint as the center. Complete it, review it, or jump within the same stage when you need a different tempo.</p>
              </div>
              <div className="guided-overview__actions">
                <button type="button" className="button button--ghost" onClick={() => moveCheckpoint(-1)} disabled={!activeCheckpoint || activeCheckpointIndex <= 0 || activeTarget?.type === "review"}>
                  Previous
                </button>
                {activeTarget?.type === "review" ? (
                  <>
                    <button type="button" className="button button--primary" onClick={() => markCurrentReview("pass")}>
                      Pass review
                    </button>
                    <button type="button" className="button button--ghost" onClick={() => markCurrentReview("needs-review")}>
                      Needs review
                    </button>
                  </>
                ) : (
                  <button type="button" className="button button--primary" onClick={markCurrentCheckpointComplete}>
                    Complete checkpoint
                  </button>
                )}
                <button type="button" className="button button--ghost" onClick={() => moveCheckpoint(1)} disabled={!activeCheckpoint || activeCheckpointIndex >= 34 || activeTarget?.type === "review"}>
                  Next
                </button>
              </div>
            </div>

            {renderedExercise ? (
              <div className="guided-overview__session-actions">
                <ExportButtons title={renderedExercise.exercise.title} musicXml={renderedExercise.musicXml} getSvg={() => svg} defaultFormat="png" />
              </div>
            ) : null}
          </div>
        </SectionCard>
      </div>

      <section className="scalepath-lower-grid">
        <SectionCard title="Practice Settings" description="These affect notation only. Progress stays tied to the checkpoint.">
          <div className="field-grid">
            <label>
              <span>Lowest note</span>
              <select value={state.settings.lowestNote} onChange={(event) => updateSettings({ lowestNote: event.target.value })}>
                {NOTE_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Highest note</span>
              <select value={state.settings.highestNote} onChange={(event) => updateSettings({ highestNote: event.target.value })}>
                {NOTE_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Octave range</span>
              <select value={state.settings.octaveSpan} onChange={(event) => updateSettings({ octaveSpan: Number(event.target.value) })}>
                {[1, 2, 3].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Direction</span>
              <select value={state.settings.direction} onChange={(event) => updateSettings({ direction: event.target.value as ScalePathProgressState["settings"]["direction"] })}>
                <option>Ascending</option>
                <option>Descending</option>
                <option>Up and Down</option>
              </select>
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={state.settings.showScaleDegrees} onChange={(event) => updateSettings({ showScaleDegrees: event.target.checked })} />
              <span>Show scale degrees</span>
            </label>
          </div>
        </SectionCard>

        <SectionCard title={currentChapter.name} description="Levels are always available. The recommendation follows curriculum order.">
          <div className="scalepath-level-list">
            {SCALEPATH_LEVELS.map((level) => {
              const completed = isLevelCompleted(state, level.id);
              const checkpoint = nextCheckpointForLevel(state, level.id);
              return (
                <button
                  type="button"
                  key={level.id}
                  className={level.id === recommended.id ? "listing-button is-selected" : "listing-button"}
                  onClick={() => {
                    const target = checkpoint ?? reviewCheckpointForLevel(level.id);
                    setActiveTarget({ type: "checkpoint", checkpointId: target.id });
                  }}
                >
                  <strong>{completed ? "Completed" : level.id === recommended.id ? "Recommended" : "Available"}: {level.key} {level.scaleType}</strong>
                  <small>{completed ? `Completed ${new Date(state.levelCompletedAt[level.id]).toLocaleDateString()}` : `${levelProgressLabel(state, level.id)} checkpoints complete`}</small>
                </button>
              );
            })}
          </div>
        </SectionCard>
      </section>

      <SectionCard title="Reviews" description="Completed levels return on a 1, 3, 7, and 30 day schedule.">
        <div className="scalepath-level-list">
          {state.reviews.length ? (
            state.reviews.map((review) => {
              const level = findLevel(review.levelId);
              return (
                <button
                  type="button"
                  key={review.id}
                  className={review.status === "due" ? "listing-button is-selected" : "listing-button"}
                  onClick={() => setActiveTarget({ type: "review", reviewId: review.id })}
                >
                  <strong>{level?.key ?? "Scale"} review {review.reviewNumber}</strong>
                  <small>{review.status === "completed" ? `Passed ${review.completedAt ? new Date(review.completedAt).toLocaleDateString() : ""}` : `Due ${review.dueDate}`}</small>
                </button>
              );
            })
          ) : (
            <p className="empty-state">Complete C Major to schedule the first review.</p>
          )}
        </div>
      </SectionCard>
    </>
  );
}

