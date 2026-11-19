"use client";

export default function MemoryDrawer({ open, memory, onClose, onSave, onUpdateVoice, onExport, onImport }: { open: boolean; memory: string; onClose: () => void; onSave: (value: string) => void; onUpdateVoice: (value: string) => void; onExport: () => void; onImport: (file: File) => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 bg-black/70" onMouseDown={onClose}><aside onMouseDown={event => event.stopPropagation()} className="absolute bottom-0 right-0 top-0 w-[min(92vw,430px)] overflow-y-auto border-l border-sky-500/20 bg-[#080c12] p-4 shadow-2xl">
    <div className="mb-4 flex items-center justify-between"><h2 className="font-bold tracking-[0.12em] text-sky-300">FICHA DE MEMORIA</h2><button onClick={onClose} className="h-9 w-9 rounded-full border border-slate-700">×</button></div>
    <textarea value={memory} onChange={event => onSave(event.target.value)} className="h-[calc(100vh-238px)] w-full resize-none rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-200 outline-none focus:border-sky-600" />
    <button onClick={() => onUpdateVoice("Actualiza la ficha:")} className="mt-3 h-11 w-full rounded-lg border border-sky-500/30 bg-sky-900/20 text-sm font-bold text-sky-200">Actualizar por voz/comando</button>
    <div className="mt-2 grid grid-cols-2 gap-2"><button onClick={onExport} className="h-10 rounded-lg border border-slate-700 text-xs">Exportar JSON</button><label className="flex h-10 cursor-pointer items-center justify-center rounded-lg border border-slate-700 text-xs">Importar JSON<input type="file" accept="application/json,.json" className="hidden" onChange={event => event.target.files?.[0] && onImport(event.target.files[0])}/></label></div>
  </aside></div>;
}
