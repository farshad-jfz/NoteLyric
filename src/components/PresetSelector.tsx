"use client";

type Props = {
  presets: string[];
  selected: string;
  onSelect: (name: string) => void;
  onApply: () => void;
};

export default function PresetSelector({ presets, selected, onSelect, onApply }: Props) {
  return (
    <div className="inline-fields">
      <label className="field field--grow">
        <span>Preset</span>
        <select value={selected} onChange={(event) => onSelect(event.target.value)}>
          {presets.map((preset) => (
            <option key={preset}>{preset}</option>
          ))}
        </select>
      </label>
      <button type="button" className="button button--ghost" onClick={onApply}>
        Apply preset
      </button>
    </div>
  );
}
