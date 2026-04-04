'use client';

import { useActionState, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { updateProfileAction, type AuthActionState } from '@/app/actions/auth';
import {
  PHILIPPINE_REGIONS_SHORT,
  REGISTRATION_AGE_BRACKETS,
  REGISTRATION_GENDER_OPTIONS,
  REGISTRATION_QUALIFICATION_LEVELS,
  REGION_DISPLAY_NAMES,
  REGION_DIVISIONS_BY_REGION,
  REGISTRATION_OCCUPATIONS,
  REGISTRATION_REGIONS,
  STAR_PARTICIPATION_STATUSES,
} from '@/lib/constants';
import profileStyles from '@/app/profile/profile.module.css';

type ProfileEditFormProps = {
  initial: {
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
    yearsOfExperience: number;
  };
};

const initialState: AuthActionState = {
  error: null,
};

const PROFILE_REGIONS = Array.from(new Set([...REGISTRATION_REGIONS, ...PHILIPPINE_REGIONS_SHORT]));

export default function ProfileEditForm({ initial }: ProfileEditFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
  const [selectedRegion, setSelectedRegion] = useState(initial.region);
  const [selectedDivision, setSelectedDivision] = useState(initial.division);
  const searchParams = useSearchParams();
  const isUpdated = searchParams.get('updated') === '1';
  const divisionOptions = useMemo(() => {
    const fromRegion = REGION_DIVISIONS_BY_REGION[selectedRegion] ?? [];
    if (fromRegion.includes(initial.division)) {
      return fromRegion;
    }

    return initial.division ? [initial.division, ...fromRegion] : fromRegion;
  }, [initial.division, selectedRegion]);

  return (
    <form className={profileStyles.profileForm} action={formAction}>
      {isUpdated ? <p className={profileStyles.successMessage}>Profile updated successfully.</p> : null}
      {state.error ? <p className={profileStyles.formError}>{state.error}</p> : null}

      <div className={profileStyles.formGrid}>
        <label className={profileStyles.formLabel}>
          Full Name
          <input name="fullName" type="text" required defaultValue={initial.fullName} />
        </label>

        <label className={profileStyles.formLabel}>
          Occupation
          <select name="occupation" required defaultValue={initial.occupation}>
            {REGISTRATION_OCCUPATIONS.map((occupation) => (
              <option key={occupation} value={occupation}>
                {occupation}
              </option>
            ))}
          </select>
        </label>

        <label className={profileStyles.formLabel}>
          Region
          <select
            name="region"
            required
            value={selectedRegion}
            onChange={(event) => {
              const nextRegion = event.target.value;
              const nextDivisions = REGION_DIVISIONS_BY_REGION[nextRegion] ?? [];
              setSelectedRegion(nextRegion);
              setSelectedDivision(nextDivisions[0] ?? '');
            }}
          >
            {PROFILE_REGIONS.map((region) => (
              <option key={region} value={region}>
                {REGION_DISPLAY_NAMES[region] ?? region}
              </option>
            ))}
          </select>
        </label>

        <label className={profileStyles.formLabel}>
          Division
          <select
            name="division"
            required
            value={selectedDivision}
            onChange={(event) => setSelectedDivision(event.target.value)}
          >
            <option value="" disabled>
              Select Division
            </option>
            {divisionOptions.map((division) => (
              <option key={division} value={division}>
                {division}
              </option>
            ))}
          </select>
        </label>

        <label className={profileStyles.formLabel}>
          School / Institution
          <input name="school" type="text" required defaultValue={initial.school} />
        </label>

        <label className={profileStyles.formLabel}>
          Highest Qualification
          <select name="qualificationLevel" required defaultValue={initial.qualificationLevel}>
            {REGISTRATION_QUALIFICATION_LEVELS.map((qualification) => (
              <option key={qualification} value={qualification}>
                {qualification}
              </option>
            ))}
          </select>
        </label>

        <label className={profileStyles.formLabel}>
          Gender
          <select name="gender" required defaultValue={initial.gender}>
            {REGISTRATION_GENDER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className={profileStyles.formLabel}>
          Age Bracket
          <select name="ageBracket" required defaultValue={initial.ageBracket}>
            {REGISTRATION_AGE_BRACKETS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className={profileStyles.formLabel}>
          Years of Experience
          <input
            name="yearsOfExperience"
            type="number"
            min={0}
            max={60}
            required
            defaultValue={initial.yearsOfExperience}
          />
        </label>
      </div>

      <label className={profileStyles.formLabel}>
        Subjects Taught
        <textarea
          name="subjectsTaught"
          rows={3}
          placeholder="Separate multiple subjects with commas"
          defaultValue={initial.subjectsTaught.join(', ')}
        />
      </label>

      <label className={profileStyles.formLabel}>
        STAR Participation Status
        <select name="starParticipationStatus" required defaultValue={initial.starParticipationStatus}>
          {STAR_PARTICIPATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <label className={profileStyles.formLabel}>
        Training History
        <textarea
          name="trainingHistory"
          rows={3}
          placeholder="One training per line"
          defaultValue={initial.trainingHistory.join('\n')}
        />
      </label>

      <div className={profileStyles.checkboxGroup}>
        <label className={profileStyles.checkboxLabel}>
          <input type="checkbox" name="dataProcessingConsent" defaultChecked={initial.consentDataProcessing} required />
          <span>I consent to STAR-LINK processing my data for platform operations and regional planning.</span>
        </label>

        <label className={profileStyles.checkboxLabel}>
          <input type="checkbox" name="researchConsent" defaultChecked={initial.consentResearch} />
          <span>I consent to inclusion in anonymized research analytics.</span>
        </label>

        <label className={profileStyles.checkboxLabel}>
          <input type="checkbox" name="anonymizeOptOut" defaultChecked={initial.anonymizationOptOut} />
          <span>Exclude my profile from anonymized research datasets.</span>
        </label>
      </div>

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? 'Saving...' : 'Save Profile Changes'}
      </button>
    </form>
  );
}
