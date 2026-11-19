"use client";

import { AgentId, TurnMessage } from "@/types/warRoom";
import { speak } from "@/lib/speech/tts";

const cards: Record<string, { name: string; color: string; icon: string }> = {
  almirante: { name: "Gran Almirante", color: "border-red-500/50", icon: "⚔" },
  canciller: { name: "Canciller Imperial", color: "border-blue-500/50", icon: "◈" },
  cientifico: { name: "Director de Ciencia", color: "border-violet-500/50", icon: "⌬" },
  logistica: { name: "Ministro de Logística", color: "border-amber-500/50", icon: "⬡" },
  blackops: { name: "Black Ops", color: "border-zinc-400/70", icon: "◆" },
};

export default function CabinetFeed({ messages, busy }: { messages: TurnMessage[]; busy: boolean }) {
  return (
    <main className="flex-1 overflow-y-auto px-3 pb-32 pt-3" aria-live="polite">
      {messages.length === 0 && <div className="mx-auto mt-24 max-w-xs text-center text-sm text-slate-500"><div className="mx-auto mb-4 h-16 w-16 rounded-full border border-sky-500/30 bg-sky-500/5"/><p>Cuartel general listo.</p><p className="mt-1 text-xs">Presiona el micrófono o escribe una consulta.</p></div>}
      {messages.map(message => {
        if (message.role === "user") return <div key={message.id} className="mb-3 ml-10 rounded-2xl rounded-tr-sm border border-sky-500/20 bg-sky-950/40 px-4 py-3 text-sm text-slate-100">{message.content}{message.image && <img src={message.image} alt="Captura adjunta" className="mt-3 max-h-44 rounded-lg" />}</div>;
        const card = cards[message.role as AgentId] || cards.blackops;
        return <article key={message.id} className={`mb-3 rounded-xl border bg-[#0b1018]/95 p-3 shadow-lg ${card.color}`}>
          <div className="mb-2 flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-300"><span className="text-lg">{card.icon}</span>{card.name}</div><button onClick={() => speak(message.content, message.role)} className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300" aria-label={`Escuchar ${card.name}`}>▶</button></div>
          <p className="text-sm leading-5 text-slate-200">{message.content}</p>
        </article>;
      })}
      {busy && <div className="mx-auto my-4 w-fit animate-pulse rounded-full border border-sky-400/30 px-4 py-2 text-xs text-sky-300">Gabinete deliberando...</div>}
    </main>
  );
}
