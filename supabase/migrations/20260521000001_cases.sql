-- User's tracked cases (private via RLS)
create table if not exists cases (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        references auth.users not null,
  receipt_no        text        not null,
  visa_type         text        not null check (visa_type in ('CR1', 'IR1')),
  consulate         text,
  country_birth     text,
  current_stage     text,
  raw_status        text,
  last_checked      timestamptz,
  last_stage_change timestamptz,
  opted_in          boolean     not null default false,
  created_at        timestamptz not null default now(),

  constraint cases_receipt_no_check check (length(trim(receipt_no)) > 0),
  constraint cases_visa_type_check check (visa_type in ('CR1', 'IR1'))
);

-- Row-level security: users can only see and modify their own cases
alter table cases enable row level security;

create policy "Users can view own cases"
  on cases for select
  using (auth.uid() = user_id);

create policy "Users can insert own cases"
  on cases for insert
  with check (auth.uid() = user_id);

create policy "Users can update own cases"
  on cases for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own cases"
  on cases for delete
  using (auth.uid() = user_id);

-- Index for fast lookup by user
create index if not exists cases_user_id_idx on cases (user_id);
