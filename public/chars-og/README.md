# OG portrait derivatives

480px-wide JPEG copies of every portrait in `public/chars/`, consumed only by
the per-build Open Graph image route (`src/app/builds/[slug]/opengraph-image.tsx`).
JPEG because satori (the `next/og` renderer) does not decode WebP.

Regenerate after changing `public/chars/`:

```bash
for f in public/chars/*.webp; do
  base=$(basename "${f%.webp}")
  dwebp -quiet "$f" -o /tmp/og-tmp.png
  sips -Z 480 -s format jpeg -s formatOptions 70 /tmp/og-tmp.png --out "public/chars-og/$base.jpg"
done
```

A vitest acceptance test pins this directory to the portrait manifest — adding
or removing character art without regenerating these fails CI.
