/**
 * Reads lines aloud. Behind this small surface so a native (Capacitor) voice can replace the
 * browser one later without touching the screens.
 */
export interface Voice {
  readonly isAvailable: boolean;
  readonly say: (text: string) => void;
  readonly stop: () => void;
}

function pickVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  const voices = synth.getVoices().filter((voice) => voice.lang.startsWith('en'));
  return voices.find((voice) => voice.localService && voice.default) ?? voices.find((voice) => voice.localService) ?? voices[0] ?? null;
}

export function createBrowserVoice(): Voice {
  const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  return {
    isAvailable: synth !== null,
    say: (text) => {
      if (!synth) return;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(synth);
      if (voice) utterance.voice = voice;
      utterance.rate = 1.02;
      synth.speak(utterance);
    },
    stop: () => {
      synth?.cancel();
    },
  };
}
