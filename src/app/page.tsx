"use client";

import { useEffect, useRef, useState } from "react";
import CabinetFeed from "@/components/CabinetFeed";
import TacticalControls from "@/components/TacticalControls";
import MemoryDrawer from "@/components/MemoryDrawer";
import SettingsModal from "@/components/SettingsModal";
import EmpireSetupModal from "@/components/EmpireSetupModal";
import CabinetDossiersModal from "@/components/CabinetDossiersModal";
import { loadWarRoom, saveWarRoom, createDefaultWarRoom, DEFAULT_EMPIRE_PROFILE } from "@/lib/storage";
import { compressImage } from "@/lib/providers/imageCompressor";
import { runCabinet, runBlackOps } from "@/lib/agents/orchestrator";
import { createSpeechRecognition, SpeechRecognitionInstance } from "@/lib/speech/stt";
import { speak, speakQueue, stopSpeaking } from "@/lib/speech/tts";
import { AgentId, TimelineEvent, TurnMessage } from "@/types/warRoom";
import Image from "next/image";

const agentOrder: Exclude<AgentId, "memoryUpdater">[] = ["almirante", "canciller", "cientifico", "logistica", "blackops"];

function summarize(text: string) {
  const firstLine = text.trim().split(/\n|(?<=[.!?])\s/)[0] || text.trim();
  return firstLine.length > 180 ? `${firstLine.slice(0, 177)}...` : firstLine;
}

