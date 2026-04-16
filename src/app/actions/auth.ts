'use server';

import { redirect } from 'next/navigation';
import {
  acceptCurrentUserTerms,
  hasAcceptedLatestTerms,
  loginUser,
  registerUser,
  signOutUser,
  TERMS_VERSION,
  updateCurrentUserProfile,
} from '@/lib/auth';
import {
  PHILIPPINE_REGIONS_SHORT,
  REGISTRATION_AGE_BRACKETS,
  REGISTRATION_GENDER_OPTIONS,
  REGISTRATION_QUALIFICATION_LEVELS,
  REGION_DIVISIONS_BY_REGION,
  REGISTRATION_OCCUPATIONS,
  REGISTRATION_REGIONS,
  STAR_PARTICIPATION_STATUSES,
} from '@/lib/constants';
import { getRequestFingerprint } from '@/lib/request-meta';
import { checkRateLimit } from '@/lib/rate-limit';
import { computeProfileDataQualityScore, normalizeCsvList, normalizeLineList } from '@/lib/profile-quality';
import { logAuditEvent } from '@/lib/audit';
import { createNotificationsForAdmins } from '@/lib/notifications';

const CONSENT_VERSION = 'v1.0';

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

  let toProfile = false;
  try {
    const user = await loginUser({ email, password });

    if (hasAcceptedLatestTerms(user)) {
      toProfile = true;
    }
  } catch {
    return {
      error: 'Invalid email or password.',
    } satisfies AuthActionState;
  }

  if (toProfile) {
    redirect('/dashboard');
  } else {
    redirect('/hub');
  }
}

