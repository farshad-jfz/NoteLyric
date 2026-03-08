import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "NoteLyric",
  description: "Practice Harmonically"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header container-fluid">
          <div>
            <h1>NoteLyric</h1>
            <p className="slogan">Practice Harmonically</p>
          </div>
          <nav>
            <Link href="/">Home</Link>
            <Link href="/scales">Scales</Link>
            <Link href="/chords">Chords / Arpeggios</Link>
            <Link href="/sight-reading">Sight Reading</Link>
            <Link href="/about">About</Link>
          </nav>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
