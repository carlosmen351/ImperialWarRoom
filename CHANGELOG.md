# Changelog

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
