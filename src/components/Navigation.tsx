'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import layoutStyles from '@/app/layout.module.css';
import ThemeToggle from './ThemeToggle';
import { signOutAction } from '@/app/actions/auth';
import type { Profile } from '@/lib/auth';

interface NavigationProps {
  currentUser: Profile | null;
}

export default function Navigation({ currentUser }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className={layoutStyles.header}>
      <div className={layoutStyles.container}>
        <div className={layoutStyles.logoArea}>
          <Link href="/" className={layoutStyles.logoText} onClick={closeMenu}>
            <Image src="/img/favicon.png" alt="STAR-LINK Logo" width={36} height={36} style={{ objectFit: 'contain' }} priority unoptimized />
            <strong>STAR-LINK</strong> <span className={layoutStyles.tagline}>by DOST-SEI</span>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className={layoutStyles.menuToggle} 
          onClick={toggleMenu} 
          aria-label="Toggle Menu"
          aria-expanded={isMenuOpen}
        >
          <div className={`${layoutStyles.hamburger} ${isMenuOpen ? layoutStyles.open : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>

        {/* Desktop & Mobile Nav */}
        <nav className={`${layoutStyles.nav} ${isMenuOpen ? layoutStyles.navOpen : ''}`}>
          <Link href="/repository" className={layoutStyles.navLink} onClick={closeMenu}>Research & Projects</Link>
          <Link href="/forum" className={layoutStyles.navLink} onClick={closeMenu}>Community Forums</Link>
          <Link href="/map" className={layoutStyles.navLink} onClick={closeMenu}>Regional Map</Link>
          {currentUser ? (
            <Link href="/programs" className={layoutStyles.navLink} onClick={closeMenu}>Programs</Link>
          ) : null}
          {currentUser?.role === 'admin' ? (
            <Link href="/admin" className={layoutStyles.navLink} onClick={closeMenu}>Admin Dashboard</Link>
          ) : null}
          <a href="https://e-star.ph" target="_blank" rel="noopener noreferrer" className={`${layoutStyles.navLink} ${layoutStyles.externalLink}`} onClick={closeMenu}>
            Back to e-STAR.ph ↗
          </a>
          
          {/* Mobile Auth Actions */}
          <div className={layoutStyles.mobileAuthActions}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <ThemeToggle />
            </div>
            {currentUser ? (
              <>
                <Link href="/profile" className="btn btn-secondary" onClick={closeMenu}>
                  My Profile
                </Link>
                <form action={signOutAction}>
                  <button type="submit" className="btn btn-primary" onClick={closeMenu} style={{ width: '100%' }}>
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" className="btn btn-primary" onClick={closeMenu}>
                Teacher Login
              </Link>
            )}
          </div>
        </nav>

        {/* Header Actions */}
        <div className={layoutStyles.headerActions}>
          <div className={layoutStyles.desktopThemeToggle}>
            <ThemeToggle />
          </div>
          {currentUser ? (
            <div className={layoutStyles.desktopAuth}>
              <Link href="/profile" className="btn btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                My Profile
              </Link>
              <form action={signOutAction}>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                  Sign Out
                </button>
              </form>
            </div>
          ) : (
            <div className={layoutStyles.desktopAuth}>
              <Link href="/login" className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                Teacher Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

