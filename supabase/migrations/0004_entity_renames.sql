-- Entity rename support.
--
-- Skill and CP-star ids derive from the entity name, so an in-game rename mints
-- a new id and reads as a removal + an addition. Two pieces let the diff engine
-- record a rename instead:
--   1. game_id — an optional stable upstream id (e.g. UESP abilityId). When both
--      sides of a diff carry it, a rename is provable rather than inferred.
--   2. entity_supersessions — the old_id -> new_id map. Freshness is computed
--      from provenance (never stored flags), so the successor of a removed
--      reference has to live in queryable provenance, not only in a build's
--      review_reasons. A build referencing the old id still goes amber; it is
--      never silently rewritten to the new id (that stays an authoring choice).

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
create policy "public read entity_supersessions" on entity_supersessions for select using (true);

-- Re-create ingest_apply with game_id passthrough and the supersessions upsert,
-- folded into the same transaction so a rename's provenance can never be half
-- written.
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
  insert into cp_stars (id, tree, name, effect, slottable, game_id, last_changed_patch)
  select
    s->>'id', s->>'tree', s->>'name', coalesce(s->'effect', '{}'::jsonb),
    coalesce((s->>'slottable')::boolean, true), s->>'game_id', s->>'last_changed_patch'
  from jsonb_array_elements(coalesce(payload->'cp_stars', '[]'::jsonb)) s
  on conflict (id) do update set
    tree = excluded.tree, name = excluded.name, effect = excluded.effect,
    slottable = excluded.slottable, game_id = excluded.game_id,
    last_changed_patch = excluded.last_changed_patch;

  if jsonb_array_length(coalesce(payload->'cp_stars', '[]'::jsonb)) > 0 then
    delete from cp_stars where id not in (
      select s->>'id' from jsonb_array_elements(payload->'cp_stars') s
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

-- Service role only; everyone else is locked out.
revoke execute on function ingest_apply(jsonb) from public, anon, authenticated;
