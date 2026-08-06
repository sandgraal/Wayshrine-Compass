# Sigil art: prompts and pipeline

Original category iconography for entity rows: 8 set-type sigils and 49 skill-line
emblems. Drawn for this site; we never ship game-ripped assets, and none of these may
copy a specific in-game icon's composition.

Deliverables land in `public/sigils/` as **96px-square WebP** (generate at 1024², then
downsize, matching the freshness-icon pipeline). File names are fixed by the manifest in
`src/lib/entity-art.ts` — after a file lands, add its path to `SHIPPED_SIGILS` there;
the acceptance test keeps manifest and disk in sync both directions.

## Master style prompt (prefix for every asset)

> Emblem in the style of an ancient carved stone bas-relief, engraved antique-gold
> line-work with subtle pale glacial-blue rune glow accents, on a very dark desaturated
> blue-slate background, aged high-fantasy craftsmanship, clean silhouette readable at
> 32 pixels, centered composition, single consistent top-left light source, painterly
> texture with crisp edges, no text, no letters, no watermark, square format

Palette anchors (from `src/app/globals.css`): gold accents ≈ `oklch(0.82 0.13 85)`,
background ≈ `oklch(0.145 0.018 260)`, glow ≈ pale glacial blue.

## Negative prompt (append to all)

> no photorealism, no purple, no neon, no plastic 3D render, no glassmorphism, no text
> or runes resembling Latin letters, no company logos, no direct copies of existing
> game icon compositions

## Set-type sigils (8) — `set-<type>.webp`

| file | subject |
|---|---|
| set-arena.webp | a laurel wreath around a gladiator's spiked hoop |
| set-crafted.webp | a smith's hammer striking an anvil, sparks as tiny rune motes |
| set-dungeon.webp | a heavy iron-bound crypt door beneath a keystone arch |
| set-monster.webp | a stylized beast skull with a single gem eye |
| set-mythic.webp | a radiant reliquary box with light escaping its seams |
| set-overland.webp | a winding road cresting a hill toward a distant standing stone |
| set-pvp.webp | two crossed banners with torn edges over a war-horn |
| set-trial.webp | three interlocked ceremonial blades arranged in a triangle |

## Skill-line emblems (49) — `line-<key>.webp`

Subject template: "[subject] as a compact heraldic crest".

### Class lines (each class's class-mastery emblem is that class's crest motif in a laurel border)

| file | subject |
|---|---|
| line-arcanist-class-mastery.webp | a four-pointed abyssal star in a laurel border |
| line-arcanist-curative-runeforms.webp | a rune circle knitting a broken line back together |
| line-arcanist-herald-of-the-tome.webp | an open tome projecting a beam of geometric glyphs |
| line-arcanist-soldier-of-apocrypha.webp | a shield formed of stacked tentacled book spines |
| line-dragonknight-ardent-flame.webp | a dragon curled around a rising flame |
| line-dragonknight-class-mastery.webp | a dragon's eye in a laurel border |
| line-dragonknight-draconic-power.webp | folded dragon wings sheltering a gem heart |
| line-dragonknight-earthen-heart.webp | a mountain peak wrapped in molten veins |
| line-necromancer-bone-tyrant.webp | a ribcage fortress with a crown above it |
| line-necromancer-class-mastery.webp | a skeletal crown in a laurel border |
| line-necromancer-grave-lord.webp | a scythe crossing a gravestone with rising wisps |
| line-necromancer-living-death.webp | a lily blooming from a skull's eye socket |
| line-nightblade-assassination.webp | a curved dagger piercing a crescent moon |
| line-nightblade-class-mastery.webp | a crescent blade in a laurel border |
| line-nightblade-shadow.webp | a hooded figure dissolving into ribbons of smoke |
| line-nightblade-siphoning.webp | a droplet drawn upward from a wilting flower into an open hand |
| line-sorcerer-class-mastery.webp | a forked bolt in a laurel border |
| line-sorcerer-daedric-summoning.webp | a summoning circle with a clawed hand emerging |
| line-sorcerer-dark-magic.webp | a void orb held between curved obsidian shards |
| line-sorcerer-storm-calling.webp | a forked lightning bolt splitting a storm cloud |
| line-templar-aedric-spear.webp | a radiant spear descending through parting clouds |
| line-templar-class-mastery.webp | a rayed sun disc in a laurel border |
| line-templar-dawns-wrath.webp | a sunburst with blade-shaped rays |
| line-templar-restoring-light.webp | cupped hands holding a soft radiant orb |
| line-warden-animal-companions.webp | a bear's head in profile over crossed talons |
| line-warden-class-mastery.webp | an antlered skull crest in a laurel border |
| line-warden-green-balance.webp | a sapling growing from an open palm |
| line-warden-winters-embrace.webp | a snowflake caged in curling frost vines |

