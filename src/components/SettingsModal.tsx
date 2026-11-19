"use client";

import { ChangeEvent, useState } from "react";
import { ProviderConfig } from "@/types/warRoom";

const geminiModels = ["gemini-3.8-flash", "gemini-3.8-pro", "gemini-4-hydrogen"];

type SettingsModalProps = {
  open: boolean;
  required: boolean;
  config: ProviderConfig;
  onClose: () => void;
  onSave: (config: ProviderConfig) => void;
  onExport: () => void;
  onImport: (file: File) => void;
};

export default function SettingsModal(props: SettingsModalProps) {
  if (!props.open) return null;
  return <SettingsModalContent key={props.required ? "required" : "optional"} {...props}/>;
}

function SettingsModalContent({ required, config, onClose, onSave, onExport, onImport }: Omit<SettingsModalProps, "open">) {
  const [draft, setDraft] = useState(config);
  const set = (patch: Partial<ProviderConfig>) => setDraft(current => ({ ...current, ...patch }));
  const save = () => {
    const apiKey = draft.apiKey.trim();
    if (!apiKey) return;
    onSave({ ...draft, apiKey, geminiModel: draft.geminiModel.trim() || "gemini-3.8-flash" });
  };
  const importFile = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) onImport(event.target.files[0]);
    event.target.value = "";
  };

  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 p-3 sm:items-center">
    <section className="w-full max-w-md rounded-2xl border border-sky-500/30 bg-[#0a0f16] p-4 shadow-2xl">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[.2em] text-sky-500">{required ? "CONFIGURACIÓN INICIAL" : "SISTEMA IMPERIAL"}</p>
          <h2 className="font-bold text-sky-200">{required ? "Conecta tu Google API Key" : "Configuración"}</h2>
        </div>
        {!required && <button onClick={onClose} className="h-9 w-9 rounded-full border border-slate-700" aria-label="Cerrar configuración">×</button>}
      </header>
      {required && <p className="mb-4 text-sm leading-5 text-slate-400">Ingresa tu clave para habilitar las consultas Gemini y las voces neuronales Google Cloud. Se guarda únicamente en este dispositivo.</p>}

      <label className="block text-xs text-slate-400">Google API Key<input autoFocus={required} type="password" autoComplete="new-password" value={draft.apiKey} onChange={event => set({ apiKey: event.target.value })} placeholder="Pega tu Google API Key" className="mt-1 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100"/></label>
      <p className="mt-2 text-[11px] leading-4 text-slate-500">Una sola clave alimenta Google Gemini API y Google Cloud Text-to-Speech. Activa ambos servicios en el proyecto de Google Cloud asociado.</p>

      <div className="mt-4 rounded-lg border border-slate-800 p-3">
        <p className="text-xs text-slate-400">Proveedor de IA</p>
        <p className="mt-1 text-sm font-medium text-slate-200">Google Gemini API + Google Cloud Text-to-Speech</p>
        <label className="mt-3 block text-xs text-slate-400">Modelo Gemini</label>
        <select value={geminiModels.includes(draft.geminiModel) ? draft.geminiModel : "custom"} onChange={event => { if (event.target.value !== "custom") set({ geminiModel: event.target.value }); }} className="mt-1 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100">
          <option value="gemini-3.8-flash">gemini-3.8-flash · rápido</option>
          <option value="gemini-3.8-pro">gemini-3.8-pro · razonamiento profundo</option>
          <option value="gemini-4-hydrogen">gemini-4-hydrogen</option>
          {!geminiModels.includes(draft.geminiModel) && <option value="custom">ID personalizado</option>}
        </select>
        <label className="mt-3 block text-xs text-slate-400">ID de modelo (editable)<input value={draft.geminiModel} onChange={event => set({ geminiModel: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100"/></label>
      </div>

      {!required && <details className="mt-3 rounded-lg border border-slate-800 p-3">
        <summary className="cursor-pointer text-xs font-semibold text-slate-300">Respaldar o restaurar partida</summary>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={onExport} className="h-10 rounded-lg border border-slate-700 text-xs">Exportar JSON</button>
          <label className="flex h-10 cursor-pointer items-center justify-center rounded-lg border border-slate-700 text-xs">Importar JSON<input type="file" accept="application/json,.json" className="hidden" onChange={importFile}/></label>
        </div>
      </details>}

      <div className="mt-4 flex gap-2">
        {!required && <button onClick={onClose} className="h-11 flex-1 rounded-lg border border-slate-700 text-sm">Cancelar</button>}
        <button onClick={save} disabled={!draft.apiKey.trim()} className="h-11 flex-1 rounded-lg bg-sky-700 text-sm font-bold disabled:opacity-50">{required ? "Guardar y continuar" : "Guardar configuración"}</button>
      </div>
    </section>
  </div>;
}
