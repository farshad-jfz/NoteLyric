"use client";

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
    <section className="panel">
      <h3>{title ?? "Score"}</h3>
      {error ? <p className="error">{error}</p> : null}
      <div ref={containerRef} className="score-surface" />
    </section>
  );
}
