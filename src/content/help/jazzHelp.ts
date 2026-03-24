import type { HelpEntry } from "@/content/help/types";
import type { JazzMode } from "@/lib/music/jazz";

const intro: HelpEntry = {
  id: "jazz-practice-intro",
  title: "What is Jazz Practice?",
  shortDescription: "Jazz practice focuses on how melodies relate to chords, not just scales.",
  fullDescription:
    "Strong jazz lines outline harmony, move smoothly between chords, and make resolution feel intentional. This section trains you to hear chord movement and shape lines that belong to the progression instead of sounding like disconnected scale drills.",
  practiceTip: "Always ask what chord you are on and where the line is resolving."
};

const modes: Array<HelpEntry & { id: JazzMode }> = [
  {
    id: "ii-v-i",
    title: "II-V-I Progressions",
    shortDescription: "The most common chord progression in jazz, used to practice harmonic movement.",
    theory:
      "In a major key, the II-V-I progression is built from the 2nd, 5th, and 1st scale degrees. In C major that is Dm7 to G7 to Cmaj7, where the dominant chord creates tension that resolves to the tonic.",
    fullDescription:
      "This progression appears throughout jazz standards. Practicing it helps you hear tension and release, follow the harmony measure by measure, and land on stronger notes when the chords change.",
    practiceTip: "Play slowly and notice how the V chord wants to resolve to I.",
    howToPractice: [
      "Track each chord change instead of treating the whole line like one scale.",
      "Land on a clear chord tone when the harmony changes.",
      "Repeat one short progression several times before regenerating."
    ],
    commonMistakes: [
      "Treating the whole progression like one static scale.",
      "Ignoring the pull from V to I."
    ],
    bestFor: "All levels. This is the foundation of jazz harmony."
  },
  {
    id: "guide-tones",
    title: "Guide Tones",
    shortDescription: "The 3rd and 7th of each chord that define its sound and movement.",
    theory:
      "The 3rd tells you whether a chord is major or minor. The 7th tells you whether it feels stable or dominant. In jazz progressions these notes often move by small steps, so they reveal the harmony with very little material.",
    fullDescription:
      "Guide tones are one of the clearest ways to hear chord changes. Even a simple line using only guide tones can make the progression obvious.",
    practiceTip: "Play only the guide tones first, then add nearby notes after the harmony feels clear.",
    howToPractice: [
      "Identify the 3rd and 7th of each chord before you play.",
      "Listen to how one guide tone connects to the next.",
      "Keep the line smooth and singable."
    ],
    commonMistakes: [
      "Playing too fast to hear the movement.",
      "Ignoring how the guide tones connect across chords."
    ],
    bestFor: "Beginners and intermediate players building harmonic awareness."
  },
  {
    id: "target-tones",
    title: "Target Tones",
    shortDescription: "Important chord tones that lines resolve to, usually on strong beats.",
    theory:
      "Strong beats often emphasize chord tones such as the root, 3rd, 5th, or 7th. Target tones are the notes your phrase is aiming for, and the surrounding notes matter because they lead into those arrivals.",
    fullDescription:
      "Target-tone practice helps you think in terms of direction and resolution. Instead of treating every note equally, you start hearing which notes matter most at each moment.",
    practiceTip: "Play the connecting notes lightly and let the landing note feel deliberate.",
    howToPractice: [
      "Identify the target note in each measure before playing.",
      "Aim for strong chord tones on the strongest beats.",
      "Listen for whether the line actually sounds resolved."
    ],
    commonMistakes: [
      "Playing every note with the same weight.",
      "Missing the notes that define the chord."
    ],
    bestFor: "All levels learning phrasing and resolution."
  },
  {
    id: "voice-leading",
    title: "Voice Leading",
    shortDescription: "Smooth movement between chords using the smallest practical note changes.",
    theory:
      "Good voice leading connects one chord to the next by moving to the nearest useful chord tone. That often means stepwise motion or very small skips rather than restarting a shape from scratch.",
    fullDescription:
      "Voice leading is what makes a line sound connected instead of fragmented. It is one of the fastest ways to make generated jazz material feel more musical.",
    practiceTip: "Favor small movements and listen for continuity more than flash.",
    howToPractice: [
      "Track the nearest chord tones from one measure to the next.",
      "Avoid unnecessary jumps when a step or small skip will work.",
      "Sing the line to test whether it feels connected."
    ],
    commonMistakes: [
      "Jumping too much between notes.",
      "Thinking of each chord as a separate island."
    ],
    bestFor: "Intermediate and advanced players refining harmonic flow."
  },
  {
    id: "bebop-lines",
    title: "Bebop Lines",
    shortDescription: "Lines that combine chord tones, passing notes, and chromatic approaches.",
    theory:
      "Bebop language uses passing notes and chromatic approaches to create forward motion, but the important chord tones still tend to land clearly on strong beats.",
    fullDescription:
      "These lines sound fluid because tension notes are used directionally, not randomly. The goal is not just speed but hearing why each passing tone works.",
    practiceTip: "Identify where the line resolves before you worry about speed.",
    howToPractice: [
      "Find the chord tones inside the line first.",
      "Notice which chromatic notes are leading into stronger notes.",
      "Keep the pulse steady and the phrasing even."
    ],
    commonMistakes: [
      "Playing too fast without understanding the line.",
      "Treating chromatic notes as decoration instead of direction."
    ],
    bestFor: "Intermediate to advanced players building vocabulary."
  },
  {
    id: "motif-development",
    title: "Motif Development",
    shortDescription: "Repeating and varying a small musical idea.",
    theory:
      "A motif is a short melodic idea. Jazz improvisers develop motifs by repeating them, moving them to a new chord, or changing the rhythm while keeping the core shape recognizable.",
    fullDescription:
      "Motif work builds coherence. Instead of generating a stream of unrelated notes, you learn to shape a phrase that sounds intentional from start to finish.",
    practiceTip: "Change only one thing at a time so the original idea stays recognizable.",
    howToPractice: [
      "Identify the opening idea before you start varying it.",
      "Repeat it once exactly, then alter pitch or rhythm slightly.",
      "Check that the variation still sounds related."
    ],
    commonMistakes: [
      "Changing too much and losing the motif.",
      "Never repeating the idea enough for it to register."
    ],
    bestFor: "Intermediate and advanced players working on coherence."
  },
  {
    id: "call-response",
    title: "Call and Response",
    shortDescription: "A musical conversation between phrases.",
    theory:
      "This idea comes from vocal, blues, and jazz traditions. One phrase makes a statement and the next phrase answers it, often by echoing the rhythm or contour with a different ending.",
    fullDescription:
      "Call and response helps you build phrasing, pacing, and space. It teaches you to let one phrase set up the next instead of constantly filling every beat.",
    practiceTip: "Leave enough space between phrases to hear the answer clearly.",
    howToPractice: [
      "Play the call phrase clearly and stop for a moment.",
      "Make the response related, not identical.",
      "Use the response to complete or contrast the call."
    ],
    commonMistakes: [
      "Playing unrelated phrases.",
      "Not leaving enough space to hear the exchange."
    ],
    bestFor: "All levels, especially players working on phrasing."
  }
];

