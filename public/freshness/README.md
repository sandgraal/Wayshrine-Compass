# Wayshrine freshness icons

Expected files (transparent-background PNG, square, ≥96px source — served at
18px inline in `FreshnessBadge` via `src/components/wayshrine-icon.tsx`):

```
wayshrine-lit.png     verified      brilliantly lit, pale cyan-blue portal
wayshrine-dim.png     needs_review  barely flickering dim amber ember
wayshrine-unlit.png   stale         extinguished cold dark stone
```

Until these exist the badge renders its original colored dot (the icon
component falls back on load error), so this directory can stay empty.

Prep from generated ≥512² sources (keep PNG for alpha):

```bash
sips -Z 96 source.png --out public/freshness/wayshrine-lit.png
```

Generation prompts live in the project plan / PR description: single centered
stone wayshrine arch game icon on a plain background, in the three states
above, matching the site's slate-stone + cyan-glow (#86D7EA) art direction.
Icons are decorative only — badge text and color remain the accessible signal.
