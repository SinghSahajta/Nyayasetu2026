-- Row Level Security, deny by default.
-- All data access goes through Next.js API routes using the service-role key (which bypasses RLS).
-- Nothing in the browser talks to Supabase directly, so anon and authenticated get no access at all:
-- RLS is on for every table with no policies, and the table/function grants are removed as a second layer.
-- Idempotent: safe to re-run.

alter table public.departments             enable row level security;
alter table public.users                   enable row level security;
alter table public.otp_verifications       enable row level security;
alter table public.complaints              enable row level security;
alter table public.complaint_updates       enable row level security;
alter table public.complaint_confirmations enable row level security;
alter table public.escalations             enable row level security;
alter table public.ai_logs                 enable row level security;
alter table public.schemes                 enable row level security;

-- Second layer: even if a permissive policy is added later by mistake, the roles have no table grants.
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated, public;

-- Same for anything created from now on.
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated, public;

-- The service role keeps working: it needs its grants back after the blanket revoke above.
grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;
