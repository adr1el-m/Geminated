'use client';

function ThemeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path
        d="M12 2v3m0 14v3M4.93 4.93l2.12 2.12m9.9 9.9l2.12 2.12M2 12h3m14 0h3M4.93 19.07l2.12-2.12m9.9-9.9l2.12-2.12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ThemeToggle() {
  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';

    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-secondary"
      style={{
        padding: '0.4rem 0.8rem',
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        minWidth: '100px',
        justifyContent: 'center',
      }}
      aria-label="Toggle Theme"
    >
      <ThemeIcon />
      <span>Theme</span>
    </button>
  );
}
