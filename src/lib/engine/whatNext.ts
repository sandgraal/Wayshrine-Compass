import type { Companion, NextAction, PlayerProfile } from "@/lib/types";
import { companions } from "@/data/companions";
import { ALL_DLC_IDS } from "@/data/zones";

/**
 * The "What Next" engine: a deterministic rules engine over the entity
 * database. No LLM calls — every action is auditable back to a rule.
 *
 * Contract (Phase 3 acceptance):
 * - never recommends content gated behind DLC the player lacks
 * - never recommends content above the player's level gate
 * - never surfaces addon-dependent advice on console
 */

export function ownedDlc(profile: PlayerProfile): Set<string> {
  return new Set(profile.esoPlus ? ALL_DLC_IDS : profile.dlcOwned);
}

function hasDlc(profile: PlayerProfile, dlc: string | null): boolean {
  return dlc === null || ownedDlc(profile).has(dlc);
}

type Rule = (p: PlayerProfile) => NextAction | null;

function nextUnlockableCompanion(p: PlayerProfile): Companion | null {
  const owned = new Set(p.companionsOwned);
  const candidates = companions
    .filter((c) => !owned.has(c.id) && hasDlc(p, c.dlcRequired))
    .sort((a, b) => {
      const best = (c: Companion) => Math.max(c.roleRatings.dps, c.roleRatings.tank, c.roleRatings.healer);
      return best(b) - best(a) || a.name.localeCompare(b.name);
    });
  return candidates[0] ?? null;
}

