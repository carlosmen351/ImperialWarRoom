import { AgentProfile } from "@/types/warRoom";
import { GOOGLE_TTS_VOICES } from "@/lib/speech/voices";

export interface SpeechLine {
  text: string;
  profile: AgentProfile;
  ttsApiKey: string;
}

let playbackId = 0;
let activeAudio: HTMLAudioElement | null = null;
let activeObjectUrl: string | null = null;
let activeRequest: AbortController | null = null;
let queuedLines: SpeechLine[] = [];
let queuePlaybackId: number | null = null;
let lastAnnouncedTtsError = "";

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
  queuedLines = [];
  queuePlaybackId = null;
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

async function playCloud(text: string, voiceId: AgentProfile["voiceId"], ttsApiKey: string, id: number) {
  if (!ttsApiKey || !text || id !== playbackId || typeof Audio === "undefined") return false;
  const voice = GOOGLE_TTS_VOICES.find(item => item.id === voiceId) || GOOGLE_TTS_VOICES[0];

  const controller = new AbortController();
  activeRequest = controller;
  try {
    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(ttsApiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: voice.languageCode, name: voice.name, ssmlGender: voice.ssmlGender },
        audioConfig: { audioEncoding: "MP3" },
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      let message = body;
      try {
        const payload = JSON.parse(body) as { error?: { message?: unknown } };
        if (typeof payload.error?.message === "string") message = payload.error.message;
      } catch {
        // Keep Google's raw response body when it is not JSON.
      }
      throw new Error(message || `Google Cloud TTS respondió HTTP ${response.status}`);
    }
    const result = await response.json() as { audioContent?: string };
    if (!result.audioContent) throw new Error("TTS no devolvió audio");
    if (id !== playbackId) return true;

    lastAnnouncedTtsError = "";
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
    if (!controller.signal.aborted && id === playbackId) {
      const message = error instanceof Error ? error.message : String(error);
      if (message !== lastAnnouncedTtsError) {
        lastAnnouncedTtsError = message;
        window.alert(message);
      }
    }
    return false;
  } finally {
    if (activeRequest === controller) activeRequest = null;
  }
}

async function playLine(text: string, profile: AgentProfile | undefined, ttsApiKey: string, id: number) {
  const cleanedText = cleanSpeechText(text);
  if (!cleanedText || id !== playbackId) return;
  const voice = GOOGLE_TTS_VOICES.find(item => item.id === profile?.voiceId) || GOOGLE_TTS_VOICES[0];
  const played = await playCloud(cleanedText, voice.id, ttsApiKey, id);
  if (!played && id === playbackId) playNative(cleanedText, voice.languageCode, id);
}

export function speak(text: string, profile: AgentProfile, ttsApiKey: string, stopFirst = true) {
  const id = stopFirst ? stopCurrentPlayback() : playbackId;
  void playLine(text, profile, ttsApiKey, id);
}

export function speakQueue(lines: SpeechLine[]) {
  stopCurrentPlayback();
  queuedLines = [...lines];
  startQueue(playbackId);
}

export function enqueueSpeech(line: SpeechLine) {
  queuedLines.push(line);
  if (queuePlaybackId === null) startQueue(playbackId);
}

function startQueue(id: number) {
  if (queuePlaybackId === id) return;
  queuePlaybackId = id;
  const next = async () => {
    if (id !== playbackId) return;
    const line = queuedLines.shift();
    if (!line) {
      queuePlaybackId = null;
      return;
    }
    const text = cleanSpeechText(line.text);
    if (!text) {
      void next();
      return;
    }
    const voice = GOOGLE_TTS_VOICES.find(item => item.id === line.profile.voiceId) || GOOGLE_TTS_VOICES[0];
    const played = await playCloud(text, voice.id, line.ttsApiKey, id);
    if (id !== playbackId) return;
    if (played || !("speechSynthesis" in window)) {
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
