const voices: Record<string, { pitch: number; rate: number }> = {
  almirante: { pitch: 0.72, rate: 1.02 }, canciller: { pitch: 0.92, rate: 0.96 },
  cientifico: { pitch: 1.12, rate: 1.08 }, logistica: { pitch: 0.82, rate: 1 },
  blackops: { pitch: 0.58, rate: 0.88 },
};

export function speak(text: string, agent = "blackops", stopFirst = true) {
  if (!("speechSynthesis" in window)) return;
  if (stopFirst) window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-MX";
  utterance.pitch = voices[agent]?.pitch ?? 1;
  utterance.rate = voices[agent]?.rate ?? 1;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel();
}
