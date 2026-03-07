import { databaseService } from './databaseService';
import { getDefaultCourses } from '../config/unitConfig';
import { getCurrentSchoolYear } from '../utils/smartUtils';

/**
 * Gets or creates default placeholder courses for a given grade level.
 * Returns array of course documents (existing or newly created).
 */
export async function getOrCreateDefaultCourses(gradeLevel, teacherName, term) {
  const templates = getDefaultCourses(gradeLevel);
  if (!templates || templates.length === 0) return [];

  const allCourses = await databaseService.getAllCourses();
  const results = [];

  for (const template of templates) {
    // Check if a matching course already exists for this teacher + term
    const existing = allCourses.find(
      c => c.courseName === template.courseName &&
           c.term === term &&
           c.teacherName === teacherName
    );

    if (existing) {
      results.push(existing);
    } else {
      const slug = template.courseName.toLowerCase().replace(/\s+/g, '-');
      const newCourse = {
        id: `default-${slug}-${term}-${Date.now()}`,
        courseName: template.courseName,
        subjectArea: template.subjectArea,
        credits: template.credits,
        term,
        teacherName,
      };
      const saved = await databaseService.addCourse(newCourse);
      allCourses.push(saved); // avoid duplicates within same batch
      results.push(saved);
    }
  }

  return results;
}

/**
 * Auto-enrolls a student in the default courses for their grade level.
 * Skips courses the student is already enrolled in.
 * Returns { enrolled: [courseNames], skipped: [courseNames] }.
 */
export async function autoEnrollStudent(student, teacherName, term) {
  const resolvedTerm = term || getCurrentSchoolYear();
  const courses = await getOrCreateDefaultCourses(student.gradeLevel, teacherName, resolvedTerm);

  const existingEnrollments = await databaseService.getStudentEnrollments(student.id);
  const enrolledCourseIds = new Set(existingEnrollments.map(e => e.courseId));

  const enrolled = [];
  const skipped = [];

  for (const course of courses) {
    if (enrolledCourseIds.has(course.id)) {
      skipped.push(course.courseName);
      continue;
    }

    const enrollmentData = {
      id: `${student.id}-${course.id}`,
      studentId: student.id,
      courseId: course.id,
      courseName: course.courseName,
      subjectArea: course.subjectArea || '',
      teacherName: course.teacherName,
      percentage: null,
      letterGrade: null,
      term: resolvedTerm,
      enrollmentDate: new Date().toISOString().split('T')[0],
      status: 'Active',
    };

    await databaseService.enrollStudent(enrollmentData);
    enrolled.push(course.courseName);
  }

  return { enrolled, skipped };
}
