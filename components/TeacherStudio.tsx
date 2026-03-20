'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { encodeSharedCase, toSharedPayload } from '@/lib/serialize';
import type { ApiResult, CaseStudy, GenerationForm } from '@/lib/schema';
import type { RevealStage } from '@/components/types';

const DEFAULT_FORM: GenerationForm = {
  course: 'Neuroscience',
  gradeBand: 'Upper high school',
  topicTargets: 'Action potentials, myelin, neuron signaling, white matter vs gray matter',
  scientificTunnel: 'Students should eventually connect the diagnosis to demyelination, disrupted saltatory conduction, and the role of myelin in nervous system signaling.',
  difficulty: 4,
  tunnelStrength: 4,
  ambiguity: 4,
  revealMode: 'progressive',
  includeVitals: true,
  includeLabs: true,
  includeImaging: true,
  includeHistory: true,
  focusNotes: 'Make the case feel medically authentic without making the answer obvious too early.',
  constraints: 'Keep it classroom-safe and suitable for projection.',
  studentTask: 'Determine the most likely diagnosis and provide 2 to 3 differential diagnoses with evidence.',
  count: 3,
};

function formatNarrative(caseStudy: CaseStudy) {
  return `${caseStudy.title}\n\n${caseStudy.summary}\n\nStudent Task\n${caseStudy.studentPrompt}\n\nInitial Presentation\n${caseStudy.progressiveReveal.initialPresentation.map((i) => `• ${i}`).join('\n')}\n\nVitals and History\n${caseStudy.progressiveReveal.vitalsAndHistory.map((i) => `• ${i}`).join('\n')}\n\nFollow-Up Testing\n${caseStudy.progressiveReveal.followUpTesting.map((i) => `• ${i}`).join('\n')}\n\nTeacher Reveal\n${caseStudy.progressiveReveal.finalTeacherReveal.map((i) => `• ${i}`).join('\n')}\n\nDifferential Diagnoses\n${caseStudy.differentialDiagnoses.map((d, index) => `${index + 1}. ${d.diagnosis}\nWhy it fits: ${d.whyItFits}\nWhy it falls short: ${d.whyItFallsShort}`).join('\n\n')}\n\nCorrect Diagnosis\n${caseStudy.correctDiagnosis}\n\nTeacher Notes\nContent tunnel: ${caseStudy.teacherNotes.contentTunnel}\nCore concepts: ${caseStudy.teacherNotes.coreConcepts.join(', ')}\nMisconceptions to watch: ${caseStudy.teacherNotes.misconceptionsToWatch.join(', ')}\nWhy this case works: ${caseStudy.teacherNotes.whyThisCaseWorks}`;
}

