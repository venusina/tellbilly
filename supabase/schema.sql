-- TellBilly database schema
--
-- Tables: clients, jobs, expenses, invoices.
-- Every table carries a `user_id` scoped to the authenticated tradesperson
-- (defaulting to auth.uid()), with row-level security enforcing that a user
-- can only ever see/modify their own rows. Run this against a fresh
-- Supabase project's SQL editor, or via `supabase db push`.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_user_id_idx on clients (user_id);

create trigger clients_set_updated_at
  before update on clients
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- jobs
-- ---------------------------------------------------------------------------

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  title text not null,
  description text,
  work_status text not null default 'in-progress'
    check (work_status in ('in-progress', 'done')),
  payment_status text not null default 'awaiting-payment'
    check (payment_status in ('awaiting-payment', 'paid')),
  quoted_amount numeric(12, 2) not null default 0 check (quoted_amount >= 0),
  job_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists jobs_user_id_idx on jobs (user_id);
create index if not exists jobs_client_id_idx on jobs (client_id);

create trigger jobs_set_updated_at
  before update on jobs
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------------------

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  job_id uuid not null references jobs (id) on delete cascade,
  description text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  category text not null default 'other'
    check (category in ('materials', 'labor', 'equipment', 'permits', 'travel', 'other')),
  incurred_at timestamptz not null default now(),
  receipt_url text,
  created_at timestamptz not null default now()
);

create index if not exists expenses_user_id_idx on expenses (user_id);
create index if not exists expenses_job_id_idx on expenses (job_id);

-- ---------------------------------------------------------------------------
-- invoices
-- ---------------------------------------------------------------------------

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  job_id uuid not null references jobs (id) on delete cascade,
  invoice_number text not null unique,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'paid', 'overdue', 'void')),
  -- Array of { id, description, quantity, unitPrice }. Kept as JSONB rather
  -- than a child table since line items are always read/written as a whole
  -- with their parent invoice.
  line_items jsonb not null default '[]'::jsonb,
  subtotal numeric(12, 2) not null default 0,
  tax_rate numeric(6, 4) not null default 0,
  tax_amount numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  issue_date date not null default current_date,
  due_date date not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_user_id_idx on invoices (user_id);
create index if not exists invoices_job_id_idx on invoices (job_id);

create trigger invoices_set_updated_at
  before update on invoices
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table clients enable row level security;
alter table jobs enable row level security;
alter table expenses enable row level security;
alter table invoices enable row level security;

create policy "clients_owner_all" on clients
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "jobs_owner_all" on jobs
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "expenses_owner_all" on expenses
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "invoices_owner_all" on invoices
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
