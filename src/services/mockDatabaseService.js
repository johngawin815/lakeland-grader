/**
 * Mock Database Service — Fully functional local database with localStorage persistence.
 * Data survives browser refreshes, tab closures, and computer restarts.
 * All CRUD operations work against in-memory Maps backed by localStorage.
 */
import {
  MOCK_STUDENTS, MOCK_COURSES, COURSE_STUDENTS, COURSE_ASSIGNMENTS,
  GRADEBOOK_CATEGORIES, STUDENT_PROFILES, MOCK_KTEA_REPORTS, ATTENDANCE_DATES,
} from '../data/mockData';

// ─── localStorage HELPERS ────────────────────────────────────────────────────

const STORAGE_PREFIX = 'lakeland_hub_';

function loadMap(key) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw !== null) return new Map(JSON.parse(raw));
  } catch (e) {
    console.warn(`[localStorage] Failed to load "${key}", starting fresh.`, e);
  }
  return null;
}

function saveMap(key, map) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify([...map.entries()]));
  } catch (e) {
    console.warn(`[localStorage] Failed to save "${key}".`, e);
  }
}

function loadArray(key) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw !== null) return JSON.parse(raw);
  } catch (e) {
    console.warn(`[localStorage] Failed to load "${key}", starting fresh.`, e);
  }
  return null;
}

function saveArray(key, arr) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(arr));
  } catch (e) {
    console.warn(`[localStorage] Failed to save "${key}".`, e);
  }
}

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

// ─── IN-MEMORY COLLECTIONS (backed by localStorage) ──────────────────────────

const hasPersistedData = localStorage.getItem(STORAGE_PREFIX + 'initialized') !== null;

const students   = loadMap('students')    || new Map(MOCK_STUDENTS.map(s => [s.id, { ...s }]));
const courses    = loadMap('courses')     || new Map(MOCK_COURSES.map(c => [c.id, { ...c }]));
const kteaReports = loadMap('kteaReports') || new Map(MOCK_KTEA_REPORTS.map(r => [r.id, { ...r }]));
const enrollments = loadMap('enrollments') || new Map();
const gradebooks  = loadMap('gradebooks')  || new Map();
const iepDrafts   = loadMap('iepDrafts')   || new Map();
const transcriptPlans = loadMap('transcriptPlans') || new Map();
const workbooks = loadMap('workbooks') || new Map();
const teachers = loadMap('teachers') || new Map();
const auditLogs   = loadArray('auditLogs') || [];

// ─── AUTO-POPULATE GRADEBOOKS & ENROLLMENTS (first launch only) ──────────────

