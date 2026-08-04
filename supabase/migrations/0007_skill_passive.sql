-- Skills gain a passive marker. Passive abilities can never be slotted on a
-- bar; without the column the planner offered Combustion alongside actives.
-- The flag is presentation metadata for pickers (the diff engine ignores it
-- alongside gameId), populated from UESP's Active/Passive/Ultimate type.
-- ingest_apply v5: v4 plus passive passthrough on skills.

alter table skills add column if not exists passive boolean not null default false;

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
  insert into skills (id, class, line, line_label, name, ultimate, passive, description, morphs, game_id, first_seen_patch, last_changed_patch)
  select
    s->>'id', s->>'class', s->>'line', s->>'line_label', s->>'name',
    coalesce((s->>'ultimate')::boolean, false),
    coalesce((s->>'passive')::boolean, false), coalesce(s->>'description', ''),
    coalesce(s->'morphs', '[]'::jsonb), s->>'game_id',
    s->>'first_seen_patch', s->>'last_changed_patch'
  from jsonb_array_elements(coalesce(payload->'skills', '[]'::jsonb)) s
  on conflict (id) do update set
    class = excluded.class, line = excluded.line, line_label = excluded.line_label,
    name = excluded.name, ultimate = excluded.ultimate, passive = excluded.passive,
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
