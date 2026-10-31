-- Anonymous-by-default citizens: no name, no citizen account. The phone number is kept only when the
-- citizen opts in, is visible to the assigned officer only, and is erased when the complaint closes.

alter table public.complaints
  add column if not exists consent_phone  boolean not null default false,
  add column if not exists reporter_device text;       -- random id from the filing browser; blocks self-confirming

-- Wipe what earlier versions collected.
update public.complaints set citizen_phone = null, citizen_id = null where true;
alter table public.complaints drop column if exists citizen_name;
delete from public.users where role = 'citizen';
delete from public.otp_verifications where true;

-- Erase the number once the complaint is resolved or closed.
create or replace function public.erase_phone_on_close() returns trigger as $$
begin
  if new.status in ('resolved', 'closed') then
    new.citizen_phone := null;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists complaints_erase_phone on public.complaints;
create trigger complaints_erase_phone before insert or update on public.complaints
  for each row execute function public.erase_phone_on_close();

-- "I see this too" is now deduplicated per browser, not per phone.
alter table public.complaint_confirmations drop constraint if exists complaint_confirmations_pkey;
do $$
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'complaint_confirmations' and column_name = 'phone') then
    alter table public.complaint_confirmations add column if not exists device_id text;
    update public.complaint_confirmations set device_id = 'legacy-' || md5(phone) where true;   -- keeps existing counts, drops the number
    alter table public.complaint_confirmations alter column device_id set not null;
    alter table public.complaint_confirmations drop column phone;
    alter table public.complaint_confirmations add primary key (complaint_id, device_id);
  end if;
end $$;
