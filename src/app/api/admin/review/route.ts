import { NextResponse } from "next/server";
import { canPersist, markBuildReviewed, ReviewConflictError } from "@/lib/ingest/persist";
import { getDb, invalidateDbCache } from "@/lib/data";

/**
 * Admin review endpoint. POST `{ buildId | slug, patch }` with
 * `Authorization: Bearer $ADMIN_SECRET` after a human has re-checked a build
 * against the current patch. Re-stamps the build's own patch_verified and
 * clears its ingest flags — never entity tables, so freshness stays computed
 * from provenance and the build goes amber again the moment something it
 * references changes.
 *
 * Refuses (409) when the active read source is seed — re-stamping the live
 * row based on seed-computed freshness would "verify" against data nobody
 * looked at — and when the requested patch isn't the current patch, so a
 * review queued before an ingest can't silently verify against the new patch.
 */
export async function POST(request: Request) {
  // Fail closed: without a configured secret this endpoint accepts nothing.
  // A missing secret must never mean "open to everyone" on a route that can
  // perform service-role writes.
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "ADMIN_SECRET is not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { buildId, slug, patch } = (body ?? {}) as {
    buildId?: unknown;
    slug?: unknown;
    patch?: unknown;
  };
  if (typeof patch !== "string" || !patch) {
    return NextResponse.json({ error: "patch is required" }, { status: 400 });
  }
  // Exactly one identifier: with both, an OR lookup would silently pick
  // whichever build the iteration order favors when they disagree.
  if ((typeof buildId === "string") === (typeof slug === "string")) {
    return NextResponse.json({ error: "exactly one of buildId or slug is required" }, { status: 400 });
  }

  // Fresh read: the in-process cache is per function instance, and re-stamping
  // a build based on a five-minute-old view of it would clear flags the
  // reviewer never saw.
  const db = await getDb({ fresh: true });
  const build = db.builds.find((b) =>
    typeof buildId === "string" ? b.id === buildId : b.slug === slug
  );
  if (!build) {
    return NextResponse.json({ error: "build not found" }, { status: 404 });
  }

  if (patch !== db.currentPatch) {
    return NextResponse.json(
      { error: `patch mismatch: current patch is ${db.currentPatch}, refusing to verify for ${patch}` },
      { status: 409 }
    );
  }
  if (!canPersist(db)) {
    return NextResponse.json(
      { error: "read source is seed (or persistence is not configured); refusing to re-stamp live data" },
      { status: 409 }
    );
  }

  try {
    // Compare-and-swap against the stored flags from this request's fresh
    // read, so a concurrent ingest re-flagging the build makes this fail
    // instead of silently verifying changes nobody reviewed.
    await markBuildReviewed(build.id, patch, build.needsReviewReasons);
  } catch (err) {
    if (err instanceof ReviewConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
  invalidateDbCache();

  return NextResponse.json({ ok: true, buildId: build.id, slug: build.slug, patchVerified: patch });
}
