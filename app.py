from __future__ import annotations

from collections import deque
from copy import deepcopy

import streamlit as st
from music21 import expressions

from generators.chords import build_chord_exercise
from generators.scales import build_scale_exercise
from generators.sight_reading import available_keys_for_mode, build_sight_reading_exercise, normalize_key_selection
from models import ARPEGGIO_PATTERNS, CHORD_TYPES, DIRECTIONS, DISPLAY_NOTE_VALUES, ROOT_OPTIONS, SCALE_TYPES, TIME_SIGNATURES
from presets import PRESETS
from rendering.renderer import apply_metadata, render_score_pdf_bytes, render_score_png_bytes
from utils import build_note_options, push_history, to_settings_summary


st.set_page_config(page_title="Chromatic Harmonica Practice", layout="wide")

NOTE_OPTIONS = build_note_options(3, 7)

DEFAULT_SCALES = {
    "root": "C",
    "all_major_cycle": False,
    "scale_type": "Major",
    "octave_span": 1,
    "direction": "Up and Down",
    "time_signature": "4/4",
    "note_value": "quarter",
    "lowest_note": "C4",
    "highest_note": "C6",
    "show_note_names": False,
    "show_scale_degrees": False,
    "tempo": "80",
    "show_metadata": True,
}

DEFAULT_CHORDS = {
    "root": "C",
    "chord_type": "Major triad",
    "pattern": "Ascending arpeggio",
    "octave_span": 1,
    "time_signature": "4/4",
    "note_value": "quarter",
    "lowest_note": "C4",
    "highest_note": "C6",
    "show_note_names": False,
    "show_chord_tones": False,
    "tempo": "80",
    "show_metadata": True,
}

DEFAULT_SIGHT = {
    "lowest_note": "C4",
    "highest_note": "C5",
    "key_mode": "C Major / A Minor only",
    "specific_key": "C major",
    "num_bars": 4,
    "time_signature": "4/4",
    "difficulty": "Beginner",
    "allowed_values": ["half", "quarter"],
    "allow_rests": False,
    "max_leap": "up to 3rd",
    "repeated_notes": True,
    "show_note_names": False,
    "tempo": "80",
    "show_metadata": True,
}

DIFFICULTY_ALLOWED = {
    "Beginner": ["whole", "half", "quarter"],
    "Intermediate": ["whole", "half", "quarter", "eighth"],
    "Advanced": DISPLAY_NOTE_VALUES,
}


def init_session() -> None:
    if "scales_settings" not in st.session_state:
        st.session_state.scales_settings = deepcopy(DEFAULT_SCALES)
    if "chords_settings" not in st.session_state:
        st.session_state.chords_settings = deepcopy(DEFAULT_CHORDS)
    if "sight_settings" not in st.session_state:
        st.session_state.sight_settings = deepcopy(DEFAULT_SIGHT)
    if "last_exercise" not in st.session_state:
        st.session_state.last_exercise = {"Scales": None, "Chords / Arpeggios": None, "Sight Reading": None}
    if "history" not in st.session_state:
        st.session_state.history = deque([], maxlen=10)
    if "ui_mode" not in st.session_state:
        st.session_state.ui_mode = "Quick"
    if "preset_by_tab" not in st.session_state:
        st.session_state.preset_by_tab = {
            "Scales": next(name for name, p in PRESETS.items() if p["tab"] == "Scales"),
            "Chords / Arpeggios": next(name for name, p in PRESETS.items() if p["tab"] == "Chords / Arpeggios"),
            "Sight Reading": next(name for name, p in PRESETS.items() if p["tab"] == "Sight Reading"),
        }


def _select_note(label: str, key: str, value: str) -> str:
    default_index = NOTE_OPTIONS.index(value) if value in NOTE_OPTIONS else NOTE_OPTIONS.index("C4")
    return st.selectbox(label, NOTE_OPTIONS, index=default_index, key=key)


def _settings_for_tab(tab_name: str) -> dict:
    if tab_name == "Scales":
        return st.session_state.scales_settings
    if tab_name == "Chords / Arpeggios":
        return st.session_state.chords_settings
    return st.session_state.sight_settings


def _preset_names(tab_name: str) -> list[str]:
    return [name for name, preset in PRESETS.items() if preset["tab"] == tab_name]


def _apply_preset(tab_name: str, preset_name: str) -> None:
    settings = _settings_for_tab(tab_name)
    settings.update(PRESETS[preset_name]["settings"])


