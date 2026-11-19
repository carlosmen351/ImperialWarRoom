"use client";

import { ChangeEvent, useRef, useState } from "react";
import { AgentId, AgentProfile } from "@/types/warRoom";
import { GOOGLE_TTS_VOICES } from "@/lib/speech/voices";
import { compressImage } from "@/lib/providers/imageCompressor";
import Image from "next/image";

const ids: Exclude<AgentId, "memoryUpdater">[] = ["almirante", "canciller", "cientifico", "logistica", "blackops"];
const icons = ["⚔️", "◈", "⌬", "⬡", "◆", "🛡️", "🚀", "🦅", "👁️", "⭐"];
type Profiles = Record<Exclude<AgentId, "memoryUpdater">, AgentProfile>;

function Avatar({ value }: { value: string }) {
  return value.startsWith("data:image/") ? <Image src={value} alt="" width={64} height={64} unoptimized className="h-full w-full rounded-full object-cover"/> : <span>{value}</span>;
}

export default function CabinetDossiersModal({ open, profiles, onClose, onChange, onTestVoice }: {
  open: boolean;
  profiles: Profiles;
  onClose: () => void;
  onChange: (profiles: Profiles) => void;
  onTestVoice: (profile: AgentProfile) => void;
}) {
  const [selected, setSelected] = useState<Exclude<AgentId, "memoryUpdater">>("almirante");
  const [avatarError, setAvatarError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const profile = profiles[selected];

  if (!open) return null;
  const update = (patch: Partial<AgentProfile>) => onChange({ ...profiles, [selected]: { ...profile, ...patch } });
  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    try { update({ avatar: await compressImage(file, 256, 0.75) }); }
    catch (error) { setAvatarError(error instanceof Error ? error.message : "No se pudo procesar el avatar."); }
    finally { event.target.value = ""; }
  };

  return <div className="fixed inset-0 z-[55] flex items-end justify-center bg-black/80 p-3 sm:items-center">
    <section className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-sky-500/30 bg-[#090e15] p-4 shadow-2xl">
      <header className="mb-4 flex items-center justify-between"><div><p className="text-[10px] tracking-[.2em] text-sky-500">IDENTIFICACIONES OFICIALES</p><h2 className="font-bold text-sky-200">Directorio del Gabinete</h2></div><button onClick={onClose} className="h-9 w-9 rounded-full border border-slate-700" aria-label="Cerrar gabinete">×</button></header>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">{ids.map(id => <button key={id} onClick={() => { setSelected(id); setAvatarError(""); }} className="shrink-0 rounded-lg border px-3 py-2 text-xs font-bold" style={{ borderColor: profiles[id].color, color: selected === id ? profiles[id].color : "#94a3b8", backgroundColor: selected === id ? `${profiles[id].color}18` : "transparent" }}>{profiles[id].displayName}</button>)}</div>
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 text-2xl" style={{ borderColor: profile.color, color: profile.color }}><Avatar value={profile.avatar}/></div>
        <label className="min-w-0 flex-1 text-xs text-slate-400">Nombre / título<input value={profile.displayName} onChange={event => update({ displayName: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100"/></label>
      </div>
      <div className="flex items-end gap-2">
        <label className="min-w-0 flex-1 text-xs text-slate-400">Voz asignada<select value={profile.voiceId} onChange={event => { const voice = GOOGLE_TTS_VOICES.find(item => item.id === event.target.value); if (voice) update({ voiceId: voice.id }); }} className="mt-1 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100">{GOOGLE_TTS_VOICES.map(voice => <option key={voice.id} value={voice.id}>{voice.label}</option>)}</select></label>
        <button onClick={() => onTestVoice(profile)} className="h-11 shrink-0 rounded-lg border border-sky-500/40 px-3 text-sm text-sky-200">🔊 Probar</button>
      </div>
      {avatarError && <p role="alert" className="mt-3 text-xs text-red-300">{avatarError}</p>}
      <details className="mt-4 rounded-lg border border-slate-800 p-3">
        <summary className="cursor-pointer text-xs font-semibold text-slate-300">Personalización visual opcional</summary>
        <label className="mt-3 block text-xs text-slate-400">Color distintivo<input type="color" value={profile.color} onChange={event => update({ color: event.target.value })} className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950 p-1"/></label>
        <div className="mt-3"><p className="mb-2 text-xs text-slate-400">Avatar</p><div className="flex flex-wrap gap-2">{icons.map(icon => <button key={icon} onClick={() => update({ avatar: icon })} aria-label={`Usar avatar ${icon}`} className={`h-9 w-9 rounded-lg border ${profile.avatar === icon ? "border-sky-400 bg-sky-900/30" : "border-slate-700"}`}>{icon}</button>)}<button onClick={() => fileRef.current?.click()} className="h-9 rounded-lg border border-slate-700 px-3 text-xs text-sky-200">Subir foto</button><input ref={fileRef} type="file" accept="image/*" capture="user" onChange={uploadAvatar} className="hidden"/></div></div>
      </details>
      <button onClick={onClose} className="mt-4 h-11 w-full rounded-lg bg-sky-700 text-sm font-bold">Listo</button>
    </section>
  </div>;
}
