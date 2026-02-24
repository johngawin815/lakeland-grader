/**
 * IEP Narrative Generator — Smart auto-generation of Present Levels
 * narratives from KTEA scores, course grades, and MTP notes.
 */

// ─── HELPERS ────────────────────────────────────────────────────────────────

function gradeWord(ge) {
  const g = Math.floor(ge);
  const suffixes = { 1: 'st', 2: 'nd', 3: 'rd' };
  return `${g}${suffixes[g] || 'th'}`;
}

function deficitDescription(deficit) {
  if (deficit >= 4) return 'significantly below';
  if (deficit >= 2) return 'below';
  if (deficit >= 1) return 'slightly below';
  if (deficit >= -0.5) return 'at';
  return 'above';
}

function letterGradeWord(grade) {
  const map = { A: 'excellent', B: 'above average', C: 'average', D: 'below average', F: 'failing' };
  return map[grade] || 'varied';
}

// ─── MAIN GENERATOR ─────────────────────────────────────────────────────────

/**
 * Generate the Present Levels of Academic Achievement and Functional
 * Performance (PLAAFP) narrative sections.
 *
 * @param {object} student      - Student record from DB
 * @param {object|null} kteaData - KTEA report (may be null)
 * @param {Array} enrollments   - Course enrollment records with grades
 * @param {Array} mtpNotes      - MTP notes array from student record
 * @returns {{ academic: string, functional: string, strengths: string, impact: string }}
 */
export function generatePresentLevels(student, kteaData, enrollments, mtpNotes) {
  const name = student.firstName || student.studentName?.split(' ')[0] || 'The student';
  const grade = student.gradeLevel || 10;

  return {
    academic: generateAcademicSection(name, grade, kteaData, enrollments),
    functional: generateFunctionalSection(name, mtpNotes),
    strengths: generateStrengthsSection(name, grade, kteaData, enrollments, mtpNotes),
    impact: generateImpactSection(name, grade, kteaData),
  };
}

// ─── ACADEMIC SECTION ───────────────────────────────────────────────────────

function generateAcademicSection(name, grade, ktea, enrollments) {
  const parts = [];

  // KTEA-based assessment data
  if (ktea) {
    const areas = [
      { label: 'reading comprehension', preGE: ktea.preReadingGE, postGE: ktea.postReadingGE },
      { label: 'math computation', preGE: ktea.preMathGE, postGE: ktea.postMathGE },
      { label: 'written expression', preGE: ktea.preWritingGE, postGE: ktea.postWritingGE },
    ];

    // Opening line
    parts.push(`${name} was administered the Kaufman Test of Educational Achievement, Third Edition (KTEA-III) to assess academic functioning in reading, math, and writing.`);

    for (const area of areas) {
      const preGE = parseFloat(area.preGE);
      const postGE = parseFloat(area.postGE);

      if (!isNaN(preGE)) {
        const deficit = grade - preGE;
        const desc = deficitDescription(deficit);

        if (!isNaN(postGE)) {
          const growth = (postGE - preGE).toFixed(1);
          const postDeficit = grade - postGE;
          const postDesc = deficitDescription(postDeficit);
          parts.push(
            `In ${area.label}, ${name} scored at a grade equivalent of ${area.preGE} upon admission (${desc} ${gradeWord(grade)} grade level). On the post-test, ${name} scored ${area.postGE} GE, demonstrating ${growth > 0 ? `a gain of ${growth} grade levels` : 'limited measurable growth'}. ${name} is currently performing ${postDesc} grade level in this area.`
          );
        } else {
          parts.push(
            `In ${area.label}, ${name} scored at a grade equivalent of ${area.preGE} upon admission, which is ${desc} the expected ${gradeWord(grade)} grade level${deficit >= 2 ? ` (approximately ${deficit.toFixed(1)} years below grade level)` : ''}.`
          );
        }
      }
    }
  } else {
    parts.push(`Formal KTEA-III assessment data is not yet available for ${name}. Academic performance is based on classroom observations and coursework.`);
  }

  // Course grade data
  if (enrollments && enrollments.length > 0) {
    const gradeList = enrollments
      .filter(e => e.letterGrade && e.status === 'Active')
      .map(e => `${e.courseName} (${e.letterGrade}, ${e.percentage}%)`)
      .join(', ');

    if (gradeList) {
      const avgPct = enrollments
        .filter(e => e.percentage && e.status === 'Active')
        .reduce((sum, e, _, arr) => sum + e.percentage / arr.length, 0);
      const overall = letterGradeWord(enrollments[0]?.letterGrade);

      parts.push(
        `In current coursework at Lakeland Regional School, ${name} is earning the following grades: ${gradeList}. Overall classroom performance is ${overall} with an average of ${Math.round(avgPct)}%.`
      );
    }
  }

  return parts.join('\n\n');
}

