# Zones hero banner

`hero.webp` — the decorative banner behind the `/zones` page header. Rendered
`alt=""` / `aria-hidden` (see `src/app/zones/page.tsx`); the eyebrow, heading,
and intro carry the meaning, and a gradient base layer sits under it so a failed
load still reads as intentional.

Derived from the project-owned master render of the glowing-wayshrine scene
used across the brand. Pipeline, from a ≥2.4:1 source (crop to a wide band,
downscale to 1600px, encode):

```bash
sips -c 1147 2752 --cropOffset 200 0 master.jpeg --out /tmp/crop.png
sips -Z 1600 /tmp/crop.png --out /tmp/hero.png
cwebp -q 78 /tmp/hero.png -o public/zones/hero.webp
```

The blue/violet portal glow is imagery only — interactive UI stays on the gold
`--primary` accent, per the palette note in `src/app/globals.css`.
