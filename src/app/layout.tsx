import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PlatformProvider } from "@/components/platform-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getDb } from "@/lib/data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000")
  ),
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-rune-field">
        <PlatformProvider>
          <SiteHeader currentPatch={db.currentPatch} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
          <SiteFooter currentPatch={db.currentPatch} source={db.source} />
        </PlatformProvider>
      </body>
    </html>
  );
}
