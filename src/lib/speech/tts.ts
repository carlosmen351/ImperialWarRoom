import { AgentProfile } from "@/types/warRoom";
import { GOOGLE_TTS_VOICES } from "@/lib/speech/voices";

export interface SpeechLine {
  text: string;
  profile: AgentProfile;
  apiKey: string;
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

function playNative(text: string, languageCode: string, id = playbackId) {
  if (!("speechSynthesis" in window) || !text || id !== playbackId) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = languageCode;
  window.speechSynthesis.speak(utterance);
}

async function playCloud(text: string, voiceId: AgentProfile["voiceId"], apiKey: string, id: number) {
  if (!apiKey || !text || id !== playbackId || typeof Audio === "undefined") return false;
  const voice = GOOGLE_TTS_VOICES.find(item => item.id === voiceId) || GOOGLE_TTS_VOICES[0];

  const controller = new AbortController();
  activeRequest = controller;
  try {
    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: voice.languageCode, name: voice.name },
        audioConfig: { audioEncoding: "MP3" },
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
  } catch {
    return false;
  } finally {
    if (activeRequest === controller) activeRequest = null;
  }
}

async function playLine(text: string, profile: AgentProfile | undefined, apiKey: string, id: number) {
  const cleanedText = cleanSpeechText(text);
  if (!cleanedText || id !== playbackId) return;
  const voice = GOOGLE_TTS_VOICES.find(item => item.id === profile?.voiceId) || GOOGLE_TTS_VOICES[0];
  const played = await playCloud(cleanedText, voice.id, apiKey, id);
  if (!played && id === playbackId) playNative(cleanedText, voice.languageCode, id);
}

export function speak(text: string, profile: AgentProfile, apiKey: string, stopFirst = true) {
  const id = stopFirst ? stopCurrentPlayback() : playbackId;
  void playLine(text, profile, apiKey, id);
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
    const voice = GOOGLE_TTS_VOICES.find(item => item.id === line.profile.voiceId) || GOOGLE_TTS_VOICES[0];
    const played = await playCloud(text, voice.id, line.apiKey, id);
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
    utterance.lang = voice.languageCode;
    utterance.onend = () => { void next(); };
    utterance.onerror = () => { void next(); };
    window.speechSynthesis.speak(utterance);
  };
  void next();
}

export function stopSpeaking() {
  stopCurrentPlayback();
}
