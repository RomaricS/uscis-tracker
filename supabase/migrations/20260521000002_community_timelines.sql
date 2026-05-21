-- Anonymized community wait-time data (no user_id by design — no join path back to individuals)
create table if not exists community_timelines (
  id            uuid    primary key default gen_random_uuid(),
  visa_type     text    not null check (visa_type in ('CR1', 'IR1')),
  consulate     text,
  country_birth text,
  stage         text    not null,
  days_in_stage int     not null check (days_in_stage >= 0),
  year          int     not null,
  created_at    timestamptz not null default now()
);

-- RLS: anyone can read (anonymized data), only the app service role can write
alter table community_timelines enable row level security;

create policy "Anyone can read community timelines"
  on community_timelines for select
  using (true);

-- No insert/update/delete policy for authenticated users —
-- writes happen only via the Supabase Edge Function with the service role key.

-- Indexes for the community ETA query (visa_type + stage + consulate + year)
create index if not exists ct_visa_stage_idx
  on community_timelines (visa_type, stage);

create index if not exists ct_visa_stage_consulate_year_idx
  on community_timelines (visa_type, stage, consulate, year);

create index if not exists ct_visa_stage_consulate_birth_year_idx
  on community_timelines (visa_type, stage, consulate, country_birth, year);
