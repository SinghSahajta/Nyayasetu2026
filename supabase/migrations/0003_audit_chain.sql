-- Tamper-evident audit log: every complaint_updates row stores sha256(previous hash + its own fields).
-- A trigger does it, so every insert site is covered. Editing or deleting a row breaks the chain,
-- which audit_chain() reports. (Detects tampering; it does not prevent it.)
alter table public.complaint_updates add column if not exists prev_hash text;
alter table public.complaint_updates add column if not exists hash text;

create or replace function public.update_hash(
  p_prev text, p_complaint uuid, p_status text, p_by text, p_notes text, p_public text, p_at timestamptz
) returns text language sql stable as $$
  select encode(sha256(convert_to(concat_ws('|',
    coalesce(p_prev, 'GENESIS'), p_complaint, p_status, p_by, coalesce(p_notes, ''), coalesce(p_public, ''),
    to_char(p_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.US')
  ), 'utf8')), 'hex')
$$;

create or replace function public.complaint_updates_chain() returns trigger language plpgsql as $$
begin
  select u.hash into new.prev_hash from public.complaint_updates u
   where u.complaint_id = new.complaint_id order by u.created_at desc, u.id desc limit 1;
  new.hash := public.update_hash(new.prev_hash, new.complaint_id, new.status, new.changed_by, new.notes, new.public_note, new.created_at);
  return new;
end $$;

drop trigger if exists complaint_updates_chain on public.complaint_updates;
create trigger complaint_updates_chain before insert on public.complaint_updates
  for each row execute function public.complaint_updates_chain();

-- Chain any rows that existed before this migration.
do $$
declare r record; prev text; cur uuid;
begin
  for r in select * from public.complaint_updates order by complaint_id, created_at, id loop
    if cur is distinct from r.complaint_id then prev := null; cur := r.complaint_id; end if;
    update public.complaint_updates
       set prev_hash = prev,
           hash = public.update_hash(prev, r.complaint_id, r.status, r.changed_by, r.notes, r.public_note, r.created_at)
     where id = r.id returning hash into prev;
  end loop;
end $$;

-- Recomputes the chain for one complaint; valid = row matches its hash AND links to the row before it.
create or replace function public.audit_chain(p_complaint uuid)
returns table (id uuid, status text, created_at timestamptz, public_note text, prev_hash text, hash text, valid boolean)
language sql stable as $$
  with o as (
    select u.*, lag(u.hash) over (order by u.created_at, u.id) as expected_prev
      from public.complaint_updates u where u.complaint_id = p_complaint
  )
  select o.id, o.status, o.created_at, o.public_note, o.prev_hash, o.hash,
         (o.prev_hash is not distinct from o.expected_prev
          and o.hash = public.update_hash(o.prev_hash, o.complaint_id, o.status, o.changed_by, o.notes, o.public_note, o.created_at))
    from o order by o.created_at, o.id
$$;
