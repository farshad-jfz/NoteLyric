import Link from "next/link";

import HelpAccordion from "@/components/help/HelpAccordion";
import HelpSection from "@/components/help/HelpSection";
import PageHeader from "@/components/ui/PageHeader";
import { dailyPracticeHelp } from "@/content/help/dailyPracticeHelp";
import { jazzHelp } from "@/content/help/jazzHelp";

export default function HelpPage() {
  return (
    <>
      <PageHeader
        eyebrow="Help"
        title="Jazz and Guided Practice Help"
        description="Short help stays close to the practice flow, and this page gives you the deeper explanations when you want to understand the concepts and practice them more intentionally."
      />

      <div className="help-page-layout">
        <HelpSection id="jazz-practice" title={jazzHelp.intro.title} description={jazzHelp.intro.shortDescription}>
          <div className="help-stack">
            <p className="help-copy">{jazzHelp.intro.fullDescription}</p>
            <p className="help-tip-line">Practice tip: {jazzHelp.intro.practiceTip}</p>
          </div>
        </HelpSection>

        <HelpSection id="jazz-modes" title="Jazz Modes" description="Each mode trains one part of jazz hearing, phrasing, or harmonic control.">
          <HelpAccordion items={jazzHelp.modes} />
        </HelpSection>

        <HelpSection title="Difficulty Guidance" description="Choose the level that still lets you hear the harmony clearly.">
          <div className="help-card-grid">
            {jazzHelp.difficultyGuidance.map((entry) => (
              <article key={entry.id} className="help-mini-card">
                <h3>{entry.title}</h3>
                <p>{entry.shortDescription}</p>
                {entry.fullDescription ? <p className="help-copy">{entry.fullDescription}</p> : null}
              </article>
            ))}
          </div>
        </HelpSection>

        <HelpSection id="guided-daily-practice" title={dailyPracticeHelp.intro.title} description={dailyPracticeHelp.intro.shortDescription}>
          <div className="help-stack">
            <p className="help-copy">{dailyPracticeHelp.intro.fullDescription}</p>
            <p className="help-tip-line">Practice tip: {dailyPracticeHelp.intro.practiceTip}</p>
          </div>
        </HelpSection>

        <HelpSection title="Guided Daily Practice Topics" description="Use this when you want the app to structure the session for you.">
          <HelpAccordion items={dailyPracticeHelp.topics} />
        </HelpSection>

        <HelpSection id="practice-tips" title={jazzHelp.practiceAdvice.title} description="These habits matter more than squeezing in one more regeneration.">
          <ul className="help-list">
            {jazzHelp.practiceAdvice.items.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </HelpSection>

        <HelpSection id="common-mistakes" title={jazzHelp.commonMistakes.title} description="These are the mistakes that usually make the music feel less clear even when the notes are technically correct.">
          <ul className="help-list">
            {jazzHelp.commonMistakes.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="button-row">
            <Link href="/jazz" className="button button--ghost">
              Open Jazz Practice
            </Link>
            <Link href="/jazz/guided-practice" className="button button--primary">
              Open Guided Daily Practice
            </Link>
          </div>
        </HelpSection>
      </div>
    </>
  );
}