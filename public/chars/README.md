# Character art

Portrait art for build cards and build page heroes: 207 WebP files covering all
10 races × 7 classes × both genders, plus alternate variants (`-2`, `-3`, …).

These are 900px-wide derivatives. The 1792×2400 originals live outside the repo
(generated for the claude.ai/design project `deb6b95d-a6c5-49dd-8dff-11809c3606b3`;
local master copies in `~/Downloads/ESO/chars-new/`). To regenerate or add art,
resize to 900px wide and encode WebP q80 (`sips --resampleWidth 900` + `cwebp -q 80`).

Filenames are `<race>-<class>-<gender>[-<variant>].webp` and are the portrait
ids in `src/lib/portraits.ts`. That catalog's manifest must list exactly the
files present here — a vitest acceptance test fails on any drift in either
direction. Files are full-scene illustrations, not headshots, so consumers crop
with `object-fit: cover` and a high `object-position` (~12–15%) to keep the
character's head in frame.

Portraits are decorative only: they carry no game data, never feed the diff
engine or freshness, and every consumer falls back to the class sigil if a file
fails to load.
