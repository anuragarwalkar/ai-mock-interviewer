import React from 'react';
import { Send, X, Mic } from 'lucide-react';

interface TextAnswerModalProps {
  isOpen: boolean;
  textAnswer: string;
  isGeneratingResponse: boolean;
  onTextChange: (val: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const TextAnswerModal: React.FC<TextAnswerModalProps> = ({
  isOpen,
  textAnswer,
  isGeneratingResponse,
  onTextChange,
  onSubmit,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold text-base">Your Response</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Voice / Text Hybrid
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          You can speak into your microphone or type/edit your response here. Once you are ready, send it to the interviewer.
        </p>

        <textarea
          value={textAnswer}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Speak or type your answer here..."
          rows={6}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
          autoFocus
        />

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-slate-400" />
            <span>Voice input automatically populates this text.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onSubmit();
                onClose();
              }}
              disabled={!textAnswer.trim() || isGeneratingResponse}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Send Answer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
