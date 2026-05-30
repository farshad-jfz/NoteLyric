"use client";

import { checkpointsForLevel, findLevel, nextLevelAfter, SCALEPATH_LEVELS } from "@/products/scalepath/curriculum";

export type CheckpointStatus = "not-started" | "in-progress" | "completed";
export type ReviewStatus = "due" | "completed";
export type ReviewResult = "pass" | "needs-review";

export type ScalePathSettings = {
  lowestNote: string;
  highestNote: string;
  octaveSpan: number;
  direction: "Ascending" | "Descending" | "Up and Down";
  showScaleDegrees: boolean;
};

export type ScalePathReview = {
  id: string;
  levelId: string;
  reviewNumber: number;
  dueDate: string;
  status: ReviewStatus;
  result?: ReviewResult;
  completedAt?: string;
};

export type ScalePathProgressState = {
  checkpointStatuses: Record<string, CheckpointStatus>;
  levelCompletedAt: Record<string, string>;
  reviews: ScalePathReview[];
  settings: ScalePathSettings;
  practiceDates: string[];
};

export type ScalePathStats = {
  totalCheckpoints: number;
  completedCheckpoints: number;
  completedLevels: number;
  totalLevels: number;
  dueReviews: number;
  reviewSuccessRate: number;
  fluency: number;
  streak: number;
};

const STORAGE_KEY = "scalepath:v1:progress";
const REVIEW_DELAYS = [1, 3, 7, 30];

export const defaultScalePathSettings: ScalePathSettings = {
  lowestNote: "C4",
  highestNote: "C6",
  octaveSpan: 1,
  direction: "Up and Down",
  showScaleDegrees: true
};

export const defaultScalePathProgress: ScalePathProgressState = {
  checkpointStatuses: {},
  levelCompletedAt: {},
  reviews: [],
  settings: defaultScalePathSettings,
  practiceDates: []
};

const todayKey = (date = new Date()): string => date.toISOString().slice(0, 10);

const addDays = (date: Date, days: number): string => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return todayKey(next);
};

const isBrowser = (): boolean => typeof window !== "undefined";

export const loadScalePathProgress = (): ScalePathProgressState => {
  if (!isBrowser()) return defaultScalePathProgress;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultScalePathProgress;
    const parsed = JSON.parse(raw) as Partial<ScalePathProgressState>;
    return {
      checkpointStatuses: parsed.checkpointStatuses ?? {},
      levelCompletedAt: parsed.levelCompletedAt ?? {},
      reviews: parsed.reviews ?? [],
      settings: { ...defaultScalePathSettings, ...parsed.settings },
      practiceDates: parsed.practiceDates ?? []
    };
  } catch {
    return defaultScalePathProgress;
  }
};

