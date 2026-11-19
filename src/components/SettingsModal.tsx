"use client";

import { ProviderConfig } from "@/types/warRoom";

const geminiModels = ["gemini-3.8-flash", "gemini-3.8-pro", "gemini-4-hydrogen"];

export default function SettingsModal({ open, config, onClose, onChange, onExport, onImport }: { open: boolean; config: ProviderConfig; onClose: () => void; onChange: (config: ProviderConfig) => void; onExport: () => void; onImport: (file: File) => void }) {
  if (!open) return null;
  const set = (patch: Partial<ProviderConfig>) => onChange({ ...config, ...patch });
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-3 sm:items-center"><section className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0a0f16] p-4">
    <div className="mb-4 flex items-center justify-between"><h2 className="font-bold tracking-[0.12em] text-sky-300">AJUSTES IA</h2><button onClick={onClose} className="h-9 w-9 rounded-full border border-slate-700">×</button></div>
    <label className="block text-xs text-slate-400">Proveedor</label><select value={config.provider} onChange={event => set({ provider: event.target.value as ProviderConfig["provider"] })} className="mb-3 mt-1 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3"><option value="gemini">Google Gemini</option><option value="openrouter">OpenRouter</option><option value="ollama">Ollama LAN</option></select>
    {config.provider !== "ollama" && <><label className="block text-xs text-slate-400">{config.provider === "gemini" ? "Google API Key" : "API Key"}</label><input type="password" value={config.apiKey} onChange={event => set({ apiKey: event.target.value })} className="mb-3 mt-1 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3" /></>}
    {config.provider === "gemini" && <>
      <label className="block text-xs text-slate-400">Modelo Gemini</label>
      <select value={geminiModels.includes(config.geminiModel) ? config.geminiModel : "custom"} onChange={event => { if (event.target.value !== "custom") set({ geminiModel: event.target.value }); }} className="mb-2 mt-1 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3">
        <option value="gemini-3.8-flash">gemini-3.8-flash · rápido/económico</option>
        <option value="gemini-3.8-pro">gemini-3.8-pro · razonamiento profundo</option>
        <option value="gemini-4-hydrogen">gemini-4-hydrogen</option>
        {!geminiModels.includes(config.geminiModel) && <option value="custom">ID personalizado</option>}
      </select>
      <label className="block text-xs text-slate-400">ID de modelo (editable)</label>
      <input value={config.geminiModel} onChange={event => set({ geminiModel: event.target.value })} className="mt-1 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3" />
    </>}
    {config.provider === "openrouter" && <><label className="block text-xs text-slate-400">Modelo</label><input value={config.openRouterModel} onChange={event => set({ openRouterModel: event.target.value })} className="mt-1 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3" /></>}
    {config.provider === "ollama" && <div className="grid grid-cols-2 gap-2"><div><label className="block text-xs text-slate-400">URL</label><input value={config.ollamaUrl} onChange={event => set({ ollamaUrl: event.target.value })} className="mt-1 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 text-xs" /></div><div><label className="block text-xs text-slate-400">Modelo</label><input value={config.ollamaModel} onChange={event => set({ ollamaModel: event.target.value })} className="mt-1 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 text-xs" /></div></div>}
    <details className="mt-3 rounded-lg border border-slate-800 p-3">
      <summary className="cursor-pointer text-xs font-semibold text-slate-300">Voz neuronal Google Cloud TTS</summary>
      <label className="mt-3 block text-xs text-slate-400">API Key TTS separada (opcional)</label>
      <input type="password" value={config.googleTtsApiKey} onChange={event => set({ googleTtsApiKey: event.target.value })} placeholder={config.provider === "gemini" && config.apiKey ? "Usando la Google API Key principal" : "Pega una key de Google Cloud TTS"} className="mt-1 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm"/>
      <p className="mt-2 text-[11px] leading-4 text-slate-500">Si está seleccionado Gemini y se deja vacía, TTS reutiliza su Google API Key. Con otro proveedor configura una key TTS separada. Habilita Cloud Text-to-Speech y facturación; ante un fallo se usará la voz del navegador.</p>
    </details>
    <p className="mt-3 text-[11px] leading-4 text-amber-300/70">Las claves se guardan localmente en este dispositivo y se usan mediante llamadas directas desde el navegador.</p>
    <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={onExport} className="h-10 rounded-lg border border-slate-700 text-xs">Exportar partida JSON</button><label className="flex h-10 cursor-pointer items-center justify-center rounded-lg border border-slate-700 text-xs">Importar partida JSON<input type="file" accept="application/json,.json" className="hidden" onChange={event => { if (event.target.files?.[0]) onImport(event.target.files[0]); event.target.value = ""; }}/></label></div>
  </section></div>;
}
