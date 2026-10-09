import React, { useState } from "react";
import {
  Mic,
  FileText,
  Users,
  Info,
  Clock,
  Radio,
  BookOpen,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { LongSpeechStudio } from "./components/LongSpeechStudio";
import { ScriptGenerator } from "./components/ScriptGenerator";
import { DialogueStudio } from "./components/DialogueStudio";
import { AudioPlayer } from "./components/AudioPlayer";

export default function App() {
  const [activeTab, setActiveTab] = useState<"speech" | "script" | "dialogue" | "guide">("speech");
  const [passedScriptText, setPassedScriptText] = useState<string>("");

  // Audio Player State
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [currentAudioTitle, setCurrentAudioTitle] = useState<string>("");
  const [currentAudioSubtitle, setCurrentAudioSubtitle] = useState<string>("");
  const [currentAudioDurationSec, setCurrentAudioDurationSec] = useState<number>(0);

  const handlePlayAudio = (
    url: string,
    title: string,
    subtitle?: string,
    durationSec?: number
  ) => {
    setCurrentAudioUrl(url);
    setCurrentAudioTitle(title);
    setCurrentAudioSubtitle(subtitle || "");
    setCurrentAudioDurationSec(durationSec || 0);
  };

  const handleLoadScriptToStudio = (fullText: string) => {
    setPassedScriptText(fullText);
    setActiveTab("speech");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-100 pb-28">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
              <Radio className="w-5 h-5 sm:w-6 sm:h-6 fill-current animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  वाणी <span className="text-amber-400 font-serif">Vaani</span>
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase tracking-wider font-mono">
                  Hindi TTS
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate hidden xs:block">
                हिन्दी टेक्स्ट-टू-स्पीच स्टूडियो • <strong className="text-amber-300">30 मिनट तक भाषण</strong>
              </p>
            </div>
          </div>

          {/* Model Flagship Badges */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-slate-300">मॉडल:</span>
              <strong className="text-amber-400 font-mono text-[11px]">gemini-3.8-flash-tts</strong>
            </div>
          </div>

          {/* Simple Tab Switcher */}
          <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab("speech")}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "speech"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>मुख्य स्टूडियो</span>
            </button>

            <button
              onClick={() => setActiveTab("script")}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "script"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">AI से स्क्रिप्ट लिखवाएं</span>
              <span className="sm:hidden">AI स्क्रिप्ट</span>
            </button>

            <button
              onClick={() => setActiveTab("dialogue")}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "dialogue"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">2-पात्र पॉडकास्ट</span>
              <span className="sm:hidden">संवाद</span>
            </button>

            <button
              onClick={() => setActiveTab("guide")}
              className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                activeTab === "guide"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
              title="मदद व गाइड (Help Guide)"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden md:inline">मदद</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        {activeTab === "speech" && (
          <LongSpeechStudio
            onPlayAudio={handlePlayAudio}
            initialText={passedScriptText}
          />
        )}

        {activeTab === "script" && (
          <ScriptGenerator onLoadScriptToStudio={handleLoadScriptToStudio} />
        )}

        {activeTab === "dialogue" && (
          <DialogueStudio onPlayAudio={handlePlayAudio} />
        )}

        {activeTab === "guide" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-amber-400" />
                वाणी (Vaani) का उपयोग कैसे करें? (सरल गाइड)
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                यह ऐप गूगल के अत्याधुनिक मॉडल <code className="text-amber-300 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded">gemini-3.8-flash-tts</code> द्वारा संचालित है, जो स्टूडियो-ग्रेड 24kHz शुद्ध हिन्दी आवाज़ तैयार करता है।
              </p>
            </div>

            {/* Answer 1: स्क्रिप्ट कहाँ पेस्ट करें */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg space-y-3">
              <h3 className="font-bold text-amber-300 text-base sm:text-lg flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                स्क्रिप्ट कहाँ पेस्ट करें? (Where to paste script?)
              </h3>
              <div className="text-xs sm:text-sm text-slate-300 space-y-2 leading-relaxed">
                <p>
                  मुख्य स्टूडियो पेज पर <strong>"चरण 2: यहाँ अपनी स्क्रिप्ट पेस्ट करें"</strong> का एक बड़ा बॉक्स दिया गया है।
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-300">
                  <li>
                    <strong>क्लिपबोर्ड से 1-क्लिक पेस्ट:</strong> बॉक्स के ऊपर दिए <strong>"📋 क्लिपबोर्ड से पेस्ट करें"</strong> बटन पर क्लिक करें। आपकी कॉपी की हुई स्क्रिप्ट तुरंत पेस्ट हो जाएगी।
                  </li>
                  <li>
                    <strong>कीबोर्ड से:</strong> बॉक्स पर क्लिक करें और अपने कीबोर्ड से <strong>Ctrl + V</strong> (Mac पर <strong>Cmd + V</strong>) दबाएं।
                  </li>
                  <li>
                    <strong>भाषण की लम्बाई:</strong> आप 1 पंक्ति से लेकर <strong>30 मिनट (लगभग 4,000 शब्द)</strong> तक का पूरा व्याख्यान, कथा या पॉडकास्ट एक साथ डाल सकते हैं।
                  </li>
                </ul>
              </div>
            </div>

            {/* Answer 2: कैरेक्टर कैसे चुनें */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg space-y-3">
              <h3 className="font-bold text-amber-300 text-base sm:text-lg flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                कैरेक्टर कैसे चुनें? (How to choose character?)
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                ऐप में 5 विशेष हिन्दी कैरेक्टर उपलब्ध हैं। आप किसी भी कार्ड पर क्लिक करके उसे चुन सकते हैं और <strong>"नमूना"</strong> बटन दबाकर उनकी आवाज़ का सैंपल भी सुन सकते हैं:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <strong className="text-rose-300 block mb-1">👩 काव्या (Kavya - Kore)</strong>
                  <p className="text-slate-300">
                    मधुर, भावपूर्ण महिला स्वर। कहानियों, उपन्यासों, भावनात्मक आलेखों और ऑडियोबुक्स के लिए सर्वोत्तम।
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <strong className="text-blue-300 block mb-1">👨 प्रणव (Pranav - Puck)</strong>
                  <p className="text-slate-300">
                    उत्साही, युवा पुरुष स्वर। यूट्यूब वीडियो, पॉडकास्ट, तकनीक और आधुनिक विषयों की बातचीत के लिए आदर्श।
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <strong className="text-amber-300 block mb-1">👨 विक्रम (Vikram - Fenrir)</strong>
                  <p className="text-slate-300">
                    बुलंद, ओजस्वी पुरुष स्वर। स्वतंत्रता दिवस भाषण, प्रेरक उद्बोधन, देशभक्ति और मुख्य वक्ता के रूप में उपयुक्त।
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <strong className="text-teal-300 block mb-1">👩 ज़ोया (Zoya - Zephyr)</strong>
                  <p className="text-slate-300">
                    अत्यंत शांत, सौम्य महिला स्वर। ध्यान सत्र (Meditation), योग, कविता पाठ और मन को शांति देने वाले चिंतन के लिए।
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <strong className="text-purple-300 block mb-1">👨 ऋषि (Rishi - Charon)</strong>
                  <p className="text-slate-300">
                    गहरा, भारी और प्रतिष्ठित पुरुष स्वर। इतिहास, दर्शनशास्त्र, श्रीमद्भगवद्गीता ज्ञान और गंभीर वृत्तचित्रों के लिए।
                  </p>
                </div>
              </div>
            </div>

            {/* Answer 3: ऑडियो डाउनलोड व विराम */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg space-y-3">
              <h3 className="font-bold text-amber-300 text-base sm:text-lg flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center">
                  3
                </span>
                ऑडियो डाउनलोड और ठहराव के नियम
              </h3>
              <div className="text-xs sm:text-sm text-slate-300 space-y-2 leading-relaxed">
                <p>
                  • जैसे ही आपका ऑडियो बन जाएगा, स्क्रीन पर और नीचे फ्लोटिंग प्लेयर में <strong>"डाउनलोड WAV"</strong> बटन आ जाएगा, जिस पर क्लिक करते ही 24kHz की ओरिजिनल उच्च गुणवत्ता वाली ऑडियो फाइल आपके फोन या कंप्यूटर में सेव हो जाएगी।
                </p>
                <p>
                  • वाक्य के बीच में स्वाभाविक ठहराव देने के लिए पूर्ण विराम (<strong>।</strong>) का उपयोग करें। आप <strong>&lt;laugh&gt;</strong> (हंसी) और <strong>&lt;breath&gt;</strong> (सांस) जैसे भाव भी जोड़ सकते हैं।
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Studio Master Audio Player Deck */}
      <AudioPlayer
        audioUrl={currentAudioUrl}
        title={currentAudioTitle || "ऑडियो"}
        subtitle={currentAudioSubtitle}
        totalDurationSec={currentAudioDurationSec}
      />
    </div>
  );
}
