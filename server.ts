import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ extended: true, limit: "150mb" }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

/**
 * Concat multiple 24kHz mono 16-bit WAV buffers into one WAV file
 */
function concatWavs(wavBuffers: Buffer[]): Buffer {
  if (wavBuffers.length === 0) return Buffer.alloc(0);
  if (wavBuffers.length === 1) return wavBuffers[0];

  const pcmChunks: Buffer[] = [];
  for (const buf of wavBuffers) {
    if (buf.length > 44) {
      pcmChunks.push(buf.subarray(44));
    }
  }

  const totalPcmLength = pcmChunks.reduce((acc, c) => acc + c.length, 0);
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + totalPcmLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(24000, 24); // 24kHz
  header.writeUInt32LE(48000, 28); // byte rate = 24000 * 1 * 2
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // 16-bit
  header.write("data", 36);
  header.writeUInt32LE(totalPcmLength, 40);

  return Buffer.concat([header, ...pcmChunks]);
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

async function retryGenAICall<T>(fn: () => Promise<T>, maxRetries = 2, delayMs = 1500): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isTransient =
        err?.status === 503 ||
        err?.message?.includes("503") ||
        err?.message?.includes("high demand") ||
        err?.message?.includes("UNAVAILABLE") ||
        err?.status === 429;
      if (isTransient && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, attempt)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// Single chunk TTS synthesis using gemini-3.8-flash-tts
app.post("/api/tts/synthesize-chunk", async (req, res) => {
  try {
    const { text, voice = "Kore", style = "Natural expressive Hindi narrator with clear pronunciation, authentic rhythm, and warm tone", speaker = "Narrator" } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Text is required for TTS synthesis" });
    }

    const trimmedText = text.trim();

    const response = await retryGenAICall(() =>
      ai.models.generateContent({
        model: "gemini-3.8-flash-tts",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: trimmedText,
                speechMetadata: {
                  speaker: "Narrator",
                  style: style || "Natural Hindi speaker with authentic emotion and clear articulation",
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      })
    );

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data returned by gemini-3.8-flash-tts");
    }

    const wavBuffer = Buffer.from(base64Audio, "base64");
    const pcmBytes = Math.max(0, wavBuffer.length - 44);
    // 24000 samples/sec * 2 bytes/sample (16-bit mono) = 48000 bytes/sec
    const durationSeconds = Number((pcmBytes / 48000).toFixed(2));

    res.json({
      audioBase64: base64Audio,
      mimeType: "audio/wav",
      durationSeconds,
      byteLength: wavBuffer.length,
    });
  } catch (error: any) {
    console.error("Error in /api/tts/synthesize-chunk:", error);
    res.status(500).json({
      error: error.message || "Failed to synthesize speech chunk",
    });
  }
});

// Dual-speaker dialogue synthesis using gemini-3.8-flash-tts
app.post("/api/tts/synthesize-dialogue", async (req, res) => {
  try {
    const { lines, speaker1 = "अमित (Amit)", voice1 = "Puck", speaker2 = "प्रिया (Priya)", voice2 = "Kore", defaultStyle = "Natural lively Hindi conversational exchange" } = req.body;

    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ error: "Valid dialogue lines array is required" });
    }

    // Standardize speaker keys to Speaker1 and Speaker2 for Gemini multiSpeakerVoiceConfig consistency
    const parts = lines.map((line: { speaker: string; text: string; style?: string }) => {
      const isSpeaker1 = line.speaker === speaker1;
      const speakerId = isSpeaker1 ? "Speaker1" : "Speaker2";
      return {
        text: `${speakerId}: ${line.text}`,
        speechMetadata: {
          speaker: speakerId,
          style: line.style || defaultStyle,
        },
      };
    });

    const response = await retryGenAICall(() =>
      ai.models.generateContent({
        model: "gemini-3.8-flash-tts",
        contents: [
          {
            role: "user",
            parts,
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: "Speaker1",
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: voice1 } },
                },
                {
                  speaker: "Speaker2",
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: voice2 } },
                },
              ],
            },
          },
        },
      })
    );

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No dialogue audio data returned by gemini-3.8-flash-tts");
    }

    const wavBuffer = Buffer.from(base64Audio, "base64");
    const pcmBytes = Math.max(0, wavBuffer.length - 44);
    const durationSeconds = Number((pcmBytes / 48000).toFixed(2));

    res.json({
      audioBase64: base64Audio,
      mimeType: "audio/wav",
      durationSeconds,
      byteLength: wavBuffer.length,
    });
  } catch (error: any) {
    console.error("Error in /api/tts/synthesize-dialogue:", error);
    res.status(500).json({
      error: error.message || "Failed to synthesize dialogue",
    });
  }
});

