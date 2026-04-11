'use client';

import { useState } from 'react';
import { runForumDiagnosticsAction } from '@/app/actions/ai';
import { AiFieldAlert } from '@/lib/community';
import adminStyles from '@/app/admin/admin.module.css';

type Props = {
  initialAlerts: AiFieldAlert[];
};

export default function AIFieldInsightsTab({ initialAlerts }: Props) {
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<AiFieldAlert[]>(initialAlerts);
  const [message, setMessage] = useState<string | null>(null);

  const handleRunScan = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await runForumDiagnosticsAction();
      if (result.error) {
        setMessage(`Error: ${result.error}`);
      } else {
        setMessage(result.message || 'Scan completed successfully.');
        if (result.alerts) {
          setAlerts(result.alerts);
        }
      }
    } catch (err) {
      setMessage('Failed to trigger AI scan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--primary-blue)' }}>
        <div>
          <h3 style={{ margin: '0 0 0.25rem 0' }}>Proactive Field Diagnostics</h3>
          <p className={adminStyles.meta} style={{ margin: 0 }}>
            Analyze recent community forum activity to detect pedagogical gaps and regional intervention needs.
          </p>
        </div>
        <button 
          onClick={handleRunScan} 
          disabled={loading} 
          className="btn btn-primary"
          style={{ height: 'fit-content', minWidth: '180px' }}
        >
          {loading ? 'AI Analyzing...' : 'Run AI Field Scan'}
        </button>
      </div>

      {message && (
        <div className="card" style={{ 
          backgroundColor: message.includes('Error') ? 'rgba(220, 38, 38, 0.1)' : 'rgba(10, 102, 194, 0.1)',
          borderColor: message.includes('Error') ? 'rgba(220, 38, 38, 0.2)' : 'rgba(10, 102, 194, 0.2)',
          padding: '0.75rem 1rem'
        }}>
          {message}
        </div>
      )}

      <div className={adminStyles.queue}>
        {alerts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p className={adminStyles.empty}>No AI field insights generated yet. Click the button above to start the first scan.</p>
          </div>
        ) : (
          alerts.map((insight) => (
            <article key={insight.id} className="card" style={{ borderLeft: `5px solid ${getSentimentColor(insight.sentiment)}` }}>
              <div className={adminStyles.itemHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ 
                    backgroundColor: getSentimentColor(insight.sentiment), 
                    color: '#fff', 
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.7rem', 
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {insight.sentiment}
                  </span>
                  <h3 style={{ margin: 0 }}>{insight.cluster_title}</h3>
                </div>
                <span className={adminStyles.metricBadge}>{insight.affected_count} Teachers Flagged</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '0.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Region</h4>
                  <p style={{ fontWeight: 600, margin: 0 }}>{insight.region}</p>
                  
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Issue Summary</h4>
                  <p className={adminStyles.description} style={{ margin: 0 }}>{insight.description}</p>
                </div>
                
                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--primary-blue)', marginBottom: '0.5rem', fontWeight: 'bold' }}>🤖 AI Suggested Intervention</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-color)', margin: 0, lineHeight: '1.4' }}>
                    {insight.suggested_intervention}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem' }} onClick={() => alert('Regional Coordinator Notified (Demo)')}>
                  Notify Regional Coordinator
                </button>
                <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem' }} onClick={() => alert('Drafting Intervention Program...')}>
                  Draft Training Proposal
                </button>
              </div>
            </article>
          ))
        )}

      </div>
    </div>
  );
}

function getSentimentColor(sentiment: string) {
  switch (sentiment.toLowerCase()) {
    case 'critical': return '#dc2626';
    case 'warning': return '#f59e0b';
    case 'constructive': return '#10b981';
    default: return '#64748b';
  }
}
