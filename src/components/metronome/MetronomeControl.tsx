"use client";

import { IconMinus, IconPlayerPauseFilled, IconPlayerPlayFilled, IconPlus } from "@tabler/icons-react";

import { useMetronome } from "@/components/metronome/MetronomeProvider";

const BPM_STEP = 4;
const MIN_BPM = 30;
const MAX_BPM = 240;

export default function MetronomeControl() {
  const { bpm, currentBeat, isPlaying, setBpm, toggle } = useMetronome();

  const updateBpm = (nextBpm: number) => {
    setBpm(Math.min(MAX_BPM, Math.max(MIN_BPM, nextBpm)));
  };

  return (
    <div className={isPlaying ? "metronome-control metronome-control--playing" : "metronome-control"} aria-label="Metronome">
      <button
        type="button"
        className="metronome-control__button"
        onClick={toggle}
        aria-label={isPlaying ? "Pause metronome" : "Start metronome"}
        title={isPlaying ? "Pause metronome" : "Start metronome"}
      >
        {isPlaying ? <IconPlayerPauseFilled size={16} /> : <IconPlayerPlayFilled size={16} />}
      </button>

      <div className="metronome-control__tempo">
        <span className="metronome-control__label">Metronome</span>
        <label className="metronome-control__bpm">
          <input
            type="number"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={(event) => updateBpm(Number(event.target.value))}
            aria-label="Metronome tempo in beats per minute"
          />
          <span>bpm</span>
        </label>
      </div>

      <div className="metronome-control__steppers" aria-label="Tempo controls">
        <button type="button" onClick={() => updateBpm(bpm - BPM_STEP)} aria-label={`Decrease tempo to ${Math.max(MIN_BPM, bpm - BPM_STEP)} bpm`} title="Decrease tempo">
          <IconMinus size={14} />
        </button>
        <button type="button" onClick={() => updateBpm(bpm + BPM_STEP)} aria-label={`Increase tempo to ${Math.min(MAX_BPM, bpm + BPM_STEP)} bpm`} title="Increase tempo">
          <IconPlus size={14} />
        </button>
      </div>

      <span className="metronome-control__beat" aria-hidden="true">
        {currentBeat}
      </span>
    </div>
  );
}

