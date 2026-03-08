from __future__ import annotations

from collections import deque

from music21 import note, pitch

from models import NOTE_VALUES


def build_note_options(low_octave: int = 3, high_octave: int = 7) -> list[str]:
    options: list[str] = []
    pc = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
    for octave in range(low_octave, high_octave + 1):
        for p in pc:
            options.append(f"{p}{octave}")
    return options


def parse_pitch(note_name: str) -> pitch.Pitch:
    return pitch.Pitch(note_name)


def validate_range(low_note: str, high_note: str) -> str | None:
    if parse_pitch(low_note).midi >= parse_pitch(high_note).midi:
        return "Lowest note must be lower than highest note."
    return None


def quarter_length_for_time_signature(ts: str) -> float:
    beats, beat_value = ts.split("/")
    beats_n = int(beats)
    beat_n = int(beat_value)
    return beats_n * (4.0 / beat_n)


def canonicalize_note_values(values: list[str]) -> list[str]:
    return [v for v in values if v in NOTE_VALUES]


def duration_value(name: str) -> float:
    return NOTE_VALUES[name]


def to_settings_summary(settings: dict) -> list[str]:
    summary: list[str] = []
    for k, v in settings.items():
        if isinstance(v, list):
            summary.append(f"{k}: {', '.join(str(x) for x in v)}")
        else:
            summary.append(f"{k}: {v}")
    return summary


def push_history(history: deque, item: dict, max_items: int = 10) -> None:
    history.appendleft(item)
    while len(history) > max_items:
        history.pop()


def make_note_or_rest(is_rest: bool, pitch_name: str | None = None) -> note.Note | note.Rest:
    if is_rest:
        return note.Rest()
    return note.Note(pitch_name)


def quantized_units(quarter_len: float) -> int:
    return int(round(quarter_len * 2))
