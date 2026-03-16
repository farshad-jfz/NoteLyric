type Props = {
  label: string;
  value: string;
};

export default function TimerPill({ label, value }: Props) {
  return (
    <div className="timer-pill" aria-live="polite">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
