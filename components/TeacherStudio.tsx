'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { encodeSharedCase, toSharedPayload } from '@/lib/serialize';
import { formatTeacherPlainText, formatStudentPlainText, formatTeacherMarkdown, formatStudentMarkdown } from '@/lib/export';
import { DISCIPLINES, CASE_TONES, REVEAL_STAGES } from '@/lib/disciplines';
import type { Discipline, CaseTone } from '@/lib/disciplines';
import type { ApiResult, CaseStudy, GenerationForm } from '@/lib/schema';

type ViewMode = 'teacher' | 'editor' | 'present' | 'share';

const DISCIPLINE_KEYS = Object.keys(DISCIPLINES) as Discipline[];
const TONE_KEYS = Object.keys(CASE_TONES) as CaseTone[];

const DEFAULT_FORM: GenerationForm = {
  discipline: 'neuroscience',
  course: 'Neuroscience',
  gradeBand: 'Upper high school (11-12)',
  topicTargets: '',
  scientificTunnel: '',
  preferredDiagnosis: '',
  difficulty: 3,
  tunnelStrength: 4,
  ambiguity: 3,
  revealMode: 'progressive',
  caseTone: 'classic-er',
  includeVitals: true,
  includeLabs: true,
  includeImaging: true,
  includeHistory: true,
  focusNotes: '',
  constraints: '',
  studentTask: '',
  count: 3,
};

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button className={`btn btnSoft ${copied ? 'btnGood' : ''}`} onClick={copy}>
      {copied ? 'Copied' : label}
    </button>
  );
}

