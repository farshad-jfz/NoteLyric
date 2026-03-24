import Link from "next/link";

import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="About NoteLyric"
        description="NoteLyric is built as a practice companion for chromatic harmonica. The goal is not to overwhelm you with options, but to keep generation musical, readable, and easy to repeat."
      />

      <div className="settings-grid">
        <SectionCard title="About the App" description="A calm, score-first workspace for daily practice.">
          <p className="page-header__description">The app focuses on technique, sight reading, jazz harmony, and guided daily practice. It is designed to feel like a small music workstation rather than a random exercise generator.</p>
        </SectionCard>

        <SectionCard title="Practice Guide" description="A simple way to get value from the app quickly.">
          <ul className="about-list">
            <li>Start with Guided Daily Practice if you want the app to choose a balanced session for you.</li>
            <li>Use the Practice section when you want direct control over scales, chords, or reading.</li>
            <li>Use the Jazz section when you want a specific improvisation concept and repeated regeneration.</li>
            <li>Practice slowly first. The score should stay readable and relaxed before you speed anything up.</li>
            <li>Save strong outputs into Library so you can revisit them across sessions.</li>
          </ul>
        </SectionCard>

        <SectionCard title="Help and Learning" description="Layered help for Jazz Practice and Guided Daily Practice.">
          <p className="page-header__description">The app now includes compact inline help on jazz exercise pages, section-level guidance on the Jazz and Guided Practice screens, and a full reference page when you want deeper explanations.</p>
          <div className="button-row">
            <Link href="/help" className="button button--ghost">
              Open help center
            </Link>
          </div>
        </SectionCard>

        <SectionCard title="Credits and License" description="Built for harmonica study, rendered in the browser, and designed for repeatable daily use.">
          <ul className="about-list">
            <li>Browser-based notation rendering via OpenSheetMusicDisplay.</li>
            <li>Local-first persistence for settings, saved exercises, and practice history.</li>
            <li>Open source project under the repository license.</li>
          </ul>
        </SectionCard>
      </div>
    </>
  );
}