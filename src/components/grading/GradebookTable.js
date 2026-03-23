import React, { useRef, useState, useCallback, useMemo } from 'react';
import { GraduationCap, FileDown, TrendingUp, ArrowDown, Edit2, StickyNote, MessageSquare } from 'lucide-react';
import { useGridKeyboard } from '../../hooks/useGridKeyboard';
import { UNIT_CONFIG } from '../../config/unitConfig';
import GradeNoteModal from './modals/GradeNoteModal';

const GradeCell = React.memo(({ 
  studentId, studentName, assignmentId, assignmentName, maxScore, 
  grade, note, isWarning, isFailing, rowIndex, colIndex, isFocused, 
  onChange, onFocus, onNoteClick 
}) => {
  return (
    <td className={`p-1.5 text-center border-r border-slate-200/60 transition-colors duration-200 relative group/cell ${isFocused ? 'bg-indigo-50/50' : ''}`} role="gridcell">
      <div className="relative inline-block">
        <input
          type="number"
          min="0"
          max={maxScore}
          value={grade ?? ''}
          onChange={(e) => onChange(studentId, assignmentId, maxScore, e.target.value)}
          onFocus={(e) => {
            if (onFocus) onFocus(rowIndex, colIndex);
            e.target.select(); 
          }}
          data-row={rowIndex}
          data-col={colIndex}
          aria-label={`${studentName} - ${assignmentName}`}
          className={`w-20 p-1.5 text-center border rounded-xl outline-none transition-all duration-300 font-mono text-sm ${
            isWarning
              ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300/50'
              : isFailing
              ? 'border-rose-300 bg-rose-50 text-rose-600 font-black focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
          }`}
          placeholder="—"
        />
        
        {/* Note Indicator Overlay */}
        <button
          onClick={() => onNoteClick(studentId, studentName, assignmentId, assignmentName, note)}
          className={`absolute -top-1 -right-1 p-0.5 rounded-full shadow-sm transition-all duration-300 z-10 ${
            note 
              ? 'bg-amber-400 text-white scale-100 opacity-100' 
              : 'bg-slate-100 text-slate-400 scale-75 opacity-0 group-hover/cell:opacity-100 hover:bg-indigo-100 hover:text-indigo-600'
          }`}
          title={note || "Add Note"}
        >
          {note ? <StickyNote size={10} fill="currentColor" /> : <MessageSquare size={10} />}
        </button>
      </div>
    </td>
  );
});