// ─── FUNCTIONAL SECTION ─────────────────────────────────────────────────────

function generateFunctionalSection(name, mtpNotes) {
  if (!mtpNotes || mtpNotes.length === 0) {
    return `Functional performance data from Monthly Teaching Plan notes is not yet available for ${name}. Staff observations and behavioral data will be incorporated as they are documented.`;
  }

  const parts = [];
  const allNotes = mtpNotes.map(n => n.note).join(' ').toLowerCase();

  // Behavioral themes
  const behaviorKeywords = {
    positive: ['improvement', 'improved', 'excellent', 'positive', 'progress', 'consistent', 'leader', 'role model', 'coping', 'reduced', 'zero incidents'],
    concern: ['struggle', 'difficult', 'disruptive', 'aggressive', 'refusal', 'outburst', 'frustrated', 'conflict', 'defiant'],
    social: ['peer', 'friend', 'social', 'group', 'interaction', 'relationship', 'cooperative'],
  };

  const hasPositive = behaviorKeywords.positive.some(k => allNotes.includes(k));
  const hasConcern = behaviorKeywords.concern.some(k => allNotes.includes(k));
  const hasSocial = behaviorKeywords.social.some(k => allNotes.includes(k));

  // Use the most recent MTP note
  const latest = mtpNotes.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  parts.push(`Based on Monthly Teaching Plan observations from staff:`);
  parts.push(`"${latest.note}" — ${latest.author}, ${new Date(latest.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);

  if (hasPositive && !hasConcern) {
    parts.push(`${name} is demonstrating positive behavioral progress in the residential setting. Staff reports indicate consistent improvement in self-regulation and task engagement.`);
  } else if (hasConcern) {
    parts.push(`${name} continues to exhibit behavioral challenges that impact academic performance. Staff interventions and behavior plans are in place to support progress.`);
  }

  if (hasSocial) {
    parts.push(`Social development has been noted in staff observations, with references to peer interactions and group participation.`);
  }

  return parts.join('\n\n');
}

// ─── STRENGTHS SECTION ──────────────────────────────────────────────────────

function generateStrengthsSection(name, grade, ktea, enrollments, mtpNotes) {
  const strengths = [];

  // Academic strengths from KTEA
  if (ktea) {
    const areas = [
      { label: 'reading', ge: parseFloat(ktea.postReadingGE || ktea.preReadingGE) },
      { label: 'math', ge: parseFloat(ktea.postMathGE || ktea.preMathGE) },
      { label: 'writing', ge: parseFloat(ktea.postWritingGE || ktea.preWritingGE) },
    ].filter(a => !isNaN(a.ge));

    // Find relative strengths
    if (areas.length > 0) {
      const best = areas.sort((a, b) => b.ge - a.ge)[0];
      if (best.ge >= grade - 1) {
        strengths.push(`${name} demonstrates relative strength in ${best.label}, performing at approximately ${gradeWord(Math.floor(best.ge))} grade level.`);
      } else {
        strengths.push(`${name}'s relative academic strength is in ${best.label} (GE ${best.ge.toFixed(1)}), though all assessed areas are below current grade placement.`);
      }
    }

    // Check for growth
    const growth = [
      { label: 'reading', pre: parseFloat(ktea.preReadingGE), post: parseFloat(ktea.postReadingGE) },
      { label: 'math', pre: parseFloat(ktea.preMathGE), post: parseFloat(ktea.postMathGE) },
      { label: 'writing', pre: parseFloat(ktea.preWritingGE), post: parseFloat(ktea.postWritingGE) },
    ].filter(a => !isNaN(a.pre) && !isNaN(a.post) && a.post > a.pre);

    if (growth.length > 0) {
      const bestGrowth = growth.sort((a, b) => (b.post - b.pre) - (a.post - a.pre))[0];
      const gain = (bestGrowth.post - bestGrowth.pre).toFixed(1);
      strengths.push(`${name} has demonstrated measurable academic growth, gaining ${gain} grade levels in ${bestGrowth.label} since admission.`);
    }
  }

  // Course-based strengths
  if (enrollments && enrollments.length > 0) {
    const topCourse = enrollments
      .filter(e => e.percentage && e.status === 'Active')
      .sort((a, b) => b.percentage - a.percentage)[0];
    if (topCourse && topCourse.percentage >= 80) {
      strengths.push(`In current coursework, ${name} is performing strongest in ${topCourse.courseName} with ${topCourse.percentage}% (${topCourse.letterGrade}).`);
    }
  }

  // Behavioral strengths from MTP notes
  if (mtpNotes && mtpNotes.length > 0) {
    const allNotes = mtpNotes.map(n => n.note).join(' ').toLowerCase();
    if (allNotes.includes('leader') || allNotes.includes('role model') || allNotes.includes('mentor')) {
      strengths.push(`Staff have identified ${name} as a positive peer leader and role model on the unit.`);
    }
    if (allNotes.includes('attendance') || allNotes.includes('consistent') || allNotes.includes('shows up')) {
      strengths.push(`${name} demonstrates strong attendance and consistent effort in daily programming.`);
    }
  }

  if (strengths.length === 0) {
    strengths.push(`${name}'s strengths include willingness to attend daily programming and engagement with staff support. Further observation will help identify additional areas of strength.`);
  }

  return strengths.join(' ');
}

