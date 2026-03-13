import { useState, useEffect, useMemo } from 'react';
import { X, FileSpreadsheet, Download, Filter, Loader2 } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const GRADE_LEVELS = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const UNIT_COLORS = {
  Determination: '#d97706',
  Discovery:     '#0284c7',
  Freedom:       '#059669',
  Harmony:       '#7c3aed',
  Integrity:     '#e11d48',
  Serenity:      '#0891b2',
};

// Fixed columns always present (togglable)
const FIXED_COLS = [
  { id: 'name',       label: 'Student Name', default: true  },
  { id: 'gradeLevel', label: 'Grade Level',  default: true  },
  { id: 'unit',       label: 'Unit',         default: false },
];

// Subject groups — each maps to multiple spread columns
const SUBJECT_GROUPS = [
  {
    id: 'soc', label: 'Social Studies', default: true,
    cols: [
      { key: 'socCourse', label: 'Course' },
      { key: 'socGrade',  label: 'Grade',  isGrade: true },
      { key: 'socPct',    label: '%',      isPct:   true },
    ],
  },
  {
    id: 'sci', label: 'Science', default: true,
    cols: [
      { key: 'sciCourse', label: 'Course' },
      { key: 'sciGrade',  label: 'Grade',  isGrade: true },
      { key: 'sciPct',    label: '%',      isPct:   true },
    ],
  },
  {
    id: 'math', label: 'Math', default: true,
    cols: [
      { key: 'mathCourse', label: 'Course' },
      { key: 'mathGrade',  label: 'Grade',  isGrade: true },
      { key: 'mathPct',    label: '%',      isPct:   true },
    ],
  },
  {
    id: 'eng', label: 'English', default: true,
    cols: [
      { key: 'engCourse', label: 'Course' },
      { key: 'engGrade',  label: 'Grade',  isGrade: true },
      { key: 'engPct',    label: '%',      isPct:   true },
    ],
  },
  {
    id: 'elec', label: 'Electives', default: true,
    cols: [
      { key: 'elec1Course', label: 'Elective 1' },
      { key: 'elec1Grade',  label: 'Grade',      isGrade: true },
      { key: 'elec2Course', label: 'Elective 2' },
      { key: 'elec2Grade',  label: 'Grade',      isGrade: true },
    ],
  },
];

const EXTRA_COLS = [
  { id: 'absences', label: 'Absences', default: false },
];

const DEFAULT_FIXED  = FIXED_COLS.filter(c => c.default).map(c => c.id);
const DEFAULT_GROUPS = SUBJECT_GROUPS.filter(g => g.default).map(g => g.id);
const DEFAULT_EXTRA  = EXTRA_COLS.filter(c => c.default).map(c => c.id);

const parseGradeLevel = (gl) => {
  if (!gl) return '';
  const num = parseInt(gl, 10);
  return isNaN(num) ? gl : num;
};

const gradeColor = (g) => {
  if (!g) return '#334155';
  const c = String(g).toUpperCase().charAt(0);
  if (c === 'A') return '#059669';
  if (c === 'B') return '#2563eb';
  if (c === 'C') return '#d97706';
  if (c === 'D') return '#ea580c';
  if (c === 'F') return '#dc2626';
  return '#334155';
};