const GradebookTable = ({
  students, assignments, categories, grades, gradeNotes, finalGrades,
  onGradeChange, onGradeNoteChange, onStudentClick, onExportClick, onGradeCardClick, onBulkFill, onEditAssignment
}) => {
  const tableRef = useRef(null);
  const [warnCells, setWarnCells] = useState(new Set());
  const [focusedRow, setFocusedRow] = useState(null);
  const [focusedCol, setFocusedCol] = useState(null);
  const [activeNoteModal, setActiveNoteModal] = useState(null); // { studentId, studentName, assignmentId, assignmentName, note }
  const rows = students.length;
  const cols = assignments.length;

  const handleValidatedChange = useCallback((studentId, assignmentId, maxScore, rawValue) => {
    // Allow clearing
    if (rawValue === '' || rawValue === '-') {
      onGradeChange(studentId, assignmentId, rawValue);
      return;
    }
    const num = parseFloat(rawValue);
    if (isNaN(num)) return;

    const clamped = Math.min(Math.max(0, num), parseFloat(maxScore));
    if (clamped !== num) {
      // Flash warning on the clamped cell
      const key = `${studentId}-${assignmentId}`;
      setWarnCells(prev => new Set(prev).add(key));
      setTimeout(() => {
        setWarnCells(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, 600);
    }
    onGradeChange(studentId, assignmentId, String(clamped));
  }, [onGradeChange]);

  const handleBulkFillPrompt = useCallback((assignmentId, name, maxScore) => {
    const val = window.prompt(`Enter grade for ALL students on "${name}" (0 - ${maxScore}):`);
    if (val === null) return; // User cancelled
    
    const num = parseFloat(val);
    if (isNaN(num)) {
      alert("Please enter a valid number.");
      return;
    }
    
    const clamped = Math.min(Math.max(0, num), parseFloat(maxScore));
    onBulkFill(assignmentId, String(clamped));
  }, [onBulkFill]);

  // Group students by unit for section headers
  const unitGroups = useMemo(() => {
    const groups = [];
    let currentUnit = null;
    students.forEach((student, idx) => {
      if (student.unitName !== currentUnit) {
        currentUnit = student.unitName;
        groups.push({ type: 'header', unitName: currentUnit });
      }
      groups.push({ type: 'student', student, originalIndex: idx });
    });
    return groups;
  }, [students]);

  // Filter unit groups based on whether we need unit headers
  const displayGroups = useMemo(() => {
    const hasMultipleUnits = unitGroups.filter(g => g.type === 'header').length > 1;
    if (hasMultipleUnits) return unitGroups;
    return unitGroups.filter(g => g.type === 'student');
  }, [unitGroups]);

  const { handleKeyDown, onCellFocus: rawOnCellFocus } = useGridKeyboard({
    rows,
    cols,
    tableRef,
    unitGroups: displayGroups,
  });

  const onCellFocus = useCallback((r, c) => {
    setFocusedRow(r);
    setFocusedCol(c);
    rawOnCellFocus(r, c);
  }, [rawOnCellFocus]);

  const totalColumns = assignments.length + 2; // student col + assignments + overall col

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        <h3 className="text-lg font-bold text-slate-600 mb-1">No Students Enrolled</h3>
        <p className="text-sm text-slate-400 max-w-md">
          Go back to the Dashboard and use the <strong>Manage Students</strong> button on this course to enroll students first.
        </p>
      </div>
    );
  }

  const virtualItems = displayGroups.map((g, index) => ({ index }));
  const paddingTop = 0;
  const paddingBottom = 0;

  return (
    <div 
      className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent" 
      ref={tableRef} 
      onKeyDown={handleKeyDown} 
      role="grid"
    >
      <table className="w-full border-separate border-spacing-0 min-w-[1000px]">
        <thead className="sticky top-0 z-30 shadow-md">
          <tr className="bg-slate-100 backdrop-blur-md">
            <th className="p-3 text-left border-b border-r border-slate-200 sticky left-0 z-40 bg-slate-100 w-64 min-w-[16rem] transition-colors duration-200">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Student Name</span>
            </th>
            {assignments.map((assignment, idx) => (
              <th 
                key={assignment.id} 
                className={`p-3 text-center border-b border-slate-200 min-w-[9rem] transition-all duration-300 ${focusedCol === idx ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
              >
                <div className="flex flex-col items-center gap-2 group/header relative">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold truncate max-w-[140px] px-1" title={assignment.name}>{assignment.name}</span>
                    <button 
                      onClick={() => onEditAssignment(assignment)}
                      className="p-1 rounded-md text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover/header:opacity-100 transition-all"
                      title="Edit Assignment"
                    >
                      <Edit2 size={10} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600 font-black uppercase tracking-tighter">
                      {categories.find(c => c.id === assignment.categoryId)?.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">/ {Number(assignment.maxScore)}</span>
                  </div>
                  <button 
                    onClick={() => handleBulkFillPrompt(assignment.id, assignment.name, assignment.maxScore)} 
                    className="mt-1 text-[10px] text-indigo-600 hover:text-indigo-800 font-black flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-all border border-indigo-100/50 uppercase tracking-tighter"
                  >
                    <ArrowDown className="w-3 h-3" /> Fill All
                  </button>
                </div>
              </th>
            ))}
            <th className="p-3 text-center border-b border-l border-slate-200 sticky right-0 z-40 bg-slate-100 w-28 shadow-[-8px_0_15px_-5px_rgba(0,0,0,0.05)]">
              <div className="flex flex-col items-center justify-center gap-1 text-indigo-600">
                <TrendingUp className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Overall</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="text-sm text-slate-800">
          {paddingTop > 0 && (
            <tr><td style={{ height: `${paddingTop}px`, padding: 0, border: 0 }} colSpan={totalColumns} aria-hidden="true" /></tr>
          )}
          {virtualItems.map((virtualRow) => {
            const item = displayGroups[virtualRow.index];
            if (!item) return null;
            
            if (item.type === 'header') {
              const unitStyle = UNIT_CONFIG.find(u => u.key === item.unitName);
              return (
                <tr key={`unit-header-${item.unitName}`} className="bg-slate-50/80" data-index={virtualRow.index}>
                  <td colSpan={totalColumns} className="px-4 py-2 border-b border-slate-200/60">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${unitStyle?.tagBg || 'bg-slate-100 text-slate-600'} px-2.5 py-1 rounded-md`}>
                      {unitStyle?.icon && <unitStyle.icon className="w-3.5 h-3.5" />}
                      {item.unitName}
                    </span>
                  </td>
                </tr>
              );
            }

            const { student, originalIndex: rowIndex } = item;
            const finalGrade = finalGrades[student.id];
            const isPassing = finalGrade === null || finalGrade >= 60;
            const isRowFocused = focusedRow === rowIndex;
            
            return (
              <tr 
                key={student.id} 
                className={`transition-all duration-200 group even:bg-slate-50/50 ${isRowFocused ? 'bg-indigo-50/30' : 'hover:bg-slate-50/80'}`} 
                data-index={virtualRow.index}
              >
                <td className={`p-3 font-bold border-r border-slate-100 sticky left-0 z-20 transition-all duration-200 shadow-[4px_0_10px_-5px_rgba(0,0,0,0.05)] ${isRowFocused ? 'bg-indigo-50 shadow-indigo-100/50' : 'bg-white group-even:bg-slate-50/50 group-hover:bg-slate-50'}`}>
                  <div className="flex justify-between items-center">
                    <button onClick={() => onStudentClick(student)} className="text-left group/name flex flex-col">
                      <span className={`text-sm tracking-tight transition-colors ${isRowFocused ? 'text-indigo-700' : 'text-slate-900 group-hover/name:text-indigo-600'}`}>{student.name}</span>
                      {student.gradeLevel && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Grade {student.gradeLevel}</span>}
                    </button>
                    <div className="flex gap-1">
                      <button onClick={() => onGradeCardClick(student)} className="text-slate-300 opacity-0 group-hover:opacity-100 hover:text-emerald-600 hover:scale-110 transition-all p-1.5 bg-white shadow-sm rounded-lg border border-slate-100" title="Generate Grade Card"><GraduationCap className="w-4 h-4" /></button>
                      <button onClick={() => onExportClick(student)} className="text-slate-300 opacity-0 group-hover:opacity-100 hover:text-indigo-600 hover:scale-110 transition-all p-1.5 bg-white shadow-sm rounded-lg border border-slate-100" title="Export Report Card"><FileDown className="w-4 h-4" /></button>
                    </div>
                  </div>
                </td>
                {assignments.map((assignment, colIndex) => {
                  const grade = grades[student.id]?.[assignment.id];
                  const note = gradeNotes[student.id]?.[assignment.id];
                  const isFailing = grade !== undefined && grade !== '' && parseFloat(grade) < 60;
                  const cellKey = `${student.id}-${assignment.id}`;
                  const isWarning = warnCells.has(cellKey);
                  return (
                    <GradeCell
                      key={assignment.id}
                      studentId={student.id}
                      studentName={student.name}
                      assignmentId={assignment.id}
                      assignmentName={assignment.name}
                      maxScore={Number(assignment.maxScore)}
                      grade={grade}
                      note={note}
                      isWarning={isWarning}
                      isFailing={isFailing}
                      rowIndex={rowIndex}
                      colIndex={colIndex}
                      isFocused={isRowFocused && focusedCol === colIndex}
                      onChange={handleValidatedChange}
                      onFocus={onCellFocus}
                      onNoteClick={(sid, sname, aid, aname, n) => setActiveNoteModal({ studentId: sid, studentName: sname, assignmentId: aid, assignmentName: aname, note: n })}
                    />
                  );
                })}
                <td className={`p-3 text-center font-black border-l border-slate-100 sticky right-0 z-20 shadow-[-8px_0_15px_-5px_rgba(0,0,0,0.05)] transition-all duration-200 ${isRowFocused ? 'bg-indigo-50' : 'bg-white group-even:bg-slate-50/50 group-hover:bg-slate-50'}`}>
                  {finalGrade !== null ? (
                    <div className={`inline-flex flex-col items-center justify-center min-w-[3.5rem] py-1 rounded-xl shadow-sm border ${
                      isPassing ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      <span className="text-xs">{finalGrade.toFixed(1)}%</span>
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-60">
                        {isPassing ? 'Passing' : 'Failing'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-200 text-[9px] font-black uppercase tracking-widest italic">No Data</span>
                  )}
                </td>
              </tr>
            );
          })}
          {paddingBottom > 0 && (
            <tr><td style={{ height: `${paddingBottom}px`, padding: 0, border: 0 }} colSpan={totalColumns} aria-hidden="true" /></tr>
          )}
        </tbody>
      </table>

      <GradeNoteModal
        isOpen={!!activeNoteModal}
        onClose={() => setActiveNoteModal(null)}
        studentName={activeNoteModal?.studentName}
        assignmentName={activeNoteModal?.assignmentName}
        initialNote={activeNoteModal?.note}
        onSave={(newNote) => onGradeNoteChange(activeNoteModal.studentId, activeNoteModal.assignmentId, newNote)}
      />
    </div>
  );
};

export default GradebookTable;
