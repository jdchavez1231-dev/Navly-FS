-- facilities
create table if not exists facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  regulatory_body text check (regulatory_body in ('USDA', 'FDA')),
  active_standard text check (active_standard in ('BRCGS', 'SQF', 'FSSC22000', 'Custom')),
  audit_date date,
  subscription_status text default 'free' check (subscription_status in ('free', 'active', 'cancelled')),
  created_at timestamptz default now()
);

-- users (extends Supabase auth.users)
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  facility_id uuid references facilities(id) on delete cascade,
  full_name text,
  email text,
  role text default 'admin' check (role in ('admin', 'viewer')),
  created_at timestamptz default now()
);

-- checklists
create table if not exists checklists (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references facilities(id) on delete cascade,
  standard text not null,
  element_code text not null,
  element_name text not null,
  status text default 'incomplete' check (status in ('incomplete', 'complete', 'not_applicable')),
  notes text default '',
  updated_at timestamptz default now()
);

-- sop_documents
create table if not exists sop_documents (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references facilities(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  mapped_standard text,
  compliance_status text default 'pending' check (compliance_status in ('pending', 'compliant', 'gaps_found')),
  uploaded_at timestamptz default now()
);

-- gap_reports
create table if not exists gap_reports (
  id uuid primary key default gen_random_uuid(),
  sop_document_id uuid references sop_documents(id) on delete cascade,
  facility_id uuid references facilities(id) on delete cascade,
  gaps jsonb default '[]',
  generated_at timestamptz default now()
);

-- RLS: enable on all tables
alter table facilities enable row level security;
alter table users enable row level security;
alter table checklists enable row level security;
alter table sop_documents enable row level security;
alter table gap_reports enable row level security;

-- RLS policies
create policy "users access own facility" on facilities
  for all using (
    id in (select facility_id from users where id = auth.uid())
  );

create policy "users access own record" on users
  for all using (id = auth.uid());

create policy "users access own checklists" on checklists
  for all using (
    facility_id in (select facility_id from users where id = auth.uid())
  );

create policy "users access own sop_documents" on sop_documents
  for all using (
    facility_id in (select facility_id from users where id = auth.uid())
  );

create policy "users access own gap_reports" on gap_reports
  for all using (
    facility_id in (select facility_id from users where id = auth.uid())
  );
