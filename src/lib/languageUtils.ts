export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const supportedLanguages: Language[] = [
  { code: "auto", name: "Auto Detect", nativeName: "Auto", flag: "🌐" },
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "bn", name: "Bangla", nativeName: "বাংলা", flag: "🇧🇩" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰" },
];

// Banglish common patterns
const banglishPatterns: [RegExp, string][] = [
  [/\b(ami|amr|amar)\b/i, "bn"],
  [/\b(tumi|tomar|tomr|tui|tor)\b/i, "bn"],
  [/\b(kemon|kemn|kmon)\b/i, "bn"],
  [/\b(achi|asi|ase|achen)\b/i, "bn"],
  [/\b(koro|kori|korbo|korte)\b/i, "bn"],
  [/\b(bolo|boli|bolbo|bolte)\b/i, "bn"],
  [/\b(jani|jano|janina)\b/i, "bn"],
  [/\b(chai|chao|chaina)\b/i, "bn"],
  [/\b(hobe|hoye|hoyeche)\b/i, "bn"],
  [/\b(dekhi|dekho|dekhao|dekhte)\b/i, "bn"],
  [/\b(bhai|dada|apa|didi)\b/i, "bn"],
  [/\b(kothay|kotha|keno|ki|ke)\b/i, "bn"],
  [/\b(dao|din|dite|dibo)\b/i, "bn"],
  [/\b(bol|bolo|bolen)\b/i, "bn"],
  [/\b(likhte|likhi|likho|lekha)\b/i, "bn"],
  [/\b(bujai|bujhi|bujhao|bujhte)\b/i, "bn"],
  [/\b(shikhi|shekh|shikhte|shikha)\b/i, "bn"],
  [/\b(dhonnobad|dhonyobad)\b/i, "bn"],
  [/\b(accha|thik|ache|nai)\b/i, "bn"],
  [/\b(pari|parbo|parbe)\b/i, "bn"],
];

// Hindi transliteration patterns
const hindiPatterns: [RegExp, string][] = [
  [/\b(kya|kaise|kaisa)\b/i, "hi"],
  [/\b(mujhe|mera|meri|mere)\b/i, "hi"],
  [/\b(tumhara|tumhari|aapka)\b/i, "hi"],
  [/\b(karo|karna|karenge)\b/i, "hi"],
  [/\b(hain|hai|tha|thi)\b/i, "hi"],
  [/\b(yeh|woh|yahan|wahan)\b/i, "hi"],
  [/\b(achha|theek|nahi)\b/i, "hi"],
  [/\b(dhanyavaad|shukriya)\b/i, "hi"],
  [/\b(samjhao|batao|bataiye)\b/i, "hi"],
];

// Unicode range detection
const scriptRanges: [RegExp, string][] = [
  [/[\u0980-\u09FF]/, "bn"],       // Bengali
  [/[\u0900-\u097F]/, "hi"],       // Devanagari
  [/[\u0600-\u06FF]/, "ar"],       // Arabic
  [/[\u4E00-\u9FFF]/, "zh"],       // Chinese
  [/[\u3040-\u309F\u30A0-\u30FF]/, "ja"], // Japanese
  [/[\uAC00-\uD7AF]/, "ko"],      // Korean
  [/[\u0400-\u04FF]/, "ru"],       // Cyrillic
  [/[\u0C00-\u0C7F]/, "te"],       // Telugu
  [/[\u0B80-\u0BFF]/, "ta"],       // Tamil
];

// Spanish/French/Portuguese patterns
const latinLangPatterns: [RegExp, string][] = [
  [/\b(qué|cómo|dónde|por qué|está|tiene|puede|hacer|también|pero|porque)\b/i, "es"],
  [/\b(qu'est|c'est|je suis|vous|nous|dans|avec|pour|faire|être|avoir)\b/i, "fr"],
  [/\b(você|como|porque|também|fazer|está|pode|isso|aqui|muito)\b/i, "pt"],
  [/\b(ich|und|ist|das|ein|nicht|auf|mit|werden|haben|auch)\b/i, "de"],
  [/\b(bir|ve|bu|için|ile|olan|var|gibi|daha|çok)\b/i, "tr"],
];

