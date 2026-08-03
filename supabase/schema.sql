create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'lead_status') then
    create type public.lead_status as enum (
      'not_confirmed',
      'confirmed',
      'in_progress',
      'completed',
      'cancelled'
    );
  end if;
end
$$;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  email text,
  address text,
  service_type text not null,
  description text not null,
  estimated_price numeric(12, 2) not null default 0,
  status public.lead_status not null default 'not_confirmed',
  cancellation_reason text,
  completed_at timestamptz,
  cancelled_at timestamptz,
  deleted_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads add column if not exists customer_name text;
alter table public.leads add column if not exists phone text;
alter table public.leads add column if not exists email text;
alter table public.leads add column if not exists address text;
alter table public.leads add column if not exists service_type text;
alter table public.leads add column if not exists description text;
alter table public.leads add column if not exists estimated_price numeric(12, 2) not null default 0;
alter table public.leads add column if not exists status public.lead_status not null default 'not_confirmed';
alter table public.leads add column if not exists cancellation_reason text;
alter table public.leads add column if not exists completed_at timestamptz;
alter table public.leads add column if not exists cancelled_at timestamptz;
alter table public.leads add column if not exists deleted_at timestamptz;
alter table public.leads add column if not exists created_by uuid references public.profiles(id);
alter table public.leads add column if not exists created_at timestamptz not null default now();
alter table public.leads add column if not exists updated_at timestamptz not null default now();

create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  body text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid references public.profiles(id),
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  notes text,
  paid_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_created_at_idx on public.leads(created_at desc);
create index if not exists leads_deleted_at_idx on public.leads(deleted_at);
create index if not exists payments_lead_id_idx on public.payments(lead_id);
create index if not exists lead_activities_lead_id_idx on public.lead_activities(lead_id);
create index if not exists lead_notes_lead_id_idx on public.lead_notes(lead_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

create or replace view public.lead_payment_summary as
select
  leads.id as lead_id,
  leads.estimated_price as total_amount,
  coalesce(sum(payments.amount), 0) as paid_amount,
  greatest(leads.estimated_price - coalesce(sum(payments.amount), 0), 0) as pending_amount
from public.leads
left join public.payments on payments.lead_id = leads.id
group by leads.id;

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.lead_notes enable row level security;
alter table public.lead_activities enable row level security;
alter table public.payments enable row level security;

drop policy if exists "Authenticated users can read profiles" on public.profiles;
create policy "Authenticated users can read profiles"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Authenticated users can manage leads" on public.leads;
create policy "Authenticated users can manage leads"
on public.leads for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can manage lead notes" on public.lead_notes;
create policy "Authenticated users can manage lead notes"
on public.lead_notes for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can manage lead activities" on public.lead_activities;
create policy "Authenticated users can manage lead activities"
on public.lead_activities for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can manage payments" on public.payments;
create policy "Authenticated users can manage payments"
on public.payments for all
to authenticated
using (true)
with check (true);
