import { AgentId, AgentProfile, EmpireProfile, ProviderConfig, WarRoomState } from "@/types/warRoom";

export const DEFAULT_EMPIRE_PROFILE: EmpireProfile = {
  empireName: "",
  rulerNameAndTitle: "",
  rulerTraits: [],
  homeworld: "",
  species: "",
  speciesTraits: [],
  ethics: [],
  government: "",
  civics: [],
  origin: { name: "", description: "" },
  shipAppearance: "",
};

export const DEFAULT_CONFIG: ProviderConfig = {
  provider: "gemini",
  apiKey: "",
  geminiModel: "gemini-3.8-flash",
  googleTtsApiKey: "",
  openRouterModel: "google/gemma-3-27b-it:free",
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "llama3.2",
};

export const STORAGE_KEY = "imperial-war-room-v1";

const AGENT_DEFAULTS: Record<Exclude<AgentId, "memoryUpdater">, AgentProfile> = {
  almirante: { displayName: "Gran Almirante", avatar: "⚔️", color: "#ef4444", cloudVoiceName: "es-US-Neural2-B", voiceURI: "", pitch: 0.72, rate: 1.02, bio: "" },
  canciller: { displayName: "Canciller Imperial", avatar: "◈", color: "#3b82f6", cloudVoiceName: "es-US-Neural2-B", voiceURI: "", pitch: 0.92, rate: 0.96, bio: "" },
  cientifico: { displayName: "Director de Investigación", avatar: "⌬", color: "#a855f7", cloudVoiceName: "es-US-Neural2-B", voiceURI: "", pitch: 1.12, rate: 1.08, bio: "" },
  logistica: { displayName: "Ministro de Logística", avatar: "⬡", color: "#f59e0b", cloudVoiceName: "es-US-Neural2-B", voiceURI: "", pitch: 0.82, rate: 1, bio: "" },
  blackops: { displayName: "Director de Black Ops", avatar: "◆", color: "#a1a1aa", cloudVoiceName: "es-US-Neural2-B", voiceURI: "", pitch: 0.58, rate: 0.88, bio: "" },
};

export function createDefaultAgentProfiles(): WarRoomState["agentProfiles"] {
  return Object.fromEntries(Object.entries(AGENT_DEFAULTS).map(([id, profile]) => [id, { ...profile }])) as WarRoomState["agentProfiles"];
}

export function createDefaultWarRoom(): WarRoomState {
  return {
    gameTitle: "Nuevo Imperio",
    empireProfile: { ...DEFAULT_EMPIRE_PROFILE, origin: { ...DEFAULT_EMPIRE_PROFILE.origin } },
    timeline: [],
    agentProfiles: createDefaultAgentProfiles(),
    history: [],
    config: { ...DEFAULT_CONFIG },
  };
}

export function loadWarRoom(): WarRoomState {
  if (typeof window === "undefined") return createDefaultWarRoom();
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (parsed && typeof parsed === "object") {
      const restored = { ...parsed };
      delete restored.gameMemory;
      return {
        ...createDefaultWarRoom(),
        ...restored,
        empireProfile: { ...DEFAULT_EMPIRE_PROFILE, ...parsed.empireProfile, origin: { ...DEFAULT_EMPIRE_PROFILE.origin, ...parsed.empireProfile?.origin } },
        timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [],
        agentProfiles: Object.fromEntries(Object.entries(AGENT_DEFAULTS).map(([id, fallback]) => [id, { ...fallback, ...parsed.agentProfiles?.[id] }])) as WarRoomState["agentProfiles"],
        history: Array.isArray(parsed.history) ? parsed.history : [],
        config: {
          ...DEFAULT_CONFIG,
          ...parsed.config,
          geminiModel: parsed.config?.geminiModel === "gemini-2.5-flash" ? DEFAULT_CONFIG.geminiModel : parsed.config?.geminiModel || DEFAULT_CONFIG.geminiModel,
        },
      };
    }
  } catch {
    return createDefaultWarRoom();
  }
  return createDefaultWarRoom();
}

export function saveWarRoom(state: WarRoomState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
