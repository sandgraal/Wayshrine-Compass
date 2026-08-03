-- Scalar summaries of ingest_runs for the admin hub. Full report payloads can
-- hold thousands of change entries; the dashboard only renders counts, so the
-- counting happens in Postgres and the row stays small.
--
-- security_invoker makes the view enforce the base table's RLS: ingest_runs
-- has no public read policy, so anon/publishable reads return nothing and the
-- service role (which bypasses RLS) remains the only reader — same posture as
-- the table itself.
create view ingest_run_summaries
with (security_invoker = true) as
select
  id,
  ran_at,
  from_patch,
  to_patch,
  case when jsonb_typeof(report->'changes') = 'array'
       then jsonb_array_length(report->'changes') else 0 end as changes,
  case when jsonb_typeof(flagged) = 'array'
       then jsonb_array_length(flagged) else 0 end as flagged_builds
from ingest_runs;
