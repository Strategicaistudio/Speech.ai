import React, { useState } from "react";
import {
  Users,
  Mic,
  Play,
  Download,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  MessageSquare,
  RotateCw,
} from "lucide-react";
import { GeminiVoiceName, DialogueLine } from "../types";
import { HINDI_VOICES, VOCAL_EXPRESSIONS } from "../data/voices";
import { base64ToBlobUrl, downloadAudio, formatSeconds } from "../utils/audioUtils";

interface DialogueStudioProps {
  onPlayAudio: (url: string, title: string, subtitle?: string, durationSec?: number) => void;
}

const DEFAULT_DIALOGUE_LINES: DialogueLine[] = [
  {
    id: "line-1",
    speaker: "राहुल (Rahul)",
    text: "नमस्ते अनन्या! <breath> आज हम कृत्रिम बुद्धिमत्ता और भविष्य पर चर्चा करने वाले हैं। क्या आपको लगता है कि तकनीक हमारे सोचने का तरीका बदल रही है?",
    style: "Curious, thoughtful podcast host",
  },
  {
    id: "line-2",
    speaker: "अनन्या (Ananya)",
    text: "बिल्कुल राहुल, |हां| तकनीक ने हमारे काम करने के अंदाज को पूरी तरह बदल दिया है। लेकिन जो मानवीय संवेदनाएं और भावनाएं हैं, वे हमेशा अद्वितीय रहेंगी। <laugh>",
    style: "Warm, articulate, smiling co-host",
  },
  {
    id: "line-3",
    speaker: "राहुल (Rahul)",
    text: "यह बहुत गहरी बात कही तुमने। जब हम मशीन से बात करते हैं और वह इतनी स्वाभाविक हिन्दी में उत्तर देती है, तो सचमुच विस्मय होता है! <gasp>",
    style: "Enthusiastic and fascinated",
  },
  {
    id: "line-4",
    speaker: "अनन्या (Ananya)",
    text: "यही तो जेमिनी 3.8 टीटीएस की विशेषता है—शब्दों के साथ-साथ हमारी भाषा की मिठास और आत्मीयता को भी स्वर देना!",
    style: "Affirmative, confident, melodious",
  },
];

