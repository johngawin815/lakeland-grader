/**
 * Mock Database Service — Fully functional in-memory database
 * Pre-populated with fictional character data so the app works without Cosmos DB.
 * All CRUD operations work against in-memory Maps.
 */
import {
  MOCK_STUDENTS, MOCK_COURSES, COURSE_STUDENTS, COURSE_ASSIGNMENTS,
  GRADEBOOK_CATEGORIES, STUDENT_PROFILES, MOCK_KTEA_REPORTS, ATTENDANCE_DATES,
} from '../data/mockData';
// Mock data import disabled for real/fake student testing
// import { MOCK_STUDENTS, MOCK_COURSES, COURSE_STUDENTS, COURSE_ASSIGNMENTS,
//   GRADEBOOK_CATEGORIES, STUDENT_PROFILES, MOCK_KTEA_REPORTS, ATTENDANCE_DATES,
// } from '../data/mockData';

// ─── DETERMINISTIC PRNG ────────────────────────────────────────────────────────

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 16), 2246822507);
    t = Math.imul(t ^ (t >>> 13), 3266489909);
    t ^= t >>> 16;
    return (t >>> 0) / 4294967296;
  };
}

function seededRandom(key) {
  return mulberry32(hashString(key));
}

function generateScore(studentId, assignmentId, maxScore, profile) {
  const rng = seededRandom(`${studentId}-${assignmentId}`);
  const base = profile.level * maxScore;
  const variation = (rng() - 0.5) * profile.variance * maxScore * 2;
  return Math.max(0, Math.min(maxScore, Math.round(base + variation)));
}

function calculateLetterGrade(pct) {
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
}

function calculateWeightedPct(studentId, assignments, grades, categories) {
  const catTotals = {};
  const catEarned = {};
  for (const a of assignments) {
    const score = grades[studentId]?.[a.id];
    if (score === undefined) continue;
    if (!catTotals[a.categoryId]) { catTotals[a.categoryId] = 0; catEarned[a.categoryId] = 0; }
    catTotals[a.categoryId] += a.maxScore;
    catEarned[a.categoryId] += score;
  }
  let wSum = 0, wTotal = 0;
  for (const cat of categories) {
    if (catTotals[cat.id] > 0) {
      wSum += (catEarned[cat.id] / catTotals[cat.id]) * cat.weight;
      wTotal += cat.weight;
    }
  }
  return wTotal > 0 ? Math.round((wSum / wTotal) * 100) : 0;
}

// ─── IN-MEMORY COLLECTIONS ────────────────────────────────────────────────────

const students = new Map(MOCK_STUDENTS.map(s => [s.id, { ...s }]));
const courses = new Map(MOCK_COURSES.map(c => [c.id, { ...c }]));
const kteaReports = new Map(MOCK_KTEA_REPORTS.map(r => [r.id, { ...r }]));
const enrollments = new Map();
const gradebooks = new Map();
const iepDrafts = new Map();
const auditLogs = [];

// ─── AUTO-POPULATE GRADEBOOKS & ENROLLMENTS ────────────────────────────────────

(function init() {
  for (const courseId of Object.keys(COURSE_STUDENTS)) {
    const course = courses.get(courseId);
    const studentIds = COURSE_STUDENTS[courseId];
    const assignments = COURSE_ASSIGNMENTS[courseId];

    // Generate grades
    const grades = {};
    for (const sid of studentIds) {
      const profile = STUDENT_PROFILES[sid] || { level: 0.75, variance: 0.10, attendance: 0.85 };
      grades[sid] = {};
      for (const a of assignments) {
        grades[sid][a.id] = generateScore(sid, a.id, a.maxScore, profile);
      }
    }

    // Generate attendance
    const attendance = {};
    for (const date of ATTENDANCE_DATES) {
      attendance[date] = {};
      for (const sid of studentIds) {
        const profile = STUDENT_PROFILES[sid] || { attendance: 0.85 };
        const rng = seededRandom(`${sid}-${date}`);
        const roll = rng();
        if (roll < profile.attendance * 0.95) {
          attendance[date][sid] = 'Present';
        } else if (roll < profile.attendance) {
          attendance[date][sid] = 'Tardy';
        } else {
          attendance[date][sid] = 'Absent';
        }
      }
    }

    // Store gradebook
    gradebooks.set(courseId, {
      id: courseId,
      assignments: [...assignments],
      categories: [...GRADEBOOK_CATEGORIES],
      grades,
      attendance,
    });

    // Create enrollment records with calculated grades
    for (const sid of studentIds) {
      const student = students.get(sid);
      const pct = calculateWeightedPct(sid, assignments, grades, GRADEBOOK_CATEGORIES);
      const enrollId = `mock-e-${courseId.replace('mock-', '')}-${sid.replace('mock-', '')}`;
      enrollments.set(enrollId, {
        id: enrollId,
        studentId: sid,
        courseId,
        courseName: course.courseName,
        subjectArea: course.subjectArea,
        teacherName: course.teacherName,
        letterGrade: calculateLetterGrade(pct),
        percentage: pct,
        enrollmentDate: student?.admitDate || '2024-09-01',
        term: course.term,
        status: 'Active',
      });
    }
  }
})();

