import type {
  Build,
  ClassName,
  GearAssignment,
  GuidanceBlock,
  PatchCode,
  Role,
  Skill,
  SkillBar,
} from "@/lib/types";
import { ALL_CLASSES } from "@/lib/types";
import { buildEntityRefs } from "@/lib/entities";
import { skills } from "./skills";
import { sets } from "./sets";
import { cpStars } from "./cpStars";
import { CURRENT_PATCH, PATCH_ORDER } from "./patches";

/* ------------------------------------------------------------------ */
/* Skill lookup helpers                                                */
/* ------------------------------------------------------------------ */

function linesOf(className: ClassName): string[] {
  const seen: string[] = [];
  for (const s of skills) {
    if (s.className === className && !seen.includes(s.line)) seen.push(s.line);
  }
  return seen;
}

function lineActives(className: ClassName | null, line: string): Skill[] {
  return skills.filter((s) => s.className === className && s.line === line && !s.ultimate);
}

function lineUlt(className: ClassName | null, line: string): Skill {
  const ult = skills.find((s) => s.className === className && s.line === line && s.ultimate);
  if (!ult) throw new Error(`No ultimate for ${className}/${line}`);
  return ult;
}

function weaponSkill(line: string, nameIncludes: string): Skill {
  const s = skills.find(
    (sk) => sk.className === null && sk.line === line && sk.name.toLowerCase().includes(nameIncludes.toLowerCase())
  );
  if (!s) throw new Error(`No weapon skill ${line}/${nameIncludes}`);
  return s;
}

/** Resolve a specific class skill by name — used by the hand-authored builds. */
function classSkill(className: ClassName, line: string, nameIncludes: string): Skill {
  const s = skills.find(
    (sk) => sk.className === className && sk.line === line && sk.name.toLowerCase().includes(nameIncludes.toLowerCase())
  );
  if (!s) throw new Error(`No class skill ${className}/${line}/${nameIncludes}`);
  return s;
}

const bar = (skillIds: string[], ultimate: string): SkillBar => ({ skills: skillIds, ultimate });

/* ------------------------------------------------------------------ */
/* Gear templates                                                      */
/* ------------------------------------------------------------------ */

const BODY = ["chest", "hands", "waist", "legs", "feet"] as const;
const JEWELRY_WEAPONS = ["necklace", "ring1", "ring2", "frontBarWeapon", "backBarWeapon"] as const;

function gearTemplate(opts: {
  bodySet: string;
  jewelrySet: string;
  monsterSet?: string;
  headShoulderSet?: string; // used when no monster set (leveling)
  bodyTrait: string;
  jewelryTrait: string;
  weaponTraitFront: string;
  weaponTraitBack: string;
  weight: "light" | "medium" | "heavy";
}): GearAssignment[] {
  const gear: GearAssignment[] = [];
  const hs = opts.monsterSet ?? opts.headShoulderSet ?? opts.bodySet;
  gear.push({ slot: "head", setId: hs, trait: opts.bodyTrait, weight: opts.weight });
  gear.push({ slot: "shoulders", setId: hs, trait: opts.bodyTrait, weight: opts.weight });
  for (const slot of BODY) {
    gear.push({ slot, setId: opts.bodySet, trait: opts.bodyTrait, weight: opts.weight });
  }
  for (const slot of JEWELRY_WEAPONS) {
    const isWeapon = slot === "frontBarWeapon" || slot === "backBarWeapon";
    gear.push({
      slot,
      setId: opts.jewelrySet,
      trait: isWeapon
        ? slot === "frontBarWeapon"
          ? opts.weaponTraitFront
          : opts.weaponTraitBack
        : opts.jewelryTrait,
    });
  }
  return gear;
}

/* ------------------------------------------------------------------ */
/* Per-class flavor                                                    */
/* ------------------------------------------------------------------ */

const CLASS_LABEL: Record<ClassName, string> = {
  dragonknight: "Dragonknight",
  sorcerer: "Sorcerer",
  nightblade: "Nightblade",
  templar: "Templar",
  warden: "Warden",
  necromancer: "Necromancer",
  arcanist: "Arcanist",
};

/** Class-specific DPS body set for variety; jewelry/weapons default to Order's Wrath. */
const DPS_BODY_SET: Record<ClassName, string> = {
  dragonknight: "set-pillar-of-nirn",
  sorcerer: "set-ansuuls-torment",
  nightblade: "set-deadly-strike",
  templar: "set-deadly-strike",
  warden: "set-whorl-of-the-depths",
  necromancer: "set-coral-riptide",
  arcanist: "set-ansuuls-torment",
};

/** Two seed builds demonstrate Subclassing: a borrowed line replaces a native one. */
const SUBCLASS_BORROW: Partial<
  Record<ClassName, { replaceLineIndex: number; fromClass: ClassName; fromLine: string }>
> = {
  sorcerer: { replaceLineIndex: 1, fromClass: "nightblade", fromLine: "assassination" },
  dragonknight: { replaceLineIndex: 2, fromClass: "necromancer", fromLine: "grave-lord" },
};

/* ------------------------------------------------------------------ */
/* Honest freshness stamping — no build ships green                    */
/* ------------------------------------------------------------------ */

/**
 * Every entity id the seed provenance says the current patch changed. A build
 * that references one of these reads as amber ("needs review"), naming the
 * change; freshness.ts derives that from provenance, not from these ids — this
 * set only decides how far back we honestly stamp patchVerified.
 */
const CHANGED_THIS_PATCH: ReadonlySet<string> = new Set<string>([
  ...sets.filter((s) => s.lastChangedPatch === CURRENT_PATCH).map((s) => s.id),
  ...skills.filter((s) => s.lastChangedPatch === CURRENT_PATCH).map((s) => s.id),
  ...cpStars.filter((s) => s.lastChangedPatch === CURRENT_PATCH).map((s) => s.id),
]);

const CURRENT_INDEX = PATCH_ORDER.indexOf(CURRENT_PATCH);
/** One patch back → amber when a referenced entity moved this patch. */
const PRIOR_PATCH: PatchCode = PATCH_ORDER[CURRENT_INDEX - 1] ?? CURRENT_PATCH;
/** Two patches back → always stale (2+ behind), regardless of references. */
const STALE_PATCH: PatchCode = PATCH_ORDER[CURRENT_INDEX - 2] ?? PATCH_ORDER[0];

/**
 * The last patch a human honestly signed this build off against. No seed build
 * has been reviewed for the current patch — that is the user's manual /admin
 * job — so this never returns CURRENT_PATCH, and no build can compute to the
 * green "verified" badge (freshness.ts: green = human-reviewed for current
 * patch). A build that references something the current patch changed lands on
 * PRIOR_PATCH so it surfaces as amber and names the change; everything else
 * lands on STALE_PATCH (two patches back → red "stale, awaiting review").
 */
function honestPatchVerified(build: Build): PatchCode {
  const touchesChange = buildEntityRefs(build).some((r) => CHANGED_THIS_PATCH.has(r.entityId));
  return touchesChange ? PRIOR_PATCH : STALE_PATCH;
}

/* ------------------------------------------------------------------ */
/* Guidance                                                            */
/* ------------------------------------------------------------------ */

