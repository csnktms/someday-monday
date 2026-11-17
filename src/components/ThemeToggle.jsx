import { useEffect, useState } from 'react';
import { applyTheme, getInitialTheme } from '../lib/theme.js';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);
  const dark = theme === 'dark';

  // index.html sets the theme before React loads; keep it in sync without
  // saving, so visitors who never click keep following their device setting.
  useEffect(() => applyTheme(theme, { save: false }), [theme]);

  function toggle() {
    const next = dark ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span aria-hidden="true">{dark ? '☀️' : '🌙'}</span>
    </button>
  );
}
