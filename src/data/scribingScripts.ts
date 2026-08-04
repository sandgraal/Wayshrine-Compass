import type { ScribingScript } from "@/lib/types";

/**
 * Seed Scribing scripts (focus/signature/affix) — generated from public/dataset/current.json (UESP esolog,
 * CC-BY-SA; see scripts/build-dataset.mjs). Regenerate by re-running the
 * generator in the PR that introduced this file rather than editing by hand.
 *
 * Provenance stamps are hand-set demo states like the other seed files:
 * everything U48 except grimoire-ulfsilds-contingency and script-anchorites-cruelty, which
 * demo the changed-in-U50 badge on /skills. Keep tests in sync if changing.
 */

export const scribingScripts: ScribingScript[] = [
  {
    "id": "script-anchorites-cruelty",
    "name": "Anchorite's Cruelty",
    "slot": "signature",
    "description": "Adds a consume soul gem to deal oblivion damage effect to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Boss quests, daily Cyrodiil quests, and daily Fighters Guild quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U50"
  },
  {
    "id": "script-anchorites-potency",
    "name": "Anchorite's Potency",
    "slot": "signature",
    "description": "Adds a consume soul gem to grant ultimate effect to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Boss quests, daily Cyrodiil quests, and daily Fighters Guild quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-assassins-misery",
    "name": "Assassin's Misery",
    "slot": "signature",
    "description": "Adds improved use of status effects to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Boss quests, daily Cyrodiil quests, and daily Fighters Guild quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-berserk",
    "name": "Berserk",
    "slot": "affix",
    "description": "Adds Berserk, a buff increasing damage done, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Event quests, daily Imperial City quests, and daily Undaunted quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-bleed-damage",
    "name": "Bleed Damage",
    "slot": "focus",
    "description": "Adds bleed damage to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily Delve quests, daily Mages Guild quests, and PvP Rewards for the Worthy.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-breach",
    "name": "Breach",
    "slot": "affix",
    "description": "Adds Breach, a debuff reducing physical and spell resistance, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired from quest \"The Second Era of Scribing\".",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-brittle",
    "name": "Brittle",
    "slot": "affix",
    "description": "Adds Brittle, a debuff increasing critical damage taken, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Event quests, daily Imperial City quests, and daily Undaunted quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-brutality-and-sorcery",
    "name": "Brutality and Sorcery",
    "slot": "affix",
    "description": "Adds Brutality and Sorcery, buffs increasing weapon and spell damage, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Event quests, daily Imperial City quests, and daily Undaunted quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-cavaliers-charge",
    "name": "Cavalier's Charge",
    "slot": "signature",
    "description": "Adds an increase to damage as ability persists effect to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Boss quests, daily Cyrodiil quests, and daily Fighters Guild quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-class-flourish",
    "name": "Class Flourish",
    "slot": "signature",
    "description": "Adds a class signature enhancement to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Boss quests, daily Cyrodiil quests, and daily Fighters Guild quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-courage",
    "name": "Courage",
    "slot": "affix",
    "description": "Adds Courage, a buff increasing weapon and spell damage, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Event quests, daily Imperial City quests, and daily Undaunted quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-cowardice",
    "name": "Cowardice",
    "slot": "affix",
    "description": "Adds Cowardice, a debuff reducing weapon and spell damage, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Event quests, daily Imperial City quests, and daily Undaunted quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-crusaders-defiance",
    "name": "Crusader's Defiance",
    "slot": "signature",
    "description": "Adds removal of debilitating effects to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Boss quests, daily Cyrodiil quests, and daily Fighters Guild quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-damage-shield",
    "name": "Damage Shield",
    "slot": "focus",
    "description": "Adds a damage shield to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired from a notable Mages Guild hall after unlocking the Sigil of the Luminary Dragon.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-defile",
    "name": "Defile",
    "slot": "affix",
    "description": "Adds Defile, a debuff reducing healing received, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Event quests, daily Imperial City quests, and daily Undaunted quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-disease-damage",
    "name": "Disease Damage",
    "slot": "focus",
    "description": "Adds disease damage to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily Delve quests, daily Mages Guild quests, and PvP Rewards for the Worthy.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-dispel",
    "name": "Dispel",
    "slot": "focus",
    "description": "Adds a dispel to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily Delve quests, daily Mages Guild quests, and PvP Rewards for the Worthy.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-druids-resurgence",
    "name": "Druid's Resurgence",
    "slot": "signature",
    "description": "Adds resource restoration to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired from a notable Mages Guild hall after unlocking the Sigil of the Luminary Dragon.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-empower",
    "name": "Empower",
    "slot": "affix",
    "description": "Adds Empower, a buff increasing heavy attack damage, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Event quests, daily Imperial City quests, and daily Undaunted quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-enervation",
    "name": "Enervation",
    "slot": "affix",
    "description": "Adds Enervation, a debuff reducing critical damage, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Event quests, daily Imperial City quests, and daily Undaunted quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-evasion",
    "name": "Evasion",
    "slot": "affix",
    "description": "Adds Evasion, a buff reducing damage from area effects, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Event quests, daily Imperial City quests, and daily Undaunted quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-expedition",
    "name": "Expedition",
    "slot": "affix",
    "description": "Adds Expedition, a buff increasing movement speed, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Event quests, daily Imperial City quests, and daily Undaunted quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-fencers-parry",
    "name": "Fencer's Parry",
    "slot": "signature",
    "description": "Adds deflection of next direct damage attack to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Boss quests, daily Cyrodiil quests, and daily Fighters Guild quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-flame-damage",
    "name": "Flame Damage",
    "slot": "focus",
    "description": "Adds flame damage to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily Delve quests, daily Mages Guild quests, and PvP Rewards for the Worthy.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-force",
    "name": "Force",
    "slot": "affix",
    "description": "Adds Force, a buff increasing critical damage, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Event quests, daily Imperial City quests, and daily Undaunted quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-frost-damage",
    "name": "Frost Damage",
    "slot": "focus",
    "description": "Adds frost damage to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily Delve quests, daily Mages Guild quests, and PvP Rewards for the Worthy.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-generate-ultimate",
    "name": "Generate Ultimate",
    "slot": "focus",
    "description": "Adds ultimate generation to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily Delve quests, daily Mages Guild quests, and PvP Rewards for the Worthy.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-gladiators-tenacity",
    "name": "Gladiator's Tenacity",
    "slot": "signature",
    "description": "Adds damage reduction to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Boss quests, daily Cyrodiil quests, and daily Fighters Guild quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-growing-impact",
    "name": "Growing Impact",
    "slot": "signature",
    "description": "Adds enhanced buff and debuff application to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Boss quests, daily Cyrodiil quests, and daily Fighters Guild quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-healing",
    "name": "Healing",
    "slot": "focus",
    "description": "Adds healing to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired from quest \"The Wing of the Indrik\".",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-heroism",
    "name": "Heroism",
    "slot": "affix",
    "description": "Adds Heroism, a buff increasing ultimate generation, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Event quests, daily Imperial City quests, and daily Undaunted quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-hunters-snare",
    "name": "Hunter's Snare",
    "slot": "signature",
    "description": "Adds a slowing effect to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired from a notable Mages Guild hall after unlocking the Sigil of the Luminary Dragon.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-immobilize",
    "name": "Immobilize",
    "slot": "focus",
    "description": "Adds an immobilization effect to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily Delve quests, daily Mages Guild quests, and PvP Rewards for the Worthy.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-immobilizing-strike",
    "name": "Immobilizing Strike",
    "slot": "signature",
    "description": "Adds an immobilization effect to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Boss quests, daily Cyrodiil quests, and daily Fighters Guild quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-intellect-and-endurance",
    "name": "Intellect and Endurance",
    "slot": "affix",
    "description": "Adds Intellect and Endurance, buffs increasing magicka and stamina recovery, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Event quests, daily Imperial City quests, and daily Undaunted quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-interrupt",
    "name": "Interrupt",
    "slot": "affix",
    "description": "Adds interruption effect to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Event quests, daily Imperial City quests, and daily Undaunted quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-knights-valor",
    "name": "Knight's Valor",
    "slot": "signature",
    "description": "Adds improved use of bash or blocking to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Boss quests, daily Cyrodiil quests, and daily Fighters Guild quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-knockback",
    "name": "Knockback",
    "slot": "focus",
    "description": "Adds a knockback to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily Delve quests, daily Mages Guild quests, and PvP Rewards for the Worthy.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-leeching-thirst",
    "name": "Leeching Thirst",
    "slot": "signature",
    "description": "Adds a heal for percentage of damage done to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Boss quests, daily Cyrodiil quests, and daily Fighters Guild quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-lifesteal",
    "name": "Lifesteal",
    "slot": "affix",
    "description": "Adds Lifesteal, a debuff granting healing to attackers, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Event quests, daily Imperial City quests, and daily Undaunted quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-lingering-torment",
    "name": "Lingering Torment",
    "slot": "signature",
    "description": "Adds damage over time to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired from quest \"The Second Era of Scribing\".",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-magic-damage",
    "name": "Magic Damage",
    "slot": "focus",
    "description": "Adds magic damage to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired from quest \"The Second Era of Scribing\".",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-magickasteal",
    "name": "Magickasteal",
    "slot": "affix",
    "description": "Adds Magickasteal, a debuff granting magicka restoration to attackers, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Event quests, daily Imperial City quests, and daily Undaunted quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-maim",
    "name": "Maim",
    "slot": "affix",
    "description": "Adds Maim, a debuff reducing damage dealt, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired from a notable Mages Guild hall after unlocking the Sigil of the Luminary Dragon.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-mangle",
    "name": "Mangle",
    "slot": "affix",
    "description": "Adds Mangle, a debuff reducing max health, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Event quests, daily Imperial City quests, and daily Undaunted quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-mitigation",
    "name": "Mitigation",
    "slot": "focus",
    "description": "Adds damage reduction to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily Delve quests, daily Mages Guild quests, and PvP Rewards for the Worthy.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-multi-target",
    "name": "Multi-Target",
    "slot": "focus",
    "description": "Adds a multi-target hit to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily Delve quests, daily Mages Guild quests, and PvP Rewards for the Worthy.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-off-balance",
    "name": "Off Balance",
    "slot": "affix",
    "description": "Adds off balance effect to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired from quest \"The Wing of the Indrik\".",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-physical-damage",
    "name": "Physical Damage",
    "slot": "focus",
    "description": "Adds physical damage to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired from a notable Mages Guild hall after unlocking the Sigil of the Luminary Dragon.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-poison-damage",
    "name": "Poison Damage",
    "slot": "focus",
    "description": "Adds poison damage to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily Delve quests, daily Mages Guild quests, and PvP Rewards for the Worthy.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-protection",
    "name": "Protection",
    "slot": "affix",
    "description": "Adds Protection, a buff reducing damage taken, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Event quests, daily Imperial City quests, and daily Undaunted quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-pull",
    "name": "Pull",
    "slot": "focus",
    "description": "Adds a pull to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily Delve quests, daily Mages Guild quests, and PvP Rewards for the Worthy.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-resolve",
    "name": "Resolve",
    "slot": "affix",
    "description": "Adds Resolve, a buff increasing physical and spell resistance, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired from quest \"The Wing of the Indrik\".",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-restore-resources",
    "name": "Restore Resources",
    "slot": "focus",
    "description": "Adds resource restoration to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily Delve quests, daily Mages Guild quests, and PvP Rewards for the Worthy.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-sages-remedy",
    "name": "Sage's Remedy",
    "slot": "signature",
    "description": "Adds healing over time to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired from quest \"The Wing of the Indrik\".",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-savagery-and-prophecy",
    "name": "Savagery and Prophecy",
    "slot": "affix",
    "description": "Adds Savagery and Prophecy, buffs increasing weapon and spell critical chance, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Event quests, daily Imperial City quests, and daily Undaunted quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-shock-damage",
    "name": "Shock Damage",
    "slot": "focus",
    "description": "Adds shock damage to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily Delve quests, daily Mages Guild quests, and PvP Rewards for the Worthy.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-stun",
    "name": "Stun",
    "slot": "focus",
    "description": "Adds a stun to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired from a notable Mages Guild hall after unlocking the Sigil of the Luminary Dragon.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-taunt",
    "name": "Taunt",
    "slot": "focus",
    "description": "Adds a taunt to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily Delve quests, daily Mages Guild quests, and PvP Rewards for the Worthy.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-thiefs-swiftness",
    "name": "Thief's Swiftness",
    "slot": "signature",
    "description": "Adds improvement to your mobility to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Boss quests, daily Cyrodiil quests, and daily Fighters Guild quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-trauma",
    "name": "Trauma",
    "slot": "focus",
    "description": "Adds healing absorption effect to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily Delve quests, daily Mages Guild quests, and PvP Rewards for the Worthy.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-uncertainty",
    "name": "Uncertainty",
    "slot": "affix",
    "description": "Adds Uncertainty, a debuff reducing weapon critical damage, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Event quests, daily Imperial City quests, and daily Undaunted quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-vitality",
    "name": "Vitality",
    "slot": "affix",
    "description": "Adds Vitality, a buff increasing healing received, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired from a notable Mages Guild hall after unlocking the Sigil of the Luminary Dragon.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-vulnerability",
    "name": "Vulnerability",
    "slot": "affix",
    "description": "Adds Vulnerability, a debuff increasing damage taken, to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired from a notable Mages Guild hall after unlocking the Sigil of the Luminary Dragon.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-warmages-defense",
    "name": "Warmage's Defense",
    "slot": "signature",
    "description": "Adds a damage shield to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Boss quests, daily Cyrodiil quests, and daily Fighters Guild quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-warriors-opportunity",
    "name": "Warrior's Opportunity",
    "slot": "signature",
    "description": "Adds an improve your next direct damage attack effect to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired from a notable Mages Guild hall after unlocking the Sigil of the Luminary Dragon.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "script-wayfarers-mastery",
    "name": "Wayfarer's Mastery",
    "slot": "signature",
    "description": "Adds improved functionality of skill line passives to a scribed skill when written to a grimoire.",
    "acquisition": "Acquired primarily from daily World Boss quests, daily Cyrodiil quests, and daily Fighters Guild quests.",
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  }
];
