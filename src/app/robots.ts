import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // /patch-tracker is the public status surface; the operator console
        // and API routes have no business in a search index.
        disallow: ["/admin", "/api/"],
      },
    ],
  };
}
