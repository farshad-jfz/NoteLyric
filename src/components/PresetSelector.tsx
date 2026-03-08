"use client";

import { Button, Group, Select } from "@mantine/core";

type Props = {
  presets: string[];
  selected: string;
  onSelect: (name: string) => void;
  onApply: () => void;
};

export default function PresetSelector({ presets, selected, onSelect, onApply }: Props) {
  return (
    <Group align="end" wrap="wrap">
      <Select label="Preset" value={selected} onChange={(v) => v && onSelect(v)} data={presets} w={420} searchable />
      <Button variant="light" onClick={onApply}>
        Apply preset
      </Button>
    </Group>
  );
}
