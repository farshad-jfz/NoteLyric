import type { HelpEntry } from "@/content/help/types";

const intro: HelpEntry = {
  id: "guided-daily-practice-intro",
  title: "What is Guided Daily Practice?",
  shortDescription: "A structured session that combines technique, harmony, and musical work without making you choose every exercise manually.",
  fullDescription:
    "Guided Daily Practice creates a balanced daily session based on your level, range, and session settings. It reduces decision fatigue and keeps the practice moving from simple setup work toward more musical application.",
  practiceTip: "Use it as your default daily routine when you want a complete session instead of picking one mode at a time."
};

const topics: HelpEntry[] = [
  {
    id: "session-structure",
    title: "Session Structure",
    shortDescription: "Each session moves from setup work into harmony, jazz focus, and musical application.",
    fullDescription: "The order is intentional. You begin with simpler work that establishes the key and the instrument, then move toward harmony, language, and creative use so the session feels connected instead of random.",
    howToPractice: [
      "Warm-up: get comfortable with the instrument and session key.",
      "Harmony: reinforce chord movement and harmonic hearing.",
      "Jazz focus: work one specific concept such as guide tones or voice leading.",
      "Creative step: turn the written idea into something more musical and personal.",
      "Reading: improve notation fluency when it appears in the session."
    ]
  },
  {
    id: "why-this-works",
    title: "Why This Works",
    shortDescription: "The session follows a progression from notes, to chords, to connected musical ideas.",
    fullDescription: "Effective practice usually works best when technique supports harmony and harmony supports phrasing. Guided Daily Practice mirrors that path so you are not jumping randomly between unrelated tasks.",
    practiceTip: "Stay with the session order unless you have a specific reason to skip ahead."
  },
  {
    id: "session-length",
    title: "Session Length",
    shortDescription: "Short, standard, and extended sessions change how much repetition and development you get.",
    fullDescription: "Short sessions keep the routine compact. Standard sessions balance coverage and repetition. Extended sessions give you more room to revisit ideas and spend longer on musical application.",
    howToPractice: [
      "Short: use when time is limited and you still want a balanced routine.",
      "Standard: use as your default daily session length.",
      "Extended: use when you want more repetition or more creative work in the same key."
    ]
  },
  {
    id: "difficulty",
    title: "Difficulty",
    shortDescription: "Difficulty changes how complex the rhythm, harmonic motion, and jazz language become.",
    fullDescription: "Beginner sessions keep the ideas clearer and more singable. Intermediate sessions ask for stronger control and longer phrases. Advanced sessions assume the basics are already comfortable and add more independence and detail.",
    howToPractice: [
      "Beginner: aim for clarity and accurate hearing first.",
      "Intermediate: focus on smooth connection and phrasing.",
      "Advanced: focus on control, direction, and musical shape under denser material."
    ]
  },
  {
    id: "how-to-use",
    title: "How to Use It",
    shortDescription: "Follow the order, stay in the session key, and resume later if needed.",
    fullDescription: "The session is designed to be resumed within the same day, so you can stop and return without losing the structure. Completing or skipping steps keeps the workflow moving instead of trapping you on one item.",
    howToPractice: [
      "Start from the first step and move forward in order.",
      "Stay in the session key so the ideas reinforce each other.",
      "Mark steps complete or skip when you are ready to move on.",
      "Resume later the same day if you need to break the session up."
    ]
  },
  {
    id: "when-to-use",
    title: "When to Use Guided Practice",
    shortDescription: "Use Guided Daily Practice for structure and individual Jazz modes for focused repetition.",
    fullDescription: "A good default is to start with Guided Daily Practice, then spend extra time in one direct mode afterward if a concept needs more repetition.",
    bestFor: "Players who want a complete daily routine with less decision fatigue."
  }
];

export const dailyPracticeHelp = {
  intro,
  topics
};