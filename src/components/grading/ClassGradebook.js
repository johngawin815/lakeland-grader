import React, { useState, useMemo } from 'react';
import { Plus, Save, X, TrendingUp, BookOpen, GraduationCap, FileDown, Calendar, Check, XCircle, Clock, CloudUpload, Loader2, ArrowLeft } from 'lucide-react';
import { cosmosService } from '../../services/cosmosService';
import ReportCardExportModal from './ReportCardExportModal';

// --- DATA SETUP ---
// Standardized data without presentational properties (like color).
const INITIAL_STUDENTS = [
  { id: 1, name: "David Everitt" },
  { id: 2, name: "Jane Doe" },
  { id: 3, name: "John Smith" },
  { id: 4, name: "Emily Johnson" },
  { id: 5, name: "Michael Brown" },
];

const INITIAL_CATEGORIES = [
  { id: 'hw', name: 'Homework', weight: 20 },
  { id: 'quiz', name: 'Quizzes', weight: 30 },
  { id: 'test', name: 'Tests', weight: 50 },
];

const INITIAL_ASSIGNMENTS = [
  { id: 'a1', name: 'Chapter 1 Quiz', categoryId: 'quiz', maxScore: 50 },
  { id: 'a2', name: 'Homework 1.1', categoryId: 'hw', maxScore: 10 },
  { id: 'a3', name: 'Unit 1 Test', categoryId: 'test', maxScore: 100 },
];

const INITIAL_GRADES = {
  1: { 'a1': 45, 'a2': 10, 'a3': 92 },
  2: { 'a1': 38, 'a2': 8, 'a3': 85 },
  3: { 'a1': 50, 'a2': 10, 'a3': 98 },
};

const INITIAL_ATTENDANCE = {
  '2026-02-20': { 1: 'Present', 2: 'Absent', 3: 'Present', 4: 'Tardy', 5: 'Present' },
};


