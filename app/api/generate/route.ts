import { NextResponse } from 'next/server';
import { apiResultSchema, generationFormSchema } from '@/lib/schema';
import { buildCasePrompt } from '@/lib/prompt';

export const runtime = 'nodejs';

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
  try {
    const body = await request.json();
    const input = generationFormSchema.parse(body);
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4o';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing OPENAI_API_KEY. Add it to your environment variables before generating.' },
        { status: 500 }
      );
    }

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
                text: 'You are a expert science education case study designer. Produce only schema-valid JSON. No markdown. No preamble. No explanation outside the JSON.',
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
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `OpenAI request failed: ${errorText}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    const outputText = data.output_text;

    if (!outputText) {
      return NextResponse.json(
        { error: 'The model returned no text output.' },
        { status: 500 }
      );
    }

    const parsed = apiResultSchema.parse(JSON.parse(outputText));
    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
