import { audioService } from './audio';
import type { InterviewerPersona } from '../types/interview';

export class GeminiTtsService {
  private currentSourceNode: AudioBufferSourceNode | null = null;
  private isPlaying = false;

  /**
   * Map persona to Gemini prebuilt neural voice:
   * Charon (deep & calm bar raiser male), Puck (engaging natural male), Fenrir (authoritative male)
   */
  public getGeminiVoiceForPersona(persona?: InterviewerPersona): string {
    if (!persona) return 'Charon';
    if (persona.geminiVoice) return persona.geminiVoice;
    return persona.voiceGender === 'female' ? 'Aoede' : 'Charon';
  }

  /**
   * Synthesize real human voice audio using Gemini Audio API
   */
  public async synthesizeSpeech(
    text: string,
    apiKey: string,
    voiceName: string = 'Charon'
  ): Promise<AudioBuffer | null> {
    if (!apiKey || apiKey.trim().length === 0) {
      return null;
    }

    const cleanText = text
      .replace(/[*_#`~[\]]/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    // Priority models: 
    // 1. gemini-3.1-flash-tts-preview (Dedicated high-fidelity human speech model)
    // 2. gemini-2.5-flash (Standard audio model)
    // 3. gemini-3.8-flash
    const modelsToTry = [
      'gemini-3.1-flash-tts-preview',
      'gemini-2.5-flash',
      'gemini-3.8-flash'
    ];

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
        
        const payload = {
          contents: [
            {
              parts: [
                {
                  text: cleanText
                }
              ]
            }
          ],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceName || 'Charon'
                }
              }
            }
          }
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.warn(`Gemini TTS attempt on ${model} returned ${res.status}:`, errData);
          continue;
        }

        const data = await res.json();
        const part = data?.candidates?.[0]?.content?.parts?.[0];
        const inlineData = part?.inlineData;

        if (!inlineData?.data) {
          continue;
        }

        const audioCtx = audioService.getAudioContext();
        if (!audioCtx) return null;

        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        const base64Data = inlineData.data;
        const mimeType = inlineData.mimeType || 'audio/pcm;rate=24000';

        // Decode PCM or WAV
        if (mimeType.includes('pcm') || mimeType.includes('rate=24000')) {
          const binary = atob(base64Data);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const int16Array = new Int16Array(bytes.buffer);
          const float32Array = new Float32Array(int16Array.length);
          for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768.0;
          }
          const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
          audioBuffer.copyToChannel(float32Array, 0);
          return audioBuffer;
        } else {
          // Standard audio decoding (WAV / MP3)
          const binary = atob(base64Data);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer.slice(0));
          return audioBuffer;
        }
      } catch (err) {
        console.warn(`Gemini TTS error on model ${model}:`, err);
      }
    }

    return null;
  }

  /**
   * Play the synthesized Gemini AudioBuffer through Web Audio with real-time analysis
   */
  public playAudioBuffer(
    buffer: AudioBuffer,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    return new Promise((resolve) => {
      this.stop();

      const audioCtx = audioService.getAudioContext();
      if (!audioCtx) {
        onEnd?.();
        resolve();
        return;
      }

      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }

      const sourceNode = audioCtx.createBufferSource();
      sourceNode.buffer = buffer;
      this.currentSourceNode = sourceNode;

      sourceNode.connect(audioCtx.destination);
      this.isPlaying = true;
      audioService.startSpeechModulation();
      onStart?.();

      sourceNode.onended = () => {
        this.isPlaying = false;
        audioService.stopSpeechModulation();
        this.currentSourceNode = null;
        onEnd?.();
        resolve();
      };

      sourceNode.start(0);
    });
  }

  public stop() {
    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      this.currentSourceNode = null;
    }
    this.isPlaying = false;
    audioService.stopSpeechModulation();
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const geminiTtsService = new GeminiTtsService();
