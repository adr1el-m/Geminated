-- STAR-LINK Neon schema

create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  region text not null,
  school text not null,
  subjects_taught text[] not null default '{}'::text[],
  years_of_experience integer not null default 0,
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

create table if not exists forum_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  region text not null,
  category text not null,
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'approved', 'rejected')),
  moderated_by uuid references profiles(id) on delete set null,
  moderated_at timestamptz,
  author_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists forum_posts_created_at_idx on forum_posts(created_at desc);
create index if not exists forum_posts_moderation_status_idx on forum_posts(moderation_status);

create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  file_name text not null,
  mime_type text not null,
  file_size integer not null,
  file_data bytea not null,
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'approved', 'rejected')),
  moderated_by uuid references profiles(id) on delete set null,
  moderated_at timestamptz,
  author_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists resources_created_at_idx on resources(created_at desc);
create index if not exists resources_moderation_status_idx on resources(moderation_status);

alter table forum_posts add column if not exists moderation_status text not null default 'pending';
alter table forum_posts add column if not exists moderated_by uuid references profiles(id) on delete set null;
alter table forum_posts add column if not exists moderated_at timestamptz;

alter table resources add column if not exists moderation_status text not null default 'pending';
alter table resources add column if not exists moderated_by uuid references profiles(id) on delete set null;
alter table resources add column if not exists moderated_at timestamptz;