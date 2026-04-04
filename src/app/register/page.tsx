'use client';

import { useActionState, useMemo, useState } from 'react';
import Link from 'next/link';
import regStyles from './register.module.css';
import { registerAction, type AuthActionState } from '../actions/auth';
import {
  REGISTRATION_AGE_BRACKETS,
  REGISTRATION_GENDER_OPTIONS,
  REGISTRATION_QUALIFICATION_LEVELS,
  REGION_DISPLAY_NAMES,
  REGION_DIVISIONS_BY_REGION,
  REGISTRATION_OCCUPATIONS,
  REGISTRATION_REGIONS,
  STAR_PARTICIPATION_STATUSES,
} from '@/lib/constants';

const initialState: AuthActionState = {
  error: null,
};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const [selectedRegion, setSelectedRegion] = useState('');

  const availableDivisions = useMemo(() => {
    return REGION_DIVISIONS_BY_REGION[selectedRegion] ?? [];
  }, [selectedRegion]);

  const hasRegion = selectedRegion.length > 0;
  const divisionFallbackValue = 'Not Listed / Others';

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

          <div className={regStyles.inputGroup}>
            <label htmlFor="occupation">Occupation</label>
            <select id="occupation" name="occupation" required defaultValue="">
              <option value="" disabled>
                Select Occupation
              </option>
              {REGISTRATION_OCCUPATIONS.map((occupation) => (
                <option key={occupation} value={occupation}>
                  {occupation}
                </option>
              ))}
            </select>
          </div>

          <div className={regStyles.row}>
            <div className={regStyles.inputGroup}>
              <label htmlFor="region">Region</label>
              <select
                id="region"
                name="region"
                required
                defaultValue=""
                onChange={(event) => setSelectedRegion(event.target.value)}
              >
                <option value="" disabled>
                  Select Region
                </option>
                {REGISTRATION_REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {REGION_DISPLAY_NAMES[region] ?? region}
                  </option>
                ))}
              </select>
            </div>

            <div className={regStyles.inputGroup}>
              <label htmlFor="division">Division</label>
              <select
                id="division"
                name="division"
                required
                defaultValue=""
                disabled={!hasRegion}
                key={selectedRegion || 'division-empty'}
              >
                <option value="" disabled>
                  {hasRegion ? 'Select Division' : 'Select Region First'}
                </option>
                {availableDivisions.length > 0
                  ? availableDivisions.map((division) => (
                      <option key={division} value={division}>
                        {division}
                      </option>
                    ))
                  : hasRegion
                    ? (
                      <option value={divisionFallbackValue}>{divisionFallbackValue}</option>
                    )
                    : null}
              </select>
            </div>
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

          <div className={regStyles.row}>
            <div className={regStyles.inputGroup}>
              <label htmlFor="qualificationLevel">Highest Qualification</label>
              <select id="qualificationLevel" name="qualificationLevel" required defaultValue="">
                <option value="" disabled>
                  Select Qualification
                </option>
                {REGISTRATION_QUALIFICATION_LEVELS.map((qualification) => (
                  <option key={qualification} value={qualification}>
                    {qualification}
                  </option>
                ))}
              </select>
            </div>

            <div className={regStyles.inputGroup}>
              <label htmlFor="yearsOfExperience">Years of Experience</label>
              <input
                type="number"
                id="yearsOfExperience"
                name="yearsOfExperience"
                min={0}
                max={60}
                required
                placeholder="e.g. 8"
              />
            </div>
          </div>

          <div className={regStyles.row}>
            <div className={regStyles.inputGroup}>
              <label htmlFor="gender">Gender</label>
              <select id="gender" name="gender" required defaultValue="">
                <option value="" disabled>
                  Select Gender
                </option>
                {REGISTRATION_GENDER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className={regStyles.inputGroup}>
              <label htmlFor="ageBracket">Age Bracket</label>
              <select id="ageBracket" name="ageBracket" required defaultValue="">
                <option value="" disabled>
                  Select Age Bracket
                </option>
                {REGISTRATION_AGE_BRACKETS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={regStyles.inputGroup}>
            <label htmlFor="subjectsTaught">Subject Specializations</label>
            <input
              type="text"
              id="subjectsTaught"
              name="subjectsTaught"
              placeholder="e.g. Biology, Chemistry"
              required
            />
          </div>

          <div className={regStyles.inputGroup}>
            <label htmlFor="starParticipationStatus">STAR Participation Status</label>
            <select id="starParticipationStatus" name="starParticipationStatus" required defaultValue="">
              <option value="" disabled>
                Select Status
              </option>
              {STAR_PARTICIPATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className={regStyles.inputGroup}>
            <label htmlFor="trainingHistory">Training History (Optional)</label>
            <textarea
              id="trainingHistory"
              name="trainingHistory"
              rows={3}
              placeholder="One training per line, e.g.\n2025 Regional STEM Bootcamp\n2024 Action Research Workshop"
            />
          </div>

          <div className={regStyles.consentGroup}>
            <label className={regStyles.checkboxLabel}>
              <input type="checkbox" name="dataProcessingConsent" required />
              <span>I consent to STAR-LINK processing my personal data for program operations and regional planning.</span>
            </label>

            <label className={regStyles.checkboxLabel}>
              <input type="checkbox" name="researchConsent" />
              <span>I consent to my data being included in anonymized research reports.</span>
            </label>

            <label className={regStyles.checkboxLabel}>
              <input type="checkbox" name="anonymizeOptOut" />
              <span>Exclude my record from anonymized research datasets.</span>
            </label>
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
