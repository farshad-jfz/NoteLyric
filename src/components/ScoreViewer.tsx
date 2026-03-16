"use client";

import { IconAlertCircle } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  musicXml?: string;
  title?: string;
  onSvgReady?: (svg?: string) => void;
  hideHeader?: boolean;
};

export default function ScoreViewer({ musicXml, title, onSvgReady, hideHeader = false }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const render = async () => {
      if (!musicXml || !containerRef.current) {
        onSvgReady?.(undefined);
        return;
      }

      try {
        setError(undefined);
        const { createOsmd } = await import("@/lib/rendering/osmd");
        containerRef.current.innerHTML = "";
        const osmd = createOsmd(containerRef.current);
        await osmd.load(musicXml);
        osmd.render();
        onSvgReady?.(containerRef.current.querySelector("svg")?.outerHTML);
      } catch (issue) {
        const message = issue instanceof Error ? issue.message : "Score rendering failed.";
        setError(message);
        onSvgReady?.(undefined);
      }
    };

    void render();
  }, [musicXml, onSvgReady]);

  return (
    <section className={hideHeader ? "score-panel score-panel--minimal" : "panel score-panel"}>
      {!hideHeader ? (
        <div className="score-panel__header">
          <div>
            <p className="eyebrow">Score</p>
            <h2>{title ?? "Score viewer"}</h2>
          </div>
        </div>
      ) : null}
      {error ? (
        <div className="notice notice--error">
          <IconAlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : null}
      <div ref={containerRef} className="score-surface" />
    </section>
  );
}