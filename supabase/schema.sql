-- Supabase SQL Schema for STAR-LINK MVP

-- Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  star_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  occupation TEXT NOT NULL DEFAULT 'Other Education Personnel',
  region TEXT NOT NULL,
  division TEXT NOT NULL DEFAULT 'Not specified',
  school TEXT NOT NULL,
  qualification_level TEXT NOT NULL DEFAULT 'Not Specified',
  gender TEXT NOT NULL DEFAULT 'Prefer not to say',
  age_bracket TEXT NOT NULL DEFAULT 'Prefer not to say',
  subjects_taught TEXT[] DEFAULT '{}'::TEXT[],
  training_history TEXT[] DEFAULT '{}'::TEXT[],
  star_participation_status TEXT NOT NULL DEFAULT 'Not Yet Participated',
  consent_data_processing BOOLEAN NOT NULL DEFAULT FALSE,
  consent_research BOOLEAN NOT NULL DEFAULT FALSE,
  consent_version TEXT NOT NULL DEFAULT 'v1.0',
  consented_at TIMESTAMP WITH TIME ZONE,
  anonymization_opt_out BOOLEAN NOT NULL DEFAULT FALSE,
  profile_last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  years_of_experience INTEGER DEFAULT 0,
  data_quality_score INTEGER DEFAULT 0 CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  role TEXT DEFAULT 'teacher' CHECK (role IN ('teacher', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Create resources table (Research repo & Extensions)
CREATE TABLE public.resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  region TEXT NOT NULL DEFAULT 'Unspecified',
  subject_area TEXT NOT NULL DEFAULT 'General Science',
  grade_level TEXT NOT NULL DEFAULT 'Multi-level',
  resource_type TEXT NOT NULL DEFAULT 'Teaching Resource',
  keywords TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  type TEXT NOT NULL CHECK (type IN ('action_research', 'extension_project')),
  abstract TEXT,
  file_url TEXT,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderated_at TIMESTAMP WITH TIME ZONE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resources viewable by everyone" ON resources FOR SELECT USING (true);
CREATE POLICY "Users can insert own resource" ON resources FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own resource" ON resources FOR UPDATE USING (auth.uid() = author_id);

-- Create forum posts table
CREATE TABLE public.forum_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  region TEXT NOT NULL,
  category TEXT NOT NULL,
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderated_at TIMESTAMP WITH TIME ZONE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Forum viewable by everyone" ON forum_posts FOR SELECT USING (true);
CREATE POLICY "Users can insert own post" ON forum_posts FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Create forum comments table
CREATE TABLE public.forum_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_mime_type TEXT,
  image_data BYTEA,
  image_file_name TEXT,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments viewable by everyone" ON forum_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert own comment" ON forum_comments FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Create audit logs table
CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  changed_fields JSONB NOT NULL DEFAULT '{}'::JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audit logs viewable by admins" ON audit_logs FOR SELECT USING (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Regional Statistics View (Materialized view for dashboard performance)
CREATE VIEW public.regional_teacher_stats AS
SELECT 
  region,
  COUNT(id) as teacher_count,
  AVG(years_of_experience) as average_experience
FROM public.profiles
WHERE role = 'teacher'
GROUP BY region;
