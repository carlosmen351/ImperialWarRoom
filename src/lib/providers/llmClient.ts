import { ProviderConfig } from "@/types/warRoom";

export interface LlmMessage { role: "system" | "user" | "assistant"; content: string | LlmContent[] }
export interface LlmContent { type: "text" | "image_url"; text?: string; image_url?: { url: string } }

function extractText(payload: unknown): string {
  const p = payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return p.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("\n") || "";
}

export async function sendPrompt(config: ProviderConfig, systemPrompt: string, messages: LlmMessage[]): Promise<string> {
  if (!config.apiKey.trim()) throw new Error("Configura la Google API Key en Ajustes.");
  const parts = messages.flatMap(message => {
    if (typeof message.content === "string") return [{ text: `${message.role === "user" ? "Usuario" : "Contexto"}: ${message.content}` }];
    return message.content.map(item => item.type === "text" ? { text: item.text || "" } : { inlineData: { mimeType: "image/jpeg", data: (item.image_url?.url || "").split(",")[1] || "" } });
  });
  const model = config.geminiModel.trim() || "gemini-3.8-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: systemPrompt }] }, contents: [{ role: "user", parts }], generationConfig: { temperature: 0.7 } }),
  });
  if (!response.ok) throw new Error(`Gemini: ${response.status} ${await response.text()}`);
  return extractText(await response.json());
}
