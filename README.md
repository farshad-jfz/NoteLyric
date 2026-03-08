# NoteLyric

Practice Harmonically

Browser-first chromatic harmonica practice app built with Next.js + TypeScript.

## What it does

- Generates notation practice for:
  - Scales
  - Chords / Arpeggios
  - Sight Reading
- Renders notation in-browser with OpenSheetMusicDisplay
- Exports SVG, PNG, MusicXML, and supports print-to-PDF
- Uses presets and validation to keep generation practical

## UI

The app uses a lightweight UI layer with Mantine UI plus small custom overrides.

## Local development

1. Install Node.js 20+.
2. Install dependencies:

```bash
npm install
```

3. Start:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Test

```bash
npm test
```

## Deploy

Deploy directly to Vercel Hobby from GitHub. No MuseScore or other desktop binaries required.
