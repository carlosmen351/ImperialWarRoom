"use client";

import { KeyboardEvent, useState } from "react";
import { AgentProfile } from "@/types/warRoom";

export default function AgentTraitsBar({ profile, onChange }: { profile: AgentProfile; onChange: (traits: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const addTrait = (value: string) => {
    const trait = value.trim().replace(/,$/, "").trim();
    if (trait && !profile.traits.some(existing => existing.toLocaleLowerCase() === trait.toLocaleLowerCase())) onChange([...profile.traits, trait]);
    setDraft("");
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTrait(draft);
    }
  };
  const accent = profile.color === "#000000" ? "#a1a1aa" : profile.color;

  return <section className="shrink-0 border-b border-slate-800 bg-[#090d13] px-3 py-2">
    <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[9px] font-bold tracking-widest text-slate-500">RASGOS</span>
      {profile.traits.map(trait => <span key={trait} className="inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-1 text-[10px] text-slate-200" style={{ borderColor: `${accent}66` }}>{trait}<button onClick={() => onChange(profile.traits.filter(item => item !== trait))} aria-label={`Eliminar rasgo ${trait}`} className="text-slate-500 hover:text-red-300">×</button></span>)}
      <input value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={handleKeyDown} onBlur={() => draft.trim() && addTrait(draft)} placeholder="Añadir rasgo + Enter" aria-label="Añadir rasgo activo" className="h-7 min-w-[145px] flex-1 rounded-md border border-slate-800 bg-slate-950 px-2 text-[10px] text-slate-200 placeholder:text-slate-600"/>
    </div>
  </section>;
}
