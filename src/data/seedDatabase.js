/**
 * Seed Database — Writes mock data to Cosmos DB for testing all app features.
 * Uses deterministic PRNG so re-seeding produces identical data.
 */
import { databaseService } from '../services/databaseService';
import {
  MOCK_STUDENTS, MOCK_COURSES, COURSE_STUDENTS, COURSE_ASSIGNMENTS,
  GRADEBOOK_CATEGORIES, STUDENT_PROFILES, MOCK_KTEA_REPORTS, ATTENDANCE_DATES,
} from './mockData';

// ─── DETERMINISTIC PRNG (mulberry32) ───────────────────────────────────────────

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

// ─── GRADE HELPERS ─────────────────────────────────────────────────────────────

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

function calculateWeightedPercentage(studentId, assignments, grades, categories) {
  const catTotals = {};
  const catEarned = {};

  for (const a of assignments) {
    const score = grades[studentId]?.[a.id];
    if (score === undefined) continue;
    if (!catTotals[a.categoryId]) { catTotals[a.categoryId] = 0; catEarned[a.categoryId] = 0; }
    catTotals[a.categoryId] += a.maxScore;
    catEarned[a.categoryId] += score;
  }

  let weightedSum = 0;
  let weightTotal = 0;
  for (const cat of categories) {
    if (catTotals[cat.id] && catTotals[cat.id] > 0) {
      weightedSum += (catEarned[cat.id] / catTotals[cat.id]) * cat.weight;
      weightTotal += cat.weight;
    }
  }

  return weightTotal > 0 ? Math.round((weightedSum / weightTotal) * 100) : 0;
}

// ─── MAIN SEED FUNCTION ───────────────────────────────────────────────────────

export async function seedDemoData(onProgress) {
  const stats = { students: 0, courses: 0, enrollments: 0, gradebooks: 0, ktea: 0 };

  try {
    // 1. Seed Students
    onProgress?.('Seeding 39 fictional residents...');
    for (const student of MOCK_STUDENTS) {
      await databaseService.upsertStudent(student);
      stats.students++;
    }

    // 2. Seed Courses (use updateCourse which does upsert)
    onProgress?.('Seeding 5 courses...');
    for (const course of MOCK_COURSES) {
      await databaseService.updateCourse(course.id, course);
      stats.courses++;
    }

    // 3. Build gradebooks + enrollments
    const studentMap = {};
    for (const s of MOCK_STUDENTS) { studentMap[s.id] = s; }

    const courseMap = {};
    for (const c of MOCK_COURSES) { courseMap[c.id] = c; }

    for (const courseId of Object.keys(COURSE_STUDENTS)) {
      const course = courseMap[courseId];
      const studentIds = COURSE_STUDENTS[courseId];
      const assignments = COURSE_ASSIGNMENTS[courseId];

      onProgress?.(`Building gradebook for ${course.courseName}...`);

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

      // Save gradebook
      const gradebookData = {
        id: courseId,
        assignments,
        categories: GRADEBOOK_CATEGORIES,
        grades,
        attendance,
      };
      await databaseService.saveGradebook(gradebookData);
      stats.gradebooks++;

      // Create enrollment records with calculated grades
      for (const sid of studentIds) {
        const student = studentMap[sid];
        const pct = calculateWeightedPercentage(sid, assignments, grades, GRADEBOOK_CATEGORIES);
        const enrollmentData = {
          id: `mock-e-${courseId.replace('mock-', '')}-${sid.replace('mock-', '')}`,
          studentId: sid,
          courseId: courseId,
          courseName: course.courseName,
          subjectArea: course.subjectArea,
          teacherName: course.teacherName,
          letterGrade: calculateLetterGrade(pct),
          percentage: pct,
          enrollmentDate: student.admitDate,
          term: course.term,
          status: 'Active',
        };
        await databaseService.enrollStudent(enrollmentData);
        stats.enrollments++;
      }
    }

    // 4. Seed KTEA Reports
    onProgress?.('Seeding KTEA assessment reports...');
    for (const report of MOCK_KTEA_REPORTS) {
      await databaseService.updateKteaReport(report.id, report);
      stats.ktea++;
    }

    onProgress?.('Done!');
    return { success: true, stats };

  } catch (error) {
    console.error('[seedDemoData] Seeding failed:', error);
    return { success: false, error: error.message, stats };
  }
}

// ─── CHECK IF SEEDED ──────────────────────────────────────────────────────────

export async function isDemoDataSeeded() {
  try {
    const students = await databaseService.findStudentByName('Harry Potter');
    return students.some(s => s.id === 'mock-s01');
  } catch {
    return false;
  }
}
