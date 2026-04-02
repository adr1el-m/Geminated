'use client';

import { useActionState, useRef, useState, type DragEvent } from 'react';
import repoStyles from '@/app/repository/repository.module.css';
import { uploadDocumentAction, type CommunityActionState } from '@/app/actions/community';

const initialState: CommunityActionState = {
  error: null,
};

export default function DocumentUploadForm() {
  const [state, formAction, pending] = useActionState(uploadDocumentAction, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (fileInputRef.current) {
        fileInputRef.current.files = e.dataTransfer.files;
        setFileName(e.dataTransfer.files[0].name);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

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
        <span className={repoStyles.labelSmall}>Document File</span>
        <div 
          className={`${repoStyles.dropZone} ${isDragging ? repoStyles.dropZoneActive : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
        >
          <input 
            name="document" 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt" 
            required 
            style={{ display: 'none' }}
          />
          <div className={repoStyles.dropZoneContent}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p>{fileName ? `Selected: ${fileName}` : 'Drag & drop your files here or click to browse'}</p>
            <button type="button" className="btn btn-secondary" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
              Choose File
            </button>
          </div>
        </div>
      </div>

      {state.error && <p className={repoStyles.formError}>{state.error}</p>}

      <button type="submit" className="btn btn-primary" disabled={pending} style={{ marginTop: '1rem' }}>
        {pending ? 'Uploading...' : 'Upload Document'}
      </button>
    </form>
  );
}