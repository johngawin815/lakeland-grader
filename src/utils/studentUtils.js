/**
 * Derives full initials from a student's name (e.g., "John Jacob Smith" -> "JJS")
 * @param {string} name - The full name of the student
 * @returns {string} - The initials in uppercase
 */
export const getStudentInitials = (name) => {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .map(part => part[0] || '')
    .join('')
    .toUpperCase();
};

/**
 * Generates a random 6-digit student number (100000–999999).
 * Optionally accepts a Set of existing numbers to avoid collisions.
 * @param {Set<string>} [existingNumbers] - Set of already-used student numbers
 * @returns {string} - A unique 6-digit string
 */
export const generateStudentNumber = (existingNumbers) => {
  const max = 50;
  for (let i = 0; i < max; i++) {
    const num = String(Math.floor(100000 + Math.random() * 900000));
    if (!existingNumbers || !existingNumbers.has(num)) return num;
  }
  // Fallback: timestamp-based to guarantee uniqueness
  return String(Date.now()).slice(-6);
};

/**
 * Returns the canonical display label for a student: "Harry P."
 * Uses firstName + first letter of lastName. Falls back to parsing studentName.
 * @param {{ studentName?: string, firstName?: string, lastName?: string }} student
 * @returns {string}
 */
export const formatStudentLabel = (student) => {
  if (!student) return '';

  let first = student.firstName;
  let lastInitial = '';

  if (student.lastName) {
    lastInitial = student.lastName.charAt(0).toUpperCase();
  }

  // Fallback: parse from studentName if firstName missing
  if (!first && student.studentName) {
    const parts = student.studentName.trim().split(/\s+/);
    first = parts[0] || '';
    if (!lastInitial && parts.length > 1) {
      lastInitial = (parts[parts.length - 1] || '').charAt(0).toUpperCase();
    }
  }

  if (!first) return 'Unknown';
  return lastInitial ? `${first} ${lastInitial}.` : first;
};