def _friendly_error(err: str) -> str:
    hints = {
        "Selected range is too small for this scale and octave span.": "Selected range is too small for this scale and octave span. Try widening the range or reducing octave span.",
        "Please select at least one note value.": "Select at least one note value to generate a rhythmically valid exercise.",
        "This chord pattern cannot be generated within the chosen range.": "This chord pattern does not fit the selected range. Try a wider range or a smaller octave span.",
    }
    return hints.get(err, err)


def _compact_summary(tab_name: str, settings: dict) -> str:
    if tab_name == "Scales":
        items = [
            f"{settings['root']} {settings['scale_type']}",
            f"{settings['octave_span']} oct",
            settings["direction"].replace("Up and Down", "Ascend + Descend"),
            settings["time_signature"],
            settings["note_value"],
            f"range {settings['lowest_note']}-{settings['highest_note']}",
        ]
    elif tab_name == "Chords / Arpeggios":
        items = [
            f"{settings['root']} {settings['chord_type']}",
            settings["pattern"].replace("Up and Down", "Ascend + Descend"),
            f"{settings['octave_span']} oct",
            settings["time_signature"],
            settings["note_value"],
            f"range {settings['lowest_note']}-{settings['highest_note']}",
        ]
    else:
        key_text = "Chromatic" if settings["key_mode"] == "Chromatic / random accidentals" else settings["specific_key"].title()
        items = [
            key_text,
            f"{settings['num_bars']} bars",
            settings["difficulty"],
            settings["time_signature"],
            f"jump {settings['max_leap'].replace('Maximum ', '').replace('up to ', '')}",
            f"range {settings['lowest_note']}-{settings['highest_note']}",
        ]
    return " | ".join(items)


def _render_preset_header(tab_name: str) -> None:
    names = _preset_names(tab_name)
    col1, col2 = st.columns([3, 1])
    st.session_state.preset_by_tab[tab_name] = col1.selectbox(
        "Starter preset",
        names,
        index=names.index(st.session_state.preset_by_tab[tab_name]) if st.session_state.preset_by_tab[tab_name] in names else 0,
        key=f"preset_{tab_name}",
    )
    if col2.button("Apply preset", key=f"apply_{tab_name}"):
        _apply_preset(tab_name, st.session_state.preset_by_tab[tab_name])


def _render_scales_controls(mode: str) -> None:
    s = st.session_state.scales_settings
    c1, c2 = st.columns(2)
    s["root"] = c1.selectbox("Root", ROOT_OPTIONS, index=ROOT_OPTIONS.index(s["root"]), key="sc_root")
    s["scale_type"] = c2.selectbox("Scale type", SCALE_TYPES, index=SCALE_TYPES.index(s["scale_type"]), key="sc_type")

    c3, c4 = st.columns(2)
    s["direction"] = c3.selectbox("Direction", DIRECTIONS, index=DIRECTIONS.index(s["direction"]), key="sc_dir")
    if mode == "Quick":
        s["octave_span"] = c4.selectbox("Octaves", [1, 2, 3], index=[1, 2, 3].index(s["octave_span"]), key="sc_span_q")

    if mode == "Advanced":
        with st.expander("Advanced settings", expanded=True):
            a1, a2, a3 = st.columns(3)
            s["octave_span"] = a1.selectbox("Octave span", [1, 2, 3], index=[1, 2, 3].index(s["octave_span"]), key="sc_span")
            s["time_signature"] = a2.selectbox("Time signature", TIME_SIGNATURES, index=TIME_SIGNATURES.index(s["time_signature"]), key="sc_ts")
            s["note_value"] = a3.selectbox("Note value", ["whole", "half", "quarter", "eighth"], index=["whole", "half", "quarter", "eighth"].index(s["note_value"]), key="sc_nv")

            b1, b2 = st.columns(2)
            s["lowest_note"] = _select_note("Lowest playable note", "scales_low", s["lowest_note"])
            s["highest_note"] = _select_note("Highest playable note", "scales_high", s["highest_note"])

            c1, c2, c3 = st.columns(3)
            s["show_note_names"] = c1.toggle("Show note names", value=s["show_note_names"], key="sc_names")
            s["show_scale_degrees"] = c2.toggle("Show scale degrees", value=s["show_scale_degrees"], key="sc_deg")
            s["all_major_cycle"] = c3.toggle("All major scales cycle", value=s.get("all_major_cycle", False), key="sc_cycle")

            d1, d2 = st.columns(2)
            s["tempo"] = d1.text_input("Tempo (print only)", value=s["tempo"], key="sc_tempo")
            s["show_metadata"] = d2.toggle("Show metadata", value=s["show_metadata"], key="sc_meta")
    else:
        s["all_major_cycle"] = False


