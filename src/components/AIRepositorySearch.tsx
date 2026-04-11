'use client';

import { useEffect, useState } from 'react';
import { askAiAction } from '@/app/actions/ai';
import Link from 'next/link';

type ResourceMatch = {
  id: string;
  title: string;
  author_name: string;
  description?: string;
  region?: string;
  subject_area?: string;
  similarity?: number;
};

type AiSearchResult = {
  answer?: string;
  resources?: ResourceMatch[];
  error?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatInlineMarkdown(text: string, resources: ResourceMatch[]): string {
  let safe = escapeHtml(text);

  safe = safe.replace(/\[(\d+)\]/g, (_, rawIndex) => {
    const index = Number(rawIndex) - 1;
    const match = resources[index];
    if (!match?.id) {
      return `[${rawIndex}]`;
    }

    return `<a href="/repository#resource-${encodeURIComponent(match.id)}" style="color: var(--primary-blue); text-decoration: underline; font-weight: 600;">[${rawIndex}]</a>`;
  });

  safe = safe
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background: rgba(148, 163, 184, 0.2); border-radius: 4px; padding: 0.05rem 0.35rem; font-size: 0.9em;">$1</code>');

  return safe;
}

function renderStructuredMarkdown(markdown: string, resources: ResourceMatch[]): string {
  if (!markdown.trim()) {
    return '<p style="margin: 0;">No synthesis available yet.</p>';
  }

  const lines = markdown.split(/\r?\n/);
  let html = '';
  let inUnorderedList = false;
  let inOrderedList = false;

  const closeLists = () => {
    if (inUnorderedList) {
      html += '</ul>';
      inUnorderedList = false;
    }
    if (inOrderedList) {
      html += '</ol>';
      inOrderedList = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      closeLists();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      closeLists();
      const headingLevel = headingMatch[1].length <= 2 ? 'h4' : 'h5';
      html += `<${headingLevel} style="margin: 1rem 0 0.55rem 0; color: var(--foreground); font-weight: 700;">${formatInlineMarkdown(headingMatch[2], resources)}</${headingLevel}>`;
      continue;
    }

    const unorderedListMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (unorderedListMatch) {
      if (!inUnorderedList) {
        closeLists();
        inUnorderedList = true;
        html += '<ul style="margin: 0.5rem 0 0.9rem 1.1rem; padding: 0;">';
      }
      html += `<li style="margin: 0.35rem 0;">${formatInlineMarkdown(unorderedListMatch[1], resources)}</li>`;
      continue;
    }

    const orderedListMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (orderedListMatch) {
      if (!inOrderedList) {
        closeLists();
        inOrderedList = true;
        html += '<ol style="margin: 0.5rem 0 0.9rem 1.1rem; padding: 0;">';
      }
      html += `<li style="margin: 0.35rem 0;">${formatInlineMarkdown(orderedListMatch[1], resources)}</li>`;
      continue;
    }

    closeLists();
    html += `<p style="margin: 0 0 0.75rem 0;">${formatInlineMarkdown(trimmed, resources)}</p>`;
  }

  closeLists();
  return html;
}

function formatSimilarity(value?: number): string | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }

  const percent = Math.max(0, Math.min(100, Math.round(value * 100)));
  return `${percent}% relevance`;
}

