import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Acceptance tests for the admin review endpoint: auth must fail closed, and
 * the re-stamp must refuse to run against seed-sourced reads or a non-current
 * patch. Persistence and the data layer are mocked — these tests cover the
 * route's gatekeeping, not Supabase.
 */

const mocks = vi.hoisted(() => ({
  canPersist: vi.fn(),
  markBuildReviewed: vi.fn(),
  getDb: vi.fn(),
  invalidateDbCache: vi.fn(),
}));

vi.mock("@/lib/ingest/persist", () => {
  class ReviewConflictError extends Error {}
  return {
    canPersist: mocks.canPersist,
    markBuildReviewed: mocks.markBuildReviewed,
    ReviewConflictError,
  };
});
vi.mock("@/lib/data", () => ({
  getDb: mocks.getDb,
  invalidateDbCache: mocks.invalidateDbCache,
}));

import { POST } from "./route";
import { ReviewConflictError } from "@/lib/ingest/persist";

const SECRET = "test-admin-secret";

function post(body: unknown, token?: string): Request {
  return new Request("http://localhost/api/admin/review", {
    method: "POST",
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const fakeDb = {
  source: "supabase",
  currentPatch: "U50",
  builds: [
    { id: "build-sorcerer-dps", slug: "sorcerer-dps", needsReviewReasons: [{ entityId: "skill-x" }] },
    { id: "build-warden-dps", slug: "warden-dps", needsReviewReasons: [] },
  ],
};

beforeEach(() => {
  vi.stubEnv("ADMIN_SECRET", SECRET);
  mocks.getDb.mockResolvedValue(fakeDb);
  mocks.canPersist.mockReturnValue(true);
  mocks.markBuildReviewed.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("POST /api/admin/review auth", () => {
  it("fails closed with 503 when ADMIN_SECRET is not configured", async () => {
    vi.stubEnv("ADMIN_SECRET", "");
    const res = await POST(post({ slug: "sorcerer-dps", patch: "U50" }, SECRET));
    expect(res.status).toBe(503);
    expect(mocks.markBuildReviewed).not.toHaveBeenCalled();
  });

  it("rejects a missing bearer token with 401", async () => {
    const res = await POST(post({ slug: "sorcerer-dps", patch: "U50" }));
    expect(res.status).toBe(401);
    expect(mocks.markBuildReviewed).not.toHaveBeenCalled();
  });

  it("rejects a wrong bearer token with 401", async () => {
    const res = await POST(post({ slug: "sorcerer-dps", patch: "U50" }, "wrong"));
    expect(res.status).toBe(401);
    expect(mocks.markBuildReviewed).not.toHaveBeenCalled();
  });
});

describe("POST /api/admin/review validation", () => {
  it("rejects a non-JSON body with 400", async () => {
    const res = await POST(post("not json", SECRET));
    expect(res.status).toBe(400);
  });

  it("rejects a body without patch with 400", async () => {
    const res = await POST(post({ slug: "sorcerer-dps" }, SECRET));
    expect(res.status).toBe(400);
  });

  it("rejects a body without buildId or slug with 400", async () => {
    const res = await POST(post({ patch: "U50" }, SECRET));
    expect(res.status).toBe(400);
  });

  it("rejects a body with both buildId and slug with 400 (ambiguous target)", async () => {
    const res = await POST(
      post({ buildId: "build-sorcerer-dps", slug: "warden-dps", patch: "U50" }, SECRET)
    );
    expect(res.status).toBe(400);
    expect(mocks.markBuildReviewed).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown build", async () => {
    const res = await POST(post({ slug: "no-such-build", patch: "U50" }, SECRET));
    expect(res.status).toBe(404);
    expect(mocks.markBuildReviewed).not.toHaveBeenCalled();
  });
});

describe("POST /api/admin/review refusal paths", () => {
  it("refuses with 409 when the requested patch is not the current patch", async () => {
    const res = await POST(post({ slug: "sorcerer-dps", patch: "U49" }, SECRET));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toContain("U50");
    expect(mocks.markBuildReviewed).not.toHaveBeenCalled();
  });

  it("refuses with 409 when the active read source cannot be persisted against", async () => {
    mocks.canPersist.mockReturnValue(false);
    const res = await POST(post({ slug: "sorcerer-dps", patch: "U50" }, SECRET));
    expect(res.status).toBe(409);
    expect(mocks.markBuildReviewed).not.toHaveBeenCalled();
  });

  it("returns 409 when the build row changed since it was loaded (CAS conflict)", async () => {
    mocks.markBuildReviewed.mockRejectedValue(new ReviewConflictError("build changed"));
    const res = await POST(post({ slug: "sorcerer-dps", patch: "U50" }, SECRET));
    expect(res.status).toBe(409);
    expect(mocks.invalidateDbCache).not.toHaveBeenCalled();
  });
});

describe("POST /api/admin/review success", () => {
  it("re-stamps by slug and invalidates the read cache", async () => {
    const res = await POST(post({ slug: "warden-dps", patch: "U50" }, SECRET));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      buildId: "build-warden-dps",
      slug: "warden-dps",
      patchVerified: "U50",
    });
    expect(mocks.markBuildReviewed).toHaveBeenCalledWith("build-warden-dps", "U50", []);
    expect(mocks.invalidateDbCache).toHaveBeenCalled();
  });

  it("re-stamps by buildId, passing the stored flags for the compare-and-swap", async () => {
    const res = await POST(post({ buildId: "build-sorcerer-dps", patch: "U50" }, SECRET));
    expect(res.status).toBe(200);
    expect(mocks.markBuildReviewed).toHaveBeenCalledWith("build-sorcerer-dps", "U50", [
      { entityId: "skill-x" },
    ]);
  });

  it("reads the database fresh, bypassing the per-instance cache", async () => {
    await POST(post({ slug: "sorcerer-dps", patch: "U50" }, SECRET));
    expect(mocks.getDb).toHaveBeenCalledWith({ fresh: true });
  });
});
