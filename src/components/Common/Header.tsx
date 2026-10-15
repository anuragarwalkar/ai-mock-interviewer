import React from 'react';
import { Bot, ShieldCheck, Key } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  onOpenApiKeyModal?: () => void;
  hasApiKey?: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenApiKeyModal, 
  hasApiKey,
  theme,
  onToggleTheme
}) => {
  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight">
                Gemini Interviewer
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400">
                Gemini Audio & AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Real-time Voice & 3D Local Avatar Mock Sessions
            </p>
          </div>
        </div>

        {/* Right Badges / Actions */}
        <div className="flex items-center gap-2.5">
          {/* Light / Dark Mode Toggle */}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          {onOpenApiKeyModal && (
            <button
              onClick={onOpenApiKeyModal}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                hasApiKey
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{hasApiKey ? 'API Key Active' : 'Enter API Key'}</span>
              <span className="sm:hidden">{hasApiKey ? 'Key' : 'API'}</span>
            </button>
          )}

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Local Browser Voice & Video</span>
          </div>
        </div>
      </div>
    </header>
  );
};