// Returns { Harmony: [ studentRow, ... ], Integrity: [ ... ] }
// Each studentRow has all subject fields spread out (wide format, matching the spreadsheet)
const loadFromSpreadsheetJson = async () => {
  const res = await fetch('/templates/Q3_GradeSpreadsheet_2025-2026.json');
  if (!res.ok) throw new Error('Spreadsheet JSON not found');
  const json = await res.json();

  const grouped = {};
  Object.entries(json).forEach(([unitName, rows]) => {
    grouped[unitName] = rows.map((row, idx) => ({
      id:          `json-${unitName}-${idx}`,
      name:        row[0]  || '',
      gradeLevel:  parseGradeLevel(row[1]),
      unit:        unitName,
      socCourse:   row[2]  || '',
      socGrade:    row[3]  || '',
      socPct:      row[4]  ? String(row[4]).replace('%', '')  : '',
      sciCourse:   row[5]  || '',
      sciGrade:    row[6]  || '',
      sciPct:      row[7]  ? String(row[7]).replace('%', '')  : '',
      mathCourse:  row[8]  || '',
      mathGrade:   row[9]  || '',
      mathPct:     row[10] ? String(row[10]).replace('%', '') : '',
      engCourse:   row[11] || '',
      engGrade:    row[12] || '',
      engPct:      row[13] ? String(row[13]).replace('%', '') : '',
      elec1Course: row[14] || '',
      elec1Grade:  row[15] || '',
      elec2Course: row[16] || '',
      elec2Grade:  row[17] || '',
      totalAbsences: null,
    }));
  });
  return grouped;
};

