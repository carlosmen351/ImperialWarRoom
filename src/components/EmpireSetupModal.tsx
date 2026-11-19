"use client";

import { ChangeEvent, useState } from "react";
import { compressImage } from "@/lib/providers/imageCompressor";
import { extractEmpireProfile } from "@/lib/agents/empireExtractor";
import { EmpireProfile, ProviderConfig } from "@/types/warRoom";

const textFields: { key: Exclude<keyof EmpireProfile, "origin" | "rulerTraits" | "speciesTraits" | "ethics" | "civics">; label: string }[] = [
  { key: "empireName", label: "Nombre del imperio" },
  { key: "rulerNameAndTitle", label: "Gobernante y título" },
  { key: "homeworld", label: "Mundo capital" },
  { key: "species", label: "Especie" },
  { key: "government", label: "Gobierno" },
  { key: "shipAppearance", label: "Apariencia de naves" },
];

export default function EmpireSetupModal({ open, initialProfile, config, onClose, onConfigureApiKey, onSave }: {
  open: boolean;
  initialProfile: EmpireProfile;
  config: ProviderConfig;
  onClose: () => void;
  onConfigureApiKey: () => void;
  onSave: (profile: EmpireProfile) => void;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;
  const update = (patch: Partial<EmpireProfile>) => setProfile(current => ({ ...current, ...patch }));
  const extract = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const image = await compressImage(file);
      setProfile(await extractEmpireProfile(config, image));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo analizar la captura.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };
  const save = () => {
    onSave(profile);
    onClose();
  };
  const listField = (key: "rulerTraits" | "speciesTraits" | "ethics" | "civics", label: string) => (
    <label className="block text-xs text-slate-400">{label}<input value={profile[key].join(", ")} onChange={event => update({ [key]: event.target.value.split(",").map(value => value.trim()).filter(Boolean) })} className="mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100"/></label>
  );
  return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 p-3 sm:items-center">
    <section className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-sky-500/30 bg-[#090e15] p-4 shadow-2xl">
      <header className="mb-4 flex items-center justify-between"><div><p className="text-[10px] tracking-[.2em] text-sky-500">NUEVA PARTIDA</p><h2 className="font-bold text-sky-200">Constitución del Imperio</h2></div><button onClick={onClose} className="h-9 w-9 rounded-full border border-slate-700">×</button></header>
      <label className="mb-3 flex h-12 cursor-pointer items-center justify-center rounded-lg border border-sky-500/40 bg-sky-900/20 text-sm font-bold text-sky-100">{busy ? "Analizando imagen..." : "📷 Analizar resumen de Stellaris"}<input type="file" accept="image/*" capture="environment" onChange={extract} disabled={busy} className="hidden"/></label>
      <p className="mb-3 text-xs leading-5 text-slate-500">La imagen se procesa con Google Gemini. Revisa y corrige los campos antes de guardar.</p>
      {!config.apiKey.trim() && <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-950/20 p-2 text-xs text-amber-200">Añade tu Google API Key para extraer los datos automáticamente o captura los campos manualmente. <button onClick={onConfigureApiKey} className="ml-1 underline">Configurar API Key</button></p>}
      {error && <p role="alert" className="mb-3 rounded-lg border border-red-500/30 bg-red-950/30 p-2 text-xs text-red-200">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">{textFields.map(field => <label key={field.key} className="block text-xs text-slate-400">{field.label}<input value={profile[field.key]} onChange={event => update({ [field.key]: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100"/></label>)}
        {listField("rulerTraits", "Rasgos del gobernante (separados por coma)")}{listField("speciesTraits", "Rasgos de especie")}{listField("ethics", "Éticas")}{listField("civics", "Cívicas")}
        <label className="block text-xs text-slate-400">Origen<input value={profile.origin.name} onChange={event => update({ origin: { ...profile.origin, name: event.target.value } })} className="mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100"/></label>
        <label className="block text-xs text-slate-400">Descripción del origen<textarea value={profile.origin.description} onChange={event => update({ origin: { ...profile.origin, description: event.target.value } })} className="mt-1 min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100"/></label>
      </div>
      <div className="mt-4 flex gap-2"><button onClick={onClose} className="h-11 flex-1 rounded-lg border border-slate-700 text-sm">Cancelar</button><button onClick={save} disabled={!profile.empireName.trim()} className="h-11 flex-1 rounded-lg bg-sky-700 text-sm font-bold disabled:opacity-50">Guardar constitución</button></div>
    </section>
  </div>;
}
