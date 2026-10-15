import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Sparkles, Sliders, Radio, UserCheck, AudioLines } from 'lucide-react';
import type { InterviewerPersona } from '../../types/interview';
import { speechService } from '../../services/speech';
import { geminiTtsService } from '../../services/geminiTts';

interface AvatarVideoFeedProps {
  persona: InterviewerPersona;
  isSpeaking: boolean;
  isCandidateSpeaking: boolean;
  isGeneratingResponse: boolean;
}

const GEMINI_VOICES = [
  { id: 'Puck', name: 'Puck (Engaging & Natural Male)', gender: 'male' },
  { id: 'Charon', name: 'Charon (Deep & Calm Bar Raiser Male)', gender: 'male' },
  { id: 'Fenrir', name: 'Fenrir (Authoritative Executive Male)', gender: 'male' },
  { id: 'Aoede', name: 'Aoede (Warm & Natural Female)', gender: 'female' },
  { id: 'Kore', name: 'Kore (Crisp & Professional Female)', gender: 'female' },
];

export const AvatarVideoFeed: React.FC<AvatarVideoFeedProps> = ({
  persona,
  isSpeaking,
  isCandidateSpeaking,
  isGeneratingResponse
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [geminiVoice, setGeminiVoice] = useState<string>(
    () => persona.geminiVoice || geminiTtsService.getGeminiVoiceForPersona(persona)
  );
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync persona default voice
  useEffect(() => {
    if (persona.geminiVoice) {
      setGeminiVoice(persona.geminiVoice);
    }
  }, [persona]);

  // Real-time video state controller: strictly moves ONLY when audio is actively speaking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isSpeaking) {
      // Actively speaking: play the video with natural talking and gesturing
      if (video.currentTime < 0.2 || video.currentTime >= 5.5) {
        video.currentTime = 0.2;
      }
      video.playbackRate = 1.0;
      video.play().catch(() => {});
    } else {
      // Audio finished or silent: immediately pause and freeze on natural listening frame
      video.pause();
      video.currentTime = 0.1;
    }
  }, [isSpeaking]);

  // Handle looping ONLY while actively speaking
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isSpeaking) {
      // While speaking audio is active, loop between active talking frames (0.2s to 5.4s)
      if (video.currentTime >= 5.4) {
        video.currentTime = 0.2;
      }
    } else {
      // Not speaking: ensure video stays paused at the resting frame
      if (!video.paused) {
        video.pause();
      }
      video.currentTime = 0.1;
    }
  };

  const handleTestVoice = async () => {
    setIsTestingVoice(true);
    const apiKey = localStorage.getItem('gemini_api_key') || '';
    await speechService.speak(
      `Hello! I am ${persona.name}. I'm excited to lead your mock technical interview today.`,
      {
        persona: { ...persona, geminiVoice },
        apiKey,
        onEnd: () => setIsTestingVoice(false),
        onError: () => setIsTestingVoice(false)
      }
    );
  };

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between group">
      {/* Real Human Video Stream */}
      <div className="absolute inset-0 z-0 bg-slate-950 overflow-hidden">
        <video
          ref={videoRef}
          src="/avatars/marcus_conference.mp4"
          poster="/avatars/marcus_rest_0.jpg"
          muted
          playsInline
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          className="w-full h-full object-cover transform scale-105 transition-transform duration-700"
        />
        {/* Subtle camera lens vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 pointer-events-none" />
      </div>

      {/* Top Video Overlay HUD */}
      <div className="relative z-10 p-4 flex items-center justify-between bg-gradient-to-b from-slate-950/85 via-slate-950/40 to-transparent">
        <div className="flex items-center gap-2">
          {/* Live HD Video Call Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-semibold tracking-wide backdrop-blur-md shadow-sm">
            <Radio className="w-3.5 h-3.5 animate-pulse text-red-400" />
            <span>HD VIDEO CALL</span>
          </div>

          {/* Gemini Voice Badge */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-medium backdrop-blur-md">
            <AudioLines className="w-3.5 h-3.5 text-cyan-400" />
            <span>Gemini Voice ({geminiVoice})</span>
          </div>
        </div>

        {/* Action buttons on top right */}
        <div className="flex items-center gap-1.5">
          {/* Voice Tuning Button */}
          <button
            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border backdrop-blur-md transition-all flex items-center gap-1.5 shadow-sm ${
              showVoiceSettings
                ? 'bg-blue-600 border-blue-400 text-white'
                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-200'
            }`}
            title="Adjust Gemini Voice"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span>Voice</span>
          </button>

          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(prev => !prev)}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 backdrop-blur-md transition-all"
            title={isMuted ? "Unmute AI audio" : "Mute AI audio"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-slate-200" />}
          </button>
        </div>
      </div>

      {/* Voice Selection Dropdown Drawer */}
      {showVoiceSettings && (
        <div className="absolute top-14 right-4 z-30 w-80 bg-slate-900/95 border border-slate-700 rounded-xl p-4 shadow-2xl backdrop-blur-xl animate-fadeIn space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <AudioLines className="w-4 h-4 text-blue-400" />
              <span>Gemini Voice Synthesis</span>
            </span>
            <button
              onClick={() => setShowVoiceSettings(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Done
            </button>
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 font-medium mb-1">
              Select Gemini Neural Voice
            </label>
            <select
              value={geminiVoice}
              onChange={(e) => setGeminiVoice(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {GEMINI_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleTestVoice}
            disabled={isTestingVoice}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isTestingVoice ? 'Generating Gemini Audio...' : 'Test Gemini Voice'}</span>
          </button>

          <p className="text-[10px] text-slate-400 leading-tight">
            Powered by Google's native Gemini Audio API for real human intonation, natural breathing, and conversational pacing.
          </p>
        </div>
      )}

      {/* Bottom Video Overlay HUD */}
      <div className="relative z-10 p-4 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent flex flex-col gap-2">
        {/* Real-time Status Bubble & Audio Waveform */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSpeaking ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-medium backdrop-blur-md animate-pulse">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                <span>{persona.name} is speaking...</span>
              </div>
            ) : isCandidateSpeaking ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium backdrop-blur-md">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Listening attentively to your answer...</span>
              </div>
            ) : isGeneratingResponse ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-medium backdrop-blur-md">
                <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
                <span>Formulating challenge...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-300 text-xs font-medium backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Ready for your response</span>
              </div>
            )}
          </div>

          {/* Animated audio visualizer bars */}
          {(isSpeaking || isCandidateSpeaking) && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80 backdrop-blur-md">
              <span className={`w-1 rounded-full animate-bounce ${isSpeaking ? 'bg-blue-400' : 'bg-emerald-400'}`} style={{ height: '14px', animationDelay: '0ms' }} />
              <span className={`w-1 rounded-full animate-bounce ${isSpeaking ? 'bg-blue-400' : 'bg-emerald-400'}`} style={{ height: '22px', animationDelay: '150ms' }} />
              <span className={`w-1 rounded-full animate-bounce ${isSpeaking ? 'bg-blue-400' : 'bg-emerald-400'}`} style={{ height: '10px', animationDelay: '300ms' }} />
              <span className={`w-1 rounded-full animate-bounce ${isSpeaking ? 'bg-blue-400' : 'bg-emerald-400'}`} style={{ height: '18px', animationDelay: '450ms' }} />
            </div>
          )}
        </div>

        {/* Name tag and specialty badges */}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-white font-semibold text-lg drop-shadow-sm flex items-center gap-2">
              <span>{persona.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-slate-200 font-normal">
                {persona.companyVibe}
              </span>
            </div>
            <div className="text-slate-300 text-xs mt-0.5">{persona.title}</div>
          </div>

          <div className="hidden md:flex gap-1.5 flex-wrap max-w-xs justify-end">
            {persona.specialtyTags.slice(0, 3).map((tag, i) => (
              <span 
                key={i} 
                className="text-[11px] px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-slate-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