export const DialogueStudio: React.FC<DialogueStudioProps> = ({ onPlayAudio }) => {
  const [speaker1Name, setSpeaker1Name] = useState<string>("राहुल (Rahul)");
  const [speaker1Voice, setSpeaker1Voice] = useState<GeminiVoiceName>("Puck");

  const [speaker2Name, setSpeaker2Name] = useState<string>("अनन्या (Ananya)");
  const [speaker2Voice, setSpeaker2Voice] = useState<GeminiVoiceName>("Kore");

  const [lines, setLines] = useState<DialogueLine[]>(DEFAULT_DIALOGUE_LINES);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [generatedDurationSec, setGeneratedDurationSec] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const addLine = (speaker: string) => {
    const newLine: DialogueLine = {
      id: `line-${Date.now()}`,
      speaker,
      text: "",
      style: "Natural spoken Hindi",
    };
    setLines([...lines, newLine]);
  };

  const updateLineText = (id: string, text: string) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, text } : l)));
  };

  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((l) => l.id !== id));
  };

  const insertTokenToLine = (lineId: string, token: string) => {
    setLines(
      lines.map((l) =>
        l.id === lineId
          ? {
              ...l,
              text: `${l.text} ${token} `.trim(),
            }
          : l
      )
    );
  };

  const handleSynthesizeDialogue = async () => {
    const validLines = lines.filter((l) => l.text.trim().length > 0);
    if (validLines.length === 0) {
      setStatusMessage("कृपया संवाद में कुछ संवाद पंक्तियाँ लिखें");
      return;
    }

    setIsSynthesizing(true);
    setStatusMessage("द्वि-पात्र संवाद तैयार हो रहा है (gemini-3.8-flash-tts)...");

    try {
      const res = await fetch("/api/tts/synthesize-dialogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: validLines,
          speaker1: speaker1Name,
          voice1: speaker1Voice,
          speaker2: speaker2Name,
          voice2: speaker2Voice,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Dialogue synthesis failed");
      }

      const data = await res.json();
      const blobUrl = base64ToBlobUrl(data.audioBase64);
      setGeneratedAudioUrl(blobUrl);
      setGeneratedDurationSec(data.durationSeconds);
      setStatusMessage(`✨ संवाद ऑडियो तैयार! समय: ${formatSeconds(data.durationSeconds)}`);

      onPlayAudio(
        blobUrl,
        `हिन्दी पॉडकास्ट संवाद: ${speaker1Name} & ${speaker2Name}`,
        `gemini-3.8-flash-tts • 24kHz Studio Audio`,
        data.durationSeconds
      );
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`संवाद निर्माण में त्रुटि: ${err.message || "Unknown error"}`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            मॉडल: gemini-3.8-flash-tts
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
            मल्टी-स्पीकर स्क्रीनप्ले (Dual-Speaker Podcast)
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          संवाद व पॉडकास्ट स्टूडियो (Dual-Speaker Screenplay)
        </h2>
        <p className="text-slate-300 text-sm sm:text-base mt-1 max-w-2xl">
          दो अलग-अलग पात्रों के बीच जीवंत हिन्दी वार्तालाप बनाएं। जेमिनी 3.8 टीटीएस की विशेष क्षमता—प्राकृतिक प्रतिक्रियाएं (|हां|, |अच्छा|) और मानवीय भाव (&lt;हंसी&gt;, &lt;गहरी सांस&gt;) समर्थित।
        </p>
      </div>

      {/* Speaker Setup Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Speaker 1 */}
        <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-blue-300 text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              पात्र 1 (Speaker 1)
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
              पुरुष / प्रथम वक्ता
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">पात्र का नाम:</label>
              <input
                type="text"
                value={speaker1Name}
                onChange={(e) => setSpeaker1Name(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">स्वर चयन (Voice):</label>
              <select
                value={speaker1Voice}
                onChange={(e) => setSpeaker1Voice(e.target.value as GeminiVoiceName)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {HINDI_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.hindiName} ({v.tone})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Speaker 2 */}
        <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-rose-300 text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              पात्र 2 (Speaker 2)
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
              महिला / द्वितीय वक्ता
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">पात्र का नाम:</label>
              <input
                type="text"
                value={speaker2Name}
                onChange={(e) => setSpeaker2Name(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">स्वर चयन (Voice):</label>
              <select
                value={speaker2Voice}
                onChange={(e) => setSpeaker2Voice(e.target.value as GeminiVoiceName)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              >
                {HINDI_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.hindiName} ({v.tone})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogue Script Builder */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold text-white text-base sm:text-lg flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            संवाद पंक्तियाँ (Dialogue Lines)
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={() => addLine(speaker1Name)}
              className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+{speaker1Name} पंक्ति</span>
            </button>
            <button
              onClick={() => addLine(speaker2Name)}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+{speaker2Name} पंक्ति</span>
            </button>
          </div>
        </div>

        {/* Lines Container */}
        <div className="space-y-3">
          {lines.map((line, idx) => {
            const isSpeaker1 = line.speaker === speaker1Name;
            return (
              <div
                key={line.id}
                className={`p-4 rounded-xl border transition-all ${
                  isSpeaker1
                    ? "bg-blue-950/20 border-blue-900/50"
                    : "bg-rose-950/20 border-rose-900/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        isSpeaker1
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {line.speaker}
                    </span>
                    <button
                      onClick={() =>
                        setLines(
                          lines.map((l) =>
                            l.id === line.id
                              ? {
                                  ...l,
                                  speaker: isSpeaker1 ? speaker2Name : speaker1Name,
                                }
                              : l
                          )
                        )
                      }
                      className="text-[10px] text-slate-400 hover:text-white underline"
                    >
                      (पात्र बदलें)
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeLine(line.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="हटाएं"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <textarea
                  value={line.text}
                  onChange={(e) => updateLineText(line.id, e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500 resize-none font-sans"
                  placeholder="यहाँ संवाद लिखें..."
                />

                {/* Quick token buttons for this line */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-slate-400">भाव जोड़ें:</span>
                  {["|हां|", "|अच्छा|", "<laugh>", "<breath>", "<gasp>", "।"].map((t) => (
                    <button
                      key={t}
                      onClick={() => insertTokenToLine(line.id, t)}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 font-mono transition-all"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            कुल {lines.length} संवाद पंक्तियाँ • gemini-3.8-flash-tts multi-speaker
          </span>

          <button
            onClick={handleSynthesizeDialogue}
            disabled={isSynthesizing}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSynthesizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>संवाद ऑडियो तैयार हो रहा है...</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 fill-current" />
                <span>द्वि-पात्र संवाद बनाएं (Synthesize Dialogue)</span>
              </>
            )}
          </button>
        </div>

        {statusMessage && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
