"use client";

import Image from "next/image";
import { AgentId, AgentProfile } from "@/types/warRoom";

export type CabinetAgentId = Exclude<AgentId, "memoryUpdater">;
export const CABINET_ORDER: CabinetAgentId[] = ["almirante", "canciller", "cientifico", "logistica", "blackops"];

const roles: Record<CabinetAgentId, string> = {
  almirante: "Gran Almirante",
  canciller: "Canciller Imperial",
  cientifico: "Director de Investigación",
  logistica: "Ministro de Logística",
  blackops: "Director de Black Ops",
};

function Avatar({ value }: { value: string }) {
  return value.startsWith("data:image/")
    ? <Image src={value} alt="" width={64} height={64} unoptimized className="h-full w-full object-cover"/>
    : <span>{value}</span>;
}

export default function TacticalDirectory({ profiles, onOpenAgent, onEmergency }: {
  profiles: Record<CabinetAgentId, AgentProfile>;
  onOpenAgent: (id: CabinetAgentId) => void;
  onEmergency: () => void;
}) {
  return <main className="flex-1 overflow-y-auto px-4 pb-8 pt-5">
    <section className="mx-auto max-w-3xl">
      <div className="mb-5">
        <p className="text-[10px] tracking-[.24em] text-sky-400">COMUNICADOR DE COMANDO</p>
        <h2 className="mt-1 text-xl font-black tracking-wide text-slate-100">Canales tácticos privados</h2>
        <p className="mt-1 text-sm text-slate-500">Selecciona un secretario para una consulta directa y confidencial.</p>
      </div>
      <button onClick={onEmergency} className="mb-5 flex min-h-16 w-full items-center justify-center gap-3 rounded-xl border border-red-500/70 bg-red-950/60 px-4 text-center text-sm font-black tracking-[.1em] text-red-100 shadow-[0_0_24px_rgba(239,68,68,.15)] transition hover:bg-red-900/70">
        <span className="text-xl">🚨</span> CONSEJO DE EMERGENCIA
      </button>
      <div className="grid gap-3 sm:grid-cols-2">
        {CABINET_ORDER.map((id, index) => {
          const profile = profiles[id];
          const accent = profile.color === "#000000" ? "#a1a1aa" : profile.color;
          return <button key={id} onClick={() => onOpenAgent(id)} className="min-h-28 rounded-xl border bg-[#0b1018] p-4 text-left transition hover:-translate-y-0.5 hover:bg-slate-900/80" style={{ borderColor: `${accent}66` }}>
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 text-2xl" style={{ borderColor: accent, color: accent }}><Avatar value={profile.avatar}/></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-bold text-slate-100">{profile.displayName}</span>
                <span className="mt-0.5 block truncate text-xs" style={{ color: accent }}>{roles[id]}</span>
              </span>
              <span className="text-lg text-slate-500">›</span>
            </div>
            <span className="mt-3 flex min-h-5 flex-wrap gap-1">
              {profile.traits.slice(0, 3).map(trait => <span key={trait} className="max-w-full truncate rounded-full border px-2 py-0.5 text-[10px] text-slate-300" style={{ borderColor: `${accent}55` }}>{trait}</span>)}
              {profile.traits.length > 3 && <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400">+{profile.traits.length - 3}</span>}
              {!profile.traits.length && <span className="text-[10px] text-slate-600">Sin rasgos registrados · Contacto {index + 1}</span>}
            </span>
          </button>;
        })}
      </div>
    </section>
  </main>;
}
