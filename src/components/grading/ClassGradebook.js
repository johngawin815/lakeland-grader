import React, { useState, useMemo } from 'react';
import { Plus, Save, X, Calculator, TrendingUp, BookOpen, GraduationCap } from 'lucide-react';

// --- STEP 1: DUMMY DATA SETUP ---
// We define our initial data outside the component to simulate a database load.

const INITIAL_STUDENTS = [
  { id: 1, name: "David Everitt" },
  { id: 2, name: "Jane Doe" },
  { id: 3, name: "John Smith" },
  { id: 4, name: "Emily Johnson" },
  { id: 5, name: "Michael Brown" },
];

const INITIAL_CATEGORIES = [
  { id: 'hw', name: 'Homework', weight: 20, color: 'bg-blue-100 text-blue-800' },
  { id: 'quiz', name: 'Quizzes', weight: 30, color: 'bg-purple-100 text-purple-800' },
  { id: 'test', name: 'Tests', weight: 50, color: 'bg-orange-100 text-orange-800' },
];

const INITIAL_ASSIGNMENTS = [
  { id: 'a1', name: 'Chapter 1 Quiz', categoryId: 'quiz', maxScore: 50 },
  { id: 'a2', name: 'Homework 1.1', categoryId: 'hw', maxScore: 10 },
  { id: 'a3', name: 'Unit 1 Test', categoryId: 'test', maxScore: 100 },
];

// We store grades as a nested object: { studentId: { assignmentId: score } }
// This makes looking up a specific grade very fast (O(1) complexity).
const INITIAL_GRADES = {
  1: { 'a1': 45, 'a2': 10, 'a3': 92 }, // David's grades
  2: { 'a1': 38, 'a2': 8, 'a3': 85 },  // Jane's grades
  3: { 'a1': 50, 'a2': 10, 'a3': 98 }, // John's grades
};

