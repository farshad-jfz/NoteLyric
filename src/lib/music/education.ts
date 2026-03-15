export type ContextExplanation = {
  title: string;
  definition: string;
  formulaLabel: string;
  formula: string;
  example: string;
  tip?: string;
};

export const SCALE_EXPLANATIONS: Record<string, ContextExplanation> = {
  Major: {
    title: "Major Scale",
    definition: "The major scale is the most common scale in Western music. It has a bright, stable sound and forms the basis for many melodies and harmonies.",
    formulaLabel: "Pattern",
    formula: "W - W - H - W - W - W - H",
    example: "C - D - E - F - G - A - B - C"
  },
  "Natural Minor": {
    title: "Natural Minor Scale",
    definition: "The natural minor scale has a darker, more melancholic sound than the major scale. It is commonly used in many styles of music.",
    formulaLabel: "Pattern",
    formula: "W - H - W - W - H - W - W",
    example: "A - B - C - D - E - F - G - A"
  },
  "Harmonic Minor": {
    title: "Harmonic Minor Scale",
    definition: "The harmonic minor scale is similar to the natural minor scale but with a raised 7th note. This creates a stronger pull back to the root.",
    formulaLabel: "Pattern",
    formula: "W - H - W - W - H - W+H - H",
    example: "A - B - C - D - E - F - G# - A"
  },
  "Melodic Minor": {
    title: "Melodic Minor Scale",
    definition: "The melodic minor scale raises the 6th and 7th notes on the way up, giving minor melodies a smoother, more singable shape.",
    formulaLabel: "Pattern",
    formula: "W - H - W - W - W - W - H",
    example: "A - B - C - D - E - F# - G# - A"
  },
  "Major Pentatonic": {
    title: "Major Pentatonic Scale",
    definition: "The major pentatonic scale contains five notes and removes the more dissonant tones from the major scale, giving it a smooth and open sound.",
    formulaLabel: "Pattern",
    formula: "1 - 2 - 3 - 5 - 6",
    example: "C - D - E - G - A"
  },
  "Minor Pentatonic": {
    title: "Minor Pentatonic Scale",
    definition: "The minor pentatonic scale is widely used in blues, rock, and improvisation. It has a simple structure and works well for melodic phrasing.",
    formulaLabel: "Pattern",
    formula: "1 - b3 - 4 - 5 - b7",
    example: "A - C - D - E - G"
  },
  Blues: {
    title: "Blues Scale",
    definition: "The blues scale is a variation of the minor pentatonic scale that adds the blue note, creating a distinctive blues sound.",
    formulaLabel: "Pattern",
    formula: "1 - b3 - 4 - b5 - 5 - b7",
    example: "A - C - D - Eb - E - G"
  },
  Chromatic: {
    title: "Chromatic Scale",
    definition: "The chromatic scale includes all twelve notes within an octave, moving only in half steps. It is useful for technical practice and developing familiarity with all notes on the instrument.",
    formulaLabel: "Pattern",
    formula: "All 12 semitones in order",
    example: "C - C# - D - D# - E - F - F# - G - G# - A - A# - B - C"
  }
};