def _render_chords_controls(mode: str) -> None:
    s = st.session_state.chords_settings
    c1, c2 = st.columns(2)
    s["root"] = c1.selectbox("Root", ROOT_OPTIONS, index=ROOT_OPTIONS.index(s["root"]), key="ch_root")
    s["chord_type"] = c2.selectbox("Chord type", CHORD_TYPES, index=CHORD_TYPES.index(s["chord_type"]), key="ch_type")

    c3, c4 = st.columns(2)
    s["pattern"] = c3.selectbox("Pattern", ARPEGGIO_PATTERNS, index=ARPEGGIO_PATTERNS.index(s["pattern"]), key="ch_pat")
    if mode == "Quick":
        s["octave_span"] = c4.selectbox("Octaves", [1, 2], index=[1, 2].index(s["octave_span"]), key="ch_span_q")

    if mode == "Advanced":
        with st.expander("Advanced settings", expanded=True):
            a1, a2, a3 = st.columns(3)
            s["octave_span"] = a1.selectbox("Octave span", [1, 2], index=[1, 2].index(s["octave_span"]), key="ch_span")
            s["time_signature"] = a2.selectbox("Time signature", TIME_SIGNATURES, index=TIME_SIGNATURES.index(s["time_signature"]), key="ch_ts")
            s["note_value"] = a3.selectbox("Note value", ["half", "quarter", "eighth"], index=["half", "quarter", "eighth"].index(s["note_value"]), key="ch_nv")

            b1, b2 = st.columns(2)
            s["lowest_note"] = _select_note("Lowest playable note", "chords_low", s["lowest_note"])
            s["highest_note"] = _select_note("Highest playable note", "chords_high", s["highest_note"])

            c1, c2 = st.columns(2)
            s["show_note_names"] = c1.toggle("Show note names", value=s["show_note_names"], key="ch_names")
            s["show_chord_tones"] = c2.toggle("Show chord tones", value=s["show_chord_tones"], key="ch_tones")

            d1, d2 = st.columns(2)
            s["tempo"] = d1.text_input("Tempo (print only)", value=s["tempo"], key="ch_tempo")
            s["show_metadata"] = d2.toggle("Show metadata", value=s["show_metadata"], key="ch_meta")


def _render_sight_controls(mode: str) -> None:
    s = st.session_state.sight_settings

    c1, c2 = st.columns(2)
    s["key_mode"] = c1.selectbox(
        "Key mode",
        ["C Major / A Minor only", "Major keys", "Minor keys", "Chromatic / random accidentals"],
        index=["C Major / A Minor only", "Major keys", "Minor keys", "Chromatic / random accidentals"].index(s["key_mode"]),
        key="sr_mode",
    )
    normalize_key_selection(s)
    keys = available_keys_for_mode(s["key_mode"])
    s["specific_key"] = c2.selectbox(
        "Specific key",
        keys,
        index=keys.index(s["specific_key"]),
        disabled=s["key_mode"] == "Chromatic / random accidentals",
        key="sr_key",
    )

    c3, c4 = st.columns(2)
    s["num_bars"] = c3.selectbox("Bars", [2, 4, 8, 12, 16], index=[2, 4, 8, 12, 16].index(s["num_bars"]), key="sr_bars")
    s["difficulty"] = c4.selectbox("Difficulty", ["Beginner", "Intermediate", "Advanced"], index=["Beginner", "Intermediate", "Advanced"].index(s["difficulty"]), key="sr_diff")

    if mode == "Advanced":
        with st.expander("Advanced settings", expanded=True):
            a1, a2 = st.columns(2)
            s["lowest_note"] = _select_note("Lowest playable note", "sight_low", s["lowest_note"])
            s["highest_note"] = _select_note("Highest playable note", "sight_high", s["highest_note"])

            b1, b2 = st.columns(2)
            s["time_signature"] = b1.selectbox("Time signature", TIME_SIGNATURES, index=TIME_SIGNATURES.index(s["time_signature"]), key="sr_ts")
            s["max_leap"] = b2.selectbox(
                "Largest jump",
                ["step only", "up to 3rd", "up to 4th", "up to 5th", "octave"],
                index=["step only", "up to 3rd", "up to 4th", "up to 5th", "octave"].index(s["max_leap"]),
                key="sr_leap",
            )

            allowed = DIFFICULTY_ALLOWED[s["difficulty"]]
            default_values = [v for v in s["allowed_values"] if v in allowed]
            s["allowed_values"] = st.multiselect("Allowed note values", allowed, default=default_values, key="sr_values")

            c1, c2, c3 = st.columns(3)
            s["allow_rests"] = c1.toggle("Allow rests", value=s["allow_rests"], key="sr_rests")
            s["repeated_notes"] = c2.toggle("Repeated notes allowed", value=s["repeated_notes"], key="sr_repeat")
            s["show_note_names"] = c3.toggle("Show note names", value=s["show_note_names"], key="sr_names")

            d1, d2 = st.columns(2)
            s["tempo"] = d1.text_input("Tempo (print only)", value=s["tempo"], key="sr_tempo")
            s["show_metadata"] = d2.toggle("Show metadata", value=s["show_metadata"], key="sr_meta")
    else:
        # Keep quick mode practical and constrained.
        s["time_signature"] = "4/4"
        s["max_leap"] = "up to 3rd"
        s["allowed_values"] = ["half", "quarter"] if s["difficulty"] == "Beginner" else ["half", "quarter", "eighth"]


