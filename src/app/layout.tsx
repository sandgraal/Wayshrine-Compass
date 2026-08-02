import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Compass } from "lucide-react";
import "./globals.css";
import { PlatformToggle } from "@/components/platform-toggle";
import { getPlatform } from "@/lib/platform-server";
import { db } from "@/lib/data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Wayshrine Compass — patch-verified ESO builds",
    template: "%s · Wayshrine Compass",
  },
  description:
    "A patch-versioned Elder Scrolls Online database with a guidance layer. Every build proves how current it is.",
};

const NAV = [
  { href: "/builds", label: "Builds" },
  { href: "/what-next", label: "What Next" },
  { href: "/planner", label: "Planner" },
  { href: "/sets", label: "Sets" },
  { href: "/skills", label: "Skills" },
];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const platform = await getPlatform();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
              <Compass className="size-5" />
              <span className="hidden sm:inline">Wayshrine Compass</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground md:inline">
                {db.currentPatch}
              </span>
              <PlatformToggle platform={platform} />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
          <p>
            Wayshrine Compass is an unofficial fan resource. The Elder Scrolls Online © ZeniMax Media.
            All guidance is original and derived from our patch-versioned database — currently {db.currentPatch}.
          </p>
        </footer>
      </body>
    </html>
  );
}