function guidanceFor(role: Role | "leveling", className: ClassName): GuidanceBlock[] {
  const blocks: GuidanceBlock[] = [];
  const label = CLASS_LABEL[className];
  if (role === "dps") {
    blocks.push({
      platform: "all",
      title: "How this build plays",
      body: `Keep your damage-over-time effects from the back bar running, then spend globals on your front-bar spammable. Light attack between every cast. The ${label} kit rewards keeping every timer rolling before you drop into execute range.`,
    });
    blocks.push({
      platform: "pc",
      title: "Measuring your damage",
      body: "Install Combat Metrics (Minion) and parse on the 21M trial dummy. Aim to keep your DoT uptimes above 90% before chasing gear upgrades.",
      consoleAlternative:
        "Console has no parse addons. Use the 6M target skeleton in a guildhall or your house and time your kill: under 90 seconds is roughly the same benchmark as a 60k parse on PC.",
    });
  } else if (role === "tank") {
    blocks.push({
      platform: "all",
      title: "How this build plays",
      body: `Hold block, keep your taunt on cooldown against the active boss, and keep your Major Resolve armor buff up. The ${label} toolkit adds group utility — use it between taunts, not instead of them.`,
    });
    blocks.push({
      platform: "pc",
      title: "Group buff tracking",
      body: "Install Bandits UI or Srendarr to track your buff uptimes and taunt timers.",
      consoleAlternative:
        "Without addons, watch the default buff bar (enable 'Show buffs' in Settings → Combat) and re-taunt on a fixed rhythm — every second Puncture is a safe default.",
    });
  } else if (role === "healer") {
    blocks.push({
      platform: "all",
      title: "How this build plays",
      body: `Pre-cast your heal-over-times before damage lands, keep group buffs rolling, and weave in damage when the group is stable. The ${label} kit determines your emergency button — know it before the pull.`,
    });
    blocks.push({
      platform: "pc",
      title: "Seeing group health clearly",
      body: "Install Bandits UI for compact group frames with buff tracking.",
      consoleAlternative:
        "Enable 'Custom Group Frames' style options in Settings → Interface, and position yourself center-group so your cone heals always connect.",
    });
  } else {
    blocks.push({
      platform: "all",
      title: "Leveling route",
      body: `Quest through your alliance zones and do the daily Random Normal Dungeon from level 10 for a large XP bonus. Slot new skills as they unlock so the lines level with you — a skill only gains XP while it is on your bar.`,
    });
    blocks.push({
      platform: "all",
      title: "Don't buy gear yet",
      body: "Gear scales until Champion Point 160. Craft or request this Training-trait set every ~10 levels and spend your gold on bag space and your mount instead.",
    });
  }
  return blocks;
}

/* ------------------------------------------------------------------ */
/* Build assembly                                                      */
/* ------------------------------------------------------------------ */

function makeDps(className: ClassName): Build {
  const nativeLines = linesOf(className);
  const borrow = SUBCLASS_BORROW[className];
  const lines = nativeLines.map((l, i) =>
    borrow && borrow.replaceLineIndex === i
      ? { owner: borrow.fromClass, line: borrow.fromLine }
      : { owner: className, line: l }
  );
  const [l1, l2, l3] = lines;
  const a1 = lineActives(l1.owner, l1.line);
  const a2 = lineActives(l2.owner, l2.line);
  const a3 = lineActives(l3.owner, l3.line);

  const slug = `${className}-dps`;
  return finalize({
    slug,
    name: `${CLASS_LABEL[className]} DPS`,
    className,
    subclassLines: lines.map((l) => `${l.owner}/${l.line}`),
    role: "dps",
    contentType: "trial",
    gear: gearTemplate({
      bodySet: DPS_BODY_SET[className],
      jewelrySet: "set-orders-wrath",
      monsterSet: "set-slimecraw",
      bodyTrait: "Divines",
      jewelryTrait: "Bloodthirsty",
      weaponTraitFront: "Precise",
      weaponTraitBack: "Infused",
      weight: "light",
    }),
    frontBar: {
      skills: [a1[0].id, a1[1].id, a2[0].id, weaponSkill("destruction-staff", "Force Shock").id, weaponSkill("mages-guild", "Magelight").id],
      ultimate: lineUlt(l1.owner, l1.line).id,
    },
    backBar: {
      skills: [a2[1].id, a3[0].id, a3[1].id, weaponSkill("destruction-staff", "Wall of Elements").id, weaponSkill("destruction-staff", "Destructive Touch").id],
      ultimate: weaponSkill("destruction-staff", "Elemental Storm").id,
    },
    cp: {
      warfare: ["cp-master-at-arms", "cp-deadly-aim", "cp-thaumaturge", "cp-fighting-finesse"],
      fitness: ["cp-boundless-vitality", "cp-rejuvenation", "cp-fortified", "cp-celerity"],
      craft: ["cp-steeds-blessing", "cp-gifted-rider", "cp-plentiful-harvest", "cp-master-gatherer"],
    },
    mundusId: "mundus-shadow",
    foodId: "food-bewitched-sugar-skulls",
    guidance: guidanceFor("dps", className),
  });
}

function makeTank(className: ClassName): Build {
  const [n1, n2, n3] = linesOf(className);
  const a1 = lineActives(className, n1);
  const a2 = lineActives(className, n2);
  const a3 = lineActives(className, n3);

  return finalize({
    slug: `${className}-tank`,
    name: `${CLASS_LABEL[className]} Tank`,
    className,
    subclassLines: [n1, n2, n3].map((l) => `${className}/${l}`),
    role: "tank",
    contentType: "dungeon",
    gear: gearTemplate({
      bodySet: "set-turning-tide",
      jewelrySet: "set-pearlescent-ward",
      monsterSet: "set-tremorscale",
      bodyTrait: "Sturdy",
      jewelryTrait: "Infused",
      weaponTraitFront: "Defending",
      weaponTraitBack: "Infused",
      weight: "heavy",
    }),
    frontBar: {
      skills: [
        weaponSkill("one-hand-and-shield", "Puncture").id,
        weaponSkill("one-hand-and-shield", "Low Slash").id,
        weaponSkill("one-hand-and-shield", "Defensive Posture").id,
        a2[0].id,
        weaponSkill("undaunted", "Inner Fire").id,
      ],
      ultimate: lineUlt(className, n2).id,
    },
    backBar: {
      skills: [a1[0].id, a2[1].id, a3[0].id, a3[1].id, weaponSkill("undaunted", "Blood Altar").id],
      ultimate: weaponSkill("one-hand-and-shield", "Shield Wall").id,
    },
    cp: {
      warfare: ["cp-enduring-resolve", "cp-reinforced", "cp-swift-renewal", "cp-fighting-finesse"],
      fitness: ["cp-boundless-vitality", "cp-fortified", "cp-pains-refuge", "cp-rejuvenation"],
      craft: ["cp-steeds-blessing", "cp-gifted-rider", "cp-plentiful-harvest", "cp-master-gatherer"],
    },
    mundusId: "mundus-lady",
    foodId: "food-bewitched-sugar-skulls",
    guidance: guidanceFor("tank", className),
  });
}

