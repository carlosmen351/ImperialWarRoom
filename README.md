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

## Imperial War Room 1.0.0

Imperial War Room is a client-side Stellaris cabinet. On first launch, enter one Google API Key; it is stored only in this browser and used for Google Gemini API and Google Cloud Text-to-Speech. Enable both services for the associated Google Cloud project. Gemini defaults to `gemini-3.8-flash`; **⚙** lets you choose `gemini-3.8-pro`, `gemini-4-hydrogen`, or enter a custom model ID.

Use **Analizar resumen de Stellaris** to extract the empire constitution from a screenshot; review or edit the extracted fields before saving. The constitution is included in every minister and Black Ops prompt.

**📋** opens the empire constitution and chronological cabinet-decision timeline. Each completed consultation is recorded with one-line recommendations from all five cabinet members. Approve an option or edit the verdict; the five latest events are provided as historical context on later consultations.

**🪪 Gabinete** opens the five member dossiers. Edit each member's name and one of six Google Neural2 voices; the optional visual settings contain the accent color and avatar/photo. **🔊 Probar** plays a short greeting. Voice pitch and speed are left to the natural cadence of each member's system prompt.

The cabinet consults four ministers in parallel, then runs the final Black Ops audit. Push-to-Talk, camera input, the automatic crisis timeline, and Screen Wake Lock during voice input and consultations are supported. Google Cloud Text-to-Speech is the primary voice engine; browser speech synthesis is the silent emergency fallback.

All game state and the API Key are stored in browser `localStorage`. The key is sent directly from the browser to the Google APIs. Export/import a save from **⚙**.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

Import the repository into [Vercel](https://vercel.com/new) and deploy with the default root path; no `NEXT_PUBLIC_BASE_PATH` environment variable is needed. The GitHub Pages workflow sets `NEXT_PUBLIC_BASE_PATH=/ImperialWarRoom` for its project subpath automatically.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
