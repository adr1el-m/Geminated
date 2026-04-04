import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { db } from './db';

export type UserRole = 'teacher' | 'admin';

export type Profile = {
  id: string;
  star_id: string;
  full_name: string;
  email: string;
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
  role: UserRole;
  created_at: string;
};

export type PublicProfile = {
  id: string;
  star_id: string;
  full_name: string;
  occupation: string;
  region: string;
  division: string;
  school: string;
  qualification_level: string;
  subjects_taught: string[];
  years_of_experience: number;
  star_participation_status: string;
  data_quality_score: number;
  profile_last_updated_at: string;
  role: UserRole;
  created_at: string;
};

const SESSION_COOKIE = 'starlink_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function setSessionCookie(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

async function createSession(userId: string) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  await db`
    insert into auth_sessions (token, user_id, expires_at)
    values (${token}, ${userId}, ${expiresAt})
  `;

  await setSessionCookie(token);
}

export async function getCurrentUser(): Promise<Profile | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const rows = (await db`
    select
      p.id,
      p.star_id,
      p.full_name,
      p.email,
      p.occupation,
      p.region,
      p.division,
      p.school,
      p.qualification_level,
      p.gender,
      p.age_bracket,
      p.subjects_taught,
      p.training_history,
      p.star_participation_status,
      p.consent_data_processing,
      p.consent_research,
      p.consent_version,
      p.consented_at,
      p.anonymization_opt_out,
      p.profile_last_updated_at,
      p.years_of_experience,
      p.data_quality_score,
      p.role,
      p.created_at
    from auth_sessions s
    inner join profiles p on p.id = s.user_id
    where s.token = ${token}
      and s.expires_at > now()
    limit 1
  `) as Profile[];

  return rows[0] ?? null;
}

