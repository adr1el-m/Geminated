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
  star_id: string;
  full_name: string;
  occupation: string;
  region: string;
  division: string;
  school: string;
  qualification_level: string;
  gender: string;
  age_bracket: string;
  subjects_taught: string[];
  training_history: string[];
  star_participation_status: string;
  consent_data_processing: boolean;
  consent_research: boolean;
  consent_version: string;
  consented_at: string | null;
  anonymization_opt_out: boolean;
  profile_last_updated_at: string;
  years_of_experience: number;
  data_quality_score: number;
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
