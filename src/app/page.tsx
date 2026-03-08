import Link from "next/link";

export default function HomePage() {
  return (
    <section className="panel">
      <h2>Practice Generator</h2>
      <p>Choose a section to generate clean notation in your browser with no MuseScore dependency.</p>
      <div className="button-row">
        <Link href="/scales" className="link-button">
          Open Scales
        </Link>
        <Link href="/chords" className="link-button">
          Open Chords / Arpeggios
        </Link>
        <Link href="/sight-reading" className="link-button">
          Open Sight Reading
        </Link>
      </div>
    </section>
  );
}