const ClassGradebook = ({ onExit }) => {
  // --- STATE MANAGEMENT ---
  const [students] = useState(INITIAL_STUDENTS);
  const [categories] = useState(INITIAL_CATEGORIES);
  const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS);
  const [grades, setGrades] = useState(INITIAL_GRADES);
  const [activeTab, setActiveTab] = useState('grades');
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [classId] = useState('dummy-class-101');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ name: '', categoryId: 'hw', maxScore: 100 });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [studentToExport, setStudentToExport] = useState(null);

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

  const handleOpenExport = (student) => {
    setStudentToExport({
      name: student.name,
      finalPercentage: finalGrades[student.id] || 0
    });
    setIsExportModalOpen(true);
  };

  const handleSaveToCloud = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const payload = { id: classId, students, categories, assignments, grades, attendance, lastUpdated: new Date().toISOString() };
      await cosmosService.saveGradebook(payload);
      setSaveMessage('Saved Successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error("Error saving gradebook:", error);
      setSaveMessage('Error saving!');
    } finally {
      setIsSaving(false);
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

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 font-sans text-slate-800">
      
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          {onExit && (
            <button onClick={onExit} className="mb-2 flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-teal-600 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Generator
            </button>
          )}
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-teal-600" /> 
            Class Gradebook
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Period 1: Advanced React • {students.length} Students
          </p>
        </div>

        {/* CONTROLS SECTION */}
        {activeTab === 'grades' && (
          <div className="flex gap-3 items-center">
            {saveMessage && <span className="text-sm font-bold text-teal-600 animate-pulse">{saveMessage}</span>}
            <button 
              onClick={handleSaveToCloud}
              disabled={isSaving}
              className="bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5" />}
              {isSaving ? 'Saving...' : 'Save to Cloud'}
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-slate-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors duration-200 ease-in-out flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add Assignment
            </button>
          </div>
        )}
      </div>

      {/* TAB NAVIGATION */}
      <div className="max-w-7xl mx-auto mb-0 flex gap-1 border-b border-slate-200">
        <button onClick={() => setActiveTab('grades')} className={`px-6 py-3 font-bold text-sm transition-all rounded-t-lg flex items-center gap-2 ${activeTab === 'grades' ? 'bg-white border-x border-t border-slate-200 text-teal-600 -mb-px' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
          <BookOpen className="w-5 h-5" /> Gradebook
        </button>
        <button onClick={() => setActiveTab('attendance')} className={`px-6 py-3 font-bold text-sm transition-all rounded-t-lg flex items-center gap-2 ${activeTab === 'attendance' ? 'bg-white border-x border-t border-slate-200 text-teal-600 -mb-px' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
          <Calendar className="w-5 h-5" /> Attendance
        </button>
      </div>

      {/* MAIN CONTENT CARD */}
      <div className="max-w-7xl mx-auto bg-white border border-slate-200 rounded-b-xl rounded-tr-xl shadow-md overflow-hidden flex flex-col min-h-[70vh]">
        
        {/* GRADEBOOK GRID */}
        {activeTab === 'grades' && (
          <div className="overflow-auto flex-1">
            <table className="w-full border-collapse min-w-[800px]">
              <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-bold tracking-wider sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-4 text-left border-b border-r border-slate-200 sticky left-0 bg-slate-100 w-48 min-w-[12rem]">Student</th>
                  {assignments.map(assignment => (
                    <th key={assignment.id} className="p-3 text-center border-b border-slate-200 min-w-[9rem]">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="truncate max-w-[140px]" title={assignment.name}>{assignment.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                            {categories.find(c => c.id === assignment.categoryId)?.name}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">/ {assignment.maxScore}</span>
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className="p-4 text-center border-b border-l border-slate-200 sticky right-0 bg-slate-100 w-32 shadow-[-2px_0_4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center justify-center gap-2">
                      <TrendingUp className="w-5 h-5 text-teal-500" /> Overall
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-800 divide-y divide-slate-100">
                {students.map((student) => {
                  const finalGrade = finalGrades[student.id];
                  const isPassing = finalGrade === null || finalGrade >= 60;
                  return (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 font-bold border-r border-slate-200 sticky left-0 bg-white group-hover:bg-slate-50">
                        <div className="flex justify-between items-center">
                          <div>{student.name}<div className="text-xs text-slate-400 font-normal">ID: {student.id}</div></div>
                          <button onClick={() => handleOpenExport(student)} className="text-slate-400 hover:text-teal-600 transition-colors p-1" title="Export Report Card"><FileDown className="w-5 h-5" /></button>
                        </div>
                      </td>
                      {assignments.map(assignment => (
                        <td key={assignment.id} className="p-2 text-center border-r border-slate-100">
                          <input type="number" min="0" max={assignment.maxScore} value={grades[student.id]?.[assignment.id] ?? ''} onChange={(e) => handleGradeChange(student.id, assignment.id, e.target.value)} className="w-20 p-2 text-center border border-slate-300 rounded-md focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all font-mono bg-white" placeholder="—" />
                        </td>
                      ))}
                      <td className="p-4 text-center font-bold border-l border-slate-200 sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-2px_0_4px_rgba(0,0,0,0.05)]">
                        {finalGrade !== null ? <span className={`px-3 py-1 rounded-full text-xs font-bold ${isPassing ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-700'}`}>{finalGrade.toFixed(1)}%</span> : <span className="text-slate-400 text-xs italic">N/A</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ATTENDANCE UI */}
        {activeTab === 'attendance' && (
          <div className="flex flex-col h-full">
            <div className="p-4 bg-slate-100/70 border-b border-slate-200 flex items-center gap-4">
              <label className="text-sm font-bold text-slate-600">Date:</label>
              <input type="date" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} className="p-2 rounded-md border-slate-300 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>

            <div className="overflow-auto flex-1 p-6">
              <div className="max-w-4xl mx-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-slate-500 font-bold text-xs">
                    <tr>
                      <th className="p-3">Student</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Total Absences</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200 rounded-xl border border-slate-200 shadow-md">
                    {students.map(student => {
                      const status = attendance[currentDate]?.[student.id] || 'Present';
                      return (
                        <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-slate-800">{student.name}</td>
                          <td className="p-3">
                            <div className="flex justify-center gap-2">
                              {['Present', 'Absent', 'Tardy'].map(s => (
                                <button key={s} onClick={() => handleAttendanceUpdate(student.id, s)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${status === s ? 'bg-teal-600 border-teal-600 text-white shadow' : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-100'}`}>
                                  {s === 'Present' && <Check size={16} />}
                                  {s === 'Absent' && <XCircle size={16} />}
                                  {s === 'Tardy' && <Clock size={16} />}
                                  {s}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-slate-600">{getTotalAbsences(student.id)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADD ASSIGNMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-teal-600" /> New Assignment
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddAssignment} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Name</label>
                <input type="text" required value={newAssignment.name} onChange={(e) => setNewAssignment({...newAssignment, name: e.target.value})} className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none text-base" placeholder="e.g. Chapter 5 Quiz" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Category</label>
                  <select value={newAssignment.categoryId} onChange={(e) => setNewAssignment({...newAssignment, categoryId: e.target.value})} className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none bg-white text-base">
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Max Score</label>
                  <input type="number" required min="1" value={newAssignment.maxScore} onChange={(e) => setNewAssignment({...newAssignment, maxScore: e.target.value})} className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none text-base" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full bg-slate-100 text-slate-700 font-bold py-3 px-6 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors duration-200 ease-in-out disabled:opacity-50">Cancel</button>
                <button type="submit" className="w-full bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" /> Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPORT MODAL */}
      <ReportCardExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} student={studentToExport} currentSubject="Elective 1" />
    </div>
  );
};

export default ClassGradebook;