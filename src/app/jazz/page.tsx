import Link from "next/link";
import { IconArrowRight, IconMusic, IconSparkles } from "@tabler/icons-react";

import HelpAccordion from "@/components/help/HelpAccordion";
import HelpInfoCard from "@/components/help/HelpInfoCard";
import PageHeader from "@/components/ui/PageHeader";
import PracticeCard from "@/components/ui/PracticeCard";
import SectionCard from "@/components/ui/SectionCard";
import { jazzHelp } from "@/content/help/jazzHelp";
import { JAZZ_MODE_OPTIONS } from "@/lib/music/jazz";

const MODE_DESCRIPTIONS: Record<string, string> = {
  "ii-v-i": "Practice the core jazz progression with clear harmonic motion.",
  "guide-tones": "Hear the 3rds and 7ths that define the changes.",
  "target-tones": "Resolve lines clearly on the strongest harmonic notes.",
  "bebop-lines": "Add passing tones and chromatic approach notes with control.",
  "voice-leading": "Move smoothly from chord to chord with minimal motion.",
  "motif-development": "Repeat and reshape a short idea into a coherent phrase.",
  "call-response": "Develop timing and phrasing through conversational ideas."
};

export default function JazzLandingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Jazz"
        title="Jazz Practice"
        description="Use Guided Daily Practice when you want a structured session, or open a single jazz mode when you want focused repetition around one harmonic idea."
        actions={
          <div className="button-row">
            <Link href="/jazz/guided-practice" className="button button--primary">
              <IconSparkles size={16} />
              Start Daily Practice
            </Link>
            <Link href="/help#jazz-practice" className="button button--ghost">
              Learn more
            </Link>
          </div>
        }
      />

      <HelpInfoCard
        title={jazzHelp.intro.title}
        shortDescription={jazzHelp.intro.shortDescription}
        practiceTip={jazzHelp.intro.practiceTip}
        collapsible
        fullDescription={jazzHelp.intro.fullDescription}
        detailsTitle="More about jazz practice"
        learnMoreHref="/help#jazz-practice"
      />

      <div className="jazz-grid">
        <SectionCard title="Choose a jazz path" accent>
          <div className="practice-workspace__summary">
            <div className="practice-workspace__summary-item">
              <span>Guided session</span>
              <strong>One coherent key across the whole workout</strong>
            </div>
            <div className="practice-workspace__summary-item">
              <span>Direct mode</span>
              <strong>Repeat one jazz concept with a score-first workspace</strong>
            </div>
            <div className="practice-workspace__summary-item">
              <span>Best first mode</span>
              <strong>Guide Tones for hearing harmony clearly</strong>
            </div>
          </div>
        </SectionCard>

        <PracticeCard
          title="Guided Daily Practice"
          description="A structured 20 minute jazz session with warm-up, harmony, guide tones, language, and creative work in one coherent key."
          href="/jazz/guided-practice"
          actionLabel="Start"
          tone="accent"
          icon={<IconSparkles size={22} />}
        />

        <SectionCard title="Direct jazz modes" description="Open one mode when you want to repeat a single concept without the full guided flow.">
          <div className="mode-list">
            {JAZZ_MODE_OPTIONS.map((mode) => (
              <PracticeCard
                key={mode.value}
                title={mode.label}
                description={MODE_DESCRIPTIONS[mode.value]}
                href={`/jazz/${mode.value}`}
                actionLabel="Open mode"
                icon={<IconMusic size={20} />}
              >
                <p className="muted">Inline help explains the concept, then the score and progression stay in one workspace.</p>
              </PracticeCard>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Learn each mode" description="Preview what each mode teaches before you open it.">
          <HelpAccordion items={jazzHelp.modes} />
          <div className="button-row">
            <Link href="/help#jazz-modes" className="button button--ghost">
              Open full jazz help
              <IconArrowRight size={16} />
            </Link>
          </div>
        </SectionCard>

        <SectionCard title={jazzHelp.practiceAdvice.title} description="A few reminders that keep the exercises musical.">
          <ul className="guidance-list">
            {jazzHelp.practiceAdvice.items.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </>
  );
}