/**
 * State Graduation Requirements — All 50 States + DC
 *
 * Each entry maps subject areas to credits required for a standard high school diploma.
 * Subject area keys match the app's Course.subjectArea values:
 *   English, Math, Science, Social Studies, Elective
 *
 * Non-core subjects (PE, Health, Arts, World Languages, CTE, etc.) are rolled into
 * the Elective bucket. The `notes` field explains what's included.
 *
 * creditScale: how many credits = one year-long course in that state.
 *   Most states use 1 credit per year-long course. NJ uses 5, some use 0.5 per semester.
 *   The app normalizes using this value.
 */

const stateGraduationRequirements = {
  AL: {
    name: 'Alabama', abbr: 'AL', totalCredits: 24, creditScale: 1,
    requirements: { English: 4, Math: 4, Science: 4, 'Social Studies': 4, Elective: 8 },
    notes: 'Electives include PE (1), Health (0.5), Arts (0.5), Career Prep/CTE, and general electives.',
  },
  AK: {
    name: 'Alaska', abbr: 'AK', totalCredits: 21, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3, Elective: 8 },
    notes: 'Electives include PE (1), Health (0.5), Arts or World Language (1), and general electives.',
  },
  AZ: {
    name: 'Arizona', abbr: 'AZ', totalCredits: 22, creditScale: 1,
    requirements: { English: 4, Math: 4, Science: 3, 'Social Studies': 3, Elective: 8 },
    notes: 'Electives include PE (0.5), Fine Arts or CTE (1), and general electives.',
  },
  AR: {
    name: 'Arkansas', abbr: 'AR', totalCredits: 22, creditScale: 1,
    requirements: { English: 4, Math: 4, Science: 3, 'Social Studies': 3, Elective: 8 },
    notes: 'Electives include PE (0.5), Health (0.5), Fine Arts (0.5), Oral Communications (0.5), and general electives.',
  },
  CA: {
    name: 'California', abbr: 'CA', totalCredits: 22, creditScale: 1,
    requirements: { English: 3, Math: 3, Science: 2, 'Social Studies': 3, Elective: 11 },
    notes: 'State minimum. Most districts require more (e.g., LAUSD = 24). Electives include PE (2), Visual/Performing Arts or World Language (1), and CTE. Districts may add requirements.',
  },
  CO: {
    name: 'Colorado', abbr: 'CO', totalCredits: 21, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3, Elective: 8 },
    notes: 'State sets minimum; districts may require more. Electives include PE, Health, Arts, and general electives.',
  },
  CT: {
    name: 'Connecticut', abbr: 'CT', totalCredits: 25, creditScale: 1,
    requirements: { English: 4, Math: 4, Science: 3, 'Social Studies': 3, Elective: 11 },
    notes: 'Class of 2023+. Electives include PE (1), Health (1), Arts (1), World Language (1), and general electives.',
  },
  DE: {
    name: 'Delaware', abbr: 'DE', totalCredits: 24, creditScale: 1,
    requirements: { English: 4, Math: 4, Science: 3, 'Social Studies': 3, Elective: 10 },
    notes: 'Electives include PE (1), Health (0.5), World Language (2), and Career Pathway (3).',
  },
  DC: {
    name: 'District of Columbia', abbr: 'DC', totalCredits: 24, creditScale: 1,
    requirements: { English: 4, Math: 4, Science: 4, 'Social Studies': 4, Elective: 8 },
    notes: 'Electives include PE (1.5), Health (0.5), Art (0.5), World Language (2), and general electives.',
  },
  FL: {
    name: 'Florida', abbr: 'FL', totalCredits: 24, creditScale: 1,
    requirements: { English: 4, Math: 4, Science: 3, 'Social Studies': 3, Elective: 10 },
    notes: 'Electives include PE (1), Fine Arts or Performing Arts (1), and an online course requirement.',
  },
  GA: {
    name: 'Georgia', abbr: 'GA', totalCredits: 23, creditScale: 1,
    requirements: { English: 4, Math: 4, Science: 4, 'Social Studies': 3, Elective: 8 },
    notes: 'Electives include PE/Health (1), a CTAE/Fine Arts/World Language pathway (3), and general electives.',
  },
  HI: {
    name: 'Hawaii', abbr: 'HI', totalCredits: 24, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 4, Elective: 10 },
    notes: 'Electives include PE (1), Health (0.5), Fine Arts (1), World Language or CTE (2), personal/transition plan (0.5).',
  },
  ID: {
    name: 'Idaho', abbr: 'ID', totalCredits: 46, creditScale: 2,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 2.5, Elective: 10.5 },
    notes: 'Idaho uses semester credits (2 per year). Values shown are year-equivalent. Electives include PE (1), Health (0.5), Humanities (1), and Speech (0.5).',
  },
  IL: {
    name: 'Illinois', abbr: 'IL', totalCredits: 24, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 2, Elective: 12 },
    notes: 'Electives include PE (3.5 — daily requirement), Health (0.5), Fine Arts (1), and general electives.',
  },
  IN: {
    name: 'Indiana', abbr: 'IN', totalCredits: 21, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3, Elective: 8 },
    notes: 'Core 40 diploma. Electives include PE (1), Health (1), and directed/flex electives.',
  },
  IA: {
    name: 'Iowa', abbr: 'IA', totalCredits: 22, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3, Elective: 9 },
    notes: 'Set by local districts with state minimums. Electives include PE (1), Health (0.5), and general electives.',
  },
  KS: {
    name: 'Kansas', abbr: 'KS', totalCredits: 21, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3, Elective: 8 },
    notes: 'Electives include PE (1), Fine Arts (1), and general electives.',
  },
  KY: {
    name: 'Kentucky', abbr: 'KY', totalCredits: 22, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3, Elective: 9 },
    notes: 'Electives include PE (0.5), Health (0.5), Visual/Performing Arts (1), and general electives.',
  },
  LA: {
    name: 'Louisiana', abbr: 'LA', totalCredits: 24, creditScale: 1,
    requirements: { English: 4, Math: 4, Science: 4, 'Social Studies': 4, Elective: 8 },
    notes: 'TOPS University Diploma. Electives include PE (1.5), Health (0.5), Arts (1), and general electives.',
  },
  ME: {
    name: 'Maine', abbr: 'ME', totalCredits: 20, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 2, Elective: 8 },
    notes: 'Proficiency-based diploma. Electives include PE (1), Fine Arts (1), and general electives.',
  },
  MD: {
    name: 'Maryland', abbr: 'MD', totalCredits: 21, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3, Elective: 8 },
    notes: 'Electives include PE (0.5), Health (0.5), Fine Arts (1), Technology Education (1), and general electives.',
  },
  MA: {
    name: 'Massachusetts', abbr: 'MA', totalCredits: 22, creditScale: 1,
    requirements: { English: 4, Math: 4, Science: 3, 'Social Studies': 3, Elective: 8 },
    notes: 'State frameworks plus MCAS requirement. Electives include PE, Health, Arts, World Languages, and general electives.',
  },
  MI: {
    name: 'Michigan', abbr: 'MI', totalCredits: 22, creditScale: 1,
    requirements: { English: 4, Math: 4, Science: 3, 'Social Studies': 3, Elective: 8 },
    notes: 'Michigan Merit Curriculum. Electives include PE (1), Health (0.5), Visual/Performing Arts (1), World Language (2), and an online learning experience.',
  },
  MN: {
    name: 'Minnesota', abbr: 'MN', totalCredits: 21.5, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3.5, Elective: 8 },
    notes: 'Electives include PE (1), Health (0.5), Arts (1), and general electives.',
  },
  MS: {
    name: 'Mississippi', abbr: 'MS', totalCredits: 24, creditScale: 1,
    requirements: { English: 4, Math: 4, Science: 3, 'Social Studies': 3.5, Elective: 9.5 },
    notes: 'Electives include PE (0.5), Health (0.5), Arts (1), Technology/Computer (1), and College/Career Readiness.',
  },
  MO: {
    name: 'Missouri', abbr: 'MO', totalCredits: 24, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3, Elective: 11 },
    notes: 'Electives include PE (1), Health (0.5), Fine Arts (1), Practical Arts (1), Personal Finance (0.5), and general electives.',
  },
  MT: {
    name: 'Montana', abbr: 'MT', totalCredits: 20, creditScale: 1,
    requirements: { English: 4, Math: 2, Science: 2, 'Social Studies': 2, Elective: 10 },
    notes: 'State minimum; districts typically require more. Electives include PE (1), Health (0.5), Fine Arts (1), Vocational (1), and general electives.',
  },
  NE: {
    name: 'Nebraska', abbr: 'NE', totalCredits: 22, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3, Elective: 9 },
    notes: 'Set by local districts with state minimums. Electives flexible by district.',
  },
  NV: {
    name: 'Nevada', abbr: 'NV', totalCredits: 22.5, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 2, Elective: 10.5 },
    notes: 'Electives include PE (2), Health (0.5), Arts/Humanities or CTE (1), Use of Computers (0.5), and general electives.',
  },
  NH: {
    name: 'New Hampshire', abbr: 'NH', totalCredits: 20, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 2.5, Elective: 7.5 },
    notes: 'Electives include PE (1), Health (0.5), Arts (0.5), ICT (0.5), and general electives.',
  },
  NJ: {
    name: 'New Jersey', abbr: 'NJ', totalCredits: 24, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3, Elective: 11 },
    notes: 'NJ requires 120 "credits" where 5 credits = one year-long course (shown here as standard credits). Electives include PE/Health (3.75), Visual/Performing Arts (1), World Languages (1), Financial Literacy (0.5), 21st Century Life & Careers (1).',
  },
  NM: {
    name: 'New Mexico', abbr: 'NM', totalCredits: 24, creditScale: 1,
    requirements: { English: 4, Math: 4, Science: 3, 'Social Studies': 3.5, Elective: 9.5 },
    notes: 'Electives include PE (1), Health (0.5), Career Cluster or Workplace Readiness (1), and general electives.',
  },
  NY: {
    name: 'New York', abbr: 'NY', totalCredits: 22, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 4, Elective: 8 },
    notes: 'Regents Diploma. Electives include PE (2), Health (0.5), Arts (1), World Language (1), and general electives. Also requires passing Regents exams.',
  },
  NC: {
    name: 'North Carolina', abbr: 'NC', totalCredits: 22, creditScale: 1,
    requirements: { English: 4, Math: 4, Science: 3, 'Social Studies': 4, Elective: 7 },
    notes: 'Future-Ready Core. Electives include PE/Health (1), and general electives.',
  },
  ND: {
    name: 'North Dakota', abbr: 'ND', totalCredits: 21, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3, Elective: 8 },
    notes: 'Electives include PE (1), Health (0.5), Fine Arts (1), and general electives.',
  },
  OH: {
    name: 'Ohio', abbr: 'OH', totalCredits: 20, creditScale: 1,
    requirements: { English: 4, Math: 4, Science: 3, 'Social Studies': 3, Elective: 6 },
    notes: 'Electives include PE (0.5), Health (0.5), Fine Arts (1), and Elective with Financial Literacy. Also requires competency-based diploma seal options.',
  },
  OK: {
    name: 'Oklahoma', abbr: 'OK', totalCredits: 23, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3, Elective: 10 },
    notes: 'Electives include PE (0.5), Fine Arts or Speech (1), Computer Technology (1), World Language or CTE (2), and general electives.',
  },
  OR: {
    name: 'Oregon', abbr: 'OR', totalCredits: 24, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3, Elective: 11 },
    notes: 'Electives include PE (1), Health (1), Fine Arts/CTE/World Language (3), and general electives.',
  },
  PA: {
    name: 'Pennsylvania', abbr: 'PA', totalCredits: 21, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3, Elective: 8 },
    notes: 'State sets minimum framework; districts define specific requirements. Electives include PE/Health (1), Arts/Humanities (2), and general electives.',
  },
  RI: {
    name: 'Rhode Island', abbr: 'RI', totalCredits: 20, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3, Elective: 7 },
    notes: 'Proficiency-based diploma. Electives include PE (1), Health (0.5), Arts (1), and Technology (0.5).',
  },
  SC: {
    name: 'South Carolina', abbr: 'SC', totalCredits: 24, creditScale: 1,
    requirements: { English: 4, Math: 4, Science: 3, 'Social Studies': 3, Elective: 10 },
    notes: 'Electives include PE or JROTC (1), Computer Science (1), World Language or Career/Technology (1), and general electives.',
  },
  SD: {
    name: 'South Dakota', abbr: 'SD', totalCredits: 22, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3, Elective: 9 },
    notes: 'Electives include PE (0.5), Fine Arts (1), Computer Science/CTE (0.5), Personal Finance (0.5), and general electives.',
  },
  TN: {
    name: 'Tennessee', abbr: 'TN', totalCredits: 22, creditScale: 1,
    requirements: { English: 4, Math: 4, Science: 3, 'Social Studies': 3, Elective: 8 },
    notes: 'Electives include PE (1), Fine Arts (1), Personal Finance (0.5), and a focus/elective cluster.',
  },
  TX: {
    name: 'Texas', abbr: 'TX', totalCredits: 22, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3, Elective: 9 },
    notes: 'Foundation High School Program. Electives include PE (1), Fine Arts (1), Languages Other Than English (2), Speech (0.5), and Endorsement-specific courses.',
  },
  UT: {
    name: 'Utah', abbr: 'UT', totalCredits: 24, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3, Elective: 11 },
    notes: 'Electives include PE (1.5), Health (0.5), Fine Arts (1.5), CTE/Digital Studies (1), Financial Literacy (0.5), and general electives.',
  },
  VT: {
    name: 'Vermont', abbr: 'VT', totalCredits: 20, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3, Elective: 7 },
    notes: 'Proficiency-based. Electives include PE (1.5), Health (0.5), Arts (1), and general electives.',
  },
  VA: {
    name: 'Virginia', abbr: 'VA', totalCredits: 22, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3, Elective: 9 },
    notes: 'Standard Diploma. Electives include PE/Health (2), Fine Arts or CTE (1), World Language (varies), Economics & Personal Finance (1). Advanced Studies Diploma requires 26 credits.',
  },
  WA: {
    name: 'Washington', abbr: 'WA', totalCredits: 24, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3, Elective: 11 },
    notes: 'Electives include PE (1.5), Health (0.5), Arts (2), Career & Technical Education (1), World Language (2), and general electives.',
  },
  WV: {
    name: 'West Virginia', abbr: 'WV', totalCredits: 22, creditScale: 1,
    requirements: { English: 4, Math: 4, Science: 3, 'Social Studies': 4, Elective: 7 },
    notes: 'Electives include PE (1), Health (1), Fine Arts (1), and general electives.',
  },
  WI: {
    name: 'Wisconsin', abbr: 'WI', totalCredits: 22, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3, Elective: 9 },
    notes: 'Electives include PE (1.5), Health (0.5), and general electives. Districts may require more.',
  },
  WY: {
    name: 'Wyoming', abbr: 'WY', totalCredits: 21, creditScale: 1,
    requirements: { English: 4, Math: 3, Science: 3, 'Social Studies': 3, Elective: 8 },
    notes: 'Set by local districts with state minimums. Electives include PE, Fine Arts, and general electives.',
  },
};

/** Sorted dropdown options for all states + DC */
export const STATE_OPTIONS = Object.entries(stateGraduationRequirements)
  .map(([abbr, s]) => ({ value: abbr, label: `${s.name} (${abbr})` }))
  .sort((a, b) => a.label.localeCompare(b.label));

/** Subject areas in display order */
export const SUBJECT_AREAS = ['English', 'Math', 'Science', 'Social Studies', 'Elective'];

export default stateGraduationRequirements;
