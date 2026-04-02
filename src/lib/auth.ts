import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { db } from './db';

export type UserRole = 'teacher' | 'admin';

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  region: string;
  school: string;
  subjects_taught: string[];
  years_of_experience: number;
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
      p.full_name,
      p.email,
      p.region,
      p.school,
      p.subjects_taught,
      p.years_of_experience,
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
  region: string;
  school: string;
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

  const passwordHash = await bcrypt.hash(input.password, 10);

  const rows = (await db`
    insert into profiles (
      full_name,
      email,
      password_hash,
      region,
      school,
      subjects_taught,
      years_of_experience,
      role
    )
    values (
      ${input.fullName.trim()},
      ${email},
      ${passwordHash},
      ${input.region.trim()},
      ${input.school.trim()},
      ${[]},
      ${0},
      ${'teacher'}
    )
    returning
      id,
      full_name,
      email,
      region,
      school,
      subjects_taught,
      years_of_experience,
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
      full_name,
      email,
      region,
      school,
      subjects_taught,
      years_of_experience,
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