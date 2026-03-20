import type { CaseStudy } from '@/lib/schema';
import { REVEAL_STAGES } from '@/lib/disciplines';

export function formatTeacherPlainText(c: CaseStudy): string {
  const lines: string[] = [];
  lines.push(c.title);
  lines.push('='.repeat(c.title.length));
  lines.push('');
  lines.push(c.summary);
  lines.push('');
  lines.push(`Teacher Rationale: ${c.teacherRationale}`);
  lines.push('');
  lines.push(`Student Task: ${c.studentPrompt}`);
  lines.push('');

  for (const stage of REVEAL_STAGES) {
    const items = c.progressiveReveal[stage.key];
    if (items.length > 0) {
      lines.push(stage.label);
      lines.push('-'.repeat(stage.label.length));
      for (const item of items) {
        lines.push(`  • ${item}`);
      }
      lines.push('');
    }
  }

  lines.push('Differential Diagnoses');
  lines.push('---------------------');
  for (let i = 0; i < c.differentialDiagnoses.length; i++) {
    const d = c.differentialDiagnoses[i];
    lines.push(`${i + 1}. ${d.diagnosis}`);
    lines.push(`   Why it fits: ${d.whyItFits}`);
    lines.push(`   Why it falls short: ${d.whyItFallsShort}`);
  }
  lines.push('');

  lines.push(`Correct Diagnosis: ${c.correctDiagnosis}`);
  lines.push('');

  lines.push('Diagnostic Clues');
  for (const clue of c.diagnosticClues) {
    lines.push(`  • ${clue}`);
  }
  lines.push('');

  lines.push('What Keeps the Differential Open');
  for (const clue of c.differentialClues) {
    lines.push(`  • ${clue}`);
  }
  lines.push('');

  if (c.suggestedNextTests.length > 0) {
    lines.push('Suggested Next Tests');
    for (const test of c.suggestedNextTests) {
      lines.push(`  • ${test}`);
    }
    lines.push('');
  }

  lines.push('Teacher Notes');
  lines.push('-------------');
  lines.push(`Content tunnel: ${c.teacherNotes.contentTunnel}`);
  lines.push(`Core concepts: ${c.teacherNotes.coreConcepts.join(', ')}`);
  lines.push(`Misconceptions to watch: ${c.teacherNotes.misconceptionsToWatch.join(', ')}`);
  lines.push(`Why this case works: ${c.teacherNotes.whyThisCaseWorks}`);

  return lines.join('\n');
}

export function formatStudentPlainText(c: CaseStudy): string {
  const lines: string[] = [];
  lines.push(c.title);
  lines.push('='.repeat(c.title.length));
  lines.push('');
  lines.push(c.summary);
  lines.push('');
  lines.push(`Your Task: ${c.studentPrompt}`);
  lines.push('');

  for (const stage of REVEAL_STAGES) {
    const items = c.progressiveReveal[stage.key];
    if (items.length > 0) {
      lines.push(stage.label);
      lines.push('-'.repeat(stage.label.length));
      for (const item of items) {
        lines.push(`  • ${item}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

export function formatTeacherMarkdown(c: CaseStudy): string {
  const lines: string[] = [];
  lines.push(`# ${c.title}`);
  lines.push('');
  lines.push(c.summary);
  lines.push('');
  lines.push(`> **Teacher Rationale:** ${c.teacherRationale}`);
  lines.push('');
  lines.push(`**Student Task:** ${c.studentPrompt}`);
  lines.push('');

  for (const stage of REVEAL_STAGES) {
    const items = c.progressiveReveal[stage.key];
    if (items.length > 0) {
      lines.push(`## ${stage.label}`);
      for (const item of items) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }
  }

  lines.push('## Differential Diagnoses');
  for (let i = 0; i < c.differentialDiagnoses.length; i++) {
    const d = c.differentialDiagnoses[i];
    lines.push(`${i + 1}. **${d.diagnosis}**`);
    lines.push(`   - *Why it fits:* ${d.whyItFits}`);
    lines.push(`   - *Why it falls short:* ${d.whyItFallsShort}`);
  }
  lines.push('');

  lines.push(`**Correct Diagnosis:** ${c.correctDiagnosis}`);
  lines.push('');

  lines.push('## Diagnostic Clues');
  for (const clue of c.diagnosticClues) {
    lines.push(`- ${clue}`);
  }
  lines.push('');

  lines.push('## What Keeps the Differential Open');
  for (const clue of c.differentialClues) {
    lines.push(`- ${clue}`);
  }
  lines.push('');

  if (c.suggestedNextTests.length > 0) {
    lines.push('## Suggested Next Tests');
    for (const test of c.suggestedNextTests) {
      lines.push(`- ${test}`);
    }
    lines.push('');
  }

  lines.push('## Teacher Notes');
  lines.push(`- **Content tunnel:** ${c.teacherNotes.contentTunnel}`);
  lines.push(`- **Core concepts:** ${c.teacherNotes.coreConcepts.join(', ')}`);
  lines.push(`- **Misconceptions to watch:** ${c.teacherNotes.misconceptionsToWatch.join(', ')}`);
  lines.push(`- **Why this case works:** ${c.teacherNotes.whyThisCaseWorks}`);

  return lines.join('\n');
}

export function formatStudentMarkdown(c: CaseStudy): string {
  const lines: string[] = [];
  lines.push(`# ${c.title}`);
  lines.push('');
  lines.push(c.summary);
  lines.push('');
  lines.push(`**Your Task:** ${c.studentPrompt}`);
  lines.push('');

  for (const stage of REVEAL_STAGES) {
    const items = c.progressiveReveal[stage.key];
    if (items.length > 0) {
      lines.push(`## ${stage.label}`);
      for (const item of items) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}
