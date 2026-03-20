'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { decodeSharedCase } from '@/lib/serialize';
import type { RevealStage } from '@/components/types';

export default function StudentPage() {
  const params = useSearchParams();
  const [revealIndex, setRevealIndex] = useState(0);

  const studentCase = useMemo(() => {
    const encoded = params.get('case');
    return encoded ? decodeSharedCase(encoded) : null;
  }, [params]);

  const revealStages: { key: RevealStage; label: string }[] = [
    { key: 'initialPresentation', label: 'Initial presentation' },
    { key: 'vitalsAndHistory', label: 'Vitals and history' },
    { key: 'followUpTesting', label: 'Follow-up testing' },
    { key: 'finalTeacherReveal', label: 'Teacher reveal' },
  ];

  if (!studentCase) {
    return (
      <div className="page">
        <div className="panel resultPanel">
          <h1 className="sectionTitle">Student case not found</h1>
          <p className="sectionSub">This link may be incomplete or corrupted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="presentationShell">
      <div className="presentationTop">
        <div>
          <strong>{studentCase.title}</strong>
          <div className="revealMuted">Student-facing case view</div>
        </div>
        <div className="actions" style={{ marginTop: 0 }}>
          <button className="btn" onClick={() => setRevealIndex((v) => Math.max(0, v - 1))}>Back</button>
          <button className="btn btnPrimary" onClick={() => setRevealIndex((v) => Math.min(revealStages.length - 1, v + 1))}>Reveal next</button>
        </div>
      </div>

      <div className="presentationBody">
        <div className="revealGrid">
          <div className="revealCard">
            <h2>{studentCase.title}</h2>
            <p className="revealMuted">{studentCase.summary}</p>
            <p><strong>Your task:</strong> {studentCase.studentPrompt}</p>
          </div>

          {revealStages.slice(0, revealIndex + 1).map((stage) => (
            <div className="revealCard" key={stage.key}>
              <h3>{stage.label}</h3>
              <ul>
                {studentCase.progressiveReveal[stage.key].map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
