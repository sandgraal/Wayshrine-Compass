import { builds } from "@/data/builds";
import { sets } from "@/data/sets";
import { skills } from "@/data/skills";
import { cpStars } from "@/data/cpStars";
import { companions } from "@/data/companions";
import { mundusStones } from "@/data/mundus";
import { foods } from "@/data/food";
import { zones } from "@/data/zones";
import { patches } from "@/data/patches";
import { buildDb, type Db } from "./core";
import { fetchDbFromSupabase, supabaseConfigured } from "./supabase";

export type { Db };

/**
 * Data access layer. When Supabase env vars are present, `getDb()` serves the
 * live database (cached in-process for CACHE_TTL_MS); otherwise it falls back
 * to the committed seed dataset. Both paths build the identical facade via
 * buildDb(), so pages and engines don't know the difference. All entity and
 * content storage is queryable structure either way — no markdown files.
 */

const seedDb = buildDb({
  source: "seed",
  patches,
  sets,
  skills,
  cpStars,
  companions,
  mundusStones,
  foods,
  zones,
  builds,
});

/** Synchronous seed-backed facade. Client components and tests use this. */
export const db = seedDb;

const CACHE_TTL_MS = 5 * 60 * 1000;
let cached: { db: Db; at: number } | null = null;

/** Async facade for server components and routes: Supabase when configured. */
export async function getDb(): Promise<Db> {
  if (!supabaseConfigured()) return seedDb;
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.db;
  try {
    const data = await fetchDbFromSupabase();
    cached = { db: buildDb(data), at: Date.now() };
    return cached.db;
  } catch (err) {
    // A database outage must never take the site down — serve seed data.
    console.error("supabase fetch failed; falling back to seed data:", err);
    return cached?.db ?? seedDb;
  }
}
