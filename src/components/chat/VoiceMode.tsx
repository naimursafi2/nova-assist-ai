import { motion } from "framer-motion";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { useState } from "react";

interface VoiceModeProps {
  onTranscript: (text: string) => void;
}

export default function VoiceMode({ onTranscript }: VoiceModeProps) {
  const [listening, setListening] = useState(false);

  const toggleListening = () => {
    if (listening) {
      setListening(false);
      // Simulate transcription
      setTimeout(() => onTranscript("Tell me about the latest AI developments"), 300);
    } else {
      setListening(true);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleListening}
        className={`p-2 rounded-lg transition-all ${
          listening
            ? "bg-destructive/10 text-destructive animate-pulse"
            : "hover:bg-muted text-muted-foreground"
        }`}
        title={listening ? "Stop recording" : "Voice input"}
      >
        {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>

      {listening && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-xl glass-heavy border border-border float-shadow"
        >
          <div className="flex items-center gap-1.5">
            <div className="flex items-end gap-[2px] h-5">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full gradient-btn"
                  animate={{ height: [4, Math.random() * 16 + 4, 4] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground ml-1">Listening...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export function SpeakButton({ content }: { content: string }) {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = () => {
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.onend = () => setSpeaking(false);
      speechSynthesis.speak(utterance);
      setSpeaking(true);
    }
  };

  return (
    <button
      onClick={handleSpeak}
      className={`p-1 rounded hover:bg-muted transition-colors ${speaking ? "text-primary" : "text-muted-foreground"}`}
      title={speaking ? "Stop" : "Read aloud"}
    >
      <Volume2 className="w-3 h-3" />
    </button>
  );
}
