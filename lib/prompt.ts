import type { GenerationForm } from '@/lib/schema';

export function buildCasePrompt(input: GenerationForm) {
  const difficultyMap = ['Very accessible', 'Accessible', 'Moderate', 'Challenging', 'Very challenging'];
  const tunnelMap = ['Loose', 'Light', 'Balanced', 'Strong', 'Very strong'];
  const ambiguityMap = ['Low ambiguity', 'Some ambiguity', 'Balanced ambiguity', 'High ambiguity', 'Very high ambiguity'];

  return `You are an expert in high school science pedagogy, inquiry design, classroom-safe case writing, and medically plausible fictional scenario design.

Generate ${input.count} distinct case studies for a ${input.course} class in the ${input.gradeBand} range.

Backward design target:
- Broad topic or unit: ${input.topicTargets}
- Scientific ideas students should eventually learn: ${input.scientificTunnel}

Case design constraints:
- Difficulty: ${difficultyMap[input.difficulty - 1]}
- Tunnel strength toward target content: ${tunnelMap[input.tunnelStrength - 1]}
- Ambiguity / differential challenge: ${ambiguityMap[input.ambiguity - 1]}
- Reveal mode: ${input.revealMode}
- Include vitals: ${input.includeVitals ? 'yes' : 'no'}
- Include labs: ${input.includeLabs ? 'yes' : 'no'}
- Include imaging or scan-like findings: ${input.includeImaging ? 'yes' : 'no'}
- Include history and contextual background: ${input.includeHistory ? 'yes' : 'no'}
- Additional teacher focus notes: ${input.focusNotes || 'none'}
- Additional constraints: ${input.constraints || 'none'}
- Student task framing: ${input.studentTask || 'Students should propose a most likely diagnosis and 2 to 3 differential diagnoses using evidence.'}

Requirements:
1. All cases must be fictional but medically or scientifically plausible enough for classroom inquiry.
2. The student-facing information should be rich, immersive, and concise enough to project in class.
3. Each case should contain real ambiguity early on so students can generate multiple differentials.
4. The correct diagnosis must clearly tunnel into the requested science content.
5. Avoid sensational trauma, explicit gore, or crisis content. Keep it classroom-safe.
6. Build the case so an upper high school student can research toward the answer.
7. Make each case feel distinct in age, setting, symptom pattern, and clue structure.
8. The editableNarrative should read smoothly as a full teacher-editable case handout.
9. The finalTeacherReveal should not be a full answer key dump. It should be a restrained reveal that helps the teacher transition into the unit.
10. Output only valid JSON matching the schema.`;
}
