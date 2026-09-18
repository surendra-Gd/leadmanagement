-- supabase/migrations/002_add_prospects.sql

do $$
begin
  if not exists (select 1 from pg_type where typname = 'prospect_status') then
create type public.prospect_status as enum (
      'warm',
      'cold',
      'not_interested'
    );
end if;
end
$$;

alter table public.leads
    add column if not exists record_type text not null default 'lead'
    check (record_type in ('lead', 'prospect'));

alter table public.leads
    add column if not exists prospect_status public.prospect_status;

create index if not exists leads_record_type_idx on public.leads(record_type);
create index if not exists leads_prospect_status_idx on public.leads(prospect_status);