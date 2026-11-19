# Changelog

## [1.0.0] - 2026-11-19

### Phase 4 — Simplification and final polish

- Consolidated Gemini and Google Cloud Text-to-Speech on one Google API Key, requested on first launch when no key is saved, with no credential embedded in the application.
- Retired alternate LLM providers and separate speech credentials. Gemini model presets and custom model IDs remain configurable.
- Added six fixed Neural2 voices for the cabinet and removed manual pitch, speaking-rate, and browser-voice controls. Agent prompts now direct natural, role-specific pacing and punctuation.
- Simplified cabinet dossiers to name, assigned voice, quick voice test, and optional collapsed visual customization.
- Added Screen Wake Lock during Push-to-Talk and cabinet deliberations, with reacquisition when returning to the app and graceful handling where unsupported.
- Migrated beta saves to the unified key/model and six-voice configuration while preserving empire profiles, decisions, and chat history.

## [0.0.1-beta.3] - 2026-11-19

### Phase 3 — Gemini model refresh and Google Cloud neural speech

- Updated Gemini's default model to `gemini-3.8-flash`, added `gemini-3.8-pro` and `gemini-4-hydrogen` presets, and retained support for custom model IDs.
- Migrated existing saves using the previous default `gemini-2.5-flash` to the new default without changing custom model selections.
- Added client-side Google Cloud Text-to-Speech playback using `es-US-Neural2` voices, agent-specific voice selection, pitch, and speaking rate.
- Reused the Google API key when Gemini is selected and added an optional separate Cloud TTS key. Cloud TTS failures or missing credentials fall back to browser speech synthesis.
- Cleaned Markdown from spoken content and preserved sequential cabinet voice playback.

## [0.0.1-beta.2] - 2026-11-19

### Phase 2 — Empire setup, crisis timeline, and cabinet dossiers

- Added screenshot-based Stellaris empire setup with vision-to-JSON extraction for the complete `EmpireProfile`, plus manual review and editing.
- Injected the empire constitution and the five most recent timeline events into all cabinet and Black Ops consultations.
- Replaced the static resource sheet with a chronological decision timeline. Each completed cabinet turn records the user's dilemma, the four ministers' recommendations, the Black Ops audit, and a pending verdict.
- Added controls to approve a recommendation or edit and save a final decision.
- Added editable dossiers for all five agents: display name and rank, compressed photo or preset avatar, tactical color, browser voice, pitch, speed, and role notes.
- Connected dossier settings to response cards, system prompts, individual playback, and sequential speech output.
- Added migration from earlier beta saves, retained JSON import/export, and documented the new workflows.
- Made the deployment base path configurable: Vercel uses the domain root by default; the GitHub Pages workflow sets its project subpath explicitly.

### Phase 1 — Functional Imperial War Room beta

- Built a mobile-first, client-side Next.js App Router application with static export and a basic installable PWA.
- Implemented the tactical chat UI, camera capture and client-side image compression, push-to-talk speech recognition, and speech synthesis.
- Added direct Gemini, OpenRouter, and Ollama provider support with browser-local configuration and localStorage persistence.
- Implemented the four-minister parallel consultation followed by a sequential Black Ops audit.
- Added editable game memory and JSON save import/export in the initial beta.
- Configured the static site for GitHub Pages deployment.

## [0.0.1-beta.1] - 2026-11-19

- First functional beta release: mobile tactical war room, multi-provider LLM client, voice and camera input, persistent game memory, and static PWA deployment.
