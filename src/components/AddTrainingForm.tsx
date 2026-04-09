'use client';

import { useActionState } from 'react';
import { addTrainingRecordAction, type TrainingActionState } from '@/app/actions/training';
import { TRAINING_TYPES } from '@/lib/constants';

type Props = {
  onSuccess?: () => void;
  className?: string;
};

const initialState: TrainingActionState = { error: null, success: false };

export function AddTrainingForm({ className }: Props) {
  const [state, formAction, pending] = useActionState(addTrainingRecordAction, initialState);

  if (state.success) {
    return (
      <p style={{ color: 'var(--success, #15803d)', fontWeight: 500, margin: 0 }}>
        Training record saved. Refresh to see the updated list.
      </p>
    );
  }

  return (
    <form action={formAction} className={className} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <label htmlFor="programTitle" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Program Title *</label>
        <input
          id="programTitle"
          name="programTitle"
          type="text"
          required
          maxLength={200}
          placeholder="e.g. 2025 Regional STEM Bootcamp"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label htmlFor="provider" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Provider</label>
          <input
            id="provider"
            name="provider"
            type="text"
            maxLength={150}
            placeholder="e.g. DepEd Regional Office"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label htmlFor="trainingType" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Training Type *</label>
          <select id="trainingType" name="trainingType" defaultValue="" required>
            <option value="" disabled>Select type</option>
            {TRAINING_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label htmlFor="trainingDate" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Date</label>
          <input
            id="trainingDate"
            name="trainingDate"
            type="date"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label htmlFor="durationHours" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Duration (hours)</label>
          <input
            id="durationHours"
            name="durationHours"
            type="number"
            min={1}
            max={999}
            placeholder="e.g. 16"
          />
        </div>
      </div>

      {state.error ? (
        <p style={{ color: '#b91c1c', fontSize: '0.85rem', margin: 0 }}>{state.error}</p>
      ) : null}

      <button type="submit" className="btn btn-primary" disabled={pending} style={{ alignSelf: 'flex-start' }}>
        {pending ? 'Saving...' : 'Add Training Record'}
      </button>
    </form>
  );
}
