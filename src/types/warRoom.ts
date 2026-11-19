export type AgentId = "almirante" | "canciller" | "cientifico" | "logistica" | "blackops" | "memoryUpdater";
export type ProviderId = "gemini" | "openrouter" | "ollama";

export interface ProviderConfig {
  provider: ProviderId;
  apiKey: string;
  geminiModel: string;
  openRouterModel: string;
  ollamaUrl: string;
  ollamaModel: string;
}

export interface TurnMessage {
  id: string;
  role: "user" | AgentId;
  content: string;
  createdAt: number;
  image?: string;
}

export interface WarRoomState {
  gameTitle: string;
  gameMemory: string;
  history: TurnMessage[];
  config: ProviderConfig;
}
