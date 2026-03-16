import { IconArrowRight, IconBook2, IconMusic, IconNotes } from "@tabler/icons-react";

import PageHeader from "@/components/ui/PageHeader";
import PracticeCard from "@/components/ui/PracticeCard";
import SectionCard from "@/components/ui/SectionCard";

export default function PracticeLandingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Practice"
        title="Technique Practice"
        description="These are the focused, non-jazz generators for scales, chords, and reading. Each page now uses the same score-first workspace so you can stay in the material instead of relearning the interface."
      />

      <SectionCard title="Practice at a glance" accent>
        <div className="practice-workspace__summary">
          <div className="practice-workspace__summary-item">
            <span>Scales</span>
            <strong>Technique and note familiarity</strong>
          </div>
          <div className="practice-workspace__summary-item">
            <span>Chords</span>
            <strong>Chord tones and arpeggio control</strong>
          </div>
          <div className="practice-workspace__summary-item">
            <span>Sight reading</span>
            <strong>Fresh reading in a controlled range</strong>
          </div>
        </div>
      </SectionCard>

      <div className="practice-grid">
        <PracticeCard title="Scales" description="Practice scales in selected keys, directions, note values, and ranges." href="/practice/scales" actionLabel="Open scales" icon={<IconBook2 size={20} />} />
        <PracticeCard title="Chords / Arpeggios" description="Drill chord tones and arpeggio patterns with controlled range handling." href="/practice/chords" actionLabel="Open chords" icon={<IconMusic size={20} />} />
        <PracticeCard title="Sight Reading" description="Generate readable melodies with rhythm validation and controllable difficulty." href="/practice/sight-reading" actionLabel="Open sight reading" icon={<IconNotes size={20} />} />

        <SectionCard title="How to work here" description="Open one page, keep the settings small, and let the score stay central.">
          <ul className="guidance-list">
            <li>Use Quick mode when you want a fast practice loop.</li>
            <li>Use Advanced mode to narrow the range, rhythm, or labels before regenerating.</li>
            <li>Save the good outputs into Library so they are easy to revisit later.</li>
          </ul>
          <a href="/library" className="button button--ghost">
            Open Library
            <IconArrowRight size={16} />
          </a>
        </SectionCard>
      </div>
    </>
  );
}