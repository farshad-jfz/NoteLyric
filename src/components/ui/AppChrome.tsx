"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppShell, Box, Button, Container, Group, Text, Title } from "@mantine/core";
import { IconBook, IconCircleDottedLetterH, IconHome, IconInfoCircle, IconMusic } from "@tabler/icons-react";
import type { ReactNode } from "react";

const LINKS = [
  { href: "/", label: "Home", icon: IconHome },
  { href: "/scales", label: "Scales", icon: IconBook },
  { href: "/chords", label: "Chords / Arpeggios", icon: IconMusic },
  { href: "/jazz", label: "Jazz Practice", icon: IconMusic },
  { href: "/sight-reading", label: "Sight Reading", icon: IconCircleDottedLetterH },
  { href: "/about", label: "About", icon: IconInfoCircle }
];

export default function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const year = new Date().getFullYear();

  return (
    <AppShell header={{ height: 88 }} padding="md">
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group justify="space-between" align="center" h="100%" wrap="nowrap">
            <Box>
              <Title order={3}>NoteLyric</Title>
              <Text size="sm" c="dimmed">
                Practice Harmonically
              </Text>
            </Box>

            <Group gap="xs" wrap="wrap" justify="flex-end" style={{ maxWidth: "65%" }}>
              {LINKS.map((item) => (
                <Button
                  key={item.href}
                  component={Link}
                  href={item.href}
                  size="compact-sm"
                  variant={pathname === item.href ? "filled" : "light"}
                  leftSection={<item.icon size={14} />}
                  radius="xl"
                >
                  {item.label}
                </Button>
              ))}
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl">{children}</Container>
      </AppShell.Main>

      <AppShell.Footer h={54}>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between">
            <Text size="sm" c="dimmed">
              NoteLyric
            </Text>
            <Text size="sm" c="dimmed">
              Copyright© {year} Farshad Jafarzadeh
            </Text>
          </Group>
        </Container>
      </AppShell.Footer>
    </AppShell>
  );
}