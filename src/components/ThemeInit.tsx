'use client';

import { useEffect } from 'react';

export default function ThemeInit() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return null;
}
