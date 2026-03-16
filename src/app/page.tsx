"use client";

import Link from "next/link";
import { IconClockHour4, IconHistory, IconMusic, IconSparkles } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

import type { LibraryEntry, PracticeSession } from "@/lib/app/types";
import { loadAppSettings, loadDailySession, loadLibraryState } from "@/lib/app/storage";
import { generatePracticeSession, getTodayDateKey } from "@/lib/guidedPractice/session";
import PageHeader from "@/components/ui/PageHeader";
import PracticeCard from "@/components/ui/PracticeCard";
import SectionCard from "@/components/ui/SectionCard";

export default function HomePage() {
  const [recentEntries, setRecentEntries] = useState<LibraryEntry[]>([]);
  const [todaySession, setTodaySession] = useState<PracticeSession | null>(null);

  useEffect(() => {
    const library = loadLibraryState();
    setRecentEntries(library.entries.slice(0, 3));

    try {
      const storedSession = loadDailySession();
      if (storedSession && storedSession.dateKey === getTodayDateKey()) {
        setTodaySession(storedSession);
        return;
      }

      setTodaySession(generatePracticeSession(loadAppSettings()));
    } catch {
      setTodaySession(null);
    }
  }, []);

  const sessionSummary = useMemo(() => {
    if (!todaySession) {
      return { key: "C", minutes: 21, difficulty: "Beginner" as const };
    }

    return {
      key: todaySession.key,
      minutes: todaySession.estimatedMinutes,
      difficulty: todaySession.difficulty
    };
  }, [todaySession]);

  return (
    <>
      <PageHeader
        eyebrow="Home"
        title="Practice Dashboard"
        description="Start with a guided daily session when you want a clear plan, or jump into a focused generator when you already know what to practice."
      />

      <section className="panel home-hero">
        <div>
          <p className="eyebrow">Today's focus</p>
          <h2 style={{ margin: 0, fontSize: "2rem" }}>Key of the day: {sessionSummary.key}</h2>
          <p className="page-header__description">
            Guided Practice keeps the same key across the session so technique, harmony, and jazz language reinforce one another.
          </p>
        </div>

        <div className="hero-actions">
          <Link href="/jazz/guided-practice" className="button button--primary">
            <IconSparkles size={18} />
            Start Daily Practice
          </Link>
          <Link href="/practice" className="button button--ghost">
            Quick Practice
          </Link>
        </div>

        <div className="home-hero__stats">
          <span className="chip">
            <IconClockHour4 size={16} />
            {sessionSummary.minutes} minutes
          </span>
          <span className="chip">
            <IconMusic size={16} />
            {sessionSummary.difficulty}
          </span>
          <span className="chip">
            <IconHistory size={16} />
            {recentEntries.length} recent exercises
          </span>
        </div>
      </section>

      <div className="dashboard-grid">
        <SectionCard
          title="Quick Practice"
          description="Jump straight into one mode when you want a tight repetition loop instead of a full session."
        >
          <div className="quick-practice-list">
            <PracticeCard
              title="Scales"
              description="Readable scale drills with range-aware defaults and export options."
              href="/practice/scales"
              actionLabel="Open scales"
            />
            <PracticeCard
              title="Chords / Arpeggios"
              description="Chord-tone practice built from the same score-first generator flow."
              href="/practice/chords"
              actionLabel="Open chords"
            />
            <PracticeCard
              title="Sight Reading"
              description="Fresh reading material with validated rhythm patterns and saved history."
              href="/practice/sight-reading"
              actionLabel="Open reading"
            />
            <PracticeCard
              title="Jazz"
              description="Go directly to guided practice or a specific jazz mode without digging through one long page."
              href="/jazz"
              actionLabel="Open jazz"
              tone="accent"
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Recent Exercises"
          description="Everything you generate can be reopened from the Library. These are the latest items in your local history."
        >
          {recentEntries.length ? (
            <div className="library-list">
              {recentEntries.map((entry) => (
                <Link key={entry.id} href="/library" className="listing-button">
                  <strong>{entry.title}</strong>
                  <small>
                    {entry.source} - {entry.exercise.timeSignature}
                  </small>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-state">
              No recent exercises yet. Generate your first score from Practice or Jazz and it will appear here.
            </p>
          )}
        </SectionCard>
      </div>
    </>
  );
}
