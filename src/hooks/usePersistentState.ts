"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";

export function usePersistentState<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      // Ignore corrupted local state.
    } finally {
      setHydrated(true);
    }
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [hydrated, key, value]);

  return [value, setValue, hydrated];
}