export default function AIRepositorySearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiSearchResult | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const renderedAnswer = result?.answer
    ? renderStructuredMarkdown(result.answer, result.resources || [])
    : '';

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
    <div style={{ ...styles.container, ...(isMobile ? styles.containerMobile : {}) }}>
      <div style={styles.header}>
        <h2 style={{ ...styles.title, ...(isMobile ? styles.titleMobile : {}) }}>Ask STAR-LINK AI</h2>
        <p style={styles.subtitle}>
          Use natural language to search the entire repository. The AI will synthesize methods and provide a compiled response based on real Filipino educator research.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ ...styles.form, ...(isMobile ? styles.formMobile : {}) }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., How can I teach physics without laboratory equipment?"
          style={{ ...styles.input, ...(isMobile ? styles.inputMobile : {}) }}
          disabled={loading}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn btn-primary"
          style={{ ...styles.button, ...(isMobile ? styles.buttonMobile : {}) }}
        >
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
                <h3 style={styles.answerTitle}>Scholarly Synthesis and Pedagogical Guidance</h3>
                <p style={styles.answerLead}>Generated from repository-indexed action research and extension evidence.</p>
                <div 
                  style={styles.answerText}
                  dangerouslySetInnerHTML={{ __html: renderedAnswer }}
                />
              </div>

              {result.resources && result.resources.length > 0 && (
                <div style={styles.sourcesContainer}>
                  <h4 style={styles.sourcesTitle}>Linked Source Records</h4>
                  <div style={{ ...styles.sourcesGrid, ...(isMobile ? styles.sourcesGridMobile : {}) }}>
                    {result.resources.map((doc, index) => {
                      const relevance = formatSimilarity(doc.similarity);

                      return (
                      <div key={doc.id} style={{ ...styles.sourceCard, ...(isMobile ? styles.sourceCardMobile : {}) }}>
                        <div style={styles.sourceIndex}>{index + 1}</div>
                        <div style={{ ...styles.sourceDetails, ...(isMobile ? styles.sourceDetailsMobile : {}) }}>
                          <strong style={styles.sourceName}>{doc.title}</strong>
                          <span style={styles.sourceAuthor}>by {doc.author_name}</span>
                          <span style={styles.sourceMeta}>
                            {[doc.region, doc.subject_area, relevance].filter(Boolean).join(' • ')}
                          </span>
                        </div>
                        <div style={{ ...styles.sourceActions, ...(isMobile ? styles.sourceActionsMobile : {}) }}>
                          <Link href={`/repository#resource-${doc.id}`} style={styles.sourceLinkBtn}>
                            View Post
                          </Link>
                          <Link href={`/api/documents/${doc.id}`} style={styles.sourceFileBtn}>
                            Open File
                          </Link>
                        </div>
                      </div>
                    )})}
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
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '1.5rem',
    marginBottom: '2rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    transition: 'all 0.3s ease',
  },
  containerMobile: {
    padding: '1rem',
    borderRadius: '14px',
  },
  header: {
    marginBottom: '1rem',
  },
  title: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.5rem',
    background: 'linear-gradient(135deg, var(--primary-blue), var(--accent-soft))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: 'bold',
  },
  titleMobile: {
    fontSize: '1.15rem',
  },
  subtitle: {
    margin: 0,
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
  },
  form: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: '0.75rem',
  },
  formMobile: {
    gridTemplateColumns: '1fr',
  },
  input: {
    width: '100%',
    minWidth: 0,
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--background)',
    color: 'var(--foreground)',
    fontSize: '1rem',
    outline: 'none',
    transition: 'box-shadow 0.2s',
  },
  inputMobile: {
    fontSize: '0.96rem',
  },
  button: {
    whiteSpace: 'nowrap' as const,
    minHeight: '44px',
  },
  buttonMobile: {
    width: '100%',
  },
  resultsContainer: {
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px dashed var(--border)',
    animation: 'fadeIn 0.5s ease',
  },
  errorBox: {
    padding: '1rem',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: 'rgb(220, 38, 38)',
    borderRadius: '8px',
  },
  answerBox: {
    backgroundColor: 'var(--background)',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    marginBottom: '1.5rem',
  },
  answerTitle: {
    margin: '0 0 0.35rem 0',
    fontSize: '1.12rem',
    color: 'var(--foreground)',
    letterSpacing: '0.01em',
  },
  answerLead: {
    margin: '0 0 1rem 0',
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
  },
  answerText: {
    lineHeight: '1.72',
    color: 'var(--foreground)',
    margin: 0,
    fontSize: '0.97rem',
  },
  sourcesContainer: {
    marginTop: '1rem',
  },
  sourcesTitle: {
    fontSize: '1.02rem',
    color: 'var(--text-muted)',
    marginBottom: '0.75rem',
    marginTop: 0,
  },
  sourcesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '0.75rem',
  },
  sourcesGridMobile: {
    gridTemplateColumns: '1fr',
  },
  sourceCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '0.85rem',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    backgroundColor: 'var(--surface)',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
  },
  sourceCardMobile: {
    padding: '0.75rem',
  },
  sourceIndex: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--primary-blue)',
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
    flex: 1,
    minWidth: '220px',
  },
  sourceDetailsMobile: {
    minWidth: 0,
  },
  sourceName: {
    color: 'var(--foreground)',
    fontSize: '0.92rem',
    whiteSpace: 'normal' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  sourceAuthor: {
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    marginTop: '0.18rem',
  },
  sourceMeta: {
    color: 'var(--text-muted)',
    fontSize: '0.76rem',
    marginTop: '0.25rem',
  },
  sourceActions: {
    display: 'flex',
    gap: '0.45rem',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  sourceActionsMobile: {
    width: '100%',
  },
  sourceLinkBtn: {
    textDecoration: 'none',
    color: 'var(--primary-blue)',
    fontSize: '0.8rem',
    fontWeight: 700,
    border: '1px solid rgba(111, 143, 192, 0.35)',
    borderRadius: '999px',
    padding: '0.3rem 0.65rem',
  },
  sourceFileBtn: {
    textDecoration: 'none',
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    fontWeight: 600,
    border: '1px solid var(--border)',
    borderRadius: '999px',
    padding: '0.3rem 0.65rem',
  },
};
