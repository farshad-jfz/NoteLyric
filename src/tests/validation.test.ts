import { describe, expect, it } from "vitest";

import { validateChordSettings } from "@/lib/validation/chordsValidation";
import { validateScaleSettings } from "@/lib/validation/scalesValidation";
import { validateSightReadingSettings } from "@/lib/validation/sightReadingValidation";
import { defaultChordSettings, defaultScaleSettings, defaultSightSettings } from "@/lib/presets/presets";

describe("validation", () => {
  it("rejects invalid scale range", () => {
    const err = validateScaleSettings({ ...defaultScaleSettings, lowestNote: "C5", highestNote: "C4" });
    expect(err).toBeTruthy();
  });

  it("rejects invalid chord range", () => {
    const err = validateChordSettings({ ...defaultChordSettings, lowestNote: "A5", highestNote: "A5" });
    expect(err).toBeTruthy();
  });

  it("rejects sight reading without durations", () => {
    const err = validateSightReadingSettings({ ...defaultSightSettings, allowedValues: [] });
    expect(err).toContain("duration");
  });
});
