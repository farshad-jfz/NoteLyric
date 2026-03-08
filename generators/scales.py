from __future__ import annotations

from music21 import interval, meter, note, scale, stream

from models import NOTE_VALUES
from utils import parse_pitch, validate_range


class IntervalListScale(scale.ConcreteScale):
    """Concrete scale built from semitone offsets relative to tonic."""

    def __init__(self, tonic=None, semitones: list[int] | None = None, **keywords):
        tonic_pitch = parse_pitch(str(tonic)) if tonic is not None else parse_pitch("C4")
        semitone_pattern = semitones or [0, 2, 4, 5, 7, 9, 11, 12]
        pitches = [interval.Interval(s).transposePitch(tonic_pitch) for s in semitone_pattern]
        super().__init__(tonic=tonic_pitch, pitches=pitches, **keywords)


SCALE_FACTORY = {
    "Major": scale.MajorScale,
    "Natural Minor": scale.MinorScale,
    "Harmonic Minor": scale.HarmonicMinorScale,
    "Melodic Minor": scale.MelodicMinorScale,
    "Major Pentatonic": lambda tonic: IntervalListScale(tonic=tonic, semitones=[0, 2, 4, 7, 9, 12]),
    "Minor Pentatonic": lambda tonic: IntervalListScale(tonic=tonic, semitones=[0, 3, 5, 7, 10, 12]),
    "Blues": lambda tonic: IntervalListScale(tonic=tonic, semitones=[0, 3, 5, 6, 7, 10, 12]),
    "Chromatic": scale.ChromaticScale,
}

CYCLE_OF_MAJOR_ROOTS = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"]


def _find_start_octave(root: str, low: str, high: str, octave_span: int) -> int | None:
    low_p = parse_pitch(low)
    high_p = parse_pitch(high)
    for octave in range(2, 8):
        start = parse_pitch(f"{root}{octave}")
        end = parse_pitch(f"{root}{octave + octave_span}")
        if start.midi >= low_p.midi and end.midi <= high_p.midi:
            return octave
    return None


def _build_scale_instance(scale_name: str, tonic: str):
    factory = SCALE_FACTORY[scale_name]
    return factory(tonic)


def build_scale_exercise(settings: dict) -> tuple[stream.Score | None, str | None, str | None]:
    err = validate_range(settings["lowest_note"], settings["highest_note"])
    if err:
        return None, None, err

    roots = CYCLE_OF_MAJOR_ROOTS if settings.get("all_major_cycle") and settings["scale_type"] == "Major" else [settings["root"]]

    score = stream.Score()
    part = stream.Part()
    part.append(meter.TimeSignature(settings["time_signature"]))

    for root in roots:
        start_octave = _find_start_octave(root, settings["lowest_note"], settings["highest_note"], settings["octave_span"])
        if start_octave is None:
            return None, None, "Selected range is too small for this scale and octave span."

        sc = _build_scale_instance(settings["scale_type"], root)
        start_pitch = parse_pitch(f"{root}{start_octave}")
        end_pitch = parse_pitch(f"{root}{start_octave + settings['octave_span']}")
        asc = sc.getPitches(start_pitch, end_pitch)
        if not asc:
            return None, None, "Could not generate a valid scale with the chosen settings."

        direction = settings["direction"]
        if direction == "Ascending":
            notes = asc
        elif direction == "Descending":
            notes = list(reversed(asc))
        else:
            desc = list(reversed(asc))
            notes = asc + desc[1:]

        for idx, p in enumerate(notes, 1):
            n = note.Note(p)
            n.quarterLength = NOTE_VALUES[settings["note_value"]]
            labels: list[str] = []
            if settings["show_note_names"]:
                labels.append(n.nameWithOctave)
            if settings["show_scale_degrees"]:
                labels.append(str(((idx - 1) % 7) + 1))
            if labels:
                n.lyric = " / ".join(labels)
            part.append(n)

        if len(roots) > 1:
            part.append(note.Rest(quarterLength=1.0))

    score.append(part)
    if len(roots) > 1:
        title = f"All Major Scales - {settings['octave_span']} Octave - {settings['direction']}"
    else:
        title = f"{settings['root']} {settings['scale_type']} Scale - {settings['octave_span']} Octaves - {settings['direction']}"
    return score, title, None
