"use client";

import { ContextExplanation } from "@/lib/music/education";

type Props = {
  explanation: ContextExplanation;
};

export default function ContextExplanationCard({ explanation }: Props) {
  return (
    <section className="context-card" aria-live="polite">
      <p className="context-card__eyebrow">Quick guide</p>
      <h3 className="context-card__title">{explanation.title}</h3>
      <p className="context-card__body">{explanation.definition}</p>
      <div className="context-card__meta">
        <p>
          <strong>{explanation.formulaLabel}:</strong> {explanation.formula}
        </p>
        <p>
          <strong>Example:</strong> {explanation.example}
        </p>
        {explanation.tip ? (
          <p>
            <strong>Learning tip:</strong> {explanation.tip}
          </p>
        ) : null}
      </div>
    </section>
  );
}
