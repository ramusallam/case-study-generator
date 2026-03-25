import { NextResponse } from 'next/server';
import { apiResultSchema, generationFormSchema } from '@/lib/schema';
import { buildCasePrompt } from '@/lib/prompt';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 60;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    cases: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          summary: { type: 'string' },
          teacherRationale: { type: 'string' },
          studentPrompt: { type: 'string' },
          progressiveReveal: {
            type: 'object',
            properties: {
              chiefComplaint: { type: 'array', items: { type: 'string' } },
              history: { type: 'array', items: { type: 'string' } },
              vitals: { type: 'array', items: { type: 'string' } },
              examFindings: { type: 'array', items: { type: 'string' } },
              labsAndImaging: { type: 'array', items: { type: 'string' } },
              synthesis: { type: 'array', items: { type: 'string' } },
            },
            required: ['chiefComplaint', 'history', 'vitals', 'examFindings', 'labsAndImaging', 'synthesis'],
          },
          differentialDiagnoses: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                diagnosis: { type: 'string' },
                whyItFits: { type: 'string' },
                whyItFallsShort: { type: 'string' },
              },
              required: ['diagnosis', 'whyItFits', 'whyItFallsShort'],
            },
          },
          correctDiagnosis: { type: 'string' },
          diagnosticClues: { type: 'array', items: { type: 'string' } },
          differentialClues: { type: 'array', items: { type: 'string' } },
          suggestedNextTests: { type: 'array', items: { type: 'string' } },
          teacherNotes: {
            type: 'object',
            properties: {
              contentTunnel: { type: 'string' },
              coreConcepts: { type: 'array', items: { type: 'string' } },
              misconceptionsToWatch: { type: 'array', items: { type: 'string' } },
              whyThisCaseWorks: { type: 'string' },
            },
            required: ['contentTunnel', 'coreConcepts', 'misconceptionsToWatch', 'whyThisCaseWorks'],
          },
          editableNarrative: { type: 'string' },
        },
        required: [
          'id', 'title', 'summary', 'teacherRationale', 'studentPrompt',
          'progressiveReveal', 'differentialDiagnoses', 'correctDiagnosis',
          'diagnosticClues', 'differentialClues', 'suggestedNextTests',
          'teacherNotes', 'editableNarrative',
        ],
      },
    },
  },
  required: ['cases'],
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    console.error('[case-generator] GEMINI_API_KEY is not configured');
    return NextResponse.json(
      { error: 'The AI service is not configured. The site owner needs to add a Gemini API key.' },
      { status: 503 }
    );
  }

  let input;
  try {
    const body = await request.json();
    input = generationFormSchema.parse(body);
  } catch (err) {
    const msg = err instanceof z.ZodError
      ? `Invalid input: ${err.errors.map((e) => e.message).join(', ')}`
      : 'Invalid request body.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    // Use streamGenerateContent to keep Vercel connection alive
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'You are an expert science education case study designer. Produce only schema-valid JSON. No markdown. No preamble. No explanation outside the JSON.\n\n' + buildCasePrompt(input),
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.8,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const status = res.status;
      const errorBody = await res.text().catch(() => '');
      console.error(`[case-generator] Gemini returned ${status}:`, errorBody.slice(0, 500));
      if (status === 429) {
        return NextResponse.json({ error: 'The AI service is temporarily overloaded. Wait a moment and try again.' }, { status: 429 });
      }
      if (status === 401 || status === 403) {
        return NextResponse.json({ error: 'The AI service credentials are invalid. Contact the site owner.' }, { status: 503 });
      }
      return NextResponse.json({ error: 'The AI service encountered an error. Try again in a moment.' }, { status: 502 });
    }

    // Stream the Gemini SSE response back to the client as plain text chunks
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const geminiBody = res.body;

    if (!geminiBody) {
      return NextResponse.json({ error: 'The AI returned an empty response. Try again.' }, { status: 502 });
    }

    const stream = new ReadableStream({
      async start(streamController) {
        const reader = geminiBody.getReader();
        let accumulated = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            // Parse SSE lines from Gemini
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;

              try {
                const parsed = JSON.parse(jsonStr);
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  accumulated += text;
                  // Send a keep-alive chunk to the client
                  streamController.enqueue(encoder.encode(`data: ${JSON.stringify({ partial: true, chunk: text })}\n\n`));
                }
              } catch {
                // Skip malformed SSE chunks
              }
            }
          }

          // All chunks received — validate the full response
          if (!accumulated) {
            streamController.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'The AI returned an empty response. Try again.' })}\n\n`));
            streamController.close();
            return;
          }

          let jsonData;
          try {
            jsonData = JSON.parse(accumulated);
          } catch {
            console.error('[case-generator] Invalid JSON from model:', accumulated.slice(0, 300));
            streamController.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'The AI returned malformed data. Try again.' })}\n\n`));
            streamController.close();
            return;
          }

          let validated;
          try {
            validated = apiResultSchema.parse(jsonData);
          } catch (err) {
            const zodMsg = err instanceof z.ZodError
              ? err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
              : 'unknown';
            console.error('[case-generator] Schema validation failed:', zodMsg);
            streamController.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "The AI response didn't match the expected format. Try again." })}\n\n`));
            streamController.close();
            return;
          }

          // Send the final validated result
          streamController.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, ...validated })}\n\n`));
          streamController.close();
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            streamController.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Generation timed out. Try generating fewer cases or simplifying the request.' })}\n\n`));
          } else {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('[case-generator] Stream error:', message);
            streamController.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Something went wrong. Try again.' })}\n\n`));
          }
          streamController.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Generation timed out. Try generating fewer cases or simplifying the request.' }, { status: 504 });
    }
    const message = error instanceof Error ? error.message : 'Unknown server error.';
    console.error('[case-generator] Unexpected error:', message);
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  } finally {
    clearTimeout(timeout);
  }
}
