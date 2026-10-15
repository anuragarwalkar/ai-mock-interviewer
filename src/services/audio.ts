export interface VisemeState {
  jawOpen: number;       // 0 to 1
  mouthWidth: number;    // 0 to 1
  mouthPucker: number;   // 0 to 1
  eyeBlinkLeft: number;  // 0 to 1 (1 = fully closed)
  eyeBlinkRight: number; // 0 to 1
  eyebrowRaise: number;  // 0 to 1
  headTiltX: number;     // subtle radians
  headTiltY: number;     // subtle radians
  headTiltZ: number;     // subtle radians
  isSpeaking: boolean;
  amplitude: number;     // 0 to 1
}

class AudioService {
  private audioCtx: AudioContext | null = null;
  private currentAmplitude = 0;

  public initAudioContext(): AudioContext | null {
    if (this.audioCtx) return this.audioCtx;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
    return this.audioCtx;
  }

  public getAudioContext(): AudioContext | null {
    return this.audioCtx || this.initAudioContext();
  }

  public startSpeechModulation(_rate: number = 1.0) {
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  public stopSpeechModulation() {
    this.currentAmplitude = 0;
  }

  public setDirectAmplitude(amp: number) {
    this.currentAmplitude = Math.max(0, Math.min(1, amp));
  }

  public connectMicrophone(stream: MediaStream): AnalyserNode | null {
    const ctx = this.getAudioContext();
    if (!ctx) return null;
    try {
      const micSource = ctx.createMediaStreamSource(stream);
      const micAnalyser = ctx.createAnalyser();
      micAnalyser.fftSize = 128;
      micAnalyser.smoothingTimeConstant = 0.6;
      micSource.connect(micAnalyser);
      return micAnalyser;
    } catch (err) {
      console.warn('Failed to connect microphone to Web Audio:', err);
      return null;
    }
  }

  public getVisemeSample(timeSeconds: number, isInterviewSpeaking: boolean): VisemeState {
    let amplitude = 0;

    if (isInterviewSpeaking) {
      const syllableFreq = 4.2;
      const wordPause = Math.sin(timeSeconds * 1.8);
      const syllableMod = Math.max(0, Math.sin(timeSeconds * Math.PI * 2 * syllableFreq));
      const accentMod = 0.5 + 0.5 * Math.sin(timeSeconds * 7.5);
      
      const naturalSyllable = syllableMod * accentMod;
      const pauseGate = wordPause > -0.6 ? 1 : 0.15;
      
      amplitude = naturalSyllable * pauseGate * (0.65 + 0.35 * Math.sin(timeSeconds * 11));
      amplitude = Math.max(0.05, Math.min(1, amplitude));
    } else {
      amplitude = 0;
    }

    this.currentAmplitude += (amplitude - this.currentAmplitude) * 0.25;
    const smoothAmp = this.currentAmplitude;

    const jawOpen = Math.min(1, smoothAmp * 1.15);
    const mouthWidth = 0.35 + 0.35 * Math.sin(timeSeconds * 8) * (smoothAmp > 0.1 ? 1 : 0);
    const mouthPucker = 0.2 * Math.cos(timeSeconds * 6) * smoothAmp;

    const blinkCycle = timeSeconds % 4.2;
    let eyeBlink = 0;
    if (blinkCycle > 3.95 && blinkCycle < 4.15) {
      const progress = (blinkCycle - 3.95) / 0.2;
      eyeBlink = Math.sin(progress * Math.PI);
    }

    const headTiltX = isInterviewSpeaking
      ? Math.sin(timeSeconds * 2.2) * 0.04 + smoothAmp * 0.05
      : Math.sin(timeSeconds * 0.8) * 0.02;
    const headTiltY = Math.sin(timeSeconds * 1.1) * 0.03;
    const headTiltZ = Math.cos(timeSeconds * 0.9) * 0.02;

    const eyebrowRaise = isInterviewSpeaking
      ? 0.2 + 0.25 * Math.sin(timeSeconds * 3.5) * smoothAmp
      : 0.05;

    return {
      jawOpen,
      mouthWidth,
      mouthPucker,
      eyeBlinkLeft: eyeBlink,
      eyeBlinkRight: eyeBlink,
      eyebrowRaise,
      headTiltX,
      headTiltY,
      headTiltZ,
      isSpeaking: isInterviewSpeaking && smoothAmp > 0.08,
      amplitude: smoothAmp
    };
  }
}

export const audioService = new AudioService();
