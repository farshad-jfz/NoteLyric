"use client";

import { ReactNode } from "react";

type Props = {
  title: string;
  mode: "Quick" | "Advanced";
  onModeChange: (mode: "Quick" | "Advanced") => void;
  children: ReactNode;
};

export default function ExerciseControls({ title, mode, onModeChange, children }: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{title}</h2>
        <div className="mode-toggle" role="group" aria-label="UI mode">
          <button className={mode === "Quick" ? "active" : ""} onClick={() => onModeChange("Quick")} type="button">
            Quick
          </button>
          <button className={mode === "Advanced" ? "active" : ""} onClick={() => onModeChange("Advanced")} type="button">
            Advanced
          </button>
        </div>
      </div>
      {children}
    </section>
  );
}
