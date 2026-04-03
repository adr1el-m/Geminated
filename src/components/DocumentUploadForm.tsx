'use client';

import { useActionState } from 'react';
import repoStyles from '@/app/repository/repository.module.css';
import { uploadDocumentAction, type CommunityActionState } from '@/app/actions/community';

const initialState: CommunityActionState = {
  error: null,
};

export default function DocumentUploadForm() {
  const [state, formAction, pending] = useActionState(uploadDocumentAction, initialState);

  return (
    <form action={formAction} className={repoStyles.uploadForm}>
      <div className={repoStyles.formRow}>
        <label>
          Document Title
          <input name="title" type="text" placeholder="Project title or paper name" required />
        </label>
      </div>

      <div className={repoStyles.formRow}>
        <label>
          Description
          <textarea
            name="description"
            rows={4}
            placeholder="Add a short abstract or upload note."
          />
        </label>
      </div>

      <div className={repoStyles.formRow}>
        <label>
          Document File
          <input name="document" type="file" accept=".pdf,.doc,.docx,.txt" required />
        </label>
      </div>

      {state.error && <p className={repoStyles.formError}>{state.error}</p>}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? 'Uploading...' : 'Upload Document'}
      </button>
    </form>
  );
}