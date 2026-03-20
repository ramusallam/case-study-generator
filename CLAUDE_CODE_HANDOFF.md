# Claude Code handoff prompt

Use this repo as the starting point. Do not re-architect it from scratch.

## Goal
Refine this teacher-facing diagnostic case study generator for a high school science teacher who uses inquiry-based medical and scientific case studies to tunnel students toward unit content in biology, chemistry, neuroscience, and medical biochemistry.

## Existing architecture to preserve
- Next.js app router
- Server-side OpenAI route at `app/api/generate/route.ts`
- Teacher studio on `/`
- Student share page on `/student`
- URL-based student sharing with QR code, no database yet
- Editable final case narrative
- Presentation mode with gradual reveal

## Design direction
- Extremely low cognitive load for the teacher
- Clean, beautiful, spacious UI
- Teacher-first workflow
- Student view should be projection-friendly and easy to parse
- Keep the app feeling elegant rather than cluttered

## Priorities for v3
1. Improve visual polish and responsive layout
2. Add discipline presets: Biology, Chemistry, Neuroscience, Medical Biochemistry
3. Add a "Generate more like this" flow that preserves the selected case structure while changing the scenario
4. Add better export formatting: Markdown copy, plain text copy, and print-friendly layout
5. Improve prompt quality and output consistency
6. Add local save/favorite case functionality in browser storage
7. Add optional "teacher notes hidden" presentation mode
8. Add better input affordances and helper text for each field
9. Preserve low cognitive load at all times

## Constraints
- Keep API key server-side only
- No heavy database yet
- Do not remove the URL-based share flow
- Do not turn it into a generic chatbot
- Keep the backward-design pedagogy central
