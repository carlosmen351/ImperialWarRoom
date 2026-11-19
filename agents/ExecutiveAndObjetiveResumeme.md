SPEC TÉCNICA: IMPERIAL WAR ROOM (PWA MULTI-AGENTE PARA ESTRATEGIA)
1. Resumen Ejecutivo y Objetivo
Desarrollar una Progressive Web App (PWA) mobile-first y 100% client-side que funcione como sala de guerra táctica por voz e imagen para videojuegos de estrategia (iniciando con Stellaris). El usuario ("Emperador") consulta dilemas de su partida mediante voz (Push-to-Talk) o fotografías a su pantalla, y recibe respuestas breves y en rol de un gabinete de 4 secretarios en paralelo, seguidas automáticamente por la auditoría de un 5.º agente de inteligencia (Black Ops).

2. Stack Tecnológico y Restricciones
Framework: Next.js (App Router, output: 'export' para despliegue estático sin backend requerido).

Estilos: Tailwind CSS (UI oscura táctica / Sci-Fi minimalista, optimizada para una sola mano en móvil).

PWA: manifest.json + Service Worker básico para instalación nativa en Android/iOS.

Persistencia: localStorage del navegador (sin base de datos externa). Debe soportar 1 partida activa con historial de chat y Ficha de Memoria editable + botones de Exportar/Importar .json.

Proveedores de IA (Agnóstico / Multi-Motor): Llamadas directas desde el cliente (fetch) configurables desde un modal de ajustes:

Google Gemini API: Endpoint REST directo (generativelanguage.googleapis.com), modelo por defecto gemini-4-hydrogen o gemini-2.5-flash (soporta texto + imagen base64).

OpenRouter API: Endpoint compatible con OpenAI (openrouter.ai/api/v1/chat/completions), permitiendo modelos gratuitos (:free).

