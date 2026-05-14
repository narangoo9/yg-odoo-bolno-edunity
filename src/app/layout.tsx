import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppProviders } from "@/components/providers/AppProviders";
import { auth } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "EduNity — Онлайн Сургалтын Платформ", template: "%s | EduNity" },
  description:
    "Мэдлэгийг дэлгэрүүл. Ур чадвараа нэмэгдүүл. EduNity дээр хичээллэ.",
  keywords: ["online learning", "e-learning", "courses", "Mongolia", "сургалт", "EduNity"],
  openGraph: { type: "website", locale: "mn_MN" },
  icons: {
    icon: "/brand/logo-dark-mode-removebg-preview.png",
    shortcut: "/brand/logo-dark-mode-removebg-preview.png",
    apple: "/brand/logo-light-mode-removebg-preview.png",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth().catch(() => null);

  return (
    <html lang="mn" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AppProviders session={session}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
