import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
  icon?: ReactNode;
  tone?: "default" | "accent";
  children?: ReactNode;
};

export default function PracticeCard({ title, description, href, actionLabel = "Open", icon, tone = "default", children }: Props) {
  return (
    <article className={`panel practice-card practice-card--${tone}`}>
      <div className="practice-card__body">
        <div className="practice-card__title-row">
          <div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
          {icon ? <div className="practice-card__icon">{icon}</div> : null}
        </div>
        {children}
      </div>
      {href ? (
        <Link href={href} className="button button--ghost practice-card__link">
          {actionLabel}
        </Link>
      ) : null}
    </article>
  );
}
