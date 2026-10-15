import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, User } from 'lucide-react';

interface CandidateVideoFeedProps {
  candidateName: string;
  targetRole: string;
  isMicActive: boolean;
  isSpeaking: boolean;
  isVideoEnabled: boolean;
  onToggleVideo: (enabled: boolean) => void;
}

export const CandidateVideoFeed: React.FC<CandidateVideoFeedProps> = ({
  candidateName,
  targetRole,
  isMicActive,
  isSpeaking,
  isVideoEnabled,
  onToggleVideo
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCameraError, setHasCameraError] = useState(false);

  useEffect(() => {
    if (isVideoEnabled) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setHasCameraError(false);
        })
        .catch((err) => {
          console.warn('Camera access denied or unavailable:', err);
          setHasCameraError(true);
          onToggleVideo(false);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isVideoEnabled]);

  return (
    <div className="relative w-full h-full min-h-[220px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex flex-col justify-between">
      {/* Video stream or fallback placeholder */}
      {isVideoEnabled && !hasCameraError ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-slate-500">
          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700/80 mb-3 shadow-inner">
            <User className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-xs font-medium text-slate-400">
            {hasCameraError ? 'Camera unavailable' : 'Camera turned off'}
          </p>
          <button
            onClick={() => onToggleVideo(true)}
            className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline font-medium"
          >
            Turn on camera
          </button>
        </div>
      )}

      {/* Top overlay badges */}
      <div className="relative z-10 p-3 flex items-center justify-between bg-gradient-to-b from-slate-950/70 to-transparent">
        <div className="flex items-center gap-2">
          {/* Mic status badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md transition-colors ${
              isMicActive
                ? isSpeaking
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                  : 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
            }`}
          >
            {isMicActive ? (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>{isSpeaking ? 'Speaking' : 'Mic Active'}</span>
              </>
            ) : (
              <>
                <MicOff className="w-3.5 h-3.5" />
                <span>Mic Muted</span>
              </>
            )}
          </div>
        </div>

        {/* Camera toggle button */}
        <button
          onClick={() => onToggleVideo(!isVideoEnabled)}
          className={`p-1.5 rounded-lg border backdrop-blur-md transition-all ${
            isVideoEnabled
              ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200'
              : 'bg-rose-900/40 hover:bg-rose-800/50 border-rose-700/60 text-rose-300'
          }`}
          title={isVideoEnabled ? 'Turn camera off' : 'Turn camera on'}
        >
          {isVideoEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom candidate info tag */}
      <div className="relative z-10 p-3 bg-gradient-to-t from-slate-950/90 to-transparent flex items-center justify-between">
        <div>
          <div className="text-white text-sm font-medium flex items-center gap-2">
            <span>{candidateName || 'Candidate'}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-500/30 text-blue-300">
              You
            </span>
          </div>
          <div className="text-slate-400 text-[11px] truncate max-w-[200px]">{targetRole}</div>
        </div>

        {/* Live speech level animation */}
        {isSpeaking && (
          <div className="flex items-center gap-1">
            <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>
    </div>
  );
};