export async function registerUser(input: {
  fullName: string;
  email: string;
  password: string;
  occupation: string;
  region: string;
  division: string;
  school: string;
  qualificationLevel: string;
  gender: string;
  ageBracket: string;
  subjectsTaught: string[];
  trainingHistory: string[];
  yearsOfExperience: number;
  starParticipationStatus: string;
  consentDataProcessing: boolean;
  consentResearch: boolean;
  anonymizationOptOut: boolean;
  consentVersion: string;
  dataQualityScore: number;
}) {
  const email = normalizeEmail(input.email);
  const existing = (await db`
    select id
    from profiles
    where email = ${email}
    limit 1
  `) as { id: string }[];

  if (existing.length > 0) {
    throw new Error('An account with that email already exists.');
  }

  const duplicate = (await db`
    select id
    from profiles
    where lower(full_name) = lower(${input.fullName.trim()})
      and lower(school) = lower(${input.school.trim()})
      and region = ${input.region.trim()}
      and division = ${input.division.trim()}
    limit 1
  `) as { id: string }[];

  if (duplicate.length > 0) {
    throw new Error('Possible duplicate profile detected for the same name, school, region, and division.');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const rows = (await db`
    insert into profiles (
      full_name,
      email,
      password_hash,
      occupation,
      region,
      division,
      school,
      qualification_level,
      gender,
      age_bracket,
      subjects_taught,
      training_history,
      star_participation_status,
      consent_data_processing,
      consent_research,
      consent_version,
      consented_at,
      anonymization_opt_out,
      profile_last_updated_at,
      years_of_experience,
      data_quality_score,
      role
    )
    values (
      ${input.fullName.trim()},
      ${email},
      ${passwordHash},
      ${input.occupation.trim()},
      ${input.region.trim()},
      ${input.division.trim()},
      ${input.school.trim()},
      ${input.qualificationLevel.trim()},
      ${input.gender.trim()},
      ${input.ageBracket.trim()},
      ${input.subjectsTaught},
      ${input.trainingHistory},
      ${input.starParticipationStatus.trim()},
      ${input.consentDataProcessing},
      ${input.consentResearch},
      ${input.consentVersion.trim()},
      ${input.consentDataProcessing ? new Date().toISOString() : null},
      ${input.anonymizationOptOut},
      now(),
      ${input.yearsOfExperience},
      ${input.dataQualityScore},
      ${'teacher'}
    )
    returning
      id,
      star_id,
      full_name,
      email,
      occupation,
      region,
      division,
      school,
      qualification_level,
      gender,
      age_bracket,
      subjects_taught,
      training_history,
      star_participation_status,
      consent_data_processing,
      consent_research,
      consent_version,
      consented_at,
      anonymization_opt_out,
      profile_last_updated_at,
      years_of_experience,
      data_quality_score,
      role,
      created_at
  `) as Profile[];

  const user = rows[0];

  if (!user) {
    throw new Error('Unable to create the account.');
  }

  await createSession(user.id);
  return user;
}

export async function loginUser(input: { email: string; password: string }) {
  const email = normalizeEmail(input.email);
  const rows = (await db`
    select
      id,
      star_id,
      full_name,
      email,
      occupation,
      region,
      division,
      school,
      qualification_level,
      gender,
      age_bracket,
      subjects_taught,
      training_history,
      star_participation_status,
      consent_data_processing,
      consent_research,
      consent_version,
      consented_at,
      anonymization_opt_out,
      profile_last_updated_at,
      years_of_experience,
      data_quality_score,
      role,
      created_at,
      password_hash
    from profiles
    where email = ${email}
    limit 1
  `) as (Profile & { password_hash: string })[];

  const user = rows[0];

  if (!user) {
    throw new Error('No account found for that email.');
  }

  const isValidPassword = await bcrypt.compare(input.password, user.password_hash);

  if (!isValidPassword) {
    throw new Error('Incorrect password.');
  }

  await createSession(user.id);

  const { password_hash, ...profile } = user;
  void password_hash;
  return profile;
}

export async function signOutUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await db`
      delete from auth_sessions
      where token = ${token}
    `;
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function updateCurrentUserProfile(input: {
  fullName: string;
  occupation: string;
  region: string;
  division: string;
  school: string;
  qualificationLevel: string;
  gender: string;
  ageBracket: string;
  subjectsTaught: string[];
  trainingHistory: string[];
  starParticipationStatus: string;
  consentDataProcessing: boolean;
  consentResearch: boolean;
  anonymizationOptOut: boolean;
  consentVersion: string;
  yearsOfExperience: number;
  dataQualityScore: number;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error('You must be signed in to update your profile.');
  }

  const rows = (await db`
    update profiles
    set
      full_name = ${input.fullName.trim()},
      occupation = ${input.occupation.trim()},
      region = ${input.region.trim()},
      division = ${input.division.trim()},
      school = ${input.school.trim()},
      qualification_level = ${input.qualificationLevel.trim()},
      gender = ${input.gender.trim()},
      age_bracket = ${input.ageBracket.trim()},
      subjects_taught = ${input.subjectsTaught},
      training_history = ${input.trainingHistory},
      star_participation_status = ${input.starParticipationStatus.trim()},
      consent_data_processing = ${input.consentDataProcessing},
      consent_research = ${input.consentResearch},
      consent_version = ${input.consentVersion.trim()},
      consented_at = ${input.consentDataProcessing ? new Date().toISOString() : null},
      anonymization_opt_out = ${input.anonymizationOptOut},
      profile_last_updated_at = now(),
      years_of_experience = ${input.yearsOfExperience},
      data_quality_score = ${input.dataQualityScore}
    where id = ${currentUser.id}
    returning
      id,
      star_id,
      full_name,
      email,
      occupation,
      region,
      division,
      school,
      qualification_level,
      gender,
      age_bracket,
      subjects_taught,
      training_history,
      star_participation_status,
      consent_data_processing,
      consent_research,
      consent_version,
      consented_at,
      anonymization_opt_out,
      profile_last_updated_at,
      years_of_experience,
      data_quality_score,
      role,
      created_at
  `) as Profile[];

  const updated = rows[0];

  if (!updated) {
    throw new Error('Unable to update your profile at this time.');
  }

  return updated;
}

export async function getPublicProfileById(id: string): Promise<PublicProfile | null> {
  const rows = (await db`
    select
      id,
      star_id,
      full_name,
      occupation,
      region,
      division,
      school,
      qualification_level,
      subjects_taught,
      years_of_experience,
      star_participation_status,
      data_quality_score,
      profile_last_updated_at,
      role,
      created_at
    from profiles
    where id = ${id}
    limit 1
  `) as PublicProfile[];

  return rows[0] ?? null;
}