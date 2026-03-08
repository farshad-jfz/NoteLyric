# Chromatic Harmonica Practice (Next.js + TypeScript)

Browser-first rewrite of the harmonica practice app with no MuseScore runtime dependency.

## Stack

- Next.js (App Router)
- React + TypeScript
- OpenSheetMusicDisplay (OSMD) for in-browser score rendering
- MusicXML serialization generated from structured exercise models

## Features

- Three practice pages:
  - `/scales`
  - `/chords`
  - `/sight-reading`
- Presets per page
- Quick / Advanced control modes
- Range validation and rhythm validation
- Regenerate with same settings
- Export:
  - SVG
  - PNG
  - MusicXML
  - Print / PDF (browser print)

## Architecture

- `src/lib/generators/*`: exercise logic
- `src/lib/validation/*`: rules and pre-generation checks
- `src/lib/music/*`: domain models, pitch/rhythm helpers, MusicXML builder
- `src/lib/rendering/*`: client rendering adapters
- `src/components/*`: reusable UI blocks
- `src/app/*`: Next.js pages/routes

## Local Development

1. Install Node.js 20+.
2. Install dependencies:

```bash
npm install
```

3. Start dev server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000).

## Tests

```bash
npm test
```

Includes generator and validation unit tests under `src/tests`.

## Deploy (Vercel Hobby)

1. Push repository to GitHub.
2. Import project into Vercel.
3. Framework preset: Next.js.
4. Deploy with default settings.

No desktop score binary installation is required.

## Notes

The original Python/Streamlit implementation is still present in the repository as legacy code. The new web app is the primary runtime path.
