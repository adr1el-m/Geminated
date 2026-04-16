'use client';

import { useState } from 'react';
import Link from 'next/link';
import { requestDeletionAction, cancelDeletionAction, exportDataAction } from '@/app/actions/privacy';


type PrivacyPanelProps = {
  consentDataProcessing: boolean;
  consentResearch: boolean;
  anonymizationOptOut: boolean;
  consentVersion: string;
  consentedAt: string | null;
  dataRetentionExpiresAt: string | null;
  deletionRequestedAt: string | null;
  createdAt: string;
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function getDaysUntilDeletion(deletionRequestedAt: string): number {
  const requestDate = new Date(deletionRequestedAt);
  const deletionDate = new Date(requestDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  return Math.max(0, Math.ceil((deletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function getDaysUntilRetentionExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const now = new Date();
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function PrivacyPanel({
  consentDataProcessing,
  consentResearch,
  anonymizationOptOut,
  consentVersion,
  consentedAt,
  dataRetentionExpiresAt,
  deletionRequestedAt,
  createdAt,
}: PrivacyPanelProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);

  const retentionDays = getDaysUntilRetentionExpiry(dataRetentionExpiresAt);
  const isDeletionPending = !!deletionRequestedAt;
  const deletionDaysLeft = deletionRequestedAt ? getDaysUntilDeletion(deletionRequestedAt) : null;

  async function handleExport() {
    setExporting(true);
    try {
      const result = await exportDataAction();
      if (result?.json) {
        const blob = new Blob([result.json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Consent Status */}
      <div>
        <h4 style={{ color: 'var(--institutional-blue)', marginBottom: '0.75rem', fontSize: '1rem' }}>
          Consent Status
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: consentDataProcessing ? '#22c55e' : '#ef4444',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: '0.9rem' }}>
              <strong>Data Processing:</strong> {consentDataProcessing ? 'Granted' : 'Not Granted'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: consentResearch ? '#22c55e' : '#94a3b8',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: '0.9rem' }}>
              <strong>Research Consent:</strong> {consentResearch ? 'Granted' : 'Not Granted'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: anonymizationOptOut ? '#f59e0b' : '#22c55e',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: '0.9rem' }}>
              <strong>Anonymization Opt-out:</strong> {anonymizationOptOut ? 'Opted out' : 'Included in research'}
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Consent version {consentVersion} · Granted {formatDate(consentedAt)}
          </p>
        </div>
      </div>

      {/* Data Retention */}
      <div>
        <h4 style={{ color: 'var(--institutional-blue)', marginBottom: '0.75rem', fontSize: '1rem' }}>
          Data Retention
        </h4>
        <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <p><strong>Account created:</strong> {formatDate(createdAt)}</p>
          <p>
            <strong>Retention expires:</strong> {formatDate(dataRetentionExpiresAt)}
            {retentionDays !== null ? (
              <span style={{ color: retentionDays < 180 ? '#ef4444' : 'var(--text-muted)', marginLeft: '0.4rem' }}>
                ({retentionDays} days remaining)
              </span>
            ) : null}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Your data is retained for 5 years from registration. After expiry, your profile will be anonymized automatically.
          </p>
        </div>
      </div>

      {/* Deletion Request */}
      {isDeletionPending ? (
        <div style={{
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 'var(--radius-sm)',
        }}>
          <p style={{ fontWeight: 700, color: '#dc2626', marginBottom: '0.4rem' }}>
            ⚠ Account Deletion Pending
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
            Your account is scheduled for permanent anonymization in <strong>{deletionDaysLeft} day{deletionDaysLeft !== 1 ? 's' : ''}</strong>.
            All personal data will be irreversibly removed. You can cancel this request before the grace period ends.
          </p>
          <form action={cancelDeletionAction}>
            <button type="submit" className="btn btn-primary" style={{ fontSize: '0.9rem' }}>
              Cancel Deletion Request
            </button>
          </form>
        </div>
      ) : null}

      {/* Actions */}
      <div>
        <h4 style={{ color: 'var(--institutional-blue)', marginBottom: '0.75rem', fontSize: '1rem' }}>
          Data Management
        </h4>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExport}
            disabled={exporting}
            style={{ fontSize: '0.9rem' }}
          >
            {exporting ? 'Preparing Export...' : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 8zM4 19h16v2H4z"/></svg>
                Export My Data
              </span>
            )}
          </button>

          {!isDeletionPending ? (
            <button
              type="button"
              className="btn"
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                fontSize: '0.9rem',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#dc2626',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                Request Account Deletion
              </span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Deletion Confirmation */}
      {showDeleteConfirm ? (
        <div style={{
          padding: '1.25rem',
          background: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 'var(--radius-md)',
        }}>
          <p style={{ fontWeight: 700, color: '#dc2626', marginBottom: '0.5rem' }}>
            Confirm Account Deletion
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            This will schedule your account for permanent anonymization after a <strong>30-day grace period</strong>.
            During this period you can cancel the request. Once processed, all personally identifying data will be irreversibly removed.
          </p>
          <form action={requestDeletionAction} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Reason for leaving (optional)
              <textarea
                name="reason"
                rows={2}
                placeholder="Help us improve — why are you deleting your account?"
                style={{ marginTop: '0.3rem', fontSize: '0.9rem' }}
              />
            </label>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button type="submit" className="btn" style={{
                background: '#dc2626',
                color: '#fff',
                fontSize: '0.9rem',
                padding: '0.6rem 1.25rem',
              }}>
                Confirm Deletion
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
                style={{ fontSize: '0.9rem' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Links */}
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
        <Link href="/privacy" style={{ color: 'var(--primary-blue)', fontWeight: 600, textDecoration: 'underline' }}>
          Read Full Privacy Policy →
        </Link>
        <span style={{ margin: '0 0.5rem' }}>·</span>
        <Link href="/terms" style={{ color: 'var(--primary-blue)', fontWeight: 600, textDecoration: 'underline' }}>
          Terms &amp; Conditions
        </Link>
        <p style={{ marginTop: '0.4rem' }}>
          Manage your consent settings in the Edit Profile form below.
        </p>
      </div>
    </div>
  );
}
