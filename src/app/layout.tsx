import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import layoutStyles from './layout.module.css';
import ThemeInit from '@/components/ThemeInit';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata: Metadata = {
  title: 'STAR-LINK | DOST-SEI STEM Educators Hub',
  description: 'Community-driven collaboration hub for STEM educators enriching the e-STAR.ph resource portal. Share action research, discuss challenges, and form networks.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <ThemeInit />
      </head>
      <body>
        <div className="blobContainer">
          <div className="blob blob1" />
          <div className="blob blob2" />
          <div className="blob blob3" />
        </div>
        
        <div className="scrollRoot">
          <header className={`${layoutStyles.header} glass`}>
            <div className={layoutStyles.container}>
              <div className={layoutStyles.logoArea}>
                <Link href="/" className={layoutStyles.logoText}>
                  <strong>STAR-LINK</strong> <span className={layoutStyles.tagline}>by DOST-SEI</span>
                </Link>
              </div>
              
              <nav className={layoutStyles.nav}>
                <Link href="/repository" className={layoutStyles.navLink}>Research & Projects</Link>
                <Link href="/forum" className={layoutStyles.navLink}>Community Forums</Link>
                <Link href="/map" className={layoutStyles.navLink}>Regional Map</Link>
                <a href="https://e-star.ph" target="_blank" rel="noopener noreferrer" className={`${layoutStyles.navLink} ${layoutStyles.externalLink}`}>
                  Back to e-STAR.ph ↗
                </a>
              </nav>
              
              <div className={layoutStyles.authActions}>
                <ThemeToggle />
                <Link href="/login" className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                  Teacher Login
                </Link>
              </div>
            </div>
          </header>

          <main className={layoutStyles.mainContent}>
            {children}
          </main>

          <footer className={layoutStyles.footer}>
            <div className={layoutStyles.container}>
              <p>&copy; {new Date().getFullYear()} DOST-SEI STAR-LINK. A collaborative space for STEM educators.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
