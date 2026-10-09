export type GeminiVoiceName = "Kore" | "Puck" | "Fenrir" | "Zephyr" | "Charon";

export interface VoiceOption {
  id: GeminiVoiceName;
  hindiName: string;
  englishName: string;
  gender: "female" | "male";
  tone: string;
  roleHindi?: string;
  samplePhrase?: string;
  description: string;
  bestFor: string;
  avatarColor: string;
}

export interface SpeechChunk {
  id: string;
  index: number;
  chapterTitle?: string;
  text: string;
  wordCount: number;
  estimatedDurationSec: number;
  status: "idle" | "synthesizing" | "ready" | "error";
  audioBase64?: string;
  actualDurationSec?: number;
  errorMessage?: string;
}

export interface ScriptChapter {
  chapterNumber: number;
  title: string;
  paragraphs: string[];
}

export interface GeneratedScript {
  title: string;
  estimatedMinutes: number;
  wordCount?: number;
  summary?: string;
  chapters: ScriptChapter[];
}

export interface DialogueLine {
  id: string;
  speaker: string;
  text: string;
  style?: string;
}
