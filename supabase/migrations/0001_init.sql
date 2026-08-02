-- Wayshrine Compass — entity schema with patch provenance.
-- Everything is an entity; builds reference entities only through
-- build_entities (never free text). That join table powers the diff engine.

create table patches (
  id           text primary key,
  code         text not null unique,
  name         text not null,
  released_at  date,
  season       text
);

create table sets (
  id                 text primary key,
  name               text not null,
  type               text not null check (type in ('crafted','overland','dungeon','trial','arena','pvp','monster','mythic')),
  source             text not null,
  dlc_required       text,
  bonuses            jsonb not null default '[]',
  mythic_slot        text,
  first_seen_patch   text not null references patches(code),
  last_changed_patch text not null references patches(code)
);

create table skills (
  id                 text primary key,
  class              text,
  line               text not null,
  line_label         text not null,
  name               text not null,
  ultimate           boolean not null default false,
  description        text not null default '',
  morphs             jsonb not null default '[]',
  first_seen_patch   text not null references patches(code),
  last_changed_patch text not null references patches(code)
);

create table items (
  id            text primary key,
  name          text not null,
  slot          text not null,
  trait_options jsonb not null default '[]',
  mythic        boolean not null default false,
  source        text
);

create table cp_stars (
  id                 text primary key,
  tree               text not null check (tree in ('warfare','fitness','craft')),
  name               text not null,
  effect             jsonb not null default '{}',
  slottable          boolean not null default true,
  last_changed_patch text not null references patches(code)
);

create table companions (
  id           text primary key,
  name         text not null,
  class        text not null,
  dlc_required text,
  unlock_zone  text not null,
  unlock_npc   text not null,
  role_ratings jsonb not null default '{}'
);

create table zones (
  id           text primary key,
  name         text not null,
  dlc_required text,
  level_scaled boolean not null default true
);

create table mundus_stones (
  id     text primary key,
  name   text not null,
  effect jsonb not null default '{}'
);

create table foods (
  id     text primary key,
  name   text not null,
  effect jsonb not null default '{}'
);

create table builds (
  id             text primary key,
  slug           text not null unique,
  name           text not null,
  class          text not null,
  subclass_lines jsonb not null default '[]',
  role           text not null check (role in ('dps','tank','healer')),
  content_type   text not null check (content_type in ('trial','dungeon','overland','pvp','leveling')),
  author         text not null,
  status         text not null default 'verified' check (status in ('verified','needs_review','stale')),
  patch_verified text not null references patches(code),
  gear           jsonb not null default '[]',
  front_bar      jsonb not null default '{}',
  back_bar       jsonb not null default '{}',
  cp             jsonb not null default '{}',
  mundus_id      text references mundus_stones(id),
  food_id        text references foods(id),
  guidance       jsonb not null default '[]',
  review_reasons jsonb not null default '[]'
);

-- The load-bearing join table: every entity a build references.
create table build_entities (
  build_id    text not null references builds(id) on delete cascade,
  entity_type text not null check (entity_type in ('set','skill','cp_star','companion','mundus','food')),
  entity_id   text not null,
  primary key (build_id, entity_type, entity_id)
);

create index build_entities_entity_idx on build_entities (entity_type, entity_id);

-- Ingestion runs, for the admin audit trail.
create table ingest_runs (
  id          bigint generated always as identity primary key,
  ran_at      timestamptz not null default now(),
  from_patch  text,
  to_patch    text,
  report      jsonb not null default '{}',
  flagged     jsonb not null default '[]'
);

-- Read-only public access; writes go through the service role only.
alter table patches enable row level security;
alter table sets enable row level security;
alter table skills enable row level security;
alter table items enable row level security;
alter table cp_stars enable row level security;
alter table companions enable row level security;
alter table zones enable row level security;
alter table mundus_stones enable row level security;
alter table foods enable row level security;
alter table builds enable row level security;
alter table build_entities enable row level security;
alter table ingest_runs enable row level security;

create policy "public read patches" on patches for select using (true);
create policy "public read sets" on sets for select using (true);
create policy "public read skills" on skills for select using (true);
create policy "public read items" on items for select using (true);
create policy "public read cp_stars" on cp_stars for select using (true);
create policy "public read companions" on companions for select using (true);
create policy "public read zones" on zones for select using (true);
create policy "public read mundus" on mundus_stones for select using (true);
create policy "public read foods" on foods for select using (true);
create policy "public read builds" on builds for select using (true);
create policy "public read build_entities" on build_entities for select using (true);
