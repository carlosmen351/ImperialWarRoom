import { sendPrompt, LlmMessage } from "@/lib/providers/llmClient";
import { ProviderConfig } from "@/types/warRoom";

function parseTraits(response: string): string[] {
  const cleaned = response.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Gemini no devolvió la lista de rasgos en formato válido.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error("No se pudo interpretar la lista de rasgos. Intenta con una captura más nítida.");
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { traits?: unknown }).traits)) {
    throw new Error("La respuesta de Gemini no contiene un arreglo de rasgos.");
  }
  return (parsed as { traits: unknown[] }).traits
    .filter((trait): trait is string => typeof trait === "string")
    .map(trait => trait.trim())
    .filter(Boolean);
}

export async function extractAgentTraits(config: ProviderConfig, currentTraits: string[], notes: string, image?: string): Promise<string[]> {
  if (!notes.trim() && !image) throw new Error("Añade una descripción por voz o una foto del Consejo.");
  const content: LlmMessage["content"] = [
    { type: "text" as const, text: `Actualiza la lista completa de rasgos activos de este líder de Stellaris. Conserva los rasgos actuales que no se indique que fueron eliminados y añade o corrige los identificados en las notas o imagen. No inventes datos. Responde exclusivamente con JSON válido: {"traits":["rasgo"]}.\nRasgos actuales: ${JSON.stringify(currentTraits)}\nNotas dictadas: ${notes.trim() || "Sin notas"}` },
  ];
  if (image) content.push({ type: "image_url", image_url: { url: image } });
  const response = await sendPrompt(config, "Eres un extractor preciso de rasgos de líderes y consejo de Stellaris. Devuelve únicamente JSON válido, sin Markdown ni explicaciones.", [{
    role: "user",
    content,
  }]);
  return parseTraits(response);
}
