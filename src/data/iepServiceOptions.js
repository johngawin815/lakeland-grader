/**
 * IEP Service Options — Pre-defined special education services,
 * accommodations, modifications, and supplementary aids.
 */

// ─── SPECIAL EDUCATION SERVICES ──────────────────────────────────────────────

export const SERVICE_TYPES = [
  { id: 'svc-sped', label: 'Special Education Instruction', category: 'Instruction' },
  { id: 'svc-resource', label: 'Resource Room', category: 'Instruction' },
  { id: 'svc-self-contained', label: 'Self-Contained Classroom', category: 'Instruction' },
  { id: 'svc-coteach', label: 'Co-Teaching Support', category: 'Instruction' },
  { id: 'svc-1on1', label: 'One-on-One Instruction', category: 'Instruction' },
  { id: 'svc-speech', label: 'Speech-Language Therapy', category: 'Related Service' },
  { id: 'svc-ot', label: 'Occupational Therapy', category: 'Related Service' },
  { id: 'svc-counseling', label: 'Individual Counseling', category: 'Related Service' },
  { id: 'svc-group-counsel', label: 'Group Counseling', category: 'Related Service' },
  { id: 'svc-social-skills', label: 'Social Skills Training', category: 'Related Service' },
  { id: 'svc-behavior', label: 'Behavior Intervention Services', category: 'Related Service' },
  { id: 'svc-transition', label: 'Transition Services', category: 'Related Service' },
  { id: 'svc-reading', label: 'Reading Intervention', category: 'Supplemental' },
  { id: 'svc-math', label: 'Math Intervention', category: 'Supplemental' },
  { id: 'svc-writing', label: 'Writing Intervention', category: 'Supplemental' },
];

export const SERVICE_LOCATIONS = [
  'General Education Classroom',
  'Resource Room',
  'Self-Contained Classroom',
  'Counselor Office',
  'Therapy Room',
  'Community Setting',
];

export const FREQUENCY_OPTIONS = [
  '1x/week', '2x/week', '3x/week', '4x/week', '5x/week',
  '1x/month', '2x/month', 'As needed', 'Daily',
];

export const DURATION_OPTIONS = [
  '15 minutes', '20 minutes', '30 minutes', '45 minutes',
  '60 minutes', '90 minutes', 'Full period',
];

// ─── ACCOMMODATIONS ──────────────────────────────────────────────────────────

export const ACCOMMODATIONS = {
  Presentation: [
    { id: 'acc-read-aloud', label: 'Read-aloud/audio for tests and assignments' },
    { id: 'acc-large-print', label: 'Large print materials' },
    { id: 'acc-graphic-org', label: 'Graphic organizers provided' },
    { id: 'acc-highlighted', label: 'Highlighted/color-coded text' },
    { id: 'acc-visual-aids', label: 'Visual aids and manipulatives' },
    { id: 'acc-repeat-dir', label: 'Repeat/restate directions' },
    { id: 'acc-simplified', label: 'Simplified/clarified directions' },
    { id: 'acc-model', label: 'Modeling and examples provided' },
    { id: 'acc-notes', label: 'Copy of class notes/outlines provided' },
  ],
  Response: [
    { id: 'acc-verbal', label: 'Verbal responses allowed' },
    { id: 'acc-scribe', label: 'Scribe for written responses' },
    { id: 'acc-word-proc', label: 'Word processor/computer for written work' },
    { id: 'acc-spell-check', label: 'Spell-check/grammar-check tools' },
    { id: 'acc-calc', label: 'Calculator permitted' },
    { id: 'acc-graph-paper', label: 'Graph paper for math organization' },
    { id: 'acc-reduced-writing', label: 'Reduced written output requirements' },
    { id: 'acc-alt-format', label: 'Alternative response formats (multiple choice vs. essay)' },
  ],
  Setting: [
    { id: 'acc-pref-seating', label: 'Preferential seating' },
    { id: 'acc-small-group', label: 'Small group testing environment' },
    { id: 'acc-separate', label: 'Separate/quiet testing location' },
    { id: 'acc-reduce-distract', label: 'Reduced environmental distractions' },
    { id: 'acc-proximity', label: 'Proximity to teacher' },
    { id: 'acc-structured', label: 'Structured/organized workspace' },
  ],
  'Timing & Scheduling': [
    { id: 'acc-ext-time', label: 'Extended time (1.5x) for tests and assignments' },
    { id: 'acc-ext-time-2x', label: 'Extended time (2x) for tests and assignments' },
    { id: 'acc-breaks', label: 'Frequent breaks during work/testing' },
    { id: 'acc-flex-sched', label: 'Flexible scheduling for assignments' },
    { id: 'acc-chunk', label: 'Assignments broken into smaller chunks' },
    { id: 'acc-multi-day', label: 'Multi-day testing sessions' },
    { id: 'acc-extra-trans', label: 'Additional transition time between activities' },
  ],
  'Organization & Behavior': [
    { id: 'acc-checklist', label: 'Daily assignment checklist' },
    { id: 'acc-agenda', label: 'Agenda/planner check' },
    { id: 'acc-visual-sched', label: 'Visual schedule' },
    { id: 'acc-timer', label: 'Timer for task pacing' },
    { id: 'acc-positive', label: 'Positive reinforcement system' },
    { id: 'acc-check-in', label: 'Daily check-in/check-out with staff' },
    { id: 'acc-behavior-plan', label: 'Individualized behavior plan' },
    { id: 'acc-cool-down', label: 'Access to cool-down area' },
    { id: 'acc-sensory', label: 'Sensory tools/fidgets allowed' },
  ],
};

