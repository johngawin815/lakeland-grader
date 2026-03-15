import React, { useRef, useState, useCallback, useMemo } from 'react';
import { GraduationCap, FileDown, TrendingUp, ArrowDown } from 'lucide-react';
import { useGridKeyboard } from '../../hooks/useGridKeyboard';
import { UNIT_CONFIG } from '../../config/unitConfig';

const GradeCell = React.memo(({ 
  studentId, studentName, assignmentId, assignmentName, maxScore, 
  grade, isWarning, isFailing, rowIndex, colIndex, onChange, onFocus 
}) => {
  return (
    <td className="p-2 text-center border-r border-slate-200/50" role="gridcell">
      <input
        type="number"
        min="0"
        max={maxScore}
        value={grade ?? ''}
        onChange={(e) => onChange(studentId, assignmentId, maxScore, e.target.value)}
        onFocus={(e) => {
          if (onFocus) onFocus(rowIndex, colIndex);
          e.target.select(); // UX: Mimic Excel highlight-on-focus behavior
        }}
        data-row={rowIndex}
        data-col={colIndex}
        aria-label={`${studentName} - ${assignmentName}`}
        className={`w-24 p-2 text-center border rounded-lg outline-none transition-all duration-300 font-mono ${
          isWarning
            ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300/50'
            : isFailing
            ? 'border-rose-300 bg-rose-50 text-rose-600 font-bold focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20'
            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
        }`}
        placeholder="—"
      />
    </td>
  );
});

const GradebookTable = ({
  students,
  assignments,
  categories,
  grades,
  finalGrades,
  onGradeChange,
  onStudentClick,
  onExportClick,
  onGradeCardClick,
  onBulkFill,
}) => {
  const tableRef = useRef(null);
  const [warnCells, setWarnCells] = useState(new Set());
  const rows = students.length;
  const cols = assignments.length;

  const { handleKeyDown, onCellFocus } = useGridKeyboard({ rows, cols, tableRef });

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

  return (
    <div className="overflow-auto flex-1" ref={tableRef} onKeyDown={handleKeyDown} role="grid">
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
                  <button onClick={() => onBulkFill(assignment.id)} className="mt-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded hover:bg-indigo-100 transition-colors">
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
          {unitGroups.map((item, idx) => {
            if (item.type === 'header') {
              const unitStyle = UNIT_CONFIG.find(u => u.key === item.unitName);
              const hasMultipleUnits = unitGroups.filter(g => g.type === 'header').length > 1;
              if (!hasMultipleUnits) return null;
              return (
                <tr key={`unit-header-${item.unitName}`} className="bg-slate-50/80">
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
            return (
              <tr key={student.id} className="hover:bg-slate-100/50 transition-colors duration-200 group">
                <td className="p-4 font-bold border-r border-slate-200/80 sticky left-0 bg-white/50 group-hover:bg-slate-100/50 backdrop-blur-sm">
                  <div className="flex justify-between items-center">
                    <button onClick={() => onStudentClick(student)} className="text-left hover:text-indigo-600 transition-colors">
                      {student.name}
                      {student.gradeLevel && <div className="text-xs text-slate-400 font-normal">Grade {student.gradeLevel}</div>}
                    </button>
                    <div className="flex gap-1">
                      <button onClick={() => onGradeCardClick(student)} className="text-slate-400 opacity-0 group-hover:opacity-100 hover:text-emerald-600 transition-all p-1" title="Generate Grade Card"><GraduationCap className="w-5 h-5" /></button>
                      <button onClick={() => onExportClick(student)} className="text-slate-400 opacity-0 group-hover:opacity-100 hover:text-indigo-600 transition-all p-1" title="Export Report Card"><FileDown className="w-5 h-5" /></button>
                    </div>
                  </div>
                </td>
                {assignments.map((assignment, colIndex) => {
                  const grade = grades[student.id]?.[assignment.id];
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
                      maxScore={assignment.maxScore}
                      grade={grade}
                      isWarning={isWarning}
                      isFailing={isFailing}
                      rowIndex={rowIndex}
                      colIndex={colIndex}
                      onChange={handleValidatedChange}
                      onFocus={onCellFocus}
                    />
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
    </div>
  );
};

export default GradebookTable;
