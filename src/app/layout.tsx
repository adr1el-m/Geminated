import type { Metadata, Viewport } from 'next';
import './globals.css';
import layoutStyles from './layout.module.css';
import ThemeInit from '@/components/ThemeInit';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'STAR-LINK | DOST-SEI STEM Educators Hub',
  description: 'Community-driven collaboration hub for STEM educators enriching the e-STAR.ph resource portal. Share action research, discuss challenges, and form networks.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

import Navigation from '@/components/Navigation';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeInit />
      </head>
      <body>
        <div className="blobContainer">
          <div className="blob blob1" />
          <div className="blob blob2" />
          <div className="blob blob3" />
        </div>

        <div className={layoutStyles.pageShell}>
          <Navigation currentUser={currentUser} />

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
