export type Discipline = 'biology' | 'chemistry' | 'medical-biochemistry' | 'neuroscience' | 'custom';

export type CaseTone = 'classic-er' | 'clinic-visit' | 'sports-physical' | 'urgent-care' | 'school-nurse' | 'mystery';

export interface DisciplinePreset {
  label: string;
  description: string;
  defaultTopics: string;
  defaultTunnel: string;
  promptGuidance: string;
}

export const DISCIPLINES: Record<Discipline, DisciplinePreset> = {
  biology: {
    label: 'Biology',
    description: 'Physiology, genetics, ecology, evolution, cellular processes, homeostasis, anatomy',
    defaultTopics: '',
    defaultTunnel: '',
    promptGuidance: `Biology cases should favor physiology, genetics, ecology/evolution, cellular processes, homeostasis, and anatomy. Ground the case in observable symptoms that connect to biological mechanisms. The diagnostic path should reveal how organ systems, cells, or organisms function and interact.`,
  },
  chemistry: {
    label: 'Chemistry',
    description: 'Reactions, molecular structure, acids/bases, stoichiometry, bonding, energetics, toxicology',
    defaultTopics: '',
    defaultTunnel: '',
    promptGuidance: `Chemistry cases should favor reactions, molecular structure, acids/bases, stoichiometry, bonding, energetics, toxicology, and materials science. Cases might involve poisoning, environmental exposure, medication interactions, or industrial accidents where the underlying chemistry drives the diagnosis. The reveal should connect symptoms to chemical principles.`,
  },
  'medical-biochemistry': {
    label: 'Medical Biochemistry',
    description: 'Enzymes, pathways, proteins, metabolism, signaling, biomolecules',
    defaultTopics: '',
    defaultTunnel: '',
    promptGuidance: `Medical biochemistry cases should favor enzymes, metabolic pathways, protein structure/function, cell signaling, and biomolecule chemistry. Cases should reveal how disruptions at the molecular level manifest as clinical symptoms. The diagnostic journey should illuminate biochemical mechanisms like enzyme deficiencies, pathway blockages, or signaling failures.`,
  },
  neuroscience: {
    label: 'Neuroscience',
    description: 'Action potentials, neurotransmission, myelin, sensory systems, neuroanatomy, plasticity',
    defaultTopics: '',
    defaultTunnel: '',
    promptGuidance: `Neuroscience cases should favor action potentials, neurotransmission, myelin, sensory systems, neuroanatomy, plasticity, and neurological disorders. Cases should present neurological symptoms that lead students to reason about how the nervous system works. The reveal should connect clinical presentation to neural mechanisms.`,
  },
  custom: {
    label: 'Custom',
    description: 'Define your own discipline and focus areas',
    defaultTopics: '',
    defaultTunnel: '',
    promptGuidance: '',
  },
};

export const CASE_TONES: Record<CaseTone, { label: string; description: string; promptGuidance: string }> = {
  'classic-er': {
    label: 'Classic ER',
    description: 'Emergency room arrival with acute symptoms',
    promptGuidance: 'Set the case in an emergency room. The patient arrives with acute symptoms. Include triage details, initial assessment urgency, and the fast-paced ER environment.',
  },
  'clinic-visit': {
    label: 'Clinic Visit',
    description: 'Routine or follow-up appointment with subtle findings',
    promptGuidance: 'Set the case in a primary care clinic. The patient comes for a routine visit or mild complaint. Findings emerge gradually through careful examination. The tone is calm and methodical.',
  },
  'sports-physical': {
    label: 'Sports Physical',
    description: 'Pre-participation exam reveals unexpected findings',
    promptGuidance: 'Set the case during a sports physical or pre-participation exam. The patient seems healthy but the exam reveals unexpected findings. This creates surprise and pedagogical tension.',
  },
  'urgent-care': {
    label: 'Urgent Care',
    description: 'Walk-in with moderate concern, not life-threatening',
    promptGuidance: 'Set the case in an urgent care clinic. The patient walks in with moderate concern — not life-threatening but clearly bothered. The pace is brisk but not panicked.',
  },
  'school-nurse': {
    label: 'School Nurse',
    description: 'Student sent to nurse with classroom-observed symptoms',
    promptGuidance: 'Set the case in a school nurse office. A student is sent from class with symptoms observed by a teacher or self-reported. This setting is relatable for high school students and adds a peer-proximity dimension.',
  },
  mystery: {
    label: 'Mystery / Unusual',
    description: 'Rare presentation, atypical symptoms, diagnostic puzzle',
    promptGuidance: 'Frame the case as a diagnostic mystery. The presentation is atypical or rare. Include red herrings and unusual symptom combinations that make the differential particularly challenging. The tone should evoke curiosity and detective-like reasoning.',
  },
};

export const REVEAL_STAGES = [
  { key: 'chiefComplaint', label: 'Chief Complaint' },
  { key: 'history', label: 'History' },
  { key: 'vitals', label: 'Vitals' },
  { key: 'examFindings', label: 'Exam Findings' },
  { key: 'labsAndImaging', label: 'Labs & Imaging' },
  { key: 'synthesis', label: 'Final Prompt' },
] as const;

export type RevealStageKey = typeof REVEAL_STAGES[number]['key'];
