import { useState, useMemo, useEffect, useCallback } from 'react';
import { databaseService } from '../services/databaseService';
import { calculateLetterGrade } from '../utils/gradeCalculator';
import { getCurrentSchoolYear } from '../utils/smartUtils';

const DEFAULT_CATEGORIES = [
  { id: 'hw', name: 'Homework', weight: 20 },
  { id: 'quiz', name: 'Quizzes', weight: 30 },
  { id: 'test', name: 'Tests', weight: 50 },
];

export function useGradebook(courseId, userUnits) {
  const [students, setStudents] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [assignments, setAssignments] = useState([]);
  const [grades, setGrades] = useState({});
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [previousGrades, setPreviousGrades] = useState({});

  // --- DATA FETCHING ---
  useEffect(() => {
    const loadGradebookData = async () => {
      if (!courseId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 1. Fetch enrolled students for this course
        const enrollments = await databaseService.getEnrollmentsByCourse(courseId);
        const allStudents = await databaseService.getAllStudents();
        const studentMap = {};
        allStudents.forEach(s => { studentMap[s.id] = s; });

        const enrolledStudentIds = new Set(enrollments.map(e => e.studentId));

        // 2. Auto-populate from teacher's assigned units
        if (userUnits && userUnits.length > 0) {
          const course = enrollments[0] || {};
          const currentTerm = getCurrentSchoolYear();

          for (const unitName of userUnits) {
            const unitStudents = allStudents.filter(
              s => s.unitName === unitName && s.active !== false
            );

            for (const student of unitStudents) {
              if (enrolledStudentIds.has(student.id)) continue;

              // Auto-enroll this student
              const enrollmentData = {
                id: `${student.id}-${courseId}`,
                studentId: student.id,
                courseId,
                courseName: course.courseName || '',
                subjectArea: course.subjectArea || '',
                teacherName: course.teacherName || '',
                percentage: null,
                letterGrade: null,
                term: currentTerm,
                enrollmentDate: new Date().toISOString().split('T')[0],
                status: 'Active',
              };

              try {
                await databaseService.enrollStudent(enrollmentData);
                enrollments.push(enrollmentData);
                enrolledStudentIds.add(student.id);
              } catch (err) {
                console.warn(`Auto-enroll failed for ${student.studentName}:`, err);
              }
            }
          }
        }

        // 3. Build student list with unitName, sorted by unit then name
        if (enrollments.length > 0) {
          const enrolledStudents = enrollments.map(e => {
            const studentRecord = studentMap[e.studentId];
            return {
              id: e.studentId,
              name: studentRecord?.studentName || (studentRecord ? `${studentRecord.firstName || ''} ${studentRecord.lastName || ''}`.trim() : e.studentId),
              gradeLevel: studentRecord?.gradeLevel || '',
              unitName: studentRecord?.unitName || '',
              enrollmentId: e.id,
              iep: studentRecord?.iep || 'No',
              iepGoalAreas: studentRecord?.iepGoalAreas || [],
            };
          });

          // Sort by unitName first, then by name
          enrolledStudents.sort((a, b) => {
            const unitCmp = (a.unitName || '').localeCompare(b.unitName || '');
            if (unitCmp !== 0) return unitCmp;
            return (a.name || '').localeCompare(b.name || '');
          });

          setStudents(enrolledStudents);

          // Fetch previous-term grades for trend detection
          const prevGrades = {};
          for (const student of enrolledStudents) {
            try {
              const masterGrades = await databaseService.getStudentMasterGrades(student.id);
              const currentTerm = getCurrentSchoolYear();
              const priorEnrollment = masterGrades.find(
                e => e.courseId === courseId && e.term && e.term !== currentTerm
              );
              if (priorEnrollment?.percentage != null) {
                prevGrades[student.id] = priorEnrollment.percentage;
              }
            } catch {
              // Silently skip if prior grades unavailable
            }
          }
          setPreviousGrades(prevGrades);
        } else {
          setStudents([]);
        }

        // 4. Load saved gradebook data
        const savedGradebook = await databaseService.getGradebook(courseId);
        if (savedGradebook) {
          if (savedGradebook.assignments?.length > 0) setAssignments(savedGradebook.assignments);
          if (savedGradebook.categories?.length > 0) setCategories(savedGradebook.categories);
          if (savedGradebook.attendance) setAttendance(savedGradebook.attendance);
          if (savedGradebook.grades) setGrades(savedGradebook.grades);
        }
      } catch (error) {
        console.error("Failed to load gradebook data:", error);
      }
      setLoading(false);
      setDirty(false);
    };

    loadGradebookData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // --- DERIVED STATE ---
  const finalGrades = useMemo(() => {
    const results = {};
    students.forEach(student => {
      let totalWeightedScore = 0;
      let totalWeightUsed = 0;

      categories.forEach(category => {
        const catAssignments = assignments.filter(a => a.categoryId === category.id);
        if (catAssignments.length === 0) return;

        let catPointsEarned = 0;
        let catMaxPoints = 0;
        let hasGradedAssignment = false;

        catAssignments.forEach(assignment => {
          const score = grades[student.id]?.[assignment.id];
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

      results[student.id] = totalWeightUsed > 0 ? (totalWeightedScore / totalWeightUsed) * 100 : null;
    });
    return results;
  }, [students, categories, assignments, grades]);

  // --- HELPERS ---
  const getCategoryPercentage = useCallback((studentId, category) => {
    const catAssignments = assignments.filter(a => a.categoryId === category.id);
    let earned = 0, max = 0;
    catAssignments.forEach(a => {
      const score = grades[studentId]?.[a.id];
      if (score !== undefined && score !== null && score !== '') {
        earned += parseFloat(score);
        max += parseFloat(a.maxScore);
      }
    });
    return max > 0 ? (earned / max) * 100 : null;
  }, [assignments, grades]);

  const getTotalAbsences = useCallback((studentId) => {
    return Object.values(attendance).reduce((count, dayRecord) => {
      return dayRecord[studentId] === 'Absent' ? count + 1 : count;
    }, 0);
  }, [attendance]);

  const getLetterGrade = useCallback((studentId) => {
    const pct = finalGrades[studentId];
    return pct != null ? calculateLetterGrade(pct) : null;
  }, [finalGrades]);

  // --- HANDLERS ---
  const handleGradeChange = useCallback((studentId, assignmentId, value) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [assignmentId]: value },
    }));
    setDirty(true);
  }, []);

  const handleAddAssignment = useCallback((assignment) => {
    setAssignments(prev => [...prev, { ...assignment, id: `a${Date.now()}` }]);
    setDirty(true);
  }, []);

  const handleDeleteAssignment = useCallback((assignmentId) => {
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
    setDirty(true);
  }, []);

  const handleBulkFill = useCallback((assignmentId, value) => {
    setGrades(prev => {
      const newGrades = { ...prev };
      students.forEach(student => {
        if (!newGrades[student.id]) newGrades[student.id] = {};
        newGrades[student.id] = { ...newGrades[student.id], [assignmentId]: value };
      });
      return newGrades;
    });
    setDirty(true);
  }, [students]);

  const handleAttendanceUpdate = useCallback((date, studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [date]: { ...(prev[date] || {}), [studentId]: status },
    }));
    setDirty(true);
  }, []);

  const handleUpdateCategories = useCallback((newCategories) => {
    setCategories(newCategories);
    setDirty(true);
  }, []);

  const markClean = useCallback(() => {
    setDirty(false);
  }, []);

  return {
    // State
    students,
    assignments,
    categories,
    grades,
    attendance,
    loading,
    dirty,
    previousGrades,

    // Derived
    finalGrades,

    // Helpers
    getCategoryPercentage,
    getTotalAbsences,
    getLetterGrade,

    // Handlers
    handleGradeChange,
    handleAddAssignment,
    handleDeleteAssignment,
    handleBulkFill,
    handleAttendanceUpdate,
    handleUpdateCategories,
    setAssignments,
    setCategories,
    markClean,
  };
}
