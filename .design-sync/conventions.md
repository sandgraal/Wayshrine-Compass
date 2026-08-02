# Building with Wayshrine Compass

A dark-first component set for a patch-versioned Elder Scrolls Online database.
Everything below is Tailwind v4 utilities over semantic CSS custom properties —
there are no per-component class maps to learn.

## Setup: paint the surface, then wrap for platform

The palette lives on `:root`, but **nothing paints it for you**. The app does it on
`body`; a design must do the same on its own root, or you get near-white text on a
white page:

```jsx
<div className="min-h-screen bg-background font-sans text-foreground">
  {/* everything else */}
</div>
```

`PlatformProvider` supplies the PC/console context. `PlatformToggle` and
`BuildGuidance` call `usePlatform()` and **render blank or throw without it** — wrap
once, near the root, whenever you use either:

```jsx
<PlatformProvider>
  <PlatformToggle />
  <BuildGuidance blocks={blocks} />
</PlatformProvider>
```

Console mode is a product rule, not decoration: with it on, no rendered guidance may
depend on a PC addon. `BuildGuidance` enforces that itself — pass it the raw block
list and let it filter.

## Styling idiom: semantic tokens only

Never hardcode a hex or a Tailwind palette color (`bg-slate-800`, `text-gray-400`).
Every color utility takes one of these token names, and each works with the
`bg- / text- / border- / ring-` prefixes plus an optional `/NN` alpha:

| Family | Token names |
|---|---|
| Surfaces | `background`, `card`, `popover`, `secondary`, `muted`, `accent` |
| Text on them | `foreground`, `card-foreground`, `popover-foreground`, `secondary-foreground`, `muted-foreground`, `accent-foreground` |
| Brand / action | `primary`, `primary-foreground` (amber — the accent this product is built around) |
| Danger | `destructive`, `destructive-foreground` |
| Lines & focus | `border`, `input`, `ring` |
| **Freshness** | `verified` (green), `needs-review` (amber), `stale` (red) |

The freshness trio is the heart of the product — patch-trust state. The house pattern
for a tinted callout is a `/10`–`/15` background with a `/40` border:

```jsx
<div className="rounded-md border border-needs-review/40 bg-needs-review/10 px-3 py-2 text-xs">
  Crystal Shard changed in U50
</div>
```

Radius: `rounded-sm | md | lg | xl` all derive from `--radius`. Type: `font-sans` is
Geist, `font-mono` is Geist Mono — use mono for patch codes (`U50`) and numerals.

**The stylesheet is a compiled Tailwind subset.** Utility values and variants are available
only where they are explicitly safelisted in `.design-sync/tailwind-entry.css`; do not
assume every utility has every responsive or state variant. If you need something outside
that surface, use an inline style against the token instead of inventing a class — the
custom properties are always defined:

```jsx
<div style={{ borderColor: "var(--ring)", background: "var(--card)" }} />
```

## Components

Use the library component before hand-rolling markup. Compounds ship all their parts:

- `Card` + `CardHeader` `CardTitle` `CardDescription` `CardAction` `CardContent` `CardFooter`
- `Table` + `TableHeader` `TableBody` `TableFooter` `TableRow` `TableHead` `TableCell` `TableCaption`
- `Select` + `SelectTrigger` `SelectValue` `SelectContent` `SelectGroup` `SelectLabel` `SelectItem` `SelectSeparator`
- `Button` (`variant`: default/secondary/destructive/outline/ghost/link; `size`: xs/sm/default/lg/icon/icon-xs/icon-sm/icon-lg)
- `Badge` (same variants, no sizes), `Input`, `Label`
- `FreshnessBadge` — takes a `freshness` object and `currentPatch`; renders the verified/needs-review/stale pill
- `BuildGuidance`, `PlatformToggle`, `PlatformProvider`, `usePlatform`

`badgeVariants` / `buttonVariants` are exported if you need the class strings on a
different element.

Read `styles.css` and its imports for the full token and utility surface, and each
component's `.d.ts` and `.prompt.md` for its real API and worked examples.

## A typical composition

```jsx
<PlatformProvider>
  <div className="min-h-screen bg-background font-sans text-foreground">
    <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Sorcerer DPS</h1>
        <FreshnessBadge freshness={freshness} currentPatch="U50" />
        <span className="ml-auto rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
          U50
        </span>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Gear</CardTitle>
          <CardDescription>Verified against the current patch</CardDescription>
          <CardAction><Badge variant="secondary">Trial</Badge></CardAction>
        </CardHeader>
        <CardContent>
          <Table>{/* TableHeader / TableBody rows */}</Table>
        </CardContent>
      </Card>
    </div>
  </div>
</PlatformProvider>
```
