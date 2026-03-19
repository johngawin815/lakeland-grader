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

import GradebookTable from './GradebookTable';
import NewAssignmentModal from './modals/NewAssignmentModal';
import WeightSettingsModal from './modals/WeightSettingsModal';
import { useGradebook } from '../../hooks/useGradebook';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useUndoStack } from '../../hooks/useUndoStack';


const ClassGradebook = ({ course, user, onExit, onNavigateToGradeCards, backLabel = "Back to Dashboard" }) => {
  const { setGradeCardPayload, commentTone } = useGrading();

  // --- CENTRAL STATE via custom hook ---
  const {
    students, assignments, categories, grades, attendance,
    finalGrades, loading, dirty, previousGrades,
    getCategoryPercentage, getTotalAbsences,
    handleGradeChange: rawGradeChange,
    handleAddAssignment, handleBulkFill,
    handleAttendanceUpdate, handleUpdateCategories,
    markClean,
  } = useGradebook(course?.id, user?.units);

  // --- LOCAL UI STATE ---
  const [activeTab, setActiveTab] = useState('grades');
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStudentForPanel, setSelectedStudentForPanel] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'assignment' | 'weights' | 'export' | null
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

    // Save per-student enrollment grades PER SUBJECT
    const savePromises = students.flatMap(student => {
      return categories.map(cat => {
        const percentage = getCategoryPercentage(student.id, cat);
        if (percentage === null || percentage === undefined) return Promise.resolve(null);

        return databaseService.saveCourseGrade({
          id: `${student.id}-${course.id}-${cat.id}`,
          studentId: student.id,
          courseId: `${course.id}-${cat.id}`,
          courseName: course.courseName || 'My Gradebook',
          subjectArea: cat.name,
          teacherName: course.teacherName || user?.name || '',
          percentage: parseFloat(percentage.toFixed(2)),
          letterGrade: calculateLetterGrade(percentage),
          term: course.term || getCurrentSchoolYear(),
          status: 'Active',
        });
      });
    });

    const results = await Promise.allSettled(savePromises);
    
    // Surface failures if any occurred without breaking the loop
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.error(`Failed to save ${failures.length} student grade records:`, failures);
      // Future enhancement: Dispatch global toast notification here about partial failure
    }

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 p-0 font-sans text-slate-800">
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
        <div className="w-full mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-8 pt-8">
          <div className="flex flex-col gap-1">
            {onExit && (
              <button 
                onClick={onExit} 
                className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400 hover:text-indigo-600 transition-all duration-300 group"
              >
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" /> 
                {backLabel}
              </button>
            )}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white shadow-lg shadow-indigo-100/50 rounded-2xl text-indigo-600 border border-indigo-50">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                  {course.courseName || 'Class Gradebook'}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-slate-500 font-medium">{course.teacherName || user.name}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-slate-500 font-bold">{students.length} Students Enrolled</span>
                  {course.subjectArea && (
                    <span className="ml-1 text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white px-2.5 py-1 rounded-full shadow-sm shadow-indigo-200">
                      {course.subjectArea}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CONTROLS */}
          {activeTab === 'grades' && (
            <div className="flex gap-3 items-center bg-white p-2 rounded-2xl border border-slate-200/60 shadow-sm self-end md:self-auto">
              <div className="flex items-center gap-3 px-3 border-r border-slate-100">
                {statusDisplay && (
                  <div className={`flex items-center gap-2 text-xs font-bold ${statusDisplay.cls}`} aria-live="polite">
                    {statusDisplay.icon}
                    <span>{statusDisplay.text}</span>
                  </div>
                )}
                {saveStatus === 'error' && (
                  <button onClick={forceSave} className="text-[10px] font-black text-rose-600 hover:text-rose-800 underline uppercase tracking-tighter">Retry Save</button>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={forceSave}
                  className="bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/20 transition-all flex items-center gap-2 text-sm shadow-lg shadow-slate-900/20"
                  title="Force Save Now"
                >
                  <CloudUpload className="w-4 h-4 text-indigo-400" /> Save
                </button>
                
                {/* Undo / Redo Group */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button onClick={handleUndo} disabled={!undoStack.canUndo} className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all" title="Undo (Ctrl+Z)">
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button onClick={handleRedo} disabled={!undoStack.canRedo} className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all" title="Redo (Ctrl+Shift+Z)">
                    <Redo2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-px h-8 bg-slate-100 mx-1 self-center" />

                <button
                  onClick={() => setActiveModal('weights')}
                  className="bg-white text-slate-700 font-bold py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:outline-none transition-all flex items-center gap-2 text-sm"
                >
                  <Percent className="w-4 h-4 text-indigo-500" /> Weights
                </button>
                <button
                  onClick={() => setActiveModal('assignment')}
                  className="bg-indigo-50 text-indigo-700 font-bold py-2.5 px-4 rounded-xl border border-indigo-100 hover:bg-indigo-100/80 transition-all flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Assignment
                </button>
              </div>
            </div>
          )}
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex gap-1 px-8 mb-[-1px] z-10">
          {[
            { id: 'grades', icon: GraduationCap, label: 'Gradebook' },
            { id: 'attendance', icon: Calendar, label: 'Attendance' },
            { id: 'analytics', icon: TrendingUp, label: 'Class Insights' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)} 
              className={`px-6 py-3.5 font-bold text-sm transition-all duration-300 rounded-t-2xl flex items-center gap-2.5 border-t border-x ${
                activeTab === tab.id 
                  ? 'bg-white border-slate-200 text-indigo-600 shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)]' 
                  : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
              }`}
            >
              <tab.icon className={`w-4.5 h-4.5 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} /> 
              {tab.label}
            </button>
          ))}
        </div>

        {/* MAIN CONTENT CARD */}
        <div className="mx-8 mb-8 flex-1 bg-white border border-slate-200 rounded-b-2xl rounded-tr-2xl shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col min-h-0 relative">

          {/* GRADES TAB - UNIT CARD MENU + GRADEBOOK TABLE */}
          {activeTab === 'grades' && (
            <div className="w-full h-full flex flex-col">
              <div className="w-full px-8 pt-6">
                <UnitCardMenu selectedUnit={selectedUnit} onSelect={setSelectedUnit} />
              </div>
              <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden border-t border-slate-200">
                <GradebookTable
                  students={students.filter(s => s.unitName === selectedUnit)}
                  assignments={assignments}
                  categories={categories}
                  grades={grades}
                  finalGrades={finalGrades}
                  onGradeChange={handleGradeChange}
                  onStudentClick={setSelectedStudentForPanel}
                  onExportClick={() => {}}
                  onGradeCardClick={handleGenerateGradeCard}
                  onBulkFill={handleBulkFill}
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
              onGenerateGradeCard={handleGenerateGradeCard}
              onStudentClick={setSelectedStudentForPanel}
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

    </div>
  );
};

export default ClassGradebook;
