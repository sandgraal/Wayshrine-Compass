-- Scribing (grimoires + scripts) and Class Mastery line entities.
-- Same posture as 0001: public read via RLS policy, writes via service role
-- only, provenance columns referencing patches(code).

create table grimoires (
  id                 text primary key,
  name               text not null,
  line               text not null,
  line_label         text not null,
  description        text not null default '',
  acquisition        text not null default '',
  dlc_required       text,
  focus_scripts      jsonb not null default '[]',
  signature_scripts  jsonb not null default '[]',
  affix_scripts      jsonb not null default '[]',
  first_seen_patch   text not null references patches(code),
  last_changed_patch text not null references patches(code)
);

create table scribing_scripts (
  id                 text primary key,
  name               text not null,
  slot               text not null check (slot in ('focus','signature','affix')),
  description        text not null default '',
  acquisition        text not null default '',
  first_seen_patch   text not null references patches(code),
  last_changed_patch text not null references patches(code)
);

create table class_mastery_lines (
  id                 text primary key,
  name               text not null,
  class              text not null,
  line               text not null,
  line_label         text not null,
  graftable          boolean not null default true,
  first_seen_patch   text not null references patches(code),
  last_changed_patch text not null references patches(code)
);

-- Builds can slot scribed skills (grimoire + scripts, by id).
alter table builds add column scribed_skills jsonb not null default '[]';

-- build_entities now also joins the new entity types.
alter table build_entities drop constraint build_entities_entity_type_check;
alter table build_entities add constraint build_entities_entity_type_check
  check (entity_type in ('set','skill','cp_star','companion','mundus','food','grimoire','script','mastery_line'));

alter table grimoires enable row level security;
alter table scribing_scripts enable row level security;
alter table class_mastery_lines enable row level security;

create policy "public read grimoires" on grimoires for select using (true);
create policy "public read scribing_scripts" on scribing_scripts for select using (true);
create policy "public read class_mastery_lines" on class_mastery_lines for select using (true);

-- Backfill Class Mastery lines. Builds derive mastery_line refs from their
-- subclassLines (src/lib/entities.ts), so if this table stayed empty until
-- the next scheduled ingest, that first ingest would report every line as
-- "added" and flag every build for review. Seeding the rows to match the
-- current dataset exactly (public/dataset/current.json) makes that first
-- diff a no-op. Stamps use the oldest known patch: "unchanged since before
-- tracking began", which ambers nothing. Skipped when patches is empty
-- (fresh project, migrations run before seeding) — the first ingest then
-- populates the table instead.
insert into class_mastery_lines (id, name, class, line, line_label, graftable, first_seen_patch, last_changed_patch)
select v.id, v.name, v.class, v.line, v.line_label, v.graftable, p.code, p.code
from (values
  ('mastery-arcanist-class-mastery', 'Class Mastery (Arcanist)', 'arcanist', 'class-mastery', 'Class Mastery', false),
  ('mastery-arcanist-curative-runeforms', 'Curative Runeforms (Arcanist)', 'arcanist', 'curative-runeforms', 'Curative Runeforms', true),
  ('mastery-arcanist-herald-of-the-tome', 'Herald of the Tome (Arcanist)', 'arcanist', 'herald-of-the-tome', 'Herald of the Tome', true),
  ('mastery-arcanist-soldier-of-apocrypha', 'Soldier of Apocrypha (Arcanist)', 'arcanist', 'soldier-of-apocrypha', 'Soldier of Apocrypha', true),
  ('mastery-dragonknight-ardent-flame', 'Ardent Flame (Dragonknight)', 'dragonknight', 'ardent-flame', 'Ardent Flame', true),
  ('mastery-dragonknight-class-mastery', 'Class Mastery (Dragonknight)', 'dragonknight', 'class-mastery', 'Class Mastery', false),
  ('mastery-dragonknight-draconic-power', 'Draconic Power (Dragonknight)', 'dragonknight', 'draconic-power', 'Draconic Power', true),
  ('mastery-dragonknight-earthen-heart', 'Earthen Heart (Dragonknight)', 'dragonknight', 'earthen-heart', 'Earthen Heart', true),
  ('mastery-necromancer-bone-tyrant', 'Bone Tyrant (Necromancer)', 'necromancer', 'bone-tyrant', 'Bone Tyrant', true),
  ('mastery-necromancer-class-mastery', 'Class Mastery (Necromancer)', 'necromancer', 'class-mastery', 'Class Mastery', false),
  ('mastery-necromancer-grave-lord', 'Grave Lord (Necromancer)', 'necromancer', 'grave-lord', 'Grave Lord', true),
  ('mastery-necromancer-living-death', 'Living Death (Necromancer)', 'necromancer', 'living-death', 'Living Death', true),
  ('mastery-nightblade-assassination', 'Assassination (Nightblade)', 'nightblade', 'assassination', 'Assassination', true),
  ('mastery-nightblade-class-mastery', 'Class Mastery (Nightblade)', 'nightblade', 'class-mastery', 'Class Mastery', false),
  ('mastery-nightblade-shadow', 'Shadow (Nightblade)', 'nightblade', 'shadow', 'Shadow', true),
  ('mastery-nightblade-siphoning', 'Siphoning (Nightblade)', 'nightblade', 'siphoning', 'Siphoning', true),
  ('mastery-sorcerer-class-mastery', 'Class Mastery (Sorcerer)', 'sorcerer', 'class-mastery', 'Class Mastery', false),
  ('mastery-sorcerer-daedric-summoning', 'Daedric Summoning (Sorcerer)', 'sorcerer', 'daedric-summoning', 'Daedric Summoning', true),
  ('mastery-sorcerer-dark-magic', 'Dark Magic (Sorcerer)', 'sorcerer', 'dark-magic', 'Dark Magic', true),
  ('mastery-sorcerer-storm-calling', 'Storm Calling (Sorcerer)', 'sorcerer', 'storm-calling', 'Storm Calling', true),
  ('mastery-templar-aedric-spear', 'Aedric Spear (Templar)', 'templar', 'aedric-spear', 'Aedric Spear', true),
  ('mastery-templar-class-mastery', 'Class Mastery (Templar)', 'templar', 'class-mastery', 'Class Mastery', false),
  ('mastery-templar-dawns-wrath', 'Dawn''s Wrath (Templar)', 'templar', 'dawns-wrath', 'Dawn''s Wrath', true),
  ('mastery-templar-restoring-light', 'Restoring Light (Templar)', 'templar', 'restoring-light', 'Restoring Light', true),
  ('mastery-warden-animal-companions', 'Animal Companions (Warden)', 'warden', 'animal-companions', 'Animal Companions', true),
  ('mastery-warden-class-mastery', 'Class Mastery (Warden)', 'warden', 'class-mastery', 'Class Mastery', false),
  ('mastery-warden-green-balance', 'Green Balance (Warden)', 'warden', 'green-balance', 'Green Balance', true),
  ('mastery-warden-winters-embrace', 'Winter''s Embrace (Warden)', 'warden', 'winters-embrace', 'Winter''s Embrace', true)
) as v(id, name, class, line, line_label, graftable)
cross join (select code from patches order by released_at limit 1) p
on conflict (id) do nothing;

-- ingest_apply v2: same transaction contract as 0002, now covering the
-- Scribing and Class Mastery tables. Replaces the 0002 function body in a
-- new migration (applied migrations are never edited). Payloads without the
-- new keys behave exactly like before (coalesce to empty ⇒ no upserts, no
-- removal reconciliation).
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
