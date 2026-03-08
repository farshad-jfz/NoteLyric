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
    if "preset_selection" not in st.session_state:
        st.session_state.preset_selection = list(PRESETS.keys())[0]
    if "sidebar_tab" not in st.session_state:
        st.session_state.sidebar_tab = "Scales"


def _select_note(label: str, key: str, value: str) -> str:
    default_index = NOTE_OPTIONS.index(value) if value in NOTE_OPTIONS else NOTE_OPTIONS.index("C4")
    return st.selectbox(label, NOTE_OPTIONS, index=default_index, key=key)


def sidebar_controls() -> None:
    st.sidebar.title("Exercise Settings")
    st.sidebar.selectbox("Preset", list(PRESETS.keys()), key="preset_selection")
    if st.sidebar.button("Apply preset"):
        preset = PRESETS[st.session_state.preset_selection]
        tab = preset["tab"]
        if tab == "Scales":
            st.session_state.scales_settings.update(preset["settings"])
        elif tab == "Chords / Arpeggios":
            st.session_state.chords_settings.update(preset["settings"])
        else:
            st.session_state.sight_settings.update(preset["settings"])
        st.session_state.sidebar_tab = tab

    st.sidebar.radio("Current tab settings", ["Scales", "Chords / Arpeggios", "Sight Reading"], key="sidebar_tab")

    if st.session_state.sidebar_tab == "Scales":
        s = st.session_state.scales_settings
        s["root"] = st.sidebar.selectbox("Root note", ROOT_OPTIONS, index=ROOT_OPTIONS.index(s["root"]), key="sc_root")
        s["all_major_cycle"] = st.sidebar.toggle("All major scales cycle", value=s.get("all_major_cycle", False), key="sc_cycle")
        s["scale_type"] = st.sidebar.selectbox("Scale type", SCALE_TYPES, index=SCALE_TYPES.index(s["scale_type"]), key="sc_type")
        s["octave_span"] = st.sidebar.selectbox("Octave span", [1, 2, 3], index=[1, 2, 3].index(s["octave_span"]), key="sc_span")
        s["direction"] = st.sidebar.selectbox("Direction", DIRECTIONS, index=DIRECTIONS.index(s["direction"]), key="sc_dir")
        s["time_signature"] = st.sidebar.selectbox("Time signature", TIME_SIGNATURES, index=TIME_SIGNATURES.index(s["time_signature"]), key="sc_ts")
        s["note_value"] = st.sidebar.selectbox("Note value", ["whole", "half", "quarter", "eighth"], index=["whole", "half", "quarter", "eighth"].index(s["note_value"]), key="sc_nv")
        s["lowest_note"] = _select_note("Lowest playable note", "scales_low", s["lowest_note"])
        s["highest_note"] = _select_note("Highest playable note", "scales_high", s["highest_note"])
        s["show_note_names"] = st.sidebar.toggle("Show note names", value=s["show_note_names"], key="sc_names")
        s["show_scale_degrees"] = st.sidebar.toggle("Show scale degrees", value=s["show_scale_degrees"], key="sc_deg")
        s["tempo"] = st.sidebar.text_input("Tempo (print only)", value=s["tempo"], key="sc_tempo")
        s["show_metadata"] = st.sidebar.toggle("Show exercise metadata", value=s["show_metadata"], key="sc_meta")

    elif st.session_state.sidebar_tab == "Chords / Arpeggios":
        s = st.session_state.chords_settings
        s["root"] = st.sidebar.selectbox("Root note", ROOT_OPTIONS, index=ROOT_OPTIONS.index(s["root"]), key="ch_root")
        s["chord_type"] = st.sidebar.selectbox("Chord type", CHORD_TYPES, index=CHORD_TYPES.index(s["chord_type"]), key="ch_type")
        s["pattern"] = st.sidebar.selectbox("Pattern", ARPEGGIO_PATTERNS, index=ARPEGGIO_PATTERNS.index(s["pattern"]), key="ch_pat")
        s["octave_span"] = st.sidebar.selectbox("Octave span", [1, 2], index=[1, 2].index(s["octave_span"]), key="ch_span")
        s["time_signature"] = st.sidebar.selectbox("Time signature", TIME_SIGNATURES, index=TIME_SIGNATURES.index(s["time_signature"]), key="ch_ts")
        s["note_value"] = st.sidebar.selectbox("Note value", ["half", "quarter", "eighth"], index=["half", "quarter", "eighth"].index(s["note_value"]), key="ch_nv")
        s["lowest_note"] = _select_note("Lowest playable note", "chords_low", s["lowest_note"])
        s["highest_note"] = _select_note("Highest playable note", "chords_high", s["highest_note"])
        s["show_note_names"] = st.sidebar.toggle("Show note names", value=s["show_note_names"], key="ch_show_names")
        s["show_chord_tones"] = st.sidebar.toggle("Show chord tones", value=s["show_chord_tones"], key="ch_tones")
        s["tempo"] = st.sidebar.text_input("Tempo (print only)", value=s["tempo"], key="ch_tempo")
        s["show_metadata"] = st.sidebar.toggle("Show exercise metadata", value=s["show_metadata"], key="ch_meta")

    else:
        s = st.session_state.sight_settings
        s["lowest_note"] = _select_note("Lowest playable note", "sight_low", s["lowest_note"])
        s["highest_note"] = _select_note("Highest playable note", "sight_high", s["highest_note"])
        s["key_mode"] = st.sidebar.selectbox(
            "Key mode",
            ["C Major / A Minor only", "Major keys", "Minor keys", "Chromatic / random accidentals"],
            index=["C Major / A Minor only", "Major keys", "Minor keys", "Chromatic / random accidentals"].index(s["key_mode"]),
            key="sr_mode",
        )
        normalize_key_selection(s)
        keys = available_keys_for_mode(s["key_mode"])
        disabled = s["key_mode"] == "Chromatic / random accidentals"
        s["specific_key"] = st.sidebar.selectbox("Specific key", keys, index=keys.index(s["specific_key"]), disabled=disabled, key="sr_key")
        s["num_bars"] = st.sidebar.selectbox("Number of bars", [2, 4, 8, 12, 16], index=[2, 4, 8, 12, 16].index(s["num_bars"]), key="sr_bars")
        s["time_signature"] = st.sidebar.selectbox("Time signature", TIME_SIGNATURES, index=TIME_SIGNATURES.index(s["time_signature"]), key="sr_ts")
        s["difficulty"] = st.sidebar.selectbox("Difficulty", ["Beginner", "Intermediate", "Advanced"], index=["Beginner", "Intermediate", "Advanced"].index(s["difficulty"]), key="sr_diff")
        allowed_map = {
            "Beginner": ["whole", "half", "quarter"],
            "Intermediate": ["whole", "half", "quarter", "eighth"],
            "Advanced": DISPLAY_NOTE_VALUES,
        }
        filtered_values = allowed_map[s["difficulty"]]
        default_values = [v for v in s["allowed_values"] if v in filtered_values]
        s["allowed_values"] = st.sidebar.multiselect("Allowed note values", filtered_values, default=default_values, key="sr_values")
        s["allow_rests"] = st.sidebar.toggle("Allow rests", value=s["allow_rests"], key="sr_rests")
        s["max_leap"] = st.sidebar.selectbox("Maximum leap", ["step only", "up to 3rd", "up to 4th", "up to 5th", "octave"], index=["step only", "up to 3rd", "up to 4th", "up to 5th", "octave"].index(s["max_leap"]), key="sr_leap")
        s["repeated_notes"] = st.sidebar.toggle("Repeated notes allowed", value=s["repeated_notes"], key="sr_repeat")
        s["show_note_names"] = st.sidebar.toggle("Show note names", value=s["show_note_names"], key="sr_names")
        s["tempo"] = st.sidebar.text_input("Tempo (print only)", value=s["tempo"], key="sr_tempo")
        s["show_metadata"] = st.sidebar.toggle("Show exercise metadata", value=s["show_metadata"], key="sr_meta")