// Master audio concatenation endpoint
app.post("/api/audio/concat-wavs", (req, res) => {
  try {
    const { wavBase64List } = req.body;
    if (!Array.isArray(wavBase64List) || wavBase64List.length === 0) {
      return res.status(400).json({ error: "wavBase64List must be a non-empty array of base64 strings" });
    }

    const buffers = wavBase64List.map((b64: string) => Buffer.from(b64, "base64"));
    const masterBuffer = concatWavs(buffers);
    const masterBase64 = masterBuffer.toString("base64");
    const pcmBytes = Math.max(0, masterBuffer.length - 44);
    const totalDurationSeconds = Number((pcmBytes / 48000).toFixed(2));

    res.json({
      masterAudioBase64: masterBase64,
      totalDurationSeconds,
      byteLength: masterBuffer.length,
      chunksCount: wavBase64List.length,
    });
  } catch (error: any) {
    console.error("Error in /api/audio/concat-wavs:", error);
    res.status(500).json({ error: error.message || "Failed to concatenate audio chunks" });
  }
});

// AI Hindi Script Generator / Long Speech Writer (powered by gemini-3.8-flash)
app.post("/api/speech/generate-script", async (req, res) => {
  try {
    const {
      topic,
      targetDurationMinutes = 10,
      genre = "motivational",
      speakerPersona = "Inspiring Orator",
      languageStyle = "Shuddh / Pravaahi Hindi (शुद्ध और प्रवाहमयी हिन्दी)",
    } = req.body;

    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ error: "Topic is required" });
    }

    // Average Hindi speaking rate is ~130 words per minute.
    // For a 5 min speech: ~650 words.
    // For a 10 min speech: ~1300 words.
    // For a 15 min speech: ~1950 words.
    // For a 30 min speech: ~3600-4000 words.
    const targetWords = Math.min(4200, Math.max(300, Math.round(targetDurationMinutes * 130)));

    const systemPrompt = `You are an expert Hindi speechwriter, orator, and literary author (हिन्दी के प्रकांड वक्ता और लेखक).
Your task is to write a comprehensive, rich, natural, and expressive Hindi speech/script that sounds captivating when spoken aloud via Text-to-Speech.

Target parameters:
- Topic: ${topic}
- Genre: ${genre}
- Target Duration: ${targetDurationMinutes} minutes (approx ${targetWords} Hindi words)
- Style: ${languageStyle}
- Persona: ${speakerPersona}

Requirements:
1. Write in clear, grammatically pristine Devanagari Hindi (देवनागरी लिपि).
2. Divide the speech into well-structured Chapters/Sections (अध्याय / खंड), each having a title and 2-4 rich spoken paragraphs.
3. Use natural Hindi punctuation ('।', '?', '!') to ensure the TTS voice pauses naturally and creates dramatic oratorical rhythm.
4. Keep the vocabulary dignified, inspiring, and easy for natural phonetic pronunciation.
5. Provide the output in JSON format matching the schema.`;

    const prompt = `Write a complete long-form Hindi speech on "${topic}" for approximately ${targetDurationMinutes} minutes duration. Make it deep, engaging, and ready for high-fidelity speech synthesis.`;

    const response = await retryGenAICall(() =>
      ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Title of the Hindi speech" },
              estimatedMinutes: { type: Type.NUMBER, description: "Estimated delivery duration in minutes" },
              wordCount: { type: Type.NUMBER, description: "Total Hindi word count" },
              summary: { type: Type.STRING, description: "Brief summary or synopsis" },
              chapters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    chapterNumber: { type: Type.NUMBER },
                    title: { type: Type.STRING },
                    paragraphs: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ["chapterNumber", "title", "paragraphs"],
                },
              },
            },
            required: ["title", "estimatedMinutes", "chapters"],
          },
        },
      })
    );

    const rawText = response.text || "{}";
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const clean = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(clean);
    }

    res.json(parsed);
  } catch (error: any) {
    console.error("Error in /api/speech/generate-script:", error);
    const msg = error.message?.includes("503") || error.message?.includes("high demand")
      ? "मॉडल पर अस्थायी भार अधिक है। कृपया कुछ सेकंड बाद पुनः प्रयास करें।"
      : error.message || "Failed to generate Hindi script";
    res.status(500).json({ error: msg });
  }
});

// AI Hindi Text Optimizer / Enhancer for TTS
app.post("/api/speech/optimize-hindi", async (req, res) => {
  try {
    const { text, targetTone = "natural" } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required" });
    }

    const response = await retryGenAICall(() =>
      ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `You are an expert Hindi phonetics and speech director. Optimize the following Hindi text for the most natural, human-sounding Text-to-Speech delivery:
- Ensure correct Devanagari spellings (मात्राएँ और नुक्ता).
- Insert appropriate Hindi purna viram ('।') and commas (',') for natural breath pauses and cadence.
- Keep the meaning intact while enhancing rhythm and clarity for audio narration.
- Tone desired: ${targetTone}.

Original Text:
${text}

Respond in JSON with format:
{
  "optimizedText": "...",
  "improvements": ["...", "..."],
  "estimatedSpeakingTimeMinutes": 2.5
}`,
        config: {
          responseMimeType: "application/json",
        },
      })
    );

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Error in /api/speech/optimize-hindi:", error);
    const msg = error.message?.includes("503") || error.message?.includes("high demand")
      ? "मॉडल पर अस्थायी भार अधिक है। कृपया पुनः प्रयास करें।"
      : error.message || "Failed to optimize Hindi text";
    res.status(500).json({ error: msg });
  }
});

// Setup Vite in development or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(port, () => {
    console.log(`Vaani Hindi TTS Server running on port ${port}`);
  });
}

startServer();