### Weapon lines

| file | subject |
|---|---|
| line-bow.webp | a drawn longbow with a nocked arrow at full anchor |
| line-destruction-staff.webp | a staff head splitting into flame, frost, and spark |
| line-dual-wield.webp | two crossed sabers with a spark at the crossing |
| line-one-hand-and-shield.webp | a round shield with a sword rising behind it |
| line-restoration-staff.webp | a staff crowned by a blossoming light |
| line-two-handed.webp | a greatsword point-down through a broken shield |

### Armor lines

| file | subject |
|---|---|
| line-heavy-armor.webp | a massive pauldron with rivets and a mountain engraving |
| line-light-armor.webp | a flowing robe collar clasped by a gem brooch |
| line-medium-armor.webp | a laced leather cuirass panel with a buckle |

### Guild lines

| file | subject |
|---|---|
| line-dark-brotherhood.webp | a hand pressed flat, a dagger behind it |
| line-fighters-guild.webp | a war-axe over an anvil in a shield frame |
| line-mages-guild.webp | an open tome with an eye of magic above it |
| line-psijic-order.webp | three nested rings out of phase with one another |
| line-thieves-guild.webp | a lockpick inside a keyhole shaped like a crescent |
| line-undaunted.webp | a cracked tankard raised in a toast |

### World lines

| file | subject |
|---|---|
| line-excavation.webp | a hand brush sweeping over a half-buried relic |
| line-legerdemain.webp | a coin vanishing between two fingers |
| line-scrying.webp | an astrolabe with a glowing focal lens |
| line-soul-magic.webp | a soul gem cradled by two curved filaments |
| line-vampire.webp | a bat-winged goblet with a single drop falling |
| line-werewolf.webp | a claw slash across a full moon |

## Gear-slot glyphs (10 files) — `slot-<slot>.webp`

Rendered in the planner paper-doll (`gearSlotArt`, manifest
`GEAR_SLOT_GLYPHS`). The two rings share `slot-ring`
and both weapon bars share `slot-weapon`, so twelve slots need ten files. Until
these ship the layout falls back to a lucide category icon, so they are
non-blocking. Subject template: "a [subject] rendered as a simple engraved
armory glyph inside a thin octagonal frame".

| file | subject |
|---|---|
| slot-head.webp | a closed barbute helm |
| slot-shoulders.webp | a spaulder over a rounded pauldron |
| slot-chest.webp | a segmented cuirass breastplate |
| slot-hands.webp | a bracered gauntlet, fingers together |
| slot-waist.webp | a broad belt with a central buckle plate |
| slot-legs.webp | a pair of tasset-plated greaves |
| slot-feet.webp | a plated sabaton boot |
| slot-necklace.webp | a pendant amulet on a fine chain |
| slot-ring.webp | a gem-set signet ring, viewed face-on |
| slot-weapon.webp | a sword and staff crossed behind a small round shield |

## Later phases (not blocking)

Role glyphs (4), CP tree marks (3), mundus stone cards (13), zone banners (13),
grimoire icons (12), update seals, page-header art. Prompts live in the
improvement-program plan; add manifests here as each category lands.
