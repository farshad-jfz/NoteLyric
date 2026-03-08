from __future__ import annotations

from dataclasses import dataclass
from typing import Any


TIME_SIGNATURES = ["2/4", "3/4", "4/4", "6/8"]
NOTE_VALUES = {
    "whole": 4.0,
    "half": 2.0,
    "quarter": 1.0,
    "eighth": 0.5,
    "dotted half": 3.0,
    "dotted quarter": 1.5,
}
DISPLAY_NOTE_VALUES = ["whole", "half", "quarter", "eighth", "dotted half", "dotted quarter"]

ROOT_OPTIONS = [
    "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"
]

SCALE_TYPES = [
    "Major",
    "Natural Minor",
    "Harmonic Minor",
    "Melodic Minor",
    "Major Pentatonic",
    "Minor Pentatonic",
    "Blues",
    "Chromatic",
]

CHORD_TYPES = [
    "Major triad",
    "Minor triad",
    "Diminished triad",
    "Augmented triad",
    "Dominant 7",
    "Major 7",
    "Minor 7",
]

ARPEGGIO_PATTERNS = ["Block chord", "Ascending arpeggio", "Descending arpeggio", "Up and Down"]

DIRECTIONS = ["Ascending", "Descending", "Up and Down"]

LEAP_LIMITS = {
    "step only": 2,
    "up to 3rd": 4,
    "up to 4th": 5,
    "up to 5th": 7,
    "octave": 12,
}


@dataclass
class GeneratedExercise:
    tab: str
    title: str
    settings_summary: list[str]
    png_bytes: bytes | None
    pdf_bytes: bytes | None
    error: str | None
    payload: dict[str, Any]
