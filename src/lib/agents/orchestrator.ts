import { AGENT_PROMPTS } from "./prompts";
import { sendPrompt, LlmMessage } from "@/lib/providers/llmClient";
import { AgentId, AgentProfile, EmpireProfile, ProviderConfig, TimelineEvent, TurnMessage } from "@/types/warRoom";

const cabinet: Exclude<AgentId, "blackops" | "memoryUpdater">[] = ["almirante", "canciller", "cientifico", "logistica"];

function buildContext(empire: EmpireProfile, timeline: TimelineEvent[], history: TurnMessage[], input: string, image?: string): LlmMessage[] {
  const recent = history.slice(-3).map(item => `${item.role}: ${item.content}`).join("\n");
  const historic = timeline.slice(-5).map(event => `${event.timestamp} | Suceso: ${event.eventSummary}\nPosturas: ${event.cabinetOptions.map(option => `${option.agentId}: ${option.stance}`).join(" / ")}\nVeredicto: ${event.finalDecision}`).join("\n\n");
  const content: LlmMessage["content"] = [{ type: "text", text: `CONSTITUCIÓN DEL IMPERIO (datos base; adapta tus consejos a estas éticas, principios, rasgos y origen):\n${JSON.stringify(empire, null, 2)}\n\nLÍNEA DEL TIEMPO RECIENTE (últimos 5 eventos; respeta los veredictos previos):\n${historic || "Sin decisiones previas."}\n\nHISTORIAL RECIENTE:\n${recent || "Sin historial"}\n\nCONSULTA ACTUAL:\n${input}` }];
  if (image) content.push({ type: "image_url", image_url: { url: image } });
  return [{ role: "user", content }];
}

export interface CabinetResult { id: AgentId; content: string }

type AgentProfiles = Record<Exclude<AgentId, "memoryUpdater">, AgentProfile>;

function agentPrompt(id: AgentId, profile: AgentProfile) {
  return `${AGENT_PROMPTS[id]}\n\n# IDENTIDAD PERSONALIZADA\nNombre y rango: ${profile.displayName}`;
}

export async function runCabinet(config: ProviderConfig, empire: EmpireProfile, timeline: TimelineEvent[], history: TurnMessage[], input: string, image: string | undefined, profiles: AgentProfiles): Promise<CabinetResult[]> {
  const calls = cabinet.map(async id => {
    try {
      const content = await sendPrompt(config, agentPrompt(id, profiles[id]), buildContext(empire, timeline, history, input, image));
      return { id, content: content || "No hubo respuesta del agente." };
    } catch (error) {
      return { id, content: `Error: ${error instanceof Error ? error.message : "Fallo de conexión"}` };
    }
  });
  const settled = await Promise.allSettled(calls);
  return settled.map((result, index) => result.status === "fulfilled"
    ? result.value
    : { id: cabinet[index], content: "Error: fallo inesperado del agente." });
}

export async function runBlackOps(config: ProviderConfig, empire: EmpireProfile, timeline: TimelineEvent[], history: TurnMessage[], input: string, cabinetResults: CabinetResult[], image: string | undefined, profiles: AgentProfiles): Promise<CabinetResult> {
  const consolidated = cabinetResults.map(result => `${result.id}: ${result.content}`).join("\n\n");
  const context = buildContext(empire, timeline, history, `${input}\n\nPOSTURAS DEL GABINETE:\n${consolidated}`, image);
  try {
    const content = await sendPrompt(config, agentPrompt("blackops", profiles.blackops), context);
    return { id: "blackops", content: content || "No hubo respuesta de Black Ops." };
  } catch (error) {
    return { id: "blackops", content: `Error: ${error instanceof Error ? error.message : "Fallo de conexión"}` };
  }
}
