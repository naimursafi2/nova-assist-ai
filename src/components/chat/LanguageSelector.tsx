import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Languages } from "lucide-react";
import { supportedLanguages, Language } from "@/lib/languageUtils";

interface LanguageSelectorProps {
  selectedLanguage: string;
  onSelectLanguage: (code: string) => void;
}

export default function LanguageSelector({ selectedLanguage, onSelectLanguage }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const current = supportedLanguages.find((l) => l.code === selectedLanguage) || supportedLanguages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors text-xs"
      >
        <Languages className="w-3.5 h-3.5 text-primary" />
        <span className="font-medium text-foreground hidden sm:inline">{current.flag} {current.name}</span>
        <span className="font-medium text-foreground sm:hidden">{current.flag}</span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              className="absolute right-0 top-full mt-1 z-50 w-52 max-h-[320px] overflow-y-auto scrollbar-thin rounded-xl glass-heavy border border-border float-shadow py-1"
            >
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { onSelectLanguage(lang.code); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                    selectedLanguage === lang.code
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className="text-sm">{lang.flag}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium">{lang.name}</span>
                    {lang.code !== "auto" && (
                      <span className="text-[10px] text-muted-foreground ml-1.5">{lang.nativeName}</span>
                    )}
                  </div>
                  {selectedLanguage === lang.code && <div className="w-1.5 h-1.5 rounded-full gradient-btn" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
