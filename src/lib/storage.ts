import { ProviderConfig, WarRoomState } from "@/types/warRoom";

export const DEFAULT_GAME_MEMORY = `# ESTADO DEL IMPERIO - SALA DE GUERRA

## 1. IDENTIDAD Y CONTEXTO
- **Nombre del Imperio:** Nuevo Imperio
- **Año Actual:** 2200.01
- **Éticas y Gobierno:** Por definir
- **Tradiciones y Ascensión:** Ninguna activa

## 2. ECONOMÍA Y RECURSOS (Balance Mensual)
- **Energía:** +0 | **Minerales:** +0 | **Alimentos:** +0
- **Bienes de Consumo:** +0 | **Aleaciones:** +0
- **Investigación Total:** 0 | **Imperio (Sprawl):** 0
- **Planetas Clave:** Capital inicial

## 3. SITUACIÓN MILITAR
- **Poder de Flota Total:** Corbetas iniciales
- **Diseño Predominante / Meta Rival:** Estándar
- **Fronteras (Chokepoints):** Explorando sistemas adyacentes

## 4. DIPLOMACIA Y GALAXIA
- **Vecinos Hostiles / Rivales:** Sin contacto aún
- **Aliados / Vasallos:** Ninguno
- **Comunidad Galáctica:** No fundada

## 5. BITÁCORA DE SESIÓN
- **Objetivo Principal Actual:** Exploración inicial y expansión a sistemas ricos en minerales
- **Última Decisión Tomada:** Inicio de partida
- **Pendiente / Dilema Inmediato:** Ninguno`;

export const DEFAULT_CONFIG: ProviderConfig = {
  provider: "gemini",
  apiKey: "",
  geminiModel: "gemini-2.5-flash",
  openRouterModel: "google/gemma-3-27b-it:free",
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "llama3.2",
};

export const STORAGE_KEY = "imperial-war-room-v1";

export function loadWarRoom(): WarRoomState {
  if (typeof window === "undefined") {
    return { gameTitle: "Hegemonía Terrana", gameMemory: DEFAULT_GAME_MEMORY, history: [], config: DEFAULT_CONFIG };
  }
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (parsed) return { ...parsed, config: { ...DEFAULT_CONFIG, ...parsed.config } };
  } catch {}
  return { gameTitle: "Hegemonía Terrana", gameMemory: DEFAULT_GAME_MEMORY, history: [], config: DEFAULT_CONFIG };
}

export function saveWarRoom(state: WarRoomState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
