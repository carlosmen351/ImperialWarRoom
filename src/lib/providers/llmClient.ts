import { ProviderConfig } from "@/types/warRoom";

export interface LlmMessage { role: "system" | "user" | "assistant"; content: string | LlmContent[] }
export interface LlmContent { type: "text" | "image_url"; text?: string; image_url?: { url: string } }

function extractText(payload: unknown): string {
  const p = payload as { choices?: Array<{ message?: { content?: string } }>; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  if (p.choices?.[0]?.message?.content) return p.choices[0].message.content;
  return p.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("\n") || "";
}

export async function sendPrompt(config: ProviderConfig, systemPrompt: string, messages: LlmMessage[]): Promise<string> {
  if (config.provider === "gemini") {
    if (!config.apiKey) throw new Error("Configura tu API Key de Gemini en Ajustes.");
    const parts = messages.flatMap(message => {
      if (typeof message.content === "string") return [{ text: `${message.role === "user" ? "Usuario" : "Contexto"}: ${message.content}` }];
      return message.content.map(item => item.type === "text" ? { text: item.text || "" } : { inlineData: { mimeType: "image/jpeg", data: (item.image_url?.url || "").split(",")[1] || "" } });
    });
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${encodeURIComponent(config.apiKey)}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: systemPrompt }] }, contents: [{ role: "user", parts }], generationConfig: { temperature: 0.7 } }),
    });
    if (!response.ok) throw new Error(`Gemini: ${response.status} ${await response.text()}`);
    return extractText(await response.json());
  }

  if (config.provider === "openrouter") {
    if (!config.apiKey) throw new Error("Configura tu API Key de OpenRouter en Ajustes.");
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model: config.openRouterModel, messages: [{ role: "system", content: systemPrompt }, ...messages] }),
    });
    if (!response.ok) throw new Error(`OpenRouter: ${response.status} ${await response.text()}`);
    return extractText(await response.json());
  }

  const response = await fetch(`${config.ollamaUrl.replace(/\/$/, "")}/api/chat`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: config.ollamaModel, stream: false, messages: [{ role: "system", content: systemPrompt }, ...messages.map(m => ({
      role: m.role,
      content: typeof m.content === "string" ? m.content : m.content.filter(c => c.type === "text").map(c => c.text || "").join("\n"),
      images: typeof m.content === "string" ? undefined : m.content.filter(c => c.type === "image_url").map(c => (c.image_url?.url || "").split(",")[1]).filter((image): image is string => Boolean(image)),
    }))] }),
  });
  if (!response.ok) throw new Error(`Ollama: ${response.status} ${await response.text()}`);
  const payload = await response.json() as { message?: { content?: string } };
  return payload.message?.content || "";
}
