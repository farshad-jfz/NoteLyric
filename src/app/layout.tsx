import "./globals.css";
import type { ReactNode } from "react";

import "@mantine/core/styles.css";
import AppChrome from "@/components/ui/AppChrome";
import Providers from "@/components/ui/Providers";

export const metadata = {
  title: "NoteLyric",
  description: "Practice Harmonically"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppChrome>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  );
}