const difficultyGuidance: HelpEntry[] = [
  {
    id: "beginner",
    title: "Beginner",
    shortDescription: "Focus on hearing the chord change clearly and keeping the line singable.",
    fullDescription: "Beginner settings reduce rhythmic complexity and keep the harmonic idea obvious. Stay slow enough to hear the progression and aim for clean resolution more than variety."
  },
  {
    id: "intermediate",
    title: "Intermediate",
    shortDescription: "Add more motion, more direction, and more responsibility for phrasing.",
    fullDescription: "Intermediate settings ask you to connect the harmony more fluently, handle longer phrases, and hear stronger voice leading across several measures."
  },
  {
    id: "advanced",
    title: "Advanced",
    shortDescription: "Expect denser rhythmic flow, more chromatic detail, and less hand-holding.",
    fullDescription: "Advanced settings are best when the harmony is already comfortable. The goal is still clarity, not speed for its own sake."
  }
];

export const jazzHelp = {
  intro,
  modes,
  difficultyGuidance,
  practiceAdvice: {
    title: "How to Practice Jazz Effectively",
    items: [
      "Practice slowly. Speed hides harmonic mistakes.",
      "Stay in one key long enough to understand how it feels.",
      "Listen to how notes relate to chords, not just whether the fingering works.",
      "Repeat short sections instead of always starting from the top.",
      "Try singing guide tones or target tones before you play them."
    ]
  },
  commonMistakes: {
    title: "Common Mistakes",
    items: [
      "Treating jazz lines like scales instead of harmonic lines.",
      "Playing every note with equal importance.",
      "Going too fast too early.",
      "Ignoring harmonic movement between measures.",
      "Skipping simpler concepts like guide tones because they seem too basic."
    ]
  }
};

export const jazzHelpByMode = Object.fromEntries(modes.map((entry) => [entry.id, entry])) as Record<JazzMode, HelpEntry & { id: JazzMode }>;