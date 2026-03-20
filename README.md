# Case Study Generator v3

AI-powered diagnostic case study generator for high school science teachers. Create medically plausible fictional patient cases that tunnel students toward biology, chemistry, neuroscience, and medical biochemistry content through clinical reasoning.

## What It Does

Teachers start with the scientific topic they want students to learn. The app generates fictional patient cases designed to lead students toward that content through diagnosis. Students analyze symptoms, propose differential diagnoses, and justify their reasoning from evidence — building authentic inquiry before the teacher reveals the underlying science.

### Teacher Studio
- **Discipline presets**: Biology, Chemistry, Medical Biochemistry, Neuroscience, Custom
- **Case tone selection**: Classic ER, Clinic Visit, Sports Physical, Urgent Care, School Nurse, Mystery
- **Fine-tuned controls**: Difficulty, tunnel strength, ambiguity, reveal mode, case features
- **Generate 1-4 cases** at once with full teacher notes
- **Quick refinement actions**: "More like this", "Tighten tunnel", "More ambiguous", "Different diagnosis"
- **Structured inline editing**: Edit every field of the generated case directly
- **Export**: Copy teacher version, student version, Markdown, or print

### Presentation Mode
- Dark, distraction-free view optimized for classroom projection
- 6-stage progressive reveal: Chief Complaint → History → Vitals → Exam Findings → Labs & Imaging → Final Prompt
- Fullscreen support via browser Fullscreen API
- Stage dot navigation

### Student Sharing
- **No database required**: Case data is compressed (LZ-string) and encoded directly into a shareable URL
- **QR code generation**: Built-in QR code for easy classroom distribution
- **Student-safe**: Only the case narrative and reveal stages are shared — no teacher notes or answer key

## Running Locally

```bash
npm install
cp .env.example .env.local
# Add your OpenAI API key to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | — | Your OpenAI API key (server-side only) |
| `OPENAI_MODEL` | No | `gpt-4o` | OpenAI model to use for generation |

## Deploying to Vercel

1. Push this repo to GitHub
2. Import the repo in [Vercel](https://vercel.com/new)
3. Add `OPENAI_API_KEY` as an environment variable in Vercel project settings
4. Deploy

The app uses the OpenAI Responses API with JSON Schema structured output for reliable, typed responses.

## Student Sharing: How It Works

The student share link encodes the student-safe portion of the case (title, summary, student prompt, and progressive reveal data) into the URL using LZ-string compression. This means:

- **No backend storage needed** for sharing
- **Links are self-contained** and work even if the server goes down
- **Teacher notes are never exposed** — only student-facing content is serialized

### Known Limits
- Very long cases may produce URLs that exceed browser/server limits (~2000 characters for some contexts). Most cases fit comfortably.
- If a URL is too long, shorten the case text in the editor before sharing.
- There is no analytics or tracking on shared links.

## Architecture

- `app/page.tsx` — Teacher studio (main interface)
- `app/student/page.tsx` — Student share page (read-only, progressive reveal)
- `app/api/generate/route.ts` — Server-side OpenAI generation route
- `components/TeacherStudio.tsx` — Main app component
- `lib/schema.ts` — Zod schemas for form input and model output
- `lib/prompt.ts` — Backward-design prompt construction with discipline awareness
- `lib/disciplines.ts` — Discipline presets, case tones, reveal stage config
- `lib/export.ts` — Export formatting (plain text, Markdown, teacher/student versions)
- `lib/serialize.ts` — URL-safe student share encoding/decoding

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **AI**: OpenAI API (server-side, structured output with JSON Schema)
- **Styling**: Vanilla CSS with custom properties
- **Compression**: LZ-string for URL-based sharing
- **QR Codes**: qrcode.react
- **Validation**: Zod schemas
- **Deployment**: Vercel