export function detectLanguage(text: string): { code: string; name: string; flag: string; confidence: number; isBanglish?: boolean } {
  if (!text || text.trim().length === 0) {
    return { code: "en", name: "English", flag: "🇬🇧", confidence: 0 };
  }

  const cleaned = text.trim();

  // Check unicode scripts first (most reliable)
  for (const [regex, code] of scriptRanges) {
    if (regex.test(cleaned)) {
      const lang = supportedLanguages.find((l) => l.code === code);
      return {
        code,
        name: lang?.name || code,
        flag: lang?.flag || "🌐",
        confidence: 0.95,
      };
    }
  }

  // Check Banglish patterns
  let banglishScore = 0;
  for (const [regex] of banglishPatterns) {
    if (regex.test(cleaned)) banglishScore++;
  }
  if (banglishScore >= 2) {
    return { code: "bn", name: "Bangla (Banglish)", flag: "🇧🇩", confidence: 0.8, isBanglish: true };
  }

  // Check Hindi transliteration
  let hindiScore = 0;
  for (const [regex] of hindiPatterns) {
    if (regex.test(cleaned)) hindiScore++;
  }
  if (hindiScore >= 2) {
    return { code: "hi", name: "Hindi (Romanized)", flag: "🇮🇳", confidence: 0.75 };
  }

  // Check Latin-script languages
  for (const [regex, code] of latinLangPatterns) {
    if (regex.test(cleaned)) {
      const lang = supportedLanguages.find((l) => l.code === code);
      return { code, name: lang?.name || code, flag: lang?.flag || "🌐", confidence: 0.7 };
    }
  }

  // Default to English
  return { code: "en", name: "English", flag: "🇬🇧", confidence: 0.5 };
}

// Mock multilingual responses
const multilingualResponses: Record<string, string[]> = {
  bn: [
    "অবশ্যই! আমি আপনাকে সাহায্য করতে পারি।\n\nএখানে কিছু গুরুত্বপূর্ণ বিষয় রয়েছে:\n\n1. **মূল ধারণা বুঝুন** — প্রথমে ভিত্তি তৈরি করুন\n2. **নিয়মিত অনুশীলন করুন** — ধারাবাহিকতা সাফল্যের চাবিকাঠি\n3. **প্রকল্পে কাজ করুন** — যা শিখেছেন তা প্রয়োগ করুন\n\nআরও কিছু জানতে চান?",
    "আপনার প্রশ্নটি খুবই ভালো! চলুন বিস্তারিত আলোচনা করি:\n\n## মূল পয়েন্ট\n- **গুণগত মান** এর উপর জোর দিন\n- আধুনিক টুলস ব্যবহার করুন\n- শেখা চালিয়ে যান\n\nআর কিছু জিজ্ঞাসা আছে?",
  ],
  hi: [
    "बिल्कुल! मैं आपकी मदद कर सकता हूँ।\n\nयहाँ कुछ महत्वपूर्ण बातें हैं:\n\n1. **बुनियादी बातें समझें** — पहले नींव मजबूत करें\n2. **नियमित अभ्यास करें** — निरंतरता सफलता की कुंजी है\n3. **प्रोजेक्ट्स बनाएं** — जो सीखा है उसे लागू करें\n\nक्या आप और जानना चाहेंगे?",
    "बहुत अच्छा सवाल! आइए विस्तार से देखते हैं:\n\n## मुख्य बिंदु\n- **गुणवत्ता** पर ध्यान दें\n- आधुनिक उपकरणों का उपयोग करें\n- सीखते रहें और अनुकूलन करें\n\nकोई और सवाल?",
  ],
  ar: [
    "بالتأكيد! يمكنني مساعدتك في ذلك.\n\nإليك بعض النقاط المهمة:\n\n1. **افهم الأساسيات** — ابدأ بالقواعد الأساسية\n2. **مارس بانتظام** — الاستمرارية هي مفتاح النجاح\n3. **ابنِ مشاريع** — طبّق ما تعلمته\n\nهل تريد المزيد من التفاصيل؟",
  ],
  es: [
    "¡Por supuesto! Puedo ayudarte con eso.\n\nAquí hay algunos puntos clave:\n\n1. **Comprende los fundamentos** — primero construye una base sólida\n2. **Practica regularmente** — la constancia es la clave del éxito\n3. **Construye proyectos** — aplica lo que has aprendido\n\n¿Te gustaría que profundice en alguno de estos puntos?",
  ],
  fr: [
    "Absolument ! Je peux vous aider avec cela.\n\nVoici quelques points importants :\n\n1. **Comprenez les bases** — construisez d'abord une fondation solide\n2. **Pratiquez régulièrement** — la constance est la clé du succès\n3. **Construisez des projets** — appliquez ce que vous avez appris\n\nVoulez-vous que j'approfondisse l'un de ces points ?",
  ],
  zh: [
    "当然！我可以帮助你。\n\n以下是一些关键要点：\n\n1. **理解基础** — 首先建立扎实的基础\n2. **定期练习** — 坚持是成功的关键\n3. **构建项目** — 应用所学知识\n\n需要我详细解释哪个方面吗？",
  ],
};

export function getMultilingualResponse(langCode: string, isBanglish?: boolean): string {
  // Banglish gets Bangla response
  const code = isBanglish ? "bn" : langCode;
  const responses = multilingualResponses[code];
  if (responses && responses.length > 0) {
    return responses[Math.floor(Math.random() * responses.length)];
  }
  // Fallback to English
  return "";
}

export function getLanguageByCode(code: string): Language {
  return supportedLanguages.find((l) => l.code === code) || supportedLanguages[0];
}
