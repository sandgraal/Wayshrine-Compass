import type {
  Build,
  ClassMasteryLine,
  CpStar,
  DiffReport,
  GearSet,
  Grimoire,
  PatchDataset,
  ScribingScript,
  Skill,
} from "@/lib/types";
import { affectedBuilds, diffDatasets } from "./diff";

/**
 * The ingestion pipeline, expressed as a pure state transition:
 *
 *   (current entity store, incoming patch dataset)
 *     → (updated store with provenance stamped, diff report, flagged builds)
 *
 * The scheduled job (Vercel cron → /api/ingest) feeds it the incoming dataset
 * and persists the result; tests feed it synthetic data.
 */

export interface EntityStore {
  sets: GearSet[];
  skills: Skill[];
  cpStars: CpStar[];
  grimoires: Grimoire[];
  scripts: ScribingScript[];
  classMasteryLines: ClassMasteryLine[];
}

export interface IngestResult {
  store: EntityStore;
  report: DiffReport;
  /** Builds now flagged for human review, with the exact reasons. */
  flagged: Build[];
}

/** Reconstructs the raw dataset view of the current store for diffing. */
export function storeAsDataset(store: EntityStore, patchCode: string): PatchDataset {
  return {
    patch: { id: `patch-${patchCode.toLowerCase()}`, code: patchCode, name: patchCode, releasedAt: "", season: null },
    sets: store.sets,
    skills: store.skills,
    cpStars: store.cpStars,
    grimoires: store.grimoires,
    scripts: store.scripts,
    classMasteryLines: store.classMasteryLines,
  };
}

export function runIngest(
  store: EntityStore,
  currentPatchCode: string,
  incoming: PatchDataset,
  builds: Build[]
): IngestResult {
  const report = diffDatasets(storeAsDataset(store, currentPatchCode), incoming);
  const changed = new Map(report.changes.map((c) => [`${c.entityType}:${c.entityId}`, c]));

  const stampPatch = incoming.patch.code;

  const nextSets: GearSet[] = incoming.sets.map((s) => {
    const prev = store.sets.find((p) => p.id === s.id);
    const change = changed.get(`set:${s.id}`);
    return {
      ...s,
      firstSeenPatch: prev?.firstSeenPatch ?? stampPatch,
      lastChangedPatch: change ? stampPatch : prev?.lastChangedPatch ?? stampPatch,
    };
  });

  const nextSkills: Skill[] = incoming.skills.map((s) => {
    const prev = store.skills.find((p) => p.id === s.id);
    const change = changed.get(`skill:${s.id}`);
    return {
      ...s,
      firstSeenPatch: prev?.firstSeenPatch ?? stampPatch,
      lastChangedPatch: change ? stampPatch : prev?.lastChangedPatch ?? stampPatch,
    };
  });

  const nextCpStars: CpStar[] = incoming.cpStars.map((s) => {
    const prev = store.cpStars.find((p) => p.id === s.id);
    const change = changed.get(`cp_star:${s.id}`);
    return {
      ...s,
      lastChangedPatch: change ? stampPatch : prev?.lastChangedPatch ?? stampPatch,
    };
  });

  const nextGrimoires: Grimoire[] = incoming.grimoires.map((g) => {
    const prev = store.grimoires.find((p) => p.id === g.id);
    const change = changed.get(`grimoire:${g.id}`);
    return {
      ...g,
      firstSeenPatch: prev?.firstSeenPatch ?? stampPatch,
      lastChangedPatch: change ? stampPatch : prev?.lastChangedPatch ?? stampPatch,
    };
  });

  const nextScripts: ScribingScript[] = incoming.scripts.map((s) => {
    const prev = store.scripts.find((p) => p.id === s.id);
    const change = changed.get(`script:${s.id}`);
    return {
      ...s,
      firstSeenPatch: prev?.firstSeenPatch ?? stampPatch,
      lastChangedPatch: change ? stampPatch : prev?.lastChangedPatch ?? stampPatch,
    };
  });

  const nextMasteryLines: ClassMasteryLine[] = incoming.classMasteryLines.map((m) => {
    const prev = store.classMasteryLines.find((p) => p.id === m.id);
    const change = changed.get(`mastery_line:${m.id}`);
    return {
      ...m,
      firstSeenPatch: prev?.firstSeenPatch ?? stampPatch,
      lastChangedPatch: change ? stampPatch : prev?.lastChangedPatch ?? stampPatch,
    };
  });

  const affected = affectedBuilds(report, builds);
  const affectedById = new Map(affected.map((a) => [a.buildId, a]));

  const flagged: Build[] = builds
    .filter((b) => affectedById.has(b.id))
    .map((b) => ({
      ...b,
      status: "needs_review" as const,
      needsReviewReasons: affectedById.get(b.id)!.changes.map((c) => ({
        entityType: c.entityType,
        entityId: c.entityId,
        entityName: c.entityName,
        patch: stampPatch,
        summary: `${c.entityName} ${c.kind === "changed" ? `changed in ${stampPatch} (${c.changedFields.join(", ")})` : `was ${c.kind} in ${stampPatch}`} — this build references it and may be affected.`,
      })),
    }));

  return {
    store: {
      sets: nextSets,
      skills: nextSkills,
      cpStars: nextCpStars,
      grimoires: nextGrimoires,
      scripts: nextScripts,
      classMasteryLines: nextMasteryLines,
    },
    report,
    flagged,
  };
}
