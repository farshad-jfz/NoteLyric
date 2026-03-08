# Chromatic Harmonica Practice App

Streamlit MVP for generating chromatic harmonica notation practice in three tabs:

- Scales
- Chords / Arpeggios
- Sight Reading

## Setup

1. Create and activate a Python 3.10+ environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run app:

```bash
streamlit run app.py
```

## Notes

- The app uses `music21` for notation generation.
- PNG export is implemented through `music21`'s external music notation rendering (`musicxml.png`).
- PDF export is optional and only enabled when the renderer succeeds.
- If no external notation renderer is configured, generation still works and validation errors are shown without crashing.

## Project Structure

- `app.py`: Streamlit UI + session state + tabs
- `generators/scales.py`: scale generation logic
- `generators/chords.py`: chord/arpeggio generation logic
- `generators/sight_reading.py`: sight-reading melody generation logic
- `rendering/renderer.py`: score rendering + export helpers
- `presets.py`: starter presets
- `models.py`: shared constants and types
- `utils.py`: shared helper functions
