/**
 * Converts a numeric percentage to a standard letter grade.
 * @param {number} percentage - The numeric grade percentage (0-100).
 * @returns {string} The corresponding letter grade (A, B, C, D, F).
 */
export const calculateLetterGrade = (percentage) => {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

/**
 * A placeholder for a more complex overall grade calculation if needed.
 * The current implementation in ClassGradebook.js using useMemo is preferred for UI performance.
 * This function is included to fulfill the prompt's request but may be redundant.
 * @param {object} studentGrades - An object of grades where keys are assignment IDs.
 * @param {Array<object>} assignments - The list of all assignment objects.
 * @param {Array<object>} categories - The list of all category objects with weights.
 * @returns {number|null} The calculated overall percentage, or null if no grades are available.
 */
export const calculateOverallPercentage = (studentGrades, assignments, categories) => {
    if (!studentGrades) return null;

    let totalWeightedScore = 0;
    let totalWeightUsed = 0;

    categories.forEach(category => {
        const catAssignments = assignments.filter(a => a.categoryId === category.id);
        if (catAssignments.length === 0) return;

        let catPointsEarned = 0;
        let catMaxPoints = 0;
        let hasGradedAssignment = false;

        catAssignments.forEach(assignment => {
            const score = studentGrades[assignment.id];
            if (score !== undefined && score !== null && score !== '') {
                catPointsEarned += parseFloat(score);
                catMaxPoints += parseFloat(assignment.maxScore);
                hasGradedAssignment = true;
            }
        });

        if (hasGradedAssignment && catMaxPoints > 0) {
            const catPercentage = catPointsEarned / catMaxPoints;
            totalWeightedScore += catPercentage * category.weight;
            totalWeightUsed += category.weight;
        }
    });

    return totalWeightUsed > 0 ? (totalWeightedScore / totalWeightUsed) * 100 : null;
};