// ─── MOCK SERVICE (mirrors every databaseService method) ───────────────────────

export const mockDatabaseService = {

  // === STUDENTS ===
  getAllStudents: async () => [...students.values()],

  findStudentByName: async (name) =>
    [...students.values()].filter(s =>
      s.studentName.toLowerCase().includes(name.toLowerCase())
    ),

  upsertStudent: async (data) => {
    const id = data.id || `student-${Date.now()}`;
    const record = { ...data, id };
    students.set(id, record);
    return record;
  },

  deleteStudent: async (id) => { students.delete(id); },

  getStudentsByUnit: async (unitName) =>
    [...students.values()].filter(s => s.unitName === unitName),

  // === KTEA REPORTS ===
  addKteaReport: async (item) => {
    const id = `ktea-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const report = { ...item, id, timestamp: new Date().toISOString() };
    kteaReports.set(id, report);
    return report;
  },

  searchKteaReports: async (term) =>
    [...kteaReports.values()].filter(r =>
      r.studentName.toLowerCase().includes(term.toLowerCase())
    ),

  getAllKteaReports: async () => [...kteaReports.values()],

  updateKteaReport: async (id, data) => {
    const record = { ...data, id };
    kteaReports.set(id, record);
    return record;
  },

  deleteKteaReport: async (id) => { kteaReports.delete(id); },

  // === COURSES ===
  getCoursesByTeacher: async (teacherName) =>
    [...courses.values()].filter(c => c.teacherName === teacherName),

  getAllCourses: async () => [...courses.values()],

  addCourse: async (courseData) => {
    const id = courseData.id || `course-${Date.now()}`;
    const record = { ...courseData, id };
    courses.set(id, record);
    return record;
  },

  updateCourse: async (id, courseData) => {
    const record = { ...courseData, id };
    courses.set(id, record);
    return record;
  },

  deleteCourse: async (id) => { courses.delete(id); },

  // === ENROLLMENTS ===
  enrollStudent: async (data) => {
    enrollments.set(data.id, data);
    return data;
  },

  unenrollStudent: async (id) => { enrollments.delete(id); },

  getEnrollmentsByCourse: async (courseId) =>
    [...enrollments.values()].filter(e => e.courseId === courseId && e.status === 'Active'),

  getStudentEnrollments: async (studentId) =>
    [...enrollments.values()].filter(e => e.studentId === studentId && e.status === 'Active'),

  saveCourseGrade: async (data) => {
    enrollments.set(data.id, data);
    return data;
  },

  getStudentMasterGrades: async (studentId) =>
    [...enrollments.values()].filter(e => e.studentId === studentId),

  // === GRADEBOOK ===
  saveGradebook: async (data) => {
    gradebooks.set(data.id, data);
    return data;
  },

  getGradebook: async (courseId) => {
    const gb = gradebooks.get(courseId);
    return gb ? { ...gb } : null;
  },

  // === IEP DRAFTS ===
  saveIepDraft: async (data) => {
    const id = data.id || `iep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record = { ...data, id, lastModified: new Date().toISOString() };
    iepDrafts.set(id, record);
    return record;
  },

  getIepByStudent: async (studentId) =>
    [...iepDrafts.values()].filter(d => d.studentId === studentId),

  getAllIepDrafts: async () => [...iepDrafts.values()],

  deleteIepDraft: async (id) => { iepDrafts.delete(id); },

  // === AUDIT LOGGING ===
  logAudit: async (user, action, details) => {
    if (!user) return;
    auditLogs.push({
      userEmail: user.email,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  },
};