export const saveScalePathProgress = (state: ScalePathProgressState): void => {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const markPracticedToday = (state: ScalePathProgressState): ScalePathProgressState => {
  const today = todayKey();
  if (state.practiceDates.includes(today)) return state;
  return { ...state, practiceDates: [...state.practiceDates, today].slice(-90) };
};

const scheduledReviewsForLevel = (levelId: string, completedAt: Date): ScalePathReview[] =>
  REVIEW_DELAYS.map((delay, index) => ({
    id: `${levelId}:review-${index + 1}`,
    levelId,
    reviewNumber: index + 1,
    dueDate: addDays(completedAt, delay),
    status: "due"
  }));

export const isLevelCompleted = (state: ScalePathProgressState, levelId: string): boolean =>
  checkpointsForLevel(levelId).every((checkpoint) => state.checkpointStatuses[checkpoint.id] === "completed");

export const completeCheckpoint = (state: ScalePathProgressState, checkpointId: string): ScalePathProgressState => {
  const next: ScalePathProgressState = markPracticedToday({
    ...state,
    checkpointStatuses: { ...state.checkpointStatuses, [checkpointId]: "completed" }
  });
  const levelId = checkpointId.split(":")[0];

  if (!next.levelCompletedAt[levelId] && isLevelCompleted(next, levelId)) {
    const completedAt = new Date();
    return {
      ...next,
      levelCompletedAt: { ...next.levelCompletedAt, [levelId]: completedAt.toISOString() },
      reviews: [...next.reviews.filter((review) => review.levelId !== levelId), ...scheduledReviewsForLevel(levelId, completedAt)]
    };
  }

  return next;
};

export const completeReview = (state: ScalePathProgressState, reviewId: string, result: ReviewResult): ScalePathProgressState => {
  const today = new Date();
  return markPracticedToday({
    ...state,
    reviews: state.reviews.map((review) =>
      review.id === reviewId
        ? {
            ...review,
            status: result === "pass" ? "completed" : "due",
            result,
            completedAt: today.toISOString(),
            dueDate: result === "pass" ? review.dueDate : addDays(today, 1)
          }
        : review
    )
  });
};

export const nextCheckpointForLevel = (state: ScalePathProgressState, levelId: string) =>
  checkpointsForLevel(levelId).find((checkpoint) => state.checkpointStatuses[checkpoint.id] !== "completed");

export const recommendedLevel = (state: ScalePathProgressState) =>
  SCALEPATH_LEVELS.find((level) => !isLevelCompleted(state, level.id)) ?? SCALEPATH_LEVELS[0];

export const dueReviews = (state: ScalePathProgressState, date = new Date()): ScalePathReview[] => {
  const today = todayKey(date);
  return state.reviews
    .filter((review) => review.status === "due" && review.dueDate <= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.reviewNumber - b.reviewNumber);
};

export const nextPracticeAction = (state: ScalePathProgressState) => {
  const review = dueReviews(state)[0];
  if (review) {
    const level = findLevel(review.levelId);
    return { type: "review" as const, review, level };
  }

  const level = recommendedLevel(state);
  const checkpoint = nextCheckpointForLevel(state, level.id);
  return { type: "checkpoint" as const, level, checkpoint };
};

const calculateStreak = (practiceDates: string[]): number => {
  const practiced = new Set(practiceDates);
  let streak = 0;
  const cursor = new Date();

  while (practiced.has(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

export const scalePathStats = (state: ScalePathProgressState): ScalePathStats => {
  const totalCheckpoints = SCALEPATH_LEVELS.length * checkpointsForLevel(SCALEPATH_LEVELS[0].id).length;
  const completedCheckpoints = Object.values(state.checkpointStatuses).filter((status) => status === "completed").length;
  const completedLevels = SCALEPATH_LEVELS.filter((level) => isLevelCompleted(state, level.id)).length;
  const completedReviews = state.reviews.filter((review) => review.completedAt);
  const passedReviews = completedReviews.filter((review) => review.result === "pass").length;
  const reviewSuccessRate = completedReviews.length ? Math.round((passedReviews / completedReviews.length) * 100) : 100;
  const completionProgress = totalCheckpoints ? (completedCheckpoints / totalCheckpoints) * 100 : 0;
  const fluency = Math.round(completionProgress * 0.7 + reviewSuccessRate * 0.3);

  return {
    totalCheckpoints,
    completedCheckpoints,
    completedLevels,
    totalLevels: SCALEPATH_LEVELS.length,
    dueReviews: dueReviews(state).length,
    reviewSuccessRate,
    fluency,
    streak: calculateStreak(state.practiceDates)
  };
};

export const levelProgressLabel = (state: ScalePathProgressState, levelId: string): string => {
  const completed = checkpointsForLevel(levelId).filter((checkpoint) => state.checkpointStatuses[checkpoint.id] === "completed").length;
  return `${completed} / 35`;
};

export const nextLevelRecommendationLabel = (state: ScalePathProgressState): string => {
  const level = recommendedLevel(state);
  if (!isLevelCompleted(state, level.id)) return `${level.key} ${level.scaleType}`;
  const nextLevel = nextLevelAfter(level.id);
  return nextLevel ? nextLevel.key + " " + nextLevel.scaleType : "ScalePath complete";
};

