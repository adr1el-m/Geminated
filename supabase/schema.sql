-- Supabase SQL Schema for STAR-LINK MVP

-- Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  region TEXT NOT NULL,
  school TEXT NOT NULL,
  subjects_taught TEXT[] DEFAULT '{}'::TEXT[],
  years_of_experience INTEGER DEFAULT 0,
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

-- Regional Statistics View (Materialized view for dashboard performance)
CREATE VIEW public.regional_teacher_stats AS
SELECT 
  region,
  COUNT(id) as teacher_count,
  AVG(years_of_experience) as average_experience
FROM public.profiles
WHERE role = 'teacher'
GROUP BY region;