// ─── MODIFICATIONS ───────────────────────────────────────────────────────────

export const MODIFICATIONS = [
  { id: 'mod-reduced', label: 'Reduced number of problems/questions' },
  { id: 'mod-alt-assign', label: 'Alternative/modified assignments' },
  { id: 'mod-modified-grade', label: 'Modified grading criteria' },
  { id: 'mod-alt-assess', label: 'Alternative assessments' },
  { id: 'mod-simplified', label: 'Simplified curriculum content' },
  { id: 'mod-below-grade', label: 'Below-grade-level materials' },
  { id: 'mod-pass-fail', label: 'Pass/fail grading option' },
  { id: 'mod-functional', label: 'Functional curriculum substitutions' },
];

// ─── SUPPLEMENTARY AIDS ─────────────────────────────────────────────────────

export const SUPPLEMENTARY_AIDS = [
  { id: 'aid-at', label: 'Assistive technology device' },
  { id: 'aid-tts', label: 'Text-to-speech software' },
  { id: 'aid-stt', label: 'Speech-to-text software' },
  { id: 'aid-audio', label: 'Audiobooks/recorded texts' },
  { id: 'aid-calc', label: 'Calculator (basic or scientific)' },
  { id: 'aid-dictionary', label: 'Electronic dictionary/thesaurus' },
  { id: 'aid-multiplication', label: 'Multiplication chart/number line' },
  { id: 'aid-word-pred', label: 'Word prediction software' },
];

// ─── TRANSITION SKILLS ──────────────────────────────────────────────────────

export const TRANSITION_SKILL_AREAS = {
  'Post-Secondary Education': [
    'Research college/trade school programs',
    'Complete applications/financial aid forms',
    'Identify disability services at post-secondary institutions',
    'Practice self-disclosure of disability and accommodation needs',
    'Develop study skills for independent learning',
  ],
  Employment: [
    'Complete job applications and resume',
    'Practice interview skills',
    'Identify career interests through assessments',
    'Participate in job shadowing/work experience',
    'Demonstrate workplace social skills',
    'Understand employee rights and responsibilities',
  ],
  'Independent Living': [
    'Manage personal budget and finances',
    'Prepare meals and follow recipes',
    'Maintain personal hygiene and health care',
    'Use public transportation or plan travel',
    'Navigate community resources (bank, post office, etc.)',
    'Manage household tasks (laundry, cleaning)',
  ],
  'Self-Determination': [
    'Set personal goals and monitor progress',
    'Self-advocate for needs and accommodations',
    'Make informed decisions and evaluate outcomes',
    'Understand personal strengths and limitations',
    'Develop problem-solving and conflict resolution skills',
  ],
};
