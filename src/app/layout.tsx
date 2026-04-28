import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ELearn — Онлайн Сургалтын Платформ", template: "%s | ELearn" },
  description:
    "Мэдлэгийг дэлгэрүүл. Ур чадвараа нэмэгдүүл. ELearn дээр хичээллэ.",
  keywords: ["online learning", "e-learning", "courses", "Mongolia", "сургалт"],
  openGraph: { type: "website", locale: "mn_MN" },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
