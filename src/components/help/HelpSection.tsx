import type { ReactNode } from "react";

export type HelpSectionProps = {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export default function HelpSection({ id, title, description, children }: HelpSectionProps) {
  return (
    <section id={id} className="panel help-section">
      <div className="help-section__header">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}