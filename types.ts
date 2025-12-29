export enum VoiceName {
  Charon = 'Charon', // Verified MALE (Deep, resonant)
  Fenrir = 'Fenrir', // Verified MALE (Rugged, strong)
  Puck = 'Puck',     // Verified MALE (Bright, energetic)
  Zephyr = 'Zephyr', // Verified MALE (Calm, neutral)
  Kore = 'Kore',     // Verified FEMALE
  Aoede = 'Aoede'    // Verified FEMALE
}

export type SpeechStyle = 'Normal' | 'Emotional' | 'Storytelling' | 'News Style';

export interface Voice {
  readonly id: string;
  readonly name: string;
  readonly geminiVoice: VoiceName;
  readonly gender: 'Male' | 'Female';
  readonly description: string;
  readonly persona: string; // Used for system instruction modulation
  readonly tags: string[];
  readonly isRecommended?: boolean;
}

export interface TTSHistoryItem {
  id: string;
  text: string;
  voiceName: string;
  timestamp: number;
  audioBlob?: Blob;
  duration?: number;
  style?: SpeechStyle;
}