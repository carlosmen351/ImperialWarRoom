import { AGENT_PROMPTS } from "./prompts";
import { sendPrompt, LlmMessage } from "@/lib/providers/llmClient";
import { AgentId, AgentProfile, EmpireProfile, ProviderConfig, TimelineEvent, TurnMessage } from "@/types/warRoom";

export type CabinetAgentId = Exclude<AgentId, "memoryUpdater">;
export interface CabinetResult { id: CabinetAgentId; content: string }
type AgentProfiles = Record<CabinetAgentId, AgentProfile>;

function buildContext(empire: EmpireProfile, timeline: TimelineEvent[], history: TurnMessage[], input: string, image?: string): LlmMessage[] {
  const recent = history.slice(-6).map(item => `${item.role}: ${item.content}`).join("\n");
  const historic = timeline.slice(-5).map(event => `${event.timestamp} | Suceso: ${event.eventSummary}\nPosturas: ${event.cabinetOptions.map(option => `${option.agentId}: ${option.stance}`).join(" / ")}\nVeredicto: ${event.finalDecision}`).join("\n\n");
  const content: LlmMessage["content"] = [{ type: "text", text: `CONSTITUCIÓN DEL IMPERIO (adapta tus consejos a estas éticas, principios, rasgos y origen):\n${JSON.stringify(empire, null, 2)}\n\nLÍNEA DEL TIEMPO RECIENTE (respeta los veredictos previos):\n${historic || "Sin decisiones previas."}\n\nHISTORIAL PRIVADO RECIENTE:\n${recent || "Sin historial privado"}\n\nCONSULTA ACTUAL:\n${input}` }];
  if (image) content.push({ type: "image_url", image_url: { url: image } });
  return [{ role: "user", content }];
}

function agentPrompt(id: CabinetAgentId, profile: AgentProfile, newlyAcquired: string[] = []) {
  const activeTraits = profile.traits.join(", ") || "Estándar";
  const newTraitInstruction = newlyAcquired.length
    ? `\n[NUEVO RASGO ADQUIRIDO: ${newlyAcquired.join(", ")}] Integra esta capacidad recién adquirida en tu siguiente análisis táctico.`
    : "";
  return `${AGENT_PROMPTS[id]}\n\n# IDENTIDAD PERSONALIZADA\nNombre y rango: ${profile.displayName}\n\n[TUS CAPACIDADES Y RASGOS ACTUALES EN EL CONSEJO DE STELLARIS: ${activeTraits}. Adapta tus recomendaciones estratégicas aprovechando activamente estas bonificaciones o compensando tus penalizaciones, sin mencionar literalmente el sistema ni decir que tu configuración cambió.]${newTraitInstruction}`;
}

async function consult(
  config: ProviderConfig,
  empire: EmpireProfile,
  timeline: TimelineEvent[],
  history: TurnMessage[],
  input: string,
  image: string | undefined,
  id: CabinetAgentId,
  profile: AgentProfile,
  newlyAcquired: string[] = [],
): Promise<CabinetResult> {
  try {
    const content = await sendPrompt(config, agentPrompt(id, profile, newlyAcquired), buildContext(empire, timeline, history, input, image));
    return { id, content: content || "No hubo respuesta del agente." };
  } catch (error) {
    return { id, content: `Error: ${error instanceof Error ? error.message : "Fallo de conexión"}` };
  }
}

export function runPrivateAgent(
  config: ProviderConfig,
  empire: EmpireProfile,
  timeline: TimelineEvent[],
  history: TurnMessage[],
  input: string,
  image: string | undefined,
  id: CabinetAgentId,
  profiles: AgentProfiles,
  newlyAcquired: string[] = [],
) {
  return consult(config, empire, timeline, history, input, image, id, profiles[id], newlyAcquired);
}

export async function runEmergencyCouncil(
  config: ProviderConfig,
  empire: EmpireProfile,
  timeline: TimelineEvent[],
  input: string,
  image: string | undefined,
  order: CabinetAgentId[],
  profiles: AgentProfiles,
  newlyAcquired: Partial<Record<CabinetAgentId, string[]>>,
  onResult: (result: CabinetResult) => void,
): Promise<CabinetResult[]> {
  const results: CabinetResult[] = [];
  for (const id of order) {
    const previousTurns = results.length
      ? `\n\nINTERVENCIONES EXACTAS YA ESCUCHADAS EN ESTE DEBATE:\n${results.map(result => `${profiles[result.id].displayName} (${result.id}): ${result.content}`).join("\n\n")}\n\nREGLA DE DEBATE ENCADENADO: Acabas de escuchar a tus colegas anteriores. NO repitas datos ni diagnósticos que ya mencionaron. Construye sobre lo dicho, refuta sus puntos ciegos usando tus rasgos/habilidades actuales de consejo o propón una alternativa directa en máximo 3-4 líneas.`
      : "\n\nEres quien abre el consejo. Presenta el diagnóstico inicial en máximo 3-4 líneas.";
    const result = await consult(
      config,
      empire,
      timeline,
      [],
      `${input}${previousTurns}`,
      image,
      id,
      profiles[id],
      newlyAcquired[id] || [],
    );
    results.push(result);
    onResult(result);
  }
  return results;
}
