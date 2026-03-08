import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Chromatic Harmonica Practice",
  description: "Browser-first notation trainer for scales, arpeggios, and sight reading"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <h1>Chromatic Harmonica Practice</h1>
          <nav>
            <Link href="/">Home</Link>
            <Link href="/scales">Scales</Link>
            <Link href="/chords">Chords / Arpeggios</Link>
            <Link href="/sight-reading">Sight Reading</Link>
          </nav>
        </header>
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}
