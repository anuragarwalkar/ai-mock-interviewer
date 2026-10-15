import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  onToggle: () => void;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle, className = '' }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`p-2 rounded-xl border transition-all flex items-center justify-center gap-1.5 text-xs font-medium ${
        theme === 'light'
          ? 'bg-white border-slate-300 text-amber-600 hover:bg-slate-100 shadow-sm'
          : 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800'
      } ${className}`}
      title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    >
      {theme === 'light' ? (
        <>
          <Moon className="w-4 h-4 text-indigo-600" />
          <span className="hidden sm:inline text-slate-700">Dark</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline text-slate-300">Light</span>
        </>
      )}
    </button>
  );
};
