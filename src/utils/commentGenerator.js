import {
  OPENING,
  TREND,
  CATEGORY_STRENGTH,
  CATEGORY_WEAKNESS,
  IEP_HOOKS,
  ATTENDANCE,
  CLOSING,
} from './commentTemplates';

/**
 * Pick a random entry from an array. Deterministic when seed is provided.
 */
function pick(arr) {
  if (!arr || arr.length === 0) return '';
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Interpolate {key} placeholders in a string.
 */
function interp(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
}

/**
 * Map a percentage to a letter band key used by the template bank.
 */
function getBand(pct) {
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
}

/**
 * Smart Comment Generator (v2)
 *
 * 7-step pipeline:
 *   1. Opening statement (tone-varied, performance-band)
 *   2. Trend detection (improved / declined vs prior quarter)
 *   3. Category strength analysis
 *   4. Category weakness analysis
 *   5. IEP-aware language hooks
 *   6. Attendance correlation
 *   7. Closing recommendation
 *
 * @param {Object} data
 * @param {string}   data.studentName
 * @param {number}   data.overallPercentage       - Current overall grade (0-100)
 * @param {Array<{name: string, percentage: number}>} data.categoryBreakdown
 * @param {number}   data.totalAbsences
 * @param {number|null} data.previousPercentage    - Prior quarter grade for trend
 * @param {'encouraging'|'balanced'|'formal'|'direct'} [data.tone='balanced']
 * @param {boolean}  [data.hasIep=false]
 * @param {string[]} [data.iepGoalAreas=[]]
 * @param {string}   [data.behaviorNotes='']
 * @returns {string} Generated comment (2-5 sentences)
 */
export function generateSmartComment({
  studentName,
  overallPercentage,
  categoryBreakdown = [],
  totalAbsences = 0,
  previousPercentage = null,
  tone = 'balanced',
  hasIep = false,
  iepGoalAreas = [],
  behaviorNotes = '',
}) {
  if (overallPercentage == null || isNaN(overallPercentage)) return '';

  const firstName = studentName?.split(' ')[0] || 'Student';
  const band = getBand(overallPercentage);
  const validTone = ['encouraging', 'balanced', 'formal', 'direct'].includes(tone) ? tone : 'balanced';
  const vars = { firstName, pct: overallPercentage.toFixed(1) };
  const parts = [];

  // --- Step 1: Opening ---
  const openingBank = OPENING[band]?.[validTone];
  if (openingBank) {
    parts.push(interp(pick(openingBank), vars));
  }

  // --- Step 2: Trend ---
  if (previousPercentage != null && !isNaN(previousPercentage)) {
    const delta = overallPercentage - previousPercentage;
    const trendVars = { ...vars, prev: previousPercentage.toFixed(1) };
    if (delta >= 5) {
      const bank = TREND.improved[validTone];
      if (bank) parts.push(interp(pick(bank), trendVars));
    } else if (delta <= -5) {
      const bank = TREND.declined[validTone];
      if (bank) parts.push(interp(pick(bank), trendVars));
    }
  }

  // --- Step 3 & 4: Category strength / weakness ---
  if (categoryBreakdown.length >= 2) {
    const sorted = [...categoryBreakdown]
      .filter(c => c.percentage != null)
      .sort((a, b) => b.percentage - a.percentage);

    if (sorted.length >= 2) {
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      const spread = best.percentage - worst.percentage;

      if (spread >= 10) {
        const strengthVars = { ...vars, best: best.name, bestPct: best.percentage.toFixed(0) };
        const weaknessVars = { ...vars, worst: worst.name, worstPct: worst.percentage.toFixed(0) };

        const strengthBank = CATEGORY_STRENGTH[validTone];
        if (strengthBank) parts.push(interp(pick(strengthBank), strengthVars));

        const weaknessBank = CATEGORY_WEAKNESS[validTone];
        if (weaknessBank) parts.push(interp(pick(weaknessBank), weaknessVars));
      } else if (spread >= 5) {
        // Smaller spread — only mention the weakness
        const weaknessVars = { ...vars, worst: worst.name, worstPct: worst.percentage.toFixed(0) };
        const weaknessBank = CATEGORY_WEAKNESS[validTone];
        if (weaknessBank) parts.push(interp(pick(weaknessBank), weaknessVars));
      }
    }
  }

  // --- Step 5: IEP hooks ---
  if (hasIep) {
    // General IEP note
    parts.push(pick(IEP_HOOKS.general));

    // Specific goal area notes
    if (iepGoalAreas.length > 0) {
      const goalNote = iepGoalAreas
        .map(area => IEP_HOOKS.goalAreas[area])
        .filter(Boolean)
        .slice(0, 2) // max 2 goal area notes
        .join(' ');
      if (goalNote) parts.push(goalNote);
    }
  }

  // --- Step 6: Attendance ---
  if (totalAbsences >= 8 && overallPercentage < 70) {
    const bank = ATTENDANCE.severe[validTone];
    if (bank) parts.push(interp(pick(bank), { ...vars, count: totalAbsences }));
  } else if (totalAbsences >= 5) {
    const bank = ATTENDANCE.moderate[validTone];
    if (bank) parts.push(interp(pick(bank), { ...vars, count: totalAbsences }));
  }

  // --- Step 6.5: Behavior notes (pass-through) ---
  if (behaviorNotes && behaviorNotes.trim()) {
    parts.push(behaviorNotes.trim());
  }

  // --- Step 7: Closing ---
  const closingBank = CLOSING[band]?.[validTone];
  if (closingBank) {
    parts.push(interp(pick(closingBank), vars));
  }

  return parts.join(' ');
}
