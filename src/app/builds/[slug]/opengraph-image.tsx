import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getDb } from "@/lib/data";
import { ogPortraitPath, portraitForBuild } from "@/lib/portraits";
import type { Freshness } from "@/lib/freshness";

/**
 * Share card for a build: portrait right, name/class/role left, patch pill and
 * live freshness state. Everything is read from disk — satori gets no network
 * and no WebP, hence the JPEG derivatives in public/chars-og and the vendored
 * assets in src/assets/og. Colors are hex equivalents of the globals.css oklch
 * tokens (satori understands neither oklch nor CSS variables).
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Build overview card";
export const revalidate = 300;

const C = {
  background: "#14171f",
  card: "#1c1f2a",
  border: "#3b4051",
  foreground: "#edece4",
  muted: "#a9a79a",
  primary: "#e6c26d",
  verified: "#3fbf7f",
  needsReview: "#e3ab41",
  stale: "#d24d41",
};

const FRESHNESS_LABEL: Record<Freshness["status"], (current: string) => string> = {
  verified: (current) => `Verified for ${current}`,
  needs_review: () => "Needs review",
  stale: () => "Stale",
};

const FRESHNESS_COLOR: Record<Freshness["status"], string> = {
  verified: C.verified,
  needs_review: C.needsReview,
  stale: C.stale,
};

async function asset(rel: string): Promise<string | null> {
  try {
    const buf = await readFile(path.join(process.cwd(), rel));
    const ext = path.extname(rel).slice(1);
    return `data:image/${ext === "jpg" ? "jpeg" : ext};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await getDb();
  const build = db.getBuild(slug);

  const semiBold = await readFile(path.join(process.cwd(), "src/assets/og/Geist-SemiBold.ttf"));
  const emblem = await asset("src/assets/og/emblem.png");

  const portrait = build ? portraitForBuild(build) : undefined;
  const portraitSrc = portrait ? await asset(ogPortraitPath(portrait)) : null;
  const freshness = build ? db.freshness(build) : null;

  const title = build?.name ?? "Wayshrine Compass";
  const subtitle = build
    ? `${build.className} · ${build.role} · ${build.contentType}`
    : "Patch-verified ESO builds";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: C.background,
          fontFamily: "Geist",
          position: "relative",
        }}
      >
        {/* Portrait, right third with fade into the background */}
        {portraitSrc && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: 460,
              height: 630,
              display: "flex",
            }}
          >
            <img
              src={portraitSrc}
              alt=""
              width={460}
              height={630}
              style={{ objectFit: "cover", objectPosition: "center 10%" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(90deg, ${C.background} 0%, rgba(20,23,31,0.25) 45%, rgba(20,23,31,0) 100%)`,
              }}
            />
          </div>
        )}

        {/* Copy block */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 26,
            padding: "0 80px",
            width: portraitSrc ? 780 : 1200,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                display: "flex",
                border: `2px solid ${C.primary}`,
                borderRadius: 10,
                color: C.primary,
                fontSize: 26,
                padding: "4px 16px",
              }}
            >
              {db.currentPatch}
            </div>
            {freshness && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border: `2px solid ${FRESHNESS_COLOR[freshness.status]}`,
                  borderRadius: 999,
                  color: FRESHNESS_COLOR[freshness.status],
                  fontSize: 26,
                  padding: "4px 18px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    backgroundColor: FRESHNESS_COLOR[freshness.status],
                  }}
                />
                {FRESHNESS_LABEL[freshness.status](db.currentPatch)}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              color: C.foreground,
              fontSize: 68,
              fontWeight: 600,
              lineHeight: 1.1,
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              color: C.muted,
              fontSize: 32,
              textTransform: "capitalize",
            }}
          >
            {subtitle}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 26 }}>
            {emblem && (
              <img
                src={emblem}
                alt=""
                width={52}
                height={52}
                style={{ borderRadius: 12 }}
              />
            )}
            <div style={{ display: "flex", color: C.primary, fontSize: 28, fontWeight: 600 }}>
              Wayshrine Compass
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Geist", data: semiBold, weight: 600, style: "normal" }],
    }
  );
}
