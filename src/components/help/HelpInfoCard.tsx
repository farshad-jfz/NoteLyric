import Link from "next/link";
import type { ReactNode } from "react";
import { IconInfoCircle } from "@tabler/icons-react";

export type HelpInfoCardProps = {
  title: string;
  shortDescription: string;
  practiceTip?: string;
  collapsible?: boolean;
  fullDescription?: string;
  detailsTitle?: string;
  learnMoreHref?: string;
  learnMoreLabel?: string;
  children?: ReactNode;
};

export default function HelpInfoCard({
  title,
  shortDescription,
  practiceTip,
  collapsible = false,
  fullDescription,
  detailsTitle = "Learn more",
  learnMoreHref,
  learnMoreLabel = "Open full help",
  children
}: HelpInfoCardProps) {
  const hasDetails = Boolean(fullDescription || children || learnMoreHref);

  return (
    <section className="panel help-info-card" aria-label={title}>
      <div className="help-info-card__header">
        <div className="help-info-card__icon" aria-hidden="true">
          <IconInfoCircle size={18} />
        </div>
        <div>
          <p className="help-info-card__eyebrow">Practice help</p>
          <h2 className="help-info-card__title">{title}</h2>
        </div>
      </div>

      <p className="help-info-card__body">{shortDescription}</p>
      {practiceTip ? <p className="help-info-card__tip">Practice tip: {practiceTip}</p> : null}

      {collapsible && hasDetails ? (
        <details className="help-info-card__details">
          <summary>{detailsTitle}</summary>
          <div className="help-info-card__details-body">
            {fullDescription ? <p>{fullDescription}</p> : null}
            {children}
            {learnMoreHref ? (
              <Link href={learnMoreHref} className="button button--ghost">
                {learnMoreLabel}
              </Link>
            ) : null}
          </div>
        </details>
      ) : null}
    </section>
  );
}