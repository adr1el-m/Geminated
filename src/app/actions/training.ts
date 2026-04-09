'use server';

import { redirect } from 'next/navigation';
import { getCurrentUser, hasAcceptedLatestTerms } from '@/lib/auth';
import { addTrainingRecord } from '@/lib/training-records';
import { TRAINING_TYPES } from '@/lib/constants';

export type TrainingActionState = {
  error: string | null;
  success: boolean;
};

export async function addTrainingRecordAction(
  _state: TrainingActionState,
  formData: FormData,
): Promise<TrainingActionState> {
  const user = await getCurrentUser();

  if (!user || !hasAcceptedLatestTerms(user)) {
    redirect('/login');
  }

  const programTitle = String(formData.get('programTitle') ?? '').trim();
  const provider = String(formData.get('provider') ?? '').trim();
  const trainingDateRaw = String(formData.get('trainingDate') ?? '').trim();
  const durationRaw = String(formData.get('durationHours') ?? '').trim();
  const trainingType = String(formData.get('trainingType') ?? '').trim();

  if (!programTitle) {
    return { error: 'Program title is required.', success: false };
  }

  if (programTitle.length > 200) {
    return { error: 'Program title must be under 200 characters.', success: false };
  }

  if (!TRAINING_TYPES.includes(trainingType as (typeof TRAINING_TYPES)[number])) {
    return { error: 'Please select a valid training type.', success: false };
  }

  const trainingDate = trainingDateRaw || null;
  const durationHours = durationRaw ? Number.parseInt(durationRaw, 10) : null;

  if (durationHours !== null && (Number.isNaN(durationHours) || durationHours < 1 || durationHours > 999)) {
    return { error: 'Duration must be between 1 and 999 hours.', success: false };
  }

  try {
    await addTrainingRecord(user.id, {
      programTitle,
      provider: provider || 'Self-reported',
      trainingDate,
      durationHours,
      trainingType,
    });

    return { error: null, success: true };
  } catch {
    return { error: 'Unable to save training record. Please try again.', success: false };
  }
}
