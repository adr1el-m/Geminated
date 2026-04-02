'use server';

import { redirect } from 'next/navigation';
import { loginUser, registerUser, signOutUser } from '@/lib/auth';

export type AuthActionState = {
  error: string | null;
};

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export async function loginAction(_state: AuthActionState, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Email and password are required.' } satisfies AuthActionState;
  }

  try {
    await loginUser({ email, password });
  } catch (error) {
    return { error: toMessage(error) } satisfies AuthActionState;
  }

  redirect('/profile');
}

export async function registerAction(_state: AuthActionState, formData: FormData) {
  const fullName = String(formData.get('fullName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const region = String(formData.get('region') ?? '').trim();
  const school = String(formData.get('school') ?? '').trim();

  if (!fullName || !email || !password || !region || !school) {
    return { error: 'All fields are required.' } satisfies AuthActionState;
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters long.' } satisfies AuthActionState;
  }

  try {
    await registerUser({ fullName, email, password, region, school });
  } catch (error) {
    return { error: toMessage(error) } satisfies AuthActionState;
  }

  redirect('/profile');
}

export async function signOutAction() {
  await signOutUser();
  redirect('/');
}