"use client";

type Props = {
  items: string[];
};

export default function SettingsSummary({ items }: Props) {
  return (
    <div className="summary-badges">
      {items.map((item) => (
        <span key={item} className="chip">
          {item}
        </span>
      ))}
    </div>
  );
}
