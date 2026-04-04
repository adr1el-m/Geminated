import Link from 'next/link';
import repoStyles from '../repository.module.css';
import DocumentUploadForm from '@/components/DocumentUploadForm';

export default function UploadDocumentPage() {
  return (
    <div className={repoStyles.pageContainer}>
      <header className={repoStyles.header}>
        <div className={repoStyles.titleBlock}>
          <h1 className={repoStyles.title}>Upload Research & Extension Projects</h1>
          <p className={repoStyles.subtitle}>
            Share your action research, extension projects, or innovative lesson materials with educators across the Philippines.
          </p>
        </div>
        <Link href="/repository" className="btn btn-primary" style={{ height: 'fit-content' }}>
          ← Back to Repository
        </Link>
      </header>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '0.5rem', color: 'var(--primary-blue)', fontSize: '1.5rem' }}>
            Upload a Document
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>
            Share your research or project. Include region, subject area, grade level, and resource type so others can find it faster.
            Submissions are reviewed by an admin before they appear publicly. Max file size: 10MB. Supported formats: PDF, DOC, DOCX.
          </p>
          <DocumentUploadForm />
        </div>
      </div>
    </div>
  );
}
