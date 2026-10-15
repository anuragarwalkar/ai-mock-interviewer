import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  X, 
  Sparkles, 
  Volume2, 
  ArrowRight, 
  CheckCircle2, 
  CornerDownRight
} from 'lucide-react';
import type { InterviewConfig } from '../../types/interview';
import { geminiService } from '../../services/gemini';

interface ShowAnswerModalProps {
  isOpen: boolean;
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  config: InterviewConfig;
  onClose: () => void;
  onExplainAndProceed: () => void;
  onSkipQuestion: () => void;
}

export const ShowAnswerModal: React.FC<ShowAnswerModalProps> = ({
  isOpen,
  questionNumber,
  totalQuestions,
  questionText,
  config,
  onClose,
  onExplainAndProceed,
  onSkipQuestion
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [idealAnswer, setIdealAnswer] = useState<{ answer: string; keyPoints: string[] } | null>(null);

  useEffect(() => {
    if (!isOpen || !questionText) return;

    let isMounted = true;
    setIsLoading(true);
    setIdealAnswer(null);

    geminiService.generateIdealAnswer(questionText, config)
      .then(res => {
        if (isMounted) {
          setIdealAnswer(res);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error('Error fetching ideal answer:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, questionText, config]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/10">
              <Lightbulb className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-base">Ideal Response & Key Concepts</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-semibold">
                  Q{questionNumber} of {totalQuestions}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Review how a senior engineer would answer this question, or ask the interviewer to explain.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Question Box */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs sm:text-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Interviewer's Question:
            </span>
            <p className="text-slate-200 font-medium leading-relaxed italic">
              "{questionText || 'Loading current question...'}"
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
              <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-sm font-medium text-slate-300">
                Synthesizing ideal answer & essential concepts...
              </p>
              <span className="text-xs text-slate-500">
                Tailored for {config.seniority} {config.track}
              </span>
            </div>
          )}

          {/* Answer Loaded */}
          {!isLoading && idealAnswer && (
            <div className="space-y-4">
              {/* Ideal Answer Paragraphs */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Model Answer:</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {idealAnswer.answer}
                </p>
              </div>

              {/* Key Points / Concepts */}
              {idealAnswer.keyPoints && idealAnswer.keyPoints.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <CornerDownRight className="w-3.5 h-3.5 text-blue-400" />
                    <span>Key Takeaways Interviewers Look For:</span>
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {idealAnswer.keyPoints.map((point, idx) => (
                      <div 
                        key={idx} 
                        className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-300 flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent transition-colors"
          >
            I Want to Try Answering
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onSkipQuestion();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <span>Skip Question</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                onExplainAndProceed();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>Let Interviewer Explain & Next</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
