import React, { useEffect, useState, useCallback } from 'react';
import { X, Loader2, Layers } from 'lucide-react';
import { databaseService } from '../../services/databaseService';

const UNIT_ORDER = ['Determination', 'Discovery', 'Freedom', 'Harmony', 'Integrity', 'Serenity'];

const UNIT_COLORS = {
  Determination: { bg: 'bg-amber-600', text: 'text-amber-900', light: 'bg-amber-50' },
  Discovery: { bg: 'bg-sky-600', text: 'text-sky-900', light: 'bg-sky-50' },
  Freedom: { bg: 'bg-emerald-600', text: 'text-emerald-900', light: 'bg-emerald-50' },
  Harmony: { bg: 'bg-violet-600', text: 'text-violet-900', light: 'bg-violet-50' },
  Integrity: { bg: 'bg-rose-600', text: 'text-rose-900', light: 'bg-rose-50' },
  Serenity: { bg: 'bg-cyan-600', text: 'text-cyan-900', light: 'bg-cyan-50' },
};

const SUBJECT_FIELD_MAP = {
  'English': { classKey: 'engClass', gradeKey: 'engGrade', pctKey: 'engPct' },
  'Math': { classKey: 'mathClass', gradeKey: 'mathGrade', pctKey: 'mathPct' },
  'Science': { classKey: 'sciClass', gradeKey: 'sciGrade', pctKey: 'sciPct' },
  'Social Studies': { classKey: 'socClass', gradeKey: 'socGrade', pctKey: 'socPct' },
};

