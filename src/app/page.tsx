"use client";

import { useEffect, useRef, useState } from "react";
import CabinetFeed from "@/components/CabinetFeed";
import TacticalControls from "@/components/TacticalControls";
import TacticalDirectory, { CABINET_ORDER, CabinetAgentId } from "@/components/TacticalDirectory";
import MemoryDrawer from "@/components/MemoryDrawer";
import SettingsModal from "@/components/SettingsModal";
import EmpireSetupModal from "@/components/EmpireSetupModal";
import CabinetDossiersModal from "@/components/CabinetDossiersModal";
import AgentTraitsBar from "@/components/AgentTraitsBar";
import { loadWarRoom, saveWarRoom, createDefaultWarRoom, DEFAULT_EMPIRE_PROFILE, STORAGE_KEY } from "@/lib/storage";
import { compressImage } from "@/lib/providers/imageCompressor";
import { runEmergencyCouncil, runPrivateAgent } from "@/lib/agents/orchestrator";
import { createSpeechRecognition, SpeechRecognitionInstance } from "@/lib/speech/stt";
import { enqueueSpeech, speak, stopSpeaking } from "@/lib/speech/tts";
import { AgentProfile, TimelineEvent, TurnMessage } from "@/types/warRoom";
import Image from "next/image";

type WakeLockToken = { release: () => Promise<void>; addEventListener: (type: "release", listener: () => void) => void };
type NavigatorWithWakeLock = Navigator & { wakeLock?: { request: (type: "screen") => Promise<WakeLockToken> } };
type AppView = "directory" | "private" | "emergency";
type Profiles = Record<CabinetAgentId, AgentProfile>;

function summarize(text: string) {
  const firstLine = text.trim().split(/\n|(?<=[.!?])\s/)[0] || text.trim();
  return firstLine.length > 180 ? `${firstLine.slice(0, 177)}...` : firstLine;
}

function shortSummary(text: string) {
  return text.trim().length > 260 ? `${text.trim().slice(0, 257)}...` : text.trim();
}

function createMessage(role: TurnMessage["role"], content: string, image?: string): TurnMessage {
  return { id: crypto.randomUUID(), role, content, image, createdAt: Date.now() };
}

