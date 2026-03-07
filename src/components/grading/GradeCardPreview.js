import React, { useEffect, useState, useCallback } from 'react';
import { X, Loader2, Download, RotateCcw } from 'lucide-react';
import { databaseService } from '../../services/databaseService';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const UNIT_ORDER = ['Determination', 'Discovery', 'Freedom', 'Harmony', 'Integrity', 'Serenity'];

const UNIT_COLORS = {
  Determination: { bg: '#d97706', header: '#78350f' },
  Discovery:     { bg: '#0284c7', header: '#0c4a6e' },
  Freedom:       { bg: '#059669', header: '#064e3b' },
  Harmony:       { bg: '#7c3aed', header: '#3b0764' },
  Integrity:     { bg: '#e11d48', header: '#881337' },
  Serenity:      { bg: '#0891b2', header: '#164e63' },
};

const SUBJECT_FIELD_MAP = {
  'English':        { classKey: 'engCourse',  gradeKey: 'engGrade',  pctKey: 'engPct' },
  'Math':           { classKey: 'mathCourse', gradeKey: 'mathGrade', pctKey: 'mathPct' },
  'Science':        { classKey: 'sciCourse',  gradeKey: 'sciGrade',  pctKey: 'sciPct' },
  'Social Studies': { classKey: 'socCourse',  gradeKey: 'socGrade',  pctKey: 'socPct' },
};

// Column definitions — single source of truth for headers, keys, and widths
const COLUMNS = [
  { key: 'name',      label: 'Name',           width: 'minmax(160px,1.4fr)', editable: true },
  { key: 'grade',     label: 'Gr',             width: '48px',               editable: true,  center: true },
  { key: 'socCourse', label: 'Social Studies',  width: 'minmax(110px,1fr)',  editable: true },
  { key: 'socGrade',  label: 'Grade',           width: '56px',              editable: true,  center: true, isGrade: true },
  { key: 'socPct',    label: '%',               width: '52px',              editable: true,  center: true, isPct: true },
  { key: 'sciCourse', label: 'Science',         width: 'minmax(110px,1fr)', editable: true },
  { key: 'sciGrade',  label: 'Grade',           width: '56px',              editable: true,  center: true, isGrade: true },
  { key: 'sciPct',    label: '%',               width: '52px',              editable: true,  center: true, isPct: true },
  { key: 'mathCourse',label: 'Math',            width: 'minmax(110px,1fr)', editable: true },
  { key: 'mathGrade', label: 'Grade',           width: '56px',              editable: true,  center: true, isGrade: true },
  { key: 'mathPct',   label: '%',               width: '52px',              editable: true,  center: true, isPct: true },
  { key: 'engCourse', label: 'English',         width: 'minmax(110px,1fr)', editable: true },
  { key: 'engGrade',  label: 'Grade',           width: '56px',              editable: true,  center: true, isGrade: true },
  { key: 'engPct',    label: '%',               width: '52px',              editable: true,  center: true, isPct: true },
  { key: 'elec1Course',label: 'Elective 1',     width: 'minmax(100px,1fr)', editable: true },
  { key: 'elec1Grade',label: 'Grade',           width: '56px',              editable: true,  center: true, isGrade: true },
  { key: 'elec2Course',label: 'Elective 2',     width: 'minmax(100px,1fr)', editable: true },
  { key: 'elec2Grade',label: 'Grade',           width: '56px',              editable: true,  center: true, isGrade: true },
];

const gradeColor = (g) => {
  if (!g) return '';
  const c = g.toUpperCase().charAt(0);
  if (c === 'A') return '#059669';
  if (c === 'B') return '#2563eb';
  if (c === 'C') return '#d97706';
  if (c === 'D') return '#ea580c';
  if (c === 'F') return '#dc2626';
  if (c === 'P') return '#059669';
  return '';
};

