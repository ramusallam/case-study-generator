import { NextResponse } from 'next/server';
import { apiResultSchema, generationFormSchema } from '@/lib/schema';
import { buildCasePrompt } from '@/lib/prompt';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 60;

const RESPONSE_SCHEMA = {
  name: 'case_study_bundle',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      cases: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            summary: { type: 'string' },
            teacherRationale: { type: 'string' },
            studentPrompt: { type: 'string' },
            progressiveReveal: {
              type: 'object',
              additionalProperties: false,
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
                additionalProperties: false,
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
              additionalProperties: false,
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
  },
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  if (!apiKey) {
    console.error('[case-generator] OPENAI_API_KEY is not configured');
    return NextResponse.json(
      { error: 'The AI service is not configured. The site owner needs to add an OpenAI API key.' },
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
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: 'You are an expert science education case study designer. Produce only schema-valid JSON. No markdown. No preamble. No explanation outside the JSON.',
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: buildCasePrompt(input),
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            ...RESPONSE_SCHEMA,
          },
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const status = res.status;
      console.error(`[case-generator] OpenAI returned ${status}`);
      if (status === 429) {
        return NextResponse.json({ error: 'The AI service is temporarily overloaded. Wait a moment and try again.' }, { status: 429 });
      }
      if (status === 401) {
        return NextResponse.json({ error: 'The AI service credentials are invalid. Contact the site owner.' }, { status: 503 });
      }
      return NextResponse.json({ error: 'The AI service encountered an error. Try again in a moment.' }, { status: 502 });
    }

    const data = await res.json();
    const outputText = data.output_text;

    if (!outputText) {
      console.error('[case-generator] No output_text in response:', JSON.stringify(data).slice(0, 500));
      return NextResponse.json({ error: 'The AI returned an empty response. Try again.' }, { status: 502 });
    }

    let jsonData;
    try {
      jsonData = JSON.parse(outputText);
    } catch {
      console.error('[case-generator] Invalid JSON from model:', outputText.slice(0, 300));
      return NextResponse.json({ error: 'The AI returned malformed data. Try again.' }, { status: 502 });
    }

    let parsed;
    try {
      parsed = apiResultSchema.parse(jsonData);
    } catch (err) {
      const zodMsg = err instanceof z.ZodError
        ? err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
        : 'unknown';
      console.error('[case-generator] Schema validation failed:', zodMsg);
      return NextResponse.json({ error: 'The AI response didn\'t match the expected format. Try again.' }, { status: 502 });
    }

    return NextResponse.json(parsed);
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
