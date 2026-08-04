import type { ClassName, Skill } from "@/lib/types";

function sk(
  className: ClassName | null,
  line: string,
  lineLabel: string,
  name: string,
  opts: {
    ult?: boolean;
    desc: string;
    morphs: [string, string];
    patch?: { first?: string; last?: string };
  }
): Skill {
  const slug = name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return {
    id: `skill-${className ?? "weapon"}-${line}-${slug}`,
    className,
    line,
    lineLabel,
    name,
    ultimate: opts.ult ?? false,
    description: opts.desc,
    morphs: [
      { name: opts.morphs[0], description: `${name} morph: ${opts.morphs[0]}.` },
      { name: opts.morphs[1], description: `${name} morph: ${opts.morphs[1]}.` },
    ],
    firstSeenPatch: opts.patch?.first ?? "U48",
    lastChangedPatch: opts.patch?.last ?? "U48",
  };
}

export const skills: Skill[] = [
  /* ---------------- Dragonknight ---------------- */
  sk("dragonknight", "ardent-flame", "Ardent Flame", "Dragonknight Standard", { ult: true, desc: "Call down a battle standard, dealing flame damage over time in the area.", morphs: ["Shifting Standard", "Standard of Might"] }),
  // Class Mastery (U50) retuned each class's primary spammable — reflected in provenance so builds slotting it read as needs-review.
  sk("dragonknight", "ardent-flame", "Ardent Flame", "Lava Whip", { desc: "Lash an enemy with flame, dealing flame damage.", morphs: ["Molten Whip", "Flame Lash"], patch: { last: "U50" } }),
  sk("dragonknight", "ardent-flame", "Ardent Flame", "Searing Strike", { desc: "Slash an enemy, dealing flame damage over time.", morphs: ["Venomous Claw", "Burning Embers"] }),
  // Pre-U50 entries retained so the ingest rename-detection tests (diff.test.ts)
  // have their fixtures: the U50 dataset renamed/removed these four, and no build
  // references them — the generated builds slot the current successors above.
  sk("dragonknight", "ardent-flame", "Ardent Flame", "Fiery Breath", { desc: "Exhale flame in a cone, dealing damage over time.", morphs: ["Noxious Breath", "Engulfing Flames"] }),
  sk("dragonknight", "draconic-power", "Draconic Power", "Dragon Leap", { ult: true, desc: "Launch to an enemy, knocking back and stunning nearby foes.", morphs: ["Take Flight", "Ferocious Leap"] }),
  sk("dragonknight", "draconic-power", "Draconic Power", "Chains of Flame", { desc: "Conjure fiery chains to yank a distant enemy to you.", morphs: ["Chains of Devastation", "Chains of Dominance"] }),
  sk("dragonknight", "draconic-power", "Draconic Power", "Dark Talons", { desc: "Immobilize nearby enemies with flame talons.", morphs: ["Burning Talons", "Choking Talons"] }),
  sk("dragonknight", "draconic-power", "Draconic Power", "Dragon Blood", { desc: "Heal yourself based on your missing Health.", morphs: ["Green Dragon Blood", "Coagulating Blood"] }),
  sk("dragonknight", "draconic-power", "Draconic Power", "Spiked Armor", { desc: "Gain Major Resolve and return damage to melee attackers.", morphs: ["Hardened Armor", "Volatile Armor"] }), // retained pre-U50 fixture; unreferenced
  sk("dragonknight", "earthen-heart", "Earthen Heart", "Magma Armor", { ult: true, desc: "Limit incoming damage and deal flame damage to nearby enemies.", morphs: ["Magma Shell", "Corrosive Armor"] }),
  sk("dragonknight", "earthen-heart", "Earthen Heart", "Molten Weapons", { desc: "Empower your weapons, granting you and nearby allies increased Weapon and Spell Damage.", morphs: ["Igneous Weapons", "Molten Armaments"] }),
  sk("dragonknight", "earthen-heart", "Earthen Heart", "Obsidian Shield", { desc: "Shield yourself and nearby allies.", morphs: ["Igneous Shield", "Fragmented Shield"] }),
  sk("dragonknight", "earthen-heart", "Earthen Heart", "Petrify", { desc: "Encase an enemy in stone, stunning them.", morphs: ["Fossilize", "Shattering Rocks"] }),
  sk("dragonknight", "earthen-heart", "Earthen Heart", "Stonefist", { desc: "Crush an enemy with stone, dealing physical damage.", morphs: ["Stone Giant", "Obsidian Shard"] }), // retained pre-U50 fixture; unreferenced

  /* ---------------- Sorcerer ---------------- */
  sk("sorcerer", "dark-magic", "Dark Magic", "Negate Magic", { ult: true, desc: "Create a globe of magic suppression, silencing and stunning enemies inside.", morphs: ["Suppression Field", "Absorption Field"] }),
  sk("sorcerer", "dark-magic", "Dark Magic", "Crystal Shard", { desc: "Conjure a crystal shard to strike an enemy.", morphs: ["Crystal Fragments", "Crystal Weapon"], patch: { last: "U50" } }),
  sk("sorcerer", "dark-magic", "Dark Magic", "Encase", { desc: "Immobilize enemies in front of you with dark restraints.", morphs: ["Shattering Prison", "Vibrant Shroud"] }),
  sk("sorcerer", "dark-magic", "Dark Magic", "Dark Exchange", { desc: "Convert one resource into Health and another resource.", morphs: ["Dark Deal", "Dark Conversion"] }),
  sk("sorcerer", "daedric-summoning", "Daedric Summoning", "Summon Storm Atronach", { ult: true, desc: "Summon an immobile storm atronach that zaps enemies.", morphs: ["Greater Storm Atronach", "Summon Charged Atronach"] }),
  sk("sorcerer", "daedric-summoning", "Daedric Summoning", "Daedric Curse", { desc: "Curse an enemy; it explodes after a delay.", morphs: ["Daedric Prey", "Haunting Curse"] }),
  sk("sorcerer", "daedric-summoning", "Daedric Summoning", "Summon Unstable Familiar", { desc: "Summon a clannfear-like familiar to fight for you.", morphs: ["Summon Unstable Clannfear", "Summon Volatile Familiar"] }),
  sk("sorcerer", "daedric-summoning", "Daedric Summoning", "Conjured Ward", { desc: "Shield yourself and your pets.", morphs: ["Hardened Ward", "Empowered Ward"] }),
  sk("sorcerer", "storm-calling", "Storm Calling", "Overload", { ult: true, desc: "Charge your attacks with lightning, replacing light and heavy attacks.", morphs: ["Power Overload", "Energy Overload"] }),
  sk("sorcerer", "storm-calling", "Storm Calling", "Mages' Fury", { desc: "Strike an enemy with lightning; executes low-health targets.", morphs: ["Mages' Wrath", "Endless Fury"] }),
  sk("sorcerer", "storm-calling", "Storm Calling", "Lightning Form", { desc: "Wreath yourself in lightning, gaining resistances and dealing area damage.", morphs: ["Hurricane", "Boundless Storm"] }),
  sk("sorcerer", "storm-calling", "Storm Calling", "Surge", { desc: "Gain Major Brutality/Sorcery; critical hits heal you.", morphs: ["Power Surge", "Critical Surge"] }),
  sk("sorcerer", "storm-calling", "Storm Calling", "Bolt Escape", { desc: "Flash a short distance in a burst of lightning, stunning enemies where you land.", morphs: ["Streak", "Ball of Lightning"] }),

  /* ---------------- Nightblade ---------------- */
  sk("nightblade", "assassination", "Assassination", "Death Stroke", { ult: true, desc: "Strike an enemy, increasing your damage against them.", morphs: ["Incapacitating Strike", "Soul Harvest"] }),
  sk("nightblade", "assassination", "Assassination", "Assassin's Blade", { desc: "Execute attack dealing massive damage to low-health enemies.", morphs: ["Killer's Blade", "Impale"], patch: { last: "U50" } }),
  sk("nightblade", "assassination", "Assassination", "Teleport Strike", { desc: "Flash to an enemy and strike them.", morphs: ["Lotus Fan", "Ambush"] }),
  sk("nightblade", "assassination", "Assassination", "Grim Focus", { desc: "Stack light and heavy attacks to fire a spectral bow proc.", morphs: ["Relentless Focus", "Merciless Resolve"] }),
  sk("nightblade", "shadow", "Shadow", "Consuming Darkness", { ult: true, desc: "Create an area of shadow that reduces enemy damage and lets allies slip into it.", morphs: ["Bolstering Darkness", "Veil of Blades"] }),
  sk("nightblade", "shadow", "Shadow", "Shadow Cloak", { desc: "Vanish from sight for a short time.", morphs: ["Shadowy Disguise", "Dark Cloak"] }),
  sk("nightblade", "shadow", "Shadow", "Blur", { desc: "Blur your form, gaining evasion against incoming area attacks.", morphs: ["Mirage", "Phantasmal Escape"] }),
  sk("nightblade", "shadow", "Shadow", "Path of Darkness", { desc: "Create a path that speeds and heals allies.", morphs: ["Twisting Path", "Refreshing Path"] }),
  sk("nightblade", "shadow", "Shadow", "Veiled Strike", { desc: "Strike from stealth to stun and set off balance.", morphs: ["Surprise Attack", "Concealed Weapon"] }), // retained pre-U50 fixture; unreferenced
  sk("nightblade", "siphoning", "Siphoning", "Soul Shred", { ult: true, desc: "Damage and stun nearby enemies; allies can synergize to heal.", morphs: ["Soul Siphon", "Soul Tether"] }),
  sk("nightblade", "siphoning", "Siphoning", "Strife", { desc: "Deal magic damage and heal yourself or an ally for a portion.", morphs: ["Funnel Health", "Swallow Soul"] }),
  sk("nightblade", "siphoning", "Siphoning", "Cripple", { desc: "Sap an enemy's speed and deal magic damage over time.", morphs: ["Debilitate", "Crippling Grasp"] }),
  sk("nightblade", "siphoning", "Siphoning", "Siphoning Strikes", { desc: "Your attacks restore resources.", morphs: ["Leeching Strikes", "Siphoning Attacks"] }),

  /* ---------------- Templar ---------------- */
  sk("templar", "aedric-spear", "Aedric Spear", "Radial Sweep", { ult: true, desc: "Swing your spear around you, damaging nearby enemies.", morphs: ["Empowering Sweep", "Crescent Sweep"] }),
  sk("templar", "aedric-spear", "Aedric Spear", "Puncturing Strikes", { desc: "Channel a flurry of spear jabs in front of you.", morphs: ["Biting Jabs", "Puncturing Sweep"], patch: { last: "U50" } }),
  sk("templar", "aedric-spear", "Aedric Spear", "Spear Shards", { desc: "Throw a spear into an area; allies can synergize for resources.", morphs: ["Luminous Shards", "Blazing Spear"] }),
  sk("templar", "aedric-spear", "Aedric Spear", "Piercing Javelin", { desc: "Hurl a javelin that knocks an enemy back.", morphs: ["Aurora Javelin", "Binding Javelin"] }),
  sk("templar", "dawns-wrath", "Dawn's Wrath", "Nova", { ult: true, desc: "Call down a fragment of the sun, crushing enemies in the area.", morphs: ["Solar Prison", "Solar Disturbance"] }),
  sk("templar", "dawns-wrath", "Dawn's Wrath", "Sun Fire", { desc: "Deal flame damage and snare an enemy.", morphs: ["Vampire's Bane", "Reflective Light"] }),
  sk("templar", "dawns-wrath", "Dawn's Wrath", "Backlash", { desc: "Mark an enemy, then detonate stored damage.", morphs: ["Purifying Light", "Power of the Light"] }),
  sk("templar", "dawns-wrath", "Dawn's Wrath", "Radiant Destruction", { desc: "Channel a beam that executes low-health enemies.", morphs: ["Radiant Glory", "Radiant Oppression"] }),
  sk("templar", "restoring-light", "Restoring Light", "Rite of Passage", { ult: true, desc: "Channel a powerful area heal.", morphs: ["Remembrance", "Practiced Incantation"] }),
  sk("templar", "restoring-light", "Restoring Light", "Rushed Ceremony", { desc: "Instantly heal a wounded ally.", morphs: ["Breath of Life", "Honor the Dead"] }),
  sk("templar", "restoring-light", "Restoring Light", "Cleansing Ritual", { desc: "Purge effects and heal in an area over time.", morphs: ["Extended Ritual", "Ritual of Retribution"] }),
  sk("templar", "restoring-light", "Restoring Light", "Rune Focus", { desc: "Create a rune that grants you resistances; stand inside to heal.", morphs: ["Channeled Focus", "Restoring Focus"] }),

  /* ---------------- Warden ---------------- */
  sk("warden", "animal-companions", "Animal Companions", "Feral Guardian", { ult: true, desc: "Summon a grizzly to fight at your side.", morphs: ["Eternal Guardian", "Wild Guardian"] }),
  sk("warden", "animal-companions", "Animal Companions", "Dive", { desc: "Command a cliff racer to dive-bomb an enemy.", morphs: ["Cutting Dive", "Screaming Cliff Racer"], patch: { last: "U50" } }),
  sk("warden", "animal-companions", "Animal Companions", "Scorch", { desc: "Shalk erupt from the ground after a delay, damaging enemies.", morphs: ["Subterranean Assault", "Deep Fissure"] }),
  sk("warden", "animal-companions", "Animal Companions", "Betty Netch", { desc: "Summon a netch that restores resources and grants Major buffs.", morphs: ["Blue Betty", "Bull Netch"] }),
  sk("warden", "green-balance", "Green Balance", "Secluded Grove", { ult: true, desc: "Grow a healing forest in an area.", morphs: ["Enchanted Forest", "Healing Thicket"] }),
  sk("warden", "green-balance", "Green Balance", "Fungal Growth", { desc: "Heal allies in a cone in front of you.", morphs: ["Enchanted Growth", "Soothing Spores"] }),
  sk("warden", "green-balance", "Green Balance", "Healing Seed", { desc: "Plant a flower that blooms into a burst heal.", morphs: ["Budding Seeds", "Corrupting Pollen"] }),
  sk("warden", "green-balance", "Green Balance", "Living Vines", { desc: "Vines heal the lowest-health target over time.", morphs: ["Leeching Vines", "Living Trellis"] }),
  sk("warden", "winters-embrace", "Winter's Embrace", "Sleet Storm", { ult: true, desc: "Surround yourself with a blizzard that damages and protects.", morphs: ["Northern Storm", "Permafrost"] }),
  sk("warden", "winters-embrace", "Winter's Embrace", "Impaling Shards", { desc: "Ice shards damage and snare enemies around you.", morphs: ["Gripping Shards", "Winter's Revenge"] }),
  sk("warden", "winters-embrace", "Winter's Embrace", "Arctic Wind", { desc: "Heal yourself and chill nearby enemies.", morphs: ["Polar Wind", "Arctic Blast"] }),
  sk("warden", "winters-embrace", "Winter's Embrace", "Frost Cloak", { desc: "Grant Major Resolve to yourself and allies.", morphs: ["Expansive Frost Cloak", "Ice Fortress"] }),

  /* ---------------- Necromancer ---------------- */
  sk("necromancer", "grave-lord", "Grave Lord", "Frozen Colossus", { ult: true, desc: "Summon a colossus that smashes the area and applies Major Vulnerability.", morphs: ["Pestilent Colossus", "Glacial Colossus"] }),
  sk("necromancer", "grave-lord", "Grave Lord", "Flame Skull", { desc: "Lob an explosive skull; every third cast hits harder.", morphs: ["Venom Skull", "Ricochet Skull"], patch: { last: "U50" } }),
  // Renamed from Blastbones in the U50 dataset; id must match the datamined
  // skill-necromancer-grave-lord-sacrificial-bones so builds stay resolvable.
  sk("necromancer", "grave-lord", "Grave Lord", "Sacrificial Bones", { desc: "Summon a skeleton that leaps to you, empowering your necromancy.", morphs: ["Blighted Blastbones", "Grave Lord's Sacrifice"], patch: { last: "U49" } }),
  sk("necromancer", "grave-lord", "Grave Lord", "Boneyard", { desc: "Desecrate the ground, dealing frost damage over time.", morphs: ["Unnerving Boneyard", "Avid Boneyard"] }),
  sk("necromancer", "bone-tyrant", "Bone Tyrant", "Bone Goliath Transformation", { ult: true, desc: "Become a bone goliath, massively increasing Health.", morphs: ["Pummeling Goliath", "Ravenous Goliath"] }),
  sk("necromancer", "bone-tyrant", "Bone Tyrant", "Death Scythe", { desc: "Sweep enemies in front of you, healing per target hit.", morphs: ["Ruinous Scythe", "Hungry Scythe"] }),
  sk("necromancer", "bone-tyrant", "Bone Tyrant", "Bone Armor", { desc: "Gain Major Resolve and summon protective bone armor.", morphs: ["Beckoning Armor", "Summoner's Armor"] }),
  sk("necromancer", "bone-tyrant", "Bone Tyrant", "Bone Totem", { desc: "Place a totem that fears and protects.", morphs: ["Remote Totem", "Agony Totem"] }),
  sk("necromancer", "living-death", "Living Death", "Reanimate", { ult: true, desc: "Resurrect up to three fallen allies.", morphs: ["Renewing Animation", "Animate Blastbones"] }),
  sk("necromancer", "living-death", "Living Death", "Render Flesh", { desc: "Sacrifice your wellbeing to heal a target.", morphs: ["Resistant Flesh", "Blood Sacrifice"] }),
  sk("necromancer", "living-death", "Living Death", "Life amid Death", { desc: "Area burst heal that can consume a corpse to extend.", morphs: ["Renewing Undeath", "Enduring Undeath"] }),
  sk("necromancer", "living-death", "Living Death", "Spirit Mender", { desc: "Summon a ghost that heals you or an ally.", morphs: ["Spirit Guardian", "Intensive Mender"] }),

  /* ---------------- Arcanist ---------------- */
  sk("arcanist", "herald-of-the-tome", "Herald of the Tome", "The Unblinking Eye", { ult: true, desc: "Summon a scion of Hermaeus Mora that beams enemies; can be repositioned.", morphs: ["The Tide King's Gaze", "The Languid Eye"] }),
  sk("arcanist", "herald-of-the-tome", "Herald of the Tome", "Runeblades", { desc: "Fling spectral runeblades; generates Crux.", morphs: ["Writhing Runeblades", "Escalating Runeblades"], patch: { last: "U50" } }),
  sk("arcanist", "herald-of-the-tome", "Herald of the Tome", "Fatecarver", { desc: "Channel a beam of pure fate energy; consumes Crux for power.", morphs: ["Pragmatic Fatecarver", "Exhausting Fatecarver"], patch: { last: "U50" } }),
  sk("arcanist", "herald-of-the-tome", "Herald of the Tome", "Abyssal Impact", { desc: "Tentacles strike in a line, applying Abyssal Ink.", morphs: ["Cephaliarch's Flail", "Tentacular Dread"] }),
  sk("arcanist", "soldier-of-apocrypha", "Soldier of Apocrypha", "Gibbering Shield", { ult: true, desc: "Absorb damage and release it back as an explosion.", morphs: ["Sanctum of the Abyssal Sea", "Gibbering Shelter"] }),
  sk("arcanist", "soldier-of-apocrypha", "Soldier of Apocrypha", "Runic Jolt", { desc: "Taunt and damage an enemy; generates Crux.", morphs: ["Runic Sunder", "Runic Embrace"] }),
  sk("arcanist", "soldier-of-apocrypha", "Soldier of Apocrypha", "Runespite Ward", { desc: "Shield yourself; consumes Crux to strengthen.", morphs: ["Spiteward of the Lucid Mind", "Impervious Runeward"] }),
  sk("arcanist", "soldier-of-apocrypha", "Soldier of Apocrypha", "Fatewoven Armor", { desc: "Gain Major Resolve; attackers are afflicted.", morphs: ["Cruxweaver Armor", "Unbreakable Fate"] }),
  sk("arcanist", "curative-runeforms", "Curative Runeforms", "Vitalizing Glyphic", { ult: true, desc: "Summon a glyphic that heals allies and empowers them.", morphs: ["Glyphic of the Tides", "Resonating Glyphic"] }),
  sk("arcanist", "curative-runeforms", "Curative Runeforms", "Runemend", { desc: "Heal a target with sequential runes; generates Crux.", morphs: ["Evolving Runemend", "Audacious Runemend"] }),
  sk("arcanist", "curative-runeforms", "Curative Runeforms", "Remedy Cascade", { desc: "Channel a beam of restorative energy in a line.", morphs: ["Cascading Fortune", "Curative Surge"] }),
  sk("arcanist", "curative-runeforms", "Curative Runeforms", "Chakram Shields", { desc: "Shield up to six allies; consumes Crux.", morphs: ["Chakram of Destiny", "Tidal Chakram"] }),

  /* ---------------- Weapon lines ---------------- */
  sk(null, "destruction-staff", "Destruction Staff", "Elemental Storm", { ult: true, desc: "Call an elemental tempest over an area.", morphs: ["Elemental Rage", "Eye of the Storm"] }),
  sk(null, "destruction-staff", "Destruction Staff", "Force Shock", { desc: "Fire a bolt of elemental force.", morphs: ["Crushing Shock", "Force Pulse"] }),
  sk(null, "destruction-staff", "Destruction Staff", "Wall of Elements", { desc: "Create an elemental wall on the ground in front of you.", morphs: ["Unstable Wall of Elements", "Elemental Blockade"] }),
  sk(null, "destruction-staff", "Destruction Staff", "Destructive Touch", { desc: "Devastate an enemy at close range with elemental damage.", morphs: ["Destructive Clench", "Destructive Reach"] }),
  sk(null, "restoration-staff", "Restoration Staff", "Panacea", { ult: true, desc: "Channel restoration magic into a powerful burst heal.", morphs: ["Life Giver", "Light's Champion"] }),
  sk(null, "restoration-staff", "Restoration Staff", "Grand Healing", { desc: "Heal allies in an area.", morphs: ["Illustrious Healing", "Healing Springs"] }),
  sk(null, "restoration-staff", "Restoration Staff", "Regeneration", { desc: "Heal targets over time.", morphs: ["Rapid Regeneration", "Radiating Regeneration"] }),
  sk(null, "restoration-staff", "Restoration Staff", "Steadfast Ward", { desc: "Shield the lowest-health ally.", morphs: ["Ward Ally", "Healing Ward"] }),
  sk(null, "restoration-staff", "Restoration Staff", "Blessing of Protection", { desc: "Heal and protect allies in front of you.", morphs: ["Blessing of Restoration", "Combat Prayer"] }),
  sk(null, "dual-wield", "Dual Wield", "Lacerate", { ult: true, desc: "Slash enemies around you, causing bleeding.", morphs: ["Rend", "Thrive in Chaos"] }),
  sk(null, "dual-wield", "Dual Wield", "Flurry", { desc: "Unleash a rapid series of strikes.", morphs: ["Rapid Strikes", "Bloodthirst"] }),
  sk(null, "dual-wield", "Dual Wield", "Twin Slashes", { desc: "Slice an enemy, causing bleed damage over time.", morphs: ["Rending Slashes", "Blood Craze"] }),
  sk(null, "dual-wield", "Dual Wield", "Whirlwind", { desc: "Spin in a circle of blades, damaging nearby enemies.", morphs: ["Whirling Blades", "Steel Tornado"] }),
  sk(null, "two-handed", "Two Handed", "Berserker Strike", { ult: true, desc: "Massive strike that ignores Armor.", morphs: ["Onslaught", "Berserker Rage"] }),
  sk(null, "two-handed", "Two Handed", "Uppercut", { desc: "Wind up a devastating overhead swing.", morphs: ["Dizzying Swing", "Wrecking Blow"] }),
  sk(null, "two-handed", "Two Handed", "Critical Charge", { desc: "Charge an enemy with a guaranteed critical strike.", morphs: ["Stampede", "Critical Rush"] }),
  sk(null, "bow", "Bow", "Rapid Fire", { ult: true, desc: "Channel a hail of arrows into a single target.", morphs: ["Toxic Barrage", "Ballista"] }),
  sk(null, "bow", "Bow", "Snipe", { desc: "Long-range precise shot.", morphs: ["Lethal Arrow", "Focused Aim"] }),
  sk(null, "bow", "Bow", "Volley", { desc: "Rain arrows on an area.", morphs: ["Endless Hail", "Arrow Barrage"] }),
  sk(null, "one-hand-and-shield", "One Hand and Shield", "Shield Wall", { ult: true, desc: "Block all attacks for a short duration at no cost.", morphs: ["Spell Wall", "Shield Discipline"] }),
  sk(null, "one-hand-and-shield", "One Hand and Shield", "Puncture", { desc: "Taunt an enemy and reduce their Armor.", morphs: ["Pierce Armor", "Ransack"] }),
  sk(null, "one-hand-and-shield", "One Hand and Shield", "Low Slash", { desc: "Slash an enemy's legs, applying Minor Maim.", morphs: ["Deep Slash", "Heroic Slash"] }),
  sk(null, "one-hand-and-shield", "One Hand and Shield", "Defensive Posture", { desc: "Improve your blocking and reflect the next projectile.", morphs: ["Defensive Stance", "Absorb Missile"] }),

  /* ---------------- Guild lines ---------------- */
  sk(null, "fighters-guild", "Fighters Guild", "Dawnbreaker", { ult: true, desc: "Smite enemies in front of you with the Dawnbreaker.", morphs: ["Flawless Dawnbreaker", "Dawnbreaker of Smiting"] }),
  sk(null, "fighters-guild", "Fighters Guild", "Silver Bolts", { desc: "Fire a crossbow bolt effective against undead and daedra.", morphs: ["Silver Shards", "Silver Leash"] }),
  sk(null, "fighters-guild", "Fighters Guild", "Circle of Protection", { desc: "Ward an area, reducing damage taken inside.", morphs: ["Turn Evil", "Ring of Preservation"] }),
  sk(null, "mages-guild", "Mages Guild", "Meteor", { ult: true, desc: "Call a meteor down on an area.", morphs: ["Ice Comet", "Shooting Star"] }),
  sk(null, "mages-guild", "Mages Guild", "Magelight", { desc: "Reveal stealthed enemies and gain Critical Chance.", morphs: ["Inner Light", "Radiant Magelight"] }),
  sk(null, "mages-guild", "Mages Guild", "Entropy", { desc: "Sap an enemy's health over time and empower yourself.", morphs: ["Degeneration", "Structured Entropy"] }),
  sk(null, "undaunted", "Undaunted", "Blood Altar", { desc: "Place an altar that lets allies siphon health.", morphs: ["Sanguine Altar", "Overflowing Altar"] }),
  sk(null, "undaunted", "Undaunted", "Inner Fire", { desc: "Ranged taunt that forces an enemy to attack you.", morphs: ["Inner Rage", "Inner Beast"] }),
  sk(null, "psijic-order", "Psijic Order", "Time Stop", { desc: "Slow, then freeze, enemies in an area.", morphs: ["Borrowed Time", "Time Freeze"] }),
  sk(null, "psijic-order", "Psijic Order", "Accelerate", { desc: "Gain Minor Force and movement speed.", morphs: ["Channeled Acceleration", "Race Against Time"] }),
];

/** Lookup helpers used across the app. */
export const skillById = new Map(skills.map((s) => [s.id, s]));

export function classSkills(className: ClassName): Skill[] {
  return skills.filter((s) => s.className === className);
}
