import { notFound } from "next/navigation";

import JazzModePracticePage from "@/components/JazzModePracticePage";
import { JAZZ_MODE_OPTIONS, type JazzMode } from "@/lib/music/jazz";

const validModes = new Set(JAZZ_MODE_OPTIONS.map((mode) => mode.value));

export default async function JazzModePage({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  if (!validModes.has(mode as JazzMode)) {
    notFound();
  }

  return <JazzModePracticePage initialMode={mode as JazzMode} />;
}
