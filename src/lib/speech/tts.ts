import { AgentProfile, ProviderConfig } from "@/types/warRoom";

export interface SpeechLine {
  text: string;
  profile: AgentProfile;
  config: ProviderConfig;
}

let playbackId = 0;
let activeAudio: HTMLAudioElement | null = null;
let activeObjectUrl: string | null = null;
let activeRequest: AbortController | null = null;

function cleanSpeechText(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/^\s{0,3}(?:#{1,6}\s|[-*+]\s|\d+\.\s)/gm, "")
    .replace(/[*_~`>#|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stopCurrentPlayback() {
  playbackId += 1;
  activeRequest?.abort();
  activeRequest = null;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.removeAttribute("src");
    activeAudio.load();
    activeAudio = null;
  }
  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }
  return playbackId;
}

function playNative(text: string, profile?: AgentProfile, id = playbackId) {
  if (!("speechSynthesis" in window) || !text || id !== playbackId) return;
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

async function playCloud(text: string, profile: AgentProfile | undefined, config: ProviderConfig | undefined, id: number) {
  const apiKey = config?.googleTtsApiKey.trim() || (config?.provider === "gemini" ? config.apiKey.trim() : "");
  if (!apiKey || !text || id !== playbackId || typeof Audio === "undefined") return false;

  const controller = new AbortController();
  activeRequest = controller;
  try {
    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "es-US", name: profile?.cloudVoiceName || "es-US-Neural2-B" },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: profile?.rate ?? 1.05,
          pitch: ((profile?.pitch ?? 1) - 1) * 3,
        },
      }),
    });
    if (!response.ok) throw new Error(`TTS respondió HTTP ${response.status}`);
    const result = await response.json() as { audioContent?: string };
    if (!result.audioContent) throw new Error("TTS no devolvió audio");
    if (id !== playbackId) return true;

    const binary = atob(result.audioContent);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    activeObjectUrl = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
    const audio = new Audio(activeObjectUrl);
    activeAudio = audio;
    return await new Promise<boolean>(resolve => {
      const finish = (played: boolean) => {
        audio.onended = null;
        audio.onerror = null;
        if (activeAudio === audio) activeAudio = null;
        if (activeObjectUrl) {
          URL.revokeObjectURL(activeObjectUrl);
          activeObjectUrl = null;
        }
        resolve(played);
      };
      audio.onended = () => finish(true);
      audio.onerror = () => finish(false);
      audio.play().catch(() => finish(false));
    });
  } catch (error) {
    if (!controller.signal.aborted) console.warn("Google Cloud TTS falló; se usará la voz del navegador.", error);
    return false;
  } finally {
    if (activeRequest === controller) activeRequest = null;
  }
}

async function playLine(text: string, profile: AgentProfile | undefined, config: ProviderConfig | undefined, id: number) {
  const cleanedText = cleanSpeechText(text);
  if (!cleanedText || id !== playbackId) return;
  const played = await playCloud(cleanedText, profile, config, id);
  if (!played && id === playbackId) playNative(cleanedText, profile, id);
}

export function speak(text: string, profile?: AgentProfile, config?: ProviderConfig, stopFirst = true) {
  const id = stopFirst ? stopCurrentPlayback() : playbackId;
  void playLine(text, profile, config, id);
}

export function speakQueue(lines: SpeechLine[]) {
  const id = stopCurrentPlayback();
  const queue = [...lines];
  const next = async () => {
    if (id !== playbackId) return;
    const line = queue.shift();
    if (!line) return;
    const text = cleanSpeechText(line.text);
    if (!text) {
      void next();
      return;
    }
    const played = await playCloud(text, line.profile, line.config, id);
    if (id !== playbackId) return;
    if (played) {
      void next();
      return;
    }
    if (!("speechSynthesis" in window)) {
      void next();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-MX";
    utterance.pitch = line.profile.pitch;
    utterance.rate = line.profile.rate;
    const voice = window.speechSynthesis.getVoices().find(item => item.voiceURI === line.profile.voiceURI);
    if (voice) utterance.voice = voice;
    utterance.onend = () => { void next(); };
    utterance.onerror = () => { void next(); };
    window.speechSynthesis.speak(utterance);
  };
  void next();
}

export function stopSpeaking() {
  stopCurrentPlayback();
}
