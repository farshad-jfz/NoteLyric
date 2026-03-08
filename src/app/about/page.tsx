import { Card, List, Stack, Text, Title } from "@mantine/core";

export default function AboutPage() {
  return (
    <Card withBorder radius="lg" shadow="xs">
      <Stack>
        <Title order={2}>About NoteLyric</Title>
        <Text c="dimmed">Practice Harmonically</Text>
        <Text>
          Hi, I&apos;m Farshad. I&apos;m currently learning the chromatic harmonica and built this app to help structure my
          practice sessions. I hope it can help other harmonica players practice more effectively too.
        </Text>

        <Title order={3}>Quick Guide</Title>
        <List spacing="xs">
          <List.Item>Choose one practice page: Scales, Chords / Arpeggios, or Sight Reading.</List.Item>
          <List.Item>Pick a preset to start fast, then adjust settings if needed.</List.Item>
          <List.Item>Click Generate New to create notation and Regenerate Same Settings for variations.</List.Item>
          <List.Item>Use Export buttons to save SVG, PNG, or MusicXML, or print to PDF.</List.Item>
          <List.Item>Practice slowly first, then increase tempo once the reading feels comfortable.</List.Item>
        </List>
      </Stack>
    </Card>
  );
}