// ── Checkbox button shared style ──────────────────────────────────────────────
const ToggleBtn = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border text-left flex items-center gap-2 ${
      active
        ? 'bg-indigo-600 text-white border-indigo-600'
        : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-slate-700'
    }`}
  >
    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${active ? 'bg-white/20 border-white/40' : 'border-slate-300'}`}>
      {active && (
        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
          <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
    {label}
  </button>
);

// ── Main component ────────────────────────────────────────────────────────────
const GradeSpreadsheetModal = ({ isOpen, onClose }) => {
  const [loading, setLoading]         = useState(false);
  const [exporting, setExporting]     = useState(false);
  const [groupedData, setGroupedData] = useState(null);
  const [error, setError]             = useState(null);

  const [selectedGradeLevel, setSelectedGradeLevel] = useState('');
  const [selectedUnit,       setSelectedUnit]       = useState('');
  const [activeFixed,        setActiveFixed]        = useState(DEFAULT_FIXED);
  const [activeGroups,       setActiveGroups]       = useState(DEFAULT_GROUPS);
  const [activeExtra,        setActiveExtra]        = useState(DEFAULT_EXTRA);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    loadFromSpreadsheetJson()
      .then(g => setGroupedData(g))
      .catch(() => { setError('Failed to load grade data.'); setGroupedData({}); })
      .finally(() => setLoading(false));
  }, [isOpen]);

  const unitList = useMemo(() => (groupedData ? Object.keys(groupedData) : []), [groupedData]);

  const filteredGrouped = useMemo(() => {
    if (!groupedData) return {};
    const out = {};
    Object.entries(groupedData).forEach(([unit, rows]) => {
      if (selectedUnit && unit !== selectedUnit) return;
      const filtered = rows.filter(s =>
        !selectedGradeLevel || String(s.gradeLevel) === selectedGradeLevel
      );
      if (filtered.length) out[unit] = filtered;
    });
    return out;
  }, [groupedData, selectedGradeLevel, selectedUnit]);

  const totalFiltered = useMemo(() =>
    Object.values(filteredGrouped).reduce((n, rows) => n + rows.length, 0),
  [filteredGrouped]);

  // Build the flat column list from active toggles
  const visibleCols = useMemo(() => {
    const cols = [];
    FIXED_COLS.forEach(c => { if (activeFixed.includes(c.id)) cols.push({ key: c.id, label: c.label, groupId: null }); });
    SUBJECT_GROUPS.forEach(g => {
      if (!activeGroups.includes(g.id)) return;
      g.cols.forEach(c => cols.push({ ...c, groupId: g.id, groupLabel: g.label }));
    });
    EXTRA_COLS.forEach(c => { if (activeExtra.includes(c.id)) cols.push({ key: c.id, label: c.label, groupId: null }); });
    return cols;
  }, [activeFixed, activeGroups, activeExtra]);

  // Build group spans for the double header row
  const groupSpans = useMemo(() => {
    const spans = [];
    let curGroup = null, curLabel = '', count = 0;
    visibleCols.forEach(col => {
      if (col.groupId) {
        if (col.groupId !== curGroup) {
          if (curGroup) spans.push({ label: curLabel, span: count, isGroup: true });
          curGroup = col.groupId; curLabel = col.groupLabel; count = 1;
        } else { count++; }
      } else {
        if (curGroup) { spans.push({ label: curLabel, span: count, isGroup: true }); curGroup = null; count = 0; }
        spans.push({ label: '', span: 1, isGroup: false });
      }
    });
    if (curGroup) spans.push({ label: curLabel, span: count, isGroup: true });
    return spans;
  }, [visibleCols]);

  const toggleFixed  = id => setActiveFixed(p =>  p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleGroup  = id => setActiveGroups(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleExtra  = id => setActiveExtra(p =>  p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const resetColumns = () => { setActiveFixed(DEFAULT_FIXED); setActiveGroups(DEFAULT_GROUPS); setActiveExtra(DEFAULT_EXTRA); };

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const wb = (new ExcelJS.Workbook()).addWorksheet('Q3 Grades');

      // Group header row
      const groupRow = wb.addRow(groupSpans.map(g => g.label));
      groupRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      groupRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } };

      // Column header row
      const hdrRow = wb.addRow(visibleCols.map(c => c.label));
      hdrRow.font = { bold: true };
      hdrRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };

      Object.entries(filteredGrouped).forEach(([unitName, rows]) => {
        const color = (UNIT_COLORS[unitName] || '#475569').replace('#', '');
        const unitRow = wb.addRow([unitName]);
        unitRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        unitRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + color } };
        unitRow.getCell(1).value = `${unitName}  (${rows.length} students)`;

        rows.forEach(s => {
          const row = visibleCols.map(col => {
            const v = s[col.key];
            if (col.isPct && v) return `${v}%`;
            return v != null ? v : '';
          });
          wb.addRow(row);
        });
        wb.addRow([]);
      });

      wb.columns = visibleCols.map(col => ({
        width: col.key === 'name' ? 22 : col.key?.includes('Course') || col.key?.includes('course') ? 18 : 8,
      }));

      saveAs(
        new Blob([await wb.xlsx.writeBuffer()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `Q3_GradeReport_${new Date().toISOString().split('T')[0]}.xlsx`
      );
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export spreadsheet.');
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-3">
      <div className="fixed inset-3 bg-white rounded-2xl shadow-2xl shadow-slate-900/20 flex flex-col overflow-hidden border border-slate-200/60">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex justify-between items-center shrink-0 bg-white">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
            <span className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            Grade Spreadsheet Export
            {!loading && groupedData && (
              <span className="text-xs font-medium text-slate-400 ml-1">
                Q3 &middot; {totalFiltered} students &middot; {unitList.length} unit{unitList.length !== 1 ? 's' : ''}
              </span>
            )}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ── Two-panel body ──────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0">

          {/* LEFT PANEL ───────────────────────────────────────────────────── */}
          <div className="w-56 shrink-0 border-r border-slate-200 flex flex-col p-4 gap-4 bg-slate-50/60 overflow-y-auto">

            {/* Grade Level filter */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Grade Level</label>
              <select value={selectedGradeLevel} onChange={e => setSelectedGradeLevel(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-400/20 outline-none">
                <option value="">All Grades</option>
                {GRADE_LEVELS.map(gl => <option key={gl} value={gl}>Grade {gl}</option>)}
              </select>
            </div>

            {/* Unit filter */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Unit</label>
              <select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-400/20 outline-none">
                <option value="">All Units</option>
                {unitList.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            {/* Column toggles */}
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between mb-2 shrink-0">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Columns
                </label>
                <button onClick={resetColumns} className="text-xs font-medium text-indigo-500 hover:text-indigo-700 transition-colors">
                  Reset
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {/* Fixed columns */}
                {FIXED_COLS.map(c => (
                  <ToggleBtn key={c.id} active={activeFixed.includes(c.id)} onClick={() => toggleFixed(c.id)} label={c.label} />
                ))}

                <div className="border-t border-slate-200 my-1" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Subjects</p>

                {/* Subject group toggles */}
                {SUBJECT_GROUPS.map(g => (
                  <ToggleBtn key={g.id} active={activeGroups.includes(g.id)} onClick={() => toggleGroup(g.id)} label={g.label} />
                ))}

                <div className="border-t border-slate-200 my-1" />

                {/* Extra columns */}
                {EXTRA_COLS.map(c => (
                  <ToggleBtn key={c.id} active={activeExtra.includes(c.id)} onClick={() => toggleExtra(c.id)} label={c.label} />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL — wide-format grade table ─────────────────────── */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
            {loading ? (
              <div className="flex items-center justify-center flex-1 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="text-sm font-medium text-slate-500">Loading grades…</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center flex-1">
                <p className="text-sm text-amber-600 font-medium">{error}</p>
              </div>
            ) : Object.keys(filteredGrouped).length === 0 ? (
              <div className="flex items-center justify-center flex-1 text-sm text-slate-400">
                No students match current filters
              </div>
            ) : (
              /* Scrollable table wrapper — only this scrolls */
              <div className="flex-1 overflow-auto p-4">
                <table className="border-collapse text-xs" style={{ minWidth: 800 }}>
                  <thead className="sticky top-0 z-10">
                    {/* Row 1: Group labels with colspans */}
                    <tr>
                      {groupSpans.map((g, i) => (
                        <th
                          key={i}
                          colSpan={g.span}
                          className={`px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-center border border-slate-300 whitespace-nowrap ${
                            g.isGroup
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-700 text-transparent select-none'
                          }`}
                        >
                          {g.label}
                        </th>
                      ))}
                    </tr>
                    {/* Row 2: Individual column names */}
                    <tr className="bg-slate-100">
                      {visibleCols.map((col, i) => (
                        <th key={i} className="px-2 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider border border-slate-200 whitespace-nowrap text-left">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {Object.entries(filteredGrouped).map(([unitName, rows]) => {
                      const unitColor = UNIT_COLORS[unitName] || '#475569';
                      return (
                        <>
                          {/* Unit section header spanning all columns */}
                          <tr key={`hdr-${unitName}`}>
                            <td
                              colSpan={visibleCols.length}
                              className="px-3 py-1.5 text-xs font-extrabold text-white tracking-wide border-b border-white/20"
                              style={{ background: unitColor }}
                            >
                              {unitName.toUpperCase()} &nbsp;·&nbsp; {rows.length} student{rows.length !== 1 ? 's' : ''}
                            </td>
                          </tr>

                          {/* Student rows */}
                          {rows.map((s, ri) => (
                            <tr
                              key={s.id}
                              className={`border-b border-slate-100 last:border-b-0 transition-colors ${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} hover:bg-indigo-50/40`}
                            >
                              {visibleCols.map((col, ci) => {
                                const raw = s[col.key];
                                const display = col.isPct && raw ? `${raw}%` : (raw ?? '');
                                return (
                                  <td
                                    key={ci}
                                    className={`px-2 py-1.5 border-r border-slate-100 last:border-r-0 whitespace-nowrap ${
                                      col.isGrade ? 'font-bold text-center'
                                        : col.isPct  ? 'text-center font-mono'
                                        : col.key === 'name' ? 'font-semibold'
                                        : ''
                                    }`}
                                    style={col.isGrade ? { color: gradeColor(raw) } : { color: '#334155' }}
                                  >
                                    {display || <span className="text-slate-300">—</span>}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}

                          {/* Spacer row between units */}
                          <tr key={`spacer-${unitName}`} className="h-3 bg-slate-50">
                            <td colSpan={visibleCols.length} />
                          </tr>
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/70">
          <span className="text-sm font-bold text-slate-600">
            {totalFiltered} student{totalFiltered !== 1 ? 's' : ''} to export
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={handleExport}
              disabled={exporting || totalFiltered === 0}
              className="bg-indigo-600 text-white font-semibold py-2.5 px-7 rounded-xl shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
