import { UserCheck, Bot } from 'lucide-react';

interface LiveCaptionsProps {
  interviewerText?: string;
  candidateText?: string;
  isInterviewerSpeaking: boolean;
  isCandidateSpeaking: boolean;
  interviewerName: string;
}

export const LiveCaptions: React.FC<LiveCaptionsProps> = ({
  interviewerText,
  candidateText,
  isInterviewerSpeaking,
  isCandidateSpeaking,
  interviewerName
}) => {
  if (!isInterviewerSpeaking && !isCandidateSpeaking && !interviewerText && !candidateText) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pointer-events-none">
      {/* Interviewer Subtitles */}
      {(isInterviewerSpeaking || interviewerText) && (
        <div className="mb-2 p-3.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-blue-500/30 text-white shadow-2xl flex items-start gap-3 transition-all animate-fadeIn">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 mt-0.5 shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider mb-0.5">
              {interviewerName}
            </div>
            <p className="text-sm leading-relaxed text-slate-100 font-normal">
              {interviewerText}
            </p>
          </div>
        </div>
      )}

      {/* Candidate Live Speech Subtitles */}
      {(isCandidateSpeaking || candidateText) && (
        <div className="p-3.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-emerald-500/40 text-white shadow-2xl flex items-start gap-3 transition-all animate-fadeIn">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5 shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-0.5 flex items-center justify-between">
              <span>You (Speaking)</span>
              {isCandidateSpeaking && (
                <span className="text-[10px] text-emerald-400 font-normal animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Transcribing live
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-emerald-100 font-normal">
              {candidateText || 'Listening for your response...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
