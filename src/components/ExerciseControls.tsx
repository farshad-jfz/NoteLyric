"use client";

import { SegmentedControl, Stack, Title, Card } from "@mantine/core";
import { ReactNode } from "react";

type Props = {
  title: string;
  mode: "Quick" | "Advanced";
  onModeChange: (mode: "Quick" | "Advanced") => void;
  children: ReactNode;
};

export default function ExerciseControls({ title, mode, onModeChange, children }: Props) {
  return (
    <Card withBorder radius="lg" shadow="xs" mb="md">
      <Stack gap="sm">
        <Stack gap={4}>
          <Title order={2}>{title}</Title>
          <SegmentedControl
            value={mode}
            onChange={(value) => onModeChange(value as "Quick" | "Advanced")}
            data={["Quick", "Advanced"]}
            w={220}
          />
        </Stack>
        {children}
      </Stack>
    </Card>
  );
}
