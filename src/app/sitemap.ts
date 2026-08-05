import type { MetadataRoute } from "next";
import { getDb } from "@/lib/data";
import { siteUrl } from "@/lib/site-url";

/**
 * Static routes plus every build detail page. Admin and API routes are
 * excluded (they are disallowed in robots.ts). The base URL comes from the
 * same siteUrl() helper the root metadataBase uses, so the two can't drift.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = await getDb();
  const base = siteUrl();

  const routes = [
    "",
    "/builds",
    "/what-next",
    "/planner",
    "/sets",
    "/skills",
    "/zones",
    "/patch-tracker",
  ];

  const staticEntries = routes.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const buildEntries = db.builds.map((b) => ({
    url: `${base}/builds/${b.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticEntries, ...buildEntries];
}