def _settings_for_tab(tab_name: str) -> dict:
    if tab_name == "Scales":
        return st.session_state.scales_settings
    if tab_name == "Chords / Arpeggios":
        return st.session_state.chords_settings
    return st.session_state.sight_settings


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
            "error": err,
            "summary": to_settings_summary(settings),
            "png": None,
            "pdf": None,
        }
        push_history(st.session_state.history, {"tab": tab_name, "title": "Error", "error": err})
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
        "error": png_err,
        "summary": to_settings_summary(settings),
        "png": png,
        "pdf": pdf,
    }
    push_history(st.session_state.history, {"tab": tab_name, "title": title, "error": png_err})


def render_exercise_panel(tab_name: str) -> None:
    settings = _settings_for_tab(tab_name)

    col1, col2, col3, col4 = st.columns([1, 1, 1, 1])
    if col1.button("Generate", key=f"gen_{tab_name}"):
        generate_and_store(tab_name)
    if col2.button("Regenerate", key=f"regen_{tab_name}"):
        generate_and_store(tab_name)

    ex = st.session_state.last_exercise[tab_name]
    if not ex:
        st.info("No exercise generated yet.")
        return

    if ex["title"]:
        st.subheader(ex["title"])

    if ex["error"]:
        st.error(ex["error"])

    if ex["png"]:
        st.image(ex["png"], use_container_width=True)
        col3.download_button(
            "Export PNG",
            data=ex["png"],
            file_name=f"{tab_name.lower().replace(' ', '_').replace('/', '_')}.png",
            mime="image/png",
            key=f"png_{tab_name}",
        )
    else:
        col3.button("Export PNG", disabled=True, key=f"png_dis_{tab_name}")

    if ex["pdf"]:
        col4.download_button(
            "Export PDF",
            data=ex["pdf"],
            file_name=f"{tab_name.lower().replace(' ', '_').replace('/', '_')}.pdf",
            mime="application/pdf",
            key=f"pdf_{tab_name}",
        )
    else:
        col4.button("Export PDF", disabled=True, key=f"pdf_dis_{tab_name}")

    if settings.get("show_metadata", True):
        st.caption("Settings summary")
        for line in ex["summary"]:
            st.text(line)


init_session()
sidebar_controls()

st.title("Chromatic Harmonica Practice App")

scales_tab, chords_tab, sight_tab = st.tabs(["Scales", "Chords / Arpeggios", "Sight Reading"])

with scales_tab:
    render_exercise_panel("Scales")

with chords_tab:
    render_exercise_panel("Chords / Arpeggios")

with sight_tab:
    render_exercise_panel("Sight Reading")

st.divider()
st.subheader("Session History (last 10)")
for item in list(st.session_state.history):
    label = f"[{item['tab']}] {item['title']}"
    if item.get("error"):
        label += f" | {item['error']}"
    st.write(label)