export async function registerAction(_state: AuthActionState, formData: FormData) {
  const fullName = String(formData.get('fullName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const occupation = String(formData.get('occupation') ?? '').trim();
  const region = String(formData.get('region') ?? '').trim();
  const division = String(formData.get('division') ?? '').trim();
  const school = String(formData.get('school') ?? '').trim();
  const qualificationLevel = String(formData.get('qualificationLevel') ?? '').trim();
  const gender = String(formData.get('gender') ?? '').trim();
  const ageBracket = String(formData.get('ageBracket') ?? '').trim();
  const yearsRaw = String(formData.get('yearsOfExperience') ?? '').trim();
  const subjectsRaw = String(formData.get('subjectsTaught') ?? '').trim();
  const trainingHistoryRaw = String(formData.get('trainingHistory') ?? '').trim();
  const starParticipationStatus = String(formData.get('starParticipationStatus') ?? '').trim();
  const consentDataProcessing = String(formData.get('dataProcessingConsent') ?? '') === 'on';
  const consentResearch = String(formData.get('researchConsent') ?? '') === 'on';
  const anonymizationOptOut = String(formData.get('anonymizeOptOut') ?? '') === 'on';

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

  if (!fullName || !email || !password || !occupation || !region || !division || !school || !qualificationLevel || !gender || !ageBracket || !yearsRaw || !subjectsRaw || !starParticipationStatus) {
    return { error: 'All fields are required.' } satisfies AuthActionState;
  }

  if (!consentDataProcessing) {
    return { error: 'Data processing consent is required to create an account.' } satisfies AuthActionState;
  }

  if (!isLikelyEmail(email)) {
    return { error: 'Please provide a valid email address.' } satisfies AuthActionState;
  }

  if (!REGISTRATION_REGIONS.includes(region as (typeof REGISTRATION_REGIONS)[number])) {
    return { error: 'Please select a valid Philippine region.' } satisfies AuthActionState;
  }

  if (!REGISTRATION_OCCUPATIONS.includes(occupation as (typeof REGISTRATION_OCCUPATIONS)[number])) {
    return { error: 'Please select a valid occupation.' } satisfies AuthActionState;
  }

  if (!REGISTRATION_QUALIFICATION_LEVELS.includes(qualificationLevel as (typeof REGISTRATION_QUALIFICATION_LEVELS)[number])) {
    return { error: 'Please select a valid qualification level.' } satisfies AuthActionState;
  }

  if (!REGISTRATION_GENDER_OPTIONS.includes(gender as (typeof REGISTRATION_GENDER_OPTIONS)[number])) {
    return { error: 'Please select a valid gender option.' } satisfies AuthActionState;
  }

  if (!REGISTRATION_AGE_BRACKETS.includes(ageBracket as (typeof REGISTRATION_AGE_BRACKETS)[number])) {
    return { error: 'Please select a valid age bracket.' } satisfies AuthActionState;
  }

  if (!STAR_PARTICIPATION_STATUSES.includes(starParticipationStatus as (typeof STAR_PARTICIPATION_STATUSES)[number])) {
    return { error: 'Please select a valid STAR participation status.' } satisfies AuthActionState;
  }

  const divisionsForRegion = REGION_DIVISIONS_BY_REGION[region] ?? [];
  if (!divisionsForRegion.includes(division)) {
    return { error: 'Please select a valid division for the selected region.' } satisfies AuthActionState;
  }

  const yearsOfExperience = Number.parseInt(yearsRaw, 10);
  if (Number.isNaN(yearsOfExperience) || yearsOfExperience < 0 || yearsOfExperience > 60) {
    return { error: 'Years of experience must be between 0 and 60.' } satisfies AuthActionState;
  }

  const subjectsTaught = normalizeCsvList(subjectsRaw, 12);
  if (subjectsTaught.length === 0) {
    return { error: 'Please provide at least one subject specialization.' } satisfies AuthActionState;
  }

  const trainingHistory = normalizeLineList(trainingHistoryRaw, 12);

  if (fullName.length > 120 || school.length > 160) {
    return { error: 'One or more fields are too long.' } satisfies AuthActionState;
  }

  if (!/^[\p{L} .,'-]{5,120}$/u.test(fullName)) {
    return { error: 'Full name contains invalid characters or is too short.' } satisfies AuthActionState;
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
    const dataQualityScore = computeProfileDataQualityScore({
      fullName,
      school,
      region,
      division,
      occupation,
      qualificationLevel,
      ageBracket,
      gender,
      yearsOfExperience,
      subjectsTaught,
      starParticipationStatus,
      trainingHistory,
    });

    const createdUser = await registerUser({
      fullName,
      email,
      password,
      occupation,
      region,
      division,
      school,
      qualificationLevel,
      gender,
      ageBracket,
      subjectsTaught,
      trainingHistory,
      yearsOfExperience,
      starParticipationStatus,
      consentDataProcessing,
      consentResearch,
      anonymizationOptOut,
      consentVersion: CONSENT_VERSION,
      dataQualityScore,
    });

    await logAuditEvent({
      actorId: createdUser.id,
      action: 'profile.registered',
      entityType: 'profile',
      entityId: createdUser.id,
      changedFields: {
        region,
        division,
        occupation,
        qualificationLevel,
        yearsOfExperience,
        starParticipationStatus,
        consentDataProcessing,
        consentResearch,
        anonymizationOptOut,
      },
      metadata: {
        source: 'registerAction',
      },
    });

    await createNotificationsForAdmins({
      type: 'registry',
      title: 'New teacher registration',
      message: `${createdUser.full_name} registered from ${region} - ${division}.`,
      linkUrl: '/admin',
      metadata: {
        profileId: createdUser.id,
        region,
        division,
      },
    });
  } catch (error) {
    return { error: toMessage(error) } satisfies AuthActionState;
  }

  redirect('/hub');
}

export async function signOutAction() {
  await signOutUser();
  redirect('/');
}

export async function acceptTermsAction(formData: FormData) {
  const returnToRaw = String(formData.get('returnTo') ?? '').trim();
  const returnTo = returnToRaw.startsWith('/') ? returnToRaw : '/profile';

  await acceptCurrentUserTerms(TERMS_VERSION);
  redirect(returnTo);
}

export async function declineTermsAction() {
  await signOutUser();
  redirect('/login');
}

export async function updateProfileAction(_state: AuthActionState, formData: FormData) {
  const fullName = String(formData.get('fullName') ?? '').trim();
  const occupation = String(formData.get('occupation') ?? '').trim();
  const region = String(formData.get('region') ?? '').trim();
  const division = String(formData.get('division') ?? '').trim();
  const school = String(formData.get('school') ?? '').trim();
  const qualificationLevel = String(formData.get('qualificationLevel') ?? '').trim();
  const gender = String(formData.get('gender') ?? '').trim();
  const ageBracket = String(formData.get('ageBracket') ?? '').trim();
  const yearsRaw = String(formData.get('yearsOfExperience') ?? '0').trim();
  const subjectsRaw = String(formData.get('subjectsTaught') ?? '').trim();
  const trainingHistoryRaw = String(formData.get('trainingHistory') ?? '').trim();
  const starParticipationStatus = String(formData.get('starParticipationStatus') ?? '').trim();
  const consentDataProcessing = String(formData.get('dataProcessingConsent') ?? '') === 'on';
  const consentResearch = String(formData.get('researchConsent') ?? '') === 'on';
  const anonymizationOptOut = String(formData.get('anonymizeOptOut') ?? '') === 'on';

  if (!fullName || !occupation || !region || !division || !school || !qualificationLevel || !gender || !ageBracket || !starParticipationStatus) {
    return {
      error: 'Full name, occupation, region, division, school, qualification, gender, age bracket, and STAR participation are required.',
    } satisfies AuthActionState;
  }

  if (!consentDataProcessing) {
    return { error: 'Data processing consent is required.' } satisfies AuthActionState;
  }

  if (fullName.length > 120 || school.length > 160) {
    return { error: 'One or more fields are too long.' } satisfies AuthActionState;
  }

  if (!/^[\p{L} .,'-]{5,120}$/u.test(fullName)) {
    return { error: 'Full name contains invalid characters or is too short.' } satisfies AuthActionState;
  }

  if (!PHILIPPINE_REGIONS_SHORT.includes(region)) {
    return { error: 'Please select a valid Philippine region.' } satisfies AuthActionState;
  }

  const divisionsForRegion = REGION_DIVISIONS_BY_REGION[region] ?? [];
  if (divisionsForRegion.length > 0 && !divisionsForRegion.includes(division)) {
    return { error: 'Please select a valid division for the selected region.' } satisfies AuthActionState;
  }

  if (!REGISTRATION_OCCUPATIONS.includes(occupation as (typeof REGISTRATION_OCCUPATIONS)[number])) {
    return { error: 'Please select a valid occupation.' } satisfies AuthActionState;
  }

  if (!REGISTRATION_QUALIFICATION_LEVELS.includes(qualificationLevel as (typeof REGISTRATION_QUALIFICATION_LEVELS)[number])) {
    return { error: 'Please select a valid qualification level.' } satisfies AuthActionState;
  }

  if (!REGISTRATION_GENDER_OPTIONS.includes(gender as (typeof REGISTRATION_GENDER_OPTIONS)[number])) {
    return { error: 'Please select a valid gender option.' } satisfies AuthActionState;
  }

  if (!REGISTRATION_AGE_BRACKETS.includes(ageBracket as (typeof REGISTRATION_AGE_BRACKETS)[number])) {
    return { error: 'Please select a valid age bracket.' } satisfies AuthActionState;
  }

  if (!STAR_PARTICIPATION_STATUSES.includes(starParticipationStatus as (typeof STAR_PARTICIPATION_STATUSES)[number])) {
    return { error: 'Please select a valid STAR participation status.' } satisfies AuthActionState;
  }

  const yearsOfExperience = Number.parseInt(yearsRaw, 10);

  if (Number.isNaN(yearsOfExperience) || yearsOfExperience < 0 || yearsOfExperience > 60) {
    return { error: 'Years of experience must be between 0 and 60.' } satisfies AuthActionState;
  }

  const subjectsTaught = normalizeCsvList(subjectsRaw, 12);
  if (subjectsTaught.length === 0) {
    return { error: 'Please provide at least one subject specialization.' } satisfies AuthActionState;
  }

  const trainingHistory = normalizeLineList(trainingHistoryRaw, 12);

  const dataQualityScore = computeProfileDataQualityScore({
    fullName,
    school,
    region,
    division,
    occupation,
    qualificationLevel,
    ageBracket,
    gender,
    yearsOfExperience,
    subjectsTaught,
    starParticipationStatus,
    trainingHistory,
  });

  try {
    const updatedProfile = await updateCurrentUserProfile({
      fullName,
      occupation,
      region,
      division,
      school,
      qualificationLevel,
      gender,
      ageBracket,
      subjectsTaught,
      trainingHistory,
      starParticipationStatus,
      consentDataProcessing,
      consentResearch,
      anonymizationOptOut,
      consentVersion: CONSENT_VERSION,
      yearsOfExperience,
      dataQualityScore,
    });

    await logAuditEvent({
      actorId: updatedProfile.id,
      action: 'profile.updated',
      entityType: 'profile',
      entityId: updatedProfile.id,
      changedFields: {
        region,
        division,
        occupation,
        qualificationLevel,
        yearsOfExperience,
        starParticipationStatus,
        consentDataProcessing,
        consentResearch,
        anonymizationOptOut,
      },
      metadata: {
        source: 'updateProfileAction',
      },
    });
  } catch (error) {
    return { error: toMessage(error) } satisfies AuthActionState;
  }

  redirect('/profile?updated=1');
}