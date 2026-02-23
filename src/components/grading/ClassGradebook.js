import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Save, X, TrendingUp, BookOpen, GraduationCap, FileDown, Calendar, Check, XCircle, Clock, CloudUpload, Loader2, ArrowLeft, Percent, Trash2, ArrowDown, Users } from 'lucide-react';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import { databaseService } from '../../services/databaseService';
import ReportCardExportModal from './ReportCardExportModal';
import { calculateLetterGrade } from '../../utils/gradeCalculator';
import { useGrading } from '../../context/GradingContext';
import { generateSmartComment } from '../../utils/commentGenerator';
import { getAcademicQuarter, getCurrentSchoolYear } from '../../utils/smartUtils';
import StudentSummaryPanel from './StudentSummaryPanel';
import ClassAnalytics from './ClassAnalytics';


// --- DEFAULT EMPTY DATA ---
const DEFAULT_CATEGORIES = [
  { id: 'hw', name: 'Homework', weight: 20 },
  { id: 'quiz', name: 'Quizzes', weight: 30 },
  { id: 'test', name: 'Tests', weight: 50 },
];


const ClassGradebook = ({ course, user, onExit, onNavigateToGradeCards, backLabel = "Back to Dashboard" }) => {
  // --- STATE MANAGEMENT ---
  const { setGradeCardPayload } = useGrading();
  const [students, setStudents] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [assignments, setAssignments] = useState([]);
  const [grades, setGrades] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('grades');
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ name: '', categoryId: 'hw', maxScore: 100 });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [studentToExport, setStudentToExport] = useState(null);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [editingCategories, setEditingCategories] = useState([]);
  const [isBulkFillModalOpen, setIsBulkFillModalOpen] = useState(false);
  const [bulkFillData, setBulkFillData] = useState({ assignmentId: null, value: '' });
  const [selectedStudentForPanel, setSelectedStudentForPanel] = useState(null);

  // --- DATA FETCHING ---
  useEffect(() => {
    const loadGradebookData = async () => {
      if (!course?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 1. Fetch enrolled students for this course
        const enrollments = await databaseService.getEnrollmentsByCourse(course.id);

        if (enrollments.length > 0) {
          // Fetch full student records to get names
          const allStudents = await databaseService.getAllStudents();
          const studentMap = {};
          allStudents.forEach(s => { studentMap[s.id] = s; });

          const enrolledStudents = enrollments.map(e => {
            const studentRecord = studentMap[e.studentId];
            return {
              id: e.studentId,
              name: studentRecord?.studentName || studentRecord ? `${studentRecord.firstName || ''} ${studentRecord.lastName || ''}`.trim() : e.studentId,
              gradeLevel: studentRecord?.gradeLevel || '',
              enrollmentId: e.id,
            };
          });
          setStudents(enrolledStudents);
        } else {
          setStudents([]);
        }

        // 2. Load saved gradebook data (assignments, categories, attendance, grades)
        const savedGradebook = await databaseService.getGradebook(course.id);
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
    };

    loadGradebookData();
  }, [course?.id]);

  // --- DERIVED STATE & CALCULATIONS ---
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

  // --- HELPER: per-category percentage for a student ---
  const getCategoryPercentage = (studentId, category) => {
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
  };

  // --- HANDLERS ---
  const handleGradeChange = (studentId, assignmentId, value) => {
    setGrades(prev => ({ ...prev, [studentId]: { ...prev[studentId], [assignmentId]: value } }));
  };

  const handleAddAssignment = (e) => {
    e.preventDefault();
    setAssignments([...assignments, { ...newAssignment, id: `a${Date.now()}` }]);
    setIsModalOpen(false);
    setNewAssignment({ name: '', categoryId: 'hw', maxScore: 100 });
  };

  const handleOpenWeightModal = () => {
    setEditingCategories(JSON.parse(JSON.stringify(categories)));
    setIsWeightModalOpen(true);
  };

  const handleSaveWeights = (e) => {
    e.preventDefault();
    setCategories(editingCategories);
    setIsWeightModalOpen(false);
  };

  const handleAddCategory = () => {
    setEditingCategories([...editingCategories, { id: `cat-${Date.now()}`, name: 'New Category', weight: 0 }]);
  };

  const handleDeleteCategory = (catId) => {
    if (editingCategories.length <= 1) return alert("You must have at least one category.");
    setEditingCategories(editingCategories.filter(c => c.id !== catId));
  };

  const handleOpenBulkFill = (assignmentId) => {
    setBulkFillData({ assignmentId, value: '' });
    setIsBulkFillModalOpen(true);
  };

  const handleBulkFill = (e) => {
    e.preventDefault();
    const { assignmentId, value } = bulkFillData;
    if (!assignmentId) return;

    setGrades(prev => {
      const newGrades = { ...prev };
      students.forEach(student => {
        if (!newGrades[student.id]) newGrades[student.id] = {};
        newGrades[student.id] = { ...newGrades[student.id], [assignmentId]: value };
      });
      return newGrades;
    });
    setIsBulkFillModalOpen(false);
  };

  const handleOpenExport = (student) => {
    setStudentToExport({
      name: student.name,
      finalPercentage: finalGrades[student.id] || 0
    });
    setIsExportModalOpen(true);
  };

  const handleGenerateGradeCard = (student) => {
    const percentage = finalGrades[student.id];
    if (percentage === null) return;

    const categoryBreakdown = categories
      .map(cat => {
        const pct = getCategoryPercentage(student.id, cat);
        return pct !== null ? { name: cat.name, percentage: pct } : null;
      })
      .filter(Boolean);

    const comment = generateSmartComment({
      studentName: student.name,
      overallPercentage: percentage,
      categoryBreakdown,
      totalAbsences: getTotalAbsences(student.id),
      previousPercentage: null,
    });

    setGradeCardPayload({
      studentName: student.name,
      studentId: student.id,
      gradeLevel: student.gradeLevel || '',
      courseName: course?.courseName || 'Class',
      coursePercentage: percentage,
      courseLetterGrade: calculateLetterGrade(percentage),
      subjectArea: course?.subjectArea || '',
      categoryBreakdown,
      totalAbsences: getTotalAbsences(student.id),
      quarter: getAcademicQuarter(),
      schoolYear: getCurrentSchoolYear(),
      teacherName: course?.teacherName || user?.name || '',
      generatedComment: comment,
    });

    if (onNavigateToGradeCards) onNavigateToGradeCards();
  };

  const handleSaveToCloud = async () => {
    setIsSaving(true);
    setSaveMessage('');

    const term = getAcademicQuarter();

    try {
      // Save per-student enrollment grades
      const savePromises = students.map(student => {
        const percentage = finalGrades[student.id];

        if (percentage === null || percentage === undefined) {
          return Promise.resolve(null);
        }

        const letterGrade = calculateLetterGrade(percentage);

        const enrollmentData = {
          id: `${student.id}-${course.id}`,
          studentId: student.id,
          courseId: course.id,
          courseName: course.courseName,
          subjectArea: course.subjectArea || '',
          teacherName: course.teacherName || user?.name || '',
          percentage: parseFloat(percentage.toFixed(2)),
          letterGrade: letterGrade,
          term: course.term || getCurrentSchoolYear(),
          status: 'Active',
        };

        return databaseService.saveCourseGrade(enrollmentData);
      });

      await Promise.all(savePromises);

      // Save full gradebook data (assignments, categories, attendance, grades)
      const gradebookPayload = {
        id: course.id,
        assignments,
        categories,
        attendance,
        grades,
        lastUpdated: new Date().toISOString(),
      };
      await databaseService.saveGradebook(gradebookPayload);

      setSaveMessage('Saved!');
      databaseService.logAudit(user, 'SaveGrades', `Saved ${students.length} student grades for course ${course.courseName}.`);

    } catch (error) {
      console.error("Error saving grades to cloud:", error);
      setSaveMessage('Error!');
      alert('There was an error saving grades to the database. Please check the console for details.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const getTotalAbsences = (studentId) => {
    return Object.values(attendance).reduce((count, dayRecord) => {
      return dayRecord[studentId] === 'Absent' ? count + 1 : count;
    }, 0);
  };

  const handleAttendanceUpdate = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [currentDate]: { ...(prev[currentDate] || {}), [studentId]: status } }));
  };

  const generateReportCard = async () => {
    if (!studentToExport) return;

    try {
      const response = await fetch('/templates/quarter_card_template.docx');
      if (!response.ok) throw new Error("Could not find template");

      const arrayBuffer = await response.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

      const grade = studentToExport.finalPercentage;
      const letterGrade = calculateLetterGrade(grade);

      const data = {
        student_name: studentToExport.name,
        grade_level: '11',
        school_year: getCurrentSchoolYear(),
        quarter_name: getAcademicQuarter(),
        report_date: new Date().toLocaleDateString(),
        teacher_name: user?.name || 'Teacher',
        total_credits: '3.5',
        comments: `Current grade in ${course.courseName}: ${grade.toFixed(1)}%. ${grade >= 70 ? 'Keep up the good work!' : 'Please see me for extra help.'}`,

        eng_class: 'English 11', eng_grade: 'B+', eng_pct: '88',
        math_class: 'Algebra II', math_grade: 'A-', math_pct: '92',
        sci_class: 'Chemistry', sci_grade: 'B', sci_pct: '85',
        soc_class: 'US History', soc_grade: 'A', soc_pct: '95',

        elec1_class: course.courseName, elec1_grade: letterGrade, elec1_pct: grade.toFixed(1),
        elec2_class: 'Study Hall', elec2_grade: 'P', elec2_pct: '100',
      };

      doc.render(data);

      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      saveAs(out, `${studentToExport.name}_ReportCard.docx`);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report card. Please ensure templates are available.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-4 text-lg font-bold text-slate-600">Loading Gradebook...</span>
      </div>
    );
  }

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 font-sans text-slate-800">
      {!course ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-10">
          <BookOpen className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-2xl font-bold text-slate-700">No Class Selected</h2>
          <p className="text-slate-500 mt-2">
            Please go to the <strong>Dashboard</strong> and select a class from the "My Classes" tab to view its gradebook.
          </p>
        </div>
      ) : (
      <>
        {/* HEADER SECTION */}
        <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            {onExit && (
              <button onClick={onExit} className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors duration-300">
                <ArrowLeft className="w-4 h-4" /> {backLabel}
              </button>
            )}
            <h1 className="text-4xl font-extrabold text-slate-900 flex items-center gap-3">
              <span className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                <GraduationCap className="w-8 h-8" />
              </span>
              {course.courseName || 'Class Gradebook'}
            </h1>
            <p className="text-slate-500 mt-2 text-base">
               {course.teacherName || user.name} | {students.length} Students
               {course.subjectArea && <span className="ml-2 text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{course.subjectArea}</span>}
            </p>
          </div>

          {/* CONTROLS SECTION */}
          {activeTab === 'grades' && (
            <div className="flex gap-3 items-center">
              {saveMessage && <span className={`text-sm font-bold ${saveMessage === 'Error!' ? 'text-red-500' : 'text-emerald-600'} animate-pulse`}>{saveMessage}</span>}
              <button
                onClick={handleSaveToCloud}
                disabled={isSaving}
                className="bg-indigo-600 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (saveMessage === 'Saved!' ? <Check className="w-5 h-5" /> : <CloudUpload className="w-5 h-5" />)}
                {isSaving ? 'Saving...' : (saveMessage === 'Saved!' ? 'Saved!' : 'Save to Cloud')}
              </button>
              <button
                onClick={handleOpenWeightModal}
                className="bg-white text-slate-700 font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-slate-300/20 border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 ease-in-out flex items-center gap-2"
              >
                <Percent className="w-5 h-5 text-indigo-500" /> Weights
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-white text-slate-700 font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-slate-300/20 border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 ease-in-out flex items-center gap-2"
              >
                <Plus className="w-5 h-5 text-indigo-500" /> Add Assignment
              </button>
            </div>
          )}
        </div>

        {/* TAB NAVIGATION */}
        <div className="max-w-7xl mx-auto mb-0 flex gap-2 border-b border-slate-200/80">
          <button onClick={() => setActiveTab('grades')} className={`px-6 py-3 font-bold text-sm transition-all duration-300 rounded-t-lg flex items-center gap-2.5 border-b-2 ${activeTab === 'grades' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            <BookOpen className="w-5 h-5" /> Gradebook
          </button>
          <button onClick={() => setActiveTab('attendance')} className={`px-6 py-3 font-bold text-sm transition-all duration-300 rounded-t-lg flex items-center gap-2.5 border-b-2 ${activeTab === 'attendance' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            <Calendar className="w-5 h-5" /> Attendance
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`px-6 py-3 font-bold text-sm transition-all duration-300 rounded-t-lg flex items-center gap-2.5 border-b-2 ${activeTab === 'analytics' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            <TrendingUp className="w-5 h-5" /> Analytics
          </button>
        </div>

        {/* MAIN CONTENT CARD */}
        <div className="max-w-7xl mx-auto bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-b-2xl rounded-tr-2xl shadow-2xl shadow-slate-200/60 overflow-hidden flex flex-col min-h-[70vh]">

          {/* GRADEBOOK GRID */}
          {activeTab === 'grades' && (
            <div className="overflow-auto flex-1">
              {students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Users className="w-12 h-12 text-slate-300 mb-3" />
                  <h3 className="text-lg font-bold text-slate-600 mb-1">No Students Enrolled</h3>
                  <p className="text-sm text-slate-400 max-w-md">
                    Go back to the Dashboard and use the <strong>Manage Students</strong> button on this course to enroll students first.
                  </p>
                </div>
              ) : (
              <table className="w-full border-collapse min-w-[800px]">
                <thead className="bg-slate-100/80 backdrop-blur-sm text-slate-600 text-xs uppercase font-bold tracking-wider sticky top-0 z-10 shadow-sm shadow-slate-200/50">
                  <tr>
                    <th className="p-4 text-left border-b border-r border-slate-200/80 sticky left-0 bg-slate-100/80 w-48 min-w-[12rem]">Student</th>
                    {assignments.map(assignment => (
                      <th key={assignment.id} className="p-3 text-center border-b border-slate-200/80 min-w-[9rem]">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="truncate max-w-[140px]" title={assignment.name}>{assignment.name}</span>
                          <div className="flex items-center gap-2">
                             <span className="text-xs px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 font-semibold">
                              {categories.find(c => c.id === assignment.categoryId)?.name}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">/ {assignment.maxScore}</span>
                          </div>
                          <button onClick={() => handleOpenBulkFill(assignment.id)} className="mt-1 text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded hover:bg-indigo-100 transition-colors">
                            <ArrowDown className="w-3 h-3" /> Fill All
                          </button>
                        </div>
                      </th>
                    ))}
                    <th className="p-4 text-center border-b border-l border-slate-200/80 sticky right-0 bg-slate-100/80 w-32 shadow-[-4px_0_8px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center justify-center gap-2 text-indigo-600">
                        <TrendingUp className="w-5 h-5" /> Overall
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-800 divide-y divide-slate-100/50">
                  {students.map((student) => {
                    const finalGrade = finalGrades[student.id];
                    const isPassing = finalGrade === null || finalGrade >= 60;
                    return (
                      <tr key={student.id} className="hover:bg-slate-100/50 transition-colors duration-200 group">
                        <td className="p-4 font-bold border-r border-slate-200/80 sticky left-0 bg-white/50 group-hover:bg-slate-100/50 backdrop-blur-sm">
                          <div className="flex justify-between items-center">
                            <button onClick={() => setSelectedStudentForPanel(student)} className="text-left hover:text-indigo-600 transition-colors">
                              {student.name}
                              {student.gradeLevel && <div className="text-xs text-slate-400 font-normal">Grade {student.gradeLevel}</div>}
                            </button>
                            <div className="flex gap-1">
                              <button onClick={() => handleGenerateGradeCard(student)} className="text-slate-400 opacity-0 group-hover:opacity-100 hover:text-emerald-600 transition-all p-1" title="Generate Grade Card"><GraduationCap className="w-5 h-5" /></button>
                              <button onClick={() => handleOpenExport(student)} className="text-slate-400 opacity-0 group-hover:opacity-100 hover:text-indigo-600 transition-all p-1" title="Export Report Card"><FileDown className="w-5 h-5" /></button>
                            </div>
                          </div>
                        </td>
                        {assignments.map(assignment => {
                          const grade = grades[student.id]?.[assignment.id];
                          const isFailing = grade !== undefined && grade !== '' && parseFloat(grade) < 60;
                          return (
                            <td key={assignment.id} className="p-2 text-center border-r border-slate-200/50">
                              <input type="number" min="0" max={assignment.maxScore} value={grade ?? ''} onChange={(e) => handleGradeChange(student.id, assignment.id, e.target.value)} className={`w-24 p-2 text-center border rounded-lg outline-none transition-all duration-300 font-mono ${isFailing ? 'border-rose-300 bg-rose-50 text-rose-600 font-bold focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`} placeholder="—" />
                            </td>
                          );
                        })}
                        <td className="p-4 text-center font-bold border-l border-slate-200/80 sticky right-0 bg-white/50 group-hover:bg-slate-100/50 backdrop-blur-sm shadow-[-4px_0_8px_rgba(0,0,0,0.02)]">
                          {finalGrade !== null ? <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${isPassing ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{finalGrade.toFixed(1)}%</span> : <span className="text-slate-400 text-xs italic">N/A</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              )}
            </div>
          )}

          {/* ATTENDANCE UI */}
          {activeTab === 'attendance' && (
            <div className="flex flex-col h-full">
              <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex items-center gap-4">
                <label className="text-sm font-bold text-slate-600">Date:</label>
                <input type="date" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} className="p-2.5 rounded-xl border-slate-300/70 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/20 outline-none" />
              </div>

              <div className="overflow-auto flex-1 p-6">
                <div className="max-w-4xl mx-auto">
                  {students.length === 0 ? (
                    <div className="text-center py-16 text-sm text-slate-400 italic">No students enrolled to track attendance.</div>
                  ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="text-slate-500 font-bold text-xs">
                      <tr>
                        <th className="p-3">Student</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Total Absences</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50">
                      {students.map(student => {
                        const status = attendance[currentDate]?.[student.id] || 'Present';
                        return (
                          <tr key={student.id} className="hover:bg-slate-100/50 transition-colors duration-200">
                            <td className="p-4 font-bold text-slate-800 rounded-l-2xl">{student.name}</td>
                            <td className="p-3">
                              <div className="flex justify-center bg-slate-100/80 rounded-xl p-1 gap-1">
                                {['Present', 'Absent', 'Tardy'].map(s => (
                                  <button key={s} onClick={() => handleAttendanceUpdate(student.id, s)} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition-all duration-200 ${status === s ? 'bg-white border-slate-200/90 text-indigo-600 shadow-sm' : 'bg-transparent border-transparent text-slate-500 hover:bg-white/50 hover:text-slate-700'}`}>
                                    {s === 'Present' && <Check size={16} />}
                                    {s === 'Absent' && <XCircle size={16} />}
                                    {s === 'Tardy' && <Clock size={16} />}
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="p-4 text-right font-mono font-bold text-slate-600 rounded-r-2xl">{getTotalAbsences(student.id)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <ClassAnalytics
              students={students}
              finalGrades={finalGrades}
              assignments={assignments}
              categories={categories}
              grades={grades}
              attendance={attendance}
            />
          )}
        </div>
      </>
      )}

      {/* STUDENT SUMMARY PANEL */}
      {selectedStudentForPanel && (
        <StudentSummaryPanel
          student={selectedStudentForPanel}
          grades={grades}
          assignments={assignments}
          categories={categories}
          attendance={attendance}
          finalGrade={finalGrades[selectedStudentForPanel.id]}
          onClose={() => setSelectedStudentForPanel(null)}
          onGenerateGradeCard={handleGenerateGradeCard}
        />
      )}

      {/* MODALS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl shadow-slate-900/10 w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200/80 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <span className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600"><BookOpen className="w-6 h-6" /></span> New Assignment
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-200/50">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddAssignment} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1.5">Name</label>
                <input type="text" required value={newAssignment.name} onChange={(e) => setNewAssignment({...newAssignment, name: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300/80 focus:ring-4 focus:ring-indigo-500/20 outline-none text-base transition-all" placeholder="e.g. Chapter 5 Quiz" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5">Category</label>
                  <select value={newAssignment.categoryId} onChange={(e) => setNewAssignment({...newAssignment, categoryId: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300/80 focus:ring-4 focus:ring-indigo-500/20 outline-none bg-white text-base transition-all">
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5">Max Score</label>
                  <input type="number" required min="1" value={newAssignment.maxScore} onChange={(e) => setNewAssignment({...newAssignment, maxScore: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300/80 focus:ring-4 focus:ring-indigo-500/20 outline-none text-base transition-all" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full bg-slate-100 text-slate-700 font-bold py-3 px-6 rounded-xl hover:bg-slate-200/80 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-colors duration-200 ease-in-out">Cancel</button>
                <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 ease-in-out flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" /> Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WEIGHT SETTINGS MODAL */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl shadow-slate-900/10 w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200/80 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <span className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600"><Percent className="w-6 h-6" /></span> Category Weights
              </h3>
              <button onClick={() => setIsWeightModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-200/50">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveWeights} className="p-6 space-y-4">
              <div className="space-y-3">
                {editingCategories.map((cat, index) => (
                  <div key={cat.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Category Name</label>
                      <input type="text" value={cat.name} onChange={(e) => {
                        const newCats = [...editingCategories];
                        newCats[index].name = e.target.value;
                        setEditingCategories(newCats);
                      }} className="w-full p-2.5 rounded-lg border border-slate-300/80 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-bold text-slate-700" />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Weight (%)</label>
                      <input type="number" min="0" max="100" value={cat.weight} onChange={(e) => {
                        const newCats = [...editingCategories];
                        newCats[index].weight = parseFloat(e.target.value) || 0;
                        setEditingCategories(newCats);
                      }} className="w-full p-2.5 rounded-lg border border-slate-300/80 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-bold text-slate-700 text-center" />
                    </div>
                    <button type="button" onClick={() => handleDeleteCategory(cat.id)} className="mt-6 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Remove Category">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={handleAddCategory} className="w-full py-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Add Category
                </button>
              </div>
              <div className="pt-4 border-t border-slate-200/80 flex justify-between items-center">
                <div className="text-sm font-bold text-slate-600">Total: <span className={`${editingCategories.reduce((sum, c) => sum + c.weight, 0) === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>{editingCategories.reduce((sum, c) => sum + c.weight, 0)}%</span></div>
                <button type="submit" className="bg-indigo-600 text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all">Save Weights</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK FILL MODAL */}
      {isBulkFillModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl shadow-slate-900/10 w-full max-w-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200/80 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <span className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600"><ArrowDown className="w-6 h-6" /></span> Bulk Fill Grades
              </h3>
              <button onClick={() => setIsBulkFillModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-200/50">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleBulkFill} className="p-6 space-y-5">
              <div>
                <p className="text-sm text-slate-500 mb-4">
                  This will overwrite grades for all students for <strong>{assignments.find(a => a.id === bulkFillData.assignmentId)?.name}</strong>.
                </p>
                <label className="block text-sm font-bold text-slate-600 mb-1.5">Grade to Apply</label>
                <input type="number" autoFocus value={bulkFillData.value} onChange={(e) => setBulkFillData({...bulkFillData, value: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300/80 focus:ring-4 focus:ring-indigo-500/20 outline-none text-base transition-all" placeholder="e.g. 100" />
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsBulkFillModalOpen(false)} className="w-full bg-slate-100 text-slate-700 font-bold py-3 px-6 rounded-xl hover:bg-slate-200/80 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-colors">Cancel</button>
                <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all">Apply</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPORT MODAL */}
      <ReportCardExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        student={studentToExport}
        currentSubject={course?.courseName || 'Course'}
        onDownload={generateReportCard}
      />
    </div>
  );
};

export default ClassGradebook;