const GradeCardPreview = ({ formData, onClose }) => {
  const [stackedData, setStackedData] = useState(null);
  const [stackedLoading, setStackedLoading] = useState(false);
  const [stackedError, setStackedError] = useState('');

  const getGradeColor = (grade) => {
    if (!grade) return '';
    const g = grade.toUpperCase().charAt(0);
    if (g === 'A') return 'text-emerald-700 bg-emerald-50';
    if (g === 'B') return 'text-blue-700 bg-blue-50';
    if (g === 'C') return 'text-amber-700 bg-amber-50';
    if (g === 'D') return 'text-orange-700 bg-orange-50';
    if (g === 'F') return 'text-rose-700 bg-rose-50';
    if (g === 'P') return 'text-emerald-700 bg-emerald-50';
    return '';
  };

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Load stacked data on mount
  const loadStackedData = useCallback(async () => {
    setStackedLoading(true);
    setStackedError('');
    try {
      const allStudents = await databaseService.getAllStudents();
      const active = allStudents.filter(s => s.active !== false && s.unitName && s.unitName !== 'Discharged');

      const studentRows = await Promise.all(active.map(async (student) => {
        const name = student.studentName || `${student.firstName || ''} ${student.lastName || ''}`.trim();
        const row = {
          name,
          grade: student.gradeLevel ? String(student.gradeLevel) : '',
          unitName: student.unitName || '',
          socCourse: '', socGrade: '', socPct: '',
          sciCourse: '', sciGrade: '', sciPct: '',
          mathCourse: '', mathGrade: '', mathPct: '',
          engCourse: '', engGrade: '', engPct: '',
          pe: '', pePct: '',
          ap: '', apPct: '',
        };

        try {
          const enrollments = await databaseService.getStudentEnrollments(student.id);
          let electiveCount = 0;

          enrollments.forEach(e => {
            const area = e.subjectArea || '';
            const mapping = SUBJECT_FIELD_MAP[area];
            if (mapping) {
              row[mapping.classKey] = e.courseName || '';
              row[mapping.gradeKey] = e.letterGrade || '';
              row[mapping.pctKey] = e.percentage != null ? String(e.percentage) : '';
            } else {
              electiveCount++;
              if (electiveCount === 1) {
                row.pe = e.letterGrade || '';
                row.pePct = e.percentage != null ? String(e.percentage) : '';
              } else if (electiveCount === 2) {
                row.ap = e.letterGrade || '';
                row.apPct = e.percentage != null ? String(e.percentage) : '';
              }
            }
          });
        } catch { /* skip */ }

        return row;
      }));

      const grouped = {};
      studentRows.forEach(row => {
        const unit = row.unitName;
        if (!grouped[unit]) grouped[unit] = [];
        grouped[unit].push(row);
      });

      Object.values(grouped).forEach(rows => rows.sort((a, b) => a.name.localeCompare(b.name)));

      setStackedData(grouped);
    } catch (err) {
      console.error('Error loading stacked data:', err);
      setStackedError('Failed to load student data.');
    } finally {
      setStackedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!stackedData) {
      loadStackedData();
    }
  }, [stackedData, loadStackedData]);

  const COL_COUNT = 18;

  const Cell = ({ children, className = '', header = false }) => (
    <td className={`border border-slate-300 px-2 py-1.5 ${header ? 'font-bold text-[10px] uppercase tracking-wide text-slate-500 bg-slate-100' : 'text-sm text-slate-700'} ${className}`}>
      {children || <span className="text-slate-300">&mdash;</span>}
    </td>
  );

  const GradeCell = ({ value }) => (
    <td className={`border border-slate-300 px-2 py-1.5 text-sm text-center font-bold ${getGradeColor(value)}`}>
      {value || <span className="text-slate-300">&mdash;</span>}
    </td>
  );

  const PctCell = ({ value }) => (
    <td className="border border-slate-300 px-2 py-1.5 text-xs text-center text-slate-500 font-mono">
      {value ? `${value}%` : <span className="text-slate-300">&mdash;</span>}
    </td>
  );

  const HeaderRow = () => (
    <tr className="bg-slate-100">
      <Cell header className="w-4"></Cell>
      <Cell header>Name</Cell>
      <Cell header className="text-center">Gr</Cell>
      <Cell header>Soc Studies</Cell>
      <Cell header className="text-center">Grade</Cell>
      <Cell header className="text-center">%</Cell>
      <Cell header>Science</Cell>
      <Cell header className="text-center">Grade</Cell>
      <Cell header className="text-center">%</Cell>
      <Cell header>Mathematics</Cell>
      <Cell header className="text-center">Grade</Cell>
      <Cell header className="text-center">%</Cell>
      <Cell header>English</Cell>
      <Cell header className="text-center">Grade</Cell>
      <Cell header className="text-center">%</Cell>
      <Cell header className="text-center">PE</Cell>
      <Cell header className="text-center">AP</Cell>
      <Cell header>Name</Cell>
    </tr>
  );

  const DataRow = ({ r, i }) => {
    const hasData = r.name || r.socGrade || r.sciGrade || r.mathGrade || r.engGrade;
    return (
      <tr key={i} className={hasData ? 'bg-white' : 'bg-slate-50/50'}>
        <Cell className="w-4"></Cell>
        <Cell className="font-semibold whitespace-nowrap">{r.name}</Cell>
        <Cell className="text-center font-mono">{r.grade}</Cell>
        <Cell className="whitespace-nowrap">{r.socCourse}</Cell>
        <GradeCell value={r.socGrade} />
        <PctCell value={r.socPct} />
        <Cell className="whitespace-nowrap">{r.sciCourse}</Cell>
        <GradeCell value={r.sciGrade} />
        <PctCell value={r.sciPct} />
        <Cell className="whitespace-nowrap">{r.mathCourse}</Cell>
        <GradeCell value={r.mathGrade} />
        <PctCell value={r.mathPct} />
        <Cell className="whitespace-nowrap">{r.engCourse}</Cell>
        <GradeCell value={r.engGrade} />
        <PctCell value={r.engPct} />
        <GradeCell value={r.pe} />
        <GradeCell value={r.ap} />
        <Cell className="font-semibold whitespace-nowrap">{r.name}</Cell>
      </tr>
    );
  };

  const renderStackedView = () => {
    if (stackedLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm font-medium text-slate-500">Loading all students...</p>
        </div>
      );
    }

    if (stackedError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-sm font-medium text-rose-600">{stackedError}</p>
          <button onClick={loadStackedData} className="text-sm font-bold text-indigo-600 hover:text-indigo-800">
            Try Again
          </button>
        </div>
      );
    }

    if (!stackedData) return null;

    const units = UNIT_ORDER.filter(u => stackedData[u] && stackedData[u].length > 0);

    Object.keys(stackedData).forEach(u => {
      if (!units.includes(u) && stackedData[u].length > 0) units.push(u);
    });

    if (units.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-sm font-medium text-slate-500">No active students found.</p>
        </div>
      );
    }

    const totalStudents = units.reduce((sum, u) => sum + stackedData[u].length, 0);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
          <span>{totalStudents} students across {units.length} units</span>
        </div>

        {units.map(unitName => {
          const rows = stackedData[unitName];
          const colors = UNIT_COLORS[unitName] || { bg: 'bg-slate-600', text: 'text-slate-900', light: 'bg-slate-50' };

          return (
            <div key={unitName} className="bg-white rounded-xl border border-slate-200/80 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th colSpan={COL_COUNT} className={`${colors.bg} text-white text-sm font-bold py-3 px-4 text-left tracking-wide`}>
                        {unitName} &mdash; {formData.quarterName} {formData.schoolYear}
                        <span className="ml-3 text-white/70 font-medium text-xs">({rows.length} student{rows.length !== 1 ? 's' : ''})</span>
                      </th>
                    </tr>
                    <tr>
                      <td colSpan={COL_COUNT} className="border border-slate-300 bg-white h-2"></td>
                    </tr>
                    <HeaderRow />
                  </thead>
                  <tbody>
                    {rows.map((r, i) => <DataRow key={i} r={r} i={i} />)}
                    {[...Array(2)].map((_, i) => (
                      <tr key={`empty-${i}`} className="bg-white">
                        {[...Array(COL_COUNT)].map((_, j) => (
                          <td key={j} className="border border-slate-200 px-2 py-1.5 text-sm text-slate-300">&nbsp;</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[95vw] h-[90vh] max-w-[1400px] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <h2 className="text-lg font-bold text-slate-800">Spreadsheet Preview</h2>
            <span className="text-sm text-slate-400 font-medium">All students by unit</span>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Spreadsheet Content */}
        <div className="flex-1 overflow-auto p-6 bg-slate-100">
          {renderStackedView()}
        </div>
      </div>
    </div>
  );
};

export default GradeCardPreview;
