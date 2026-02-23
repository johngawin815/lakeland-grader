/**
 * Smart Comment Generator
 * Generates teacher comments from student grade data.
 *
 * @param {Object} data
 * @param {string} data.studentName
 * @param {number} data.overallPercentage - Current overall grade (0-100)
 * @param {Array<{name: string, percentage: number}>} data.categoryBreakdown
 * @param {number} data.totalAbsences
 * @param {number|null} data.previousPercentage - Prior quarter grade for trend detection
 * @returns {string} Generated comment (1-3 sentences)
 */
export function generateSmartComment({
  studentName,
  overallPercentage,
  categoryBreakdown = [],
  totalAbsences = 0,
  previousPercentage = null,
}) {
  const firstName = studentName?.split(' ')[0] || 'Student';
  const parts = [];

  // 1. Performance band base comment
  if (overallPercentage >= 90) {
    parts.push(`${firstName} is demonstrating excellent academic performance at ${overallPercentage.toFixed(1)}%.`);
  } else if (overallPercentage >= 80) {
    parts.push(`${firstName} is performing well with an overall grade of ${overallPercentage.toFixed(1)}%.`);
  } else if (overallPercentage >= 70) {
    parts.push(`${firstName} is maintaining a passing grade at ${overallPercentage.toFixed(1)}%.`);
  } else if (overallPercentage >= 60) {
    parts.push(`${firstName} is at risk with a grade of ${overallPercentage.toFixed(1)}% and may need additional support.`);
  } else {
    parts.push(`${firstName} is currently failing at ${overallPercentage.toFixed(1)}% and requires immediate intervention.`);
  }

  // 2. Trend detection
  if (previousPercentage !== null && previousPercentage !== undefined) {
    const delta = overallPercentage - previousPercentage;
    if (delta >= 5) {
      parts.push(`Showed strong improvement from ${previousPercentage.toFixed(1)}% last quarter.`);
    } else if (delta <= -5) {
      parts.push(`Grade has declined from ${previousPercentage.toFixed(1)}% last quarter.`);
    }
  }

  // 3. Strongest / weakest category
  if (categoryBreakdown.length >= 2) {
    const sorted = [...categoryBreakdown].sort((a, b) => b.percentage - a.percentage);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const spread = best.percentage - worst.percentage;

    if (spread >= 10) {
      parts.push(
        `Strong performance in ${best.name} (${best.percentage.toFixed(0)}%). Additional focus recommended in ${worst.name} (${worst.percentage.toFixed(0)}%).`
      );
    }
  }

  // 4. Attendance note
  if (totalAbsences >= 8 && overallPercentage < 70) {
    parts.push(`Attendance (${totalAbsences} absences) appears to be impacting academic progress.`);
  } else if (totalAbsences >= 5) {
    parts.push(`Has accumulated ${totalAbsences} absences this term.`);
  }

  return parts.join(' ');
}
