"use client";

import { Badge, Group } from "@mantine/core";

type Props = {
  items: string[];
};

export default function SettingsSummary({ items }: Props) {
  return (
    <Group gap="xs" mt="sm">
      {items.map((item) => (
        <Badge key={item} variant="light" color="gray" radius="xl">
          {item}
        </Badge>
      ))}
    </Group>
  );
}
