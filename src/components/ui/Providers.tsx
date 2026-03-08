"use client";

import { MantineProvider, createTheme } from "@mantine/core";
import type { ReactNode } from "react";

const theme = createTheme({
  primaryColor: "teal",
  defaultRadius: "md",
  fontFamily: "Inter, Segoe UI, sans-serif",
  headings: { fontFamily: "Inter, Segoe UI, sans-serif" }
});

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      {children}
    </MantineProvider>
  );
}
