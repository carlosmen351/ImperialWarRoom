"use client";

import { ChangeEvent, useRef, useState } from "react";

export default function TacticalControls({ busy, onSend, onImage, onStartVoice, onStopVoice }: { busy: boolean; onSend: (text: string) => void; onImage: (file: File) => void; onStartVoice: () => void; onStopVoice: () => void }) {
  const [text, setText] = useState("");
  const [manual, setManual] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = () => { if (text.trim()) { onSend(text.trim()); setText(""); setManual(false); } };
  const handleImage = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files?.[0]) onImage(event.target.files[0]); };

  return <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-800 bg-[#080b10]/95 px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
    {manual && <div className="mb-2 flex gap-2"><input value={text} onChange={event => setText(event.target.value)} onKeyDown={event => event.key === "Enter" && submit()} placeholder="Consulta al gabinete..." className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-sky-500"/><button onClick={submit} className="rounded-lg bg-sky-700 px-3 text-sm font-bold">Enviar</button></div>}
    <div className="grid grid-cols-[56px_1fr_56px] items-center gap-2">
      <button onClick={() => fileRef.current?.click()} className="h-12 rounded-xl border border-slate-700 text-xl" aria-label="Añadir captura">📷</button>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleImage} className="hidden" />
      <button disabled={busy} onPointerDown={onStartVoice} onPointerUp={onStopVoice} onPointerCancel={onStopVoice} className="h-14 touch-none select-none rounded-xl border border-sky-400/40 bg-sky-700/20 text-xs font-black tracking-[0.12em] text-sky-100 disabled:opacity-50">🎙<br/>MANTENER</button>
      <button onClick={() => setManual(value => !value)} className="h-12 rounded-xl border border-slate-700 text-lg" aria-label="Abrir entrada de texto">⌨</button>
    </div>
  </div>;
}
