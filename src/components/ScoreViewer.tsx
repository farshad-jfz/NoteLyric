"use client";

import { IconAlertCircle, IconMaximize, IconMinimize } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";

import { buildStandaloneScoreSvg } from "@/lib/rendering/export";

type Props = {
  musicXml?: string;
  title?: string;
  onSvgReady?: (svg?: string) => void;
  hideHeader?: boolean;
};

export default function ScoreViewer({ musicXml, title, onSvgReady, hideHeader = false }: Props) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setFullscreenSupported(typeof document !== "undefined" && Boolean(document.fullscreenEnabled));

    const syncFullscreenState = () => {
      setIsFullscreen(document.fullscreenElement === frameRef.current);
    };

    document.addEventListener("fullscreenchange", syncFullscreenState);
    syncFullscreenState();

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
    };
  }, []);

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
        onSvgReady?.(buildStandaloneScoreSvg(containerRef.current));
      } catch (issue) {
        const message = issue instanceof Error ? issue.message : "Score rendering failed.";
        setError(message);
        onSvgReady?.(undefined);
      }
    };

    void render();
  }, [musicXml, onSvgReady]);

  const toggleFullscreen = async () => {
    if (!frameRef.current || !document.fullscreenEnabled) return;

    if (document.fullscreenElement === frameRef.current) {
      await document.exitFullscreen();
      return;
    }

    await frameRef.current.requestFullscreen();
  };

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
      <div ref={frameRef} className={isFullscreen ? "score-frame is-fullscreen" : "score-frame"}>
        <div ref={containerRef} className="score-surface" />
        {fullscreenSupported ? (
          <button
            type="button"
            className="score-fullscreen-button"
            onClick={() => void toggleFullscreen()}
            aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
            title={isFullscreen ? "Exit full screen" : "Full screen"}
          >
            {isFullscreen ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
          </button>
        ) : null}
      </div>
    </section>
  );
}
