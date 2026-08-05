# What Next card art

Square (1:1) illustrations for What Next recommendation cards, keyed by engine
action id — see `src/app/what-next/action-art.ts` for the expected filenames
(one per action, plus the shared `unlock-companion.webp`).

Cards render identically while a file is absent (the thumbnail hides itself),
so drop art in whenever it's ready. Prep from ≥768² master sources:

```bash
sips -Z 512 source.png --out /tmp/wn.png
cwebp -q 80 /tmp/wn.png -o public/whatnext/<action-id>.webp
```
