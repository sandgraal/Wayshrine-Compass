-- Repairs the 0004/0005 split and completes cp-star provenance.
--
-- History: two migrations were both authored as "0004" on separate branches.
-- 0004_entity_renames.sql (game_id columns, entity_supersessions, ingest_apply
-- v3) was never applied to the live project; 0004_scribing_class_mastery.sql
-- (renamed to 0005 when the collision was found) was applied and redefined
-- ingest_apply WITHOUT the rename support, so persisted payloads silently
-- dropped their game_id and supersessions keys. This migration:
--   1. re-states the rename DDL idempotently (no-op where 0004 already ran),
--   2. adds cp_stars.first_seen_patch (sets/skills/grimoires/scripts/mastery
--      lines all have it; cp_stars was the one provenance gap),
--   3. drops the never-used items table (defined in 0001, read by nothing),
--   4. redefines ingest_apply as the union of v2 (scribing) and v3 (renames),
--      now also writing cp-star first_seen_patch.

alter table sets     add column if not exists game_id text;
alter table skills   add column if not exists game_id text;
alter table cp_stars add column if not exists game_id text;

create table if not exists entity_supersessions (
  entity_type text not null check (entity_type in ('set','skill','cp_star')),
  old_id      text not null,
  old_name    text not null,
  new_id      text not null,
  new_name    text not null,
  patch       text not null references patches(code),
  noted_at    timestamptz not null default now(),
  primary key (entity_type, old_id)
);

-- Freshness names the successor on public build pages, so this is public-read
-- like the entity tables. Writes go through ingest_apply (service role) only.
alter table entity_supersessions enable row level security;
drop policy if exists "public read entity_supersessions" on entity_supersessions;
create policy "public read entity_supersessions" on entity_supersessions for select using (true);

