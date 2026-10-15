import React, { useState } from 'react';
import { Copy, Trash2, Code, X, Check } from 'lucide-react';

interface NotesPadProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotesPad: React.FC<NotesPadProps> = ({ isOpen, onClose }) => {
  const [notes, setNotes] = useState(
    `// Candidate Scratchpad & Notes\n// Feel free to jot down pseudocode, system design components, or STAR notes here:\n\n`
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (confirm('Clear scratchpad notes?')) {
      setNotes('');
    }
  };

  return (
    <div className="w-80 md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-30 shadow-2xl animate-slideLeft">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-cyan-400" />
          <h3 className="text-white font-semibold text-sm">Scratchpad & Code</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Copy notes"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Clear notes"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 p-3">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Jot down notes, Swift/React/SQL code, or architecture diagrams here..."
          className="w-full h-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-cyan-100 font-mono text-xs leading-relaxed focus:outline-none focus:border-cyan-500/50 resize-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
};
