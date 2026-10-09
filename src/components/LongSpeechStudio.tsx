import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  Play,
  RotateCw,
  Download,
  Sparkles,
  Clipboard,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Volume2,
  Trash2,
  Loader2,
  Wand2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkle,
} from "lucide-react";
import { HINDI_VOICES, STYLE_PRESETS, VOCAL_EXPRESSIONS } from "../data/voices";
import { HINDI_SAMPLES, HindiSample } from "../data/hindiSamples";
import { SpeechChunk, GeminiVoiceName } from "../types";
import {
  countHindiWords,
  estimateDurationMinutes,
  splitHindiTextIntoChunks,
  base64ToBlobUrl,
  concatWavBase64Client,
  downloadAudio,
  formatSeconds,
} from "../utils/audioUtils";

interface LongSpeechStudioProps {
  onPlayAudio: (url: string, title: string, subtitle?: string, durationSec?: number) => void;
  initialText?: string;
}

export const LongSpeechStudio: React.FC<LongSpeechStudioProps> = ({
  onPlayAudio,
  initialText,
}) => {
  // Script text state
  const [hindiText, setHindiText] = useState<string>(
    initialText || HINDI_SAMPLES[0].text
  );

  // Character / Voice state
  const [selectedVoice, setSelectedVoice] = useState<GeminiVoiceName>("Kore");
  const [genderFilter, setGenderFilter] = useState<"all" | "female" | "male">("all");
  const [showCharacterGuide, setShowCharacterGuide] = useState<boolean>(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  // Style state
  const [selectedStyleId, setSelectedStyleId] = useState<string>("storyteller");

  // Synthesis & Audio state
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [synthesisProgress, setSynthesisProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [generatedDurationSec, setGeneratedDurationSec] = useState<number>(0);

  // Advanced: Chunks view toggle
  const [chunks, setChunks] = useState<SpeechChunk[]>([]);
  const [showAdvancedChunks, setShowAdvancedChunks] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const cancelRef = useRef<boolean>(false);

  // Stats
  const totalWords = countHindiWords(hindiText);
  const estimatedMins = estimateDurationMinutes(totalWords);
  const maxCapacityMins = 30;
  const capacityPercent = Math.min(100, (estimatedMins / maxCapacityMins) * 100);

  // When text changes, update chunks
  useEffect(() => {
    if (hindiText.trim()) {
      const generated = splitHindiTextIntoChunks(hindiText, 85);
      setChunks(generated);
    } else {
      setChunks([]);
    }
  }, [hindiText]);

  // One-click Paste from Clipboard
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setHindiText(text);
          setStatusMessage("✅ क्लिपबोर्ड से स्क्रिप्ट सफलतापूर्वक पेस्ट हो गई!");
          setTimeout(() => setStatusMessage(""), 3500);
          return;
        }
      }
      textareaRef.current?.focus();
      setStatusMessage("कृपया बॉक्स में क्लिक करके Ctrl+V दबाएं");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch {
      textareaRef.current?.focus();
      setStatusMessage("कृपया बॉक्स में क्लिक करके Ctrl+V दबाएं");
      setTimeout(() => setStatusMessage(""), 3000);
    }
  };

  // Load Sample Preset
  const handleLoadSample = (sample: HindiSample) => {
    setHindiText(sample.text);
    setSelectedVoice(sample.recommendedVoice);
    setSelectedStyleId(sample.recommendedPreset);
    setGeneratedAudioUrl(null);
    setStatusMessage(`"${sample.title}" लोड किया गया (${sample.estimatedMinutes} मिनट)`);
    setTimeout(() => setStatusMessage(""), 4000);
  };

  // Preview Voice Sample
  const handlePreviewVoice = async (voiceId: GeminiVoiceName, e: React.MouseEvent) => {
    e.stopPropagation();
    const voiceObj = HINDI_VOICES.find((v) => v.id === voiceId);
    if (!voiceObj) return;

    setPreviewingVoiceId(voiceId);
    setStatusMessage(`${voiceObj.hindiName} की आवाज़ का नमूना तैयार हो रहा है...`);

    try {
      const res = await fetch("/api/tts/synthesize-chunk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: voiceObj.samplePhrase || "नमस्ते! मैं आपके लिए हिन्दी बोल सकता हूँ।",
          voice: voiceId,
          style: "Clear and authentic Hindi speaker introducing their voice",
          speaker: "Narrator",
        }),
      });

      if (!res.ok) throw new Error("Voice preview failed");
      const data = await res.json();
      const blobUrl = base64ToBlobUrl(data.audioBase64);

      onPlayAudio(
        blobUrl,
        `${voiceObj.hindiName} (स्वर नमूना)`,
        voiceObj.tone,
        data.durationSeconds
      );
      setStatusMessage(`🔊 ${voiceObj.hindiName} का नमूना बज रहा है`);
    } catch (err) {
      console.error(err);
      setStatusMessage("स्वर नमूना बजाने में त्रुटि आई");
    } finally {
      setPreviewingVoiceId(null);
      setTimeout(() => setStatusMessage(""), 4000);
    }
  };

  // Insert Punctuation / Vocal token
  const insertToken = (token: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newText =
      hindiText.substring(0, start) +
      (token.startsWith("<") || token.startsWith("|") ? ` ${token} ` : token) +
      hindiText.substring(end);
    setHindiText(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
          start + token.length + 2;
      }
    }, 50);
  };

  // AI Script Optimizer
  const handleOptimizeText = async () => {
    if (!hindiText.trim()) return;
    setIsOptimizing(true);
    setStatusMessage("हिन्दी विराम व मात्राओं को टीटीएस के लिए अनुकूलित किया जा रहा है...");
    try {
      const res = await fetch("/api/speech/optimize-hindi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: hindiText,
          targetTone: selectedStyleId,
        }),
      });
      const data = await res.json();
      if (data.optimizedText) {
        setHindiText(data.optimizedText);
        setStatusMessage("✅ स्क्रिप्ट का प्रवाह और पूर्ण विराम ('।') सुधार दिया गया!");
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage("भाषा सुधार में त्रुटि आई");
    } finally {
      setIsOptimizing(false);
      setTimeout(() => setStatusMessage(""), 4000);
    }
  };

  // Primary Action: Generate Hindi Speech (Handles short to full 30-min speech)
  const handleGenerateSpeech = async () => {
    if (!hindiText.trim()) {
      setStatusMessage("कृपया पहले कोई हिन्दी स्क्रिप्ट पेस्ट करें या लिखें");
      return;
    }

    setIsSynthesizing(true);
    setSynthesisProgress(5);
    cancelRef.current = false;
    setGeneratedAudioUrl(null);
    setStatusMessage("हिन्दी आवाज़ तैयार हो रही है (gemini-3.8-flash-tts)...");

    const currentStyle =
      STYLE_PRESETS.find((s) => s.id === selectedStyleId)?.stylePrompt ||
      STYLE_PRESETS[0].stylePrompt;

    const currentVoiceObj = HINDI_VOICES.find((v) => v.id === selectedVoice);
    const speakerTitle = currentVoiceObj?.hindiName || "वक्ता";

    try {
      const generatedChunks = splitHindiTextIntoChunks(hindiText, 85);
      const readyAudioBase64List: string[] = [];

      for (let i = 0; i < generatedChunks.length; i++) {
        if (cancelRef.current) {
          setStatusMessage("प्रक्रिया रोकी गई");
          break;
        }

        const chunk = generatedChunks[i];
        setStatusMessage(
          generatedChunks.length > 1
            ? `खंड ${i + 1} / ${generatedChunks.length} की ध्वनि बन रही है (${Math.round(
                ((i + 1) / generatedChunks.length) * 100
              )}%)...`
            : "ध्वनि तैयार हो रही है..."
        );

        const res = await fetch("/api/tts/synthesize-chunk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: chunk.text,
            voice: selectedVoice,
            style: currentStyle,
            speaker: chunk.chapterTitle || "Narrator",
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "ऑडियो निर्माण में त्रुटि आई");
        }

        const data = await res.json();
        readyAudioBase64List.push(data.audioBase64);

        const prog = Math.round(((i + 1) / generatedChunks.length) * 95);
        setSynthesisProgress(prog);
      }

      if (readyAudioBase64List.length > 0 && !cancelRef.current) {
        // Concatenate all chunks into seamless master WAV
        const { blobUrl, totalDurationSec } = concatWavBase64Client(readyAudioBase64List);
        setGeneratedAudioUrl(blobUrl);
        setGeneratedDurationSec(totalDurationSec);
        setSynthesisProgress(100);

        setStatusMessage(
          `🎉 ऑडियो सफलतापूर्वक तैयार! कुल समय: ${formatSeconds(totalDurationSec)}`
        );

        // Auto play in bottom audio deck
        onPlayAudio(
          blobUrl,
          `हिन्दी भाषण (${speakerTitle})`,
          `अवधि: ${formatSeconds(totalDurationSec)} • 24kHz Studio WAV`,
          totalDurationSec
        );
      }
    } catch (err: any) {
      console.error("Synthesis error:", err);
      setStatusMessage(`त्रुटि: ${err.message || "ऑडियो बनाने में समस्या आई"}`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const filteredVoices = HINDI_VOICES.filter((v) => {
    if (genderFilter === "female") return v.gender === "female";
    if (genderFilter === "male") return v.gender === "male";
    return true;
  });

  const selectedVoiceObj = HINDI_VOICES.find((v) => v.id === selectedVoice);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Friendly Welcome & Model Badge */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              gemini-3.8-flash-tts
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              ⚡ 30 मिनट तक समर्थित
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            हिन्दी टेक्स्ट-टू-स्पीच स्टूडियो
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            अपनी स्क्रिप्ट पेस्ट करें, पसंदीदा कैरेक्टर चुनें और प्राकृतिक हिन्दी आवाज़ तुरंत बनाएं।
          </p>
        </div>

        {/* 30 Min Capacity Badge */}
        <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-xs shrink-0 flex items-center gap-3">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <div className="text-slate-400 text-[11px]">वर्तमान भाषण समय:</div>
            <div className="font-semibold text-white font-mono">
              {estimatedMins} मिनट / <span className="text-amber-400">30 मिनट अधिकतम</span>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: कैरेक्टर (आवाज़) चुनें */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center">
                1
              </span>
              कैरेक्टर (आवाज़) चुनें
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              किसकी आवाज़ में भाषण या कहानी सुनना चाहते हैं?
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Gender Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setGenderFilter("all")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  genderFilter === "all"
                    ? "bg-amber-500 text-slate-950 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                सभी (5)
              </button>
              <button
                onClick={() => setGenderFilter("female")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  genderFilter === "female"
                    ? "bg-amber-500 text-slate-950 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                👩 महिला (2)
              </button>
              <button
                onClick={() => setGenderFilter("male")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  genderFilter === "male"
                    ? "bg-amber-500 text-slate-950 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                👨 पुरुष (3)
              </button>
            </div>

            {/* How to choose character guide trigger */}
            <button
              onClick={() => setShowCharacterGuide(!showCharacterGuide)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>कैरेक्टर कैसे चुनें?</span>
              {showCharacterGuide ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Character Selection Guide (Explains clearly how to choose) */}
        {showCharacterGuide && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/30 via-slate-950 to-slate-950 border border-amber-500/30 text-xs sm:text-sm text-slate-200 space-y-2.5 animate-fadeIn">
            <h4 className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              सही कैरेक्टर चुनने के लिए मार्गदर्शन:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <strong className="text-rose-300 block mb-0.5">📖 कहानियों व कथा के लिए:</strong>
                <span className="text-slate-300">
                  <strong>काव्या (Kavya)</strong> चुनें—यह बहुत मधुर और भावपूर्ण स्वर है।
                </span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <strong className="text-amber-300 block mb-0.5">🔥 ओजस्वी भाषण के लिए:</strong>
                <span className="text-slate-300">
                  <strong>विक्रम (Vikram)</strong> चुनें—यह बुलंद और प्रेरणादायी पुरुष स्वर है।
                </span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <strong className="text-blue-300 block mb-0.5">🎙️ पॉडकास्ट व आधुनिक विषय:</strong>
                <span className="text-slate-300">
                  <strong>प्रणव (Pranav)</strong> चुनें—यह युवा और जीवंत बातचीत का स्वर है।
                </span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <strong className="text-teal-300 block mb-0.5">🧘 ध्यान, योग व शांति के लिए:</strong>
                <span className="text-slate-300">
                  <strong>ज़ोया (Zoya)</strong> चुनें—यह अत्यंत शांत और सुकून भरा धीमा स्वर है।
                </span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <strong className="text-purple-300 block mb-0.5">📜 इतिहास, दर्शन व गीता के लिए:</strong>
                <span className="text-slate-300">
                  <strong>ऋषि (Rishi)</strong> चुनें—यह गहरा, भारी और विद्वत्तापूर्ण स्वर है।
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Character Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredVoices.map((voice) => {
            const isSelected = selectedVoice === voice.id;
            const isPreviewing = previewingVoiceId === voice.id;

            return (
              <div
                key={voice.id}
                onClick={() => setSelectedVoice(voice.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? "bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/10"
                    : "bg-slate-950/70 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${voice.avatarColor} text-white font-bold text-sm flex items-center justify-center shadow-md`}
                      >
                        {voice.hindiName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                          {voice.hindiName}
                          {voice.gender === "female" ? (
                            <span className="text-[10px] text-pink-300 bg-pink-500/10 px-1 rounded">
                              महिला
                            </span>
                          ) : (
                            <span className="text-[10px] text-blue-300 bg-blue-500/10 px-1 rounded">
                              पुरुष
                            </span>
                          )}
                        </h4>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {voice.roleHindi}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {voice.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded truncate">
                    🎯 {voice.bestFor}
                  </span>

                  {/* Audio Preview Button */}
                  <button
                    onClick={(e) => handlePreviewVoice(voice.id, e)}
                    disabled={isPreviewing}
                    className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1 shrink-0 transition-colors"
                    title="आवाज़ का नमूना सुनें"
                  >
                    {isPreviewing ? (
                      <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                    ) : (
                      <Volume2 className="w-3 h-3 text-amber-400" />
                    )}
                    <span>नमूना</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Voice Confirmation Strip */}
        {selectedVoiceObj && (
          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-300">
              चयनित आवाज़: <strong className="text-amber-300">{selectedVoiceObj.hindiName}</strong> ({selectedVoiceObj.roleHindi})
            </span>
            <span className="text-slate-400 text-[11px]">
              आदर्श उपयोग: {selectedVoiceObj.bestFor}
            </span>
          </div>
        )}
      </div>

      {/* STEP 2: यहाँ अपनी स्क्रिप्ट पेस्ट या लिखें (Explicit Paste Location) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center">
                2
              </span>
              यहाँ अपनी स्क्रिप्ट पेस्ट करें (Paste Your Script Here)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              नीचे दिए गए बॉक्स में अपनी हिन्दी स्क्रिप्ट डालें या 1-क्लिक में पेस्ट करें
            </p>
          </div>

          {/* Quick Paste & Helper Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePasteClipboard}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95"
              title="क्लिपबोर्ड में कॉपी की गई स्क्रिप्ट यहाँ चिपकाएं"
            >
              <Clipboard className="w-4 h-4" />
              <span>📋 क्लिपबोर्ड से पेस्ट करें</span>
            </button>

            <button
              onClick={handleOptimizeText}
              disabled={isOptimizing || !hindiText.trim()}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="मात्राओं और पूर्ण विराम को बोलने के लिए ठीक करें"
            >
              {isOptimizing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              <span>विराम सुधारें</span>
            </button>

            <button
              onClick={() => setHindiText("")}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="स्क्रिप्ट साफ़ करें"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Sample Scripts Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin text-xs">
          <span className="text-slate-400 shrink-0 font-medium">तैयार नमूना स्क्रिप्ट:</span>
          {HINDI_SAMPLES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleLoadSample(sample)}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 shrink-0 transition-all"
            >
              {sample.title} ({sample.estimatedMinutes}m)
            </button>
          ))}
        </div>

        {/* Prominent Textarea Box */}
        <div className="relative group">
          <textarea
            ref={textareaRef}
            value={hindiText}
            onChange={(e) => setHindiText(e.target.value)}
            rows={9}
            className="w-full bg-slate-950 border-2 border-slate-800 group-hover:border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl p-4 text-sm sm:text-base text-slate-100 placeholder-slate-500 transition-all resize-y font-sans leading-relaxed selection:bg-amber-500/30"
            placeholder="👉 यहाँ अपनी हिन्दी स्क्रिप्ट पेस्ट करें (Ctrl+V दबाएं या ऊपर 'क्लिपबोर्ड से पेस्ट करें' बटन दबाएं)...

आप यहाँ 1 वाक्य से लेकर 30 मिनट तक का पूरा भाषण (कहानियाँ, पॉडकास्ट, प्रवचन, व्याख्यान) डाल सकते हैं।"
          />
        </div>

        {/* Expression & Punctuation Helpers Bar */}
        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 text-[11px]">विराम व भाव जोड़ें:</span>
            {VOCAL_EXPRESSIONS.slice(0, 5).map((exp, i) => (
              <button
                key={i}
                onClick={() => insertToken(exp.token)}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 font-mono text-[11px] transition-all"
                title={exp.desc}
              >
                {exp.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-slate-400 font-mono text-xs">
            <span>शब्द: <strong className="text-white">{totalWords}</strong></span>
            <span>•</span>
            <span>समय: <strong className="text-amber-300">~{estimatedMins} मिनट</strong></span>
          </div>
        </div>
      </div>

      {/* STEP 3: वाचन का अंदाज़ (Speaking Tone) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-3">
        <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center">
            3
          </span>
          बोलने का अंदाज़ (Tone & Style)
        </h3>
        <p className="text-xs text-slate-400">
          भाषण को किस शैली में प्रस्तुत करना है?
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {STYLE_PRESETS.map((preset) => {
            const isSelected = selectedStyleId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setSelectedStyleId(preset.id)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-amber-500 text-slate-950 font-semibold border-amber-500 shadow-md shadow-amber-500/20"
                    : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="text-xs font-bold">{preset.labelHindi}</div>
                <div
                  className={`text-[10px] mt-0.5 truncate ${
                    isSelected ? "text-slate-900 opacity-90" : "text-slate-400"
                  }`}
                >
                  {preset.labelEnglish}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 4: मुख्य ऑडियो बनाएं बटन (Big Action Button) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center space-y-4">
        <div className="max-w-md mx-auto">
          {isSynthesizing ? (
            <div className="space-y-3">
              <button
                onClick={() => {
                  cancelRef.current = true;
                  setIsSynthesizing(false);
                }}
                className="w-full py-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-base shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>संश्लेषण रोकें (Cancel)</span>
              </button>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                  style={{ width: `${synthesisProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerateSpeech}
              disabled={!hindiText.trim()}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold text-lg sm:text-xl shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Mic className="w-6 h-6 fill-current" />
              <span>🎙️ आवाज़ बनाएं (Generate Voice)</span>
            </button>
          )}
        </div>

        {statusMessage && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* STEP 5: परिणाम (Result Player & Direct Download) */}
      {generatedAudioUrl && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border-2 border-amber-500/50 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                तैयार ऑडियो (Ready)
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                आपका भाषण तैयार है!
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                स्वर: <strong className="text-amber-300">{selectedVoiceObj?.hindiName}</strong> • कुल अवधि:{" "}
                <strong className="text-white font-mono">{formatSeconds(generatedDurationSec)}</strong> • 24kHz Studio Quality WAV
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() =>
                  onPlayAudio(
                    generatedAudioUrl,
                    `हिन्दी भाषण (${selectedVoiceObj?.hindiName})`,
                    `अवधि: ${formatSeconds(generatedDurationSec)}`,
                    generatedDurationSec
                  )
                }
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>अभी सुनें</span>
              </button>

              <button
                onClick={() =>
                  downloadAudio(
                    generatedAudioUrl,
                    `Hindi_Speech_${selectedVoiceObj?.id}_${Date.now()}.wav`
                  )
                }
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>डाउनलोड WAV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Optional: Speech Chunks Accordion (Kept clean & collapsible) */}
      {chunks.length > 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <button
            onClick={() => setShowAdvancedChunks(!showAdvancedChunks)}
            className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm text-slate-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2 font-medium">
              <Layers className="w-4 h-4 text-amber-400" />
              विस्तृत अध्याय व भाषण खंड देखें ({chunks.length} Chunks - 30 मिनट पाइपलाइन)
            </span>
            {showAdvancedChunks ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showAdvancedChunks && (
            <div className="p-4 pt-0 border-t border-slate-800 space-y-2.5 max-h-80 overflow-y-auto">
              <p className="text-[11px] text-slate-400 mb-2">
                लम्बे भाषण को 30 मिनट तक निर्बाध व बिना रुकावट बनाने के लिए सिस्टम ने इसे निम्न खंडों में विभाजित किया है:
              </p>
              {chunks.map((c, i) => (
                <div
                  key={c.id}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-amber-300 mr-2">खंड {i + 1}:</span>
                    <span className="text-slate-300 truncate">{c.text}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono shrink-0">
                    {c.wordCount} शब्द
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
