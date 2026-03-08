import { Exercise, MusicEvent } from "@/lib/music/models";
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

const eventToXml = (event: MusicEvent): string => {
  const dur = durationTypeMap[event.duration];
  const duration = event.duration === "whole" ? 8 : event.duration === "half" ? 4 : event.duration === "quarter" ? 2 : event.duration === "eighth" ? 1 : event.duration === "dotted half" ? 6 : 3;

  if (event.kind === "rest") {
    return `<note><rest/><duration>${duration}</duration><type>${dur.type}</type>${dur.dots ? "<dot/>" : ""}</note>`;
  }

  if (event.chord && event.chord.length > 1) {
    const notes = event.chord.map((p, idx) => {
      const { step, alter, octave } = parsePitch(p);
      return `<note>${idx > 0 ? "<chord/>" : ""}<pitch><step>${step}</step>${alter !== 0 ? `<alter>${alter}</alter>` : ""}<octave>${octave}</octave></pitch><duration>${duration}</duration><type>${dur.type}</type>${dur.dots ? "<dot/>" : ""}${event.lyric && idx === 0 ? `<lyric><text>${event.lyric}</text></lyric>` : ""}</note>`;
    });
    return notes.join("");
  }

  const { step, alter, octave } = parsePitch(event.pitch);
  return `<note><pitch><step>${step}</step>${alter !== 0 ? `<alter>${alter}</alter>` : ""}<octave>${octave}</octave></pitch><duration>${duration}</duration><type>${dur.type}</type>${dur.dots ? "<dot/>" : ""}${event.lyric ? `<lyric><text>${event.lyric}</text></lyric>` : ""}</note>`;
};

export const exerciseToMusicXml = (exercise: Exercise): string => {
  const [beats, beatType] = exercise.timeSignature.split("/");
  const fifths = exercise.keySignature ? keySignatureFifths(exercise.keySignature) : 0;

  const measuresXml = exercise.measures
    .map((m, idx) => {
      const attrs = idx === 0
        ? `<attributes><divisions>${baseDivisions}</divisions><key><fifths>${fifths}</fifths></key><time><beats>${beats}</beats><beat-type>${beatType}</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`
        : "";
      const eventsXml = m.events.map(eventToXml).join("");
      return `<measure number="${idx + 1}">${attrs}${eventsXml}</measure>`;
    })
    .join("");

  const tempo = exercise.tempo ? `<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${exercise.tempo}</per-minute></metronome></direction-type></direction>` : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work><work-title>${exercise.title}</work-title></work>
  <part-list><score-part id="P1"><part-name>Practice</part-name></score-part></part-list>
  <part id="P1">${tempo}${measuresXml}</part>
</score-partwise>`;
};
