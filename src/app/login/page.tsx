'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import loginStyles from './login.module.css';
import { loginAction, type AuthActionState } from '../actions/auth';

const initialState: AuthActionState = {
  error: null,
};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className={loginStyles.container}>
      <div className={`${loginStyles.authCard} card`}>
        <div className={loginStyles.header}>
          <h2>Teacher Access</h2>
          <p>Sign in to post topics, upload resources, and view your profile.</p>
        </div>

        {state.error && <div className={loginStyles.errorMessage}>{state.error}</div>}

        <form className={loginStyles.form} action={formAction}>
          <div className={loginStyles.inputGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="e.g. educator@deped.gov.ph"
              required
            />
          </div>

          <div className={loginStyles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className={`btn btn-primary ${loginStyles.submitBtn}`} disabled={pending}>
            {pending ? 'Signing In...' : 'Proceed to Hub'}
          </button>
        </form>

        <div className={loginStyles.footer}>
          <p>
            Don&apos;t have an account? <Link href="/register">Register as a STAR Teacher</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
