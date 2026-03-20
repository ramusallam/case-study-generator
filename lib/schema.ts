import { z } from 'zod';

export const generationFormSchema = z.object({
  discipline: z.string().min(1),
  course: z.string().min(1),
  gradeBand: z.string().min(1),
  topicTargets: z.string().min(1).max(5000),
  scientificTunnel: z.string().min(1).max(5000),
  preferredDiagnosis: z.string().max(500).optional(),
  difficulty: z.number().min(1).max(5),
  tunnelStrength: z.number().min(1).max(5),
  ambiguity: z.number().min(1).max(5),
  revealMode: z.enum(['symptoms_only', 'symptoms_plus_testing', 'progressive']),
  caseTone: z.string().max(100).optional(),
  includeVitals: z.boolean(),
  includeLabs: z.boolean(),
  includeImaging: z.boolean(),
  includeHistory: z.boolean(),
  focusNotes: z.string().max(2000).optional(),
  constraints: z.string().max(2000).optional(),
  studentTask: z.string().max(2000).optional(),
  count: z.number().min(1).max(4),
  refinement: z.object({
    action: z.string().min(1).max(100),
    sourceCase: z.record(z.unknown()).optional(),
    excludeDiagnosis: z.string().max(500).optional(),
  }).optional(),
});

export const differentialSchema = z.object({
  diagnosis: z.string(),
  whyItFits: z.string(),
  whyItFallsShort: z.string(),
});

export const caseStudySchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  teacherRationale: z.string(),
  studentPrompt: z.string(),
  progressiveReveal: z.object({
    chiefComplaint: z.array(z.string()),
    history: z.array(z.string()),
    vitals: z.array(z.string()),
    examFindings: z.array(z.string()),
    labsAndImaging: z.array(z.string()),
    synthesis: z.array(z.string()),
  }),
  differentialDiagnoses: z.array(differentialSchema),
  correctDiagnosis: z.string(),
  diagnosticClues: z.array(z.string()),
  differentialClues: z.array(z.string()),
  suggestedNextTests: z.array(z.string()),
  teacherNotes: z.object({
    contentTunnel: z.string(),
    coreConcepts: z.array(z.string()),
    misconceptionsToWatch: z.array(z.string()),
    whyThisCaseWorks: z.string(),
  }),
  editableNarrative: z.string(),
});

export const apiResultSchema = z.object({
  cases: z.array(caseStudySchema),
});

// Saved case includes metadata for the library
export const savedCaseSchema = caseStudySchema.extend({
  savedAt: z.string(),
  discipline: z.string(),
  course: z.string(),
  tags: z.array(z.string()).optional(),
  favorite: z.boolean().optional(),
});

export type GenerationForm = z.infer<typeof generationFormSchema>;
export type CaseStudy = z.infer<typeof caseStudySchema>;
export type ApiResult = z.infer<typeof apiResultSchema>;
export type Differential = z.infer<typeof differentialSchema>;
export type SavedCase = z.infer<typeof savedCaseSchema>;
