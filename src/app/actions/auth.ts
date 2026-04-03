'use server';

import { redirect } from 'next/navigation';
import { loginUser, registerUser, signOutUser, updateCurrentUserProfile } from '@/lib/auth';
import { PHILIPPINE_REGIONS_SHORT } from '@/lib/constants';
import { getRequestFingerprint } from '@/lib/request-meta';
import { checkRateLimit } from '@/lib/rate-limit';

export type AuthActionState = {
  error: string | null;
};

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

function isLikelyEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function loginAction(_state: AuthActionState, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  const fingerprint = await getRequestFingerprint('auth-login');
  const attempt = checkRateLimit({
    key: fingerprint,
    windowMs: 10 * 60 * 1000,
    maxRequests: 12,
  });

  if (!attempt.allowed) {
    return {
      error: `Too many login attempts. Try again in ${attempt.retryAfterSeconds}s.`,
    } satisfies AuthActionState;
  }

  if (!email || !password) {
    return { error: 'Email and password are required.' } satisfies AuthActionState;
  }

  if (!isLikelyEmail(email)) {
    return { error: 'Please provide a valid email address.' } satisfies AuthActionState;
  }

  try {
    await loginUser({ email, password });
  } catch {
    return {
      error: 'Invalid email or password.',
    } satisfies AuthActionState;
  }

  redirect('/hub');
}

export async function registerAction(_state: AuthActionState, formData: FormData) {
  const fullName = String(formData.get('fullName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const region = String(formData.get('region') ?? '').trim();
  const school = String(formData.get('school') ?? '').trim();

  const fingerprint = await getRequestFingerprint('auth-register');
  const attempt = checkRateLimit({
    key: fingerprint,
    windowMs: 30 * 60 * 1000,
    maxRequests: 8,
  });

  if (!attempt.allowed) {
    return {
      error: `Too many registration attempts. Try again in ${attempt.retryAfterSeconds}s.`,
    } satisfies AuthActionState;
  }

  if (!fullName || !email || !password || !region || !school) {
    return { error: 'All fields are required.' } satisfies AuthActionState;
  }

  if (!isLikelyEmail(email)) {
    return { error: 'Please provide a valid email address.' } satisfies AuthActionState;
  }

  if (!PHILIPPINE_REGIONS_SHORT.includes(region)) {
    return { error: 'Please select a valid Philippine region.' } satisfies AuthActionState;
  }

  if (fullName.length > 120 || school.length > 160) {
    return { error: 'One or more fields are too long.' } satisfies AuthActionState;
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters long.' } satisfies AuthActionState;
  }

  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return {
      error: 'Password must include at least one letter and one number.',
    } satisfies AuthActionState;
  }

  try {
    await registerUser({ fullName, email, password, region, school });
  } catch (error) {
    return { error: toMessage(error) } satisfies AuthActionState;
  }

  redirect('/hub');
}

export async function signOutAction() {
  await signOutUser();
  redirect('/');
}

export async function updateProfileAction(_state: AuthActionState, formData: FormData) {
  const fullName = String(formData.get('fullName') ?? '').trim();
  const region = String(formData.get('region') ?? '').trim();
  const school = String(formData.get('school') ?? '').trim();
  const yearsRaw = String(formData.get('yearsOfExperience') ?? '0').trim();
  const subjectsRaw = String(formData.get('subjectsTaught') ?? '').trim();

  if (!fullName || !region || !school) {
    return { error: 'Full name, region, and school are required.' } satisfies AuthActionState;
  }

  if (fullName.length > 120 || school.length > 160) {
    return { error: 'One or more fields are too long.' } satisfies AuthActionState;
  }

  if (!PHILIPPINE_REGIONS_SHORT.includes(region)) {
    return { error: 'Please select a valid Philippine region.' } satisfies AuthActionState;
  }

  const yearsOfExperience = Number.parseInt(yearsRaw, 10);

  if (Number.isNaN(yearsOfExperience) || yearsOfExperience < 0 || yearsOfExperience > 60) {
    return { error: 'Years of experience must be between 0 and 60.' } satisfies AuthActionState;
  }

  const subjectsTaught = subjectsRaw
    .split(',')
    .map((subject) => subject.trim())
    .filter(Boolean)
    .slice(0, 12);

  try {
    await updateCurrentUserProfile({
      fullName,
      region,
      school,
      subjectsTaught,
      yearsOfExperience,
    });
  } catch (error) {
    return { error: toMessage(error) } satisfies AuthActionState;
  }

  redirect('/profile?updated=1');
}