const ClassGradebook = () => {
  // --- STATE MANAGEMENT ---
  const [students] = useState(INITIAL_STUDENTS);
  const [categories] = useState(INITIAL_CATEGORIES);
  const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS);
  const [grades, setGrades] = useState(INITIAL_GRADES);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    name: '',
    categoryId: 'hw',
    maxScore: 100
  });

  // --- STEP 5: THE MATH (WEIGHTED CALCULATION) ---
  // We use useMemo here so we don't re-calculate every single grade 
  // whenever a tiny UI update happens (performance optimization).
  const finalGrades = useMemo(() => {
    const results = {};

    students.forEach(student => {
      let totalWeightedScore = 0;
      let totalWeightUsed = 0;

      // 1. Iterate through each category (Homework, Quiz, Test)
      categories.forEach(category => {
        // Find all assignments belonging to this category
        const catAssignments = assignments.filter(a => a.categoryId === category.id);
        
        if (catAssignments.length === 0) return; // Skip if no assignments in this category

        let catPointsEarned = 0;
        let catMaxPoints = 0;
        let hasGradedAssignment = false;

        // 2. Sum up the points for this student in this category
        catAssignments.forEach(assignment => {
          const studentGrades = grades[student.id] || {};
          const score = studentGrades[assignment.id];

          // Only count assignments that have actually been graded (not undefined or empty string)
          if (score !== undefined && score !== '') {
            catPointsEarned += parseFloat(score);
            catMaxPoints += parseFloat(assignment.maxScore);
            hasGradedAssignment = true;
          }
        });

        // 3. Calculate the percentage for this category
        if (hasGradedAssignment && catMaxPoints > 0) {
          const catPercentage = catPointsEarned / catMaxPoints;
          
          // 4. Apply the weight (e.g., 0.90 * 30 for Quizzes)
          totalWeightedScore += catPercentage * category.weight;
          totalWeightUsed += category.weight;
        }
      });

      // 5. Final Calculation: Normalize based on weights used
      // This handles cases where a category might not have any grades yet.
      if (totalWeightUsed > 0) {
        results[student.id] = (totalWeightedScore / totalWeightUsed) * 100;
      } else {
        results[student.id] = null; // No grades yet
      }
    });

    return results;
  }, [students, categories, assignments, grades]);

  // --- HANDLERS ---

  // Updates the grades state when a teacher types in a cell
  const handleGradeChange = (studentId, assignmentId, value) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [assignmentId]: value
      }
    }));
  };

  // Adds a new assignment to the list and closes the modal
  const handleAddAssignment = (e) => {
    e.preventDefault();
    const newId = `a${Date.now()}`; // Simple unique ID generation
    setAssignments([...assignments, { ...newAssignment, id: newId }]);
    setIsModalOpen(false);
    setNewAssignment({ name: '', categoryId: 'hw', maxScore: 100 }); // Reset form
  };

  // Helper to get color badge for category
  const getCategoryBadge = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.color : 'bg-gray-100 text-gray-800';
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
      
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-blue-600" /> 
            Class Gradebook
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Period 1: Advanced React Development • {students.length} Students
          </p>
        </div>

        {/* STEP 2: CONTROLS SECTION */}
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-xs font-bold text-slate-500">
            <Calculator className="w-4 h-4" />
            <span>Weighted: {categories.map(c => `${c.name} ${c.weight}%`).join(', ')}</span>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Assignment
          </button>
        </div>
      </div>

      {/* STEP 2: GRADEBOOK GRID */}
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[75vh]">
        
        {/* The table container handles the scrolling */}
        <div className="overflow-auto flex-1 relative">
          <table className="w-full border-collapse min-w-[800px]">
            <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-bold tracking-wider sticky top-0 z-20 shadow-sm">
              <tr>
                {/* Fixed First Column: Student Name */}
                <th className="p-4 text-left border-b border-r border-slate-200 sticky left-0 bg-slate-100 z-30 w-48 min-w-[12rem]">
                  Student Name
                </th>

                {/* Dynamic Middle Columns: Assignments */}
                {assignments.map(assignment => (
                  <th key={assignment.id} className="p-3 text-center border-b border-slate-200 min-w-[8rem]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="truncate max-w-[120px]" title={assignment.name}>{assignment.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getCategoryBadge(assignment.categoryId)}`}>
                        {categories.find(c => c.id === assignment.categoryId)?.name.substring(0, 3)}
                      </span>
                      <span className="text-[9px] text-slate-400 font-normal">Max: {assignment.maxScore}</span>
                    </div>
                  </th>
                ))}

                {/* Fixed Last Column: Final Grade */}
                <th className="p-4 text-center border-b border-l border-slate-200 sticky right-0 bg-slate-100 z-30 w-32 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Overall
                  </div>
                </th>
              </tr>
            </thead>
            
            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
              {students.map((student, idx) => {
                const finalGrade = finalGrades[student.id];
                const isPassing = finalGrade >= 60;

                return (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                    
                    {/* Fixed First Column: Student Name */}
                    <td className="p-4 font-bold text-slate-800 border-r border-slate-200 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                      {student.name}
                      <div className="text-[10px] text-slate-400 font-normal">ID: {student.id}</div>
                    </td>

                    {/* STEP 4: GRADE ENTRY CELLS */}
                    {assignments.map(assignment => {
                      const score = grades[student.id]?.[assignment.id] ?? '';
                      return (
                        <td key={assignment.id} className="p-2 text-center border-r border-slate-100">
                          <input
                            type="number"
                            min="0"
                            max={assignment.maxScore}
                            value={score}
                            onChange={(e) => handleGradeChange(student.id, assignment.id, e.target.value)}
                            className="w-16 p-1.5 text-center border border-slate-200 rounded focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-mono text-slate-700 bg-slate-50 focus:bg-white"
                            placeholder="-"
                          />
                        </td>
                      );
                    })}

                    {/* Fixed Last Column: Final Grade Display */}
                    <td className="p-4 text-center font-bold border-l border-slate-200 sticky right-0 bg-white group-hover:bg-slate-50 z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                      {finalGrade !== null ? (
                        <span className={`px-3 py-1 rounded-full text-xs ${isPassing ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {finalGrade.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs italic">N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* STEP 3: ADD ASSIGNMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            
            <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" /> New Assignment
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAssignment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assignment Name</label>
                <input 
                  type="text" 
                  required
                  value={newAssignment.name}
                  onChange={(e) => setNewAssignment({...newAssignment, name: e.target.value})}
                  className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Chapter 5 Quiz"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                  <select 
                    value={newAssignment.categoryId}
                    onChange={(e) => setNewAssignment({...newAssignment, categoryId: e.target.value})}
                    className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name} ({cat.weight}%)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Max Score</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={newAssignment.maxScore}
                    onChange={(e) => setNewAssignment({...newAssignment, maxScore: e.target.value})}
                    className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <Save className="w-4 h-4" /> Save Assignment
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default ClassGradebook;