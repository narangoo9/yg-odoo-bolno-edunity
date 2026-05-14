"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { Toaster } from "@/components/ui/toaster";
import { PersistentMiniPlayer } from "@/components/course/PersistentMiniPlayer";
import type { ReactNode } from "react";

export function AppProviders({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <SessionProvider session={session} refetchInterval={0} refetchOnWindowFocus={false}>
        <LanguageProvider>
          {children}
          <PersistentMiniPlayer />
          <Toaster />
        </LanguageProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
