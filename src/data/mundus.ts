import type { MundusStone } from "@/lib/types";

export const mundusStones: MundusStone[] = [
  { id: "mundus-apprentice", name: "The Apprentice", effect: "Increases Weapon and Spell Damage by 258.", stats: [{ stat: "weaponSpellDamage", amount: 258 }] },
  { id: "mundus-atronach", name: "The Atronach", effect: "Increases Magicka Recovery by 310.", stats: [{ stat: "magickaRecovery", amount: 310 }] },
  { id: "mundus-lady", name: "The Lady", effect: "Increases Physical and Spell Resistance by 2744.", stats: [{ stat: "armor", amount: 2744 }] },
  { id: "mundus-lord", name: "The Lord", effect: "Increases Maximum Health by 2225.", stats: [{ stat: "maxHealth", amount: 2225 }] },
  { id: "mundus-lover", name: "The Lover", effect: "Increases Physical and Spell Penetration by 2744.", stats: [{ stat: "penetration", amount: 2744 }] },
  { id: "mundus-mage", name: "The Mage", effect: "Increases Maximum Magicka by 2225.", stats: [{ stat: "maxMagicka", amount: 2225 }] },
  { id: "mundus-ritual", name: "The Ritual", effect: "Increases Healing Done by 8%.", stats: [{ stat: "healingDone", amount: 8 }] },
  { id: "mundus-serpent", name: "The Serpent", effect: "Increases Stamina Recovery by 310.", stats: [{ stat: "staminaRecovery", amount: 310 }] },
  { id: "mundus-shadow", name: "The Shadow", effect: "Increases Critical Damage and Critical Healing by 17%.", stats: [{ stat: "criticalDamage", amount: 17 }] },
  { id: "mundus-steed", name: "The Steed", effect: "Increases Health Recovery by 429 and movement speed by 10%.", stats: [{ stat: "healthRecovery", amount: 429 }] },
  { id: "mundus-thief", name: "The Thief", effect: "Increases Critical Chance by 1333.", stats: [{ stat: "criticalChance", amount: 1333 }] },
  { id: "mundus-tower", name: "The Tower", effect: "Increases Maximum Stamina by 2225.", stats: [{ stat: "maxStamina", amount: 2225 }] },
  { id: "mundus-warrior", name: "The Warrior", effect: "Increases Weapon and Spell Damage by 258.", stats: [{ stat: "weaponSpellDamage", amount: 258 }] },
];