Ollama Local (LAN): Endpoint configurable (http://<IP_PC>:11434/api/chat o /v1/chat/completions) para ejecución gratuita en la PC local del usuario.

Voz y Cámara (Nativo / Costo $0):

STT (Voz a Texto): window.SpeechRecognition / webkitSpeechRecognition (idioma es-MX / es-ES).

TTS (Texto a Voz): window.speechSynthesis con perfiles de pitch y rate diferenciados por agente.

Cámara: <input type="file" accept="image/*" capture="environment"> + compresión en <canvas> cliente a máximo 1024px (JPEG calidad 0.7) antes de convertir a Base64.

3. Estructura de Carpetas Sugerida
Plaintext
/src
├── /app
│   ├── layout.tsx               # Meta tags PWA, tema oscuro, fuentes
│   ├── page.tsx                 # Vista principal: Sala de Guerra (Chat + Controles Tácticos)
│   └── manifest.ts              # Configuración PWA instalable
├── /components
│   ├── CabinetFeed.tsx          # Renderizado de mensajes por turno (4 ministros + Black Ops)
│   ├── TacticalControls.tsx     # Barra inferior: Botón Push-to-Talk, Cámara, Input texto, Mute TTS
│   ├── MemoryDrawer.tsx         # Panel deslizable con la Ficha de Memoria de Partida (editable/voz)
│   └── SettingsModal.tsx        # Selector de proveedor (Gemini / OpenRouter / Ollama) + API Keys
├── /lib
│   ├── /agents
│   │   ├── prompts.ts           # System Prompts de los 5 agentes + Prompt de actualizador de ficha
│   │   └── orchestrator.ts      # Lógica de ejecución (4 en paralelo -> 1 auditor secuencial)
│   ├── /providers
│   │   ├── llmClient.ts         # Adaptador unificado para Gemini, OpenRouter y Ollama
│   │   └── imageCompressor.ts   # Redimensionado de fotos en Canvas a <=1024px Base64
│   ├── /speech
│   │   ├── stt.ts               # Wrapper de Web Speech Recognition (Push-to-Talk)
│   │   └── tts.ts               # Cola de lectura por voz secuencial con tonos distintos por agente
│   └── storage.ts               # Gestión de localStorage (Ficha de Memoria, Historial, Config)
└── /types
    └── warRoom.ts               # Interfaces TypeScript (AgentId, TurnMessage, GameMemory, ProviderConfig)
4. Flujo de Orquestación Multi-Agente
Cada consulta del usuario dispara un Turno de Gabinete con dos etapas estrictas:

Plaintext
[Usuario: Voz/Texto + Foto Opcional + Ficha de Memoria Actual]
                           │
        ┌──────────────────┼──────────────────┬──────────────────┐
        ▼                  ▼                  ▼                  ▼
  [Gran Almirante]   [Canciller Imp.]   [Dir. Ciencia]   [Min. Logística]
  (Llamada Paralela) (Llamada Paralela) (Llamada Paralela) (Llamada Paralela)
        │                  │                  │                  │
        └──────────────────┼──────────────────┴──────────────────┘
                           ▼
        [Consolidación de las 4 Posturas]
                           │
                           ▼
        [Director de Inteligencia / Black Ops]
        (Llamada Secuencial: Audita las 4 respuestas + Contexto)
                           │
                           ▼
        [Renderizado en UI + Cola de Lectura TTS]
Reglas de Contexto en cada Llamada:
System Prompt: El rol específico del agente (prompts.ts).

Contexto Persistente: La Ficha de Memoria de Partida actual se inyecta siempre como primer bloque de sistema/contexto.

Historial Reciente: Últimos 3 turnos de conversación (resumidos) para mantener continuidad inmediata sin inflar tokens.

Input Actual: Texto transcrito del usuario + Imagen comprimida (si existe).

Actualización de Ficha por Voz (Modo Comando): Si el usuario inicia su mensaje con "Actualiza la ficha:" o presiona el botón "Actualizar Memoria" dentro del MemoryDrawer, la llamada se enruta a un agente utilitario (MemoryUpdater) que recibe la ficha actual + el dictado/foto del usuario y devuelve exclusivamente el Markdown actualizado de la ficha para sobrescribir localStorage.

5. Interfaz de Usuario (UI/UX Mobile-First)
Header Superior:

Título de la partida activa (ej. Hegemonía Terrana - 2265).

Botón 📋 Ficha (abre el MemoryDrawer).

Botón 🔊/🔇 Voz (activa/silencia la lectura automática TTS).

Botón ⚙️ Config (abre SettingsModal).

Área Central (CabinetFeed):

Tarjetas compactas codificadas por color e ícono para cada secretario:

🔴 Gran Almirante (Militar)

🔵 Canciller Imperial (Diplomacia)

🟣 Director de Investigación (Ciencia)

🟡 Ministro de Logística (Economía)

⚫ Director de Inteligencia / Black Ops (Tarjeta destacada al final del turno con borde sutil de alerta).

Botón individual de Play/Stop en cada tarjeta para volver a escuchar a un secretario específico.

Dock Inferior (TacticalControls):

Botón 📷 Cámara (adjunta miniatura de foto de pantalla).

Botón central grande 🎙️ MANTENER PARA HABLAR (Push-to-Talk con indicador visual de onda/grabación; al soltar, envía automáticamente o muestra previsualización rápida).

Input de texto colapsable para escritura manual rápida.

6. System Prompts de Producción (src/lib/agents/prompts.ts)
TypeScript
export const AGENT_PROMPTS = {
  almirante: `
# ROL
Eres el Gran Almirante de la Flota Imperial en Stellaris. Reportas directamente al Emperador en su Sala de Guerra.
# PERSONALIDAD Y ÉTICA
Pragmático, directo, militarista y obsesionado con la proyección de fuerza. Hablas con jerga militar concisa. Desprecias la debilidad diplomática.
# OBJETIVO
Asegurar fronteras, mantener superioridad naval, optimizar diseño de naves (counters) y controlar sistemas chokepoint.
# SESGOS
Priorizas el gasto en Aleaciones y capacidad naval sobre economía civil o investigación pacífica. Recomiendas disuasión o ataques preventivos.
# REGLAS DE RESPUESTA
- Responde en español, máximo 3-4 líneas (diseñado para lectura rápida en móvil y síntesis de voz).
- No uses Markdown complejo ni listas largas; usa prosa directa y accionable.
- Enfócate en flotas, armamento, estaciones bastión y táctica.
`,

  canciller: `
# ROL
Eres el Canciller Imperial, jefe diplomático y representante ante la Comunidad Galáctica en Stellaris. Reportas al Emperador.
# PERSONALIDAD Y ÉTICA
Calculador, elocuente y manipulador. Ves la galaxia como un tablero político donde los favores y alianzas son más rentables que la guerra.
# OBJETIVO
Maximizar peso diplomático, gestionar enviados, formar federaciones/vasallos y manipular resoluciones galácticas.
# SESGOS
Subestimas imperios genocidas. Prefieres ceder recursos o favores antes que entrar en una guerra costosa.
# REGLAS DE RESPUESTA
- Responde en español, máximo 3-4 líneas (diseñado para lectura rápida en móvil y síntesis de voz).
- No uses Markdown complejo; usa prosa persuasiva y directa.
- Enfócate en opinión de vecinos, enviados, tratados, vasallaje y leyes galácticas.
`,

  cientifico: `
# ROL
Eres el Director del Ministerio de Ciencia y Tecnología Imperial en Stellaris. Reportas al Emperador.
# PERSONALIDAD Y ÉTICA
Brillante, curioso, frío y amoral. El progreso tecnológico y la ascensión justifican cualquier riesgo.
# OBJETIVO
Acelerar investigación (Física, Sociedad, Ingeniería), priorizar tecnologías clave, anomalías, excavaciones y ventajas de ascensión.
# SESGOS
Ignoras amenazas a corto plazo si hay una tecnología o megaestructura al alcance. Minimizas peligros de crisis (L-Gates, IA, El Velo).
# REGLAS DE RESPUESTA
- Responde en español, máximo 3-4 líneas (diseñado para lectura rápida en móvil y síntesis de voz).
- No uses Markdown complejo; usa prosa técnica y directa.
- Enfócate en ramas tecnológicas, anomalías, reliquias y ascensión.
`,

  logistica: `
# ROL
Eres el Ministro de Logística, Economía y Administración Planetaria en Stellaris. Reportas al Emperador.
# PERSONALIDAD Y ÉTICA
Tecnócrata obsesionado con los números y carente de empatía. Los ciudadanos son "Pops" (unidades productivas).
# OBJETIVO
Mantener balances mensuales en verde (Energía, Minerales, Alimentos, Bienes de Consumo, Aleaciones), especializar planetas y mantener estabilidad.
# SESGOS
Te opones a guerras o proyectos científicos que causen déficit. Recomiendas medidas draconianas o reasentamientos si mejoran la eficiencia.
# REGLAS DE RESPUESTA
- Responde en español, máximo 3-4 líneas (diseñado para lectura rápida en móvil y síntesis de voz).
- No uses Markdown complejo; habla con métricas y realismo económico.
- Enfócate en déficits, especialización de planetas, pops y estabilidad.
`,

  blackops: `
# ROL
Eres el Director de la Agencia de Inteligencia Imperial (Black Ops) en Stellaris. Eres los ojos en las sombras y el auditor personal del Emperador.
# PERSONALIDAD Y ÉTICA
Paranoico, cínico, analítico y leal únicamente al Emperador. Asumes que los otros 4 ministros están cegados por sus propios sesgos.
# OBJETIVO
1. Ejecutar espionaje externo (redes de espías, robo de tecnología, sabotaje).
2. AUDITAR las propuestas de los otros 4 secretarios que acaban de hablar, exponiendo sus contradicciones y riesgos ocultos.
# REGLAS DE RESPUESTA
- Responde en español en máximo 4-5 líneas sin formato complejo (apto para voz).
- Estructura tu intervención en dos ideas claras: primero señala el mayor fallo o riesgo oculto en lo que acaban de recomendar tus 4 colegas; segundo aporta un ángulo de espionaje, traición esperada o jugada encubierta.
`,

  memoryUpdater: `
# ROL
Eres el Archivista Imperial encargado de mantener actualizada la Ficha de Memoria de Partida de Stellaris.
# TAREA
Recibirás la Ficha de Memoria actual en formato Markdown y una instrucción del usuario (texto transcrito de voz y/o una foto de la pantalla del juego).
# REGLAS
- Actualiza únicamente los datos mencionados o visibles en la imagen manteniendo exactamente la misma estructura y secciones de la plantilla Markdown.
- Conserva intactos los datos anteriores que no hayan cambiado.
- Devuelve EXCLUSIVAMENTE el texto Markdown actualizado, sin saludos ni explicaciones adicionales.
`
};
7. Plantilla Inicial por Defecto (DEFAULT_GAME_MEMORY)
Markdown
# ESTADO DEL IMPERIO - SALA DE GUERRA

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
- **Pendiente / Dilema Inmediato:** Ninguno
8. Criterios de Aceptación para el Agente de Desarrollo
Cero dependencias de servidor: La aplicación debe compilar como exportación estática (next build) y funcionar comunicándose directamente desde el navegador del celular hacia Gemini API, OpenRouter o la IP local de Ollama.

Compresión de imagen obligatoria: Cualquier foto tomada desde el móvil debe reducirse a un máximo de 1024px en su lado más largo antes de enviarse al LLM para minimizar latencia y consumo de tokens.

Orquestación en dos pasos: Garantizar con Promise.allSettled() que los 4 primeros secretarios respondan simultáneamente (~1.5s total) y sus respuestas se inyecten como contexto en la llamada final al agente blackops.

Resiliencia de Voz: Si el navegador no soporta SpeechRecognition o el usuario está en un entorno ruidoso, el campo de texto y la edición manual de la ficha deben funcionar sin bloqueos.