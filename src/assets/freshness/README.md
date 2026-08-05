# Wayshrine freshness icons

Badge icons rendered at 18px by `src/components/wayshrine-icon.tsx`:

```
wayshrine-lit.png     verified      lit, pale cyan-blue portal
wayshrine-dim.png     needs_review  amber ember glow
wayshrine-unlit.png   stale         extinguished dark stone
```

Derived from the project-owned icon sheet vendored at
`src/assets/freshness/wayshrine-icon-sheet.jpeg`
(sha256 c3bdc95afde3ecac68f108abcd0530f5bf54848092c7fe04e5209299103291d0;
column C active / column I inactive), not hand-generated. Pipeline, from the
repo root:

```bash
ffmpeg -i src/assets/freshness/wayshrine-icon-sheet.jpeg sheet.png
```

```bash
# crop the two source icons
ffmpeg -i sheet.png -vf "crop=342:720:682:85"   lit-raw.png
ffmpeg -i sheet.png -vf "crop=342:640:682:1070" unlit-raw.png
# dim = lit with the cyan glow rotated to amber and dimmed
ffmpeg -i lit-raw.png -vf "hue=h=210:s=0.8,eq=brightness=-0.06:saturation=0.9" dim-raw.png
# black background -> alpha (a = max channel, colors unpremultiplied), then 96px
for n in lit dim unlit; do
  ffmpeg -i "$n-raw.png" -vf "format=rgba,geq=r='min(255,255*r(X,Y)/max(1,max(max(r(X,Y),g(X,Y)),b(X,Y))))':g='min(255,255*g(X,Y)/max(1,max(max(r(X,Y),g(X,Y)),b(X,Y))))':b='min(255,255*b(X,Y)/max(1,max(max(r(X,Y),g(X,Y)),b(X,Y))))':a='max(max(r(X,Y),g(X,Y)),b(X,Y))',scale=-1:96" "wayshrine-$n.png"
done
```

The badge falls back to its original colored dot if a file here fails to load.
Icons are decorative only — badge text and color remain the accessible signal.
