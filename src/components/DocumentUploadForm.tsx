'use client';

import { useActionState } from 'react';
import repoStyles from '@/app/repository/repository.module.css';
import { uploadDocumentAction, type CommunityActionState } from '@/app/actions/community';
import {
  REGION_DISPLAY_NAMES,
  REGISTRATION_REGIONS,
  RESOURCE_GRADE_LEVELS,
  RESOURCE_SUBJECT_AREAS,
  RESOURCE_TYPES,
} from '@/lib/constants';

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

      <div className={repoStyles.formGrid}>
        <label>
          Region
          <select name="region" required defaultValue="">
            <option value="" disabled>Select Region</option>
            {REGISTRATION_REGIONS.map((region) => (
              <option key={region} value={region}>{REGION_DISPLAY_NAMES[region] ?? region}</option>
            ))}
          </select>
        </label>

        <label>
          Subject Area
          <select name="subjectArea" required defaultValue="">
            <option value="" disabled>Select Subject Area</option>
            {RESOURCE_SUBJECT_AREAS.map((subject) => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </label>
      </div>

      <div className={repoStyles.formGrid}>
        <label>
          Grade Level
          <select name="gradeLevel" required defaultValue="">
            <option value="" disabled>Select Grade Level</option>
            {RESOURCE_GRADE_LEVELS.map((gradeLevel) => (
              <option key={gradeLevel} value={gradeLevel}>{gradeLevel}</option>
            ))}
          </select>
        </label>

        <label>
          Resource Type
          <select name="resourceType" required defaultValue="">
            <option value="" disabled>Select Resource Type</option>
            {RESOURCE_TYPES.map((resourceType) => (
              <option key={resourceType} value={resourceType}>{resourceType}</option>
            ))}
          </select>
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
          Keywords (Optional)
          <input name="keywords" type="text" placeholder="e.g. inquiry, STEM, biodiversity" />
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