const rules: Rule[] = [
  // --- Universal fundamentals -------------------------------------------
  (p) => {
    if (p.level < 3) return null;
    return {
      id: "set-mundus",
      title: "Set your Mundus Stone (The Apprentice)",
      why: "A Mundus boon is a permanent free stat buff many new players skip entirely.",
      payoff: "Roughly a 5% damage increase that persists until you change it.",
      timeCost: "~10 min",
      score: p.level < 50 ? 88 : 60,
    };
  },
  () => ({
    id: "mount-training",
    title: "Start daily riding lessons at any stablemaster",
    why: "Mount speed trains once per day per character and can't be rushed with gameplay — every missed day is gone.",
    payoff: "Permanently faster travel; capped speed after 60 days.",
    timeCost: "~2 min/day",
    score: 65,
  }),
  (p) => ({
    id: "zone-story",
    title: "Follow your alliance zone story",
    why: "Zone stories chain quests with the best XP-per-hour outside dungeons and award skill points along the way.",
    payoff: "Levels, skill points, and gear as you go.",
    timeCost: "~1 hour/session",
    score: p.goal === "leveling" || p.goal === "solo-overland" ? 72 : 45,
  }),
  () => ({
    id: "collect-skyshards",
    title: "Grab skyshards as you travel (3 shards = 1 skill point)",
    why: "Skyshards are scattered along quest routes — detouring for them is nearly free skill points.",
    payoff: "Extra skill points for your build.",
    timeCost: "~2 min each",
    score: 44,
  }),
  () => ({
    id: "unlock-wayshrines",
    title: "Unlock every Wayshrine you pass",
    why: "Free fast-travel between unlocked Wayshrines saves gold and time forever after.",
    payoff: "Free fast travel network.",
    timeCost: "seconds each",
    score: 40,
  }),
  (p) => {
    const c = nextUnlockableCompanion(p);
    if (!c) return null;
    const goalBoost = p.goal === "solo-overland" || p.goal === "leveling" ? 10 : 0;
    return {
      id: `unlock-companion-${c.id}`,
      title: `Unlock a companion — ${c.name} (${c.unlockZone})`,
      why: `${c.name} is your strongest unlockable companion with your current DLC access, and companions make every solo activity faster and safer.`,
      payoff: "Permanent, account-wide combat ally.",
      timeCost: "~20 min",
      score: 80 + goalBoost,
    };
  },
  // --- Leveling ----------------------------------------------------------
  (p) => {
    if (p.level >= 50 || p.level < 10) return null;
    return {
      id: "daily-random-normal",
      title: "Run the daily Random Normal Dungeon",
      why: "The first random dungeon of the day grants a huge XP premium — the best XP-per-minute in the game at your level.",
      payoff: "Often a full level per day under level 50.",
      timeCost: "~15 min/day",
      score: p.goal === "leveling" ? 95 : 70,
    };
  },
  (p) => {
    if (p.level >= 50) return null;
    return {
      id: "training-gear",
      title: "Craft or request a Training-trait gear set",
      why: "Training trait multiplies all combat XP, and gear below CP160 is disposable anyway.",
      payoff: "10-40% faster leveling from gear you'd replace regardless.",
      timeCost: "~15 min",
      score: p.goal === "leveling" ? 75 : 50,
    };
  },
  (p) => {
    if (p.level >= 50 || p.level < 6) return null;
    return {
      id: "join-guilds",
      title: "Join the Mages Guild and Fighters Guild",
      why: "Both skill lines only progress if joined early — lorebooks and kills you make now count the moment you join.",
      payoff: "Unlocks two of the strongest utility skill lines in the game.",
      timeCost: "~10 min",
      score: 66,
    };
  },
  // --- Gold --------------------------------------------------------------
  (p) => {
    if (p.goal !== "gold" || p.level < 6) return null;
    return {
      id: "craft-certification",
      title: "Get crafting-certified, then run daily writs",
      why: "Certification takes minutes and unlocks daily crafting writs on every character.",
      payoff: "Roughly 5-10k gold per character per day, plus surveys and materials.",
      timeCost: "~30 min once, then ~10 min/day",
      score: 90,
    };
  },
  (p) => {
    if (p.goal !== "gold") return null;
    return {
      id: "price-tracking",
      title: "Set up guild-trader price tracking",
      why: "Selling at the right price is worth more than farming faster.",
      payoff: "Typically 20-30% higher sale prices.",
      timeCost: "~20 min",
      score: 72,
      addonDependent: true,
    };
  },
  // --- Solo overland -----------------------------------------------------
  (p) => {
    if (p.goal !== "solo-overland") return null;
    const owned = ownedDlc(p);
    const target = owned.has("gold-road")
      ? "West Weald"
      : owned.has("necrom")
        ? "Telvanni Peninsula"
        : owned.has("high-isle")
          ? "High Isle"
          : "your alliance's second zone";
    return {
      id: "overland-zone",
      title: `Work through the ${target} zone story and world bosses`,
      why: "Zone stories are ESO's best solo content, and every zone is level-scaled — nothing is gated.",
      payoff: "Skill points, gear, and a full storyline.",
      timeCost: "~2-6 hours",
      score: 85,
    };
  },
  // --- Dungeons ----------------------------------------------------------
  (p) => {
    if (p.goal !== "dungeons" || p.level < 10) return null;
    return {
      id: "dungeon-normal-rotation",
      title: "Queue normal dungeons and learn the DLC mechanics",
      why: "Normal difficulty is the mechanics classroom; veteran queues expect you to already know them.",
      payoff: "Undaunted keys, monster-set shoulders, and readiness for veteran.",
      timeCost: "~30 min/run",
      score: 84,
    };
  },
  (p) => {
    if (p.goal !== "dungeons" || p.cp < 160) return null;
    return {
      id: "vet-dungeon-progression",
      title: "Start veteran dungeon progression (base-game first)",
      why: "At CP160+ your gear stops scaling — veteran base-game dungeons are the intended next step.",
      payoff: "Monster set heads and real mechanical practice.",
      timeCost: "~45 min/run",
      score: 82,
    };
  },
  // --- Trials ------------------------------------------------------------
  (p) => {
    if (p.goal !== "trials" || p.level < 50) return null;
    return {
      id: "first-normal-trial",
      title: "Join a normal trial (Aetherian Archive is the classic starter)",
      why: "Normal trials are far easier than their reputation and are the gateway to 12-player content.",
      payoff: "Trial-only gear sets and your first weekly coffer.",
      timeCost: "~1 hour",
      score: 86,
    };
  },
  (p) => {
    if (p.goal !== "trials" || p.level >= 50) return null;
    return {
      id: "level-first-trials",
      title: "Hit level 50 before trial-hunting",
      why: "Trials require level 50; the fastest route there is the daily random dungeon plus zone quests.",
      payoff: "Unlocks the entire 12-player endgame.",
      timeCost: "depends on level",
      score: 86,
    };
  },
  // --- PvP ---------------------------------------------------------------
  (p) => {
    if (p.goal !== "pvp" || p.level < 10) return null;
    const bracket = p.level < 50 ? "the under-50 Cyrodiil campaign" : "Cyrodiil or Battlegrounds";
    return {
      id: "pvp-intro",
      title: `Enter ${bracket}`,
      why: p.level < 50
        ? "The under-50 campaign is the friendliest PvP bracket — battle-leveled stats and fewer veterans."
        : "Alliance War rank unlocks Vigor and Caltrops, which every PvP build uses.",
      payoff: "Alliance Points, PvP skill lines, and Transmute Crystals.",
      timeCost: "~1 hour",
      score: 88,
    };
  },
  // --- Systems unlocks ---------------------------------------------------
  (p) => {
    if (p.level < 30 || !hasDlc(p, "gold-road")) return null;
    return {
      id: "unlock-scribing",
      title: "Unlock Scribing (Gold Road: 'The Second Era of Scribing')",
      why: "Scribing lets you build custom skills from Grimoires and Scripts — several are best-in-slot utilities.",
      payoff: "Access to customizable skills your class lacks.",
      timeCost: "~45 min",
      score: 74,
    };
  },
  (p) => {
    if (p.level < 50) return null;
    return {
      id: "unlock-subclassing",
      title: "Set up Subclassing at the Armory",
      why: "At 50 you can graft other classes' skill lines onto your character — the biggest build-defining system in the game right now.",
      payoff: "Access to meta subclass combinations.",
      timeCost: "~30 min",
      score: p.goal === "trials" || p.goal === "dungeons" ? 83 : 68,
    };
  },
  (p) => {
    if (p.cp < 10) return null;
    return {
      id: "slot-cp",
      title: "Slot your Champion Point stars",
      why: "CP only works when slotted — unslotted points do nothing, and many returning players have hundreds unspent.",
      payoff: "Immediate, free power increase.",
      timeCost: "~10 min",
      score: 78,
    };
  },
];

/** Consoles never see addon-dependent advice; PC sees everything. */
function platformFilter(profile: PlayerProfile, action: NextAction): boolean {
  if (profile.platform === "pc") return true;
  return !action.addonDependent;
}

export function whatNext(profile: PlayerProfile, count = 5): NextAction[] {
  const actions = rules
    .map((rule) => rule(profile))
    .filter((a): a is NextAction => a !== null)
    .filter((a) => platformFilter(profile, a))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return actions.slice(0, count);
}
