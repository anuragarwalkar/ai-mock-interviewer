import React from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Send, 
  PhoneOff, 
  FileText, 
  Subtitles, 
  Keyboard, 
  RotateCcw
} from 'lucide-react';

interface ControlsBarProps {
  isMicActive: boolean;
  isVideoActive: boolean;
  isCaptionsActive: boolean;
  isNotesActive: boolean;
  isTextModeActive: boolean;
  isGeneratingResponse: boolean;
  isInterviewerSpeaking: boolean;
  hasCandidateAnswer: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleCaptions: () => void;
  onToggleNotes: () => void;
  onToggleTextMode: () => void;
  onSubmitAnswer: () => void;
  onRepeatQuestion: () => void;
  onEndInterview: () => void;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  isMicActive,
  isVideoActive,
  isCaptionsActive,
  isNotesActive,
  isTextModeActive,
  isGeneratingResponse,
  isInterviewerSpeaking,
  hasCandidateAnswer,
  onToggleMic,
  onToggleVideo,
  onToggleCaptions,
  onToggleNotes,
  onToggleTextMode,
  onSubmitAnswer,
  onRepeatQuestion,
  onEndInterview
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-3 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
      {/* Media Hardware Toggles */}
      <div className="flex items-center gap-2">
        {/* Mic Toggle */}
        <button
          onClick={onToggleMic}
          disabled={isInterviewerSpeaking || isGeneratingResponse}
          className={`p-3 rounded-xl border flex items-center gap-2 text-sm font-medium transition-all ${
            isMicActive
              ? 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20'
              : 'bg-rose-950/60 hover:bg-rose-900/70 border-rose-800 text-rose-300'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isMicActive ? "Mute Microphone" : "Unmute Microphone"}
        >
          {isMicActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          <span className="hidden sm:inline">{isMicActive ? 'Mute' : 'Unmute'}</span>
        </button>

        {/* Video Toggle */}
        <button
          onClick={onToggleVideo}
          className={`p-3 rounded-xl border flex items-center gap-2 text-sm font-medium transition-all ${
            isVideoActive
              ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              : 'bg-rose-950/60 hover:bg-rose-900/70 border-rose-800 text-rose-300'
          }`}
          title={isVideoActive ? "Turn Off Camera" : "Turn On Camera"}
        >
          {isVideoActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          <span className="hidden sm:inline">{isVideoActive ? 'Camera' : 'No Video'}</span>
        </button>

        {/* Repeat Question */}
        <button
          onClick={onRepeatQuestion}
          disabled={isInterviewerSpeaking || isGeneratingResponse}
          className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all disabled:opacity-40"
          title="Repeat Question"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Action: Done Answering & Submit */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSubmitAnswer}
          disabled={isGeneratingResponse || isInterviewerSpeaking || !hasCandidateAnswer}
          className={`px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2.5 transition-all shadow-lg ${
            hasCandidateAnswer && !isGeneratingResponse && !isInterviewerSpeaking
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/25 animate-pulse'
              : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>{isGeneratingResponse ? 'Analyzing...' : 'Done Answering'}</span>
        </button>
      </div>

      {/* Secondary Toggles & End Call */}
      <div className="flex items-center gap-2">
        {/* Text Mode Toggle */}
        <button
          onClick={onToggleTextMode}
          className={`p-3 rounded-xl border transition-all ${
            isTextModeActive
              ? 'bg-blue-600/30 border-blue-500 text-blue-300'
              : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-400'
          }`}
          title="Toggle text input mode"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Captions Toggle */}
        <button
          onClick={onToggleCaptions}
          className={`p-3 rounded-xl border transition-all ${
            isCaptionsActive
              ? 'bg-blue-600/30 border-blue-500 text-blue-300'
              : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-400'
          }`}
          title="Toggle closed captions"
        >
          <Subtitles className="w-4 h-4" />
        </button>

        {/* Notes/Scratchpad Toggle */}
        <button
          onClick={onToggleNotes}
          className={`p-3 rounded-xl border transition-all ${
            isNotesActive
              ? 'bg-blue-600/30 border-blue-500 text-blue-300'
              : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-400'
          }`}
          title="Toggle interview notes / code pad"
        >
          <FileText className="w-4 h-4" />
        </button>

        {/* End Interview */}
        <button
          onClick={onEndInterview}
          className="p-3 rounded-xl bg-rose-600 hover:bg-rose-500 border border-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 font-medium text-sm"
          title="Finish and generate evaluation scorecard"
        >
          <PhoneOff className="w-4 h-4" />
          <span className="hidden md:inline">End & Grade</span>
        </button>
      </div>
    </div>
  );
};
