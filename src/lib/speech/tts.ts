import { AgentProfile } from "@/types/warRoom";

export interface SpeechLine {
  text: string;
  profile: AgentProfile;
}

export function speak(text: string, profile?: AgentProfile, stopFirst = true) {
  if (!("speechSynthesis" in window)) return;
  if (stopFirst) window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-MX";
  utterance.pitch = profile?.pitch ?? 1;
  utterance.rate = profile?.rate ?? 1;
  if (profile?.voiceURI) {
    const voice = window.speechSynthesis.getVoices().find(item => item.voiceURI === profile.voiceURI);
    if (voice) utterance.voice = voice;
  }
  window.speechSynthesis.speak(utterance);
}

export function speakQueue(lines: SpeechLine[]) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const queue = [...lines];
  const next = () => {
    const line = queue.shift();
    if (!line) return;
    const utterance = new SpeechSynthesisUtterance(line.text);
    utterance.lang = "es-MX";
    utterance.pitch = line.profile.pitch;
    utterance.rate = line.profile.rate;
    const voice = window.speechSynthesis.getVoices().find(item => item.voiceURI === line.profile.voiceURI);
    if (voice) utterance.voice = voice;
    utterance.onend = next;
    window.speechSynthesis.speak(utterance);
  };
  next();
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}
