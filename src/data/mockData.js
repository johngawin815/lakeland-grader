/**
 * Mock Data — Fictional Character Residents
 * All students removed for zero-start local testing.
 */

// ─── STUDENTS ──────────────────────────────────────────────────────────────────

export const MOCK_STUDENTS = [];

// ─── COURSES ───────────────────────────────────────────────────────────────────

export const MOCK_COURSES = [
  { id: 'mock-c01', courseName: 'English 10', subjectArea: 'English', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-c02', courseName: 'Algebra II', subjectArea: 'Math', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-c03', courseName: 'US History', subjectArea: 'Social Studies', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-c04', courseName: 'Biology', subjectArea: 'Science', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-c05', courseName: 'Creative Writing', subjectArea: 'Elective', credits: 2.5, term: '2025-2026', teacherName: 'John Gawin' },
];

// ─── COURSE → STUDENT ENROLLMENT MAP ───────────────────────────────────────────

export const COURSE_STUDENTS = {
  'mock-c01': [],
  'mock-c02': [],
  'mock-c03': [],
  'mock-c04': [],
  'mock-c05': [],
};

// ─── ASSIGNMENTS PER COURSE ────────────────────────────────────────────────────

export const COURSE_ASSIGNMENTS = {
  'mock-c01': [],
  'mock-c02': [],
  'mock-c03': [],
  'mock-c04': [],
  'mock-c05': [],
};

// ─── STANDARD CATEGORIES ───────────────────────────────────────────────────────

export const GRADEBOOK_CATEGORIES = [
  { id: 'cat-hw', name: 'Homework', weight: 0.20 },
  { id: 'cat-quiz', name: 'Quizzes', weight: 0.30 },
  { id: 'cat-test', name: 'Tests', weight: 0.50 },
];

// ─── STUDENT PERFORMANCE PROFILES ──────────────────────────────────────────────
// level: base performance (0-1), variance: grade scatter, attendance: show-up rate

export const STUDENT_PROFILES = {};

// ─── KTEA ASSESSMENT REPORTS ───────────────────────────────────────────────────
// Pre-test for all, post-test only for students admitted before Oct 2024

export const MOCK_KTEA_REPORTS = [];

// ─── ATTENDANCE DATES ──────────────────────────────────────────────────────────
// 15 school days (3 weeks) for generating attendance records

export const ATTENDANCE_DATES = [
  '2025-01-06', '2025-01-07', '2025-01-08', '2025-01-09', '2025-01-10',
  '2025-01-13', '2025-01-14', '2025-01-15', '2025-01-16', '2025-01-17',
  '2025-01-21', '2025-01-22', '2025-01-23', '2025-01-24', '2025-01-27',
];
