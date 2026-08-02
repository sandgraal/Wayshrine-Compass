import type {
  Build,
  ClassName,
  GearAssignment,
  GuidanceBlock,
  Role,
  Skill,
} from "@/lib/types";
import { ALL_CLASSES } from "@/lib/types";
import { skills } from "./skills";

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

/** Hand-assigned review states so the freshness pipeline has real work to show. */
const PATCH_VERIFIED_OVERRIDES: Record<string, string> = {
  "sorcerer-dps": "U49", // Crystal Fragments changed in U50 → needs review
  "arcanist-dps": "U49", // Fatecarver changed in U50 → needs review
  "warden-dps": "U49", // Whorl of the Depths changed in U50 → needs review
  "necromancer-tank": "U48", // two patches behind → stale
  "warden-leveling": "U48", // two patches behind → stale
};

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
      bodySet: "set-julianos",
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
  const patchVerified = PATCH_VERIFIED_OVERRIDES[partial.slug] ?? "U50";
  return {
    ...partial,
    id: `build-${partial.slug}`,
    author: "Wayshrine Compass Team",
    status: "verified", // stored status; display status is computed from provenance
    patchVerified,
    needsReviewReasons: [],
  };
}

export const builds: Build[] = ALL_CLASSES.flatMap((c) => [
  makeDps(c),
  makeTank(c),
  makeHealer(c),
  makeLeveling(c),
]);

export const buildBySlug = new Map(builds.map((b) => [b.slug, b]));
