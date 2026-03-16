"use client";

import type { ReactNode } from "react";

import type { ContextExplanation } from "@/lib/music/education";
import ContextExplanationCard from "@/components/ContextExplanationCard";
import ScoreViewer from "@/components/ScoreViewer";

type SummaryItem = {
  label: string;
  value: string;
};

type FocusBlock = {
  label: string;
  value: string;
};

type Props = {
  title: string;
  description: string;
  musicXml?: string;
  onSvgReady?: (svg?: string) => void;
  summaryItems: SummaryItem[];
  explanation?: ContextExplanation;
  focusBlock?: FocusBlock;
  actions?: ReactNode;
  exports?: ReactNode;
  notices?: ReactNode;
};

export default function PracticeWorkspace({
  title,
  description,
  musicXml,
  onSvgReady,
  summaryItems,
  explanation,
  focusBlock,
  actions,
  exports,
  notices
}: Props) {
  return (
    <section className="panel practice-workspace">
      <div className="practice-workspace__hero">
        <div>
          <p className="practice-workspace__eyebrow">Current focus</p>
          <h2 className="practice-workspace__title">{title}</h2>
          <p className="practice-workspace__description">{description}</p>
        </div>
      </div>

      <ScoreViewer musicXml={musicXml} onSvgReady={onSvgReady} hideHeader />

      <div className="practice-workspace__summary">
        {summaryItems.map((item) => (
          <div key={`${item.label}-${item.value}`} className="practice-workspace__summary-item">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      {(explanation || focusBlock) ? (
        <div className="practice-workspace__context-grid">
          {explanation ? <ContextExplanationCard explanation={explanation} /> : null}
          {focusBlock ? (
            <section className="progression-strip" aria-label={focusBlock.label}>
              <p className="progression-strip__label">{focusBlock.label}</p>
              <p className="progression-strip__value">{focusBlock.value}</p>
            </section>
          ) : null}
        </div>
      ) : null}

      {actions ? <div className="practice-workspace__actions">{actions}</div> : null}
      {exports ? <div className="practice-workspace__exports">{exports}</div> : null}
      {notices ? <div className="practice-workspace__notices">{notices}</div> : null}
    </section>
  );
}