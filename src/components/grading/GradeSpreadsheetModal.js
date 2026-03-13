import { useState, useEffect, useMemo } from 'react';
import { X, FileSpreadsheet, Download, Filter, Loader2, Eraser } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { databaseService } from '../../services/databaseService';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const GRADE_LEVELS = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const COLUMNS = [
  { id: 'name',        label: 'Student Name', default: true  },
  { id: 'gradeLevel',  label: 'Grade Level',  default: true  },
  { id: 'unit',        label: 'Unit',         default: false },
  { id: 'subject',     label: 'Subject',      default: true  },
  { id: 'grade',       label: 'Grade',        default: true  },
  { id: 'percentage',  label: 'Percentage',   default: true  },
  { id: 'absences',    label: 'Absences',     default: false },
];

const DEFAULT_COLUMNS = COLUMNS.filter(c => c.default).map(c => c.id);

const GradeSpreadsheetModal = ({ isOpen, onClose, onAutoSave }) => {
  const [loading, setLoading]     = useState(false);
  const [exporting, setExporting] = useState(false);
  const [students, setStudents]   = useState([]);
  const [error, setError]         = useState(null);

  const [selectedQuarters,   setSelectedQuarters]   = useState(['Q3']);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('');
  const [selectedUnit,       setSelectedUnit]       = useState('');
  const [selectedColumns,    setSelectedColumns]    = useState(DEFAULT_COLUMNS);

  useEffect(() => {
    if (!isOpen) return;
    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const allStudents = await databaseService.getAllStudents();
        setStudents(allStudents.filter(s => s.active !== false));
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students. Using empty dataset.');
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [isOpen]);

  const filteredStudents = useMemo(() => {
    let result = students;
    if (selectedGradeLevel) result = result.filter(s => String(s.gradeLevel) === selectedGradeLevel);
    if (selectedUnit)       result = result.filter(s => s.unit === selectedUnit);
    return result;
  }, [students, selectedGradeLevel, selectedUnit]);

  const availableUnits = useMemo(() => {
    const units = new Set(students.map(s => s.unit).filter(Boolean));
    return Array.from(units).sort();
  }, [students]);

  // Preview rows match actual export structure: one row per grade entry per student.
  // This fixes the "—" problem — grade and percentage now come from real data.
  const previewRows = useMemo(() => {
    const rows = [];
    filteredStudents.slice(0, 10).forEach(s => {
      const name = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim();
      if (s.grades && s.grades.length > 0) {
        s.grades.forEach(grade => {
          const row = {};
          if (selectedColumns.includes('name'))       row['Student Name'] = name;
          if (selectedColumns.includes('gradeLevel')) row['Grade Level']  = s.gradeLevel != null ? String(s.gradeLevel) : '';
          if (selectedColumns.includes('unit'))       row['Unit']         = s.unit || '';
          if (selectedColumns.includes('subject'))    row['Subject']      = grade.subject || '';
          if (selectedColumns.includes('grade')) {
            const vals = selectedQuarters.map(q => grade[q]).filter(Boolean);
            row['Grade'] = vals.join(', ');
          }
          if (selectedColumns.includes('percentage')) row['Percentage'] = grade.percentage != null ? `${grade.percentage}%` : '';
          if (selectedColumns.includes('absences'))   row['Absences']   = s.totalAbsences != null ? String(s.totalAbsences) : '';
          rows.push(row);
        });
      } else {
        // Student with no grade data yet — show empty cells rather than silent dashes
        const row = {};
        if (selectedColumns.includes('name'))       row['Student Name'] = name;
        if (selectedColumns.includes('gradeLevel')) row['Grade Level']  = s.gradeLevel != null ? String(s.gradeLevel) : '';
        if (selectedColumns.includes('unit'))       row['Unit']         = s.unit || '';
        if (selectedColumns.includes('subject'))    row['Subject']      = '';
        if (selectedColumns.includes('grade'))      row['Grade']        = '';
        if (selectedColumns.includes('percentage')) row['Percentage']   = '';
        if (selectedColumns.includes('absences'))   row['Absences']     = s.totalAbsences != null ? String(s.totalAbsences) : '';
        rows.push(row);
      }
    });
    return rows;
  }, [filteredStudents, selectedColumns, selectedQuarters]);

  const toggleQuarter = (q) =>
    setSelectedQuarters(prev => prev.includes(q) ? prev.filter(x => x !== q) : [...prev, q]);

  const toggleColumn = (colId) =>
    setSelectedColumns(prev => prev.includes(colId) ? prev.filter(x => x !== colId) : [...prev, colId]);

  const resetColumns = () => setSelectedColumns(DEFAULT_COLUMNS);

  const handleExport = async () => {
    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Grades');
      const headers = selectedColumns.map(id => COLUMNS.find(c => c.id === id)?.label || id);
      ws.addRow(headers);

      filteredStudents.forEach(student => {
        const name = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim();
        if (student.grades && student.grades.length > 0) {
          student.grades.forEach(grade => {
            const row = [];
            selectedColumns.forEach(colId => {
              switch (colId) {
                case 'name':       row.push(name); break;
                case 'gradeLevel': row.push(student.gradeLevel || ''); break;
                case 'unit':       row.push(student.unit || ''); break;
                case 'subject':    row.push(grade.subject || ''); break;
                case 'grade':
                  const qGrades = selectedQuarters.map(q => grade[q]).filter(Boolean);
                  row.push(qGrades.join(', ') || '');
                  break;
                case 'percentage': row.push(grade.percentage || ''); break;
                case 'absences':   row.push(student.totalAbsences || ''); break;
                default:           row.push('');
              }
            });
            ws.addRow(row);
          });
        } else {
          const row = [];
          selectedColumns.forEach(colId => {
            switch (colId) {
              case 'name':       row.push(name); break;
              case 'gradeLevel': row.push(student.gradeLevel || ''); break;
              case 'unit':       row.push(student.unit || ''); break;
              default:           row.push('');
            }
          });
          ws.addRow(row);
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const quarterLabel = selectedQuarters.join('_') || 'All';
      saveAs(
        new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `Grade_Report_${quarterLabel}_${new Date().toISOString().split('T')[0]}.xlsx`
      );
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export spreadsheet.');
    } finally {
      setExporting(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all grades for the students currently shown? This cannot be undone.')) return;
    setLoading(true);
    try {
      const updated = await Promise.all(filteredStudents.map(async (student) => {
        const cleared = { ...student };
        if (Array.isArray(cleared.grades)) {
          cleared.grades = cleared.grades.map(g => ({ ...g, Q1: '', Q2: '', Q3: '', Q4: '', percentage: '', letterGrade: '' }));
        }
        return await databaseService.upsertStudent(cleared);
      }));
      setStudents(prev => prev.map(s => {
        const found = updated.find(u => u.id === s.id);
        return found ? found : s;
      }));
      if (onAutoSave) onAutoSave();
    } catch (err) {
      alert('Failed to clear grades.');
      console.error('Clear all error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const colHeaders = previewRows.length > 0 ? Object.keys(previewRows[0]) : [];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl shadow-slate-900/10 w-full max-w-5xl flex flex-col overflow-hidden"
        style={{ height: '85vh' }}
      >
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex justify-between items-center shrink-0">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <span className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
              <FileSpreadsheet className="w-6 h-6" />
            </span>
            Grade Spreadsheet Export
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-200/50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ── Two-panel body ────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0">

          {/* LEFT PANEL — Filters + Column toggles */}
          <div className="w-64 shrink-0 border-r border-slate-200/60 overflow-y-auto p-5 space-y-6 bg-slate-50/50">

            {/* Quarter */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Quarter
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {QUARTERS.map(q => (
                  <button
                    key={q}
                    onClick={() => toggleQuarter(q)}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-all border ${
                      selectedQuarters.includes(q)
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Grade Level */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Grade Level
              </label>
              <select
                value={selectedGradeLevel}
                onChange={e => setSelectedGradeLevel(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300/80 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
              >
                <option value="">All Grade Levels</option>
                {GRADE_LEVELS.map(gl => <option key={gl} value={gl}>Grade {gl}</option>)}
              </select>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Unit
              </label>
              <select
                value={selectedUnit}
                onChange={e => setSelectedUnit(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300/80 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
              >
                <option value="">All Units</option>
                {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            {/* Column toggles */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Columns
                </label>
                {/* Task 2: "Reset" text link instead of a second destructive button */}
                <button
                  onClick={resetColumns}
                  className="text-xs font-medium text-indigo-500 hover:text-indigo-700 transition-colors"
                >
                  Reset
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                {COLUMNS.map(col => (
                  // Task 8: Solid filled active state for WCAG-compliant contrast
                  <button
                    key={col.id}
                    onClick={() => toggleColumn(col.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border text-left flex items-center gap-2 ${
                      selectedColumns.includes(col.id)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-slate-700'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                      selectedColumns.includes(col.id)
                        ? 'bg-white/20 border-white/40'
                        : 'border-slate-300'
                    }`}>
                      {selectedColumns.includes(col.id) && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                          <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    {col.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL — Live preview (updates as filters/columns change) */}
          <div className="flex-1 overflow-auto p-5">
            {loading ? (
              <div className="flex items-center justify-center h-full gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="text-sm font-medium text-slate-500">Loading students…</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-amber-600 font-medium">{error}</p>
              </div>
            ) : previewRows.length > 0 ? (
              <>
                <div className="mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Preview — first {Math.min(10, filteredStudents.length)} of {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100">
                        {colHeaders.map(col => (
                          <th
                            key={col}
                            className="text-left p-3 text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200 whitespace-nowrap"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewRows.map((row, i) => (
                        // Task 8: clear row hover highlight
                        <tr key={i} className="hover:bg-indigo-50/50 transition-colors">
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="p-3 text-slate-700">
                              {val || (
                                <span className="text-slate-300 text-xs italic">no data</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-slate-400">
                No students match current filters
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        {/* Task 8: Clear All = ghost text button (non-primary), Export = filled primary */}
        <div className="px-6 py-4 border-t border-slate-200/80 flex items-center justify-between shrink-0 bg-slate-50/50">
          <span className="text-sm font-bold text-slate-600">
            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} to export
          </span>
          <div className="flex items-center gap-4">
            {/* Task 2: Only ONE Clear All, styled as a ghost/text action */}
            <button
              onClick={handleClearAll}
              disabled={loading || filteredStudents.length === 0}
              className="text-sm font-semibold text-rose-600 hover:text-rose-800 px-3 py-2 rounded-lg hover:bg-rose-50 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Clear all grades for shown students"
            >
              <Eraser className="w-4 h-4" />
              {loading ? 'Clearing…' : 'Clear All Grades'}
            </button>
            {/* Primary CTA */}
            <button
              onClick={handleExport}
              disabled={exporting || filteredStudents.length === 0}
              className="bg-indigo-600 text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {exporting ? 'Exporting…' : 'Export to .XLSX'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeSpreadsheetModal;
