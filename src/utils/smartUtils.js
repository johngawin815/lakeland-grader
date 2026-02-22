/**
 * Determines the academic quarter based on a given date.
 * Q1: Aug 1 - Oct 15
 * Q2: Oct 16 - Dec 31
 * Q3: Jan 1 - Mar 15
 * Q4: Mar 16 - May 31
 * Summer: Jun 1 - Jul 31
 * @param {Date} [inputDate=new Date()] The date to evaluate. Defaults to the current date.
 * @returns {string} The academic quarter (e.g., "Q1", "Q2", "Q3", "Q4", "Summer").
 */
export const getAcademicQuarter = (inputDate = new Date()) => {
  const month = inputDate.getMonth() + 1; // getMonth() is 0-indexed
  const day = inputDate.getDate();

  if ((month === 8 && day >= 1) || (month === 9) || (month === 10 && day <= 15)) {
    return "Q1";
  } else if ((month === 10 && day >= 16) || (month === 11) || (month === 12)) {
    return "Q2";
  } else if ((month === 1) || (month === 2) || (month === 3 && day <= 15)) {
    return "Q3";
  } else if ((month === 3 && day >= 16) || (month === 4) || (month === 5)) {
    return "Q4";
  } else {
    return "Summer"; // Covers June and July
  }
};

/**
 * Determines the business quarter for KTEA billing purposes.
 * Q1: Jan-Mar
 * Q2: Apr-Jun
 * Q3: Jul-Sep
 * Q4: Oct-Dec
 * @param {Date} [inputDate=new Date()] The date to evaluate. Defaults to the current date.
 * @returns {string} The business quarter (e.g., "Q1", "Q2", "Q3", "Q4").
 */
export const getBusinessQuarter = (inputDate = new Date()) => {
  const month = inputDate.getMonth(); // 0-indexed
  if (month < 3) return "Q1";
  if (month < 6) return "Q2";
  if (month < 9) return "Q3";
  return "Q4";
};

/**
 * Calculates the age in years from a date of birth string.
 * @param {string} dobString The date of birth in "YYYY-MM-DD" format.
 * @param {Date} [targetDate=new Date()] The date to calculate the age against. Defaults to the current date.
 * @returns {number} The calculated age in years.
 */
export const calculateAge = (dobString, targetDate = new Date()) => {
  const dob = new Date(dobString);
  let age = targetDate.getFullYear() - dob.getFullYear();
  const m = targetDate.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && targetDate.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

/**
 * Determines the current school year based on a given date.
 * The school year flips on July 1st.
 * @param {Date} [inputDate=new Date()] The date to evaluate. Defaults to the current date.
 * @returns {string} The formatted school year (e.g., "2025-2026").
 */
export const getCurrentSchoolYear = (inputDate = new Date()) => {
  const year = inputDate.getFullYear();
  const month = inputDate.getMonth(); // 0-indexed, so July is 6

  if (month >= 6) { // July or later
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

/**
 * Formats a student's first and last name to be properly capitalized and trimmed.
 * @param {string} firstName The student's first name.
 * @param {string} lastName The student's last name.
 * @returns {string} The cleanly formatted full name (e.g., "David Everitt").
 */
export const formatStudentName = (firstName, lastName) => {
    const formatPart = (namePart) => {
        if (!namePart) return "";
        return namePart.trim().charAt(0).toUpperCase() + namePart.trim().slice(1).toLowerCase();
    }
    const formattedFirstName = formatPart(firstName);
    const formattedLastName = formatPart(lastName);
    return `${formattedFirstName} ${formattedLastName}`.trim();
};


/**
 * Safely calculates a percentage and rounds to the nearest whole number.
 * Prevents divide-by-zero errors.
 * @param {number} earned The numerator (points earned).
 * @param {number} possible The denominator (total possible points).
 * @returns {number} The calculated percentage (0-100), or 0 if 'possible' is 0.
 */
export const calculatePercentage = (earned, possible) => {
  if (possible === 0) {
    return 0;
  }
  return Math.round((earned / possible) * 100);
};
