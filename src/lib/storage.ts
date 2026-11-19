import { AgentId, AgentProfile, EmpireProfile, ProviderConfig, WarRoomState } from "@/types/warRoom";
import { GOOGLE_TTS_VOICES } from "@/lib/speech/voices";

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
  apiKey: "",
  geminiModel: "gemini-3.8-flash",
};

export const STORAGE_KEY = "imperial-war-room-v1";

const AGENT_DEFAULTS: Record<Exclude<AgentId, "memoryUpdater">, AgentProfile> = {
  almirante: { displayName: "General", avatar: "⚔️", color: "#7f1d1d", voiceId: "male-authoritative" },
  canciller: { displayName: "Embajador", avatar: "🕊️", color: "#f8fafc", voiceId: "male-diplomatic" },
  cientifico: { displayName: "Doctor", avatar: "🔬", color: "#2563eb", voiceId: "male-analytical" },
  logistica: { displayName: "Gobernador", avatar: "💰", color: "#f59e0b", voiceId: "female-persuasive" },
  blackops: { displayName: "Agente", avatar: "☠️", color: "#000000", voiceId: "female-strategist" },
};

const LEGACY_DEFAULTS: Record<keyof typeof AGENT_DEFAULTS, { displayName: string; avatar: string; color: string }> = {
  almirante: { displayName: "Gran Almirante", avatar: "⚔️", color: "#ef4444" },
  canciller: { displayName: "Canciller Imperial", avatar: "◈", color: "#3b82f6" },
  cientifico: { displayName: "Director de Investigación", avatar: "⌬", color: "#a855f7" },
  logistica: { displayName: "Ministro de Logística", avatar: "⬡", color: "#f59e0b" },
  blackops: { displayName: "Director de Black Ops", avatar: "◆", color: "#a1a1aa" },
};

function restoreAgentProfile(id: keyof typeof AGENT_DEFAULTS, value: Partial<AgentProfile> & { cloudVoiceName?: string }): AgentProfile {
  const fallback = AGENT_DEFAULTS[id];
  const legacy = LEGACY_DEFAULTS[id];
  const legacyVoice = GOOGLE_TTS_VOICES.find(voice => voice.name === value.cloudVoiceName);
  const savedVoice = GOOGLE_TTS_VOICES.find(voice => voice.id === value.voiceId);
  return {
    displayName: typeof value.displayName === "string" && value.displayName !== legacy.displayName ? value.displayName : fallback.displayName,
    avatar: typeof value.avatar === "string" && value.avatar !== legacy.avatar ? value.avatar : fallback.avatar,
    color: typeof value.color === "string" && value.color !== legacy.color ? value.color : fallback.color,
    voiceId: savedVoice?.id || legacyVoice?.id || fallback.voiceId,
  };
}

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
        agentProfiles: Object.fromEntries(Object.entries(AGENT_DEFAULTS).map(([id]) => [id, restoreAgentProfile(id as keyof typeof AGENT_DEFAULTS, parsed.agentProfiles?.[id] || {})])) as WarRoomState["agentProfiles"],
        history: Array.isArray(parsed.history) ? parsed.history : [],
        config: {
          apiKey: parsed.config?.provider && parsed.config.provider !== "gemini"
            ? parsed.config.googleTtsApiKey || ""
            : parsed.config?.apiKey || parsed.config?.googleTtsApiKey || "",
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
