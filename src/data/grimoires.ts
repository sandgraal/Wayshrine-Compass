import type { Grimoire } from "@/lib/types";

/**
 * Seed Scribing grimoires — generated from public/dataset/current.json (UESP esolog,
 * CC-BY-SA; see scripts/build-dataset.mjs). Regenerate by re-running the
 * generator in the PR that introduced this file rather than editing by hand.
 *
 * Provenance stamps are hand-set demo states like the other seed files:
 * everything U48 except grimoire-ulfsilds-contingency and script-anchorites-cruelty, which
 * demo the changed-in-U50 badge on /skills. Keep tests in sync if changing.
 */

export const grimoires: Grimoire[] = [
  {
    "id": "grimoire-banner-bearer",
    "name": "Banner Bearer",
    "line": "support",
    "lineLabel": "Support",
    "description": "Bring out a banner to inspire yourself and nearby group members.",
    "acquisition": "Purchased from Chronicler Firandil in the Scholarium after earning the Sigil of the Luminary Indrik. Requires \"Alliance War Skill Apprentice\" achievement to purchase.",
    "dlcRequired": "gold-road",
    "focusScripts": [
      "script-flame-damage",
      "script-immobilize",
      "script-magic-damage",
      "script-mitigation",
      "script-multi-target",
      "script-physical-damage",
      "script-restore-resources",
      "script-shock-damage"
    ],
    "signatureScripts": [
      "script-cavaliers-charge",
      "script-class-flourish",
      "script-crusaders-defiance",
      "script-druids-resurgence",
      "script-sages-remedy",
      "script-thiefs-swiftness",
      "script-warmages-defense",
      "script-wayfarers-mastery"
    ],
    "affixScripts": [
      "script-berserk",
      "script-brutality-and-sorcery",
      "script-courage",
      "script-heroism",
      "script-intellect-and-endurance",
      "script-protection",
      "script-resolve",
      "script-savagery-and-prophecy"
    ],
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "grimoire-elemental-explosion",
    "name": "Elemental Explosion",
    "line": "destruction-staff",
    "lineLabel": "Destruction Staff",
    "description": "Channel the power in your staff to fling a bolt of volatile magic, causing an elemental explosion at the target location.",
    "acquisition": "Purchased from Chronicler Firandil in the Scholarium after earning the Sigil of the Luminary Indrik. Requires \"Destruction Staff Apprentice\" achievement to purchase.",
    "dlcRequired": "gold-road",
    "focusScripts": [
      "script-dispel",
      "script-flame-damage",
      "script-frost-damage",
      "script-knockback",
      "script-magic-damage",
      "script-physical-damage",
      "script-shock-damage",
      "script-stun",
      "script-trauma"
    ],
    "signatureScripts": [
      "script-assassins-misery",
      "script-class-flourish",
      "script-druids-resurgence",
      "script-hunters-snare",
      "script-immobilizing-strike",
      "script-lingering-torment",
      "script-warmages-defense"
    ],
    "affixScripts": [
      "script-brittle",
      "script-brutality-and-sorcery",
      "script-cowardice",
      "script-defile",
      "script-enervation",
      "script-lifesteal",
      "script-magickasteal",
      "script-off-balance",
      "script-savagery-and-prophecy"
    ],
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "grimoire-menders-bond",
    "name": "Mender's Bond",
    "line": "restoration-staff",
    "lineLabel": "Restoration Staff",
    "description": "Tether yourself to an ally, manifesting a life link between you and them.",
    "acquisition": "Purchased from Chronicler Firandil in the Scholarium after earning the Sigil of the Luminary Indrik. Requires \"Restoration Staff Apprentice\" achievement to purchase.",
    "dlcRequired": "gold-road",
    "focusScripts": [
      "script-damage-shield",
      "script-generate-ultimate",
      "script-healing",
      "script-immobilize",
      "script-magic-damage",
      "script-mitigation",
      "script-restore-resources"
    ],
    "signatureScripts": [
      "script-class-flourish",
      "script-crusaders-defiance",
      "script-druids-resurgence",
      "script-hunters-snare",
      "script-knights-valor",
      "script-sages-remedy",
      "script-warmages-defense"
    ],
    "affixScripts": [
      "script-breach",
      "script-brittle",
      "script-courage",
      "script-empower",
      "script-evasion",
      "script-force",
      "script-heroism",
      "script-intellect-and-endurance",
      "script-maim",
      "script-protection",
      "script-vitality",
      "script-vulnerability"
    ],
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "grimoire-shield-throw",
    "name": "Shield Throw",
    "line": "one-hand-and-shield",
    "lineLabel": "One Hand and Shield",
    "description": "Hurl your shield at an enemy, which then returns to you.",
    "acquisition": "Purchased from Chronicler Firandil in the Scholarium after earning the Sigil of the Luminary Indrik. Requires \"One Hand and Shield Apprentice\" achievement to purchase.",
    "dlcRequired": "gold-road",
    "focusScripts": [
      "script-frost-damage",
      "script-immobilize",
      "script-knockback",
      "script-magic-damage",
      "script-multi-target",
      "script-physical-damage",
      "script-pull",
      "script-taunt"
    ],
    "signatureScripts": [
      "script-class-flourish",
      "script-druids-resurgence",
      "script-fencers-parry",
      "script-knights-valor",
      "script-lingering-torment",
      "script-sages-remedy",
      "script-thiefs-swiftness",
      "script-wayfarers-mastery"
    ],
    "affixScripts": [
      "script-brutality-and-sorcery",
      "script-cowardice",
      "script-enervation",
      "script-evasion",
      "script-interrupt",
      "script-maim",
      "script-off-balance",
      "script-resolve",
      "script-savagery-and-prophecy",
      "script-vitality"
    ],
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "grimoire-smash",
    "name": "Smash",
    "line": "two-handed",
    "lineLabel": "Two Handed",
    "description": "Drag your weapon along the ground to smash a cone in front of you.",
    "acquisition": "Purchased from Chronicler Firandil in the Scholarium after earning the Sigil of the Luminary Indrik. Requires \"Two-Handed Apprentice\" achievement to purchase.",
    "dlcRequired": "gold-road",
    "focusScripts": [
      "script-bleed-damage",
      "script-damage-shield",
      "script-healing",
      "script-knockback",
      "script-magic-damage",
      "script-physical-damage",
      "script-poison-damage",
      "script-stun",
      "script-taunt"
    ],
    "signatureScripts": [
      "script-class-flourish",
      "script-crusaders-defiance",
      "script-druids-resurgence",
      "script-fencers-parry",
      "script-immobilizing-strike",
      "script-leeching-thirst",
      "script-lingering-torment",
      "script-sages-remedy",
      "script-wayfarers-mastery"
    ],
    "affixScripts": [
      "script-berserk",
      "script-breach",
      "script-brutality-and-sorcery",
      "script-expedition",
      "script-force",
      "script-interrupt",
      "script-maim",
      "script-mangle",
      "script-savagery-and-prophecy",
      "script-vitality"
    ],
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "grimoire-soul-burst",
    "name": "Soul Burst",
    "line": "soul-magic",
    "lineLabel": "Soul Magic",
    "description": "Unleash a powerful burst of soul magic around you.",
    "acquisition": "Obtained by completing the final quest in the Scribing quest line.",
    "dlcRequired": "gold-road",
    "focusScripts": [
      "script-bleed-damage",
      "script-damage-shield",
      "script-disease-damage",
      "script-flame-damage",
      "script-frost-damage",
      "script-healing",
      "script-immobilize",
      "script-magic-damage",
      "script-physical-damage",
      "script-pull",
      "script-shock-damage"
    ],
    "signatureScripts": [
      "script-anchorites-cruelty",
      "script-anchorites-potency",
      "script-class-flourish",
      "script-crusaders-defiance",
      "script-hunters-snare",
      "script-lingering-torment",
      "script-sages-remedy"
    ],
    "affixScripts": [
      "script-breach",
      "script-brutality-and-sorcery",
      "script-courage",
      "script-expedition",
      "script-intellect-and-endurance",
      "script-interrupt",
      "script-magickasteal",
      "script-maim",
      "script-resolve",
      "script-savagery-and-prophecy"
    ],
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "grimoire-torchbearer",
    "name": "Torchbearer",
    "line": "fighters-guild",
    "lineLabel": "Fighters Guild",
    "description": "Conjure an imbued torch and sweep the area in front of you three times with its power.",
    "acquisition": "Purchased from Chronicler Firandil in the Scholarium after earning the Sigil of the Luminary Indrik. Requires \"Fighters Guild Skill Apprentice\" achievement to purchase.",
    "dlcRequired": "gold-road",
    "focusScripts": [
      "script-bleed-damage",
      "script-flame-damage",
      "script-frost-damage",
      "script-generate-ultimate",
      "script-healing",
      "script-knockback",
      "script-physical-damage",
      "script-stun"
    ],
    "signatureScripts": [
      "script-class-flourish",
      "script-crusaders-defiance",
      "script-druids-resurgence",
      "script-gladiators-tenacity",
      "script-hunters-snare",
      "script-lingering-torment",
      "script-warriors-opportunity"
    ],
    "affixScripts": [
      "script-breach",
      "script-brutality-and-sorcery",
      "script-cowardice",
      "script-evasion",
      "script-heroism",
      "script-mangle",
      "script-resolve",
      "script-savagery-and-prophecy",
      "script-uncertainty",
      "script-vitality"
    ],
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "grimoire-trample",
    "name": "Trample",
    "line": "assault",
    "lineLabel": "Assault",
    "description": "Pierce the air with a shrill whistle, calling your mount forth to trample enemies in a line. This ability cannot be re-activated while your mount is already attacking.",
    "acquisition": "Purchased from Chronicler Firandil in the Scholarium after earning the Sigil of the Luminary Indrik. Requires \"Alliance War Skill Apprentice\" achievement to purchase.",
    "dlcRequired": "gold-road",
    "focusScripts": [
      "script-disease-damage",
      "script-dispel",
      "script-frost-damage",
      "script-knockback",
      "script-magic-damage",
      "script-physical-damage",
      "script-stun",
      "script-trauma"
    ],
    "signatureScripts": [
      "script-assassins-misery",
      "script-cavaliers-charge",
      "script-class-flourish",
      "script-hunters-snare",
      "script-immobilizing-strike",
      "script-lingering-torment",
      "script-thiefs-swiftness",
      "script-warriors-opportunity",
      "script-wayfarers-mastery"
    ],
    "affixScripts": [
      "script-brutality-and-sorcery",
      "script-cowardice",
      "script-defile",
      "script-expedition",
      "script-heroism",
      "script-mangle",
      "script-off-balance",
      "script-protection",
      "script-savagery-and-prophecy",
      "script-vulnerability"
    ],
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "grimoire-traveling-knife",
    "name": "Traveling Knife",
    "line": "dual-wield",
    "lineLabel": "Dual Wield",
    "description": "Twirl and throw an enchanted dagger at an enemy, which returns to you after a short delay and hits additional enemies in the path.",
    "acquisition": "Purchased from Chronicler Firandil in the Scholarium after earning the Sigil of the Luminary Indrik. Requires \"Dual Wield Apprentice\" achievement to purchase.",
    "dlcRequired": "gold-road",
    "focusScripts": [
      "script-bleed-damage",
      "script-frost-damage",
      "script-magic-damage",
      "script-multi-target",
      "script-physical-damage",
      "script-poison-damage",
      "script-pull",
      "script-stun"
    ],
    "signatureScripts": [
      "script-assassins-misery",
      "script-class-flourish",
      "script-fencers-parry",
      "script-hunters-snare",
      "script-leeching-thirst",
      "script-lingering-torment",
      "script-warmages-defense",
      "script-warriors-opportunity",
      "script-wayfarers-mastery"
    ],
    "affixScripts": [
      "script-berserk",
      "script-brutality-and-sorcery",
      "script-expedition",
      "script-force",
      "script-lifesteal",
      "script-maim",
      "script-off-balance",
      "script-savagery-and-prophecy",
      "script-uncertainty",
      "script-vulnerability"
    ],
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "grimoire-ulfsilds-contingency",
    "name": "Ulfsild's Contingency",
    "line": "mages-guild",
    "lineLabel": "Mages Guild",
    "description": "Imbue yourself with the magical runes of Ulfsild. These runes trigger when you cast an ability with a cost, causing a burst of magic around you.",
    "acquisition": "Purchased from Chronicler Firandil in the Scholarium after earning the Sigil of the Luminary Indrik. Requires \"Mages Guild Skill Apprentice\" achievement to purchase.",
    "dlcRequired": "gold-road",
    "focusScripts": [
      "script-bleed-damage",
      "script-damage-shield",
      "script-flame-damage",
      "script-frost-damage",
      "script-healing",
      "script-immobilize",
      "script-knockback",
      "script-magic-damage",
      "script-shock-damage"
    ],
    "signatureScripts": [
      "script-class-flourish",
      "script-gladiators-tenacity",
      "script-growing-impact",
      "script-hunters-snare",
      "script-lingering-torment",
      "script-sages-remedy",
      "script-warriors-opportunity"
    ],
    "affixScripts": [
      "script-breach",
      "script-brutality-and-sorcery",
      "script-enervation",
      "script-force",
      "script-intellect-and-endurance",
      "script-magickasteal",
      "script-protection",
      "script-resolve",
      "script-savagery-and-prophecy",
      "script-vulnerability"
    ],
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U50"
  },
  {
    "id": "grimoire-vault",
    "name": "Vault",
    "line": "bow",
    "lineLabel": "Bow",
    "description": "Fire a burst at your feet while flipping backwards 15 meters.\n\nCasting again within 4 seconds increases the cost by 33%.",
    "acquisition": "Purchased from Chronicler Firandil in the Scholarium after earning the Sigil of the Luminary Indrik. Requires \"Bow Apprentice\" achievement to purchase.",
    "dlcRequired": "gold-road",
    "focusScripts": [
      "script-bleed-damage",
      "script-disease-damage",
      "script-flame-damage",
      "script-healing",
      "script-immobilize",
      "script-physical-damage",
      "script-poison-damage",
      "script-taunt"
    ],
    "signatureScripts": [
      "script-class-flourish",
      "script-crusaders-defiance",
      "script-druids-resurgence",
      "script-hunters-snare",
      "script-lingering-torment",
      "script-sages-remedy",
      "script-thiefs-swiftness",
      "script-wayfarers-mastery"
    ],
    "affixScripts": [
      "script-berserk",
      "script-brutality-and-sorcery",
      "script-evasion",
      "script-expedition",
      "script-force",
      "script-intellect-and-endurance",
      "script-lifesteal",
      "script-maim",
      "script-off-balance",
      "script-savagery-and-prophecy",
      "script-vulnerability"
    ],
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  },
  {
    "id": "grimoire-wield-soul",
    "name": "Wield Soul",
    "line": "soul-magic",
    "lineLabel": "Soul Magic",
    "description": "Launch a concentrated blast of soul magic at a target.",
    "acquisition": "Obtained from quest \"The Second Era of Scribing\".",
    "dlcRequired": "gold-road",
    "focusScripts": [
      "script-bleed-damage",
      "script-damage-shield",
      "script-disease-damage",
      "script-flame-damage",
      "script-frost-damage",
      "script-healing",
      "script-magic-damage",
      "script-physical-damage",
      "script-pull",
      "script-shock-damage",
      "script-stun"
    ],
    "signatureScripts": [
      "script-anchorites-cruelty",
      "script-anchorites-potency",
      "script-class-flourish",
      "script-druids-resurgence",
      "script-lingering-torment",
      "script-sages-remedy"
    ],
    "affixScripts": [
      "script-breach",
      "script-brutality-and-sorcery",
      "script-cowardice",
      "script-defile",
      "script-empower",
      "script-intellect-and-endurance",
      "script-maim",
      "script-resolve",
      "script-savagery-and-prophecy",
      "script-vitality"
    ],
    "firstSeenPatch": "U48",
    "lastChangedPatch": "U48"
  }
];
