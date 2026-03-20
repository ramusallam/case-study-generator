import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { CaseStudy } from '@/lib/schema';

export type SharedStudentCase = {
  title: string;
  summary: string;
  studentPrompt: string;
  progressiveReveal: CaseStudy['progressiveReveal'];
};

export function toSharedPayload(caseStudy: CaseStudy): SharedStudentCase {
  return {
    title: caseStudy.title,
    summary: caseStudy.summary,
    studentPrompt: caseStudy.studentPrompt,
    progressiveReveal: caseStudy.progressiveReveal,
  };
}

export function encodeSharedCase(caseStudy: SharedStudentCase) {
  return compressToEncodedURIComponent(JSON.stringify(caseStudy));
}

export function decodeSharedCase(encoded: string): SharedStudentCase | null {
  try {
    const raw = decompressFromEncodedURIComponent(encoded);
    if (!raw) return null;
    return JSON.parse(raw) as SharedStudentCase;
  } catch {
    return null;
  }
}
