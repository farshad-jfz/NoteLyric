import Link from "next/link";
import { Button, Card, Group, Stack, Text, Title } from "@mantine/core";

export default function HomePage() {
  return (
    <Card withBorder radius="lg" shadow="xs">
      <Stack>
        <Title order={2}>Welcome to NoteLyric</Title>
        <Text c="dimmed">Practice Harmonically</Text>
        <Text>Generate readable harmonica exercises for scales, chords/arpeggios, and sight-reading directly in your browser.</Text>
        <Group>
          <Button component={Link} href="/scales">
            Open Scales
          </Button>
          <Button component={Link} href="/chords" variant="light">
            Open Chords / Arpeggios
          </Button>
          <Button component={Link} href="/sight-reading" variant="outline">
            Open Sight Reading
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
