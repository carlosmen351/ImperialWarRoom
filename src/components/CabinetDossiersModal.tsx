"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { AgentId, AgentProfile } from "@/types/warRoom";
import { compressImage } from "@/lib/providers/imageCompressor";
import Image from "next/image";

const ids: Exclude<AgentId, "memoryUpdater">[] = ["almirante", "canciller", "cientifico", "logistica", "blackops"];
const icons = ["⚔️", "◈", "⌬", "⬡", "◆", "🛡️", "🚀", "🦅", "👁️", "⭐"];
const cloudVoices = ["es-US-Neural2-A", "es-US-Neural2-B", "es-US-Neural2-C", "es-US-Neural2-D"];
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
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [avatarError, setAvatarError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const profile = profiles[selected];

  useEffect(() => {
    if (!open || !("speechSynthesis" in window)) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, [open]);

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
      <header className="mb-4 flex items-center justify-between"><div><p className="text-[10px] tracking-[.2em] text-sky-500">IDENTIFICACIONES OFICIALES</p><h2 className="font-bold text-sky-200">Directorio del Gabinete</h2></div><button onClick={onClose} className="h-9 w-9 rounded-full border border-slate-700">×</button></header>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">{ids.map(id => <button key={id} onClick={() => setSelected(id)} className="shrink-0 rounded-lg border px-3 py-2 text-xs font-bold" style={{ borderColor: profiles[id].color, color: selected === id ? profiles[id].color : "#94a3b8", backgroundColor: selected === id ? `${profiles[id].color}18` : "transparent" }}>{profiles[id].displayName}</button>)}</div>
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 text-2xl" style={{ borderColor: profile.color }}><Avatar value={profile.avatar}/></div>
        <div className="min-w-0 flex-1"><h3 className="truncate font-bold" style={{ color: profile.color }}>{profile.displayName}</h3><p className="text-xs text-slate-500">Credencial imperial · {selected}</p><button onClick={() => fileRef.current?.click()} className="mt-2 text-xs text-sky-300">Subir fotografía/avatar</button><input ref={fileRef} type="file" accept="image/*" capture="user" onChange={uploadAvatar} className="hidden"/></div>
      </div>
      {avatarError && <p role="alert" className="mb-3 text-xs text-red-300">{avatarError}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-slate-400">Nombre ficticio y rango<input value={profile.displayName} onChange={event => update({ displayName: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100"/></label>
        <label className="block text-xs text-slate-400">Color táctico<input type="color" value={profile.color} onChange={event => update({ color: event.target.value })} className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950 p-1"/></label>
        <div className="sm:col-span-2"><p className="mb-2 text-xs text-slate-400">Avatar predefinido</p><div className="flex flex-wrap gap-2">{icons.map(icon => <button key={icon} onClick={() => update({ avatar: icon })} className={`h-9 w-9 rounded-lg border ${profile.avatar === icon ? "border-sky-400 bg-sky-900/30" : "border-slate-700"}`}>{icon}</button>)}</div></div>
        <label className="block text-xs text-slate-400 sm:col-span-2">Voz del dispositivo<select value={profile.voiceURI} onChange={event => update({ voiceURI: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100"><option value="">Predeterminada (es-MX)</option>{voices.map(voice => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>)}</select></label>
        <label className="block text-xs text-slate-400 sm:col-span-2">Voz neuronal (Google Cloud)<select value={profile.cloudVoiceName} onChange={event => update({ cloudVoiceName: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100">{cloudVoices.map(voice => <option key={voice} value={voice}>{voice}</option>)}</select></label>
        <label className="block text-xs text-slate-400">Tono · {profile.pitch.toFixed(2)}<input type="range" min="0.5" max="1.5" step="0.05" value={profile.pitch} onChange={event => update({ pitch: Number(event.target.value) })} className="mt-2 w-full accent-sky-500"/></label>
        <label className="block text-xs text-slate-400">Velocidad · {profile.rate.toFixed(2)}<input type="range" min="0.8" max="1.3" step="0.05" value={profile.rate} onChange={event => update({ rate: Number(event.target.value) })} className="mt-2 w-full accent-sky-500"/></label>
        <label className="block text-xs text-slate-400 sm:col-span-2">Biografía / notas de rol<textarea value={profile.bio} onChange={event => update({ bio: event.target.value })} maxLength={500} placeholder="Contexto adicional para su personalidad y recomendaciones..." className="mt-1 min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100"/></label>
      </div>
      <div className="mt-4 flex gap-2"><button onClick={() => onTestVoice(profile)} className="h-11 flex-1 rounded-lg border border-sky-500/40 text-sm text-sky-200">Probar voz</button><button onClick={onClose} className="h-11 flex-1 rounded-lg bg-sky-700 text-sm font-bold">Guardar y cerrar</button></div>
    </section>
  </div>;
}
