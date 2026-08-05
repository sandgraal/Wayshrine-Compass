/**
 * Maintainer notes — a hand-written, first-person changelog. Distinct from the
 * automated pipeline run feed on /patch-tracker (which is the machine record of
 * what the data ingest observed); this is the human record of what changed
 * about the site and why. Newest first.
 *
 * Typed data, not MDX: a couple dozen short entries don't warrant a compile
 * pipeline, and src/data/* is the house convention for authored content.
 */
export interface ChangelogEntry {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  title: string;
  /** First-person prose. Kept short; one idea per entry. */
  body: string;
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-08-05",
    title: "The site draws its own icons now",
    body: "Set-type and skill-line sigils are original art made for this site, not extracted game files. It's the honest choice — reusing ZeniMax's icons isn't something I have the right to do — and it lets the art encode things the game icons don't, like a set's source and a line's role.",
  },
  {
    date: "2026-08-05",
    title: "Scrubbed the machine-generated feel",
    body: "Went through the copy and chrome and pulled the tells that make a site read as auto-generated: the default font stack, the sparkle icon on the recommend button, the em-dashes stacked three to a sentence. The writing here is mine; I'd rather it read that way.",
  },
  {
    date: "2026-08-04",
    title: "What Next remembers what you've done",
    body: "You can check off or hide a suggestion and it stays gone on your next visit — no account, it just lives in your browser. Joining the guilds you already joined shouldn't keep showing up.",
  },
  {
    date: "2026-08-04",
    title: "The patch tracker shows the diff, not a badge",
    body: "Every ingest run is a persisted audit row now, and the tracker renders the actual per-entity changes with old and new values where I have them. A quiet update is reported as quiet. If I'm going to claim a build is current, you should be able to see exactly what I checked.",
  },
  {
    date: "2026-08-04",
    title: "The planner works off the whole catalog",
    body: "It used to offer a small hand-picked slice of sets while the database page showed everything. Now the planner reads the same live catalog — every set and skill — with legality checks and a freshness preview as you build.",
  },
  {
    date: "2026-08-04",
    title: "Freshness means something again",
    body: "The first full data import stamped every entity at once, which made every badge light up amber — noise, not signal. Now a badge only claims a change when the data actually changed; otherwise it says 'tracked since', and a verified build shows how many entities were checked. Show the work, or the badge is worthless.",
  },
];
