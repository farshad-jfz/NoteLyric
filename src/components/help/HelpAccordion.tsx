import type { HelpEntry } from "@/content/help/types";

export type HelpAccordionProps = {
  items: HelpEntry[];
};

export default function HelpAccordion({ items }: HelpAccordionProps) {
  return (
    <div className="help-accordion" aria-label="Help topics">
      {items.map((item) => (
        <details key={item.id} className="help-accordion__item" id={item.id}>
          <summary className="help-accordion__summary">
            <div>
              <h3>{item.title}</h3>
              <p>{item.shortDescription}</p>
            </div>
            {item.bestFor ? <span className="help-accordion__best-for">Best for: {item.bestFor}</span> : null}
          </summary>

          <div className="help-accordion__content">
            {item.theory ? <p>{item.theory}</p> : null}
            {item.fullDescription ? <p>{item.fullDescription}</p> : null}
            {item.practiceTip ? <p className="help-accordion__tip">Practice tip: {item.practiceTip}</p> : null}

            {item.howToPractice?.length ? (
              <div className="help-accordion__block">
                <h4>How to practice</h4>
                <ul className="help-list">
                  {item.howToPractice.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {item.commonMistakes?.length ? (
              <div className="help-accordion__block">
                <h4>Common mistakes</h4>
                <ul className="help-list">
                  {item.commonMistakes.map((mistake) => (
                    <li key={mistake}>{mistake}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  );
}