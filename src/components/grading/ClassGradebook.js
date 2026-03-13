import React, { useState, useCallback, useEffect } from 'react';
import UnitCardMenu from './UnitCardMenu';
import { Plus, BookOpen, GraduationCap, Calendar, Check, XCircle, Clock, CloudUpload, Loader2, ArrowLeft, Percent, TrendingUp, Undo2, Redo2 } from 'lucide-react';
import { databaseService } from '../../services/databaseService';
import { calculateLetterGrade } from '../../utils/gradeCalculator';
import { useGrading } from '../../context/GradingContext';
import { generateSmartComment } from '../../utils/commentGenerator';
import { getAcademicQuarter, getCurrentSchoolYear } from '../../utils/smartUtils';
import StudentSummaryPanel from './StudentSummaryPanel';
import ClassAnalytics from './ClassAnalytics';
import GradeCardPreview from './GradeCardPreview';
import NewAssignmentModal from './modals/NewAssignmentModal';
import WeightSettingsModal from './modals/WeightSettingsModal';
import BulkFillModal from './modals/BulkFillModal';
import { useGradebook } from '../../hooks/useGradebook';
import { useAutoSave } from '../../hooks/useAutoSave';
import Q3GradeSpreadsheet from '../../data/Q3_GradeSpreadsheet_2025-2026.json';
import { useUndoStack } from '../../hooks/useUndoStack';


