import React, { useEffect, useState, useCallback } from 'react';
import { X, Loader2, Layers, FileSpreadsheet } from 'lucide-react';
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
  'English': { classKey: 'engClass', gradeKey: 'engGrade' },
  'Math': { classKey: 'mathClass', gradeKey: 'mathGrade' },
  'Science': { classKey: 'sciClass', gradeKey: 'sciGrade' },
  'Social Studies': { classKey: 'socClass', gradeKey: 'socGrade' },
};

const GradeCardPreview = ({ formData, onClose }) => {
  const [viewMode, setViewMode] = useState('single'); // 'single' | 'stacked'
  const [stackedData, setStackedData] = useState(null); // { unitName: [rows...] }
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

  // Load stacked data when switching to stacked mode
  const loadStackedData = useCallback(async () => {
    setStackedLoading(true);
    setStackedError('');
    try {
      const allStudents = await databaseService.getAllStudents();
      const active = allStudents.filter(s => s.active !== false && s.unitName && s.unitName !== 'Discharged');

      // Fetch enrollments for all students in parallel
      const studentRows = await Promise.all(active.map(async (student) => {
        const name = student.studentName || `${student.firstName || ''} ${student.lastName || ''}`.trim();
        const row = {
          name,
          grade: student.gradeLevel ? String(student.gradeLevel) : '',
          unitName: student.unitName || '',
          socCourse: '', socGrade: '',
          sciCourse: '', sciGrade: '',
          mathCourse: '', mathGrade: '',
          engCourse: '', engGrade: '',
          pe: '', ap: '',
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
            } else {
              electiveCount++;
              if (electiveCount === 1) row.pe = e.letterGrade || '';
              else if (electiveCount === 2) row.ap = e.letterGrade || '';
            }
          });
        } catch { /* skip — student just won't have grades */ }

        return row;
      }));

      // Group by unit
      const grouped = {};
      studentRows.forEach(row => {
        const unit = row.unitName;
        if (!grouped[unit]) grouped[unit] = [];
        grouped[unit].push(row);
      });

      // Sort students within each unit alphabetically
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
    if (viewMode === 'stacked' && !stackedData) {
      loadStackedData();
    }
  }, [viewMode, stackedData, loadStackedData]);

  const title = `${formData.quarterName} Grade Spreadsheet ${formData.schoolYear}`;

  const singleRows = [
    {
      name: formData.studentName,
      grade: formData.gradeLevel,
      socCourse: formData.socClass,
      socGrade: formData.socGrade,
      sciCourse: formData.sciClass,
      sciGrade: formData.sciGrade,
      mathCourse: formData.mathClass,
      mathGrade: formData.mathGrade,
      engCourse: formData.engClass,
      engGrade: formData.engGrade,
      pe: formData.elec1Grade || '',
      ap: formData.elec2Grade || '',
    },
  ];

  const Cell = ({ children, className = '', header = false }) => (
    <td className={`border border-slate-300 px-3 py-2 ${header ? 'font-bold text-xs uppercase tracking-wide text-slate-500 bg-slate-100' : 'text-sm text-slate-700'} ${className}`}>
      {children || <span className="text-slate-300">&mdash;</span>}
    </td>
  );

  const GradeCell = ({ value }) => (
    <td className={`border border-slate-300 px-3 py-2 text-sm text-center font-bold ${getGradeColor(value)}`}>
      {value || <span className="text-slate-300">&mdash;</span>}
    </td>
  );

  const HeaderRow = () => (
    <tr className="bg-slate-100">
      <Cell header className="w-4"></Cell>
      <Cell header>Name</Cell>
      <Cell header className="text-center">Gr</Cell>
      <Cell header>Soc Studies</Cell>
      <Cell header className="text-center">Grade</Cell>
      <Cell header>Science</Cell>
      <Cell header className="text-center">Grade</Cell>
      <Cell header>Mathematics</Cell>
      <Cell header className="text-center">Grade</Cell>
      <Cell header>English</Cell>
      <Cell header className="text-center">Grade</Cell>
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
        <Cell className="whitespace-nowrap">{r.sciCourse}</Cell>
        <GradeCell value={r.sciGrade} />
        <Cell className="whitespace-nowrap">{r.mathCourse}</Cell>
        <GradeCell value={r.mathGrade} />
        <Cell className="whitespace-nowrap">{r.engCourse}</Cell>
        <GradeCell value={r.engGrade} />
        <GradeCell value={r.pe} />
        <GradeCell value={r.ap} />
        <Cell className="font-semibold whitespace-nowrap">{r.name}</Cell>
      </tr>
    );
  };

  const renderSingleView = () => (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th colSpan={14} className="bg-slate-800 text-white text-sm font-bold py-3 px-4 text-left tracking-wide">
                {title}
              </th>
            </tr>
            <tr>
              <td colSpan={14} className="border border-slate-300 bg-white h-4"></td>
            </tr>
            <HeaderRow />
          </thead>
          <tbody>
            {singleRows.map((r, i) => <DataRow key={i} r={r} i={i} />)}
            {[...Array(12)].map((_, i) => (
              <tr key={`empty-${i}`} className="bg-white">
                {[...Array(14)].map((_, j) => (
                  <td key={j} className="border border-slate-200 px-3 py-2.5 text-sm text-slate-300">&nbsp;</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-400 font-medium">
        Preview of grade_spreadsheet.xlsx export
      </div>
    </div>
  );

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

    // Also add any units not in the predefined order
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
                      <th colSpan={14} className={`${colors.bg} text-white text-sm font-bold py-3 px-4 text-left tracking-wide`}>
                        {unitName} &mdash; {formData.quarterName} {formData.schoolYear}
                        <span className="ml-3 text-white/70 font-medium text-xs">({rows.length} student{rows.length !== 1 ? 's' : ''})</span>
                      </th>
                    </tr>
                    <tr>
                      <td colSpan={14} className="border border-slate-300 bg-white h-2"></td>
                    </tr>
                    <HeaderRow />
                  </thead>
                  <tbody>
                    {rows.map((r, i) => <DataRow key={i} r={r} i={i} />)}
                    {/* A few empty rows per unit */}
                    {[...Array(2)].map((_, i) => (
                      <tr key={`empty-${i}`} className="bg-white">
                        {[...Array(14)].map((_, j) => (
                          <td key={j} className="border border-slate-200 px-3 py-2 text-sm text-slate-300">&nbsp;</td>
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
            <span className="text-sm text-slate-400 font-medium">
              {viewMode === 'single' ? 'Live — changes update in real time' : 'All students by unit'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-200/80 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('single')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${viewMode === 'single' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Single
              </button>
              <button
                onClick={() => setViewMode('stacked')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${viewMode === 'stacked' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Layers className="w-3.5 h-3.5" />
                Stacked
              </button>
            </div>

            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Spreadsheet Content */}
        <div className="flex-1 overflow-auto p-6 bg-slate-100">
          {viewMode === 'single' ? renderSingleView() : renderStackedView()}
        </div>
      </div>
    </div>
  );
};

export default GradeCardPreview;
