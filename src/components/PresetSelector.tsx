"use client";

type Props = {
  presets: string[];
  selected: string;
  onSelect: (name: string) => void;
  onApply: () => void;
};

export default function PresetSelector({ presets, selected, onSelect, onApply }: Props) {
  return (
    <div className="preset-row">
      <label>
        Preset
        <select value={selected} onChange={(e) => onSelect(e.target.value)}>
          {presets.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
      <button type="button" onClick={onApply}>
        Apply preset
      </button>
    </div>
  );
}
