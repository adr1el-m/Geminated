import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (process.env.NODE_ENV === 'production' && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Supabase env vars are required in production.');
}

export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'public-anon-key',
)

// In a real application, you would generate TypeScript types using the Supabase CLI
export type Profile = {
  id: string; // UUID from auth.users
  full_name: string;
  region: string;
  school: string;
  subjects_taught: string[];
  years_of_experience: number;
  role: 'teacher' | 'admin';
  created_at: string;
};

export type Resource = {
  id: string;
  title: string;
  description: string;
  type: 'action_research' | 'extension_project';
  abstract: string;
  file_url: string;
  tags: string[]; // Subject, Region, Grade
  author_id: string;
  created_at: string;
};

export type ForumPost = {
  id: string;
  title: string;
  content: string;
  region: string;
  author_id: string;
  category: string;
  created_at: string;
};
