import { audioService } from './audio';

// Type definitions for SpeechRecognition if not provided by browser types
interface IWindowSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export interface SpeechVoiceOption {
  name: string;
  lang: string;
  gender?: 'male' | 'female';
}

class SpeechService {
  private recognition: any = null;
  private isListening = false;
  private isSpeaking = false;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  private loadVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices();
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices();
    }
    return this.voices;
  }

  /**
   * Speak interviewer question or statement using SpeechSynthesis
   */
  public speak(
    text: string,
    options: {
      pitch?: number;
      rate?: number;
      voiceGender?: 'male' | 'female';
      preferredVoiceName?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('SpeechSynthesis is not supported in this browser.');
        options.onStart?.();
        setTimeout(() => {
          options.onEnd?.();
          resolve();
        }, 2000);
        return;
      }

      // Stop any existing speech
      this.stopSpeaking();

      const utterance = new SpeechSynthesisUtterance(text);

      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;

      // Select suitable voice
      const voices = this.getAvailableVoices();
      if (voices.length > 0) {
        let chosenVoice: SpeechSynthesisVoice | undefined;

        if (options.preferredVoiceName) {
          chosenVoice = voices.find(v => 
            v.name.toLowerCase().includes(options.preferredVoiceName!.toLowerCase())
          );
        }

        if (!chosenVoice) {
          const englishVoices = voices.filter(v => v.lang.startsWith('en'));
          if (options.voiceGender === 'female') {
            chosenVoice = englishVoices.find(v => 
              /samantha|victoria|karen|zira|google us english|female|fiona/i.test(v.name)
            ) || englishVoices[0];
          } else {
            chosenVoice = englishVoices.find(v => 
              /daniel|alex|george|david|google uk english male|male/i.test(v.name)
            ) || englishVoices[1] || englishVoices[0];
          }
        }

        if (chosenVoice) {
          utterance.voice = chosenVoice;
        }
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        audioService.startSpeechModulation(options.rate || 1.0);
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

      window.speechSynthesis.speak(utterance);
    });
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    audioService.stopSpeechModulation();
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
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

    if (this.isListening) {
      return true;
    }

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
        if (event.error === 'no-speech') {
          return;
        }
        console.warn('SpeechRecognition error:', event.error);
        onError?.(event.error);
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {
            // Already started or blocked
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
