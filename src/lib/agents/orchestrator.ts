import { AGENT_PROMPTS } from "./prompts";
import { sendPrompt, LlmMessage } from "@/lib/providers/llmClient";
import { AgentId, ProviderConfig, TurnMessage } from "@/types/warRoom";

const cabinet: Exclude<AgentId, "blackops" | "memoryUpdater">[] = ["almirante", "canciller", "cientifico", "logistica"];

function buildContext(memory: string, history: TurnMessage[], input: string, image?: string): LlmMessage[] {
  const recent = history.slice(-3).map(item => `${item.role}: ${item.content}`).join("\n");
  const content: LlmMessage["content"] = [{ type: "text", text: `FICHA DE MEMORIA:\n${memory}\n\nHISTORIAL RECIENTE:\n${recent || "Sin historial"}\n\nCONSULTA ACTUAL:\n${input}` }];
  if (image) content.push({ type: "image_url", image_url: { url: image } });
  return [{ role: "user", content }];
}

export interface CabinetResult { id: AgentId; content: string }

export async function runCabinet(config: ProviderConfig, memory: string, history: TurnMessage[], input: string, image?: string): Promise<CabinetResult[]> {
  const calls = cabinet.map(async id => {
    try {
      const content = await sendPrompt(config, AGENT_PROMPTS[id], buildContext(memory, history, input, image));
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

export async function runBlackOps(config: ProviderConfig, memory: string, history: TurnMessage[], input: string, cabinetResults: CabinetResult[], image?: string): Promise<CabinetResult> {
  const consolidated = cabinetResults.map(result => `${result.id}: ${result.content}`).join("\n\n");
  const context = buildContext(memory, history, `${input}\n\nPOSTURAS DEL GABINETE:\n${consolidated}`, image);
  try {
    const content = await sendPrompt(config, AGENT_PROMPTS.blackops, context);
    return { id: "blackops", content: content || "No hubo respuesta de Black Ops." };
  } catch (error) {
    return { id: "blackops", content: `Error: ${error instanceof Error ? error.message : "Fallo de conexión"}` };
  }
}

export async function updateMemory(config: ProviderConfig, memory: string, input: string, image?: string): Promise<string> {
  const content: LlmMessage["content"] = [{ type: "text", text: `FICHA ACTUAL:\n${memory}\n\nINSTRUCCIÓN:\n${input}` }];
  if (image) content.push({ type: "image_url", image_url: { url: image } });
  const updated = await sendPrompt(config, AGENT_PROMPTS.memoryUpdater, [{ role: "user", content }]);
  return updated.trim();
}