// ─── IMPACT SECTION ─────────────────────────────────────────────────────────

function generateImpactSection(name, grade, ktea) {
  if (!ktea) {
    return `${name}'s disability impacts academic performance across content areas. Further assessment data is needed to fully determine the extent of academic impact.`;
  }

  const areas = [
    { label: 'reading', ge: parseFloat(ktea.postReadingGE || ktea.preReadingGE) },
    { label: 'math', ge: parseFloat(ktea.postMathGE || ktea.preMathGE) },
    { label: 'writing', ge: parseFloat(ktea.postWritingGE || ktea.preWritingGE) },
  ].filter(a => !isNaN(a.ge));

  const deficitAreas = areas.filter(a => a.ge < grade - 1);

  if (deficitAreas.length === 0) {
    return `${name}'s disability has a limited measured impact on academic achievement as assessed by the KTEA-III. ${name} is performing near grade level across assessed domains. Accommodations and supports continue to be provided to maintain this level of performance.`;
  }

  const deficitList = deficitAreas
    .sort((a, b) => a.ge - b.ge)
    .map(a => {
      const deficit = (grade - a.ge).toFixed(1);
      return `${a.label} (${deficit} years below grade level)`;
    })
    .join(', ');

  return `${name}'s disability impacts the ability to access the general education curriculum, particularly in ${deficitList}. Without specialized instruction and accommodations, ${name} would be unable to make adequate progress toward grade-level standards. The IEP team has determined that ${name} requires specially designed instruction and related services to address these deficit areas.`;
}

// ─── DEFICIT CALCULATIONS ───────────────────────────────────────────────────

/**
 * Compute deficit data from KTEA scores for visual display.
 * @returns {{ reading: object, math: object, writing: object }}
 */
export function computeDeficits(gradeLevel, kteaData) {
  if (!kteaData) return null;

  const compute = (preGE, postGE) => {
    const current = parseFloat(postGE || preGE) || null;
    const pre = parseFloat(preGE) || null;
    const post = parseFloat(postGE) || null;
    if (current === null) return null;

    const deficit = gradeLevel - current;
    const growth = (pre !== null && post !== null) ? post - pre : null;

    let level = 'on-track';
    if (deficit >= 3) level = 'critical';
    else if (deficit >= 2) level = 'concern';
    else if (deficit >= 1) level = 'watch';

    return { current, pre, post, deficit: +deficit.toFixed(1), growth: growth !== null ? +growth.toFixed(1) : null, level };
  };

  return {
    reading: compute(kteaData.preReadingGE, kteaData.postReadingGE),
    math: compute(kteaData.preMathGE, kteaData.postMathGE),
    writing: compute(kteaData.preWritingGE, kteaData.postWritingGE),
  };
}
