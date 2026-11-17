export const THEME_KEY = 'sm-theme';

/** The saved theme, or the device preference when nothing is saved. */
export function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Storage can be blocked (private mode); fall through to the device setting.
  }
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function applyTheme(theme, { save = true } = {}) {
  document.documentElement.dataset.theme = theme;
  if (!save) return;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Not saving is fine; the toggle still works for this visit.
  }
}
