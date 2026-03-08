from __future__ import annotations

from music21 import chord, interval, meter, note, stream

from models import NOTE_VALUES
from utils import parse_pitch, validate_range


CHORD_INTERVALS = {
    "Major triad": ["P1", "M3", "P5"],
    "Minor triad": ["P1", "m3", "P5"],
    "Diminished triad": ["P1", "m3", "d5"],
    "Augmented triad": ["P1", "M3", "A5"],
    "Dominant 7": ["P1", "M3", "P5", "m7"],
    "Major 7": ["P1", "M3", "P5", "M7"],
    "Minor 7": ["P1", "m3", "P5", "m7"],
}


def _find_root_octave(root: str, low: str, high: str, octave_span: int) -> int | None:
    low_p = parse_pitch(low)
    high_p = parse_pitch(high)
    for octave in range(2, 8):
        start = parse_pitch(f"{root}{octave}")
        end = parse_pitch(f"{root}{octave + octave_span}")
        if start.midi >= low_p.midi and end.midi <= high_p.midi:
            return octave
    return None


def _build_tones(root_pitch, chord_type: str):
    tones = []
    for iv in CHORD_INTERVALS[chord_type]:
        tones.append(interval.Interval(iv).transposePitch(root_pitch))
    return tones


def build_chord_exercise(settings: dict) -> tuple[stream.Score | None, str | None, str | None]:
    err = validate_range(settings["lowest_note"], settings["highest_note"])
    if err:
        return None, None, err

    base_oct = _find_root_octave(settings["root"], settings["lowest_note"], settings["highest_note"], settings["octave_span"])
    if base_oct is None:
        return None, None, "This chord pattern cannot be generated within the chosen range."

    score = stream.Score()
    part = stream.Part()
    part.append(meter.TimeSignature(settings["time_signature"]))

    base_root = parse_pitch(f"{settings['root']}{base_oct}")
    tones = _build_tones(base_root, settings["chord_type"])

    low_midi = parse_pitch(settings["lowest_note"]).midi
    high_midi = parse_pitch(settings["highest_note"]).midi

    pattern = settings["pattern"]
    ql = NOTE_VALUES[settings["note_value"]]

    if pattern == "Block chord":
        for i in range(settings["octave_span"]):
            octave_tones = [p.transpose(12 * i) for p in tones]
            if not all(low_midi <= p.midi <= high_midi for p in octave_tones):
                return None, None, "This chord pattern cannot be generated within the chosen range."
            c = chord.Chord(octave_tones)
            c.quarterLength = ql
            if settings["show_chord_tones"]:
                c.lyric = " ".join([p.name for p in octave_tones])
            part.append(c)
    else:
        seq = []
        for i in range(settings["octave_span"]):
            octave_tones = [p.transpose(12 * i) for p in tones]
            seq.extend(octave_tones)
        seq.append(base_root.transpose(12 * settings["octave_span"]))

        if pattern == "Descending arpeggio":
            seq = list(reversed(seq))
        elif pattern == "Up and Down":
            seq = seq + list(reversed(seq))[1:]

        for p in seq:
            if not (low_midi <= p.midi <= high_midi):
                return None, None, "This chord pattern cannot be generated within the chosen range."
            n = note.Note(p)
            n.quarterLength = ql
            if settings["show_note_names"] or settings["show_chord_tones"]:
                lbls: list[str] = []
                if settings["show_note_names"]:
                    lbls.append(n.nameWithOctave)
                if settings["show_chord_tones"]:
                    lbls.append(n.name)
                n.lyric = " / ".join(lbls)
            part.append(n)

    score.append(part)

    chord_name = settings["chord_type"].replace(" triad", "")
    if "7" in settings["chord_type"]:
        chord_name = settings["chord_type"].replace("Dominant 7", "7")
    title = f"{settings['root']} {chord_name} Arpeggio - {settings['octave_span']} Octave - {settings['pattern']}"

    return score, title, None
