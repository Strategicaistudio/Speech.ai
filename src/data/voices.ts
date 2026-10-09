import { VoiceOption } from "../types";

export const HINDI_VOICES: VoiceOption[] = [
  {
    id: "Kore",
    hindiName: "काव्या (Kavya)",
    englishName: "Kore",
    gender: "female",
    roleHindi: "कथावाचिका व सूत्रधार (Female Storyteller)",
    tone: "मधुर, आत्मीय व भावपूर्ण (Warm & Soulful)",
    samplePhrase: "नमस्ते! मैं काव्या हूँ। मेरी आवाज़ कहानियों, ऑडियोबुक्स और भावनात्मक व्याख्यानों के लिए सर्वश्रेष्ठ है।",
    description: "स्पष्ट उच्चारण, स्वाभाविक ठहराव और आत्मीय भावनात्मक जुड़ाव।",
    bestFor: "कहानियां, ऑडियोबुक्स, कथा वाचन, भावनात्मक आलेख",
    avatarColor: "from-rose-500 to-pink-600",
  },
  {
    id: "Puck",
    hindiName: "प्रणव (Pranav)",
    englishName: "Puck",
    gender: "male",
    roleHindi: "युवा पॉडकास्टर व होस्ट (Male Podcast Host)",
    tone: "उत्साही, आधुनिक व जीवंत (Energetic & Modern)",
    samplePhrase: "नमस्ते दोस्तों! मैं प्रणव हूँ। मैं पॉडकास्ट, तकनीक और आधुनिक विषयों को जीवंत आवाज़ देता हूँ।",
    description: "आधुनिक बातचीत, ताज़गी भरा अंदाज़ और स्वाभाविक बातचीत का प्रवाह।",
    bestFor: "पॉडकास्ट, तकनीक व्याख्यान, युवा चर्चा, यूट्यूब",
    avatarColor: "from-blue-500 to-indigo-600",
  },
  {
    id: "Fenrir",
    hindiName: "विक्रम (Vikram)",
    englishName: "Fenrir",
    gender: "male",
    roleHindi: "ओजस्वी वक्ता व उद्घोषक (Keynote Orator)",
    tone: "ओजस्वी, बुलंद व प्रभावशाली (Bold & Authoritative)",
    samplePhrase: "नमस्कार देशवासियों! मैं विक्रम हूँ। मेरा स्वर ओजस्वी भाषणों और प्रेरणादायी संदेशों के लिए आदर्श है।",
    description: "मजबूत, बुलंद और आत्मविश्वास से भरी आवाज़। राष्ट्रीय व प्रेरक भाषणों के लिए सर्वोत्तम।",
    bestFor: "मुख्य भाषण (Keynote), प्रेरणा, राष्ट्रीय उद्घोषणा, समाचार",
    avatarColor: "from-amber-600 to-orange-700",
  },
  {
    id: "Zephyr",
    hindiName: "ज़ोया (Zoya)",
    englishName: "Zephyr",
    gender: "female",
    roleHindi: "ध्यान व योग मार्गदर्शिका (Calm Meditation Guide)",
    tone: "अत्यंत शांत, कोमल व विचारशील (Calm & Soothing)",
    samplePhrase: "शांति... मैं ज़ोया हूँ। मेरी धीमी और कोमल आवाज़ ध्यान, योग और मन की शांति के लिए है।",
    description: "अत्यंत धीमा, मधुर और सुकून देने वाला स्वर। ध्यान, कविता व योग सत्रों के लिए।",
    bestFor: "ध्यान (Meditation), योग, कविता पाठ, शांतिपूर्ण चिंतन",
    avatarColor: "from-teal-500 to-emerald-600",
  },
  {
    id: "Charon",
    hindiName: "ऋषि (Rishi)",
    englishName: "Charon",
    gender: "male",
    roleHindi: "विद्वान दार्शनिक व इतिहासकार (Deep Scholar)",
    tone: "गंभीर, गहरा व विद्वत्तापूर्ण (Deep & Resonant)",
    samplePhrase: "प्रणाम! मैं ऋषि हूँ। इतिहास, दर्शन और गंभीर ज्ञान के व्याख्यानों के लिए मेरा गहरा स्वर उपयुक्त है।",
    description: "गहरा, भारी और प्रतिष्ठित स्वर। ऐतिहासिक वृत्तचित्र और प्राचीन ग्रंथों के लिए।",
    bestFor: "इतिहास, दर्शनशास्त्र, वृत्तचित्र (Documentary), गीता ज्ञान",
    avatarColor: "from-violet-600 to-purple-800",
  },
];

export interface StylePreset {
  id: string;
  labelHindi: string;
  labelEnglish: string;
  stylePrompt: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "storyteller",
    labelHindi: "📖 स्वाभाविक कथावाचक",
    labelEnglish: "Expressive Storyteller",
    stylePrompt: "A deeply expressive, warm, and natural Hindi storyteller with authentic pauses, narrative rhythm, and lively emotional inflections.",
  },
  {
    id: "motivational",
    labelHindi: "🔥 ओजस्वी व प्रेरक वक्ता",
    labelEnglish: "Inspiring & Energetic Orator",
    stylePrompt: "An inspiring, passionate, and resonant Hindi keynote speaker with clear enunciation, energetic rhythm, and inspiring cadence.",
  },
  {
    id: "meditative",
    labelHindi: "🧘 शांत व आध्यात्मिक ध्यान",
    labelEnglish: "Peaceful & Meditative",
    stylePrompt: "A very calm, gentle, peaceful, and slow-paced Hindi narrator suitable for mindfulness, spiritual reflection, and peaceful guided discourse.",
  },
  {
    id: "news",
    labelHindi: "🎙️ औपचारिक समाचार वाचक",
    labelEnglish: "Formal News Broadcaster",
    stylePrompt: "A professional, articulate, balanced Hindi news broadcaster with crisp Devanagari pronunciation, steady pacing, and dignified tone.",
  },
  {
    id: "conversational",
    labelHindi: "💬 सहज बातचीत व पॉडकास्ट",
    labelEnglish: "Casual Conversational",
    stylePrompt: "A casual, friendly, natural everyday Hindi speaker with a friendly conversational tone, lively spontaneity, and authentic flow.",
  },
  {
    id: "philosophical",
    labelHindi: "📜 गंभीर दार्शनिक व्याख्यान",
    labelEnglish: "Deep Philosophical Scholar",
    stylePrompt: "A deep, reflective, scholarly Hindi discourse speaker with thoughtful pauses on profound insights, reverent and measured.",
  },
];

export const VOCAL_EXPRESSIONS = [
  { token: "।", label: "पूर्ण विराम (Pause)", desc: "स्वाभाविक वाक्य समाप्ति और सांस लेने का ठहराव" },
  { token: "॥", label: "दीर्घ विराम (Long Pause)", desc: "अध्याय या श्लोक के बाद का गहरा ठहराव" },
  { token: "<laugh>", label: "<हंसी> (Laugh)", desc: "स्वाभाविक हल्की हंसी या मुस्कान" },
  { token: "<breath>", label: "<गहरी सांस> (Breath)", desc: "भाषण के बीच गहरी सांस लेना" },
  { token: "<gasp>", label: "<आश्चर्य> (Gasp)", desc: "हैरानी या विस्मय का स्वर" },
  { token: "|हां|", label: "|हां| (Affirmation)", desc: "संवाद में हामी भरना" },
  { token: "|अच्छा|", label: "|अच्छा| (I see)", desc: "स्वाभाविक प्रतिक्रिया" },
];
