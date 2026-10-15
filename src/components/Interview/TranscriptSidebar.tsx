import React, { useEffect, useRef } from 'react';
import { Bot, User, Clock, X } from 'lucide-react';
import type { InterviewMessage, InterviewerPersona } from '../../types/interview';

interface TranscriptSidebarProps {
  messages: InterviewMessage[];
  persona: InterviewerPersona;
  candidateName: string;
  currentQuestion: number;
  totalQuestions: number;
  isOpen: boolean;
  onClose: () => void;
}

export const TranscriptSidebar: React.FC<TranscriptSidebarProps> = ({
  messages,
  persona,
  candidateName,
  currentQuestion,
  totalQuestions,
  isOpen,
  onClose
}) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="w-80 md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-30 shadow-2xl animate-slideLeft">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div>
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <span>Interview Transcript</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Q{currentQuestion}/{totalQuestions}
            </span>
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">Live turn-by-turn dialogue</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress tracker */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800 flex items-center gap-1.5">
        {Array.from({ length: totalQuestions }).map((_, idx) => {
          const qNum = idx + 1;
          const isDone = qNum < currentQuestion;
          const isCurrent = qNum === currentQuestion;

          return (
            <div
              key={idx}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                isDone
                  ? 'bg-emerald-500'
                  : isCurrent
                  ? 'bg-blue-500 animate-pulse'
                  : 'bg-slate-800'
              }`}
              title={`Question ${qNum}`}
            />
          );
        })}
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isAI = msg.role === 'interviewer';

          return (
            <div
              key={msg.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isAI
                  ? 'bg-slate-950/80 border-blue-500/30 text-slate-200'
                  : 'bg-slate-800/80 border-slate-700 text-slate-100 ml-4'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1 rounded-md text-xs ${
                      isAI
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {isAI ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs font-semibold text-white">
                    {isAI ? persona.name : candidateName || 'You'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">
                {msg.content}
              </p>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
};