if (!hasPersistedData) {
  (function init() {
    for (const courseId of Object.keys(COURSE_STUDENTS)) {
      const course = courses.get(courseId);
      const studentIds = COURSE_STUDENTS[courseId];
      const assignments = COURSE_ASSIGNMENTS[courseId];

      const grades = {};
      for (const sid of studentIds) {
        const profile = STUDENT_PROFILES[sid] || { level: 0.75, variance: 0.10, attendance: 0.85 };
        grades[sid] = {};
        for (const a of assignments) {
          grades[sid][a.id] = generateScore(sid, a.id, a.maxScore, profile);
        }
      }

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

      gradebooks.set(courseId, {
        id: courseId,
        assignments: [...assignments],
        categories: [...GRADEBOOK_CATEGORIES],
        grades,
        attendance,
      });

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

  // Save initial state and mark as initialized
  saveMap('students', students);
  saveMap('courses', courses);
  saveMap('kteaReports', kteaReports);
  saveMap('enrollments', enrollments);
  saveMap('gradebooks', gradebooks);
  saveMap('iepDrafts', iepDrafts);
  saveMap('transcriptPlans', transcriptPlans);
  saveMap('workbooks', workbooks);
  saveArray('auditLogs', auditLogs);
  localStorage.setItem(STORAGE_PREFIX + 'initialized', 'true');
  console.info('[mockDB] First launch — initialized and saved to localStorage.');
} else {
  // Ensure seed students from MOCK_STUDENTS are always present (merges new additions)
  let merged = 0;
  for (const s of MOCK_STUDENTS) {
    if (!students.has(s.id)) {
      students.set(s.id, { ...s });
      merged++;
    }
  }
  if (merged > 0) {
    saveMap('students', students);
    console.info(`[mockDB] Merged ${merged} new seed student(s) into localStorage.`);
  }
  console.info('[mockDB] Restored data from localStorage.');
}

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
    saveMap('students', students);
    return record;
  },

  deleteStudent: async (id) => {
    students.delete(id);
    saveMap('students', students);
  },

  getStudentsByUnit: async (unitName) =>
    [...students.values()].filter(s => s.unitName === unitName),

  getDischargedStudents: async () =>
    [...students.values()].filter(s => s.active === false),

  // === KTEA REPORTS ===
  addKteaReport: async (item) => {
    const id = `ktea-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const report = { ...item, id, timestamp: new Date().toISOString() };
    kteaReports.set(id, report);
    saveMap('kteaReports', kteaReports);
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
    saveMap('kteaReports', kteaReports);
    return record;
  },

  deleteKteaReport: async (id) => {
    kteaReports.delete(id);
    saveMap('kteaReports', kteaReports);
  },

  // === COURSES ===
  getCoursesByTeacher: async (teacherName) =>
    [...courses.values()].filter(c => c.teacherName === teacherName),

  getAllCourses: async () => [...courses.values()],

  addCourse: async (courseData) => {
    const id = courseData.id || `course-${Date.now()}`;
    const record = { ...courseData, id };
    courses.set(id, record);
    saveMap('courses', courses);
    return record;
  },

  updateCourse: async (id, courseData) => {
    const record = { ...courseData, id };
    courses.set(id, record);
    saveMap('courses', courses);
    return record;
  },

  deleteCourse: async (id) => {
    courses.delete(id);
    saveMap('courses', courses);
  },

  // === ENROLLMENTS ===
  enrollStudent: async (data) => {
    enrollments.set(data.id, data);
    saveMap('enrollments', enrollments);
    return data;
  },

  unenrollStudent: async (id) => {
    enrollments.delete(id);
    saveMap('enrollments', enrollments);
  },

  getEnrollmentsByCourse: async (courseId) =>
    [...enrollments.values()].filter(e => e.courseId === courseId && e.status === 'Active'),

  getStudentEnrollments: async (studentId) =>
    [...enrollments.values()].filter(e => e.studentId === studentId && e.status === 'Active'),

  saveCourseGrade: async (data) => {
    enrollments.set(data.id, data);
    saveMap('enrollments', enrollments);
    return data;
  },

  getStudentMasterGrades: async (studentId) =>
    [...enrollments.values()].filter(e => e.studentId === studentId),

  // === GRADEBOOK ===
  saveGradebook: async (data) => {
    gradebooks.set(data.id, data);
    saveMap('gradebooks', gradebooks);
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
    saveMap('iepDrafts', iepDrafts);
    return record;
  },

  getIepByStudent: async (studentId) =>
    [...iepDrafts.values()].filter(d => d.studentId === studentId),

  getAllIepDrafts: async () => [...iepDrafts.values()],

  deleteIepDraft: async (id) => {
    iepDrafts.delete(id);
    saveMap('iepDrafts', iepDrafts);
  },

  // === AUDIT LOGGING ===
  logAudit: async (user, action, details) => {
    if (!user) return;
    auditLogs.push({
      userEmail: user.email,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
    saveArray('auditLogs', auditLogs);
  },

  // === TRANSCRIPT PLANS ===
  saveTranscriptPlan: async (plan) => {
    const id = plan.id || `tplan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record = { ...plan, id, updatedAt: new Date().toISOString() };
    if (!record.createdAt) record.createdAt = record.updatedAt;
    transcriptPlans.set(id, record);
    saveMap('transcriptPlans', transcriptPlans);
    return record;
  },

  getTranscriptPlanByStudent: async (studentId) => {
    const plans = [...transcriptPlans.values()].filter(p => p.studentId === studentId);
    return plans.length > 0 ? plans.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))[0] : null;
  },

  getAllTranscriptPlans: async () => [...transcriptPlans.values()],

  deleteTranscriptPlan: async (id) => {
    transcriptPlans.delete(id);
    saveMap('transcriptPlans', transcriptPlans);
  },

  // === WORKBOOKS ===
  saveWorkbook: async (wb) => {
    const id = wb.id || `wb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record = { ...wb, id, updatedAt: new Date().toISOString() };
    if (!record.createdAt) record.createdAt = record.updatedAt;
    workbooks.set(id, record);
    saveMap('workbooks', workbooks);
    return record;
  },
  getWorkbook: async (id) => workbooks.get(id) || null,
  getWorkbooksByUnit: async (unitTopic) => {
    return [...workbooks.values()]
      .filter(w => w.unitTopic === unitTopic)
      .sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0));
  },
  getAllWorkbooks: async () => [...workbooks.values()],
  deleteWorkbook: async (id) => {
    workbooks.delete(id);
    saveMap('workbooks', workbooks);
  },

  // === TEACHERS ===
  upsertTeacher: async (teacher) => {
    const record = { ...teacher, updatedAt: new Date().toISOString() };
    teachers.set(record.id, record);
    saveMap('teachers', teachers);
    return record;
  },

  getTeacher: async (id) => teachers.get(id) || null,

  // === DATA MANAGEMENT ===
  resetAllData: async () => {
    students.clear();
    courses.clear();
    kteaReports.clear();
    enrollments.clear();
    gradebooks.clear();
    iepDrafts.clear();
    transcriptPlans.clear();
    workbooks.clear();
    teachers.clear();
    auditLogs.length = 0;
    Object.keys(localStorage)
      .filter(k => k.startsWith(STORAGE_PREFIX))
      .forEach(k => localStorage.removeItem(k));
    console.info('[mockDB] All local data cleared.');
  },
};
