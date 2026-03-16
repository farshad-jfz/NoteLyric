"use client";

import { useEffect } from "react";

export const useRegenerateShortcut = (handler: () => void, enabled = true): void => {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editable = target?.tagName === "INPUT" || target?.tagName === "SELECT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (editable) return;
      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        handler();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, handler]);
};
