# Case Study Generator v2

A Vercel-ready Next.js app that generates high-school science diagnostic case studies from backward-designed content targets.

## What it does

- Generates 1 to 4 medically plausible fictional cases from your science topic and content tunnel
- Keeps the teacher in control with an editable final narrative
- Supports a classroom presentation mode with gradual reveal
- Creates a unique student-facing URL and QR code without requiring a full database
- Uses a server-side OpenAI API key so secrets are not exposed in the browser

## Recommended model setup

Use OpenAI through the server route with one of these models:

- `gpt-5-mini` for fast iteration
- `gpt-5` for stronger outputs
- `gpt-5.4` if that is enabled in your account and available to your API project

Update the environment variable as needed:

```bash
OPENAI_MODEL=gpt-5-mini
```

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open:

```bash
http://localhost:3000
```

## Environment variables

```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-5-mini
```

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import it into Vercel.
3. Add `OPENAI_API_KEY` and `OPENAI_MODEL` in the Vercel project settings.
4. Deploy.

## Current architecture

- `app/page.tsx` ... teacher studio
- `app/student/page.tsx` ... student share page
- `app/api/generate/route.ts` ... server-side OpenAI generation route
- `lib/prompt.ts` ... backward-design prompt construction
- `lib/schema.ts` ... Zod schemas for form input and model output
- `lib/serialize.ts` ... URL-safe student share encoding

## Important note about sharing

This version uses URL-encoded student-safe case payloads for share links and QR codes. That keeps the stack light and avoids a database. It is great for typical classroom cases. If you later want analytics, student response collection, persistence, or larger assets, add lightweight storage such as Firebase, Vercel Blob, or KV.

## Suggested next upgrades

- Save favorite cases locally or in Firebase
- Add template presets by discipline
- Add export to Google Docs / Markdown / PDF
- Add classroom timer and reveal controls
- Add a simple library of previous generated cases
