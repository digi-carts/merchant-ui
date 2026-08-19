'use client';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as Theme) || 'system';
    setThemeState(saved);
    applyTheme(saved);
  }, []);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = (t: Theme) => {
    localStorage.setItem('theme', t);
    setThemeState(t);
    applyTheme(t);
  };

  return { theme, setTheme };
}
