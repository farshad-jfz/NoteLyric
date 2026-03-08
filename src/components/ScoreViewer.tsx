"use client";

import { Alert, Card, Title } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  musicXml?: string;
  title?: string;
  onSvgReady?: (svg?: string) => void;
};

export default function ScoreViewer({ musicXml, title, onSvgReady }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const render = async () => {
      if (!musicXml || !containerRef.current) {
        if (onSvgReady) onSvgReady(undefined);
        return;
      }

      try {
        setError(undefined);
        const { createOsmd } = await import("@/lib/rendering/osmd");
        containerRef.current.innerHTML = "";
        const osmd = createOsmd(containerRef.current);
        await osmd.load(musicXml);
        osmd.render();
        const svg = containerRef.current.querySelector("svg")?.outerHTML;
        if (onSvgReady) onSvgReady(svg);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Score rendering failed.";
        setError(message);
        if (onSvgReady) onSvgReady(undefined);
      }
    };

    void render();
  }, [musicXml, onSvgReady]);

  return (
    <Card withBorder radius="lg" shadow="xs" mb="md">
      <Title order={3} mb="sm">
        {title ?? "Score"}
      </Title>
      {error ? (
        <Alert color="red" icon={<IconAlertCircle size={18} />} mb="sm">
          {error}
        </Alert>
      ) : null}
      <div ref={containerRef} className="score-surface" />
    </Card>
  );
}
