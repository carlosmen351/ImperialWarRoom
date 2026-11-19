import { AgentVoiceId } from "@/types/warRoom";

export const GOOGLE_TTS_VOICES: { id: AgentVoiceId; label: string; name: string; languageCode: string }[] = [
  { id: "male-authoritative", label: "Hombre 1 — Grave / Autoritario", name: "es-US-Neural2-B", languageCode: "es-US" },
  { id: "male-analytical", label: "Hombre 2 — Analítico / Serio", name: "es-US-Neural2-C", languageCode: "es-US" },
  { id: "male-diplomatic", label: "Hombre 3 — Diplomático / Pausado", name: "es-ES-Neural2-B", languageCode: "es-ES" },
  { id: "female-executive", label: "Mujer 1 — Ejecutiva / Firme", name: "es-US-Neural2-A", languageCode: "es-US" },
  { id: "female-strategist", label: "Mujer 2 — Estratega / Precisa", name: "es-ES-Neural2-A", languageCode: "es-ES" },
  { id: "female-persuasive", label: "Mujer 3 — Persuasiva / Cálida", name: "es-ES-Neural2-C", languageCode: "es-ES" },
];
