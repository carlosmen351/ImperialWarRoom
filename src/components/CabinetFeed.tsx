"use client";

import { AgentId, AgentProfile, ProviderConfig, TurnMessage } from "@/types/warRoom";
import { speak } from "@/lib/speech/tts";
import Image from "next/image";

type Profiles = Record<Exclude<AgentId, "memoryUpdater">, AgentProfile>;

const agentIds: Exclude<AgentId, "memoryUpdater">[] = ["almirante", "canciller", "cientifico", "logistica", "blackops"];

function isAgentId(role: AgentId): role is Exclude<AgentId, "memoryUpdater"> {
  return agentIds.includes(role as Exclude<AgentId, "memoryUpdater">);
}

function Avatar({ value }: { value: string }) {
  return value.startsWith("data:image/") ? <Image src={value} alt="" width={32} height={32} unoptimized className="h-full w-full rounded-full object-cover"/> : <span>{value}</span>;
}

export default function CabinetFeed({ messages, busy, profiles, config }: { messages: TurnMessage[]; busy: boolean; profiles: Profiles; config: ProviderConfig }) {
  return <main className="flex-1 overflow-y-auto px-3 pb-32 pt-3" aria-live="polite">
    {messages.length === 0 && <div className="mx-auto mt-24 max-w-xs text-center text-sm text-slate-500"><div className="mx-auto mb-4 h-16 w-16 rounded-full border border-sky-500/30 bg-sky-500/5"/><p>Cuartel general listo.</p><p className="mt-1 text-xs">Presiona el micrófono o escribe una consulta.</p></div>}
    {messages.map(message => {
      if (message.role === "user") return <div key={message.id} className="mb-3 ml-10 rounded-2xl rounded-tr-sm border border-sky-500/20 bg-sky-950/40 px-4 py-3 text-sm text-slate-100">{message.content}{message.image && <Image src={message.image} alt="Captura adjunta" width={512} height={288} unoptimized className="mt-3 max-h-44 w-auto rounded-lg" />}</div>;
      if (!isAgentId(message.role)) return null;
      const profile = profiles[message.role];
      return <article key={message.id} className="mb-3 rounded-xl border bg-[#0b1018]/95 p-3 shadow-lg" style={{ borderColor: `${profile.color}88` }}>
        <div className="mb-2 flex items-center justify-between"><div className="flex min-w-0 items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-300"><span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border text-base" style={{ borderColor: profile.color, color: profile.color }}><Avatar value={profile.avatar}/></span><span className="truncate" style={{ color: profile.color }}>{profile.displayName}</span></div><button onClick={() => speak(message.content, profile, config)} className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300" aria-label={`Escuchar ${profile.displayName}`}>▶</button></div>
        <p className="text-sm leading-5 text-slate-200">{message.content}</p>
      </article>;
    })}
    {busy && <div className="mx-auto my-4 w-fit animate-pulse rounded-full border border-sky-400/30 px-4 py-2 text-xs text-sky-300">Gabinete deliberando...</div>}
  </main>;
}
