import { $ } from './dom';
import { LS } from './state';

type Theme = 'auto' | 'light' | 'dark';

const isTheme = (s: string | null): s is Theme =>
  s === 'auto' || s === 'light' || s === 'dark';

const applyTheme = (t: Theme): void => {
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
  $('themeLabel').textContent = t;
  try {
    localStorage.setItem(LS.THEME, t);
  } catch {
    /* noop */
  }
};

export const initTheme = (): void => {
  let cur: Theme = 'auto';
  try {
    const saved = localStorage.getItem(LS.THEME);
    if (isTheme(saved)) cur = saved;
  } catch {
    /* noop */
  }
  applyTheme(cur);
  const next: Record<Theme, Theme> = { auto: 'light', light: 'dark', dark: 'auto' };
  $('themeBtn').addEventListener('click', () => {
    cur = next[cur];
    applyTheme(cur);
  });
};
