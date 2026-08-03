# Character art

Portrait art for build cards and build page heroes. Source of truth is the
`Character Art Mockups.dc.html` project on claude.ai/design (project
`deb6b95d-a6c5-49dd-8dff-11809c3606b3`, files under `assets/chars/`).

The catalog in `src/lib/portraits.ts` expects exactly these 14 files, named
verbatim, as `.jpeg`. Every portrait falls back to the class sigil when its file
is missing, so the site renders correctly with none, some, or all of them
present — but the fallback is a placeholder, not the intended design.

```
altmer-sorcerer-female.jpeg
argonian-templar-female.jpeg
bosmer-nightblade-female.jpeg
breton-arcanist-male.jpeg
dunmer-necromancer-female.jpeg
imperial-templar-male.jpeg
khajiit-nightblade-male.jpeg
khajiit-nightblade-male-2.jpeg
khajiit-nightblade-male-3.jpeg
nord-dragonknight-female.jpeg
nord-dragonknight-female-2.jpeg
nord-dragonknight-male.jpeg
orsimer-warden-female.jpeg
redguard-warden-male.jpeg
```

Originals are 1792×2400 (3:4). They are full-scene illustrations, not headshots,
so every consumer crops with `object-fit: cover` and a high `object-position`
(~12–15%) to keep the character's head in frame. Next.js resizes them at request
time, so committing the originals is fine; don't pre-crop them.

Adding art for a race/class combination that isn't listed here means adding an
entry to `PORTRAITS` in `src/lib/portraits.ts` — the catalog is explicit so a
stray file can never silently change which portrait a build renders.
