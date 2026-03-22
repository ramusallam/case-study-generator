'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { decodeSharedCase, type SharedStudentCase } from '@/lib/serialize';
import { getSharedCase } from '@/lib/firebase';
import { REVEAL_STAGES } from '@/lib/disciplines';

function StudentView() {
  const params = useSearchParams();
  const [revealIndex, setRevealIndex] = useState(0);
  const [studentCase, setStudentCase] = useState<SharedStudentCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Try Firebase ID first
      const id = params.get('id');
      if (id) {
        try {
          const data = await getSharedCase(id);
          if (!cancelled && data) {
            setStudentCase(data as unknown as SharedStudentCase);
            setLoading(false);
            return;
          }
        } catch {
          // Fall through to error
        }
      }

      // Fallback: try LZ-string encoded case param
      const encoded = params.get('case');
      if (encoded) {
        const decoded = decodeSharedCase(encoded);
        if (!cancelled && decoded) {
          setStudentCase(decoded);
          setLoading(false);
          return;
        }
      }

      if (!cancelled) {
        setError(true);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [params]);

  if (loading) {
    return (
      <div className="student-shell">
        <div className="student-body" style={{ textAlign: 'center', paddingTop: '20vh' }}>
          <div className="spinner-lg" />
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 16 }}>Loading case...</p>
        </div>
      </div>
    );
  }

  if (error || !studentCase) {
    return (
      <div className="student-shell">
        <div className="student-error">
          <h1>Case not found</h1>
          <p>This link may be incomplete or expired. Ask your teacher for a new link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-shell">
      <div className="student-header">
        <div className="student-brand">
          <div className="student-logo">CS</div>
          <div>
            <strong>{studentCase.title}</strong>
            <div className="student-subtitle">Diagnostic Case Study</div>
          </div>
        </div>
        <div className="student-controls">
          <span className="student-progress">{revealIndex + 1} / {REVEAL_STAGES.length}</span>
          <button className="btn btn-student" onClick={() => setRevealIndex((v) => Math.max(0, v - 1))} disabled={revealIndex === 0}>
            Back
          </button>
          <button className="btn btn-student btn-student-primary" onClick={() => setRevealIndex((v) => Math.min(REVEAL_STAGES.length - 1, v + 1))} disabled={revealIndex === REVEAL_STAGES.length - 1}>
            Reveal Next
          </button>
        </div>
      </div>

      <div className="student-body">
        <div className="student-intro">
          <h1>{studentCase.title}</h1>
          <p>{studentCase.summary}</p>
          <p className="student-task"><strong>Your task:</strong> {studentCase.studentPrompt}</p>
        </div>

        <div className="student-stages">
          {REVEAL_STAGES.slice(0, revealIndex + 1).map((stage) => {
            const items = studentCase.progressiveReveal[stage.key as keyof typeof studentCase.progressiveReveal];
            if (!items || items.length === 0) return null;
            return (
              <div className="student-stage" key={stage.key}>
                <h2>{stage.label}</h2>
                <ul>
                  {items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="student-dots">
          {REVEAL_STAGES.map((stage, i) => (
            <div key={stage.key} className={`student-dot ${i <= revealIndex ? 'student-dot-active' : ''}`} title={stage.label} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StudentPage() {
  return (
    <Suspense fallback={
      <div className="student-shell">
        <div className="student-body" style={{ textAlign: 'center', paddingTop: '20vh' }}>
          <div className="spinner-lg" />
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 16 }}>Loading case...</p>
        </div>
      </div>
    }>
      <StudentView />
    </Suspense>
  );
}
