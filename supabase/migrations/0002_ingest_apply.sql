-- Transactional ingestion. The whole run — patch row, entity upserts,
-- deletion reconciliation, build flags, audit row — commits or rolls back as
-- one unit. Called via RPC with the service role only.

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
  insert into sets (id, name, type, source, dlc_required, bonuses, mythic_slot, first_seen_patch, last_changed_patch)
  select
    s->>'id', s->>'name', s->>'type', s->>'source', s->>'dlc_required',
    coalesce(s->'bonuses', '[]'::jsonb), s->>'mythic_slot',
    s->>'first_seen_patch', s->>'last_changed_patch'
  from jsonb_array_elements(coalesce(payload->'sets', '[]'::jsonb)) s
  on conflict (id) do update set
    name = excluded.name, type = excluded.type, source = excluded.source,
    dlc_required = excluded.dlc_required, bonuses = excluded.bonuses,
    mythic_slot = excluded.mythic_slot,
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
  insert into skills (id, class, line, line_label, name, ultimate, description, morphs, first_seen_patch, last_changed_patch)
  select
    s->>'id', s->>'class', s->>'line', s->>'line_label', s->>'name',
    coalesce((s->>'ultimate')::boolean, false), coalesce(s->>'description', ''),
    coalesce(s->'morphs', '[]'::jsonb),
    s->>'first_seen_patch', s->>'last_changed_patch'
  from jsonb_array_elements(coalesce(payload->'skills', '[]'::jsonb)) s
  on conflict (id) do update set
    class = excluded.class, line = excluded.line, line_label = excluded.line_label,
    name = excluded.name, ultimate = excluded.ultimate,
    description = excluded.description, morphs = excluded.morphs,
    first_seen_patch = excluded.first_seen_patch,
    last_changed_patch = excluded.last_changed_patch;

  if jsonb_array_length(coalesce(payload->'skills', '[]'::jsonb)) > 0 then
    delete from skills where id not in (
      select s->>'id' from jsonb_array_elements(payload->'skills') s
    );
  end if;

  -- CP stars
  insert into cp_stars (id, tree, name, effect, slottable, last_changed_patch)
  select
    s->>'id', s->>'tree', s->>'name', coalesce(s->'effect', '{}'::jsonb),
    coalesce((s->>'slottable')::boolean, true), s->>'last_changed_patch'
  from jsonb_array_elements(coalesce(payload->'cp_stars', '[]'::jsonb)) s
  on conflict (id) do update set
    tree = excluded.tree, name = excluded.name, effect = excluded.effect,
    slottable = excluded.slottable, last_changed_patch = excluded.last_changed_patch;

  if jsonb_array_length(coalesce(payload->'cp_stars', '[]'::jsonb)) > 0 then
    delete from cp_stars where id not in (
      select s->>'id' from jsonb_array_elements(payload->'cp_stars') s
    );
  end if;

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
