import Link from "next/link";

export default function HomePage() {
  return (
    <article>
      <header>
        <h2>Welcome to NoteLyric</h2>
        <p>Practice Harmonically</p>
      </header>
      <p>Generate readable harmonica exercises for scales, chords/arpeggios, and sight-reading directly in your browser.</p>
      <div className="button-row">
        <Link href="/scales" role="button">
          Open Scales
        </Link>
        <Link href="/chords" role="button" className="secondary">
          Open Chords / Arpeggios
        </Link>
        <Link href="/sight-reading" role="button" className="contrast">
          Open Sight Reading
        </Link>
      </div>
    </article>
  );
}
