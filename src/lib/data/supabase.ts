import { createClient } from "@supabase/supabase-js";
import type { DbData } from "./core";
import {
  rowToBuild,
  rowToCompanion,
  rowToCpStar,
  rowToFood,
  rowToMundus,
  rowToPatch,
  rowToSet,
  rowToSkill,
  rowToZone,
} from "./supabase-map";

export function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

function client() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}

async function all(table: string): Promise<Record<string, unknown>[]> {
  const { data, error } = await client().from(table).select("*").limit(2000);
  if (error) throw new Error(`supabase ${table}: ${error.message}`);
  return data ?? [];
}

/** Fetches the full entity database from Supabase. Dataset is small (~250 rows). */
export async function fetchDbFromSupabase(): Promise<DbData> {
  const [patches, sets, skills, cpStars, companions, zones, mundus, foods, builds] =
    await Promise.all([
      all("patches"),
      all("sets"),
      all("skills"),
      all("cp_stars"),
      all("companions"),
      all("zones"),
      all("mundus_stones"),
      all("foods"),
      all("builds"),
    ]);

  return {
    source: "supabase",
    patches: patches.map(rowToPatch),
    sets: sets.map(rowToSet),
    skills: skills.map(rowToSkill),
    cpStars: cpStars.map(rowToCpStar),
    companions: companions.map(rowToCompanion),
    zones: zones.map(rowToZone),
    mundusStones: mundus.map(rowToMundus),
    foods: foods.map(rowToFood),
    builds: builds.map(rowToBuild),
  };
}
