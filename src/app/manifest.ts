import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wayshrine Compass",
    short_name: "Wayshrine",
    description:
      "A patch-versioned Elder Scrolls Online database with a guidance layer. Every build proves how current it is.",
    start_url: "/",
    display: "standalone",
    // Carved-stone dark background with the gold brand accent.
    background_color: "#0f1420",
    theme_color: "#0f1420",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
