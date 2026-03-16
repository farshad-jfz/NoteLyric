import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export default function PageHeader({ eyebrow, title, description, actions }: Props) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <p className="page-header__eyebrow">{eyebrow}</p> : null}
        <h1 className="page-header__title">{title}</h1>
        <p className="page-header__description">{description}</p>
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
}