function appendMessage(messages: TurnMessage[], message: TurnMessage) {
  return [...messages, message].slice(-60);
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
  const [pttActive, setPttActive] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [manualWakeLock, setManualWakeLock] = useState(false);
  const [image, setImage] = useState<string>();
  const [view, setView] = useState<AppView>("directory");
  const [activeAgent, setActiveAgent] = useState<CabinetAgentId | null>(null);
  const [emergencyOrder, setEmergencyOrder] = useState<CabinetAgentId[]>(CABINET_ORDER);
  const [emergencyMessages, setEmergencyMessages] = useState<TurnMessage[]>([]);
  const traitChangesRef = useRef<Partial<Record<CabinetAgentId, string[]>>>({});
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const voiceTextRef = useRef("");

  useEffect(() => {
    const savedState = loadWarRoom();
    queueMicrotask(() => {
      setState(savedState);
      setSetupOpen(!savedState.empireProfile.empireName && Boolean(savedState.config.apiKey.trim()));
      setSettingsOpen(!savedState.config.apiKey.trim());
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
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    navigator.serviceWorker.register(`${basePath}/sw.js`).catch(error => console.error("No se pudo registrar el Service Worker de Imperial War Room.", error));
  }, []);
  useEffect(() => {
    if (!busy && !pttActive && !manualWakeLock) return;
    const wakeLock = (navigator as NavigatorWithWakeLock).wakeLock;
    if (!wakeLock) return;
    let active = true;
    let sentinel: WakeLockToken | undefined;
    const request = async () => {
      if (!active || sentinel || document.visibilityState !== "visible") return;
      try {
        sentinel = await wakeLock.request("screen");
        sentinel.addEventListener("release", () => { sentinel = undefined; void request(); });
      } catch {
        sentinel = undefined;
      }
    };
    const onVisibilityChange = () => { if (document.visibilityState === "visible") void request(); };
    document.addEventListener("visibilitychange", onVisibilityChange);
    void request();
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (sentinel) void sentinel.release().catch(() => undefined);
    };
  }, [busy, pttActive, manualWakeLock]);

  const updateAgentProfiles = (profiles: Profiles) => {
    const changed = { ...traitChangesRef.current };
    for (const id of CABINET_ORDER) {
      const oldTraits = state.agentProfiles[id].traits;
      const additions = profiles[id].traits.filter(trait => !oldTraits.includes(trait));
      const stillActive = (changed[id] || []).filter(trait => profiles[id].traits.includes(trait));
      const pending = [...new Set([...stillActive, ...additions])];
      if (pending.length) changed[id] = pending;
      else delete changed[id];
    }
    traitChangesRef.current = changed;
    setState(current => ({ ...current, agentProfiles: profiles }));
  };

  const addChatMessage = (agentId: CabinetAgentId, message: TurnMessage) => {
    setState(current => ({ ...current, chats: { ...current.chats, [agentId]: appendMessage(current.chats[agentId], message) } }));
  };

  const addEmergencyMessage = (message: TurnMessage) => setEmergencyMessages(current => appendMessage(current, message));

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    if (!state.config.apiKey.trim()) {
      setSettingsOpen(true);
      return;
    }
    const attached = image;
    setImage(undefined);
    setBusy(true);
    try {
      if (view === "private" && activeAgent) {
        const userMessage = createMessage("user", text, attached);
        const thread = state.chats[activeAgent];
        setState(current => ({ ...current, chats: { ...current.chats, [activeAgent]: appendMessage(current.chats[activeAgent], userMessage) } }));
        const newlyAcquired = [...(traitChangesRef.current[activeAgent] || [])];
        const result = await runPrivateAgent(state.config, state.empireProfile, state.timeline, thread, text, attached, activeAgent, state.agentProfiles, newlyAcquired);
        addChatMessage(activeAgent, createMessage(result.id, result.content));
        traitChangesRef.current[activeAgent] = (traitChangesRef.current[activeAgent] || []).filter(trait => !newlyAcquired.includes(trait));
        if (ttsEnabled) enqueueSpeech({ text: `${state.agentProfiles[activeAgent].displayName}. ${result.content}`, profile: state.agentProfiles[activeAgent], ttsApiKey: state.config.ttsApiKey });
        if (/registra(?:r)?\s+(?:esto|esta decisi[oó]n|la decisi[oó]n).{0,50}(?:l[ií]nea del tiempo|timeline)/i.test(text)) {
          const event: TimelineEvent = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            eventSummary: shortSummary(text),
            cabinetOptions: [{ agentId: activeAgent, stance: summarize(result.content) }],
            finalDecision: `Acuerdo registrado: ${summarize(result.content)}`,
          };
          setState(current => ({ ...current, timeline: [...current.timeline, event] }));
        }
      } else if (view === "emergency") {
        if (!emergencyOrder.length) return;
        const userMessage = createMessage("user", text, attached);
        setEmergencyMessages([userMessage]);
        const newTraits = { ...traitChangesRef.current };
        const results = await runEmergencyCouncil(
          state.config,
          state.empireProfile,
          state.timeline,
          text,
          attached,
          emergencyOrder,
          state.agentProfiles,
          newTraits,
          result => {
            addEmergencyMessage(createMessage(result.id, result.content));
            const usedTraits = newTraits[result.id] || [];
            traitChangesRef.current[result.id] = (traitChangesRef.current[result.id] || []).filter(trait => !usedTraits.includes(trait));
            if (ttsEnabled) enqueueSpeech({ text: `${state.agentProfiles[result.id].displayName}. ${result.content}`, profile: state.agentProfiles[result.id], ttsApiKey: state.config.ttsApiKey });
          },
        );
        const event: TimelineEvent = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          eventSummary: shortSummary(text),
          cabinetOptions: results.map(result => ({ agentId: result.id, stance: summarize(result.content) })),
          finalDecision: `Resumen del consejo: ${results.map(result => `${state.agentProfiles[result.id].displayName}: ${summarize(result.content)}`).join(" | ")}`,
        };
        setState(current => ({ ...current, timeline: [...current.timeline, event] }));
      }
    } finally { setBusy(false); }
  };

  const openAgent = (id: CabinetAgentId) => {
    setActiveAgent(id);
    setView("private");
    setImage(undefined);
  };
  const openEmergency = () => {
    stopSpeaking();
    setEmergencyMessages([]);
    setImage(undefined);
    setView("emergency");
  };
  const returnToDirectory = () => {
    if (busy) return;
    setView("directory");
    setActiveAgent(null);
    setImage(undefined);
  };
  const toggleParticipant = (id: CabinetAgentId) => setEmergencyOrder(current => current.includes(id)
    ? current.length > 1 ? current.filter(agent => agent !== id) : current
    : [...current, id]);
  const moveParticipant = (id: CabinetAgentId, direction: -1 | 1) => setEmergencyOrder(current => {
    const index = current.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= current.length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });

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
    recognition.onerror = event => { setPttActive(false); if (event.error !== "aborted") alert(`Voz: ${event.error}`); };
    try { recognition.start(); setPttActive(true); }
    catch (error) { setPttActive(false); alert(error instanceof Error ? `Voz: ${error.message}` : "No se pudo iniciar el reconocimiento de voz."); }
  };
  const stopVoice = () => {
    const recognition = recognitionRef.current;
    if (!recognition) { setPttActive(false); return; }
    recognition.onend = () => {
      setPttActive(false);
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
    setState(current => ({ ...current, gameTitle: empireProfile.empireName || "Nuevo Imperio", empireProfile, timeline: [], history: [], chats: { almirante: [], canciller: [], cientifico: [], logistica: [], blackops: [] } }));
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
      const restored = loadWarRoom();
      setState(restored);
      setSettingsOpen(!restored.config.apiKey.trim());
      setSetupOpen(Boolean(restored.config.apiKey.trim() && !restored.empireProfile.empireName));
    } catch (error) { alert(error instanceof Error ? error.message : "No se pudo importar la partida."); }
  };
  const saveConfig = (config: typeof state.config) => {
    setState(current => ({ ...current, config }));
    setSettingsOpen(false);
    if (!state.empireProfile.empireName) setSetupOpen(true);
  };
  const clearAppData = async () => {
    const confirmed = window.confirm("¿Borrar todos los datos guardados de Imperial War Room en este dispositivo? Se eliminarán el imperio, historial, línea del tiempo y ambas API Keys. La aplicación se reiniciará.");
    if (!confirmed) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames
          .filter(name => name.startsWith("imperial-war-room-"))
          .map(name => caches.delete(name)));
      }
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? `No se pudieron borrar todos los datos: ${error.message}` : "No se pudieron borrar todos los datos.");
    }
  };
  const isNewProfile = !state.empireProfile.empireName;

  if (!hydrated) return <main className="flex min-h-[100dvh] items-center justify-center bg-[#05070a] text-sm text-sky-200">Preparando el Comunicador de Comando…</main>;

  const messages = view === "emergency" ? emergencyMessages : activeAgent ? state.chats[activeAgent] : [];
  const privateTitle = activeAgent ? state.agentProfiles[activeAgent].displayName : "";

  return <div className={`flex h-[100dvh] flex-col overflow-hidden text-slate-100 ${view === "emergency" ? "bg-[#120707]" : "bg-[#05070a]"}`}>
    <header className={`flex min-h-[58px] shrink-0 items-center justify-between gap-2 border-b px-3 ${view === "emergency" ? "border-red-900/80 bg-[#160809]" : "border-slate-800 bg-[#080b10]"}`}>
      <div className="flex min-w-0 items-center gap-2">
        {view !== "directory" && <button onClick={returnToDirectory} disabled={busy} className="h-9 w-9 shrink-0 rounded-lg border border-slate-700 text-lg disabled:opacity-40" aria-label="Volver al directorio">‹</button>}
        <div className="min-w-0">
          <p className={`text-[9px] tracking-[0.22em] ${view === "emergency" ? "text-red-400" : "text-sky-500"}`}>{view === "emergency" ? "MODO ALERTA · SALA DE CRISIS" : view === "private" ? "CANAL PRIVADO 1-A-1" : "COMUNICADOR DE COMANDO"}</p>
          <h1 className="truncate text-sm font-bold">{view === "private" ? privateTitle : state.empireProfile.empireName || state.gameTitle}</h1>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button onClick={() => setMemoryOpen(true)} title="Línea del Tiempo / Imperio" aria-label="Línea del Tiempo / Imperio" className="h-9 rounded-lg border border-slate-700 px-2 text-xs">📋<span className="ml-1 hidden lg:inline">Imperio</span></button>
        <button onClick={() => setDossiersOpen(true)} title="Editar Credenciales" aria-label="Editar Credenciales" className="h-9 rounded-lg border border-slate-700 px-2 text-xs">🪪<span className="ml-1 hidden lg:inline">Gabinete</span></button>
        <button onClick={() => setManualWakeLock(value => !value)} title="Alternar Wake Lock" aria-label="Alternar Wake Lock" aria-pressed={manualWakeLock} className={`h-9 rounded-lg border px-2 text-sm ${manualWakeLock ? "border-emerald-500/60 text-emerald-300" : "border-slate-700"}`}>🔒</button>
        <button onClick={() => { setTtsEnabled(value => !value); if (ttsEnabled) stopSpeaking(); }} title="Alternar lectura automática" aria-label="Alternar lectura automática" aria-pressed={ttsEnabled} className="h-9 rounded-lg border border-slate-700 px-2 text-sm">{ttsEnabled ? "🔊" : "🔇"}</button>
        <button onClick={() => void clearAppData()} title="Borrar todos los datos guardados" aria-label="Borrar todos los datos guardados" className="h-9 rounded-lg border border-red-900/70 px-2 text-sm text-red-300">🧹</button>
        <button onClick={() => setSettingsOpen(true)} title="Configuración" aria-label="Configuración" className="h-9 rounded-lg border border-slate-700 px-2 text-sm">⚙️</button>
        <button onClick={startNewEmpire} title="Nuevo Imperio" aria-label="Nuevo Imperio" className="h-9 rounded-lg border border-slate-700 px-2 text-xs">＋</button>
      </div>
    </header>
    {storageError && <p role="alert" className="absolute left-2 right-2 top-[62px] z-20 rounded-lg border border-amber-500/30 bg-amber-950/90 p-2 text-xs text-amber-200">{storageError}</p>}

    {view === "directory" && <TacticalDirectory profiles={state.agentProfiles} onOpenAgent={openAgent} onEmergency={openEmergency}/>}

    {view === "private" && activeAgent && <>
      {image && <div className="absolute left-3 top-[66px] z-20 flex items-center gap-2 rounded-lg border border-sky-500/30 bg-slate-950 p-1"><Image src={image} alt="Vista previa" width={48} height={48} unoptimized className="h-12 w-12 rounded object-cover"/><button onClick={() => setImage(undefined)} className="h-7 w-7 text-sm">×</button></div>}
      <AgentTraitsBar profile={state.agentProfiles[activeAgent]} onChange={traits => updateAgentProfiles({ ...state.agentProfiles, [activeAgent]: { ...state.agentProfiles[activeAgent], traits } })}/>
      <CabinetFeed messages={messages} busy={busy} profiles={state.agentProfiles} ttsApiKey={state.config.ttsApiKey} busyLabel={`${privateTitle} analizando…`}/>
      <TacticalControls busy={busy} onSend={send} onImage={handleImage} onStartVoice={startVoice} onStopVoice={stopVoice} placeholder={`Mensaje privado para ${privateTitle}…`}/>
    </>}

    {view === "emergency" && <>
      <section className="shrink-0 border-b border-red-900/60 bg-red-950/20 px-3 py-2">
        <div className="mx-auto max-w-3xl">
          <p className="mb-2 text-[10px] font-bold tracking-widest text-red-300">ORDEN DE INTERVENCIÓN · TOCA PARA INCLUIR / EXCLUIR</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CABINET_ORDER.map(id => {
              const profile = state.agentProfiles[id];
              const turn = emergencyOrder.indexOf(id);
              const color = profile.color === "#000000" ? "#a1a1aa" : profile.color;
              return <div key={id} className={`min-w-[116px] rounded-lg border p-2 ${turn < 0 ? "opacity-50" : "bg-black/20"}`} style={{ borderColor: `${color}66` }}>
                <button onClick={() => toggleParticipant(id)} aria-pressed={turn >= 0} className="flex w-full items-center gap-2 text-left">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-black" style={{ borderColor: color, color }}>{turn < 0 ? "—" : turn + 1}</span>
                  <span className="min-w-0 truncate text-[10px] font-bold text-slate-200">{profile.displayName}</span>
                </button>
                {turn >= 0 && <div className="mt-1 flex justify-end gap-1"><button onClick={() => moveParticipant(id, -1)} disabled={turn === 0} aria-label={`Mover ${profile.displayName} antes`} className="h-6 w-7 rounded border border-slate-700 disabled:opacity-30">←</button><button onClick={() => moveParticipant(id, 1)} disabled={turn === emergencyOrder.length - 1} aria-label={`Mover ${profile.displayName} después`} className="h-6 w-7 rounded border border-slate-700 disabled:opacity-30">→</button></div>}
              </div>;
            })}
          </div>
          <p className="mt-1 text-[10px] text-slate-500">Black Ops cierra el debate por defecto y audita las posturas previas.</p>
        </div>
      </section>
      {image && <div className="absolute left-3 top-[170px] z-20 flex items-center gap-2 rounded-lg border border-red-500/30 bg-slate-950 p-1"><Image src={image} alt="Vista previa" width={48} height={48} unoptimized className="h-12 w-12 rounded object-cover"/><button onClick={() => setImage(undefined)} className="h-7 w-7 text-sm">×</button></div>}
      <CabinetFeed messages={messages} busy={busy} profiles={state.agentProfiles} ttsApiKey={state.config.ttsApiKey} busyLabel="Consejo en debate secuencial…"/>
      <TacticalControls busy={busy || !emergencyOrder.length} onSend={send} onImage={handleImage} onStartVoice={startVoice} onStopVoice={stopVoice} crisis placeholder="Presenta el dilema al Consejo de Emergencia…"/>
    </>}

    <MemoryDrawer open={memoryOpen} profile={state.empireProfile} timeline={state.timeline} agentProfiles={state.agentProfiles} onClose={() => setMemoryOpen(false)} onProfileChange={empireProfile => setState(current => ({ ...current, empireProfile, gameTitle: empireProfile.empireName || current.gameTitle }))} onDecisionChange={setDecision}/>
    <SettingsModal open={settingsOpen} required={!state.config.apiKey.trim()} config={state.config} onClose={() => setSettingsOpen(false)} onSave={saveConfig} onExport={exportState} onImport={file => void importState(file)}/>
    <CabinetDossiersModal open={dossiersOpen} profiles={state.agentProfiles} config={state.config} onClose={() => setDossiersOpen(false)} onChange={updateAgentProfiles} onTestVoice={profile => speak("A sus órdenes.", profile, state.config.ttsApiKey)}/>
    <EmpireSetupModal key={newEmpire ? "new" : isNewProfile ? "initial" : "edit"} open={setupOpen} initialProfile={newEmpire || isNewProfile ? DEFAULT_EMPIRE_PROFILE : state.empireProfile} config={state.config} onConfigureApiKey={() => setSettingsOpen(true)} onClose={() => { setSetupOpen(false); setNewEmpire(false); }} onSave={saveEmpire}/>
  </div>;
}
