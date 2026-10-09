import React, { useState } from "react";
import {
  Sparkles,
  BookOpen,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
  Copy,
  Layers,
  ChevronRight,
  Flame,
  Lightbulb,
} from "lucide-react";
import { GeneratedScript } from "../types";

interface ScriptGeneratorProps {
  onLoadScriptToStudio: (fullText: string) => void;
}

const TOPIC_SUGGESTIONS = [
  {
    title: "सफलता का मनोविज्ञान और आत्म-अनुशासन",
    genre: "motivational",
    desc: "निरंतर प्रयास, भय पर विजय और मानसिक दृढ़ता पर ओजस्वी व्याख्यान",
  },
  {
    title: "श्रीमद्भगवद्गीता: कर्मयोग और मन की शांति",
    genre: "spiritual",
    desc: "निष्काम कर्म, चिंता मुक्ति और अंतर्मन की स्थिरता पर गहन दार्शनिक प्रवचन",
  },
  {
    title: "कृत्रिम बुद्धिमत्ता (AI) और भारत का भविष्य",
    genre: "educational",
    desc: "तकनीकी क्रांति, नवाचार और युवाओं के लिए असीम अवसरों पर सारगर्भित विचार",
  },
  {
    title: "समय की अमूल्यता और जीवन का सच्चा उद्देश्य",
    genre: "motivational",
    desc: "काल चक्र, वर्तमान के महत्व और लक्ष्य प्राप्ति पर प्रभावी भाषण",
  },
  {
    title: "कथा: हिमालय के संन्यासी और राजा की खोज",
    genre: "story",
    desc: "गहन शिक्षाप्रद आध्यात्मिक कहानी, पात्रों के संवाद और भावपूर्ण वर्णन के साथ",
  },
];