const ClassGradebook = ({ course, user, onExit, onNavigateToGradeCards, backLabel = "Back to Dashboard" }) => {
  const { setGradeCardPayload, commentTone } = useGrading();

  // --- CENTRAL STATE via custom hook ---
  const {
    students: origStudents, assignments, categories, grades: origGrades, attendance,
    finalGrades, loading, dirty, previousGrades,
    getCategoryPercentage, getTotalAbsences,
    handleGradeChange: rawGradeChange,
    handleAddAssignment, handleBulkFill,
    handleAttendanceUpdate, handleUpdateCategories,
    markClean,
  } = useGradebook(course?.id, user?.units);

  // --- Q3 Spreadsheet override ---
  const [spreadsheetStudents, setSpreadsheetStudents] = useState([]);
  const [spreadsheetGrades, setSpreadsheetGrades] = useState({});

  useEffect(() => {
    if (!Q3GradeSpreadsheet) return;
    const units = ['Harmony', 'Integrity'];
    let studentsArr = [];
    let gradesObj = {};
    units.forEach(unit => {
      const rows = Q3GradeSpreadsheet[unit] || [];
      rows.forEach(row => {
        const name = row[0];
        const gradeLevel = row[1];
        studentsArr.push({
          id: `${unit}-${name.replace(/\s+/g, '-')}`,
          studentName: name,
          gradeLevel,
          unitName: unit,
          active: true,
        });
        gradesObj[`${unit}-${name.replace(/\s+/g, '-')}`] = {
          // Example: English grade
          english: row[11],
          englishPct: row[12],
          math: row[7],
          mathPct: row[8],
          science: row[5],
          sciencePct: row[6],
          history: row[3],
          historyPct: row[4],
        };
      });
    });
    setSpreadsheetStudents(studentsArr);
    setSpreadsheetGrades(gradesObj);
  }, []);

  // --- LOCAL UI STATE ---
  const [activeTab, setActiveTab] = useState('grades');
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStudentForPanel, setSelectedStudentForPanel] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'assignment' | 'weights' | 'bulkFill' | 'export' | null
  const [bulkFillAssignmentId, setBulkFillAssignmentId] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState('Harmony');

  // --- UNDO/REDO ---
  const undoStack = useUndoStack(50);

  const handleGradeChange = useCallback((studentId, assignmentId, value) => {
    const oldValue = grades[studentId]?.[assignmentId] ?? '';
    undoStack.push({ studentId, assignmentId, oldValue, newValue: value });
    rawGradeChange(studentId, assignmentId, value);
  }, [grades, rawGradeChange, undoStack]);

  const handleUndo = useCallback(() => {
    const action = undoStack.undo();
    if (action) {
      rawGradeChange(action.studentId, action.assignmentId, action.oldValue);
    }
  }, [undoStack, rawGradeChange]);

  const handleRedo = useCallback(() => {
    const action = undoStack.redo();
    if (action) {
      rawGradeChange(action.studentId, action.assignmentId, action.newValue);
    }
  }, [undoStack, rawGradeChange]);

  // Global keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo]);

  // --- AUTO-SAVE ---
  const saveFn = useCallback(async () => {
    if (!course?.id) return;

    // Save per-student enrollment grades
    const savePromises = students.map(student => {
      const percentage = finalGrades[student.id];
      if (percentage === null || percentage === undefined) return Promise.resolve(null);

      return databaseService.saveCourseGrade({
        id: `${student.id}-${course.id}`,
        studentId: student.id,
        courseId: course.id,
        courseName: course.courseName,
        subjectArea: course.subjectArea || '',
        teacherName: course.teacherName || user?.name || '',
        percentage: parseFloat(percentage.toFixed(2)),
        letterGrade: calculateLetterGrade(percentage),
        term: course.term || getCurrentSchoolYear(),
        status: 'Active',
      });
    });

    await Promise.all(savePromises);

    // Save full gradebook data
    await databaseService.saveGradebook({
      id: course.id,
      assignments,
      categories,
      attendance,
      grades,
      lastUpdated: new Date().toISOString(),
    });

    markClean();
    databaseService.logAudit(user, 'SaveGrades', `Auto-saved ${students.length} student grades for ${course.courseName}.`);
  }, [course, user, students, finalGrades, assignments, categories, attendance, grades, markClean]);

  const { saveStatus, lastSavedAt, forceSave } = useAutoSave(dirty, saveFn, {
    delay: 2500,
    enabled: !loading && !!course?.id,
  });

  // --- BEFOREUNLOAD WARNING ---
  useEffect(() => {
    const handler = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // --- HANDLERS ---
  const handleGenerateGradeCard = useCallback((student) => {
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
      previousPercentage: previousGrades[student.id] ?? null,
      tone: commentTone,
      hasIep: student.iep === 'Yes',
      iepGoalAreas: student.iepGoalAreas || [],
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
  }, [finalGrades, categories, getCategoryPercentage, getTotalAbsences, previousGrades, setGradeCardPayload, course, user, onNavigateToGradeCards, commentTone]);

  const handleOpenBulkFill = useCallback((assignmentId) => {
    setBulkFillAssignmentId(assignmentId);
    setActiveModal('bulkFill');
  }, []);

  // --- SAVE STATUS DISPLAY ---
  const getSaveStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return { icon: <Loader2 className="w-4 h-4 animate-spin" />, text: 'Saving...', cls: 'text-indigo-600' };
      case 'saved': {
        const ago = lastSavedAt ? Math.round((Date.now() - lastSavedAt.getTime()) / 1000) : 0;
        const label = ago < 5 ? 'Saved' : ago < 60 ? `Saved ${ago}s ago` : `Saved ${Math.round(ago / 60)}m ago`;
        return { icon: <Check className="w-4 h-4" />, text: label, cls: 'text-emerald-600' };
      }
      case 'error':
        return { icon: <XCircle className="w-4 h-4" />, text: 'Save failed', cls: 'text-red-500' };
      default:
        return dirty
          ? { icon: <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />, text: 'Unsaved', cls: 'text-amber-600' }
          : null;
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

  const statusDisplay = getSaveStatusDisplay();

  // Use spreadsheet data if available
  const students = spreadsheetStudents.length > 0 ? spreadsheetStudents : origStudents;
  const grades = spreadsheetStudents.length > 0 ? spreadsheetGrades : origGrades;

  return (
    <div className="min-h-screen w-screen h-screen bg-slate-50 p-0 font-sans text-slate-800">
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
        {/* HEADER */}
        <div className="w-full mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-8">
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

          {/* CONTROLS */}
          {activeTab === 'grades' && (
            <div className="flex gap-2 items-center flex-wrap">
              {/* Save status indicator */}
              {statusDisplay && (
                <div className={`flex items-center gap-1.5 text-sm font-bold ${statusDisplay.cls}`} aria-live="polite">
                  {statusDisplay.icon}
                  <span>{statusDisplay.text}</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <button onClick={forceSave} className="text-xs font-bold text-red-600 hover:text-red-800 underline">Retry</button>
              )}
              {/* Manual save fallback */}
              <button
                onClick={forceSave}
                className="bg-white text-slate-600 font-bold py-2 px-4 rounded-xl border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all flex items-center gap-2 text-sm"
                title="Save now (auto-saves every few seconds)"
              >
                <CloudUpload className="w-4 h-4 text-indigo-500" /> Save
              </button>
              {/* Undo / Redo */}
              <div className="flex gap-1">
                <button onClick={handleUndo} disabled={!undoStack.canUndo} className="p-2 rounded-lg border border-slate-200/80 bg-white text-slate-500 hover:text-indigo-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all" title="Undo (Ctrl+Z)">
                  <Undo2 className="w-4 h-4" />
                </button>
                <button onClick={handleRedo} disabled={!undoStack.canRedo} className="p-2 rounded-lg border border-slate-200/80 bg-white text-slate-500 hover:text-indigo-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all" title="Redo (Ctrl+Shift+Z)">
                  <Redo2 className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => setActiveModal('weights')}
                className="bg-white text-slate-700 font-bold py-2 px-4 rounded-xl border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all flex items-center gap-2 text-sm"
              >
                <Percent className="w-4 h-4 text-indigo-500" /> Weights
              </button>
              <button
                onClick={() => setActiveModal('assignment')}
                className="bg-white text-slate-700 font-bold py-2 px-4 rounded-xl border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4 text-indigo-500" /> Add Assignment
              </button>
            </div>
          )}
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex border-b border-slate-200/80 px-8">
          <button onClick={() => setActiveTab('grades')} className={`px-6 py-3 font-bold text-sm transition-all duration-300 rounded-t-lg flex items-center gap-2.5 border-b-2 ${activeTab === 'grades' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            <GraduationCap className="w-5 h-5" /> Grades
          </button>
          <button onClick={() => setActiveTab('attendance')} className={`px-6 py-3 font-bold text-sm transition-all duration-300 rounded-t-lg flex items-center gap-2.5 border-b-2 ${activeTab === 'attendance' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            <Calendar className="w-5 h-5" /> Attendance
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`px-6 py-3 font-bold text-sm transition-all duration-300 rounded-t-lg flex items-center gap-2.5 border-b-2 ${activeTab === 'analytics' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            <TrendingUp className="w-5 h-5" /> Analytics
          </button>
        </div>

        {/* MAIN CONTENT CARD */}
        <div className="w-full h-[calc(100vh-220px)] bg-slate-50/80 backdrop-blur-xl border border-slate-200/50 rounded-b-2xl rounded-tr-2xl shadow-2xl shadow-slate-200/60 overflow-hidden flex flex-col">

          {/* GRADES TAB - UNIT CARD MENU + FULL SPREADSHEET PREVIEW */}
          {activeTab === 'grades' && (
            <div className="w-full h-full flex flex-col">
              <div className="w-full px-8 pt-6">
                <UnitCardMenu selectedUnit={selectedUnit} onSelect={setSelectedUnit} />
              </div>
              <div className="w-full flex-1 flex items-center justify-center">
                <GradeCardPreview
                  formData={{
                    quarterName: 'Q3',
                    schoolYear: '2025-2026',
                    unitName: selectedUnit,
                    reportDate: new Date().toISOString().split('T')[0],
                  }}
                  onClose={() => {}}
                />
              </div>
            </div>
          )}

          {/* ATTENDANCE TAB */}
          {activeTab === 'attendance' && (
            <div className="flex flex-col h-full">
              <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex items-center gap-4">
                <label className="text-sm font-bold text-slate-600">Date:</label>
                <input type="date" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} className="p-2.5 rounded-xl border-slate-300/70 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/20 outline-none" />
              </div>
              <div className="overflow-auto flex-1 p-6">
                <div className="max-w-4xl mx-auto">
                  {students.filter(s => s.unitName === selectedUnit).length === 0 ? (
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
                      {students.filter(s => s.unitName === selectedUnit).map(student => {
                        const status = attendance[currentDate]?.[student.id] || 'Present';
                        return (
                          <tr key={student.id} className="hover:bg-slate-100/50 transition-colors duration-200">
                            <td className="p-4 font-bold text-slate-800 rounded-l-2xl">{student.name}</td>
                            <td className="p-3">
                              <div className="flex justify-center bg-slate-100/80 rounded-xl p-1 gap-1">
                                {['Present', 'Absent', 'Tardy'].map(s => (
                                  <button key={s} onClick={() => handleAttendanceUpdate(currentDate, student.id, s)} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition-all duration-200 ${status === s ? 'bg-white border-slate-200/90 text-indigo-600 shadow-sm' : 'bg-transparent border-transparent text-slate-500 hover:bg-white/50 hover:text-slate-700'}`}>
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
              students={students.filter(s => s.unitName === selectedUnit)}
              finalGrades={finalGrades}
              assignments={assignments}
              categories={categories}
              grades={grades}
              attendance={attendance}
            />
          )}
        </div>

        {selectedStudentForPanel && (
          <StudentSummaryPanel
            student={selectedStudentForPanel}
            grades={grades}
            assignments={assignments}
            categories={categories}
            attendance={attendance}
            finalGrade={finalGrades[selectedStudentForPanel.id]}
            previousPercentage={previousGrades[selectedStudentForPanel.id] ?? null}
            onClose={() => setSelectedStudentForPanel(null)}
            onGenerateGradeCard={handleGenerateGradeCard}
            onGradeChange={handleGradeChange}
          />
        )}
      </>
      )}

      {/* EXTRACTED MODALS */}
      <NewAssignmentModal
        isOpen={activeModal === 'assignment'}
        onClose={() => setActiveModal(null)}
        categories={categories}
        onSave={handleAddAssignment}
      />

      <WeightSettingsModal
        isOpen={activeModal === 'weights'}
        onClose={() => setActiveModal(null)}
        categories={categories}
        onSave={handleUpdateCategories}
      />

      <BulkFillModal
        isOpen={activeModal === 'bulkFill'}
        onClose={() => setActiveModal(null)}
        assignmentName={assignments.find(a => a.id === bulkFillAssignmentId)?.name || ''}
        studentCount={students.length}
        onApply={(value) => handleBulkFill(bulkFillAssignmentId, value)}
      />

    </div>
  );
};

export default ClassGradebook;
