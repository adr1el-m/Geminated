-- STAR-LINK Neon schema

create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  star_id text not null unique default ('STAR-' || to_char(timezone('utc'::text, now()), 'YYYY') || '-' || upper(encode(gen_random_bytes(3), 'hex'))),
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  occupation text not null default 'Other Education Personnel',
  region text not null,
  division text not null default 'Not specified',
  school text not null,
  qualification_level text not null default 'Not Specified',
  gender text not null default 'Prefer not to say',
  age_bracket text not null default 'Prefer not to say',
  subjects_taught text[] not null default '{}'::text[],
  training_history text[] not null default '{}'::text[],
  star_participation_status text not null default 'Not Yet Participated',
  consent_data_processing boolean not null default false,
  consent_research boolean not null default false,
  consent_version text not null default 'v1.0',
  consented_at timestamptz,
  terms_version text not null default 'v1.0',
  terms_accepted_at timestamptz,
  anonymization_opt_out boolean not null default false,
  profile_last_updated_at timestamptz not null default timezone('utc'::text, now()),
  years_of_experience integer not null default 0,
  data_quality_score integer not null default 0 check (data_quality_score >= 0 and data_quality_score <= 100),
  role text not null default 'teacher' check (role in ('teacher', 'admin')),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists auth_sessions (
  token text primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists auth_sessions_user_id_idx on auth_sessions(user_id);

alter table profiles add column if not exists star_id text;
update profiles
set star_id = 'STAR-LEGACY-' || upper(substring(replace(id::text, '-', '') for 8))
where star_id is null;
alter table profiles alter column star_id set default ('STAR-' || to_char(timezone('utc'::text, now()), 'YYYY') || '-' || upper(encode(gen_random_bytes(3), 'hex')));
alter table profiles alter column star_id set not null;
create unique index if not exists profiles_star_id_idx on profiles(star_id);

alter table profiles add column if not exists occupation text not null default 'Other Education Personnel';
alter table profiles add column if not exists division text not null default 'Not specified';
alter table profiles add column if not exists qualification_level text not null default 'Not Specified';
alter table profiles add column if not exists gender text not null default 'Prefer not to say';
alter table profiles add column if not exists age_bracket text not null default 'Prefer not to say';
alter table profiles add column if not exists training_history text[] not null default '{}'::text[];
alter table profiles add column if not exists star_participation_status text not null default 'Not Yet Participated';
alter table profiles add column if not exists consent_data_processing boolean not null default false;
alter table profiles add column if not exists consent_research boolean not null default false;
alter table profiles add column if not exists consent_version text not null default 'v1.0';
alter table profiles add column if not exists consented_at timestamptz;
alter table profiles add column if not exists terms_version text not null default 'v1.0';
alter table profiles add column if not exists terms_accepted_at timestamptz;
alter table profiles add column if not exists anonymization_opt_out boolean not null default false;
alter table profiles add column if not exists profile_last_updated_at timestamptz not null default timezone('utc'::text, now());
alter table profiles add column if not exists data_quality_score integer not null default 0;

update profiles
set data_quality_score = 40
where data_quality_score is null;

alter table profiles alter column data_quality_score set not null;
alter table profiles alter column data_quality_score set default 0;

alter table profiles drop constraint if exists profiles_data_quality_score_check;
alter table profiles add constraint profiles_data_quality_score_check
check (data_quality_score >= 0 and data_quality_score <= 100);

create unique index if not exists profiles_teacher_identity_idx
on profiles (lower(full_name), lower(school), region, division);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  changed_fields jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists audit_logs_created_at_idx on audit_logs(created_at desc);
create index if not exists audit_logs_actor_id_idx on audit_logs(actor_id);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null default 'info',
  title text not null,
  message text not null,
  link_url text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists notifications_user_created_idx
on notifications(user_id, created_at desc);

create index if not exists notifications_user_read_idx
on notifications(user_id, read_at);

create table if not exists forum_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  region text not null,
  division text not null default 'Not specified',
  category text not null,
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'approved', 'rejected')),
  moderated_by uuid references profiles(id) on delete set null,
  moderated_at timestamptz,
  author_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists forum_posts_created_at_idx on forum_posts(created_at desc);
create index if not exists forum_posts_moderation_status_idx on forum_posts(moderation_status);
create index if not exists forum_posts_region_division_idx on forum_posts(region, division);

create table if not exists forum_comments (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references forum_posts(id) on delete cascade,
  content text not null,
  image_mime_type text,
  image_data bytea,
  image_file_name text,
  author_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists forum_comments_topic_created_idx on forum_comments(topic_id, created_at asc);

create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  region text not null default 'Unspecified',
  subject_area text not null default 'General Science',
  grade_level text not null default 'Multi-level',
  resource_type text not null default 'Teaching Resource',
  keywords text[] not null default '{}'::text[],
  file_name text not null,
  mime_type text not null,
  file_size integer not null,
  file_data bytea not null,
  embedding vector,
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'approved', 'rejected')),
  moderated_by uuid references profiles(id) on delete set null,
  moderated_at timestamptz,
  author_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists resources_created_at_idx on resources(created_at desc);
create index if not exists resources_moderation_status_idx on resources(moderation_status);
create index if not exists resources_embedding_cosine_idx
on resources using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

alter table forum_posts add column if not exists moderation_status text not null default 'pending';
alter table forum_posts add column if not exists moderated_by uuid references profiles(id) on delete set null;
alter table forum_posts add column if not exists moderated_at timestamptz;
alter table forum_posts add column if not exists division text not null default 'Not specified';

alter table resources add column if not exists moderation_status text not null default 'pending';
alter table resources add column if not exists moderated_by uuid references profiles(id) on delete set null;
alter table resources add column if not exists moderated_at timestamptz;
alter table resources add column if not exists region text not null default 'Unspecified';
alter table resources add column if not exists subject_area text not null default 'General Science';
alter table resources add column if not exists grade_level text not null default 'Multi-level';
alter table resources add column if not exists resource_type text not null default 'Teaching Resource';
alter table resources add column if not exists keywords text[] not null default '{}'::text[];
alter table resources add column if not exists embedding vector;

alter table forum_comments add column if not exists image_mime_type text;
alter table forum_comments add column if not exists image_data bytea;
alter table forum_comments add column if not exists image_file_name text;

create table if not exists map_region_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_month date not null,
  region text not null,
  teacher_count integer not null default 0,
  teacher_density numeric(10,2) not null default 0,
  average_experience numeric(10,2) not null default 0,
  underserved_score numeric(10,2) not null default 100,
  expected_divisions integer not null default 1,
  division_coverage_rate numeric(10,2) not null default 0,
  generated_from text not null default 'backfill',
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique(snapshot_month, region)
);

create index if not exists map_region_snapshots_month_idx
on map_region_snapshots(snapshot_month asc);

create index if not exists map_region_snapshots_region_month_idx
on map_region_snapshots(region, snapshot_month asc);