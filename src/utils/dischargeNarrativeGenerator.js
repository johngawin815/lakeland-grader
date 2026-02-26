/**
 * Discharge Narrative Generator — Smart auto-drafting of discharge narrative
 * sections from KTEA scores, course grades, and MTP notes.
 *
 * Follows the same architecture as iepNarrativeGenerator.js:
 * deterministic, template-based, no external AI.
 */

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

export const BOILERPLATE = "Lakeland Regional School operates within a Level IV residential treatment center. Students are admitted for clinical treatment, and the school provides academic instruction during their stay. Classrooms include students from multiple states and a wide range of grade and ability levels. Instruction is based on Missouri's Major Instructional Goals, and collaboration with sending schools occurs when possible.";

// ─── HELPERS ────────────────────────────────────────────────────────────────

function describePerformanceLevel(ge, gradeLevel) {
  const diff = gradeLevel - ge;
  if (diff >= 4) return 'significantly below grade level';
  if (diff >= 2) return 'below grade level';
  if (diff >= 1) return 'slightly below grade level';
  if (diff >= -0.5) return 'at grade level';
  return 'above grade level';
}

function describeGrowth(preGE, postGE, subject) {
  const pre = parseFloat(preGE);
  const post = parseFloat(postGE);
  if (isNaN(pre) || isNaN(post)) return null;

  const change = (post - pre).toFixed(1);
  if (change > 0) {
    return `demonstrated growth in ${subject}, advancing ${change} grade levels (from ${preGE} GE to ${postGE} GE)`;
  } else if (change < 0) {
    return `showed a decline of ${Math.abs(change)} grade levels in ${subject} (from ${preGE} GE to ${postGE} GE)`;
  }
  return `maintained performance in ${subject} at ${postGE} GE`;
}

