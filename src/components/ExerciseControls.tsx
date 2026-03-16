"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  mode: "Quick" | "Advanced";
  onModeChange: (mode: "Quick" | "Advanced") => void;
  children: ReactNode;
};

export default function ExerciseControls({ title, mode, onModeChange, children }: Props) {
  return (
    <section className="panel exercise-controls">
      <div className="exercise-controls__header">
        <div>
          <p className="eyebrow">Settings</p>
          <h2>{title}</h2>
        </div>
        <div className="segmented" role="tablist" aria-label={`${title} mode`}>
          {(["Quick", "Advanced"] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={mode === option ? "segmented__button segmented__button--active" : "segmented__button"}
              onClick={() => onModeChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="stack">{children}</div>
    </section>
  );
}
