import type { GenerationForm } from '@/lib/schema';
import { DISCIPLINES, CASE_TONES } from '@/lib/disciplines';
import type { Discipline, CaseTone } from '@/lib/disciplines';

export function buildCasePrompt(input: GenerationForm): string {
  const difficultyMap = ['Very accessible', 'Accessible', 'Moderate', 'Challenging', 'Very challenging'];
  const tunnelMap = ['Loose', 'Light', 'Balanced', 'Strong', 'Very strong'];
  const ambiguityMap = ['Low ambiguity', 'Some ambiguity', 'Balanced ambiguity', 'High ambiguity', 'Very high ambiguity'];

  const discipline = DISCIPLINES[input.discipline as Discipline];
  const disciplineGuidance = discipline?.promptGuidance || '';

  const tone = input.caseTone ? CASE_TONES[input.caseTone as CaseTone] : null;
  const toneGuidance = tone?.promptGuidance || '';

  const refinementBlock = input.refinement
    ? `\n\nREFINEMENT INSTRUCTION:\nAction: ${input.refinement.action}\n${input.refinement.excludeDiagnosis ? `Exclude this diagnosis: ${input.refinement.excludeDiagnosis}` : ''}\n${input.refinement.sourceCase ? `Base your refinement on this existing case structure:\n${JSON.stringify(input.refinement.sourceCase, null, 2)}` : ''}`
    : '';

  return `You are an expert in high school science pedagogy, backward-design inquiry, classroom-safe case writing, and medically plausible fictional scenario design.

Your purpose: Generate diagnostic patient case studies that tunnel high school students toward specific scientific content through the process of clinical reasoning. The teacher starts with the scientific topic they want students to learn, and you create a medically plausible fictional case that leads students to discover that content through diagnosis.

Generate ${input.count} distinct case studies for a ${input.course} class (${input.discipline}) in the ${input.gradeBand} range.

BACKWARD DESIGN TARGET:
- Broad topic or unit: ${input.topicTargets}
- Scientific ideas students should eventually uncover: ${input.scientificTunnel}
${input.preferredDiagnosis ? `- Preferred diagnosis (use this if appropriate): ${input.preferredDiagnosis}` : ''}

DISCIPLINE GUIDANCE:
${disciplineGuidance}

${toneGuidance ? `CASE TONE:\n${toneGuidance}\n` : ''}

CASE DESIGN PARAMETERS:
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
- Student task framing: ${input.studentTask || 'Determine the most likely diagnosis and provide 2 to 3 differential diagnoses with evidence from the case.'}

CRITICAL STUDENT-PROMPT RULE:
The studentPrompt field is shown directly to students. It must NEVER name, hint at, or list specific diagnoses, conditions, diseases, or syndromes. Do not say things like "Consider conditions like X, Y, or Z." The whole point is for students to figure out the diagnosis themselves. The studentPrompt should only frame the clinical scenario and ask students to determine the most likely diagnosis and provide 2-3 differential diagnoses supported by evidence from the case. Keep it open-ended.

QUALITY REQUIREMENTS:
1. All cases must be fictional but medically or scientifically plausible enough for authentic classroom inquiry.
2. Cases must create genuine uncertainty, curiosity, and productive tension in students.
3. The student-facing information should be rich, immersive, and concise enough to project in class.
4. Each case MUST contain real ambiguity early on so students can generate multiple plausible differentials.
5. The correct diagnosis must clearly tunnel into the requested science content — this is the whole point.
6. Avoid sensational trauma, explicit gore, or crisis content. Keep it classroom-safe and age-appropriate.
7. Build the case so students can research toward the answer using evidence-based reasoning.
8. Make each case feel distinct in patient age, setting, symptom pattern, and clue structure.
9. Clues should reward close, careful reading — not be obvious textbook giveaways.
10. Include enough ambiguity to invite genuine scientific reasoning and debate.
11. The progressive reveal should mirror real clinical reasoning: chief complaint → history → vitals → exam → labs/imaging → synthesis prompt.
12. The editableNarrative should read as a complete, polished teacher handout.
13. The synthesis stage should NOT be a full answer key. It should be a thought-provoking final prompt that helps students synthesize their reasoning and transitions the teacher into the unit content.

FIELD-SPECIFIC GUIDANCE:
- teacherRationale: 1-2 sentences explaining why this case is pedagogically effective for the target content. Written for the teacher, not the student.
- diagnosticClues: List the specific clues in the case that point toward the correct diagnosis. Help the teacher see what students should notice.
- differentialClues: List the clues that keep the differential open — what makes other diagnoses plausible early on.
- suggestedNextTests: If the teacher wants to extend the reveal, what additional tests or data could be shared with students?
- misconceptionsToWatch: Common student misconceptions that this case might trigger. Help the teacher anticipate and address them.

OUTPUT FORMAT:
Return valid JSON matching the schema exactly. Each case must have all required fields populated with substantive content.
${refinementBlock}`;
}
