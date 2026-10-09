import { SpeechChunk } from "../types";

/**
 * Counts Hindi words accurately (handling Devanagari characters, spaces, and punctuation)
 */
export function countHindiWords(text: string): number {
  if (!text) return 0;
  const cleaned = text
    .replace(/[।॥,;:!?\(\)\[\]"'\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return 0;
  return cleaned.split(" ").filter(Boolean).length;
}

/**
 * Estimates speech duration in minutes based on average Hindi spoken cadence (~130 words per minute)
 */
export function estimateDurationMinutes(wordCount: number): number {
  if (wordCount <= 0) return 0;
  return Number((wordCount / 130).toFixed(1));
}

/**
 * Splits Hindi text into intelligent, semantic chunks suitable for gemini-3.8-flash-tts
 * (typically 60-110 words per chunk for optimal prosody and quality)
 */
export function splitHindiTextIntoChunks(
  rawText: string,
  targetWordsPerChunk: number = 85
): SpeechChunk[] {
  if (!rawText || !rawText.trim()) return [];

  // Split by double newlines or explicit chapter markers first
  const blocks = rawText
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const rawChunks: { text: string; chapterTitle?: string }[] = [];

  for (const block of blocks) {
    let currentChapterTitle: string | undefined = undefined;
    let contentToProcess = block;

    // Check if block starts with chapter tag like [अध्याय 1: ...] or similar
    const chapterMatch = block.match(/^\[(.*?)\]\s*(.*)/s);
    if (chapterMatch) {
      currentChapterTitle = chapterMatch[1].trim();
      contentToProcess = chapterMatch[2].trim();
    }

    const blockWords = countHindiWords(contentToProcess);

    if (blockWords <= targetWordsPerChunk * 1.35) {
      rawChunks.push({ text: contentToProcess, chapterTitle: currentChapterTitle });
    } else {
      // Split into sentences using Hindi purna viram '।', '॥', question mark '?', exclamation '!', or newline
      const sentenceRegex = /([^।॥?!.\n]+[।॥?!.\n]+)/g;
      const sentences: string[] = [];
      let match;
      let lastIndex = 0;

      while ((match = sentenceRegex.exec(contentToProcess)) !== null) {
        sentences.push(match[0].trim());
        lastIndex = match.index + match[0].length;
      }

      const remainder = contentToProcess.substring(lastIndex).trim();
      if (remainder) {
        sentences.push(remainder);
      }

      if (sentences.length === 0) {
        sentences.push(contentToProcess);
      }

      let currentAccumulator = "";
      let currentAccumulatorWords = 0;

      for (const sent of sentences) {
        const sentWords = countHindiWords(sent);
        if (
          currentAccumulatorWords > 0 &&
          currentAccumulatorWords + sentWords > targetWordsPerChunk
        ) {
          rawChunks.push({
            text: currentAccumulator.trim(),
            chapterTitle: currentChapterTitle,
          });
          currentAccumulator = sent;
          currentAccumulatorWords = sentWords;
        } else {
          currentAccumulator = currentAccumulator
            ? `${currentAccumulator} ${sent}`
            : sent;
          currentAccumulatorWords += sentWords;
        }
      }

      if (currentAccumulator.trim()) {
        rawChunks.push({
          text: currentAccumulator.trim(),
          chapterTitle: currentChapterTitle,
        });
      }
    }
  }

  return rawChunks.map((chunk, idx) => {
    const words = countHindiWords(chunk.text);
    const estSec = Math.max(3, Math.round((words / 130) * 60));
    return {
      id: `chunk-${idx + 1}-${Date.now().toString(36)}`,
      index: idx + 1,
      chapterTitle: chunk.chapterTitle,
      text: chunk.text,
      wordCount: words,
      estimatedDurationSec: estSec,
      status: "idle",
    };
  });
}

/**
 * Converts Base64 audio into a playable Blob URL
 */
export function base64ToBlobUrl(base64: string, mimeType: string = "audio/wav"): string {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Client-side concatenation of multiple 24kHz mono 16-bit WAV base64 strings
 */
export function concatWavBase64Client(wavBase64List: string[]): {
  blobUrl: string;
  totalDurationSec: number;
} {
  if (wavBase64List.length === 0) {
    return { blobUrl: "", totalDurationSec: 0 };
  }

  const pcmArrays: Uint8Array[] = [];
  let totalPcmBytes = 0;

  for (const b64 of wavBase64List) {
    const binary = atob(b64);
    const len = binary.length;
    if (len > 44) {
      const pcmLen = len - 44;
      const pcm = new Uint8Array(pcmLen);
      for (let i = 0; i < pcmLen; i++) {
        pcm[i] = binary.charCodeAt(44 + i);
      }
      pcmArrays.push(pcm);
      totalPcmBytes += pcmLen;
    }
  }

  // Construct 44-byte WAV header for 24kHz mono 16-bit
  const headerBuffer = new ArrayBuffer(44);
  const view = new DataView(headerBuffer);

  // "RIFF"
  view.setUint8(0, 0x52);
  view.setUint8(1, 0x49);
  view.setUint8(2, 0x46);
  view.setUint8(3, 0x46);
  // ChunkSize (file size - 8)
  view.setUint32(4, 36 + totalPcmBytes, true);
  // "WAVE"
  view.setUint8(8, 0x57);
  view.setUint8(9, 0x41);
  view.setUint8(10, 0x56);
  view.setUint8(11, 0x45);
  // "fmt "
  view.setUint8(12, 0x66);
  view.setUint8(13, 0x6d);
  view.setUint8(14, 0x74);
  view.setUint8(15, 0x20);
  // Subchunk1Size (16 for PCM)
  view.setUint32(16, 16, true);
  // AudioFormat (1 = PCM)
  view.setUint16(20, 1, true);
  // NumChannels (1 = mono)
  view.setUint16(22, 1, true);
  // SampleRate (24000)
  view.setUint32(24, 24000, true);
  // ByteRate (24000 * 1 * 2 = 48000)
  view.setUint32(28, 48000, true);
  // BlockAlign (1 * 2 = 2)
  view.setUint16(32, 2, true);
  // BitsPerSample (16)
  view.setUint16(34, 16, true);
  // "data"
  view.setUint8(36, 0x64);
  view.setUint8(37, 0x61);
  view.setUint8(38, 0x74);
  view.setUint8(39, 0x61);
  // Subchunk2Size (data size)
  view.setUint32(40, totalPcmBytes, true);

  const blobParts: BlobPart[] = [headerBuffer, ...pcmArrays.map((p) => p.buffer as ArrayBuffer)];
  const mergedBlob = new Blob(blobParts, { type: "audio/wav" });
  const totalDurationSec = Number((totalPcmBytes / 48000).toFixed(2));

  return {
    blobUrl: URL.createObjectURL(mergedBlob),
    totalDurationSec,
  };
}

/**
 * Formats seconds into MM:SS or HH:MM:SS format
 */
export function formatSeconds(totalSec: number): string {
  if (isNaN(totalSec) || totalSec < 0) return "00:00";
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = Math.floor(totalSec % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Triggers browser download of audio file
 */
export function downloadAudio(blobUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = filename.endsWith(".wav") ? filename : `${filename}.wav`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
