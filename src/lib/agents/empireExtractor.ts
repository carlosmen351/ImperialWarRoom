import { sendPrompt } from "@/lib/providers/llmClient";
import { EmpireProfile, ProviderConfig } from "@/types/warRoom";
import { AGENT_PROMPTS } from "./prompts";

function parseJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("El modelo no devolvió un objeto JSON válido.");
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error("No se pudo interpretar el JSON extraído de la imagen. Intenta con una captura más nítida.");
  }
}

export async function extractEmpireProfile(config: ProviderConfig, image: string): Promise<EmpireProfile> {
  const response = await sendPrompt(config, AGENT_PROMPTS.memoryUpdater, [{
    role: "user",
    content: [
      { type: "text", text: "Extrae el perfil del imperio de esta pantalla de resumen. Devuelve únicamente el JSON solicitado." },
      { type: "image_url", image_url: { url: image } },
    ],
  }]);
  const value = parseJson(response) as Partial<EmpireProfile>;
  if (!value || typeof value !== "object") throw new Error("El perfil extraído no es válido.");
  const asString = (item: unknown) => typeof item === "string" ? item.trim() : "";
  const asStringArray = (item: unknown) => Array.isArray(item) ? item.filter((entry): entry is string => typeof entry === "string").map(entry => entry.trim()).filter(Boolean) : [];
  return {
    empireName: asString(value.empireName),
    rulerNameAndTitle: asString(value.rulerNameAndTitle),
    rulerTraits: asStringArray(value.rulerTraits),
    homeworld: asString(value.homeworld),
    species: asString(value.species),
    speciesTraits: asStringArray(value.speciesTraits),
    ethics: asStringArray(value.ethics),
    government: asString(value.government),
    civics: asStringArray(value.civics),
    origin: { name: asString(value.origin?.name), description: asString(value.origin?.description) },
    shipAppearance: asString(value.shipAppearance),
  };
}
