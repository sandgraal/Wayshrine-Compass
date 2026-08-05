import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-url";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { PlatformProvider } from "@/components/platform-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getDb } from "@/lib/data";

// Type stack: a geometric display face for headings, a humanist sans for body
// copy at data density, and a technical mono for patch codes and entity ids —
// the mono accent is part of the "patch database" identity.
const displayFont = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const bodyFont = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Wayshrine Compass — patch-verified ESO builds",
    template: "%s · Wayshrine Compass",
  },
  description:
    "A patch-versioned Elder Scrolls Online database with a guidance layer. Every build proves how current it is.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const db = await getDb();
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-rune-field">
        {/* Keyboard users land here first; hidden until focused. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:border focus:border-border focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:text-foreground"
        >
          Skip to content
        </a>
        <PlatformProvider>
          <SiteHeader currentPatch={db.currentPatch} />
          <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
            {children}
          </main>
          <SiteFooter currentPatch={db.currentPatch} source={db.source} />
        </PlatformProvider>
      </body>
    </html>
  );
}
