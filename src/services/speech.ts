import { audioService } from './audio';
import { geminiTtsService } from './geminiTts';
import type { InterviewerPersona } from '../types/interview';

interface IWindowSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

class SpeechService {
  private recognition: any = null;
  private isListening = false;
  private isSpeaking = false;
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoiceName: string | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.selectedVoiceName = localStorage.getItem('selected_interview_voice') || null;
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  private loadVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length > 0) {
        this.voices = allVoices;
      }
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    if (this.voices.length === 0) {
      this.voices = window.speechSynthesis.getVoices();
    }
    return this.voices;
  }

  public getEnglishVoices(): SpeechSynthesisVoice[] {
    const all = this.getAvailableVoices();
    const english = all.filter(v => v.lang.startsWith('en'));
    return english.sort((a, b) => {
      const score = (v: SpeechSynthesisVoice) => {
        const name = v.name.toLowerCase();
        if (name.includes('natural') || name.includes('online')) return 50;
        if (name.includes('enhanced') || name.includes('premium')) return 40;
        if (name.includes('google')) return 35;
        if (name.includes('samantha') || name.includes('daniel') || name.includes('victoria') || name.includes('alex')) return 30;
        if (name.includes('compact')) return -10;
        return 10;
      };
      return score(b) - score(a);
    });
  }

  public setSelectedVoice(voiceName: string | null) {
    this.selectedVoiceName = voiceName;
    if (voiceName) {
      localStorage.setItem('selected_interview_voice', voiceName);
    } else {
      localStorage.removeItem('selected_interview_voice');
    }
  }

  public getSelectedVoiceName(): string | null {
    return this.selectedVoiceName;
  }

  public getBestVoiceForPersona(persona?: InterviewerPersona): SpeechSynthesisVoice | undefined {
    const englishVoices = this.getEnglishVoices();
    if (englishVoices.length === 0) return undefined;

    if (this.selectedVoiceName) {
      const userVoice = englishVoices.find(v => v.name === this.selectedVoiceName);
      if (userVoice) return userVoice;
    }

    if (persona?.voiceOptions && persona.voiceOptions.length > 0) {
      for (const pref of persona.voiceOptions) {
        const match = englishVoices.find(v => 
          v.name.toLowerCase().includes(pref.toLowerCase())
        );
        if (match) return match;
      }
    }

    if (persona?.voiceGender === 'female') {
      const female = englishVoices.find(v => 
        /samantha|victoria|karen|serena|ava|zoe|fiona|female|google uk english female/i.test(v.name)
      );
      if (female) return female;
    } else {
      const male = englishVoices.find(v => 
        /daniel|oliver|alex|tom|george|david|male|google uk english male|google us english/i.test(v.name)
      );
      if (male) return male;
    }

    return englishVoices[0];
  }

  /**
   * Speak interviewer text with authentic Gemini TTS or local fallback
   */
  public async speak(
    text: string,
    options: {
      pitch?: number;
      rate?: number;
      persona?: InterviewerPersona;
      apiKey?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): Promise<void> {
    this.stopSpeaking();

    const apiKey = options.apiKey || localStorage.getItem('gemini_api_key') || '';

    // 1. Prioritize Gemini Native TTS API for 100% real human-like voice
    if (apiKey) {
      const voiceName = geminiTtsService.getGeminiVoiceForPersona(options.persona);
      try {
        const audioBuffer = await geminiTtsService.synthesizeSpeech(text, apiKey, voiceName);
        if (audioBuffer) {
          this.isSpeaking = true;
          await geminiTtsService.playAudioBuffer(
            audioBuffer,
            () => {
              this.isSpeaking = true;
              options.onStart?.();
            },
            () => {
              this.isSpeaking = false;
              options.onEnd?.();
            }
          );
          return;
        }
      } catch (err) {
        console.warn('Gemini TTS failed, falling back to local speech synthesis:', err);
      }
    }

    // 2. Fallback to high-quality browser SpeechSynthesis
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        options.onStart?.();
        setTimeout(() => {
          options.onEnd?.();
          resolve();
        }, 2000);
        return;
      }

      const cleanedText = text
        .replace(/[*_#`~[\]]/g, '')
        .replace(/\n+/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanedText);

      utterance.rate = options.rate ?? options.persona?.voiceRate ?? 0.98;
      utterance.pitch = options.pitch ?? options.persona?.voicePitch ?? 1.0;

      const chosenVoice = this.getBestVoiceForPersona(options.persona);
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        audioService.startSpeechModulation(utterance.rate);
        options.onStart?.();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        audioService.stopSpeechModulation();
        options.onEnd?.();
        resolve();
      };

      utterance.onerror = (e) => {
        this.isSpeaking = false;
        audioService.stopSpeechModulation();
        options.onError?.(e);
        resolve();
      };

      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 50);
    });
  }

  public stopSpeaking() {
    geminiTtsService.stop();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    audioService.stopSpeechModulation();
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking || geminiTtsService.getIsPlaying();
  }

  public isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as IWindowSpeech;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  public startListening(
    onTranscript: (transcript: string, isFinal: boolean) => void,
    onError?: (error: any) => void
  ): boolean {
    if (!this.isSpeechRecognitionSupported()) {
      onError?.(new Error('Speech recognition is not supported in this browser. Please use Chrome/Edge or type your answers.'));
      return false;
    }

    if (this.isListening) return true;

    const win = window as IWindowSpeech;
    const SpeechRecClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    try {
      this.recognition = new SpeechRecClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        if (finalTranscript) {
          onTranscript(finalTranscript.trim(), true);
        } else if (interimTranscript) {
          onTranscript(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') return;
        console.warn('SpeechRecognition error:', event.error);
        onError?.(event.error);
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {
            // Already active
          }
        }
      };

      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (err) {
      console.error('Failed to start SpeechRecognition:', err);
      onError?.(err);
      this.isListening = false;
      return false;
    }
  }

  public stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore
      }
      this.recognition = null;
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechService = new SpeechService();