function makeHealer(className: ClassName): Build {
  const [n1, n2, n3] = linesOf(className);
  const a1 = lineActives(className, n1);
  const a2 = lineActives(className, n2);
  const a3 = lineActives(className, n3);

  return finalize({
    slug: `${className}-healer`,
    name: `${CLASS_LABEL[className]} Healer`,
    className,
    subclassLines: [n1, n2, n3].map((l) => `${className}/${l}`),
    role: "healer",
    contentType: "trial",
    gear: gearTemplate({
      bodySet: "set-spell-power-cure",
      jewelrySet: "set-jorvulds-guidance",
      monsterSet: "set-ozezan-the-inferno",
      bodyTrait: "Divines",
      jewelryTrait: "Arcane",
      weaponTraitFront: "Powered",
      weaponTraitBack: "Infused",
      weight: "light",
    }),
    frontBar: {
      skills: [
        weaponSkill("restoration-staff", "Grand Healing").id,
        weaponSkill("restoration-staff", "Regeneration").id,
        weaponSkill("restoration-staff", "Blessing of Protection").id,
        a3[0].id,
        a3[1].id,
      ],
      ultimate: lineUlt(className, n3).id,
    },
    backBar: {
      skills: [a2[0].id, a2[1].id, a1[0].id, weaponSkill("restoration-staff", "Steadfast Ward").id, weaponSkill("undaunted", "Blood Altar").id],
      ultimate: weaponSkill("restoration-staff", "Panacea").id,
    },
    cp: {
      warfare: ["cp-enlivening-overflow", "cp-swift-renewal", "cp-fighting-finesse", "cp-reinforced"],
      fitness: ["cp-boundless-vitality", "cp-rejuvenation", "cp-celerity", "cp-fortified"],
      craft: ["cp-steeds-blessing", "cp-gifted-rider", "cp-plentiful-harvest", "cp-master-gatherer"],
    },
    mundusId: "mundus-ritual",
    foodId: "food-ghastly-eye-bowl",
    guidance: guidanceFor("healer", className),
  });
}

function makeLeveling(className: ClassName): Build {
  const [n1, n2, n3] = linesOf(className);
  const a1 = lineActives(className, n1);
  const a2 = lineActives(className, n2);
  const a3 = lineActives(className, n3);

  return finalize({
    slug: `${className}-leveling`,
    name: `${CLASS_LABEL[className]} Leveling`,
    className,
    subclassLines: [n1, n2, n3].map((l) => `${className}/${l}`),
    role: "dps",
    contentType: "leveling",
    gear: gearTemplate({
      bodySet: "set-law-of-julianos",
      jewelrySet: "set-armor-of-the-seducer",
      headShoulderSet: "set-armor-of-the-seducer",
      bodyTrait: "Training",
      jewelryTrait: "Arcane",
      weaponTraitFront: "Training",
      weaponTraitBack: "Training",
      weight: "light",
    }),
    frontBar: {
      skills: [a1[0].id, a1[1].id, a2[0].id, a3[0].id, weaponSkill("mages-guild", "Magelight").id],
      ultimate: lineUlt(className, n1).id,
    },
    backBar: {
      skills: [
        a2[1].id,
        a3[1].id,
        weaponSkill("destruction-staff", "Force Shock").id,
        weaponSkill("destruction-staff", "Wall of Elements").id,
        weaponSkill("fighters-guild", "Silver Bolts").id,
      ],
      ultimate: weaponSkill("fighters-guild", "Dawnbreaker").id,
    },
    cp: {
      warfare: ["cp-master-at-arms", "cp-deadly-aim", "cp-biting-aura", "cp-fighting-finesse"],
      fitness: ["cp-boundless-vitality", "cp-rejuvenation", "cp-celerity", "cp-bloody-renewal"],
      craft: ["cp-steeds-blessing", "cp-gifted-rider", "cp-master-gatherer", "cp-plentiful-harvest"],
    },
    mundusId: "mundus-apprentice",
    foodId: "food-artaeum-takeaway-broth",
    guidance: guidanceFor("leveling", className),
  });
}

function finalize(partial: Omit<Build, "id" | "author" | "status" | "patchVerified" | "needsReviewReasons">): Build {
  const build: Build = {
    ...partial,
    id: `build-${partial.slug}`,
    author: "Wayshrine Compass Team",
    // Stored hint only; the displayed trust status is computed from provenance
    // (freshness.ts). No build is human-verified for the current patch yet.
    status: "needs_review",
    patchVerified: PRIOR_PATCH, // provisional; replaced by the honest stamp below
    needsReviewReasons: [],
  };
  build.patchVerified = honestPatchVerified(build);
  return build;
}

const generatedBuilds: Build[] = ALL_CLASSES.flatMap((c) => [
  makeDps(c),
  makeTank(c),
  makeHealer(c),
  makeLeveling(c),
]);

/* ------------------------------------------------------------------ */
/* Hand-authored builds — 2 per class                                  */
/*                                                                     */
/* Each class gets one endgame trial variant (a role beyond its        */
/* generated build) and one accessible solo / one-bar-friendly build.  */
/* Guidance is original prose written from general game knowledge, and */
/* every PC/addon tip carries a console alternative so console mode     */
/* never renders addon instructions (see src/lib/platform.ts).         */
/* ------------------------------------------------------------------ */

/** Shared "how a solo build stays alive" note; addon-free. */
function soloGuidance(className: ClassName, selfHeal: string): GuidanceBlock[] {
  const label = CLASS_LABEL[className];
  return [
    {
      platform: "all",
      title: "Built to survive alone",
      body: `This ${label} setup trades a sliver of damage for self-sufficiency: ${selfHeal} keeps you topped up, and the sets are all overland or crafted so you can assemble the whole thing without stepping into a group. Slot your class shield or heal before you pull, then commit to the fight — most overland packs die inside two rotations.`,
    },
    {
      platform: "all",
      title: "Prefer a single bar?",
      body: "The gear table above is the standard two-bar setup. If weaving feels awkward, a one-bar variant of this playstyle is built around the Oakensoul Ring mythic — it grants the Major buffs a back bar usually provides in exchange for locking you to one bar. Treat that as its own loadout you assemble separately (the ring replaces a jewelry piece and you rebuild the single bar around your priority skills), not a drop-in swap for the gear here.",
    },
    {
      platform: "pc",
      title: "Dummy-check before you commit",
      body: "On PC, a quick parse on the 3M or 6M target dummy with Combat Metrics tells you whether your sustain holds up over a long fight before you rely on it in a hard quest boss.",
      consoleAlternative:
        "On console, test on a training dummy in your house: if you can hold your rotation for 60 seconds without running dry on resources, the build sustains fine for solo overland.",
    },
  ];
}

/** Forgiving all-round Champion Point layout shared by the solo overland builds. */
const SOLO_CP: Record<"warfare" | "fitness" | "craft", string[]> = {
  warfare: ["cp-master-at-arms", "cp-deadly-aim", "cp-fighting-finesse", "cp-biting-aura"],
  fitness: ["cp-boundless-vitality", "cp-bloody-renewal", "cp-rejuvenation", "cp-celerity"],
  craft: ["cp-steeds-blessing", "cp-gifted-rider", "cp-plentiful-harvest", "cp-master-gatherer"],
};