export default function TeacherStudio() {
  const [form, setForm] = useState<GenerationForm>(DEFAULT_FORM);
  const [data, setData] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<'teacher' | 'editor' | 'present' | 'share'>('teacher');
  const [editableText, setEditableText] = useState('');
  const [revealIndex, setRevealIndex] = useState(0);

  const activeCase = data?.cases?.[activeIndex] ?? null;

  useEffect(() => {
    if (activeCase) {
      setEditableText(activeCase.editableNarrative || formatNarrative(activeCase));
      setRevealIndex(0);
    }
  }, [activeCase]);

  const revealStages: { key: RevealStage; label: string }[] = [
    { key: 'initialPresentation', label: 'Initial presentation' },
    { key: 'vitalsAndHistory', label: 'Vitals and history' },
    { key: 'followUpTesting', label: 'Follow-up testing' },
    { key: 'finalTeacherReveal', label: 'Teacher reveal' },
  ];

  const shareUrl = useMemo(() => {
    if (!activeCase || typeof window === 'undefined') return '';
    const encoded = encodeSharedCase(toSharedPayload(activeCase));
    return `${window.location.origin}/student?case=${encoded}`;
  }, [activeCase]);

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Generation failed.');
      }

      setData(json);
      setActiveIndex(0);
      setMode('teacher');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
  }

  function updateForm<K extends keyof GenerationForm>(key: K, value: GenerationForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="page">
      <section className="hero">
        <div className="panel heroCard">
          <h1>Case Study Generator</h1>
          <p>
            Build high-interest diagnostic cases that tunnel students toward the biology, chemistry,
            neuroscience, or medical biochemistry concepts you want them to uncover.
          </p>
          <div className="badges">
            <span className="badge">Backward-designed inquiry</span>
            <span className="badge">Editable teacher output</span>
            <span className="badge">Presentation + share mode</span>
          </div>
        </div>

        <div className="panel summaryCard">
          <h3 className="sectionTitle">What this version does</h3>
          <div className="summaryGrid">
            <div className="summaryItem"><strong>Generate 1 to 4 cases</strong><span>Choose the strongest one or generate more like it.</span></div>
            <div className="summaryItem"><strong>Edit the final wording</strong><span>Micro-edit the narrative before you use it.</span></div>
            <div className="summaryItem"><strong>Present in class</strong><span>Reveal information gradually in a low-load projection view.</span></div>
            <div className="summaryItem"><strong>Share to students</strong><span>Create a unique URL and QR code without a full database.</span></div>
          </div>
        </div>
      </section>

      <section className="mainGrid">
        <aside className="panel formPanel">
          <h2 className="sectionTitle">Teacher setup</h2>
          <p className="sectionSub">Work backward from the science you want students to discover.</p>

          <div className="fieldGrid">
            <div>
              <label className="label">Course / class</label>
              <input className="input" value={form.course} onChange={(e) => updateForm('course', e.target.value)} />
            </div>

            <div className="row2">
              <div>
                <label className="label">Grade band</label>
                <input className="input" value={form.gradeBand} onChange={(e) => updateForm('gradeBand', e.target.value)} />
              </div>
              <div>
                <label className="label">How many cases</label>
                <select className="select" value={form.count} onChange={(e) => updateForm('count', Number(e.target.value) as GenerationForm['count'])}>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Broad topic or unit</label>
              <textarea className="textarea compact" value={form.topicTargets} onChange={(e) => updateForm('topicTargets', e.target.value)} />
            </div>

            <div>
              <label className="label">Scientific content tunnel</label>
              <textarea className="textarea" value={form.scientificTunnel} onChange={(e) => updateForm('scientificTunnel', e.target.value)} />
            </div>

            <div>
              <label className="label">Student task framing</label>
              <textarea className="textarea compact" value={form.studentTask || ''} onChange={(e) => updateForm('studentTask', e.target.value)} />
            </div>

            <div className="row2">
              <div>
                <label className="label">Reveal mode</label>
                <select className="select" value={form.revealMode} onChange={(e) => updateForm('revealMode', e.target.value as GenerationForm['revealMode'])}>
                  <option value="symptoms_only">Symptoms only</option>
                  <option value="symptoms_plus_testing">Symptoms + testing</option>
                  <option value="progressive">Progressive release</option>
                </select>
              </div>
              <div>
                <label className="label">Optional focus</label>
                <input className="input" value={form.focusNotes || ''} onChange={(e) => updateForm('focusNotes', e.target.value)} placeholder="Authenticity, misconception, phenotype..." />
              </div>
            </div>

            <div>
              <label className="label">Case features</label>
              <div className="checkboxRow">
                {[
                  ['includeHistory', 'History'],
                  ['includeVitals', 'Vitals'],
                  ['includeLabs', 'Labs'],
                  ['includeImaging', 'Imaging'],
                ].map(([key, label]) => (
                  <label className="checkboxItem" key={key}>
                    <input
                      type="checkbox"
                      checked={Boolean(form[key as keyof GenerationForm])}
                      onChange={(e) => updateForm(key as keyof GenerationForm, e.target.checked as never)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="rangeWrap">
              <div className="rangeLabelRow"><strong>Difficulty</strong><span className="rangeValue">{form.difficulty} / 5</span></div>
              <input type="range" min={1} max={5} value={form.difficulty} onChange={(e) => updateForm('difficulty', Number(e.target.value))} />
            </div>

            <div className="rangeWrap">
              <div className="rangeLabelRow"><strong>Content tunnel strength</strong><span className="rangeValue">{form.tunnelStrength} / 5</span></div>
              <input type="range" min={1} max={5} value={form.tunnelStrength} onChange={(e) => updateForm('tunnelStrength', Number(e.target.value))} />
            </div>

            <div className="rangeWrap">
              <div className="rangeLabelRow"><strong>Ambiguity / differential challenge</strong><span className="rangeValue">{form.ambiguity} / 5</span></div>
              <input type="range" min={1} max={5} value={form.ambiguity} onChange={(e) => updateForm('ambiguity', Number(e.target.value))} />
            </div>

            <div>
              <label className="label">Extra constraints</label>
              <textarea className="textarea compact" value={form.constraints || ''} onChange={(e) => updateForm('constraints', e.target.value)} placeholder="No diagnosis obvious in first paragraph, no rare jargon, etc." />
            </div>
          </div>

          <div className="actions">
            <button className="btn btnPrimary" onClick={handleGenerate} disabled={loading}>{loading ? 'Generating...' : 'Generate case studies'}</button>
            <button className="btn" onClick={() => setForm(DEFAULT_FORM)}>Reset</button>
          </div>
        </aside>

        <section className="panel resultPanel">
          <div className="resultHeader">
            <div>
              <h2 className="sectionTitle" style={{ marginBottom: 4 }}>Generated cases</h2>
              <div className="resultMeta">Teacher view, editing, presentation, and student sharing all live here.</div>
            </div>
            {activeCase ? (
              <div className="actions" style={{ marginTop: 0 }}>
                <button className={`tab ${mode === 'teacher' ? 'tabActive' : ''}`} onClick={() => setMode('teacher')}>Teacher</button>
                <button className={`tab ${mode === 'editor' ? 'tabActive' : ''}`} onClick={() => setMode('editor')}>Edit</button>
                <button className={`tab ${mode === 'present' ? 'tabActive' : ''}`} onClick={() => setMode('present')}>Present</button>
                <button className={`tab ${mode === 'share' ? 'tabActive' : ''}`} onClick={() => setMode('share')}>Share</button>
              </div>
            ) : null}
          </div>

          {error ? <div className="error">{error}</div> : null}

          {!data ? (
            <div className="notice">
              Generate a set of cases to see the teacher workflow. This version is built for a Vercel deployment with a server-side OpenAI key.
            </div>
          ) : (
            <>
              <div className="tabs">
                {data.cases.map((c, index) => (
                  <button key={c.id} className={`tab ${activeIndex === index ? 'tabActive' : ''}`} onClick={() => setActiveIndex(index)}>
                    Case {index + 1}
                  </button>
                ))}
                <button className="tab" onClick={handleGenerate}>Generate more</button>
              </div>

              {activeCase && mode === 'teacher' ? (
                <div>
                  <div className="caseCard">
                    <h3>{activeCase.title}</h3>
                    <p>{activeCase.summary}</p>
                    <p><strong>Student task:</strong> {activeCase.studentPrompt}</p>
                  </div>

                  <div className="row2">
                    <div className="caseCard">
                      <h3>Initial presentation</h3>
                      <ul>{activeCase.progressiveReveal.initialPresentation.map((item, i) => <li key={i}>{item}</li>)}</ul>
                    </div>
                    <div className="caseCard">
                      <h3>Vitals and history</h3>
                      <ul>{activeCase.progressiveReveal.vitalsAndHistory.map((item, i) => <li key={i}>{item}</li>)}</ul>
                    </div>
                  </div>

                  <div className="row2">
                    <div className="caseCard">
                      <h3>Follow-up testing</h3>
                      <ul>{activeCase.progressiveReveal.followUpTesting.map((item, i) => <li key={i}>{item}</li>)}</ul>
                    </div>
                    <div className="caseCard">
                      <h3>Teacher reveal</h3>
                      <ul>{activeCase.progressiveReveal.finalTeacherReveal.map((item, i) => <li key={i}>{item}</li>)}</ul>
                    </div>
                  </div>

                  <div className="caseCard">
                    <h3>Differential diagnoses</h3>
                    <ol>
                      {activeCase.differentialDiagnoses.map((d, i) => (
                        <li key={i}>
                          <strong>{d.diagnosis}</strong>
                          <div><strong>Why it fits:</strong> {d.whyItFits}</div>
                          <div><strong>Why it falls short:</strong> {d.whyItFallsShort}</div>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="caseCard">
                    <h3>Teacher notes</h3>
                    <p><strong>Correct diagnosis:</strong> {activeCase.correctDiagnosis}</p>
                    <p><strong>Content tunnel:</strong> {activeCase.teacherNotes.contentTunnel}</p>
                    <p><strong>Why this case works:</strong> {activeCase.teacherNotes.whyThisCaseWorks}</p>
                    <p><strong>Core concepts:</strong> {activeCase.teacherNotes.coreConcepts.join(', ')}</p>
                    <p><strong>Misconceptions to watch:</strong> {activeCase.teacherNotes.misconceptionsToWatch.join(', ')}</p>
                  </div>

                  <div className="actions">
                    <button className="btn btnSoft" onClick={() => copyText(editableText)}>Copy full editable case</button>
                    <button className="btn" onClick={() => setMode('editor')}>Open editor</button>
                    <button className="btn" onClick={() => setMode('present')}>Open presentation mode</button>
                  </div>
                </div>
              ) : null}

              {activeCase && mode === 'editor' ? (
                <div>
                  <div className="notice" style={{ marginBottom: 14 }}>
                    This is your teacher-editable final copy. Edit wording, remove lines, or paste directly into Spark Learning, Google Docs, or another student-facing tool.
                  </div>
                  <textarea className="editor" value={editableText} onChange={(e) => setEditableText(e.target.value)} />
                  <div className="actions">
                    <button className="btn btnSoft" onClick={() => copyText(editableText)}>Copy edited case</button>
                    <button className="btn" onClick={() => setEditableText(activeCase.editableNarrative || formatNarrative(activeCase))}>Reset text</button>
                  </div>
                </div>
              ) : null}

              {activeCase && mode === 'present' ? (
                <div className="presentationShell panel" style={{ overflow: 'hidden' }}>
                  <div className="presentationTop">
                    <div>
                      <strong>{activeCase.title}</strong>
                      <div className="revealMuted">Low-load classroom presentation mode</div>
                    </div>
                    <div className="actions" style={{ marginTop: 0 }}>
                      <button className="btn" onClick={() => setRevealIndex((v) => Math.max(0, v - 1))}>Back</button>
                      <button className="btn btnPrimary" onClick={() => setRevealIndex((v) => Math.min(revealStages.length - 1, v + 1))}>Reveal next</button>
                    </div>
                  </div>
                  <div className="presentationBody">
                    <div className="revealGrid">
                      <div className="revealCard">
                        <h2>{activeCase.title}</h2>
                        <p className="revealMuted">{activeCase.summary}</p>
                        <p><strong>Student task:</strong> {activeCase.studentPrompt}</p>
                      </div>

                      {revealStages.slice(0, revealIndex + 1).map((stage) => (
                        <div className="revealCard" key={stage.key}>
                          <h3>{stage.label}</h3>
                          <ul>
                            {activeCase.progressiveReveal[stage.key].map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {activeCase && mode === 'share' ? (
                <div>
                  <div className="notice" style={{ marginBottom: 14 }}>
                    This share link encodes the student-facing case directly into the URL, so you can create a unique student page and QR code without a heavy database. It is best for normal-sized cases rather than huge file attachments.
                  </div>
                  <div className="shareBox">
                    <div className="panel" style={{ padding: 14, textAlign: 'center' }}>
                      {shareUrl ? <QRCodeSVG value={shareUrl} size={180} /> : null}
                      <p className="small">Student QR code</p>
                    </div>
                    <div>
                      <div className="caseCard" style={{ marginBottom: 12 }}>
                        <h3>Student link</h3>
                        <p className="small">Students see only the case and reveal flow... not the teacher notes or answer key.</p>
                        <textarea className="textarea compact" value={shareUrl} readOnly />
                        <div className="actions">
                          <button className="btn btnSoft" onClick={() => copyText(shareUrl)}>Copy link</button>
                          <Link className="btn" href={shareUrl} target="_blank">Open student view</Link>
                        </div>
                      </div>
                      <div className="caseCard">
                        <h3>Feasibility note</h3>
                        <p>
                          Yes... unique URLs and QR codes are feasible without a database by serializing the student-safe case into the URL itself. For a future version, if you want analytics, student submissions, or very large cases, the next step would be lightweight storage such as Vercel Blob, KV, or Firebase.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      </section>
    </div>
  );
}
