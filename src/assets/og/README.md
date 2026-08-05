# OG image assets

Server-side inputs for `src/app/builds/[slug]/opengraph-image.tsx` (satori can't
fetch at request time, so everything is read from disk):

- `SpaceGrotesk-SemiBold.ttf` — the site display face (Space Grotesk, SIL Open
  Font License 1.1, © Florian Karsten), vendored as a static 600-weight instance
  of the upstream variable font so satori renders the card headline at the same
  weight the site uses.
- `emblem.png` — 200px PNG derivative of the stone compass emblem. PNG because
  satori does not decode WebP.

Portrait inputs live in `public/chars-og/` (JPEG derivatives of
`public/chars/*.webp`, same reason) — see src/assets/chars/README.md.
