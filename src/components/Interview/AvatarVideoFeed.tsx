import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Sparkles, Box, Camera, Radio } from 'lucide-react';
import type { InterviewerPersona } from '../../types/interview';
import { ThreeAvatar } from './ThreeAvatar';
import { audioService } from '../../services/audio';

interface AvatarVideoFeedProps {
  persona: InterviewerPersona;
  isSpeaking: boolean;
  isCandidateSpeaking: boolean;
  isGeneratingResponse: boolean;
}

export const AvatarVideoFeed: React.FC<AvatarVideoFeedProps> = ({
  persona,
  isSpeaking,
  isCandidateSpeaking,
  isGeneratingResponse
}) => {
  const [renderMode, setRenderMode] = useState<'3d' | 'portrait'>('3d');
  const [isMuted, setIsMuted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // High-performance 2D Canvas Portrait Animation when in 'portrait' mode
  useEffect(() => {
    if (renderMode !== 'portrait') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let startTime = performance.now();

    const render = (time: number) => {
      animId = requestAnimationFrame(render);
      const elapsedSeconds = (time - startTime) / 1000;
      const viseme = audioService.getVisemeSample(elapsedSeconds, isSpeaking);

      const width = canvas.width = canvas.parentElement?.clientWidth || 500;
      const height = canvas.height = canvas.parentElement?.clientHeight || 400;

      // Clear & Background gradient
      const bgGradient = ctx.createRadialGradient(
        width / 2, height * 0.4, 40,
        width / 2, height / 2, Math.max(width, height) * 0.8
      );
      bgGradient.addColorStop(0, '#151d2f');
      bgGradient.addColorStop(0.6, '#0b0f19');
      bgGradient.addColorStop(1, '#05080e');

      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Studio ambient circle glow with persona theme
      ctx.save();
      ctx.beginPath();
      ctx.arc(width / 2, height * 0.42, 140, 0, Math.PI * 2);
      ctx.fillStyle = (persona.primaryColor || '#0071e3') + '22';
      ctx.filter = 'blur(45px)';
      ctx.fill();
      ctx.restore();

      // Portrait Center with subtle tilt & breathing
      const centerX = width / 2 + Math.sin(elapsedSeconds * 1.2) * 4;
      const centerY = height * 0.45 + Math.sin(elapsedSeconds * 1.8) * 3;

      // Draw Stylized Silhouette & Face
      // Torso & Shoulders
      ctx.save();
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + 180, 160, 90, 0, 0, Math.PI * 2);
      ctx.fill();

      // Collar
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(centerX - 35, centerY + 105);
      ctx.lineTo(centerX, centerY + 145);
      ctx.lineTo(centerX + 35, centerY + 105);
      ctx.closePath();
      ctx.fill();

      // Neck
      ctx.fillStyle = persona.voiceGender === 'female' ? '#f5d0ba' : '#e0ac88';
      ctx.fillRect(centerX - 24, centerY + 50, 48, 60);

      // Head Shape
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 75, 95, viseme.headTiltZ * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = persona.voiceGender === 'female' ? '#ffdfcb' : '#ecc19e';
      ctx.fill();

      // Hair
      ctx.fillStyle = persona.voiceGender === 'female' ? '#261b17' : '#1e1b18';
      ctx.beginPath();
      if (persona.voiceGender === 'female') {
        ctx.arc(centerX, centerY - 25, 84, Math.PI * 0.85, Math.PI * 2.15);
        ctx.bezierCurveTo(centerX + 85, centerY + 80, centerX + 75, centerY + 120, centerX + 60, centerY + 140);
        ctx.lineTo(centerX - 60, centerY + 140);
        ctx.bezierCurveTo(centerX - 75, centerY + 120, centerX - 85, centerY + 80, centerX - 80, centerY - 25);
      } else {
        ctx.arc(centerX, centerY - 22, 80, Math.PI * 0.9, Math.PI * 2.1);
        ctx.lineTo(centerX + 75, centerY - 10);
        ctx.lineTo(centerX - 75, centerY - 10);
      }
      ctx.fill();

      // Eyes & Blinking
      const eyeY = centerY - 5;
      const eyeSpacing = 28;
      const blinkProgress = viseme.eyeBlinkLeft;

      // Left Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(centerX - eyeSpacing, eyeY, 11, Math.max(1, 7 * (1 - blinkProgress)), 0, 0, Math.PI * 2);
      ctx.fill();

      // Right Eye
      ctx.beginPath();
      ctx.ellipse(centerX + eyeSpacing, eyeY, 11, Math.max(1, 7 * (1 - blinkProgress)), 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupils (looking slightly forward/attentive)
      if (blinkProgress < 0.8) {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(centerX - eyeSpacing, eyeY, 5, 0, Math.PI * 2);
        ctx.arc(centerX + eyeSpacing, eyeY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Eye glint
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX - eyeSpacing + 1.5, eyeY - 1.5, 1.8, 0, Math.PI * 2);
        ctx.arc(centerX + eyeSpacing + 1.5, eyeY - 1.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Eyebrows
      ctx.strokeStyle = '#2d221c';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      const eyebrowLift = viseme.eyebrowRaise * 4;
      ctx.moveTo(centerX - 40, eyeY - 16 - eyebrowLift);
      ctx.quadraticCurveTo(centerX - 28, eyeY - 21 - eyebrowLift, centerX - 14, eyeY - 17 - eyebrowLift);
      ctx.moveTo(centerX + 14, eyeY - 17 - eyebrowLift);
      ctx.quadraticCurveTo(centerX + 28, eyeY - 21 - eyebrowLift, centerX + 40, eyeY - 16 - eyebrowLift);
      ctx.stroke();

      // Nose
      ctx.strokeStyle = '#c48f6c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, eyeY + 2);
      ctx.lineTo(centerX + 2, eyeY + 24);
      ctx.lineTo(centerX - 5, eyeY + 26);
      ctx.stroke();

      // Mouth - Real-time Lip Sync from audio amplitude & viseme
      const mouthY = centerY + 48;
      const mouthOpen = viseme.jawOpen * 20;
      const mouthWidth = 26 + viseme.mouthWidth * 10;

      if (viseme.isSpeaking && mouthOpen > 2) {
        // Open mouth cavity
        ctx.fillStyle = '#3a0d14';
        ctx.beginPath();
        ctx.ellipse(centerX, mouthY + mouthOpen * 0.3, mouthWidth * 0.7, mouthOpen, 0, 0, Math.PI * 2);
        ctx.fill();

        // Teeth hint
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(centerX - mouthWidth * 0.45, mouthY - 1, mouthWidth * 0.9, Math.min(4, mouthOpen * 0.4));
      }

      // Lips
      ctx.strokeStyle = '#b45362';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX - mouthWidth * 0.7, mouthY);
      ctx.quadraticCurveTo(centerX, mouthY - 3, centerX + mouthWidth * 0.7, mouthY);
      if (mouthOpen > 2) {
        ctx.quadraticCurveTo(centerX, mouthY + mouthOpen * 0.6, centerX - mouthWidth * 0.7, mouthY);
      }
      ctx.stroke();

      ctx.restore();

      // Audio waveform equalizer HUD at bottom
      const waveBarCount = 32;
      const waveStartX = width * 0.15;
      const waveWidth = width * 0.7;
      const barSpacing = waveWidth / waveBarCount;

      ctx.fillStyle = (persona.primaryColor || '#0071e3') + 'cc';
      for (let i = 0; i < waveBarCount; i++) {
        let barHeight = 4;
        if (isSpeaking) {
          barHeight = 4 + Math.abs(Math.sin(elapsedSeconds * 9 + i * 0.45)) * viseme.amplitude * 34;
        } else if (isCandidateSpeaking) {
          barHeight = 4 + Math.abs(Math.sin(elapsedSeconds * 7 + i * 0.35)) * 18;
        }

        const barX = waveStartX + i * barSpacing;
        const barY = height - 24 - barHeight / 2;
        ctx.beginPath();
        ctx.roundRect(barX, barY, Math.max(2, barSpacing - 3), barHeight, 2);
        ctx.fill();
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [renderMode, isSpeaking, isCandidateSpeaking, persona]);

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between">
      {/* 3D or 2D Render Canvas */}
      <div className="absolute inset-0 z-0">
        {renderMode === '3d' ? (
          <ThreeAvatar 
            persona={persona} 
            isSpeaking={isSpeaking} 
            isCandidateSpeaking={isCandidateSpeaking} 
          />
        ) : (
          <canvas ref={canvasRef} className="w-full h-full block" />
        )}
      </div>

      {/* Top Video Overlay HUD */}
      <div className="relative z-10 p-4 flex items-center justify-between bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-transparent">
        <div className="flex items-center gap-2">
          {/* Live Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-semibold tracking-wide backdrop-blur-md">
            <Radio className="w-3.5 h-3.5 animate-pulse text-red-400" />
            <span>LIVE INTERVIEW</span>
          </div>

          {/* Model badge */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/70 border border-slate-700/60 text-slate-300 text-xs font-medium backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Local Voice Engine</span>
          </div>
        </div>

        {/* View Mode & Mute Switchers */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setRenderMode(prev => prev === '3d' ? 'portrait' : '3d')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-200 backdrop-blur-md transition-all flex items-center gap-1.5 shadow-sm"
            title="Toggle between 3D Studio Mesh and Portrait Mode"
          >
            {renderMode === '3d' ? (
              <>
                <Box className="w-3.5 h-3.5 text-blue-400" />
                <span>3D Studio</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>2D Portrait</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsMuted(prev => !prev)}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-200 backdrop-blur-md transition-all"
            title={isMuted ? "Unmute AI audio" : "Mute AI audio"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
          </button>
        </div>
      </div>

      {/* Bottom Video Overlay HUD */}
      <div className="relative z-10 p-4 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent flex flex-col gap-2">
        {/* Status Bubble */}
        <div className="flex items-center gap-2">
          {isSpeaking ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-medium backdrop-blur-md animate-pulse">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <span>Speaking...</span>
            </div>
          ) : isCandidateSpeaking ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Listening attentively...</span>
            </div>
          ) : isGeneratingResponse ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-medium backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
              <span>Analyzing answer & formulating question...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-slate-400 text-xs font-medium backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>Ready for your answer</span>
            </div>
          )}
        </div>

        {/* Name tag and specialty */}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-white font-semibold text-lg drop-shadow-sm flex items-center gap-2">
              <span>{persona.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300 font-normal">
                {persona.companyVibe}
              </span>
            </div>
            <div className="text-slate-400 text-xs mt-0.5">{persona.title}</div>
          </div>

          <div className="hidden md:flex gap-1.5 flex-wrap max-w-xs justify-end">
            {persona.specialtyTags.slice(0, 3).map((tag, i) => (
              <span 
                key={i} 
                className="text-[11px] px-2 py-0.5 rounded bg-slate-800/70 border border-slate-700/60 text-slate-300"
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
