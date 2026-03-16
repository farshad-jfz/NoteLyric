import Link from "next/link";
import { IconArrowRight, IconMusic, IconSparkles } from "@tabler/icons-react";

import PageHeader from "@/components/ui/PageHeader";
import PracticeCard from "@/components/ui/PracticeCard";
import SectionCard from "@/components/ui/SectionCard";
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
        description="This is where the app shifts from drills into musical language. Start with Guided Daily Practice if you want a full session, or open a single mode when you want focused repetition."
        actions={
          <Link href="/jazz/guided-practice" className="button button--primary">
            <IconSparkles size={16} />
            Start Daily Practice
          </Link>
        }
      />

      <div className="jazz-grid">
        <PracticeCard
          title="Guided Daily Practice"
          description="A structured 20 minute jazz session with warm-up, harmony, guide tones, language, and creative work in one coherent key."
          href="/jazz/guided-practice"
          actionLabel="Start"
          tone="accent"
          icon={<IconSparkles size={22} />}
        />

        <SectionCard title="Direct Jazz Modes" description="Open one mode when you want to repeat a single concept without the full guided flow.">
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
                <div className="meta-row">
                  <span className="chip">Explanation</span>
                  <span className="chip">Generator</span>
                  <span className="chip">Score output</span>
                </div>
              </PracticeCard>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="How to Use Jazz Practice" description="Practice slowly, stay in the score, and let the harmonic logic lead the repetition.">
          <ul className="guidance-list">
            <li>Start with Guided Daily Practice if you want the app to decide what to work on next.</li>
            <li>Use one direct mode when you want to stay with the same idea across several regenerations.</li>
            <li>Keep the range realistic. The generator is stronger when it is not forced into impossible note choices.</li>
            <li>Use the same key for several runs before moving on to another key.</li>
          </ul>
          <Link href="/about" className="button button--ghost">
            Practice guide
            <IconArrowRight size={16} />
          </Link>
        </SectionCard>
      </div>
    </>
  );
}
