import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, UserPlus, UserMinus, Search, Loader2, Users, BookOpen } from 'lucide-react';
import { databaseService } from '../../services/databaseService';

const EnrollmentManager = ({ course, user, onExit }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [enrolling, setEnrolling] = useState(null);
  const [removing, setRemoving] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [courseEnrollments, students] = await Promise.all([
        databaseService.getEnrollmentsByCourse(course.id),
        databaseService.getAllStudents(),
      ]);
      setEnrollments(courseEnrollments);
      setAllStudents(students.filter(s => s.active !== false));
    } catch (error) {
      console.error('Error loading enrollment data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [course.id]);

  const enrolledStudentIds = useMemo(() => {
    return new Set(enrollments.map(e => e.studentId));
  }, [enrollments]);

  const availableStudents = useMemo(() => {
    const available = allStudents.filter(s => !enrolledStudentIds.has(s.id));
    if (!searchQuery.trim()) return available;
    const q = searchQuery.toLowerCase();
    return available.filter(s =>
      (s.studentName || `${s.firstName} ${s.lastName}`).toLowerCase().includes(q)
    );
  }, [allStudents, enrolledStudentIds, searchQuery]);

  const enrolledStudentsList = useMemo(() => {
    return enrollments.map(enrollment => {
      const student = allStudents.find(s => s.id === enrollment.studentId);
      return {
        ...enrollment,
        studentName: student?.studentName || student ? `${student.firstName} ${student.lastName}` : enrollment.studentId,
        gradeLevel: student?.gradeLevel || '',
        unitName: student?.unitName || '',
      };
    });
  }, [enrollments, allStudents]);

  const handleEnroll = async (student) => {
    const studentName = student.studentName || `${student.firstName} ${student.lastName}`;
    setEnrolling(student.id);
    try {
      const enrollmentData = {
        id: `${student.id}-${course.id}`,
        studentId: student.id,
        courseId: course.id,
        courseName: course.courseName,
        subjectArea: course.subjectArea || '',
        teacherName: course.teacherName,
        percentage: null,
        letterGrade: null,
        term: course.term || '',
        enrollmentDate: new Date().toISOString().split('T')[0],
        status: 'Active',
      };

      await databaseService.enrollStudent(enrollmentData);
      databaseService.logAudit(user, 'EnrollStudent', `Enrolled ${studentName} in ${course.courseName}`);
      await fetchData();
    } catch (error) {
      console.error('Error enrolling student:', error);
      alert('Failed to enroll student.');
    }
    setEnrolling(null);
  };

  const handleUnenroll = async (enrollment) => {
    if (!window.confirm(`Remove ${enrollment.studentName} from ${course.courseName}?`)) return;

    setRemoving(enrollment.id);
    try {
      await databaseService.unenrollStudent(enrollment.id);
      databaseService.logAudit(user, 'UnenrollStudent', `Removed ${enrollment.studentName} from ${course.courseName}`);
      await fetchData();
    } catch (error) {
      console.error('Error unenrolling student:', error);
      alert('Failed to remove student.');
    }
    setRemoving(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-3" />
        <span className="text-sm font-medium text-slate-500">Loading enrollment data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Classes
        </button>
        <div className="flex-1">
          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            {course.courseName}
          </h3>
          <p className="text-sm text-slate-500">
            {course.subjectArea && <span className="font-semibold">{course.subjectArea}</span>}
            {course.subjectArea && ' · '}
            Manage enrolled students
          </p>
        </div>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT: Enrolled Students */}
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200/60 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              Enrolled ({enrolledStudentsList.length})
            </h4>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {enrolledStudentsList.length === 0 ? (
              <div className="text-center py-12 text-sm text-slate-400 italic">
                No students enrolled yet
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {enrolledStudentsList.map(enrollment => (
                  <div key={enrollment.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 transition-colors group">
                    <div>
                      <div className="text-sm font-bold text-slate-800">{enrollment.studentName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {enrollment.gradeLevel && (
                          <span className="text-[10px] font-bold text-slate-400">Grade {enrollment.gradeLevel}</span>
                        )}
                        {enrollment.unitName && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">{enrollment.unitName}</span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${enrollment.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {enrollment.status}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnenroll(enrollment)}
                      disabled={removing === enrollment.id}
                      className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Remove from course"
                    >
                      {removing === enrollment.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <UserMinus className="w-4 h-4" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Available Students */}
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200/60">
            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-500" />
              Available Students ({availableStudents.length})
            </h4>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {availableStudents.length === 0 ? (
              <div className="text-center py-12 text-sm text-slate-400 italic">
                {searchQuery ? 'No students match your search' : 'All students are enrolled'}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {availableStudents.map(student => {
                  const name = student.studentName || `${student.firstName} ${student.lastName}`;
                  return (
                    <div key={student.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 transition-colors group">
                      <div>
                        <div className="text-sm font-bold text-slate-800">{name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {student.gradeLevel && (
                            <span className="text-[10px] font-bold text-slate-400">Grade {student.gradeLevel}</span>
                          )}
                          {student.unitName && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">{student.unitName}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleEnroll(student)}
                        disabled={enrolling === student.id}
                        className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        title="Enroll in course"
                      >
                        {enrolling === student.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <UserPlus className="w-4 h-4" />
                        }
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentManager;
