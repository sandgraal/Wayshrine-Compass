# OG image assets

Server-side inputs for `src/app/builds/[slug]/opengraph-image.tsx` (satori can't
fetch at request time, so everything is read from disk):

- `Geist-SemiBold.ttf` — vendored from Google Fonts (Geist, SIL Open Font
  License 1.1, © Vercel). Regular weight comes from the copy Next bundles with
  `@vercel/og`; only the 600 weight needs vendoring.
- `emblem.png` — 200px PNG derivative of the stone compass emblem
  (`~/Downloads/ESO/download/Fantasy_game_emblem_stone_compass_*.jpeg`).
  PNG because satori does not decode WebP.

Portrait inputs live in `public/chars-og/` (JPEG derivatives of
`public/chars/*.webp`, same reason) — see src/assets/chars/README.md.