function Slider({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void;
}) {
  const descs: Record<string, string[]> = {
    Difficulty: ['Very accessible', 'Accessible', 'Moderate', 'Challenging', 'Very challenging'],
    'Tunnel strength': ['Loose', 'Light', 'Balanced', 'Strong', 'Very strong'],
    Ambiguity: ['Low', 'Some', 'Balanced', 'High', 'Very high'],
  };
  return (
    <div className="slider-control">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{descs[label]?.[value - 1] ?? `${value}/5`}</span>
      </div>
      <input type="range" min={1} max={5} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export default function TeacherStudio() {
  const [form, setForm] = useState<GenerationForm>(DEFAULT_FORM);
  const [data, setData] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<ViewMode>('teacher');
  const [revealIndex, setRevealIndex] = useState(0);
  const [editCase, setEditCase] = useState<CaseStudy | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const presentRef = useRef<HTMLDivElement>(null);

  const activeCase = data?.cases?.[activeIndex] ?? null;

  useEffect(() => {
    if (activeCase) {
      setEditCase(structuredClone(activeCase));
      setRevealIndex(0);
    }
  }, [activeCase]);

  // Keyboard navigation for presentation mode
  useEffect(() => {
    if (mode !== 'present') return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setRevealIndex((v) => Math.min(REVEAL_STAGES.length - 1, v + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setRevealIndex((v) => Math.max(0, v - 1));
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode]);

  const shareUrl = useMemo(() => {
    if (!activeCase || typeof window === 'undefined') return '';
    const encoded = encodeSharedCase(toSharedPayload(activeCase));
    return `${window.location.origin}/student?case=${encoded}`;
  }, [activeCase]);

  function updateForm<K extends keyof GenerationForm>(key: K, value: GenerationForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function selectDiscipline(d: Discipline) {
    const preset = DISCIPLINES[d];
    setForm((prev) => ({
      ...prev,
      discipline: d,
      course: d === 'custom' ? prev.course : preset.label,
    }));
  }

  const handleGenerate = useCallback(async (overrides?: Partial<GenerationForm>) => {
    setLoading(true);
    setError(null);
    try {
      const payload = { ...form, ...overrides };
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Generation failed.');
      setData(json);
      setActiveIndex(0);
      setMode('teacher');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [form]);

  function handleRefine(action: string) {
    if (!activeCase) return;
    handleGenerate({
      count: 1,
      refinement: {
        action,
        sourceCase: activeCase,
        excludeDiagnosis: action === 'different-diagnosis' ? activeCase.correctDiagnosis : undefined,
      },
    });
  }

  function updateEditField(path: string, value: string | string[]) {
    if (!editCase) return;
    setEditCase((prev) => {
      if (!prev) return prev;
      const clone = structuredClone(prev);
      const keys = path.split('.');
      let target: Record<string, unknown> = clone as unknown as Record<string, unknown>;
      for (let i = 0; i < keys.length - 1; i++) {
        target = target[keys[i]] as Record<string, unknown>;
      }
      target[keys[keys.length - 1]] = value;
      return clone;
    });
  }

  function saveEdits() {
    if (!editCase || !data) return;
    const newCases = [...data.cases];
    newCases[activeIndex] = editCase;
    setData({ cases: newCases });
    setMode('teacher');
    showToast('Edits saved');
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  function toggleFullscreen() {
    if (!presentRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      presentRef.current.requestFullscreen();
    }
  }

  const canGenerate = form.topicTargets.trim().length > 0 && form.scientificTunnel.trim().length > 0;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-brand">
            <div className="app-logo">CS</div>
            <div>
              <h1 className="app-title">Case Study Generator</h1>
              <p className="app-subtitle">Backward-designed diagnostic cases for science inquiry</p>
            </div>
          </div>
          {data && (
            <div className="mode-tabs">
              {(['teacher', 'editor', 'present', 'share'] as ViewMode[]).map((m) => (
                <button key={m} className={`mode-tab ${mode === m ? 'mode-tab-active' : ''}`} onClick={() => setMode(m)}>
                  {{ teacher: 'View', editor: 'Edit', present: 'Present', share: 'Share' }[m]}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {toast && <div className="toast">{toast}</div>}

      <div className="app-body">
        {/* FORM SIDEBAR */}
        <aside className="form-sidebar">
          <div className="form-section">
            <h2 className="form-heading">Discipline</h2>
            <div className="discipline-grid">
              {DISCIPLINE_KEYS.map((d) => (
                <button key={d} className={`discipline-chip ${form.discipline === d ? 'discipline-chip-active' : ''}`} onClick={() => selectDiscipline(d)}>
                  {DISCIPLINES[d].label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h2 className="form-heading">Content Target</h2>
            <div className="field-stack">
              {form.discipline === 'custom' && (
                <div>
                  <label className="field-label">Course name</label>
                  <input className="field-input" value={form.course} onChange={(e) => updateForm('course', e.target.value)} />
                </div>
              )}
              <div>
                <label className="field-label">Unit or topic</label>
                <input className="field-input" value={form.topicTargets} onChange={(e) => updateForm('topicTargets', e.target.value)} placeholder="e.g., Action potentials, myelin, neuron signaling" />
              </div>
              <div>
                <label className="field-label">What should students uncover?</label>
                <textarea className="field-textarea" value={form.scientificTunnel} onChange={(e) => updateForm('scientificTunnel', e.target.value)} placeholder="The scientific concepts the case should tunnel toward..." />
              </div>
              <div>
                <label className="field-label">Preferred diagnosis <span className="field-optional">optional</span></label>
                <input className="field-input" value={form.preferredDiagnosis || ''} onChange={(e) => updateForm('preferredDiagnosis', e.target.value)} placeholder="e.g., Multiple sclerosis" />
              </div>
              <div>
                <label className="field-label">Student task <span className="field-optional">optional</span></label>
                <textarea className="field-textarea field-textarea-sm" value={form.studentTask || ''} onChange={(e) => updateForm('studentTask', e.target.value)} placeholder="Default: Determine the most likely diagnosis with 2-3 differentials." />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="form-heading">Case Design</h2>
            <div className="field-stack">
              <div className="field-row">
                <div>
                  <label className="field-label">Grade band</label>
                  <select className="field-select" value={form.gradeBand} onChange={(e) => updateForm('gradeBand', e.target.value)}>
                    <option>Middle school (6-8)</option>
                    <option>Lower high school (9-10)</option>
                    <option>Upper high school (11-12)</option>
                    <option>AP / Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Cases to generate</label>
                  <select className="field-select" value={form.count} onChange={(e) => updateForm('count', Number(e.target.value) as GenerationForm['count'])}>
                    <option value={1}>1 case</option>
                    <option value={2}>2 cases</option>
                    <option value={3}>3 cases</option>
                    <option value={4}>4 cases</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label">Setting</label>
                <div className="tone-grid">
                  {TONE_KEYS.map((t) => (
                    <button key={t} className={`tone-chip ${form.caseTone === t ? 'tone-chip-active' : ''}`} onClick={() => updateForm('caseTone', t)}>
                      {CASE_TONES[t].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label">Reveal mode</label>
                <div className="tone-grid">
                  {[
                    { value: 'symptoms_only', label: 'Symptoms only' },
                    { value: 'symptoms_plus_testing', label: 'Symptoms + testing' },
                    { value: 'progressive', label: 'Progressive reveal' },
                  ].map((rm) => (
                    <button key={rm.value} className={`tone-chip ${form.revealMode === rm.value ? 'tone-chip-active' : ''}`} onClick={() => updateForm('revealMode', rm.value as GenerationForm['revealMode'])}>
                      {rm.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label">Include</label>
                <div className="check-row">
                  {([['includeHistory', 'History'], ['includeVitals', 'Vitals'], ['includeLabs', 'Labs'], ['includeImaging', 'Imaging']] as const).map(([key, label]) => (
                    <label className="check-item" key={key}>
                      <input type="checkbox" checked={Boolean(form[key])} onChange={(e) => updateForm(key, e.target.checked as never)} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Slider label="Difficulty" value={form.difficulty} onChange={(v) => updateForm('difficulty', v)} />
              <Slider label="Tunnel strength" value={form.tunnelStrength} onChange={(v) => updateForm('tunnelStrength', v)} />
              <Slider label="Ambiguity" value={form.ambiguity} onChange={(v) => updateForm('ambiguity', v)} />

              <div>
                <label className="field-label">Teaching focus <span className="field-optional">optional</span></label>
                <input className="field-input" value={form.focusNotes || ''} onChange={(e) => updateForm('focusNotes', e.target.value)} placeholder="Authenticity, misconceptions, phenotype..." />
              </div>
              <div>
                <label className="field-label">Guardrails <span className="field-optional">optional</span></label>
                <input className="field-input" value={form.constraints || ''} onChange={(e) => updateForm('constraints', e.target.value)} placeholder="No rare jargon, keep diagnosis non-obvious..." />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-primary btn-lg" onClick={() => handleGenerate()} disabled={loading || !canGenerate}>
              {loading ? <span className="loading-text"><span className="spinner" /> Generating...</span> : 'Generate Cases'}
            </button>
            <button className="btn btn-ghost" onClick={() => setForm(DEFAULT_FORM)}>Reset form</button>
          </div>
        </aside>

        {/* RESULTS */}
        <main className="results-area">
          {error && <div className="error-banner">{error}</div>}

          {/* Loading overlay when regenerating with existing data */}
          {loading && data && (
            <div className="results-loading-overlay">
              <div className="spinner-lg" />
              <p>Generating...</p>
            </div>
          )}

          {!data && !loading && (
            <div className="empty-state">
              <div className="empty-icon">&#128300;</div>
              <h2>Ready to build a case</h2>
              <p>Choose a discipline, enter your topic and the scientific concepts you want students to uncover, then generate. The AI creates medically plausible cases designed to lead students toward your content through diagnostic reasoning.</p>
            </div>
          )}

          {loading && !data && (
            <div className="empty-state">
              <div className="spinner-lg" />
              <h2>Building your cases</h2>
              <p>Creating {form.count} diagnostic case{form.count > 1 ? 's' : ''} for {form.course}. This usually takes 15-30 seconds.</p>
            </div>
          )}

          {data && (
            <>
              <div className="case-tabs">
                {data.cases.map((c, i) => (
                  <button key={c.id} className={`case-tab ${activeIndex === i ? 'case-tab-active' : ''}`} onClick={() => setActiveIndex(i)}>
                    <span className="case-tab-num">{i + 1}</span>
                    <span className="case-tab-title">{c.title}</span>
                  </button>
                ))}
              </div>

              {/* QUICK ACTIONS */}
              {mode === 'teacher' && activeCase && (
                <div className="quick-actions">
                  <span className="quick-label">Refine</span>
                  <button className="btn btn-sm" onClick={() => handleRefine('generate-more')} disabled={loading}>More like this</button>
                  <button className="btn btn-sm" onClick={() => handleRefine('tighten-tunnel')} disabled={loading}>Tighten tunnel</button>
                  <button className="btn btn-sm" onClick={() => handleRefine('more-ambiguous')} disabled={loading}>More ambiguous</button>
                  <button className="btn btn-sm" onClick={() => handleRefine('more-realistic')} disabled={loading}>More realistic</button>
                  <button className="btn btn-sm" onClick={() => handleRefine('more-student-friendly')} disabled={loading}>Simpler</button>
                  <button className="btn btn-sm" onClick={() => handleRefine('different-diagnosis')} disabled={loading}>Different diagnosis</button>
                </div>
              )}

              {/* VIEW MODE */}
              {activeCase && mode === 'teacher' && (
                <div className="case-view">
                  <div className="case-header-card">
                    <h2 className="case-title">{activeCase.title}</h2>
                    <p className="case-summary">{activeCase.summary}</p>
                    <div className="case-rationale">{activeCase.teacherRationale}</div>
                    <div className="case-prompt"><strong>Student task:</strong> {activeCase.studentPrompt}</div>
                  </div>

                  <div className="reveal-grid">
                    {REVEAL_STAGES.map((stage) => {
                      const items = activeCase.progressiveReveal[stage.key];
                      if (!items || items.length === 0) return null;
                      return (
                        <div className="reveal-card" key={stage.key}>
                          <h3 className="reveal-card-title">{stage.label}</h3>
                          <ul className="reveal-list">
                            {items.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        </div>
                      );
                    })}
                  </div>

                  <div className="teacher-section">
                    <h3 className="section-title">Differential Diagnoses</h3>
                    <div className="diff-list">
                      {activeCase.differentialDiagnoses.map((d, i) => (
                        <div className="diff-item" key={i}>
                          <div className="diff-name">{d.diagnosis}</div>
                          <div className="diff-detail"><span className="diff-tag diff-fit">Fits</span> {d.whyItFits}</div>
                          <div className="diff-detail"><span className="diff-tag diff-short">Falls short</span> {d.whyItFallsShort}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="teacher-grid">
                    <div className="teacher-card">
                      <h3 className="section-title">Correct Diagnosis</h3>
                      <p className="teacher-highlight">{activeCase.correctDiagnosis}</p>
                    </div>
                    <div className="teacher-card">
                      <h3 className="section-title">Content Tunnel</h3>
                      <p>{activeCase.teacherNotes.contentTunnel}</p>
                    </div>
                  </div>

                  <div className="teacher-grid">
                    <div className="teacher-card">
                      <h3 className="section-title">Clues Toward Diagnosis</h3>
                      <ul className="tag-list">{activeCase.diagnosticClues.map((c, i) => <li key={i}>{c}</li>)}</ul>
                    </div>
                    <div className="teacher-card">
                      <h3 className="section-title">What Keeps the Differential Open</h3>
                      <ul className="tag-list">{activeCase.differentialClues.map((c, i) => <li key={i}>{c}</li>)}</ul>
                    </div>
                  </div>

                  <div className="teacher-grid">
                    <div className="teacher-card">
                      <h3 className="section-title">Core Concepts</h3>
                      <div className="concept-tags">
                        {activeCase.teacherNotes.coreConcepts.map((c, i) => <span className="concept-tag" key={i}>{c}</span>)}
                      </div>
                    </div>
                    <div className="teacher-card">
                      <h3 className="section-title">Misconceptions to Watch</h3>
                      <ul className="tag-list">{activeCase.teacherNotes.misconceptionsToWatch.map((m, i) => <li key={i}>{m}</li>)}</ul>
                    </div>
                  </div>

                  {activeCase.suggestedNextTests.length > 0 && (
                    <div className="teacher-card">
                      <h3 className="section-title">Suggested Next Tests</h3>
                      <ul className="tag-list">{activeCase.suggestedNextTests.map((t, i) => <li key={i}>{t}</li>)}</ul>
                    </div>
                  )}

                  <div className="teacher-card">
                    <h3 className="section-title">Why This Case Works</h3>
                    <p>{activeCase.teacherNotes.whyThisCaseWorks}</p>
                  </div>

                  <div className="export-bar">
                    <CopyBtn text={formatTeacherPlainText(activeCase)} label="Teacher copy" />
                    <CopyBtn text={formatStudentPlainText(activeCase)} label="Student copy" />
                    <CopyBtn text={formatTeacherMarkdown(activeCase)} label="Markdown" />
                    <button className="btn btnSoft" onClick={() => window.print()}>Print</button>
                  </div>
                </div>
              )}

              {/* EDIT MODE */}
              {activeCase && editCase && mode === 'editor' && (
                <div className="case-view">
                  <div className="editor-notice">
                    Edit any field below. Your changes stay in this session until you save.
                  </div>

                  <div className="edit-section">
                    <label className="edit-label">Title</label>
                    <input className="field-input" value={editCase.title} onChange={(e) => updateEditField('title', e.target.value)} />
                  </div>

                  <div className="edit-section">
                    <label className="edit-label">Summary</label>
                    <textarea className="field-textarea" value={editCase.summary} onChange={(e) => updateEditField('summary', e.target.value)} />
                  </div>

                  <div className="edit-section">
                    <label className="edit-label">Student Task</label>
                    <textarea className="field-textarea field-textarea-sm" value={editCase.studentPrompt} onChange={(e) => updateEditField('studentPrompt', e.target.value)} />
                  </div>

                  {REVEAL_STAGES.map((stage) => (
                    <div className="edit-section" key={stage.key}>
                      <label className="edit-label">{stage.label}</label>
                      <textarea
                        className="field-textarea"
                        value={editCase.progressiveReveal[stage.key].join('\n')}
                        onChange={(e) => updateEditField(`progressiveReveal.${stage.key}`, e.target.value.split('\n').filter((l) => l.trim()))}
                      />
                      <span className="edit-hint">One item per line</span>
                    </div>
                  ))}

                  <div className="edit-section">
                    <label className="edit-label">Correct Diagnosis</label>
                    <input className="field-input" value={editCase.correctDiagnosis} onChange={(e) => updateEditField('correctDiagnosis', e.target.value)} />
                  </div>

                  {editCase.differentialDiagnoses.map((d, i) => (
                    <div className="edit-section edit-diff" key={i}>
                      <label className="edit-label">Differential {i + 1}</label>
                      <input className="field-input" value={d.diagnosis} placeholder="Diagnosis" onChange={(e) => {
                        const arr = [...editCase.differentialDiagnoses];
                        arr[i] = { ...arr[i], diagnosis: e.target.value };
                        setEditCase((p) => p ? { ...p, differentialDiagnoses: arr } : p);
                      }} />
                      <input className="field-input" value={d.whyItFits} placeholder="Why it fits" onChange={(e) => {
                        const arr = [...editCase.differentialDiagnoses];
                        arr[i] = { ...arr[i], whyItFits: e.target.value };
                        setEditCase((p) => p ? { ...p, differentialDiagnoses: arr } : p);
                      }} />
                      <input className="field-input" value={d.whyItFallsShort} placeholder="Why it falls short" onChange={(e) => {
                        const arr = [...editCase.differentialDiagnoses];
                        arr[i] = { ...arr[i], whyItFallsShort: e.target.value };
                        setEditCase((p) => p ? { ...p, differentialDiagnoses: arr } : p);
                      }} />
                      <button className="btn btn-sm btn-danger" onClick={() => {
                        setEditCase((p) => p ? { ...p, differentialDiagnoses: p.differentialDiagnoses.filter((_, idx) => idx !== i) } : p);
                      }}>Remove</button>
                    </div>
                  ))}

                  <div className="edit-section">
                    <label className="edit-label">Teacher Notes</label>
                    <div className="field-stack">
                      <div>
                        <span className="edit-hint">Content tunnel</span>
                        <textarea className="field-textarea field-textarea-sm" value={editCase.teacherNotes.contentTunnel} onChange={(e) => updateEditField('teacherNotes.contentTunnel', e.target.value)} />
                      </div>
                      <div>
                        <span className="edit-hint">Core concepts — one per line</span>
                        <textarea className="field-textarea field-textarea-sm" value={editCase.teacherNotes.coreConcepts.join('\n')} onChange={(e) => updateEditField('teacherNotes.coreConcepts', e.target.value.split('\n').filter((l) => l.trim()))} />
                      </div>
                      <div>
                        <span className="edit-hint">Misconceptions to watch — one per line</span>
                        <textarea className="field-textarea field-textarea-sm" value={editCase.teacherNotes.misconceptionsToWatch.join('\n')} onChange={(e) => updateEditField('teacherNotes.misconceptionsToWatch', e.target.value.split('\n').filter((l) => l.trim()))} />
                      </div>
                      <div>
                        <span className="edit-hint">Why this case works</span>
                        <textarea className="field-textarea field-textarea-sm" value={editCase.teacherNotes.whyThisCaseWorks} onChange={(e) => updateEditField('teacherNotes.whyThisCaseWorks', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="editor-actions">
                    <button className="btn btn-primary" onClick={saveEdits}>Save edits</button>
                    <button className="btn btn-ghost" onClick={() => setEditCase(structuredClone(activeCase))}>Discard</button>
                  </div>
                </div>
              )}

              {/* PRESENTATION MODE */}
              {activeCase && mode === 'present' && (
                <div className="presentation-shell" ref={presentRef}>
                  <div className="presentation-header">
                    <div className="presentation-title">{activeCase.title}</div>
                    <div className="presentation-controls">
                      <span className="presentation-progress">{revealIndex + 1} / {REVEAL_STAGES.length}</span>
                      <button className="btn btn-present" onClick={() => setRevealIndex((v) => Math.max(0, v - 1))} disabled={revealIndex === 0}>Back</button>
                      <button className="btn btn-present btn-present-primary" onClick={() => setRevealIndex((v) => Math.min(REVEAL_STAGES.length - 1, v + 1))} disabled={revealIndex === REVEAL_STAGES.length - 1}>Reveal Next</button>
                      <button className="btn btn-present" onClick={toggleFullscreen}>Fullscreen</button>
                      <span className="presentation-kbd">← → Space F</span>
                    </div>
                  </div>

                  <div className="presentation-body">
                    <div className="presentation-case-header">
                      <h2>{activeCase.title}</h2>
                      <p>{activeCase.summary}</p>
                      <p className="presentation-task"><strong>Your task:</strong> {activeCase.studentPrompt}</p>
                    </div>

                    <div className="presentation-stages">
                      {REVEAL_STAGES.slice(0, revealIndex + 1).map((stage) => {
                        const items = activeCase.progressiveReveal[stage.key];
                        if (!items || items.length === 0) return null;
                        return (
                          <div className="presentation-stage" key={stage.key}>
                            <h3>{stage.label}</h3>
                            <ul>{items.map((item, i) => <li key={i}>{item}</li>)}</ul>
                          </div>
                        );
                      })}
                    </div>

                    <div className="presentation-stage-dots">
                      {REVEAL_STAGES.map((stage, i) => (
                        <button key={stage.key} className={`stage-dot ${i <= revealIndex ? 'stage-dot-active' : ''}`} onClick={() => setRevealIndex(i)} title={stage.label} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SHARE MODE */}
              {activeCase && mode === 'share' && (
                <div className="case-view">
                  <div className="share-layout">
                    <div className="share-qr-card">
                      {shareUrl && <QRCodeSVG value={shareUrl} size={200} bgColor="transparent" fgColor="#0f172a" />}
                      <p className="share-qr-label">Student QR Code</p>
                    </div>

                    <div className="share-details">
                      <div className="share-info">
                        <h3>Student Link</h3>
                        <p>Students see the case and progressive reveal only. No teacher notes, diagnoses, or answer key are exposed.</p>
                        <textarea className="field-textarea field-textarea-sm share-url" value={shareUrl} readOnly onClick={(e) => (e.target as HTMLTextAreaElement).select()} />
                        <div className="share-actions">
                          <CopyBtn text={shareUrl} label="Copy link" />
                          <a className="btn btnSoft" href={shareUrl} target="_blank" rel="noopener noreferrer">Preview student view</a>
                        </div>
                      </div>

                      <div className="share-info">
                        <h3>How This Works</h3>
                        <p>The case is compressed and encoded into the URL itself — no database needed. The link is self-contained.</p>
                        <p className="share-note">Very large cases may exceed URL length limits. If that happens, trim the case in the editor first.</p>
                      </div>
                    </div>
                  </div>

                  <div className="export-bar">
                    <CopyBtn text={formatTeacherPlainText(activeCase)} label="Teacher copy" />
                    <CopyBtn text={formatStudentPlainText(activeCase)} label="Student copy" />
                    <CopyBtn text={formatTeacherMarkdown(activeCase)} label="Markdown" />
                    <CopyBtn text={formatStudentMarkdown(activeCase)} label="Student Markdown" />
                    <button className="btn btnSoft" onClick={() => window.print()}>Print</button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
