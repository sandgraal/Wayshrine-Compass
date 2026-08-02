import type { Food } from "@/lib/types";

export const foods: Food[] = [
  {
    id: "food-bewitched-sugar-skulls",
    name: "Bewitched Sugar Skulls",
    effect: "Increases Max Health by 4620, Max Magicka and Max Stamina by 4250, and Health Recovery by 462 for 2 hours.",
    stats: [
      { stat: "maxHealth", amount: 4620 },
      { stat: "maxMagicka", amount: 4250 },
      { stat: "maxStamina", amount: 4250 },
      { stat: "healthRecovery", amount: 462 },
    ],
  },
  {
    id: "food-ghastly-eye-bowl",
    name: "Ghastly Eye Bowl",
    effect: "Increases Max Magicka by 5395 and Magicka Recovery by 493 for 2 hours.",
    stats: [
      { stat: "maxMagicka", amount: 5395 },
      { stat: "magickaRecovery", amount: 493 },
    ],
  },
  {
    id: "food-artaeum-takeaway-broth",
    name: "Artaeum Takeaway Broth",
    effect: "Increases Max Health by 3724 and Max Stamina by 3458, plus Health and Stamina Recovery for 2 hours.",
    stats: [
      { stat: "maxHealth", amount: 3724 },
      { stat: "maxStamina", amount: 3458 },
      { stat: "healthRecovery", amount: 406 },
      { stat: "staminaRecovery", amount: 369 },
    ],
  },
  {
    id: "food-solitude-salmon-millet-soup",
    name: "Solitude Salmon-Millet Soup",
    effect: "Increases Max Health by 5406 and Max Magicka by 4936 for 2 hours.",
    stats: [
      { stat: "maxHealth", amount: 5406 },
      { stat: "maxMagicka", amount: 4936 },
    ],
  },
  {
    id: "food-orzorgas-smoked-bear-haunch",
    name: "Orzorga's Smoked Bear Haunch",
    effect: "Increases Max Health by 4462 and all three Recoveries for 2 hours.",
    stats: [
      { stat: "maxHealth", amount: 4462 },
      { stat: "healthRecovery", amount: 406 },
      { stat: "magickaRecovery", amount: 369 },
      { stat: "staminaRecovery", amount: 369 },
    ],
  },
];
