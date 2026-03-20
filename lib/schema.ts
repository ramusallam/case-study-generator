import { z } from 'zod';

export const generationFormSchema = z.object({
  course: z.string().min(1),
  gradeBand: z.string().min(1),
  topicTargets: z.string().min(1),
  scientificTunnel: z.string().min(1),
  difficulty: z.number().min(1).max(5),
  tunnelStrength: z.number().min(1).max(5),
  ambiguity: z.number().min(1).max(5),
  revealMode: z.enum(['symptoms_only', 'symptoms_plus_testing', 'progressive']),
  includeVitals: z.boolean(),
  includeLabs: z.boolean(),
  includeImaging: z.boolean(),
  includeHistory: z.boolean(),
  focusNotes: z.string().optional(),
  constraints: z.string().optional(),
  studentTask: z.string().optional(),
  count: z.number().min(1).max(4),
});

export const caseStudySchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  studentPrompt: z.string(),
  progressiveReveal: z.object({
    initialPresentation: z.array(z.string()),
    vitalsAndHistory: z.array(z.string()),
    followUpTesting: z.array(z.string()),
    finalTeacherReveal: z.array(z.string()),
  }),
  differentialDiagnoses: z.array(
    z.object({
      diagnosis: z.string(),
      whyItFits: z.string(),
      whyItFallsShort: z.string(),
    })
  ),
  correctDiagnosis: z.string(),
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

export type GenerationForm = z.infer<typeof generationFormSchema>;
export type CaseStudy = z.infer<typeof caseStudySchema>;
export type ApiResult = z.infer<typeof apiResultSchema>;
