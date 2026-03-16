import type { ReactNode } from "react";

type Props = {
  title?: string;
  description?: string;
  children: ReactNode;
  accent?: boolean;
};

export default function SectionCard({ title, description, children, accent = false }: Props) {
  return (
    <section className={`panel section-card${accent ? " section-card--accent" : ""}`}>
      {title ? (
        <div className="section-card__header">
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
