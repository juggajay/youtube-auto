// Voice Node Types

export interface VoicePronunciationEntry {
  word: string;
  pronunciation: string; // IPA or phonetic
}

export interface VoiceNodeConfig {
  // Voice Selection
  voiceId: string;
  voiceName: string;
  voicePreviewUrl?: string;
  useClonedVoice: boolean;
  clonedVoiceId?: string;

  // Speech Settings
  speed: number; // 0.5 - 2.0
  stability: number; // 0 - 1
  clarity: number; // 0 - 1
  styleExaggeration: number; // 0 - 1

  // Pronunciation
  pronunciationDict: VoicePronunciationEntry[];

  // Output
  format: 'mp3' | 'wav' | 'ogg';
  sampleRate: 22050 | 44100 | 48000;
  chunkByParagraph: boolean;
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  preview_url: string;
  category: string;
  labels: Record<string, string>;
}

export const DEFAULT_VOICE_CONFIG: VoiceNodeConfig = {
  voiceId: '',
  voiceName: '',
  voicePreviewUrl: undefined,
  useClonedVoice: false,
  clonedVoiceId: undefined,
  speed: 1.0,
  stability: 0.5,
  clarity: 0.75,
  styleExaggeration: 0.3,
  pronunciationDict: [],
  format: 'mp3',
  sampleRate: 44100,
  chunkByParagraph: false,
};