export default function Home() {
  const [state, setState] = useState(() => createDefaultWarRoom());
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState("");
  const storageErrorRef = useRef("");
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dossiersOpen, setDossiersOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [newEmpire, setNewEmpire] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [image, setImage] = useState<string>();
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const voiceTextRef = useRef("");

  useEffect(() => {
    const savedState = loadWarRoom();
    queueMicrotask(() => {
      setState(savedState);
      setSetupOpen(!savedState.empireProfile.empireName);
      setHydrated(true);
    });
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      saveWarRoom(state);
      if (storageErrorRef.current) {
        storageErrorRef.current = "";
        queueMicrotask(() => setStorageError(""));
      }
    } catch (error) {
      const message = error instanceof Error ? `No se pudo guardar en este dispositivo: ${error.message}` : "No se pudo guardar en este dispositivo.";
      storageErrorRef.current = message;
      queueMicrotask(() => setStorageError(message));
    }
  }, [state, hydrated]);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/ImperialWarRoom/sw.js").catch(error => console.error("No se pudo registrar el Service Worker de Imperial War Room.", error));
  }, []);

  const addMessage = (message: TurnMessage) => setState(current => ({ ...current, history: [...current.history, message].slice(-60) }));

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    const attached = image;
    const userMessage: TurnMessage = { id: crypto.randomUUID(), role: "user", content: text, image: attached, createdAt: Date.now() };
    const historyBeforeTurn = state.history;
    setState(current => ({ ...current, history: [...current.history, userMessage].slice(-60) }));
    setImage(undefined);
    setBusy(true);
    try {
      const cabinet = await runCabinet(state.config, state.empireProfile, state.timeline, historyBeforeTurn, text, attached, state.agentProfiles);
      cabinet.forEach(result => addMessage({ id: crypto.randomUUID(), role: result.id, content: result.content, createdAt: Date.now() }));
      const blackOps = await runBlackOps(state.config, state.empireProfile, state.timeline, historyBeforeTurn, text, cabinet, attached, state.agentProfiles);
      const blackOpsResult = { ...blackOps, id: "blackops" as const };
      addMessage({ id: crypto.randomUUID(), role: blackOpsResult.id, content: blackOpsResult.content, createdAt: Date.now() });

      const resultById = new Map([...cabinet, blackOpsResult].map(result => [result.id, result.content]));
      const event: TimelineEvent = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        eventSummary: text.trim().length > 260 ? `${text.trim().slice(0, 257)}...` : text.trim(),
        cabinetOptions: agentOrder.map(agentId => ({ agentId, stance: summarize(resultById.get(agentId) || "Sin postura disponible.") })),
        finalDecision: "Pendiente de veredicto",
      };
      setState(current => ({ ...current, timeline: [...current.timeline, event] }));

      if (ttsEnabled) {
        speakQueue(agentOrder.map(agentId => ({
          text: `${state.agentProfiles[agentId].displayName}. ${resultById.get(agentId) || ""}`,
          profile: state.agentProfiles[agentId],
        })));
      }
    } finally { setBusy(false); }
  };

  const handleImage = async (file: File) => {
    try { setImage(await compressImage(file)); }
    catch (error) { alert(error instanceof Error ? error.message : "No se pudo cargar la imagen."); }
  };
  const startVoice = () => {
    if (!recognitionRef.current) recognitionRef.current = createSpeechRecognition();
    const recognition = recognitionRef.current;
    if (!recognition) { alert("Reconocimiento de voz no disponible. Usa el teclado."); return; }
    voiceTextRef.current = "";
    recognition.onresult = event => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript;
      voiceTextRef.current = transcript;
    };
    recognition.onerror = event => { if (event.error !== "aborted") alert(`Voz: ${event.error}`); };
    recognition.start();
  };
  const stopVoice = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.onend = () => {
      if (voiceTextRef.current.trim()) send(voiceTextRef.current.trim());
      recognition.onend = null;
    };
    recognition.stop();
  };
  const setDecision = (eventId: string, finalDecision: string) => setState(current => ({
    ...current,
    timeline: current.timeline.map(event => event.id === eventId ? { ...event, finalDecision } : event),
  }));
  const saveEmpire = (empireProfile: typeof state.empireProfile) => {
    setState(current => ({ ...current, gameTitle: empireProfile.empireName || "Nuevo Imperio", empireProfile, timeline: [], history: [] }));
    setNewEmpire(false);
  };
  const startNewEmpire = () => {
    stopSpeaking();
    setNewEmpire(true);
    setSetupOpen(true);
  };
  const exportState = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "imperial-war-room.json"; anchor.click();
    URL.revokeObjectURL(url);
  };
  const importState = async (file: File) => {
    try {
      const imported = JSON.parse(await file.text()) as Partial<typeof state> & { gameMemory?: unknown };
      if (!Array.isArray(imported.history) || !imported.config) throw new Error("El archivo no contiene un guardado compatible de Imperial War Room.");
      if (imported.timeline && (!Array.isArray(imported.timeline) || !imported.timeline.every(event => event && typeof event.id === "string" && typeof event.timestamp === "string" && typeof event.eventSummary === "string" && typeof event.finalDecision === "string" && Array.isArray(event.cabinetOptions)))) throw new Error("La línea del tiempo del archivo tiene un formato inválido.");
      if (!imported.empireProfile && typeof imported.gameMemory !== "string") throw new Error("El archivo no incluye la Constitución del Imperio ni un guardado beta compatible.");
      localStorage.setItem("imperial-war-room-v1", JSON.stringify(imported));
      setState(loadWarRoom());
      if (!imported.empireProfile) setSetupOpen(true);
    } catch (error) { alert(error instanceof Error ? error.message : "No se pudo importar la partida."); }
  };
  const isNewProfile = !state.empireProfile.empireName;

  return <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#05070a] text-slate-100">
    <header className="flex min-h-[58px] shrink-0 items-center justify-between gap-2 border-b border-slate-800 bg-[#080b10] px-3">
      <div className="min-w-0"><p className="text-[9px] tracking-[0.22em] text-sky-500">SALA DE GUERRA</p><h1 className="truncate text-sm font-bold">{state.empireProfile.empireName || state.gameTitle}</h1></div>
      <div className="flex shrink-0 gap-1">
        <button onClick={startNewEmpire} aria-label="Nuevo Imperio / Setup" className="h-9 rounded-lg border border-sky-500/30 px-2 text-[10px] font-bold text-sky-200"><span className="sm:hidden">Nuevo</span><span className="hidden sm:inline">Nuevo Imperio</span></button>
        <button onClick={() => setMemoryOpen(true)} className="h-9 rounded-lg border border-slate-700 px-2 text-sm" aria-label="Constitución y cronología">📋</button>
        <button onClick={() => setDossiersOpen(true)} className="h-9 rounded-lg border border-slate-700 px-2 text-xs" aria-label="Abrir gabinete">🪪 Gabinete</button>
        <button onClick={() => { setTtsEnabled(value => !value); if (ttsEnabled) stopSpeaking(); }} className="h-9 rounded-lg border border-slate-700 px-2 text-sm" aria-label="Alternar lectura automática">{ttsEnabled ? "🔊" : "🔇"}</button>
        <button onClick={() => setSettingsOpen(true)} className="h-9 rounded-lg border border-slate-700 px-2 text-sm" aria-label="Ajustes">⚙</button>
      </div>
    </header>
    {image && <div className="absolute left-3 top-[66px] z-20 flex items-center gap-2 rounded-lg border border-sky-500/30 bg-slate-950 p-1"><Image src={image} alt="Vista previa" width={48} height={48} unoptimized className="h-12 w-12 rounded object-cover"/><button onClick={() => setImage(undefined)} className="h-7 w-7 text-sm">×</button></div>}
    {storageError && <p role="alert" className="absolute left-2 right-2 top-[62px] z-20 rounded-lg border border-amber-500/30 bg-amber-950/90 p-2 text-xs text-amber-200">{storageError}</p>}
    <CabinetFeed messages={state.history} busy={busy} profiles={state.agentProfiles}/>
    <TacticalControls busy={busy} onSend={send} onImage={handleImage} onStartVoice={startVoice} onStopVoice={stopVoice}/>
    <MemoryDrawer open={memoryOpen} profile={state.empireProfile} timeline={state.timeline} agentProfiles={state.agentProfiles} onClose={() => setMemoryOpen(false)} onProfileChange={empireProfile => setState(current => ({ ...current, empireProfile, gameTitle: empireProfile.empireName || current.gameTitle }))} onDecisionChange={setDecision}/>
    <SettingsModal open={settingsOpen} config={state.config} onClose={() => setSettingsOpen(false)} onChange={config => setState(current => ({ ...current, config }))} onExport={exportState} onImport={file => void importState(file)}/>
    <CabinetDossiersModal open={dossiersOpen} profiles={state.agentProfiles} onClose={() => setDossiersOpen(false)} onChange={agentProfiles => setState(current => ({ ...current, agentProfiles }))} onTestVoice={profile => speak(`Prueba de voz para ${profile.displayName}.`, profile)}/>
    <EmpireSetupModal key={newEmpire ? "new" : isNewProfile ? "initial" : "edit"} open={setupOpen} initialProfile={newEmpire || isNewProfile ? DEFAULT_EMPIRE_PROFILE : state.empireProfile} config={state.config} onConfigureProvider={() => { setSetupOpen(false); setSettingsOpen(true); }} onClose={() => { setSetupOpen(false); setNewEmpire(false); }} onSave={saveEmpire}/>
  </div>;
}
