import { durationToUnits } from "@/lib/music/rhythmUtils";
import type { Exercise, MusicEvent, TimeSignature } from "@/lib/music/models";
import { keySignatureFifths, parsePitch } from "@/lib/music/noteUtils";

const durationTypeMap: Record<string, { type: string; dots?: number }> = {
  whole: { type: "whole" },
  half: { type: "half" },
  quarter: { type: "quarter" },
  eighth: { type: "eighth" },
  "dotted half": { type: "half", dots: 1 },
  "dotted quarter": { type: "quarter", dots: 1 }
};

const baseDivisions = 2;

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");

const renderLyrics = (event: Extract<MusicEvent, { kind: "note" }>): string => {
  const lyrics = event.lyrics?.length ? event.lyrics : event.lyric ? [event.lyric] : [];
  return lyrics.map((text, idx) => `<lyric number="${idx + 1}"><text>${escapeXml(text)}</text></lyric>`).join("");
};

type BeamValue = "begin" | "continue" | "end";

const beamSpansForTimeSignature = (timeSignature: TimeSignature): Array<[number, number]> => {
  if (timeSignature === "6/8") return [[0, 3], [3, 6]];
  if (timeSignature === "3/4") return [[0, 4], [4, 6]];
  if (timeSignature === "4/4") return [[0, 4], [4, 8]];
  return [[0, 2], [2, 4]];
};

const buildBeamMap = (events: MusicEvent[], timeSignature: TimeSignature): Map<number, BeamValue> => {
  let cursor = 0;
  const positioned = events.map((event, index) => {
    const start = cursor;
    const units = durationToUnits(event.duration);
    cursor += units;
    return { event, index, start, end: start + units };
  });

  const beamMap = new Map<number, BeamValue>();
  const commitRun = (run: number[]) => {
    if (run.length < 2) return;
    run.forEach((index, position) => {
      beamMap.set(index, position === 0 ? "begin" : position === run.length - 1 ? "end" : "continue");
    });
  };

  for (const [spanStart, spanEnd] of beamSpansForTimeSignature(timeSignature)) {
    let run: number[] = [];
    for (const positionedEvent of positioned) {
      if (positionedEvent.start < spanStart || positionedEvent.end > spanEnd) continue;

      const beamable = positionedEvent.event.kind === "note" && positionedEvent.event.duration === "eighth";
      if (beamable) {
        run.push(positionedEvent.index);
        continue;
      }

      commitRun(run);
      run = [];
    }
    commitRun(run);
  }

  return beamMap;
};

const renderBeam = (beam?: BeamValue): string => (beam ? `<beam number="1">${beam}</beam>` : "");

const eventToXml = (event: MusicEvent, beam?: BeamValue): string => {
  const dur = durationTypeMap[event.duration];
  const duration = event.duration === "whole" ? 8 : event.duration === "half" ? 4 : event.duration === "quarter" ? 2 : event.duration === "eighth" ? 1 : event.duration === "dotted half" ? 6 : 3;
  const beamXml = renderBeam(beam);

  if (event.kind === "rest") {
    return `<note><rest/><duration>${duration}</duration><type>${dur.type}</type>${dur.dots ? "<dot/>" : ""}</note>`;
  }

  if (event.chord && event.chord.length > 1) {
    const notes = event.chord.map((p, idx) => {
      const { step, alter, octave } = parsePitch(p);
      return `<note>${idx > 0 ? "<chord/>" : ""}<pitch><step>${step}</step>${alter !== 0 ? `<alter>${alter}</alter>` : ""}<octave>${octave}</octave></pitch><duration>${duration}</duration><type>${dur.type}</type>${dur.dots ? "<dot/>" : ""}${beamXml}${idx === 0 ? renderLyrics(event) : ""}</note>`;
    });
    return notes.join("");
  }

  const { step, alter, octave } = parsePitch(event.pitch);
  return `<note><pitch><step>${step}</step>${alter !== 0 ? `<alter>${alter}</alter>` : ""}<octave>${octave}</octave></pitch><duration>${duration}</duration><type>${dur.type}</type>${dur.dots ? "<dot/>" : ""}${beamXml}${renderLyrics(event)}</note>`;
};

export const exerciseToMusicXml = (exercise: Exercise): string => {
  const [beats, beatType] = exercise.timeSignature.split("/");
  const fifths = exercise.keySignature ? keySignatureFifths(exercise.keySignature) : 0;

  const measuresXml = exercise.measures
    .map((measure, idx) => {
      const beamMap = buildBeamMap(measure.events, exercise.timeSignature);
      const attrs = idx === 0
        ? `<attributes><divisions>${baseDivisions}</divisions><key><fifths>${fifths}</fifths></key><time><beats>${beats}</beats><beat-type>${beatType}</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`
        : "";
      const annotation = exercise.measureAnnotations?.[idx]
        ? `<direction placement="above"><direction-type><words>${escapeXml(exercise.measureAnnotations[idx])}</words></direction-type></direction>`
        : "";
      const eventsXml = measure.events.map((event, eventIndex) => eventToXml(event, beamMap.get(eventIndex))).join("");
      return `<measure number="${idx + 1}">${attrs}${annotation}${eventsXml}</measure>`;
    })
    .join("");

  const tempo = exercise.tempo
    ? `<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${escapeXml(exercise.tempo)}</per-minute></metronome></direction-type></direction>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work><work-title>${escapeXml(exercise.title)}</work-title></work>
  <part-list><score-part id="P1"><part-name>Practice</part-name></score-part></part-list>
  <part id="P1">${tempo}${measuresXml}</part>
</score-partwise>`;
};
