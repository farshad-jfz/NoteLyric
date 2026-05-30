import type { ReactNode } from "react";

import { MetronomeProvider } from "@/components/metronome/MetronomeProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return <MetronomeProvider>{children}</MetronomeProvider>;
}