-- cp_stars provenance catch-up. Existing rows have only last_changed_patch;
-- first_seen_patch backfills to it (the most conservative claim: "not seen
-- before its last change"). Not-null after backfill, matching sets/skills.
alter table cp_stars add column if not exists first_seen_patch text references patches(code);
update cp_stars set first_seen_patch = last_changed_patch where first_seen_patch is null;
alter table cp_stars alter column first_seen_patch set not null;

-- The items table shipped in 0001 and was never wired to anything: no Item
-- type exists, nothing reads or writes it.
drop table if exists items;

-- ingest_apply v4: v2's scribing/mastery coverage + v3's game_id passthrough
-- and supersessions upsert + cp-star first_seen_patch. The cp-star provenance
-- columns coalesce defensively so a payload from a not-yet-deployed writer
-- (no first_seen_patch key) can never null out or regress stored provenance.
create or replace function ingest_apply(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Patch
  insert into patches (id, code, name, released_at, season)
  values (
    payload->'patch'->>'id',
    payload->'patch'->>'code',
    payload->'patch'->>'name',
    nullif(payload->'patch'->>'released_at', '')::date,
    payload->'patch'->>'season'
  )
  on conflict (id) do update set
    code = excluded.code,
    name = excluded.name,
    released_at = excluded.released_at,
    season = excluded.season;

  -- Sets
  insert into sets (id, name, type, source, dlc_required, bonuses, mythic_slot, game_id, first_seen_patch, last_changed_patch)
  select
    s->>'id', s->>'name', s->>'type', s->>'source', s->>'dlc_required',
    coalesce(s->'bonuses', '[]'::jsonb), s->>'mythic_slot', s->>'game_id',
    s->>'first_seen_patch', s->>'last_changed_patch'
  from jsonb_array_elements(coalesce(payload->'sets', '[]'::jsonb)) s
  on conflict (id) do update set
    name = excluded.name, type = excluded.type, source = excluded.source,
    dlc_required = excluded.dlc_required, bonuses = excluded.bonuses,
    mythic_slot = excluded.mythic_slot, game_id = excluded.game_id,
    first_seen_patch = excluded.first_seen_patch,
    last_changed_patch = excluded.last_changed_patch;

  -- Reconcile removals (skip when the category is empty — an empty array is
  -- far more likely a broken dataset than a real wipe of every entity).
  if jsonb_array_length(coalesce(payload->'sets', '[]'::jsonb)) > 0 then
    delete from sets where id not in (
      select s->>'id' from jsonb_array_elements(payload->'sets') s
    );
  end if;

  -- Skills
  insert into skills (id, class, line, line_label, name, ultimate, description, morphs, game_id, first_seen_patch, last_changed_patch)
  select
    s->>'id', s->>'class', s->>'line', s->>'line_label', s->>'name',
    coalesce((s->>'ultimate')::boolean, false), coalesce(s->>'description', ''),
    coalesce(s->'morphs', '[]'::jsonb), s->>'game_id',
    s->>'first_seen_patch', s->>'last_changed_patch'
  from jsonb_array_elements(coalesce(payload->'skills', '[]'::jsonb)) s
  on conflict (id) do update set
    class = excluded.class, line = excluded.line, line_label = excluded.line_label,
    name = excluded.name, ultimate = excluded.ultimate,
    description = excluded.description, morphs = excluded.morphs,
    game_id = excluded.game_id,
    first_seen_patch = excluded.first_seen_patch,
    last_changed_patch = excluded.last_changed_patch;

  if jsonb_array_length(coalesce(payload->'skills', '[]'::jsonb)) > 0 then
    delete from skills where id not in (
      select s->>'id' from jsonb_array_elements(payload->'skills') s
    );
  end if;

  -- CP stars
  insert into cp_stars (id, tree, name, effect, slottable, game_id, first_seen_patch, last_changed_patch)
  select
    s->>'id', s->>'tree', s->>'name', coalesce(s->'effect', '{}'::jsonb),
    coalesce((s->>'slottable')::boolean, true), s->>'game_id',
    coalesce(s->>'first_seen_patch', s->>'last_changed_patch'),
    s->>'last_changed_patch'
  from jsonb_array_elements(coalesce(payload->'cp_stars', '[]'::jsonb)) s
  on conflict (id) do update set
    tree = excluded.tree, name = excluded.name, effect = excluded.effect,
    slottable = excluded.slottable, game_id = excluded.game_id,
    first_seen_patch = coalesce(excluded.first_seen_patch, cp_stars.first_seen_patch),
    last_changed_patch = excluded.last_changed_patch;

  if jsonb_array_length(coalesce(payload->'cp_stars', '[]'::jsonb)) > 0 then
    delete from cp_stars where id not in (
      select s->>'id' from jsonb_array_elements(payload->'cp_stars') s
    );
  end if;

  -- Grimoires
  insert into grimoires (id, name, line, line_label, description, acquisition, dlc_required,
                         focus_scripts, signature_scripts, affix_scripts,
                         first_seen_patch, last_changed_patch)
  select
    g->>'id', g->>'name', g->>'line', g->>'line_label',
    coalesce(g->>'description', ''), coalesce(g->>'acquisition', ''), g->>'dlc_required',
    coalesce(g->'focus_scripts', '[]'::jsonb),
    coalesce(g->'signature_scripts', '[]'::jsonb),
    coalesce(g->'affix_scripts', '[]'::jsonb),
    g->>'first_seen_patch', g->>'last_changed_patch'
  from jsonb_array_elements(coalesce(payload->'grimoires', '[]'::jsonb)) g
  on conflict (id) do update set
    name = excluded.name, line = excluded.line, line_label = excluded.line_label,
    description = excluded.description, acquisition = excluded.acquisition,
    dlc_required = excluded.dlc_required,
    focus_scripts = excluded.focus_scripts,
    signature_scripts = excluded.signature_scripts,
    affix_scripts = excluded.affix_scripts,
    first_seen_patch = excluded.first_seen_patch,
    last_changed_patch = excluded.last_changed_patch;

  if jsonb_array_length(coalesce(payload->'grimoires', '[]'::jsonb)) > 0 then
    delete from grimoires where id not in (
      select g->>'id' from jsonb_array_elements(payload->'grimoires') g
    );
  end if;

  -- Scribing scripts
  insert into scribing_scripts (id, name, slot, description, acquisition, first_seen_patch, last_changed_patch)
  select
    s->>'id', s->>'name', s->>'slot',
    coalesce(s->>'description', ''), coalesce(s->>'acquisition', ''),
    s->>'first_seen_patch', s->>'last_changed_patch'
  from jsonb_array_elements(coalesce(payload->'scripts', '[]'::jsonb)) s
  on conflict (id) do update set
    name = excluded.name, slot = excluded.slot,
    description = excluded.description, acquisition = excluded.acquisition,
    first_seen_patch = excluded.first_seen_patch,
    last_changed_patch = excluded.last_changed_patch;

  if jsonb_array_length(coalesce(payload->'scripts', '[]'::jsonb)) > 0 then
    delete from scribing_scripts where id not in (
      select s->>'id' from jsonb_array_elements(payload->'scripts') s
    );
  end if;

  -- Class Mastery lines
  insert into class_mastery_lines (id, name, class, line, line_label, graftable, first_seen_patch, last_changed_patch)
  select
    m->>'id', m->>'name', m->>'class', m->>'line', m->>'line_label',
    coalesce((m->>'graftable')::boolean, true),
    m->>'first_seen_patch', m->>'last_changed_patch'
  from jsonb_array_elements(coalesce(payload->'class_mastery_lines', '[]'::jsonb)) m
  on conflict (id) do update set
    name = excluded.name, class = excluded.class, line = excluded.line,
    line_label = excluded.line_label, graftable = excluded.graftable,
    first_seen_patch = excluded.first_seen_patch,
    last_changed_patch = excluded.last_changed_patch;

  if jsonb_array_length(coalesce(payload->'class_mastery_lines', '[]'::jsonb)) > 0 then
    delete from class_mastery_lines where id not in (
      select m->>'id' from jsonb_array_elements(payload->'class_mastery_lines') m
    );
  end if;

  -- Record renames. The old row is gone (reconciled above); this map is what
  -- lets freshness say "renamed to Y" for a build still on the old id.
  insert into entity_supersessions (entity_type, old_id, old_name, new_id, new_name, patch)
  select
    x->>'entity_type', x->>'old_id', x->>'old_name', x->>'new_id', x->>'new_name', x->>'patch'
  from jsonb_array_elements(coalesce(payload->'supersessions', '[]'::jsonb)) x
  on conflict (entity_type, old_id) do update set
    old_name = excluded.old_name, new_id = excluded.new_id,
    new_name = excluded.new_name, patch = excluded.patch;

  -- Flag affected builds
  update builds b
  set status = 'needs_review', review_reasons = f->'reasons'
  from jsonb_array_elements(coalesce(payload->'flagged', '[]'::jsonb)) f
  where b.id = f->>'id';

  -- Audit trail
  insert into ingest_runs (from_patch, to_patch, report, flagged)
  values (
    payload->>'from_patch',
    payload->'patch'->>'code',
    coalesce(payload->'report', '{}'::jsonb),
    coalesce(payload->'flagged', '[]'::jsonb)
  );
end;
$$;

-- Service role only; everyone else is locked out (create or replace keeps
-- prior grants, so re-revoke defensively).
revoke execute on function ingest_apply(jsonb) from public, anon, authenticated;