export const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({
  onLoadScriptToStudio,
}) => {
  const [topic, setTopic] = useState<string>("सफलता का मनोविज्ञान और आत्म-अनुशासन");
  const [targetMinutes, setTargetMinutes] = useState<number>(10);
  const [genre, setGenre] = useState<string>("motivational");
  const [speakerPersona, setSpeakerPersona] = useState<string>("ओजस्वी व विद्वान वक्ता (Inspiring Keynote Orator)");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scriptResult, setScriptResult] = useState<GeneratedScript | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setErrorMsg("");
    setScriptResult(null);

    try {
      const res = await fetch("/api/speech/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          targetDurationMinutes: targetMinutes,
          genre,
          speakerPersona,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate script");
      }

      const scriptData: GeneratedScript = await res.json();
      setScriptResult(scriptData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "भाषण आलेख बनाने में त्रुटि आई। कृपया पुनः प्रयास करें।");
    } finally {
      setIsLoading(false);
    }
  };

  // Convert structured chapters into single formatted Hindi text for Speech Studio
  const getFullHindiText = (): string => {
    if (!scriptResult) return "";
    let combined = "";
    scriptResult.chapters.forEach((chap) => {
      combined += `[अध्याय ${chap.chapterNumber}: ${chap.title}]\n`;
      chap.paragraphs.forEach((p) => {
        combined += `${p}\n\n`;
      });
    });
    return combined.trim();
  };

  const handleSendToStudio = () => {
    const text = getFullHindiText();
    if (text) {
      onLoadScriptToStudio(text);
    }
  };

  const handleCopyText = () => {
    const text = getFullHindiText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            मॉडल: gemini-3.8-flash
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            विद्वत्तापूर्ण हिन्दी आलेखक
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          AI हिन्दी भाषण व आलेख जनरेटर (5 से 30 मिनट)
        </h2>
        <p className="text-slate-300 text-sm sm:text-base mt-1 max-w-2xl">
          किसी भी विषय पर 5 मिनट से लेकर संपूर्ण 30 मिनट का धाराप्रवाह, सारगर्भित और सम्मोहक हिन्दी व्याख्यान तैयार करें—अध्यायों में विभाजित और टीटीएस अनुकूलित।
        </p>
      </div>

      {/* Configuration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Topic & Suggestion Box */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div>
            <label className="text-sm font-semibold text-white block mb-1.5 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              भाषण का विषय (Speech Topic):
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder-slate-600"
              placeholder="उदा. आत्मविश्वास और निरंतरता, भारत का स्वर्णिम भविष्य, पर्यावरण..."
            />
          </div>

          {/* Quick Inspirations */}
          <div>
            <label className="text-xs text-slate-400 block mb-2">
              शीर्ष लोकप्रिय विषय (Popular Inspirations):
            </label>
            <div className="space-y-1.5">
              {TOPIC_SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTopic(item.title);
                    setGenre(item.genre);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between group ${
                    topic === item.title
                      ? "bg-amber-500/15 border-amber-500/70 text-amber-200"
                      : "bg-slate-950/70 border-slate-800/80 text-slate-300 hover:bg-slate-800/70 hover:text-white"
                  }`}
                >
                  <div>
                    <span className="font-semibold">{item.title}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {item.desc}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Duration & Genre Box */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <label className="text-sm font-semibold text-white block mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              लक्षित भाषण समय (Target Duration):
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[5, 10, 15, 20, 30].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setTargetMinutes(mins)}
                  className={`py-2 px-1 text-center rounded-xl border text-xs font-semibold transition-all ${
                    targetMinutes === mins
                      ? "bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20"
                      : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div>{mins}m</div>
                  <div className="text-[9px] font-mono opacity-80 mt-0.5">
                    ~{Math.round(mins * 130)}w
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {targetMinutes === 30 ? (
                <strong className="text-amber-300">
                  ⚡ 30 मिनट का पूर्ण महा-भाषण (लगभग 3,900 शब्द, 6-8 अध्याय)
                </strong>
              ) : (
                `लगभग ${targetMinutes * 130} शब्दों का सुव्यवस्थित आलेख`
              )}
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              भाषण की शैली (Genre / Category):
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="motivational">🔥 प्रेरक व ओजस्वी (Motivational Keynote)</option>
              <option value="spiritual">🧘 आध्यात्मिक व दार्शनिक (Spiritual Pravachan)</option>
              <option value="educational">🎓 शैक्षणिक व ज्ञानवर्धक (Educational Masterclass)</option>
              <option value="story">📖 कथा व कहानी (Audiobook Narrative Story)</option>
              <option value="formal">🏛️ औपचारिक संबोधन (Formal Dignified Address)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              वक्ता का व्यक्तित्व (Speaker Persona):
            </label>
            <input
              type="text"
              value={speakerPersona}
              onChange={(e) => setSpeakerPersona(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              placeholder="उदा. ओजस्वी वक्ता, करुणामयी गुरु..."
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isLoading || !topic.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>{targetMinutes} मिनट का हिन्दी आलेख तैयार हो रहा है...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-current" />
                <span>भाषण आलेख लिखें (Generate Script)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Generated Script Display */}
      {scriptResult && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 uppercase tracking-wider">
                निर्मित आलेख
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                {scriptResult.title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {scriptResult.summary || "विस्तृत हिन्दी भाषण"} • अनुमानित समय:{" "}
                <span className="text-amber-300 font-mono font-semibold">
                  {scriptResult.estimatedMinutes} मिनट
                </span>{" "}
                • {scriptResult.chapters.length} अध्याय
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyText}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                {copied ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{copied ? "कॉपी हो गया!" : "पाठ कॉपी करें"}</span>
              </button>

              <button
                onClick={handleSendToStudio}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>स्टूडियो में भेजें व ध्वनि बनाएं</span>
              </button>
            </div>
          </div>

          {/* Chapters List */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
            {scriptResult.chapters.map((chapter) => (
              <div
                key={chapter.chapterNumber}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 text-xs font-mono font-bold flex items-center justify-center">
                    {chapter.chapterNumber}
                  </span>
                  <h4 className="font-semibold text-amber-200 text-sm sm:text-base">
                    {chapter.title}
                  </h4>
                </div>

                <div className="space-y-2 text-xs sm:text-sm text-slate-200 leading-relaxed pl-8">
                  {chapter.paragraphs.map((p, pIdx) => (
                    <p key={pIdx}>{p}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
