import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { 
  InterviewConfig, 
  InterviewMessage, 
  EvaluationReport 
} from '../../types/interview';
import { INTERVIEWER_PERSONAS } from '../../data/personas';
import { geminiService } from '../../services/gemini';
import { speechService } from '../../services/speech';
import { AvatarVideoFeed } from './AvatarVideoFeed';
import { CandidateVideoFeed } from './CandidateVideoFeed';
import { ControlsBar } from './ControlsBar';
import { LiveCaptions } from './LiveCaptions';
import { TranscriptSidebar } from './TranscriptSidebar';
import { NotesPad } from './NotesPad';
import { TextAnswerModal } from './TextAnswerModal';
import { ListCollapse, StickyNote } from 'lucide-react';

interface InterviewRoomProps {
  config: InterviewConfig;
  onFinishInterview: (report: EvaluationReport) => void;
  onCancel: () => void;
}

export const InterviewRoom: React.FC<InterviewRoomProps> = ({
  config,
  onFinishInterview,
  onCancel: _onCancel
}) => {
  const persona = INTERVIEWER_PERSONAS.find(p => p.id === config.interviewerId) || INTERVIEWER_PERSONAS[0];

  const totalQuestions = config.format.includes('3') ? 3 : config.format.includes('8') ? 8 : 5;

  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);
  const [isCandidateSpeaking, setIsCandidateSpeaking] = useState(false);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);

  // Candidate media states
  const [isMicActive, setIsMicActive] = useState(true);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [candidateDraftText, setCandidateDraftText] = useState('');
  const [lastInterviewerSpokenText, setLastInterviewerSpokenText] = useState('');

  // UI Drawer / modal states
  const [isCaptionsActive, setIsCaptionsActive] = useState(true);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);

  const silenceTimeoutRef = useRef<any>(null);

  // Helper to speak interviewer text
  const speakInterviewer = useCallback((text: string) => {
    setLastInterviewerSpokenText(text);
    setIsInterviewerSpeaking(true);

    speechService.speak(text, {
      pitch: persona.voicePitch,
      rate: persona.voiceRate,
      voiceGender: persona.voiceGender,
      preferredVoiceName: persona.speechVoiceName,
      onStart: () => {
        setIsInterviewerSpeaking(true);
      },
      onEnd: () => {
        setIsInterviewerSpeaking(false);
        // Resume listening for candidate
        if (isMicActive) {
          startListeningCandidate();
        }
      },
      onError: () => {
        setIsInterviewerSpeaking(false);
        if (isMicActive) {
          startListeningCandidate();
        }
      }
    });
  }, [persona, isMicActive]);

  // Candidate Speech-to-Text Listener
  const startListeningCandidate = useCallback(() => {
    speechService.startListening(
      (transcript, isFinal) => {
        setIsCandidateSpeaking(true);
        setCandidateDraftText((prev) => {
          if (isFinal) {
            return (prev ? prev + ' ' : '') + transcript;
          }
          return prev ? prev + ' ' + transcript : transcript;
        });

        // Clear silence timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        silenceTimeoutRef.current = setTimeout(() => {
          setIsCandidateSpeaking(false);
        }, 1200);
      },
      (err) => {
        console.warn('Speech recognition warning:', err);
      }
    );
  }, []);

  // Initialize opening interview question on mount
  useEffect(() => {
    let isCancelled = false;

    const startInterviewSession = async () => {
      setIsGeneratingResponse(true);
      try {
        const openingQuestion = await geminiService.generateOpeningQuestion(config);
        if (isCancelled) return;

        const initialMsg: InterviewMessage = {
          id: `msg-${Date.now()}`,
          role: 'interviewer',
          content: openingQuestion,
          timestamp: Date.now(),
          questionNumber: 1,
          isCurrentQuestion: true
        };

        setMessages([initialMsg]);
        setIsGeneratingResponse(false);

        // Speak the opening question
        speakInterviewer(openingQuestion);
      } catch (err) {
        console.error('Failed to initiate opening turn:', err);
        setIsGeneratingResponse(false);
      }
    };

    startInterviewSession();

    return () => {
      isCancelled = true;
      speechService.stopSpeaking();
      speechService.stopListening();
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  // Toggle Microphone
  const handleToggleMic = () => {
    if (isMicActive) {
      speechService.stopListening();
      setIsMicActive(false);
      setIsCandidateSpeaking(false);
    } else {
      setIsMicActive(true);
      if (!isInterviewerSpeaking && !isGeneratingResponse) {
        startListeningCandidate();
      }
    }
  };

  // Submit Candidate's Answer
  const handleSubmitAnswer = async () => {
    if (!candidateDraftText.trim() || isGeneratingResponse || isInterviewerSpeaking) return;

    speechService.stopListening();
    setIsCandidateSpeaking(false);

    const answerText = candidateDraftText.trim();
    setCandidateDraftText('');

    const candidateMsg: InterviewMessage = {
      id: `msg-${Date.now()}`,
      role: 'candidate',
      content: answerText,
      timestamp: Date.now(),
      questionNumber: currentQuestion
    };

    const updatedHistory = [...messages, candidateMsg];
    setMessages(updatedHistory);
    setIsGeneratingResponse(true);

    try {
      const nextTurn = await geminiService.generateNextTurn(
        updatedHistory,
        config,
        currentQuestion,
        totalQuestions
      );

      const aiMsg: InterviewMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'interviewer',
        content: nextTurn.responseText,
        timestamp: Date.now() + 1,
        questionNumber: currentQuestion + 1,
        isCurrentQuestion: !nextTurn.isClosing
      };

      const completeHistory = [...updatedHistory, aiMsg];
      setMessages(completeHistory);
      setIsGeneratingResponse(false);

      if (nextTurn.isClosing || currentQuestion >= totalQuestions) {
        // Speak closing then evaluate
        setLastInterviewerSpokenText(nextTurn.responseText);
        setIsInterviewerSpeaking(true);
        await speechService.speak(nextTurn.responseText, {
          pitch: persona.voicePitch,
          rate: persona.voiceRate,
          voiceGender: persona.voiceGender,
          preferredVoiceName: persona.speechVoiceName
        });
        setIsInterviewerSpeaking(false);

        // Generate final evaluation
        triggerFinalEvaluation(completeHistory);
      } else {
        setCurrentQuestion(prev => prev + 1);
        speakInterviewer(nextTurn.responseText);
      }
    } catch (err) {
      console.error('Error generating next turn:', err);
      setIsGeneratingResponse(false);
      if (isMicActive) startListeningCandidate();
    }
  };

  // Trigger evaluation
  const triggerFinalEvaluation = async (historyToEval?: InterviewMessage[]) => {
    speechService.stopSpeaking();
    speechService.stopListening();
    setIsGeneratingResponse(true);

    const evalHistory = historyToEval || messages;
    const report = await geminiService.generateEvaluationReport(evalHistory, config);
    setIsGeneratingResponse(false);
    onFinishInterview(report);
  };

  // Repeat current question
  const handleRepeatQuestion = () => {
    const lastQuestion = messages.filter(m => m.role === 'interviewer').pop();
    if (lastQuestion) {
      speakInterviewer(lastQuestion.content);
    }
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* Top Bar */}
      <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
            AI
          </div>
          <div>
            <div className="text-white text-sm font-semibold flex items-center gap-2">
              <span>{config.track} Mock Interview</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                {config.seniority}
              </span>
            </div>
            <div className="text-slate-400 text-xs">
              Interviewer: {persona.name} ({persona.companyVibe})
            </div>
          </div>
        </div>

        {/* Question Counter Pill & Sidebar Buttons */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            Question {Math.min(currentQuestion, totalQuestions)} of {totalQuestions}
          </div>

          <button
            onClick={() => setIsTranscriptOpen(prev => !prev)}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
              isTranscriptOpen 
                ? 'bg-blue-600/30 border-blue-500 text-blue-300' 
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title="Toggle Transcript Drawer"
          >
            <ListCollapse className="w-4 h-4" />
            <span className="hidden sm:inline">Transcript</span>
          </button>

          <button
            onClick={() => setIsNotesOpen(prev => !prev)}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
              isNotesOpen 
                ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300' 
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title="Toggle Scratchpad / Code Pad"
          >
            <StickyNote className="w-4 h-4" />
            <span className="hidden sm:inline">Notes</span>
          </button>
        </div>
      </div>

      {/* Main Video Arena */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col p-4 md:p-6 gap-4 relative overflow-hidden">
          {/* Video Split Grid: Interviewer Video Feed (Main) & Candidate (Picture in Picture or Grid) */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 h-full min-h-0">
            {/* Interviewer Video - 2 columns on desktop */}
            <div className="md:col-span-2 h-full min-h-[300px]">
              <AvatarVideoFeed
                persona={persona}
                isSpeaking={isInterviewerSpeaking}
                isCandidateSpeaking={isCandidateSpeaking}
                isGeneratingResponse={isGeneratingResponse}
              />
            </div>

            {/* Candidate Feed & Side HUD - 1 column */}
            <div className="flex flex-col gap-4 h-full">
              <div className="flex-1 min-h-[200px]">
                <CandidateVideoFeed
                  candidateName={config.candidateName}
                  targetRole={`${config.seniority} ${config.track}`}
                  isMicActive={isMicActive}
                  isSpeaking={isCandidateSpeaking}
                  isVideoEnabled={isVideoActive}
                  onToggleVideo={setIsVideoActive}
                />
              </div>

              {/* Quick Resume & Job Context Card */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 hidden md:block">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Customized Context</span>
                  <span className="text-emerald-400">Active</span>
                </div>
                <div className="line-clamp-3 text-slate-400 italic">
                  {config.resumeText 
                    ? `Resume: "${config.resumeText.slice(0, 150)}..."` 
                    : 'Targeting standard competencies and edge cases for this role.'}
                </div>
              </div>
            </div>
          </div>

          {/* Live Captions / Subtitles floating overlay */}
          {isCaptionsActive && (
            <div className="relative z-20">
              <LiveCaptions
                interviewerText={lastInterviewerSpokenText}
                candidateText={candidateDraftText}
                isInterviewerSpeaking={isInterviewerSpeaking}
                isCandidateSpeaking={isCandidateSpeaking}
                interviewerName={persona.name}
              />
            </div>
          )}

          {/* Bottom Floating Controls Bar */}
          <div className="relative z-20 pt-2">
            <ControlsBar
              isMicActive={isMicActive}
              isVideoActive={isVideoActive}
              isCaptionsActive={isCaptionsActive}
              isNotesActive={isNotesOpen}
              isTextModeActive={isTextModalOpen}
              isGeneratingResponse={isGeneratingResponse}
              isInterviewerSpeaking={isInterviewerSpeaking}
              hasCandidateAnswer={candidateDraftText.trim().length > 0}
              onToggleMic={handleToggleMic}
              onToggleVideo={() => setIsVideoActive(prev => !prev)}
              onToggleCaptions={() => setIsCaptionsActive(prev => !prev)}
              onToggleNotes={() => setIsNotesOpen(prev => !prev)}
              onToggleTextMode={() => setIsTextModalOpen(true)}
              onSubmitAnswer={handleSubmitAnswer}
              onRepeatQuestion={handleRepeatQuestion}
              onEndInterview={() => triggerFinalEvaluation()}
            />
          </div>
        </div>

        {/* Sliding Drawers */}
        <TranscriptSidebar
          messages={messages}
          persona={persona}
          candidateName={config.candidateName}
          currentQuestion={currentQuestion}
          totalQuestions={totalQuestions}
          isOpen={isTranscriptOpen}
          onClose={() => setIsTranscriptOpen(false)}
        />

        <NotesPad
          isOpen={isNotesOpen}
          onClose={() => setIsNotesOpen(false)}
        />
      </div>

      {/* Text Modal for typing/editing response */}
      <TextAnswerModal
        isOpen={isTextModalOpen}
        textAnswer={candidateDraftText}
        isGeneratingResponse={isGeneratingResponse}
        onTextChange={setCandidateDraftText}
        onSubmit={handleSubmitAnswer}
        onClose={() => setIsTextModalOpen(false)}
      />
    </div>
  );
};
