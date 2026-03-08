from __future__ import annotations

import random

from music21 import key, meter, note, pitch, stream

from models import LEAP_LIMITS, NOTE_VALUES
from utils import (
    canonicalize_note_values,
    parse_pitch,
    quantized_units,
    quarter_length_for_time_signature,
    validate_range,
)


MAJOR_KEYS = ["C", "G", "D", "A", "E", "F", "Bb", "Eb", "Ab"]
MINOR_KEYS = ["A", "E", "B", "F#", "C#", "D", "G", "C", "F"]


def _difficulty_allowed_values(difficulty: str) -> set[str]:
    if difficulty == "Beginner":
        return {"whole", "half", "quarter"}
    if difficulty == "Intermediate":
        return {"whole", "half", "quarter", "eighth"}
    return {"whole", "half", "quarter", "eighth", "dotted half", "dotted quarter"}


def _build_fillable(allowed_units: list[int], bar_units: int) -> set[int]:
    fillable = {0}
    changed = True
    while changed:
        changed = False
        current = list(fillable)
        for f in current:
            for d in allowed_units:
                n = f + d
                if n <= bar_units and n not in fillable:
                    fillable.add(n)
                    changed = True
    return fillable


def _pick_duration(remaining_units: int, allowed_units: list[int], fillable: set[int], difficulty: str) -> int:
    candidates = [d for d in allowed_units if d <= remaining_units and (remaining_units - d) in fillable]
    if not candidates:
        return min(allowed_units)
    # Advanced favors denser rhythm, beginner favors longer notes.
    if difficulty == "Beginner":
        candidates.sort(reverse=True)
        weights = [max(1, i + 1) for i in range(len(candidates))]
        return random.choices(candidates, weights=weights, k=1)[0]
    if difficulty == "Advanced":
        candidates.sort()
        weights = [max(1, i + 1) for i in range(len(candidates))]
        return random.choices(candidates, weights=weights, k=1)[0]
    return random.choice(candidates)


def _candidate_pitches(settings: dict) -> list[pitch.Pitch]:
    low = parse_pitch(settings["lowest_note"])
    high = parse_pitch(settings["highest_note"])

    key_mode = settings["key_mode"]
    if key_mode == "Chromatic / random accidentals":
        return [pitch.Pitch(midi=m) for m in range(low.midi, high.midi + 1)]

    if key_mode == "C Major / A Minor only":
        tonic, mode = settings["specific_key"].split(" ")
    else:
        tonic, mode = settings["specific_key"].split(" ")

    k = key.Key(tonic, mode)
    result: list[pitch.Pitch] = []
    for m in range(low.midi, high.midi + 1):
        p = pitch.Pitch(midi=m)
        if p.pitchClass in {kp.pitchClass for kp in k.pitches}:
            result.append(p)
    return result


def _rest_probability(difficulty: str) -> float:
    if difficulty == "Beginner":
        return 0.05
    if difficulty == "Intermediate":
        return 0.12
    return 0.15


def _choose_next_pitch(
    last_pitch: pitch.Pitch | None,
    before_last_pitch: pitch.Pitch | None,
    candidates: list[pitch.Pitch],
    max_leap: int,
    repeated_notes: bool,
) -> pitch.Pitch:
    if last_pitch is None:
        return random.choice(candidates)

    filtered = []
    for p in candidates:
        dist = abs(p.midi - last_pitch.midi)
        if dist <= max_leap and (repeated_notes or dist != 0):
            filtered.append(p)

    if not filtered:
        filtered = [last_pitch]

    weights = []
    prev_dir = 0
    if before_last_pitch is not None:
        prev_dir = last_pitch.midi - before_last_pitch.midi

    for p in filtered:
        dist = abs(p.midi - last_pitch.midi)
        w = 1.0
        if dist <= 2:
            w += 6.0
        elif dist <= 4:
            w += 2.0
        if dist >= 7:
            w *= 0.4
        # Prefer recovery after a big leap.
        if before_last_pitch is not None and abs(prev_dir) >= 5:
            new_dir = p.midi - last_pitch.midi
            if new_dir == 0:
                w *= 0.8
            elif prev_dir * new_dir < 0:
                w *= 1.8
            elif abs(new_dir) <= 2:
                w *= 1.4
        weights.append(max(w, 0.05))

    return random.choices(filtered, weights=weights, k=1)[0]


def _default_key_for_mode(key_mode: str) -> str:
    if key_mode == "Minor keys":
        return "A minor"
    return "C major"


def available_keys_for_mode(key_mode: str) -> list[str]:
    if key_mode == "C Major / A Minor only":
        return ["C major", "A minor"]
    if key_mode == "Major keys":
        return [f"{k} major" for k in MAJOR_KEYS]
    if key_mode == "Minor keys":
        return [f"{k} minor" for k in MINOR_KEYS]
    return ["C major"]


def build_sight_reading_exercise(settings: dict) -> tuple[stream.Score | None, str | None, str | None]:
    err = validate_range(settings["lowest_note"], settings["highest_note"])
    if err:
        return None, None, err

    allowed_values = canonicalize_note_values(settings["allowed_values"])
    if not allowed_values:
        return None, None, "Please select at least one note value."

    allowed_by_diff = _difficulty_allowed_values(settings["difficulty"])
    allowed_values = [v for v in allowed_values if v in allowed_by_diff]
    if not allowed_values:
        return None, None, "Selected note values are not valid for this difficulty level."

    bar_len = quarter_length_for_time_signature(settings["time_signature"])
    allowed_units = sorted({quantized_units(NOTE_VALUES[v]) for v in allowed_values})
    bar_units = quantized_units(bar_len)

    fillable = _build_fillable(allowed_units, bar_units)
    if bar_units not in fillable:
        return None, None, "Selected combination of note values cannot fill measures in this time signature."

    candidates = _candidate_pitches(settings)
    if not candidates:
        return None, None, "No pitches available in selected range/key."

    max_leap = LEAP_LIMITS[settings["max_leap"]]

    score = stream.Score()
    part = stream.Part()
    part.append(meter.TimeSignature(settings["time_signature"]))

    last_pitch = None
    before_last = None

    for _bar in range(settings["num_bars"]):
        remaining = bar_units
        while remaining > 0:
            dur_units = _pick_duration(remaining, allowed_units, fillable, settings["difficulty"])
            remaining -= dur_units

            put_rest = settings["allow_rests"] and random.random() < _rest_probability(settings["difficulty"])
            if put_rest:
                r = note.Rest()
                r.quarterLength = dur_units / 2.0
                part.append(r)
                continue

            nxt = _choose_next_pitch(last_pitch, before_last, candidates, max_leap, settings["repeated_notes"])
            n = note.Note(nxt)
            n.quarterLength = dur_units / 2.0
            if settings["show_note_names"]:
                n.lyric = n.nameWithOctave
            part.append(n)
            before_last = last_pitch
            last_pitch = nxt

    score.append(part)
    key_label = settings["specific_key"] if settings["key_mode"] != "Chromatic / random accidentals" else "Chromatic"
    title = f"Sight Reading - {key_label.title()} - {settings['num_bars']} Bars - {settings['difficulty']}"
    return score, title, None


def normalize_key_selection(settings: dict) -> None:
    valid = available_keys_for_mode(settings["key_mode"])
    if settings["specific_key"] not in valid:
        settings["specific_key"] = _default_key_for_mode(settings["key_mode"])
