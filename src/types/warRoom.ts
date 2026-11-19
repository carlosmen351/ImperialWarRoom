export type AgentId = "almirante" | "canciller" | "cientifico" | "logistica" | "blackops" | "memoryUpdater";
export type AgentVoiceId = "male-authoritative" | "male-analytical" | "male-diplomatic" | "female-executive" | "female-strategist" | "female-persuasive";

export interface ProviderConfig {
  apiKey: string;
  ttsApiKey: string;
  geminiModel: string;
}

export interface EmpireProfile {
  empireName: string;
  rulerNameAndTitle: string;
  rulerTraits: string[];
  homeworld: string;
  species: string;
  speciesTraits: string[];
  ethics: string[];
  government: string;
  civics: string[];
  origin: { name: string; description: string };
  shipAppearance: string;
}

export interface TimelineOption {
  agentId: AgentId;
  stance: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  eventSummary: string;
  cabinetOptions: TimelineOption[];
  finalDecision: string;
}

export interface AgentProfile {
  displayName: string;
  avatar: string;
  color: string;
  voiceId: AgentVoiceId;
  traits: string[];
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
  empireProfile: EmpireProfile;
  timeline: TimelineEvent[];
  agentProfiles: Record<Exclude<AgentId, "memoryUpdater">, AgentProfile>;
  history: TurnMessage[];
  chats: Record<Exclude<AgentId, "memoryUpdater">, TurnMessage[]>;
  config: ProviderConfig;
}
