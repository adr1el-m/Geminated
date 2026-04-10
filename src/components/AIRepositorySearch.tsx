'use client';

import { useState } from 'react';
import { askAiAction } from '@/app/actions/ai';
import Link from 'next/link';

export default function AIRepositorySearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    answer?: string;
    resources?: any[];
    error?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);

    const response = await askAiAction(query);
    setResult(response);
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>✨ Ask STAR-LINK AI</h2>
        <p style={styles.subtitle}>
          Use natural language to search the entire repository. The AI will synthesize methods and provide a compiled response based on real Filipino educator research.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., How can I teach physics without laboratory equipment?"
          style={styles.input}
          disabled={loading}
          autoComplete="off"
        />
        <button type="submit" disabled={loading || !query.trim()} className="btn btn-primary" style={styles.button}>
          {loading ? 'Synthesizing...' : 'Ask AI'}
        </button>
      </form>

      {result && (
        <div style={styles.resultsContainer}>
          {result.error ? (
            <div style={styles.errorBox}>{result.error}</div>
          ) : (
            <>
              <div style={styles.answerBox}>
                <h3 style={styles.answerTitle}>AI Synthesized Response</h3>
                <div 
                  style={styles.answerText}
                  dangerouslySetInnerHTML={{ 
                    // Basic Markdown rendering for bolding and line breaks
                    __html: (result.answer || '')
                      .replace(/\n\n/g, '</p><p>')
                      .replace(/\n/g, '<br/>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  }} 
                />
              </div>

              {result.resources && result.resources.length > 0 && (
                <div style={styles.sourcesContainer}>
                  <h4 style={styles.sourcesTitle}>Top Sources (Vector Matched)</h4>
                  <div style={styles.sourcesGrid}>
                    {result.resources.map((doc: any, index: number) => (
                      <Link href={`/api/documents/${doc.id}`} key={doc.id} style={styles.sourceCard}>
                        <div style={styles.sourceIndex}>{index + 1}</div>
                        <div style={styles.sourceDetails}>
                          <strong style={styles.sourceName}>{doc.title}</strong>
                          <span style={styles.sourceAuthor}>by {doc.author_name}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'var(--surface-color, #ffffff)',
    border: '1px solid var(--border-color, #e2e8f0)',
    borderRadius: '16px',
    padding: '1.5rem',
    marginBottom: '2rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    transition: 'all 0.3s ease',
  },
  header: {
    marginBottom: '1rem',
  },
  title: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.5rem',
    background: 'linear-gradient(135deg, var(--primary-color, #0a66c2), var(--secondary-color, #228be6))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: 'bold',
  },
  subtitle: {
    margin: 0,
    color: 'var(--text-muted, #64748b)',
    fontSize: '0.95rem',
  },
  form: {
    display: 'flex',
    gap: '0.75rem',
  },
  input: {
    flex: 1,
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid var(--border-color, #cbd5e1)',
    fontSize: '1rem',
    outline: 'none',
    transition: 'box-shadow 0.2s',
  },
  button: {
    whiteSpace: 'nowrap' as const,
  },
  resultsContainer: {
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px dashed var(--border-color, #e2e8f0)',
    animation: 'fadeIn 0.5s ease',
  },
  errorBox: {
    padding: '1rem',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: 'rgb(220, 38, 38)',
    borderRadius: '8px',
  },
  answerBox: {
    backgroundColor: 'var(--bg-color, #f8fafc)',
    padding: '1.5rem',
    borderRadius: '12px',
    borderLeft: '4px solid var(--primary-color, #0a66c2)',
    marginBottom: '1.5rem',
  },
  answerTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1.1rem',
    color: 'var(--text-color, #1e293b)',
  },
  answerText: {
    lineHeight: '1.6',
    color: 'var(--text-color, #334155)',
    margin: 0,
  },
  sourcesContainer: {
    marginTop: '1rem',
  },
  sourcesTitle: {
    fontSize: '1rem',
    color: 'var(--text-muted, #64748b)',
    marginBottom: '0.75rem',
    marginTop: 0,
  },
  sourcesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '0.75rem',
  },
  sourceCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    border: '1px solid var(--border-color, #e2e8f0)',
    borderRadius: '8px',
    textDecoration: 'none',
    backgroundColor: 'var(--surface-color, #fff)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  sourceIndex: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--primary-color, #0a66c2)',
    color: '#fff',
    borderRadius: '50%',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  sourceDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  sourceName: {
    color: 'var(--text-color, #1e293b)',
    fontSize: '0.9rem',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  sourceAuthor: {
    color: 'var(--text-muted, #64748b)',
    fontSize: '0.8rem',
  },
};
