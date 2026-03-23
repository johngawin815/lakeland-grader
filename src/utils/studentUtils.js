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