function formatDate(dateStr) {
  if (!dateStr) return '[date]';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── BEHAVIORAL KEYWORD LISTS (shared with iepNarrativeGenerator) ───────────

const BEHAVIOR_KEYWORDS = {
  positive: ['improvement', 'improved', 'excellent', 'positive', 'progress', 'consistent', 'leader', 'role model', 'coping', 'reduced', 'zero incidents'],
  concern: ['struggle', 'difficult', 'disruptive', 'aggressive', 'refusal', 'outburst', 'frustrated', 'conflict', 'defiant'],
  social: ['peer', 'friend', 'social', 'group', 'interaction', 'relationship', 'cooperative'],
};

function extractMtpThemes(mtpNotes) {
  if (!mtpNotes || mtpNotes.length === 0) return { positive: false, concern: false, social: false, latest: null };
  const allText = mtpNotes.map(n => n.note).join(' ').toLowerCase();
  const sorted = [...mtpNotes].sort((a, b) => new Date(b.date) - new Date(a.date));
  return {
    positive: BEHAVIOR_KEYWORDS.positive.some(k => allText.includes(k)),
    concern: BEHAVIOR_KEYWORDS.concern.some(k => allText.includes(k)),
    social: BEHAVIOR_KEYWORDS.social.some(k => allText.includes(k)),
    latest: sorted[0],
  };
}

// ─── GENERATORS ─────────────────────────────────────────────────────────────

/**
 * Generate a draft admission reason narrative.
 */
export function generateAdmissionDraft(student, kteaData) {
  const name = student?.studentName || 'The student';
  const admitDate = kteaData?.admitDate || student?.admitDate || '';
  const formattedDate = formatDate(admitDate);

  const parts = [];
  parts.push(`${name} entered the Lakeland Behavioral Health System Level IV RTC Adolescent Program and was admitted to Lakeland Regional School on ${formattedDate} for educational services during the course of residential treatment.`);

  if (student?.iep === 'Yes') {
    parts.push('An Individualized Education Program (IEP) was in effect during enrollment, and accommodations were provided per the student\'s plan.');
  }

  return parts.join(' ');
}

/**
 * Generate a draft behavior narrative from MTP notes, enrollments, and KTEA data.
 */
export function generateBehaviorDraft(student, kteaData, enrollments, mtpNotes) {
  const name = student?.firstName || student?.studentName?.split(' ')[0] || 'The student';
  const parts = [];

  // 1. Course performance summary
  const activeEnrollments = (enrollments || []).filter(e => e.status === 'Active' && e.letterGrade);
  if (activeEnrollments.length > 0) {
    const courseList = activeEnrollments.map(e => `${e.courseName} (${e.letterGrade})`).join(', ');
    const avgPct = activeEnrollments.reduce((sum, e) => sum + (e.percentage || 0), 0) / activeEnrollments.length;
    parts.push(`During enrollment, ${name} participated in the following courses: ${courseList}, maintaining an overall average of ${Math.round(avgPct)}%.`);
  }

  // 2. MTP-informed behavioral themes
  const themes = extractMtpThemes(mtpNotes);

  if (themes.positive && !themes.concern) {
    parts.push(pick([
      `${name} is a pleasant young person in the classroom setting and has shown consistent improvement during the stay at Lakeland. ${name} is able to follow directions and work appropriately with peers.`,
      `${name} has demonstrated positive behavioral progress throughout the enrollment period. Staff observations consistently note engagement with instruction and respectful interactions with staff and peers.`,
      `${name} has adapted well to the structured classroom environment, demonstrating consistent effort and a positive attitude toward academic tasks.`,
    ]));
  } else if (themes.concern) {
    parts.push(pick([
      `${name} has exhibited some behavioral challenges that have impacted academic performance. Staff interventions and behavioral supports have been provided to address these areas.`,
      `${name} has required additional behavioral support in the classroom setting. With redirection and structured expectations, ${name} has been able to engage in academic tasks.`,
    ]));
    if (themes.positive) {
      parts.push(`Despite these challenges, ${name} has also shown periods of positive progress and engagement.`);
    }
  } else {
    parts.push(`${name} has participated in the structured classroom environment at Lakeland Regional School. ${name} has engaged with academic instruction and followed classroom expectations.`);
  }

  // 3. Social development
  if (themes.social) {
    parts.push(pick([
      `In terms of social development, ${name} has shown the ability to interact appropriately with peers in group settings.`,
      `Socially, ${name} has demonstrated growth in peer interactions and cooperative group work.`,
    ]));
  }

  return parts.join(' ');
}

/**
 * Generate a draft score analysis narrative from KTEA data.
 */
export function generateAnalysisDraft(student, kteaData) {
  const name = student?.firstName || student?.studentName?.split(' ')[0] || 'The student';
  const grade = student?.gradeLevel || 10;

  if (!kteaData) {
    return `Formal KTEA-III assessment data is not currently available for ${name}. Academic performance during enrollment has been based on classroom observations and coursework.`;
  }

  const parts = [];

  // Opening
  parts.push(`${name} was administered the Kaufman Test of Educational Achievement, Third Edition (KTEA-III) upon admission and prior to discharge to measure academic progress.`);

  // Per-subject analysis
  const subjects = [
    { label: 'reading', pre: kteaData.preReadingGE, post: kteaData.postReadingGE },
    { label: 'math', pre: kteaData.preMathGE, post: kteaData.postMathGE },
    { label: 'writing', pre: kteaData.preWritingGE, post: kteaData.postWritingGE },
  ];

  const growthDescriptions = subjects
    .map(s => describeGrowth(s.pre, s.post, s.label))
    .filter(Boolean);

  if (growthDescriptions.length > 0) {
    parts.push(`${name} ${growthDescriptions.join('; ')}.`);
  }

  // Overall performance level
  const postScores = subjects.map(s => parseFloat(s.post)).filter(n => !isNaN(n));
  if (postScores.length > 0) {
    const avgPost = postScores.reduce((a, b) => a + b, 0) / postScores.length;
    const level = describePerformanceLevel(avgPost, grade);
    parts.push(`Overall, ${name} is performing ${level} based on post-test results.`);
  }

  // Growth check
  const allGrew = subjects.every(s => {
    const pre = parseFloat(s.pre);
    const post = parseFloat(s.post);
    return !isNaN(pre) && !isNaN(post) && post > pre;
  });

  if (allGrew) {
    parts.push(`It is the opinion of the examiner that ${name} made academic progress across all assessed areas during enrollment at Lakeland Regional School.`);
  }

  return parts.join(' ');
}

/**
 * Generate the closing statement for the discharge document.
 */
export function generateClosingStatement(studentName, dischargeDate) {
  const name = studentName || 'The student';
  const date = formatDate(dischargeDate);
  return `${name} was discharged successfully from residential care on ${date}. If further information or documents are needed, please contact Lakeland Regional School.`;
}

// ─── SENTENCE STARTERS ─────────────────────────────────────────────────────

export const SENTENCE_STARTERS = {
  admission: [
    '{name} was admitted for educational services during residential treatment at Lakeland Regional School on ',
    '{name} entered the Lakeland Behavioral Health System for ',
    'Upon admission, {name} presented with ',
    'The purpose of this educational placement was to ',
  ],
  behavior: [
    'Throughout enrollment, {name} demonstrated ',
    'In the classroom setting, {name} consistently ',
    'Academically, {name} showed ',
    'Behaviorally, {name} exhibited ',
    '{name}\'s work ethic can be described as ',
    'In terms of peer relationships, {name} ',
    'With instructional support, {name} was able to ',
    '{name} responded well to ',
    'Areas of growth for {name} include ',
    '{name} is a pleasant young person who ',
  ],
  analysis: [
    'The comparative data indicates that {name} ',
    'KTEA-III results suggest that {name} ',
    'Based on pre- and post-test scores, {name} ',
    'These results are consistent with ',
    'It is the opinion of the examiner that ',
    'Overall academic performance indicates ',
  ],
};

// ─── PERFORMANCE LEVEL EXPORT (for score card display) ──────────────────────

export { describePerformanceLevel };
