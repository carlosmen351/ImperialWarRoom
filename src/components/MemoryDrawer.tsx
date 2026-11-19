"use client";

import { useState } from "react";
import { AgentId, AgentProfile, EmpireProfile, TimelineEvent } from "@/types/warRoom";

type Profiles = Record<Exclude<AgentId, "memoryUpdater">, AgentProfile>;

const agentNames: Record<Exclude<AgentId, "memoryUpdater">, string> = {
  almirante: "Gran Almirante",
  canciller: "Canciller Imperial",
  cientifico: "Director de Investigación",
  logistica: "Ministro de Logística",
  blackops: "Black Ops",
};

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

export default function MemoryDrawer({ open, profile, timeline, agentProfiles, onClose, onProfileChange, onDecisionChange }: {
  open: boolean;
  profile: EmpireProfile;
  timeline: TimelineEvent[];
  agentProfiles: Profiles;
  onClose: () => void;
  onProfileChange: (profile: EmpireProfile) => void;
  onDecisionChange: (eventId: string, decision: string) => void;
}) {
  const [constitutionOpen, setConstitutionOpen] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  if (!open) return null;

  const listInput = (key: "rulerTraits" | "speciesTraits" | "ethics" | "civics", label: string) => (
    <label className="block text-xs text-slate-400">{label}<input value={profile[key].join(", ")} onChange={event => onProfileChange({ ...profile, [key]: event.target.value.split(",").map(value => value.trim()).filter(Boolean) })} className="mt-1 h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm text-slate-100"/></label>
  );
  const textInput = (key: "empireName" | "rulerNameAndTitle" | "homeworld" | "species" | "government" | "shipAppearance", label: string) => (
    <label className="block text-xs text-slate-400">{label}<input value={profile[key]} onChange={event => onProfileChange({ ...profile, [key]: event.target.value })} className="mt-1 h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm text-slate-100"/></label>
  );

  return <div className="fixed inset-0 z-50 bg-black/70" onMouseDown={onClose}><aside onMouseDown={event => event.stopPropagation()} className="absolute bottom-0 right-0 top-0 w-[min(94vw,480px)] overflow-y-auto border-l border-sky-500/20 bg-[#080c12] p-4 shadow-2xl">
    <div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] tracking-[.2em] text-sky-500">REGISTRO IMPERIAL</p><h2 className="font-bold tracking-[0.12em] text-sky-300">Constitución y cronología</h2></div><button onClick={onClose} className="h-9 w-9 rounded-full border border-slate-700">×</button></div>
    <section className="mb-4 overflow-hidden rounded-xl border border-slate-800">
      <button onClick={() => setConstitutionOpen(value => !value)} aria-expanded={constitutionOpen} className="flex w-full items-center justify-between bg-slate-900/70 p-3 text-left"><span><span className="block text-[10px] tracking-widest text-slate-500">CONSTITUCIÓN DEL IMPERIO</span><strong className="text-sm text-slate-100">{profile.empireName || "Perfil sin configurar"}</strong></span><span className="text-sky-300">{constitutionOpen ? "−" : "+"}</span></button>
      {constitutionOpen && <div className="grid gap-2 p-3 sm:grid-cols-2">
        {textInput("empireName", "Nombre del imperio")}{textInput("rulerNameAndTitle", "Gobernante / título")}{textInput("homeworld", "Mundo capital")}{textInput("species", "Especie")}{textInput("government", "Gobierno")}{textInput("shipAppearance", "Apariencia de naves")}
        {listInput("rulerTraits", "Rasgos del gobernante")}{listInput("speciesTraits", "Rasgos de especie")}{listInput("ethics", "Éticas")}{listInput("civics", "Cívicas")}
        <label className="block text-xs text-slate-400">Origen<input value={profile.origin.name} onChange={event => onProfileChange({ ...profile, origin: { ...profile.origin, name: event.target.value } })} className="mt-1 h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm text-slate-100"/></label>
        <label className="block text-xs text-slate-400 sm:col-span-2">Historia del origen<textarea value={profile.origin.description} onChange={event => onProfileChange({ ...profile, origin: { ...profile.origin, description: event.target.value } })} className="mt-1 min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-100"/></label>
      </div>}
    </section>
    <div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] tracking-widest text-slate-500">DECISIONES DEL GABINETE</p><h3 className="font-bold text-slate-200">Línea del tiempo</h3></div><span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] text-slate-400">{timeline.length} eventos</span></div>
    {timeline.length === 0 && <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">Los debates cerrados aparecerán aquí automáticamente.</div>}
    <div className="space-y-3">{[...timeline].reverse().map(event => {
      const decision = drafts[event.id] ?? event.finalDecision;
      return <article key={event.id} className="relative rounded-xl border border-slate-800 bg-[#0b1018] p-3 before:absolute before:-left-[9px] before:top-5 before:h-3 before:w-3 before:rounded-full before:border-2 before:border-sky-500 before:bg-[#080c12]">
        <time className="text-[10px] tracking-wide text-sky-500">{formatTime(event.timestamp)}</time>
        <p className="mt-1 text-sm font-semibold text-slate-100">{event.eventSummary}</p>
        <div className="mt-3 space-y-2">{event.cabinetOptions.map((option, index) => {
          const agentId = option.agentId as Exclude<AgentId, "memoryUpdater">;
          const agent = agentNames[agentId] ? agentProfiles[agentId] : undefined;
          return <div key={`${option.agentId}-${index}`} className="flex gap-2 text-xs"><span className="shrink-0 font-bold" style={{ color: agent?.color }}>{agent?.displayName || agentNames[agentId] || option.agentId}</span><span className="text-slate-400">{option.stance}</span><button onClick={() => onDecisionChange(event.id, `Aprobado: ${agent?.displayName || agentNames[agentId] || option.agentId} — ${option.stance}`)} className="ml-auto shrink-0 text-[10px] text-sky-300">Aprobar</button></div>;
        })}</div>
        <div className="mt-3 flex gap-2"><input value={decision} onChange={eventInput => setDrafts(current => ({ ...current, [event.id]: eventInput.target.value }))} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-200"/><button onClick={() => { onDecisionChange(event.id, decision); setDrafts(current => { const next = { ...current }; delete next[event.id]; return next; }); }} className="rounded-lg border border-sky-500/40 px-3 text-xs text-sky-200">Guardar</button></div>
      </article>;
    })}</div>
  </aside></div>;
}
