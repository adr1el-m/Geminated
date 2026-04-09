import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 — Page Not Found | STAR-LINK',
  description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        gap: '1.5rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'var(--secondary-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="11" r="7" stroke="var(--primary-blue)" strokeWidth="2" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="var(--primary-blue)" strokeWidth="2" strokeLinecap="round" />
          <line x1="9" y1="11" x2="13" y2="11" stroke="var(--primary-blue)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <div style={{ maxWidth: '440px' }}>
        <p
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--primary-blue)',
            marginBottom: '0.75rem',
          }}
        >
          404 — Not Found
        </p>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
            color: 'var(--foreground)',
            lineHeight: 1.3,
          }}
        >
          This page does not exist
        </h1>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
          The resource you requested could not be found. It may have been moved, deleted, or the link may be incorrect.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/"
          className="btn btn-primary"
        >
          Return to Home
        </Link>
        <Link
          href="/repository"
          className="btn btn-secondary"
        >
          Browse Resources
        </Link>
      </div>
    </div>
  );
}