const GradeCardPreview = ({ formData, onClose }) => {
  const [data, setData] = useState(null);       // { unitName: [ row, ... ] }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  // ---------- Data loading ----------
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const allStudents = await databaseService.getAllStudents();
      const active = allStudents.filter(s => s.active !== false && s.unitName && s.unitName !== 'Discharged');

      const rows = await Promise.all(active.map(async (student) => {
        const name = student.studentName || `${student.firstName || ''} ${student.lastName || ''}`.trim();
        const row = {
          name,
          grade: student.gradeLevel ? String(student.gradeLevel) : '',
          unitName: student.unitName || '',
          socCourse: '', socGrade: '', socPct: '',
          sciCourse: '', sciGrade: '', sciPct: '',
          mathCourse: '', mathGrade: '', mathPct: '',
          engCourse: '', engGrade: '', engPct: '',
          elec1Course: '', elec1Grade: '',
          elec2Course: '', elec2Grade: '',
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
                row.elec1Course = e.courseName || '';
                row.elec1Grade = e.letterGrade || '';
              } else if (electiveCount === 2) {
                row.elec2Course = e.courseName || '';
                row.elec2Grade = e.letterGrade || '';
              }
            }
          });
        } catch { /* skip */ }
        return row;
      }));

      const grouped = {};
      rows.forEach(r => {
        if (!grouped[r.unitName]) grouped[r.unitName] = [];
        grouped[r.unitName].push(r);
      });
      Object.values(grouped).forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name)));

      setData(grouped);
    } catch (err) {
      console.error('Error loading spreadsheet data:', err);
      setError('Failed to load student data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (!data) loadData(); }, [data, loadData]);

  // ---------- Inline edit ----------
  const handleCellChange = (unitName, rowIdx, key, value) => {
    setData(prev => {
      const next = { ...prev };
      next[unitName] = [...prev[unitName]];
      next[unitName][rowIdx] = { ...next[unitName][rowIdx], [key]: value };
      return next;
    });
  };

  // ---------- Download as XLSX ----------
  const handleDownload = () => {
    if (!data) return;
    setDownloading(true);

    try {
      const units = UNIT_ORDER.filter(u => data[u]?.length > 0);
      Object.keys(data).forEach(u => { if (!units.includes(u) && data[u]?.length > 0) units.push(u); });

      const sheetRows = [];

      // Title row
      sheetRows.push([`${formData.quarterName} Grade Spreadsheet ${formData.schoolYear}`]);
      sheetRows.push([]); // spacer

      // Column headers
      sheetRows.push(COLUMNS.map(c => c.label));

      units.forEach(unitName => {
        // Unit header
        sheetRows.push([`${unitName} (${data[unitName].length})`]);

        data[unitName].forEach(r => {
          sheetRows.push(COLUMNS.map(c => {
            const val = r[c.key] || '';
            if (c.isPct && val) return `${val}%`;
            return val;
          }));
        });

        sheetRows.push([]); // spacer between units
      });

      const ws = XLSX.utils.aoa_to_sheet(sheetRows);

      // Basic column widths
      ws['!cols'] = COLUMNS.map(c => ({ wch: c.label.length < 8 ? 8 : c.label.length + 4 }));
      // Make first col (name) wider
      ws['!cols'][0] = { wch: 24 };

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Grades');

      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${formData.quarterName}_GradeSpreadsheet_${formData.schoolYear}.xlsx`);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to generate spreadsheet. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // ---------- Render helpers ----------
  const gridTemplate = COLUMNS.map(c => c.width).join(' ');

  const totalStudents = data ? Object.values(data).reduce((s, arr) => s + arr.length, 0) : 0;
  const unitList = data
    ? [...UNIT_ORDER.filter(u => data[u]?.length > 0), ...Object.keys(data).filter(u => !UNIT_ORDER.includes(u) && data[u]?.length > 0)]
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: '96vw', height: '92vh', maxWidth: 1520 }}
        onClick={e => e.stopPropagation()}
      >
        {/* ========== HEADER ========== */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-bold text-slate-800 tracking-tight">Grade Spreadsheet</h2>
            {!loading && data && (
              <span className="text-xs font-medium text-slate-400">
                {totalStudents} student{totalStudents !== 1 ? 's' : ''} &middot; {unitList.length} unit{unitList.length !== 1 ? 's' : ''} &middot; {formData.quarterName} {formData.schoolYear}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40"
              title="Reload data"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleDownload}
              disabled={!data || downloading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Download .xlsx
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 ml-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========== BODY ========== */}
        <div className="flex-1 overflow-auto bg-slate-50 px-5 py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <p className="text-sm font-medium">Loading students...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <p className="text-sm font-medium text-rose-600">{error}</p>
              <button onClick={loadData} className="text-sm font-bold text-indigo-600 hover:text-indigo-800">Try again</button>
            </div>
          )}

          {!loading && !error && data && unitList.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
              <p className="text-sm font-medium">No active students found.</p>
            </div>
          )}

          {!loading && !error && data && unitList.length > 0 && (
            <div className="space-y-5">
              {unitList.map(unitName => {
                const rows = data[unitName];
                const colors = UNIT_COLORS[unitName] || { bg: '#475569', header: '#1e293b' };

                return (
                  <div key={unitName} className="rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm">
                    {/* Unit header */}
                    <div
                      className="px-4 py-2.5 flex items-center justify-between"
                      style={{ background: colors.bg }}
                    >
                      <span className="text-white font-semibold text-sm tracking-wide">{unitName}</span>
                      <span className="text-white/70 text-xs font-medium">{rows.length} student{rows.length !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Column headers */}
                    <div className="overflow-x-auto">
                      <div style={{ display: 'grid', gridTemplateColumns: gridTemplate, minWidth: 1200 }}
                        className="bg-slate-50 border-b border-slate-200"
                      >
                        {COLUMNS.map((col, ci) => (
                          <div
                            key={ci}
                            className={`px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-r border-slate-100 last:border-r-0 ${col.center ? 'text-center' : ''}`}
                          >
                            {col.label}
                          </div>
                        ))}
                      </div>

                      {/* Data rows */}
                      {rows.map((row, ri) => (
                        <div
                          key={ri}
                          style={{ display: 'grid', gridTemplateColumns: gridTemplate, minWidth: 1200 }}
                          className={`border-b border-slate-100 last:border-b-0 ${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-indigo-50/30 transition-colors`}
                        >
                          {COLUMNS.map((col, ci) => {
                            const val = row[col.key] || '';
                            const color = col.isGrade ? gradeColor(val) : '';

                            return (
                              <div
                                key={ci}
                                className={`border-r border-slate-100 last:border-r-0 flex items-center ${col.center ? 'justify-center' : ''}`}
                              >
                                <input
                                  type="text"
                                  value={col.isPct && val ? `${val}` : val}
                                  onChange={(e) => {
                                    let v = e.target.value;
                                    if (col.isPct) v = v.replace(/[^0-9.]/g, '');
                                    handleCellChange(unitName, ri, col.key, v);
                                  }}
                                  className="w-full h-full px-2 py-1.5 text-sm bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-indigo-400 rounded-none transition-shadow"
                                  style={{
                                    color: color || '#334155',
                                    fontWeight: col.isGrade || col.key === 'name' ? 600 : 400,
                                    textAlign: col.center ? 'center' : 'left',
                                    fontFamily: col.isPct || col.key === 'grade' ? 'ui-monospace, monospace' : 'inherit',
                                    fontSize: col.isPct ? '12px' : '13px',
                                  }}
                                  spellCheck={false}
                                />
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========== FOOTER ========== */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-2 flex items-center justify-between text-xs text-slate-400">
          <span>Click any cell to edit &middot; Changes are reflected in the downloaded file</span>
          <span>Tip: Edit grades here, then click <strong className="text-emerald-600">Download .xlsx</strong> to save</span>
        </div>
      </div>
    </div>
  );
};

export default GradeCardPreview;
