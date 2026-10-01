-- ==========================================================
-- Lead Management & Prospects CRM - Complete Supabase Schema
-- ==========================================================

-- 1. Enable required extensions
create extension if not exists "pgcrypto";

-- 2. Profiles Table (linked to Supabase Auth users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Custom Enums
do $$ begin
  if not exists (select 1 from pg_type where typname = 'lead_status') then
    create type public.lead_status as enum (
      'not_confirmed',
      'confirmed',
      'in_progress',
      'completed',
      'cancelled'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'prospect_status') then
    create type public.prospect_status as enum (
      'warm',
      'cold',
      'not_interested'
    );
  end if;
end $$;

-- 4. Leads & Prospects Table
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
  record_type text not null default 'lead' check (record_type in ('lead', 'prospect')),
  prospect_status public.prospect_status default 'cold',
  cancellation_reason text,
  completed_at timestamptz,
  cancelled_at timestamptz,
  deleted_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure all columns exist (if updating an existing table)
alter table public.leads add column if not exists customer_name text;
alter table public.leads add column if not exists phone text;
alter table public.leads add column if not exists email text;
alter table public.leads add column if not exists address text;
alter table public.leads add column if not exists service_type text;
alter table public.leads add column if not exists description text;
alter table public.leads add column if not exists estimated_price numeric(12, 2) not null default 0;
alter table public.leads add column if not exists status public.lead_status not null default 'not_confirmed';
alter table public.leads add column if not exists record_type text not null default 'lead';
alter table public.leads add column if not exists prospect_status public.prospect_status default 'cold';
alter table public.leads add column if not exists cancellation_reason text;
alter table public.leads add column if not exists completed_at timestamptz;
alter table public.leads add column if not exists cancelled_at timestamptz;
alter table public.leads add column if not exists deleted_at timestamptz;
alter table public.leads add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.leads add column if not exists created_at timestamptz not null default now();
alter table public.leads add column if not exists updated_at timestamptz not null default now();

-- 5. Lead Notes Table
create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  body text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 6. Lead Activity Logs Table
create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  message text not null,
  created_at timestamptz not null default now()
);

-- 7. Payments Table
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  notes text,
  paid_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 8. Performance Indexes
create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_record_type_idx on public.leads(record_type);
create index if not exists leads_prospect_status_idx on public.leads(prospect_status);
create index if not exists leads_created_at_idx on public.leads(created_at desc);
create index if not exists leads_deleted_at_idx on public.leads(deleted_at);
create index if not exists payments_lead_id_idx on public.payments(lead_id);
create index if not exists lead_activities_lead_id_idx on public.lead_activities(lead_id);
create index if not exists lead_notes_lead_id_idx on public.lead_notes(lead_id);

-- 9. Trigger Functions for updated_at
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

-- 10. Automatically Create Profile on Auth Signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'admin'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profile for any existing auth user
insert into public.profiles (id, full_name, role)
select id, coalesce(raw_user_meta_data->>'full_name', email), 'admin'
from auth.users
on conflict (id) do nothing;

-- 11. Payments Summary View
create or replace view public.lead_payment_summary as
select
  leads.id as lead_id,
  leads.estimated_price as total_amount,
  coalesce(sum(payments.amount), 0) as paid_amount,
  greatest(leads.estimated_price - coalesce(sum(payments.amount), 0), 0) as pending_amount
from public.leads
left join public.payments on payments.lead_id = leads.id
group by leads.id;

-- 12. Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.lead_notes enable row level security;
alter table public.lead_activities enable row level security;
alter table public.payments enable row level security;

-- Profiles Policies
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

-- Leads Policies (allow full authenticated management)
drop policy if exists "Authenticated users can manage leads" on public.leads;
create policy "Authenticated users can manage leads"
  on public.leads for all
  to authenticated
  using (true)
  with check (true);

-- Lead Notes Policies
drop policy if exists "Authenticated users can manage lead notes" on public.lead_notes;
create policy "Authenticated users can manage lead notes"
  on public.lead_notes for all
  to authenticated
  using (true)
  with check (true);

-- Lead Activities Policies
drop policy if exists "Authenticated users can manage lead activities" on public.lead_activities;
create policy "Authenticated users can manage lead activities"
  on public.lead_activities for all
  to authenticated
  using (true)
  with check (true);

-- Payments Policies
drop policy if exists "Authenticated users can manage payments" on public.payments;
create policy "Authenticated users can manage payments"
  on public.payments for all
  to authenticated
  using (true)
  with check (true);

-- Optional: Allow Anon access if needed during testing / unauthenticated demo
-- (Uncomment below if using public API key without user sign-in)
-- create policy "Anon access to leads" on public.leads for all to anon using (true) with check (true);
-- create policy "Anon access to lead_notes" on public.lead_notes for all to anon using (true) with check (true);
-- create policy "Anon access to lead_activities" on public.lead_activities for all to anon using (true) with check (true);
-- create policy "Anon access to payments" on public.payments for all to anon using (true) with check (true);
