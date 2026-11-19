This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Imperial War Room beta

The app is a client-side Stellaris cabinet. Configure a Gemini, OpenRouter, or Ollama provider from **Ajustes IA**. On first launch, use **Analizar resumen de Stellaris** to extract the empire constitution from a screenshot; review or edit the extracted fields before saving. The constitution is included in every minister and Black Ops prompt.

**📋** opens the empire constitution and chronological cabinet-decision timeline. Each completed consultation is recorded with one-line recommendations from all five cabinet members. Approve an option or edit the verdict; the five latest events are provided as historical context on later consultations.

**🪪 Gabinete** opens the five editable member dossiers, including name/rank, compressed avatar, tactical color, Google neural voice, browser fallback voice, pitch, speed, and role notes. Dossier changes are persisted locally and are reflected in chat cards, voice playback, and system prompts.

Gemini defaults to `gemini-3.8-flash`; **Ajustes IA** also offers `gemini-3.8-pro`, `gemini-4-hydrogen`, and a freeform model ID. Google Cloud Text-to-Speech is the primary speech engine. It reuses the configured Google API key when Gemini is selected, or accepts a separate TTS key; browser speech synthesis is the automatic fallback. Enable the Cloud Text-to-Speech API (and billing, if required for your account) for the Google key.

All game state and provider settings are stored in browser `localStorage`. API credentials remain on the device and are sent directly to the selected provider or Google Cloud TTS. Export/import a save from the controls in **Ajustes IA**.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

Import the repository into [Vercel](https://vercel.com/new) and deploy with the default root path; no `NEXT_PUBLIC_BASE_PATH` environment variable is needed. The GitHub Pages workflow sets `NEXT_PUBLIC_BASE_PATH=/ImperialWarRoom` for its project subpath automatically.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
