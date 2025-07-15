import React from 'react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, setTheme }) => {
  const isDark = theme === 'dark';

  return (
    <button
      aria-label="Toggle dark mode"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`relative w-20 h-12 rounded-full flex items-center px-2 transition-colors duration-500 shadow-2xl border-4
        ${isDark ? 'bg-black border-yellow-400' : 'bg-yellow-400 border-black'} group`}
      style={{ outline: 'none' }}
    >
      {/* Animated circle */}
      <span
        className={`absolute top-1 left-1 w-9 h-9 rounded-full transition-transform duration-500 flex items-center justify-center
          ${isDark ? 'translate-x-8 bg-yellow-400 text-black' : 'translate-x-0 bg-black text-yellow-400'} shadow-lg border-2 border-yellow-400`}
      >
        {isDark ? (
          // Sun icon (for light mode)
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 6.95-1.41-1.41M6.34 6.34 4.93 4.93m12.02 0-1.41 1.41M6.34 17.66l-1.41 1.41"/></svg>
        ) : (
          // Moon icon (for dark mode)
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"></path></svg>
        )}
      </span>
      {/* Label (optional, for accessibility/attraction) */}
      <span className="sr-only">{isDark ? 'Switch to light mode' : 'Switch to dark mode'}</span>
    </button>
  );
}; 