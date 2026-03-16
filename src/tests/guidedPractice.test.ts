import { describe, expect, it } from "vitest";

import { defaultAppSettings } from "@/lib/app/storage";
import { generatePracticeSession, getKeyOfTheDay } from "@/lib/guidedPractice/session";

describe("guided practice session generator", () => {
  it("builds a coherent daily session in one key", () => {
    const session = generatePracticeSession(defaultAppSettings, "2026-03-15");

    expect(session.key).toBe(getKeyOfTheDay("2026-03-15"));
    expect(session.steps).toHaveLength(5);
    expect(session.estimatedMinutes).toBeGreaterThanOrEqual(10);
    expect(session.estimatedMinutes).toBeLessThanOrEqual(25);
    expect(session.steps.every((step) => step.source === "guided-practice")).toBe(true);
    expect(session.steps.every((step) => typeof step.exercise.title === "string" && step.exercise.title.length > 0)).toBe(true);
  });

  it("keeps beginner guided sessions on simpler jazz modes", () => {
    const session = generatePracticeSession(defaultAppSettings, "2026-03-16");
    const creative = session.steps.find((step) => step.kind === "creative");
    const guide = session.steps.find((step) => step.kind === "guide-tones");

    expect(session.difficulty).toBe("Beginner");
    expect(["call-response", "ii-v-i", "guide-tones"]).toContain(creative?.jazzMode);
    expect(["guide-tones", "ii-v-i"]).toContain(guide?.jazzMode);
  });

  it("does not throw for advanced guided practice sessions", () => {
    expect(() =>
      generatePracticeSession(
        {
          ...defaultAppSettings,
          defaultDifficulty: "Advanced",
          preferSwingFeel: true
        },
        "2026-03-16"
      )
    ).not.toThrow();
  });
});
