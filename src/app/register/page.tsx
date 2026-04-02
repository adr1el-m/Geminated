'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import regStyles from './register.module.css';
import { registerAction, type AuthActionState } from '../actions/auth';

const initialState: AuthActionState = {
  error: null,
};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <div className={regStyles.container}>
      <div className={`${regStyles.authCard} card`}>
        <div className={regStyles.header}>
          <h2>Teacher Registration</h2>
          <p>Join the STAR-LINK community to share research and connect with peers.</p>
        </div>

        {state.error && <div className={regStyles.errorMessage}>{state.error}</div>}

        <form className={regStyles.form} action={formAction}>
          <div className={regStyles.inputGroup}>
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              placeholder="e.g. Maria Clara"
              required
            />
          </div>

          <div className={regStyles.inputGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="e.g. educator@deped.gov.ph"
              required
            />
          </div>

          <div className={regStyles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="At least 8 characters"
              required
            />
          </div>

          <div className={regStyles.row}>
            <div className={regStyles.inputGroup}>
              <label htmlFor="region">Region</label>
              <select id="region" name="region" required defaultValue="">
                <option value="" disabled>
                  Select Region
                </option>
                <option value="NCR">NCR</option>
                <option value="Region I">Region I</option>
                <option value="Region III">Region III</option>
                <option value="Region VIII">Region VIII</option>
                <option value="CAR">CAR</option>
                <option value="BARMM">BARMM</option>
              </select>
            </div>
            <div className={regStyles.inputGroup}>
              <label htmlFor="school">School</label>
              <input
                type="text"
                id="school"
                name="school"
                placeholder="Name of Institution"
                required
              />
            </div>
          </div>

          <button type="submit" className={`btn btn-primary ${regStyles.submitBtn}`} disabled={pending}>
            {pending ? 'Creating Account...' : 'Register as Teacher'}
          </button>
        </form>

        <div className={regStyles.footer}>
          <p>
            Already have an account? <Link href="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