def generate_and_store(tab_name: str) -> None:
    settings = _settings_for_tab(tab_name)
    if tab_name == "Scales":
        score, title, err = build_scale_exercise(settings)
    elif tab_name == "Chords / Arpeggios":
        score, title, err = build_chord_exercise(settings)
    else:
        score, title, err = build_sight_reading_exercise(settings)

    if err:
        st.session_state.last_exercise[tab_name] = {
            "tab": tab_name,
            "title": None,
            "error": _friendly_error(err),
            "summary": to_settings_summary(settings),
            "png": None,
            "pdf": None,
        }
        push_history(st.session_state.history, {"tab": tab_name, "title": "Error", "error": _friendly_error(err)})
        return

    apply_metadata(score, title)
    if settings.get("show_metadata", True):
        summary_line = " | ".join(to_settings_summary(settings)[:5])
        score.parts[0].append(expressions.TextExpression(summary_line))

    png, png_err = render_score_png_bytes(score)
    pdf, _ = render_score_pdf_bytes(score)

    st.session_state.last_exercise[tab_name] = {
        "tab": tab_name,
        "title": title,
        "error": _friendly_error(png_err) if png_err else None,
        "summary": to_settings_summary(settings),
        "png": png,
        "pdf": pdf,
    }
    push_history(st.session_state.history, {"tab": tab_name, "title": title, "error": _friendly_error(png_err) if png_err else None})


def render_exercise_output(tab_name: str) -> None:
    ex = st.session_state.last_exercise[tab_name]
    settings = _settings_for_tab(tab_name)

    if not ex:
        st.info("No exercise generated yet. Click Generate New to start.")
        return

    if ex["title"]:
        st.subheader(ex["title"])

    if ex["error"]:
        st.error(ex["error"])

    st.caption(_compact_summary(tab_name, settings))

    if ex["png"]:
        st.image(ex["png"], use_container_width=True)

    d1, d2 = st.columns([1, 1])
    if ex["png"]:
        d1.download_button(
            "Export PNG",
            data=ex["png"],
            file_name=f"{tab_name.lower().replace(' ', '_').replace('/', '_')}.png",
            mime="image/png",
            key=f"png_{tab_name}",
        )
    if ex["pdf"]:
        d2.download_button(
            "Export PDF",
            data=ex["pdf"],
            file_name=f"{tab_name.lower().replace(' ', '_').replace('/', '_')}.pdf",
            mime="application/pdf",
            key=f"pdf_{tab_name}",
        )

    if settings.get("show_metadata", True):
        with st.expander("Detailed settings", expanded=False):
            for line in ex["summary"]:
                st.text(line)


def render_tab(tab_name: str) -> None:
    mode = st.session_state.ui_mode

    _render_preset_header(tab_name)

    if tab_name == "Scales":
        _render_scales_controls(mode)
    elif tab_name == "Chords / Arpeggios":
        _render_chords_controls(mode)
    else:
        _render_sight_controls(mode)

    b1, b2 = st.columns([1, 1])
    if b1.button("Generate New", key=f"gen_{tab_name}", type="primary"):
        generate_and_store(tab_name)
    if b2.button("Regenerate Same Settings", key=f"regen_{tab_name}"):
        generate_and_store(tab_name)

    render_exercise_output(tab_name)


init_session()

st.title("Chromatic Harmonica Practice App")
st.sidebar.radio("Interface mode", ["Quick", "Advanced"], key="ui_mode")

scales_tab, chords_tab, sight_tab = st.tabs(["Scales", "Chords / Arpeggios", "Sight Reading"])

with scales_tab:
    render_tab("Scales")

with chords_tab:
    render_tab("Chords / Arpeggios")

with sight_tab:
    render_tab("Sight Reading")

with st.expander("Recent exercises (last 10)", expanded=False):
    if not st.session_state.history:
        st.caption("No history yet.")
    else:
        for item in list(st.session_state.history):
            label = f"[{item['tab']}] {item['title']}"
            if item.get("error"):
                label += f" | {item['error']}"
            st.write(label)