const authoredBuilds: Build[] = [
  /* ---------------- Dragonknight ---------------- */
  finalize({
    slug: "dragonknight-trial-tank",
    name: "Dragonknight Trial Main Tank",
    className: "dragonknight",
    subclassLines: ["dragonknight/draconic-power", "dragonknight/earthen-heart", "dragonknight/ardent-flame"],
    role: "tank",
    contentType: "trial",
    gear: gearTemplate({
      bodySet: "set-lucent-echoes",
      jewelrySet: "set-pearlescent-ward",
      monsterSet: "set-tremorscale",
      bodyTrait: "Sturdy",
      jewelryTrait: "Infused",
      weaponTraitFront: "Infused",
      weaponTraitBack: "Infused",
      weight: "heavy",
    }),
    frontBar: bar(
      [
        weaponSkill("one-hand-and-shield", "Puncture").id,
        weaponSkill("one-hand-and-shield", "Low Slash").id,
        classSkill("dragonknight", "draconic-power", "Chains of Flame").id,
        classSkill("dragonknight", "earthen-heart", "Petrify").id,
        weaponSkill("undaunted", "Inner Fire").id,
      ],
      classSkill("dragonknight", "earthen-heart", "Magma Armor").id
    ),
    backBar: bar(
      [
        classSkill("dragonknight", "earthen-heart", "Obsidian Shield").id,
        classSkill("dragonknight", "draconic-power", "Dragon Blood").id,
        classSkill("dragonknight", "draconic-power", "Dark Talons").id,
        weaponSkill("undaunted", "Blood Altar").id,
        weaponSkill("one-hand-and-shield", "Defensive Posture").id,
      ],
      weaponSkill("one-hand-and-shield", "Shield Wall").id
    ),
    cp: {
      warfare: ["cp-enduring-resolve", "cp-reinforced", "cp-swift-renewal", "cp-fighting-finesse"],
      fitness: ["cp-boundless-vitality", "cp-fortified", "cp-pains-refuge", "cp-rejuvenation"],
      craft: ["cp-steeds-blessing", "cp-gifted-rider", "cp-plentiful-harvest", "cp-master-gatherer"],
    },
    mundusId: "mundus-lady",
    foodId: "food-bewitched-sugar-skulls",
    guidance: [
      {
        platform: "all",
        title: "The Dragonknight main-tank job",
        body: "You are the anchor. Keep Pierce Armor on the boss at all times, chain stragglers back into the pack with Chains of Flame, and lock a dangerous add down with Petrify. Choking Talons pins trash so the group can cleave it, Obsidian Shield feeds group damage shields on every cast, and Magma Armor is your 'do not die' button when a mechanic slips through. Lucent Echoes rewards your blocking with a group buff, so block early and often — your uptime on it helps everyone behind you.",
      },
      {
        platform: "all",
        title: "Ultimate economy",
        body: "Pearlescent Ward rewards the group for staying alive, so your job is to make that easy: taunt-swap cleanly, keep Blood Altar down for the healers' resources, and pop Magma Armor a beat before the big hit rather than after it lands.",
      },
      {
        platform: "pc",
        title: "Tracking taunt and buff timers",
        body: "Bandits UI or Untaunted will show your taunt timer and warn you if a second tank's taunt is about to overwrite yours in a two-tank fight.",
        consoleAlternative:
          "On console, keep a fixed re-taunt rhythm — every second Pierce Armor — and call taunt swaps out loud on voice chat so the off-tank knows exactly when the boss is changing hands.",
      },
    ],
  }),
  finalize({
    slug: "dragonknight-solo",
    name: "Dragonknight Solo Flamereaver",
    className: "dragonknight",
    subclassLines: ["dragonknight/ardent-flame", "dragonknight/draconic-power", "dragonknight/earthen-heart"],
    role: "dps",
    contentType: "overland",
    gear: gearTemplate({
      bodySet: "set-orders-wrath",
      jewelrySet: "set-hundings-rage",
      monsterSet: "set-selene",
      bodyTrait: "Divines",
      jewelryTrait: "Bloodthirsty",
      weaponTraitFront: "Nirnhoned",
      weaponTraitBack: "Infused",
      weight: "medium",
    }),
    frontBar: bar(
      [
        classSkill("dragonknight", "ardent-flame", "Lava Whip").id,
        classSkill("dragonknight", "ardent-flame", "Searing Strike").id,
        classSkill("dragonknight", "draconic-power", "Chains of Flame").id,
        classSkill("dragonknight", "draconic-power", "Dragon Blood").id,
        weaponSkill("two-handed", "Uppercut").id,
      ],
      weaponSkill("fighters-guild", "Dawnbreaker").id
    ),
    backBar: bar(
      [
        classSkill("dragonknight", "earthen-heart", "Molten Weapons").id,
        classSkill("dragonknight", "earthen-heart", "Obsidian Shield").id,
        classSkill("dragonknight", "draconic-power", "Dark Talons").id,
        weaponSkill("two-handed", "Critical Charge").id,
        weaponSkill("fighters-guild", "Silver Bolts").id,
      ],
      weaponSkill("two-handed", "Berserker Strike").id
    ),
    cp: {
      warfare: ["cp-master-at-arms", "cp-deadly-aim", "cp-fighting-finesse", "cp-biting-aura"],
      fitness: ["cp-boundless-vitality", "cp-bloody-renewal", "cp-rejuvenation", "cp-celerity"],
      craft: ["cp-steeds-blessing", "cp-gifted-rider", "cp-plentiful-harvest", "cp-master-gatherer"],
    },
    mundusId: "mundus-shadow",
    foodId: "food-artaeum-takeaway-broth",
    guidance: soloGuidance("dragonknight", "Dragon Blood's burst self-heal and heavy-armor bulk"),
  }),

  /* ---------------- Sorcerer ---------------- */
  finalize({
    slug: "sorcerer-trial-dps",
    name: "Sorcerer Trial Pet DPS",
    className: "sorcerer",
    subclassLines: ["sorcerer/daedric-summoning", "sorcerer/storm-calling", "sorcerer/dark-magic"],
    role: "dps",
    contentType: "trial",
    gear: gearTemplate({
      bodySet: "set-bahseis-mania",
      jewelrySet: "set-sul-xans-torment",
      monsterSet: "set-slimecraw",
      bodyTrait: "Divines",
      jewelryTrait: "Bloodthirsty",
      weaponTraitFront: "Precise",
      weaponTraitBack: "Infused",
      weight: "light",
    }),
    frontBar: bar(
      [
        classSkill("sorcerer", "dark-magic", "Crystal Shard").id,
        classSkill("sorcerer", "daedric-summoning", "Daedric Curse").id,
        classSkill("sorcerer", "daedric-summoning", "Summon Unstable Familiar").id,
        classSkill("sorcerer", "storm-calling", "Surge").id,
        weaponSkill("destruction-staff", "Force Shock").id,
      ],
      classSkill("sorcerer", "daedric-summoning", "Summon Storm Atronach").id
    ),
    backBar: bar(
      [
        classSkill("sorcerer", "storm-calling", "Lightning Form").id,
        classSkill("sorcerer", "daedric-summoning", "Conjured Ward").id,
        classSkill("sorcerer", "dark-magic", "Encase").id,
        weaponSkill("destruction-staff", "Wall of Elements").id,
        weaponSkill("mages-guild", "Magelight").id,
      ],
      weaponSkill("destruction-staff", "Elemental Storm").id
    ),
    cp: {
      warfare: ["cp-master-at-arms", "cp-deadly-aim", "cp-thaumaturge", "cp-fighting-finesse"],
      fitness: ["cp-boundless-vitality", "cp-rejuvenation", "cp-celerity", "cp-fortified"],
      craft: ["cp-steeds-blessing", "cp-gifted-rider", "cp-plentiful-harvest", "cp-master-gatherer"],
    },
    mundusId: "mundus-thief",
    foodId: "food-ghastly-eye-bowl",
    guidance: [
      {
        platform: "all",
        title: "Let the pets do the boring part",
        body: "Your Unstable Familiar and Storm Atronach tick away while you focus on the front bar. Keep Daedric Curse rolling on cooldown for the delayed burst, weave Crystal Shard as your spammable, and re-apply Surge for the passive crit healing. Bahsei's Mania pushes your damage the lower your Magicka drops, so this build wants you living slightly dangerously — spend Magicka freely and lean on Critical Surge to stay alive.",
      },
      {
        platform: "all",
        title: "Sustaining Bahsei's",
        body: "Because Bahsei's Mania rewards low Magicka, avoid over-healing your own pool — heavy attack only when you genuinely need the resources. Sul-Xan's Torment leaves a vengeful soul when an enemy you damaged dies; sweep through it to bank a burst of Critical Chance and Critical Damage for the next target.",
      },
      {
        platform: "pc",
        title: "Measuring the trade-off",
        body: "Parse the same fight twice in Combat Metrics — once playing safe, once riding low Magicka with Bahsei's — to see exactly how much the risk is worth on your setup.",
        consoleAlternative:
          "On console you have no parse addon, so judge it by kill speed instead: on the 6-million target skeleton, dropping it comfortably under 90 seconds without dying means your Bahsei's uptime is where it needs to be.",
      },
    ],
  }),
  finalize({
    slug: "sorcerer-solo",
    name: "Sorcerer Solo Stormbringer",
    className: "sorcerer",
    subclassLines: ["sorcerer/storm-calling", "sorcerer/daedric-summoning", "sorcerer/dark-magic"],
    role: "dps",
    contentType: "overland",
    gear: gearTemplate({
      bodySet: "set-mothers-sorrow",
      jewelrySet: "set-orders-wrath",
      monsterSet: "set-selene",
      bodyTrait: "Divines",
      jewelryTrait: "Bloodthirsty",
      weaponTraitFront: "Precise",
      weaponTraitBack: "Infused",
      weight: "light",
    }),
    frontBar: bar(
      [
        classSkill("sorcerer", "dark-magic", "Crystal Shard").id,
        classSkill("sorcerer", "storm-calling", "Mages' Fury").id,
        classSkill("sorcerer", "daedric-summoning", "Summon Unstable Familiar").id,
        classSkill("sorcerer", "storm-calling", "Surge").id,
        weaponSkill("destruction-staff", "Force Shock").id,
      ],
      classSkill("sorcerer", "daedric-summoning", "Summon Storm Atronach").id
    ),
    backBar: bar(
      [
        classSkill("sorcerer", "storm-calling", "Lightning Form").id,
        classSkill("sorcerer", "daedric-summoning", "Conjured Ward").id,
        classSkill("sorcerer", "dark-magic", "Dark Exchange").id,
        weaponSkill("destruction-staff", "Wall of Elements").id,
        weaponSkill("mages-guild", "Magelight").id,
      ],
      classSkill("sorcerer", "storm-calling", "Overload").id
    ),
    mundusId: "mundus-thief",
    foodId: "food-bewitched-sugar-skulls",
    cp: SOLO_CP,
    guidance: soloGuidance("sorcerer", "Critical Surge's crit-healing and Hardened Ward's shield"),
  }),

  /* ---------------- Nightblade ---------------- */
  finalize({
    slug: "nightblade-trial-healer",
    name: "Nightblade Trial Healer",
    className: "nightblade",
    subclassLines: ["nightblade/siphoning", "nightblade/shadow", "nightblade/assassination"],
    role: "healer",
    contentType: "trial",
    gear: gearTemplate({
      bodySet: "set-spell-power-cure",
      jewelrySet: "set-pillagers-profit",
      monsterSet: "set-ozezan-the-inferno",
      bodyTrait: "Divines",
      jewelryTrait: "Arcane",
      weaponTraitFront: "Powered",
      weaponTraitBack: "Infused",
      weight: "light",
    }),
    frontBar: bar(
      [
        weaponSkill("restoration-staff", "Grand Healing").id,
        weaponSkill("restoration-staff", "Regeneration").id,
        weaponSkill("restoration-staff", "Blessing of Protection").id,
        classSkill("nightblade", "siphoning", "Strife").id,
        classSkill("nightblade", "shadow", "Path of Darkness").id,
      ],
      weaponSkill("restoration-staff", "Panacea").id
    ),
    backBar: bar(
      [
        classSkill("nightblade", "siphoning", "Cripple").id,
        classSkill("nightblade", "shadow", "Blur").id,
        classSkill("nightblade", "siphoning", "Siphoning Strikes").id,
        weaponSkill("undaunted", "Blood Altar").id,
        weaponSkill("restoration-staff", "Steadfast Ward").id,
      ],
      classSkill("nightblade", "siphoning", "Soul Shred").id
    ),
    cp: {
      warfare: ["cp-enlivening-overflow", "cp-swift-renewal", "cp-fighting-finesse", "cp-reinforced"],
      fitness: ["cp-boundless-vitality", "cp-rejuvenation", "cp-celerity", "cp-fortified"],
      craft: ["cp-steeds-blessing", "cp-gifted-rider", "cp-plentiful-harvest", "cp-master-gatherer"],
    },
    mundusId: "mundus-atronach",
    foodId: "food-ghastly-eye-bowl",
    guidance: [
      {
        platform: "all",
        title: "The Nightblade healer's edge",
        body: "Siphoning gives you a healer with teeth. Funnel Health (Strife) tops the group while dealing damage, Refreshing Path lays down movement healing, and Soul Siphon is one of the strongest emergency group heals in the game — hold it for the moment a mechanic goes wrong rather than spending it on cooldown. Spell Power Cure means your job is partly a damage buff: keep someone overhealed so Major Courage stays live on the group.",
      },
      {
        platform: "all",
        title: "Resource discipline",
        body: "Siphoning Attacks and Pillager's Profit keep your Magicka honest, so you can afford to pre-stack Regeneration and Blessing of Protection before damage lands instead of reacting to it. Blood Altar covers the whole group's sustain during long burn phases.",
      },
      {
        platform: "pc",
        title: "Watching group health",
        body: "Install Bandits UI for compact raid frames so you can see who is dropping before the default frames make it obvious.",
        consoleAlternative:
          "On console, enable Group Frames in Settings → Interface and stand center-group so Grand Healing and your cone heals always reach the most people at once.",
      },
    ],
  }),
  finalize({
    slug: "nightblade-solo",
    name: "Nightblade Solo Reaper",
    className: "nightblade",
    subclassLines: ["nightblade/assassination", "nightblade/siphoning", "nightblade/shadow"],
    role: "dps",
    contentType: "overland",
    gear: gearTemplate({
      bodySet: "set-mothers-sorrow",
      jewelrySet: "set-hundings-rage",
      monsterSet: "set-selene",
      bodyTrait: "Divines",
      jewelryTrait: "Bloodthirsty",
      weaponTraitFront: "Nirnhoned",
      weaponTraitBack: "Infused",
      weight: "medium",
    }),
    frontBar: bar(
      [
        classSkill("nightblade", "assassination", "Assassin's Blade").id,
        classSkill("nightblade", "assassination", "Teleport Strike").id,
        classSkill("nightblade", "siphoning", "Strife").id,
        classSkill("nightblade", "assassination", "Grim Focus").id,
        weaponSkill("dual-wield", "Flurry").id,
      ],
      weaponSkill("fighters-guild", "Dawnbreaker").id
    ),
    backBar: bar(
      [
        classSkill("nightblade", "siphoning", "Cripple").id,
        classSkill("nightblade", "shadow", "Shadow Cloak").id,
        classSkill("nightblade", "siphoning", "Siphoning Strikes").id,
        weaponSkill("dual-wield", "Twin Slashes").id,
        weaponSkill("fighters-guild", "Silver Bolts").id,
      ],
      classSkill("nightblade", "siphoning", "Soul Shred").id
    ),
    mundusId: "mundus-shadow",
    foodId: "food-artaeum-takeaway-broth",
    cp: SOLO_CP,
    guidance: soloGuidance("nightblade", "Funnel Health's on-hit healing and Shadow Cloak's escape"),
  }),

  /* ---------------- Templar ---------------- */
  finalize({
    slug: "templar-trial-dps",
    name: "Templar Trial Jabs DPS",
    className: "templar",
    subclassLines: ["templar/aedric-spear", "templar/dawns-wrath", "templar/restoring-light"],
    role: "dps",
    contentType: "trial",
    gear: gearTemplate({
      bodySet: "set-deadly-strike",
      jewelrySet: "set-sul-xans-torment",
      monsterSet: "set-slimecraw",
      bodyTrait: "Divines",
      jewelryTrait: "Bloodthirsty",
      weaponTraitFront: "Precise",
      weaponTraitBack: "Infused",
      weight: "medium",
    }),
    frontBar: bar(
      [
        classSkill("templar", "aedric-spear", "Puncturing Strikes").id,
        classSkill("templar", "dawns-wrath", "Sun Fire").id,
        classSkill("templar", "aedric-spear", "Spear Shards").id,
        classSkill("templar", "dawns-wrath", "Backlash").id,
        weaponSkill("dual-wield", "Twin Slashes").id,
      ],
      classSkill("templar", "aedric-spear", "Radial Sweep").id
    ),
    backBar: bar(
      [
        classSkill("templar", "dawns-wrath", "Radiant Destruction").id,
        classSkill("templar", "restoring-light", "Rune Focus").id,
        classSkill("templar", "aedric-spear", "Piercing Javelin").id,
        weaponSkill("dual-wield", "Whirlwind").id,
        weaponSkill("fighters-guild", "Silver Bolts").id,
      ],
      weaponSkill("dual-wield", "Lacerate").id
    ),
    cp: {
      warfare: ["cp-master-at-arms", "cp-deadly-aim", "cp-thaumaturge", "cp-fighting-finesse"],
      fitness: ["cp-boundless-vitality", "cp-rejuvenation", "cp-celerity", "cp-fortified"],
      craft: ["cp-steeds-blessing", "cp-gifted-rider", "cp-plentiful-harvest", "cp-master-gatherer"],
    },
    mundusId: "mundus-shadow",
    foodId: "food-artaeum-takeaway-broth",
    guidance: [
      {
        platform: "all",
        title: "Ride the jabs",
        body: "Biting Jabs is the heartbeat of this build — keep the channel rolling and only clip it to refresh Sun Fire, Spear Shards, and Backlash. Deadly Strike supercharges both the jabs channel and your bleeds, so Twin Slashes is not filler; it is a real chunk of your damage. Swap to Radiant Oppression the instant the boss drops below execute range and let the beam finish the fight.",
      },
      {
        platform: "all",
        title: "Positioning for Spear Shards",
        body: "Drop Luminous Shards under the group when a stamina-hungry teammate needs resources — the synergy is free sustain for them and Minor Sorcery adjacency for you. As jabbed targets die, step through the vengeful souls Sul-Xan's Torment leaves behind for a Critical Chance and Critical Damage boost.",
      },
      {
        platform: "pc",
        title: "Uptime checks",
        body: "Combat Metrics will show your Biting Jabs uptime and how often Backlash detonated at full stacks — chase 90%+ before you touch your gear.",
        consoleAlternative:
          "On console, count your rhythm instead: three to four jabs, refresh a dot, back to jabs. If you never let the channel sit idle, your uptime is already where it should be.",
      },
    ],
  }),
  finalize({
    slug: "templar-solo",
    name: "Templar Solo Dawnkeeper",
    className: "templar",
    subclassLines: ["templar/aedric-spear", "templar/restoring-light", "templar/dawns-wrath"],
    role: "dps",
    contentType: "overland",
    gear: gearTemplate({
      bodySet: "set-orders-wrath",
      jewelrySet: "set-hundings-rage",
      monsterSet: "set-selene",
      bodyTrait: "Divines",
      jewelryTrait: "Bloodthirsty",
      weaponTraitFront: "Nirnhoned",
      weaponTraitBack: "Infused",
      weight: "medium",
    }),
    frontBar: bar(
      [
        classSkill("templar", "aedric-spear", "Puncturing Strikes").id,
        classSkill("templar", "dawns-wrath", "Sun Fire").id,
        classSkill("templar", "restoring-light", "Rushed Ceremony").id,
        classSkill("templar", "restoring-light", "Rune Focus").id,
        weaponSkill("two-handed", "Uppercut").id,
      ],
      classSkill("templar", "aedric-spear", "Radial Sweep").id
    ),
    backBar: bar(
      [
        classSkill("templar", "dawns-wrath", "Radiant Destruction").id,
        classSkill("templar", "restoring-light", "Cleansing Ritual").id,
        classSkill("templar", "aedric-spear", "Spear Shards").id,
        weaponSkill("two-handed", "Critical Charge").id,
        weaponSkill("fighters-guild", "Silver Bolts").id,
      ],
      weaponSkill("two-handed", "Berserker Strike").id
    ),
    mundusId: "mundus-shadow",
    foodId: "food-artaeum-takeaway-broth",
    cp: SOLO_CP,
    guidance: soloGuidance("templar", "Honor the Dead's burst heal and Cleansing Ritual's ground healing"),
  }),

  /* ---------------- Warden ---------------- */
  finalize({
    slug: "warden-trial-tank",
    name: "Warden Trial Off-Tank",
    className: "warden",
    subclassLines: ["warden/winters-embrace", "warden/animal-companions", "warden/green-balance"],
    role: "tank",
    contentType: "trial",
    gear: gearTemplate({
      bodySet: "set-claw-of-yolnahkriin",
      jewelrySet: "set-turning-tide",
      monsterSet: "set-tremorscale",
      bodyTrait: "Sturdy",
      jewelryTrait: "Infused",
      weaponTraitFront: "Infused",
      weaponTraitBack: "Infused",
      weight: "heavy",
    }),
    frontBar: bar(
      [
        weaponSkill("one-hand-and-shield", "Puncture").id,
        weaponSkill("one-hand-and-shield", "Low Slash").id,
        classSkill("warden", "winters-embrace", "Frost Cloak").id,
        classSkill("warden", "animal-companions", "Betty Netch").id,
        weaponSkill("undaunted", "Inner Fire").id,
      ],
      classSkill("warden", "winters-embrace", "Sleet Storm").id
    ),
    backBar: bar(
      [
        classSkill("warden", "winters-embrace", "Impaling Shards").id,
        classSkill("warden", "winters-embrace", "Arctic Wind").id,
        classSkill("warden", "green-balance", "Living Vines").id,
        weaponSkill("undaunted", "Blood Altar").id,
        weaponSkill("one-hand-and-shield", "Defensive Posture").id,
      ],
      weaponSkill("one-hand-and-shield", "Shield Wall").id
    ),
    cp: {
      warfare: ["cp-enduring-resolve", "cp-reinforced", "cp-swift-renewal", "cp-fighting-finesse"],
      fitness: ["cp-boundless-vitality", "cp-fortified", "cp-pains-refuge", "cp-rejuvenation"],
      craft: ["cp-steeds-blessing", "cp-gifted-rider", "cp-plentiful-harvest", "cp-master-gatherer"],
    },
    mundusId: "mundus-lady",
    foodId: "food-bewitched-sugar-skulls",
    guidance: [
      {
        platform: "all",
        title: "The buffing off-tank",
        body: "Warden brings tools the main tank cannot. Frost Cloak hands the group Major Resolve, Claw of Yolnahkriin layers Minor Courage on everyone through your taunts, and Gripping Shards pulls and roots trash so the DPS can burn it in one spot. Your Betty Netch keeps your own resources flowing without a slot tax. Take the adds and the buff duty; let the main tank hold the boss.",
      },
      {
        platform: "all",
        title: "Frost synergy",
        body: "In Winter's Embrace your ice abilities apply chill and empower your blocking. Keep Arctic Wind up as a self-heal and Living Vines rolling for a little group insurance during heavy add phases.",
      },
      {
        platform: "pc",
        title: "Buff uptime tools",
        body: "Srendarr or Bandits UI will confirm your Minor Courage and Major Resolve uptimes on the group — the whole point of this build is that those never drop.",
        consoleAlternative:
          "On console, re-cast Frost Cloak on a steady cadence just before it expires (watch the buff on the default group frames) and taunt on rhythm so Claw of Yolnahkriin's Minor Courage never lapses.",
      },
    ],
  }),
  finalize({
    slug: "warden-solo",
    name: "Warden Solo Wildstalker",
    className: "warden",
    subclassLines: ["warden/animal-companions", "warden/green-balance", "warden/winters-embrace"],
    role: "dps",
    contentType: "overland",
    gear: gearTemplate({
      bodySet: "set-mothers-sorrow",
      jewelrySet: "set-orders-wrath",
      monsterSet: "set-selene",
      bodyTrait: "Divines",
      jewelryTrait: "Bloodthirsty",
      weaponTraitFront: "Precise",
      weaponTraitBack: "Infused",
      weight: "medium",
    }),
    frontBar: bar(
      [
        classSkill("warden", "animal-companions", "Dive").id,
        classSkill("warden", "animal-companions", "Scorch").id,
        classSkill("warden", "animal-companions", "Betty Netch").id,
        classSkill("warden", "green-balance", "Fungal Growth").id,
        weaponSkill("two-handed", "Uppercut").id,
      ],
      classSkill("warden", "animal-companions", "Feral Guardian").id
    ),
    backBar: bar(
      [
        classSkill("warden", "winters-embrace", "Impaling Shards").id,
        classSkill("warden", "green-balance", "Living Vines").id,
        classSkill("warden", "winters-embrace", "Arctic Wind").id,
        weaponSkill("two-handed", "Critical Charge").id,
        weaponSkill("fighters-guild", "Silver Bolts").id,
      ],
      weaponSkill("two-handed", "Berserker Strike").id
    ),
    mundusId: "mundus-shadow",
    foodId: "food-artaeum-takeaway-broth",
    cp: SOLO_CP,
    guidance: soloGuidance("warden", "Arctic Wind's scaling self-heal and the grizzly's off-tank presence"),
  }),

  /* ---------------- Necromancer ---------------- */
  finalize({
    slug: "necromancer-trial-healer",
    name: "Necromancer Trial Healer",
    className: "necromancer",
    subclassLines: ["necromancer/living-death", "necromancer/bone-tyrant", "necromancer/grave-lord"],
    role: "healer",
    contentType: "trial",
    gear: gearTemplate({
      bodySet: "set-spell-power-cure",
      jewelrySet: "set-master-architect",
      monsterSet: "set-ozezan-the-inferno",
      bodyTrait: "Divines",
      jewelryTrait: "Arcane",
      weaponTraitFront: "Powered",
      weaponTraitBack: "Infused",
      weight: "light",
    }),
    frontBar: bar(
      [
        weaponSkill("restoration-staff", "Grand Healing").id,
        weaponSkill("restoration-staff", "Regeneration").id,
        classSkill("necromancer", "living-death", "Life amid Death").id,
        classSkill("necromancer", "living-death", "Spirit Mender").id,
        weaponSkill("restoration-staff", "Blessing of Protection").id,
      ],
      weaponSkill("restoration-staff", "Panacea").id
    ),
    backBar: bar(
      [
        classSkill("necromancer", "bone-tyrant", "Bone Totem").id,
        classSkill("necromancer", "living-death", "Render Flesh").id,
        classSkill("necromancer", "grave-lord", "Boneyard").id,
        weaponSkill("undaunted", "Blood Altar").id,
        weaponSkill("restoration-staff", "Steadfast Ward").id,
      ],
      classSkill("necromancer", "grave-lord", "Frozen Colossus").id
    ),
    cp: {
      warfare: ["cp-enlivening-overflow", "cp-swift-renewal", "cp-fighting-finesse", "cp-reinforced"],
      fitness: ["cp-boundless-vitality", "cp-rejuvenation", "cp-celerity", "cp-fortified"],
      craft: ["cp-steeds-blessing", "cp-gifted-rider", "cp-plentiful-harvest", "cp-master-gatherer"],
    },
    mundusId: "mundus-atronach",
    foodId: "food-ghastly-eye-bowl",
    guidance: [
      {
        platform: "all",
        title: "Heals that also debuff",
        body: "The Necromancer healer's trick is that its damage buttons pull double duty. Pestilent Colossus is both a group ultimate and a Major Vulnerability debuff that raises everyone's damage, and Avid Boneyard drops a synergy plus Major Breach. Keep Combustion (Life amid Death) and your Spirit Guardian rolling for passive healing, then spend globals stacking those debuffs so the DPS melt the boss faster.",
      },
      {
        platform: "all",
        title: "Corpse economy",
        body: "Several of your best tools consume corpses. In heavy add pulls you will have plenty; on single-target fights, plan Render Flesh and Life amid Death around when a corpse is actually available so you are never caught without your heal.",
      },
      {
        platform: "pc",
        title: "Debuff tracking",
        body: "Bandits UI or Foundry Tactical Combat lets you confirm Major Vulnerability and Major Breach uptime — the group's damage depends on you holding both.",
        consoleAlternative:
          "On console, tie your debuffs to the fight's rhythm: Colossus on cooldown for Major Vulnerability, Boneyard refreshed as it fades. If both are basically always down, the group is getting the buff.",
      },
    ],
  }),
  finalize({
    slug: "necromancer-solo",
    name: "Necromancer Solo Graverobber",
    className: "necromancer",
    subclassLines: ["necromancer/grave-lord", "necromancer/bone-tyrant", "necromancer/living-death"],
    role: "dps",
    contentType: "overland",
    gear: gearTemplate({
      bodySet: "set-mothers-sorrow",
      jewelrySet: "set-orders-wrath",
      monsterSet: "set-selene",
      bodyTrait: "Divines",
      jewelryTrait: "Bloodthirsty",
      weaponTraitFront: "Precise",
      weaponTraitBack: "Infused",
      weight: "light",
    }),
    frontBar: bar(
      [
        classSkill("necromancer", "grave-lord", "Flame Skull").id,
        classSkill("necromancer", "grave-lord", "Boneyard").id,
        classSkill("necromancer", "grave-lord", "Sacrificial Bones").id,
        classSkill("necromancer", "bone-tyrant", "Bone Armor").id,
        weaponSkill("destruction-staff", "Force Shock").id,
      ],
      classSkill("necromancer", "grave-lord", "Frozen Colossus").id
    ),
    backBar: bar(
      [
        classSkill("necromancer", "living-death", "Life amid Death").id,
        classSkill("necromancer", "living-death", "Spirit Mender").id,
        classSkill("necromancer", "bone-tyrant", "Death Scythe").id,
        weaponSkill("destruction-staff", "Wall of Elements").id,
        weaponSkill("mages-guild", "Magelight").id,
      ],
      classSkill("necromancer", "bone-tyrant", "Bone Goliath Transformation").id
    ),
    mundusId: "mundus-thief",
    foodId: "food-bewitched-sugar-skulls",
    cp: SOLO_CP,
    guidance: soloGuidance("necromancer", "Spirit Guardian's passive healing and Bone Goliath's panic-button health"),
  }),

  /* ---------------- Arcanist ---------------- */
  finalize({
    slug: "arcanist-trial-dps",
    name: "Arcanist Trial Beam DPS",
    className: "arcanist",
    subclassLines: ["arcanist/herald-of-the-tome", "arcanist/soldier-of-apocrypha", "arcanist/curative-runeforms"],
    role: "dps",
    contentType: "trial",
    gear: gearTemplate({
      bodySet: "set-ansuuls-torment",
      jewelrySet: "set-sul-xans-torment",
      monsterSet: "set-slimecraw",
      bodyTrait: "Divines",
      jewelryTrait: "Bloodthirsty",
      weaponTraitFront: "Precise",
      weaponTraitBack: "Infused",
      weight: "light",
    }),
    frontBar: bar(
      [
        classSkill("arcanist", "herald-of-the-tome", "Fatecarver").id,
        classSkill("arcanist", "herald-of-the-tome", "Runeblades").id,
        classSkill("arcanist", "herald-of-the-tome", "Abyssal Impact").id,
        classSkill("arcanist", "soldier-of-apocrypha", "Runic Jolt").id,
        weaponSkill("destruction-staff", "Force Shock").id,
      ],
      classSkill("arcanist", "herald-of-the-tome", "The Unblinking Eye").id
    ),
    backBar: bar(
      [
        classSkill("arcanist", "curative-runeforms", "Remedy Cascade").id,
        classSkill("arcanist", "soldier-of-apocrypha", "Fatewoven Armor").id,
        classSkill("arcanist", "soldier-of-apocrypha", "Runespite Ward").id,
        weaponSkill("destruction-staff", "Wall of Elements").id,
        weaponSkill("mages-guild", "Magelight").id,
      ],
      weaponSkill("destruction-staff", "Elemental Storm").id
    ),
    cp: {
      warfare: ["cp-master-at-arms", "cp-deadly-aim", "cp-thaumaturge", "cp-fighting-finesse"],
      fitness: ["cp-boundless-vitality", "cp-rejuvenation", "cp-celerity", "cp-fortified"],
      craft: ["cp-steeds-blessing", "cp-gifted-rider", "cp-plentiful-harvest", "cp-master-gatherer"],
    },
    mundusId: "mundus-thief",
    foodId: "food-ghastly-eye-bowl",
    guidance: [
      {
        platform: "all",
        title: "Crux is your rhythm",
        body: "Everything orbits Crux. Runeblades and Runic Jolt generate it; Pragmatic Fatecarver spends three stacks for its full channel. The clean loop is: build three Crux, then unload the beam. Do not fire Fatecarver dry — a no-Crux beam is a big damage loss. Abyssal Impact keeps your Abyssal Ink debuff and your dots ticking between beams.",
      },
      {
        platform: "all",
        title: "Beam positioning",
        body: "Fatecarver is a long line — angle it through the boss and any adds so every tick lands on multiple targets. Ansuul's Torment rewards the cast-time pressure this channel provides, and the vengeful souls Sul-Xan's Torment drops are easy to scoop up as adds die around you.",
      },
      {
        platform: "pc",
        title: "Crux and uptime checks",
        body: "Combat Metrics shows how often you channelled Fatecarver at full Crux versus wasting a cast — that ratio is the single biggest lever on an Arcanist parse.",
        consoleAlternative:
          "On console, watch the Crux pips above your class bar: never start the beam until all three are lit, and you have captured most of the available damage without any addon.",
      },
    ],
  }),
  finalize({
    slug: "arcanist-solo",
    name: "Arcanist Solo Apocrypha Warden",
    className: "arcanist",
    subclassLines: ["arcanist/herald-of-the-tome", "arcanist/soldier-of-apocrypha", "arcanist/curative-runeforms"],
    role: "dps",
    contentType: "overland",
    gear: gearTemplate({
      bodySet: "set-mothers-sorrow",
      jewelrySet: "set-orders-wrath",
      monsterSet: "set-selene",
      bodyTrait: "Divines",
      jewelryTrait: "Bloodthirsty",
      weaponTraitFront: "Precise",
      weaponTraitBack: "Infused",
      weight: "light",
    }),
    frontBar: bar(
      [
        classSkill("arcanist", "herald-of-the-tome", "Runeblades").id,
        classSkill("arcanist", "herald-of-the-tome", "Fatecarver").id,
        classSkill("arcanist", "soldier-of-apocrypha", "Runic Jolt").id,
        classSkill("arcanist", "curative-runeforms", "Remedy Cascade").id,
        weaponSkill("destruction-staff", "Force Shock").id,
      ],
      classSkill("arcanist", "herald-of-the-tome", "The Unblinking Eye").id
    ),
    backBar: bar(
      [
        classSkill("arcanist", "soldier-of-apocrypha", "Runespite Ward").id,
        classSkill("arcanist", "soldier-of-apocrypha", "Fatewoven Armor").id,
        classSkill("arcanist", "herald-of-the-tome", "Abyssal Impact").id,
        weaponSkill("destruction-staff", "Wall of Elements").id,
        weaponSkill("mages-guild", "Magelight").id,
      ],
      weaponSkill("destruction-staff", "Elemental Storm").id
    ),
    mundusId: "mundus-thief",
    foodId: "food-bewitched-sugar-skulls",
    cp: SOLO_CP,
    guidance: soloGuidance("arcanist", "Remedy Cascade's channel healing and Runespite Ward's damage shield"),
  }),
];

export const builds: Build[] = [...generatedBuilds, ...authoredBuilds];

export const buildBySlug = new Map(builds.map((b) => [b.slug, b]));
