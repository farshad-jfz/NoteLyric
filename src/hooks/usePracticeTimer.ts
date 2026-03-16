"use client";

import { useEffect, useMemo, useState } from "react";

const formatSeconds = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

export const usePracticeTimer = (running: boolean): string => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running) return;
    const startedAt = Date.now() - elapsed * 1000;
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, elapsed]);

  return useMemo(() => formatSeconds(elapsed), [elapsed]);
};
