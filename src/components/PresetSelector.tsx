"use client";

type Props = {
  presets: string[];
  selected: string;
  onSelect: (name: string) => void;
};

export default function PresetSelector({ presets, selected, onSelect }: Props) {
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
    </div>
  );
}