export const CHORD_EXPLANATIONS: Record<string, ContextExplanation> = {
  "Major triad": {
    title: "Major Triad",
    definition: "A major triad consists of a root, major third, and perfect fifth. It produces a bright and stable harmony.",
    formulaLabel: "Formula",
    formula: "1 - 3 - 5",
    example: "C - E - G",
    tip: "Turn on Show scale degrees to display labels like 1 - 3 - 5 with the notes."
  },
  "Minor triad": {
    title: "Minor Triad",
    definition: "A minor triad contains a root, minor third, and perfect fifth. It has a darker and more melancholic sound.",
    formulaLabel: "Formula",
    formula: "1 - b3 - 5",
    example: "A - C - E",
    tip: "Turn on Show scale degrees to display labels like 1 - b3 - 5 with the notes."
  },
  "Diminished triad": {
    title: "Diminished Triad",
    definition: "A diminished triad contains a root, minor third, and diminished fifth. It has a tense and unstable sound.",
    formulaLabel: "Formula",
    formula: "1 - b3 - b5",
    example: "B - D - F",
    tip: "Turn on Show scale degrees to display labels like 1 - b3 - b5 with the notes."
  },
  "Augmented triad": {
    title: "Augmented Triad",
    definition: "An augmented triad consists of a root, major third, and augmented fifth. It produces a bright but unstable sound.",
    formulaLabel: "Formula",
    formula: "1 - 3 - #5",
    example: "C - E - G#",
    tip: "Turn on Show scale degrees to display labels like 1 - 3 - #5 with the notes."
  },
  "Dominant 7": {
    title: "Dominant 7 Chord",
    definition: "A dominant seventh chord adds a minor seventh to a major triad. It creates strong forward motion and often wants to resolve.",
    formulaLabel: "Formula",
    formula: "1 - 3 - 5 - b7",
    example: "G - B - D - F",
    tip: "Turn on Show scale degrees to display labels like 1 - 3 - 5 - b7 with the notes."
  },
  "Major 7": {
    title: "Major 7 Chord",
    definition: "A major seventh chord adds a major seventh interval to the major triad. It has a rich, smooth sound often used in jazz.",
    formulaLabel: "Formula",
    formula: "1 - 3 - 5 - 7",
    example: "C - E - G - B",
    tip: "Turn on Show scale degrees to display labels like 1 - 3 - 5 - 7 with the notes."
  },
  "Minor 7": {
    title: "Minor 7 Chord",
    definition: "A minor seventh chord adds a minor seventh interval to a minor triad. It is commonly used in jazz, funk, and many modern styles.",
    formulaLabel: "Formula",
    formula: "1 - b3 - 5 - b7",
    example: "A - C - E - G",
    tip: "Turn on Show scale degrees to display labels like 1 - b3 - 5 - b7 with the notes."
  }
};

const SCALE_DEGREE_PATTERNS: Record<string, string[]> = {
  Major: ["1", "2", "3", "4", "5", "6", "7", "1"],
  "Natural Minor": ["1", "2", "b3", "4", "5", "b6", "b7", "1"],
  "Harmonic Minor": ["1", "2", "b3", "4", "5", "b6", "7", "1"],
  "Melodic Minor": ["1", "2", "b3", "4", "5", "6", "7", "1"],
  "Major Pentatonic": ["1", "2", "3", "5", "6", "1"],
  "Minor Pentatonic": ["1", "b3", "4", "5", "b7", "1"],
  Blues: ["1", "b3", "4", "b5", "5", "b7", "1"],
  Chromatic: ["1", "b2", "2", "b3", "3", "4", "#4", "5", "b6", "6", "b7", "7", "1"]
};

const CHORD_DEGREE_PATTERNS: Record<string, string[]> = {
  "Major triad": ["1", "3", "5", "1"],
  "Minor triad": ["1", "b3", "5", "1"],
  "Diminished triad": ["1", "b3", "b5", "1"],
  "Augmented triad": ["1", "3", "#5", "1"],
  "Dominant 7": ["1", "3", "5", "b7", "1"],
  "Major 7": ["1", "3", "5", "7", "1"],
  "Minor 7": ["1", "b3", "5", "b7", "1"]
};

export const buildScaleDegreeLabels = (scaleType: string, octaveSpan: number, direction: "Ascending" | "Descending" | "Up and Down"): string[] => {
  const pattern = SCALE_DEGREE_PATTERNS[scaleType];
  if (!pattern) return [];

  const ascending: string[] = [];
  for (let oct = 0; oct < octaveSpan; oct += 1) {
    ascending.push(...pattern.slice(0, -1));
  }
  ascending.push(pattern[pattern.length - 1]);

  if (direction === "Ascending") return ascending;
  if (direction === "Descending") return [...ascending].reverse();
  return [...ascending, ...[...ascending].reverse().slice(1)];
};

export const buildChordDegreeLabels = (
  chordType: string,
  octaveSpan: number,
  pattern: "Block chord" | "Ascending arpeggio" | "Descending arpeggio" | "Up and Down"
): string[] => {
  const degrees = CHORD_DEGREE_PATTERNS[chordType];
  if (!degrees) return [];

  if (pattern === "Block chord") {
    return Array.from({ length: octaveSpan }, () => degrees.slice(0, -1).join(" "));
  }

  const ascending: string[] = [];
  for (let oct = 0; oct < octaveSpan; oct += 1) {
    ascending.push(...degrees.slice(0, -1));
  }
  ascending.push(degrees[degrees.length - 1]);

  if (pattern === "Ascending arpeggio") return ascending;
  if (pattern === "Descending arpeggio") return [...ascending].reverse();
  return [...ascending, ...[...ascending].reverse().slice(1)];
};
