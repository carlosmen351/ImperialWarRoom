"use client";

import { useEffect, useRef, useState } from "react";
import CabinetFeed from "@/components/CabinetFeed";
import TacticalControls from "@/components/TacticalControls";
import MemoryDrawer from "@/components/MemoryDrawer";
import SettingsModal from "@/components/SettingsModal";
import { loadWarRoom, saveWarRoom } from "@/lib/storage";
import { compressImage } from "@/lib/providers/imageCompressor";
import { runCabinet, runBlackOps, updateMemory } from "@/lib/agents/orchestrator";
import { createSpeechRecognition, SpeechRecognitionInstance } from "@/lib/speech/stt";
import { stopSpeaking } from "@/lib/speech/tts";
import { ProviderConfig, TurnMessage } from "@/types/warRoom";

export default function Home() {
  const [state, setState] = useState(() => loadWarRoom());
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [image, setImage] = useState<string>();
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const voiceTextRef = useRef("");

  useEffect(() => saveWarRoom(state), [state]);
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const basePath = process.env.NODE_ENV === "production" ? "/ImperialWarRoom" : "";
      navigator.serviceWorker.register(`${basePath}/sw.js`).catch(() => undefined);
    }
  }, []);

  const addMessage = (message: TurnMessage) => setState(current => ({ ...current, history: [...current.history, message].slice(-60) }));

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    const attached = image;
    addMessage({ id: crypto.randomUUID(), role: "user", content: text, image: attached, createdAt: Date.now() });
    setImage(undefined); setBusy(true);
    try {
      if (/^actualiza(?:r)? la ficha:/i.test(text)) {
        const updated = await updateMemory(state.config, state.gameMemory, text, attached);
        setState(current => ({ ...current, gameMemory: updated || current.gameMemory }));
        addMessage({ id: crypto.randomUUID(), role: "memoryUpdater", content: "Ficha de memoria actualizada.", createdAt: Date.now() });
      } else {
        const cabinet = await runCabinet(state.config, state.gameMemory, state.history, text, attached);
        cabinet.forEach(result => addMessage({ id: crypto.randomUUID(), role: result.id, content: result.content, createdAt: Date.now() }));
        const blackOps = await runBlackOps(state.config, state.gameMemory, state.history, text, cabinet, attached);
        addMessage({ id: crypto.randomUUID(), role: "blackops", content: blackOps.content, createdAt: Date.now() });
      }
    } finally { setBusy(false); }
  };

  const handleImage = async (file: File) => { try { setImage(await compressImage(file)); } catch (error) { alert(error instanceof Error ? error.message : "No se pudo cargar la imagen."); } };
  const startVoice = () => {
    if (!recognitionRef.current) recognitionRef.current = createSpeechRecognition();
    const recognition = recognitionRef.current;
    if (!recognition) { alert("Reconocimiento de voz no disponible. Usa el teclado."); return; }
    voiceTextRef.current = "";
    recognition.onresult = event => { let transcript = ""; for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript; voiceTextRef.current = transcript; };
    recognition.onerror = event => { if (event.error !== "aborted") alert(`Voz: ${event.error}`); };
    recognition.start();
  };
  const stopVoice = () => { recognitionRef.current?.stop(); setTimeout(() => { if (voiceTextRef.current.trim()) send(voiceTextRef.current.trim()); }, 120); };
  const setConfig = (config: ProviderConfig) => setState(current => ({ ...current, config }));
  const setMemory = (gameMemory: string) => setState(current => ({ ...current, gameMemory }));
  const exportState = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "imperial-war-room.json"; anchor.click();
    URL.revokeObjectURL(url);
  };
  const importState = async (file: File) => {
    try {
      const imported = JSON.parse(await file.text()) as typeof state;
      if (!imported.gameMemory || !imported.config || !Array.isArray(imported.history)) throw new Error("Formato inválido.");
      setState({ ...state, ...imported, config: { ...state.config, ...imported.config } });
    } catch (error) { alert(error instanceof Error ? error.message : "No se pudo importar la partida."); }
  };

  return <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#05070a] text-slate-100">
    <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-slate-800 bg-[#080b10] px-3">
      <div className="min-w-0"><p className="text-[9px] tracking-[0.22em] text-sky-500">SALA DE GUERRA</p><h1 className="truncate text-sm font-bold">{state.gameTitle} · 2265</h1></div>
      <div className="flex gap-1"><button onClick={() => setMemoryOpen(true)} className="h-9 rounded-lg border border-slate-700 px-2 text-sm">📋</button><button onClick={() => { setTtsEnabled(value => !value); if (ttsEnabled) stopSpeaking(); }} className="h-9 rounded-lg border border-slate-700 px-2 text-sm">{ttsEnabled ? "🔊" : "🔇"}</button><button onClick={() => setSettingsOpen(true)} className="h-9 rounded-lg border border-slate-700 px-2 text-sm">⚙</button></div>
    </header>
    {image && <div className="absolute left-3 top-[66px] z-20 flex items-center gap-2 rounded-lg border border-sky-500/30 bg-slate-950 p-1"><img src={image} alt="Vista previa" className="h-12 w-12 rounded object-cover"/><button onClick={() => setImage(undefined)} className="h-7 w-7 text-sm">×</button></div>}
    <CabinetFeed messages={state.history} busy={busy} />
    <TacticalControls busy={busy} onSend={send} onImage={handleImage} onStartVoice={startVoice} onStopVoice={stopVoice} />
    <MemoryDrawer open={memoryOpen} memory={state.gameMemory} onClose={() => setMemoryOpen(false)} onSave={setMemory} onUpdateVoice={text => send(text)} onExport={exportState} onImport={importState} />
    <SettingsModal open={settingsOpen} config={state.config} onClose={() => setSettingsOpen(false)} onChange={setConfig} />
  </div>;
}
