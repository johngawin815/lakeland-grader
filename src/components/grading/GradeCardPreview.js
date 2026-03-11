import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X, Loader2, Download, RotateCcw, FileDown, CloudUpload, ChevronDown, FileArchive, Eraser } from 'lucide-react';
import { databaseService } from '../../services/databaseService';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import JSZip from 'jszip';

const UNIT_ORDER = ['Determination', 'Discovery', 'Freedom', 'Harmony', 'Integrity', 'Serenity'];

// Instructor lookup: maps (unitName, subjectArea) → instructor name
const INSTRUCTOR_MAP = {
  Harmony:   { Science: 'Ms. Lee', Math: 'Ms. Lee', English: 'Mr. John', 'Social Studies': 'Mr. John' },
  Integrity: { Science: 'Ms. Lee', Math: 'Ms. Lee', English: 'Mr. John', 'Social Studies': 'Mr. John' },
};

const getInstructor = (unitName, subjectArea) =>
  (INSTRUCTOR_MAP[unitName] && INSTRUCTOR_MAP[unitName][subjectArea]) || '';

// A grade of D or higher earns 0.5 credits per course
const PASSING_GRADES = ['A', 'B', 'C', 'D'];
const getAutoCredits = (letterGrade) => {
  if (!letterGrade) return '';
  const first = letterGrade.trim().toUpperCase().charAt(0);
  return PASSING_GRADES.includes(first) ? '0.5' : '';
};

const UNIT_COLORS = {
  Determination: { bg: '#d97706', header: '#78350f' },
  Discovery:     { bg: '#0284c7', header: '#0c4a6e' },
  Freedom:       { bg: '#059669', header: '#064e3b' },
  Harmony:       { bg: '#7c3aed', header: '#3b0764' },
  Integrity:     { bg: '#e11d48', header: '#881337' },
  Serenity:      { bg: '#0891b2', header: '#164e63' },
};

const SUBJECT_FIELD_MAP = {
  'English':        { classKey: 'engCourse',  gradeKey: 'engGrade',  pctKey: 'engPct',  credKey: 'engCred' },
  'Math':           { classKey: 'mathCourse', gradeKey: 'mathGrade', pctKey: 'mathPct', credKey: 'mathCred' },
  'Science':        { classKey: 'sciCourse',  gradeKey: 'sciGrade',  pctKey: 'sciPct',  credKey: 'sciCred' },
  'Social Studies': { classKey: 'socCourse',  gradeKey: 'socGrade',  pctKey: 'socPct',  credKey: 'socCred' },
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
  // Local storage key for spreadsheet preview
  const LS_KEY = `gradeSpreadsheetPreview_${formData.quarterName}_${formData.schoolYear}`;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [refreshMsg, setRefreshMsg] = useState('');
  const [generatingId, setGeneratingId] = useState(null);
  const [bulkExporting, setBulkExporting] = useState(null);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  // Close export menu on outside click
  useEffect(() => {
    const h = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ---------- Data loading ----------
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Try to restore from localStorage first
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        setData(JSON.parse(saved));
        setLoading(false);
        return;
      }
      // Otherwise, load from DB
      const allStudents = await databaseService.getAllStudents();
      const active = allStudents.filter(s => s.active !== false && s.unitName && s.unitName !== 'Discharged');

      const rows = await Promise.all(active.map(async (student) => {
        const name = student.studentName || `${student.firstName || ''} ${student.lastName || ''}`.trim();
        const row = {
          studentId: student.id,
          name,
          grade: student.gradeLevel ? String(student.gradeLevel) : '',
          unitName: student.unitName || '',
          socCourse: '', socGrade: '', socPct: '', socCred: '',
          sciCourse: '', sciGrade: '', sciPct: '', sciCred: '',
          mathCourse: '', mathGrade: '', mathPct: '', mathCred: '',
          engCourse: '', engGrade: '', engPct: '', engCred: '',
          elec1Course: '', elec1Grade: '', elec1Cred: '',
          elec2Course: '', elec2Grade: '', elec2Cred: '',
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
              row[mapping.credKey] = e.credits != null ? String(e.credits) : '';
            } else {
              electiveCount++;
              if (electiveCount === 1) {
                row.elec1Course = e.courseName || '';
                row.elec1Grade = e.letterGrade || '';
                row.elec1Cred = e.credits != null ? String(e.credits) : '';
              } else if (electiveCount === 2) {
                row.elec2Course = e.courseName || '';
                row.elec2Grade = e.letterGrade || '';
                row.elec2Cred = e.credits != null ? String(e.credits) : '';
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
  }, [LS_KEY]);

  useEffect(() => { if (!data) loadData(); }, [data, loadData]);

  // ---------- Inline edit ----------
  const handleCellChange = (unitName, rowIdx, key, value) => {
    setData(prev => {
      const next = { ...prev };
      next[unitName] = [...prev[unitName]];
      next[unitName][rowIdx] = { ...next[unitName][rowIdx], [key]: value };
      // Auto-save to localStorage
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
    // Restore from localStorage on mount
    useEffect(() => {
      if (!data) loadData();
    }, [data, loadData]);

    // Save to localStorage whenever data changes (for bulk edits)
    useEffect(() => {
      if (data) localStorage.setItem(LS_KEY, JSON.stringify(data));
    }, [data, LS_KEY]);
  };

  // ---------- Generate grade card for a single row ----------
  const buildRowTemplateData = (row) => {
    const gl = parseInt(row.grade, 10);
    const useUpperLevel = gl >= 9 && gl <= 12;
    const qMap = { Q1: 'q1', Q2: 'q2', Q3: 'q3', Q4: 'q4', Summer: 'q5' };
    const qPrefix = qMap[formData.quarterName] || 'q1';

    if (useUpperLevel) {
      const templateData = {
        student_name: row.name,
        school_year: formData.schoolYear || '',
        grade: row.grade,
        admit_date: '',
        discharge_date: '',
      };
      const unit = row.unitName || '';
      const subjects = [
        { course: row.engCourse, grade: row.engGrade, cred: row.engCred, area: 'English', row: 1 },
        { course: row.mathCourse, grade: row.mathGrade, cred: row.mathCred, area: 'Math', row: 2 },
        { course: row.sciCourse, grade: row.sciGrade, cred: row.sciCred, area: 'Science', row: 3 },
        { course: row.socCourse, grade: row.socGrade, cred: row.socCred, area: 'Social Studies', row: 4 },
        { course: row.elec1Course, grade: row.elec1Grade, cred: row.elec1Cred, area: 'Elective', row: 5 },
        { course: row.elec2Course, grade: row.elec2Grade, cred: row.elec2Cred, area: 'Elective', row: 6 },
      ];
      subjects.forEach(s => {
        templateData[`${qPrefix}_r${s.row}_course`] = s.course || '';
        templateData[`${qPrefix}_r${s.row}_grade`] = s.grade || '';
        templateData[`${qPrefix}_r${s.row}_credits`] = s.cred || getAutoCredits(s.grade);
        templateData[`${qPrefix}_r${s.row}_instructor`] = getInstructor(unit, s.area);
      });
      return { templateData, useUpperLevel };
    } else {
      const templateData = {
        student_name: row.name,
        grade_level: row.grade,
        school_year: formData.schoolYear || '',
        quarter_name: formData.quarterName || '',
        report_date: formData.reportDate || new Date().toISOString().split('T')[0],
        teacher_name: '',
        total_credits: '',
        comments: '',
        eng_class: row.engCourse, eng_grade: row.engGrade, eng_pct: row.engPct, eng_cred: row.engCred || getAutoCredits(row.engGrade),
        math_class: row.mathCourse, math_grade: row.mathGrade, math_pct: row.mathPct, math_cred: row.mathCred || getAutoCredits(row.mathGrade),
        sci_class: row.sciCourse, sci_grade: row.sciGrade, sci_pct: row.sciPct, sci_cred: row.sciCred || getAutoCredits(row.sciGrade),
        soc_class: row.socCourse, soc_grade: row.socGrade, soc_pct: row.socPct, soc_cred: row.socCred || getAutoCredits(row.socGrade),
        elec1_class: row.elec1Course, elec1_grade: row.elec1Grade, elec1_pct: '', elec1_cred: row.elec1Cred || getAutoCredits(row.elec1Grade),
        elec2_class: row.elec2Course, elec2_grade: row.elec2Grade, elec2_pct: '', elec2_cred: row.elec2Cred || getAutoCredits(row.elec2Grade),
      };
      return { templateData, useUpperLevel };
    }
  };

  const generateRowDocx = async (row) => {
    const rowKey = `${row.studentId}-${row.name}`;
    setGeneratingId(rowKey);
    try {
      const { templateData, useUpperLevel } = buildRowTemplateData(row);
      // Determine template file based on grade
      let templateFile;
      const gradeNum = parseInt(row.grade, 10);
      if (useUpperLevel) {
        templateFile = 'Upper Level Grade Card.docx';
      } else if (gradeNum >= 1 && gradeNum <= 5) {
        templateFile = 'grade_card_elementary_grand.docx';
      } else {
        templateFile = 'quarter_card_template.docx';
      }

      const response = await fetch(`/templates/${templateFile}`);
      if (!response.ok) throw new Error(`Template not found: ${templateFile}`);

      const arrayBuffer = await response.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        nullGetter: () => '',
      });

      doc.render(templateData);
      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      saveAs(out, `${row.name}_GradeCard_${formData.quarterName}.docx`);
    } catch (err) {
      console.error('Error generating grade card:', err);
      alert('Error generating grade card. Ensure template files exist in public/templates/.');
    } finally {
      setGeneratingId(null);
    }
  };

  // ---------- Bulk export grade cards as ZIP ----------
  const generateBulkDocx = async (filterFn, zipFilename, label) => {
    if (!data) return;
    setBulkExporting(label);
    setBulkProgress(0);

    try {
      const allRows = Object.values(data).flat();
      const filtered = allRows.filter(filterFn);

      if (filtered.length === 0) {
        alert(`No students match the "${label}" filter.`);
        return;
      }

      // Pre-fetch both templates
      const [upperResp, quarterResp] = await Promise.all([
        fetch('/templates/Upper Level Grade Card.docx'),
        fetch('/templates/quarter_card_template.docx'),
      ]);

      const upperBuffer = upperResp.ok ? await upperResp.arrayBuffer() : null;
      const quarterBuffer = quarterResp.ok ? await quarterResp.arrayBuffer() : null;

      if (!quarterBuffer) throw new Error('quarter_card_template.docx not found');

      const archive = new JSZip();

      for (let i = 0; i < filtered.length; i++) {
        const row = filtered[i];
        const { templateData, useUpperLevel } = buildRowTemplateData(row);
        const templateBuffer = useUpperLevel && upperBuffer ? upperBuffer : quarterBuffer;

        const docZip = new PizZip(templateBuffer);
        const doc = new Docxtemplater(docZip, {
          paragraphLoop: true,
          linebreaks: true,
          nullGetter: () => '',
        });

        doc.render(templateData);
        const docBuffer = doc.getZip().generate({ type: 'arraybuffer' });
        archive.file(`${row.name}_GradeCard_${formData.quarterName}.docx`, docBuffer);

        setBulkProgress(((i + 1) / filtered.length) * 100);
      }

      const zipBlob = await archive.generateAsync({ type: 'blob' });
      saveAs(zipBlob, zipFilename);
    } catch (err) {
      console.error('Bulk export error:', err);
      alert('Error during bulk export. Ensure template files exist in public/templates/.');
    } finally {
      setBulkExporting(null);
      setBulkProgress(0);
    }
  };

  const handleBulkUpperLevel = () => {
    setExportMenuOpen(false);
    generateBulkDocx(
      (row) => { const gl = parseInt(row.grade, 10); return gl >= 9 && gl <= 12; },
      `UpperLevel_GradeCards_${formData.quarterName}_${formData.schoolYear}.zip`,
      'Upper Level (9-12)',
    );
  };

  const handleBulkElementary = () => {
    setExportMenuOpen(false);
    generateBulkDocx(
      (row) => { const gl = parseInt(row.grade, 10); return isNaN(gl) || gl < 9; },
      `Elementary_GradeCards_${formData.quarterName}_${formData.schoolYear}.zip`,
      'Elementary/MS (K-8)',
    );
  };

  const handleBulkUnit = (unitName) => {
    setExportMenuOpen(false);
    generateBulkDocx(
      (row) => row.unitName === unitName,
      `${unitName}_GradeCards_${formData.quarterName}_${formData.schoolYear}.zip`,
      unitName,
    );
  };

  // ---------- Save all rows to DB ----------
  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setSaveStatus('');
    try {
      const allRows = Object.values(data).flat();
      const promises = [];

      allRows.forEach(row => {
        if (!row.studentId) return;

        const subjects = [
          { prefix: 'eng', subjectArea: 'English', course: row.engCourse, grade: row.engGrade, pct: row.engPct, cred: row.engCred },
          { prefix: 'math', subjectArea: 'Math', course: row.mathCourse, grade: row.mathGrade, pct: row.mathPct, cred: row.mathCred },
          { prefix: 'sci', subjectArea: 'Science', course: row.sciCourse, grade: row.sciGrade, pct: row.sciPct, cred: row.sciCred },
          { prefix: 'soc', subjectArea: 'Social Studies', course: row.socCourse, grade: row.socGrade, pct: row.socPct, cred: row.socCred },
          { prefix: 'elec1', subjectArea: 'Elective', course: row.elec1Course, grade: row.elec1Grade, pct: '', cred: row.elec1Cred },
          { prefix: 'elec2', subjectArea: 'Elective', course: row.elec2Course, grade: row.elec2Grade, pct: '', cred: row.elec2Cred },
        ];

        subjects.forEach(s => {
          if (!s.course && !s.grade) return;
          promises.push(databaseService.saveCourseGrade({
            id: `${row.studentId}-manual-${s.prefix}`,
            studentId: row.studentId,
            courseId: `manual-${s.prefix}`,
            courseName: s.course || '',
            subjectArea: s.subjectArea,
            teacherName: '',
            letterGrade: s.grade || '',
            percentage: s.pct ? parseFloat(s.pct) : null,
            credits: s.cred ? parseFloat(s.cred) : null,
            term: formData.schoolYear || '',
            status: 'Active',
          }));
        });
      });

      await Promise.all(promises);
      setSaveStatus('Saved!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error('Error saving spreadsheet:', err);
      setSaveStatus('Error!');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  // ---------- Refresh with feedback ----------
  const handleRefresh = async () => {
    await loadData();
    setRefreshMsg('Refreshed!');
    setTimeout(() => setRefreshMsg(''), 2000);
  };

  // ---------- Download as XLSX ----------
  const handleDownload = async () => {
    if (!data) return;
    setDownloading(true);

    try {
      const units = UNIT_ORDER.filter(u => data[u]?.length > 0);
      Object.keys(data).forEach(u => { if (!units.includes(u) && data[u]?.length > 0) units.push(u); });

      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Grades');

      // Title row
      ws.addRow([`${formData.quarterName} Grade Spreadsheet ${formData.schoolYear}`]);
      ws.addRow([]); // spacer

      // Column headers
      ws.addRow(COLUMNS.map(c => c.label));

      units.forEach(unitName => {
        // Unit header
        ws.addRow([`${unitName} (${data[unitName].length})`]);

        data[unitName].forEach(r => {
          ws.addRow(COLUMNS.map(c => {
            const val = r[c.key] || '';
            if (c.isPct && val) return `${val}%`;
            return val;
          }));
        });

        ws.addRow([]); // spacer between units
      });

      // Basic column widths
      ws.columns = COLUMNS.map(c => ({ width: c.label.length < 8 ? 8 : c.label.length + 4 }));
      // Make first col (name) wider
      ws.getColumn(1).width = 24;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${formData.quarterName}_GradeSpreadsheet_${formData.schoolYear}.xlsx`);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to generate spreadsheet. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // ---------- Render helpers ----------
  const gridTemplate = COLUMNS.map(c => c.width).join(' ') + ' 40px';

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
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40"
              title="Reload data from database"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {refreshMsg || (loading ? 'Refreshing...' : 'Refresh')}
            </button>
            <button
              onClick={handleSave}
              disabled={!data || saving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50"
              title="Save all changes to database"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
              {saving ? 'Saving...' : saveStatus || 'Save to DB'}
            </button>
            <button
              onClick={handleClearAll}
              disabled={loading || !data}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50"
              title="Clear all grades for all students shown"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eraser className="w-3.5 h-3.5" />}
              {loading ? 'Clearing...' : 'Clear All'}
            </button>
  // Clear all grades for all students shown
  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all grades for all students currently shown? This cannot be undone.')) return;
    setLoading(true);
    try {
      const allRows = Object.values(data || {}).flat();
      await Promise.all(allRows.map(async (row) => {
        // Find the student by ID
        const students = await databaseService.getAllStudents();
        const student = students.find(s => s.id === row.studentId);
        if (student && Array.isArray(student.grades)) {
          student.grades = student.grades.map(g => ({ ...g, Q1: '', Q2: '', Q3: '', Q4: '', percentage: '', letterGrade: '' }));
          await databaseService.upsertStudent(student);
        }
      }));
      setSaveStatus('All grades cleared!');
      setData(null); // reload
    } catch (err) {
      alert('Failed to clear grades.');
      console.error('Clear all error:', err);
    } finally {
      setLoading(false);
    }
  };

            {/* Export Cards dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setExportMenuOpen(prev => !prev)}
                disabled={!data || !!bulkExporting}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {bulkExporting
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <FileArchive className="w-3.5 h-3.5" />
                }
                {bulkExporting ? `Exporting...` : 'Export Cards'}
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>
              {exportMenuOpen && !bulkExporting && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50">
                  <button
                    onClick={handleBulkUpperLevel}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    Upper Level (9-12)
                  </button>
                  <button
                    onClick={handleBulkElementary}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    Elementary / MS (K-8)
                  </button>
                  {unitList.length > 0 && (
                    <>
                      <div className="border-t border-slate-100 my-1" />
                      <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">By Unit</div>
                      {unitList.map(u => (
                        <button
                          key={u}
                          onClick={() => handleBulkUnit(u)}
                          className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2"
                        >
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: (UNIT_COLORS[u] || { bg: '#475569' }).bg }} />
                          {u}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

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

        {/* ========== BULK EXPORT PROGRESS ========== */}
        {bulkExporting && (
          <div className="shrink-0 px-6 py-2 bg-indigo-50 border-b border-indigo-100">
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
              <span className="text-xs font-bold text-indigo-700">Exporting {bulkExporting}...</span>
              <div className="flex-1 h-2 bg-indigo-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${bulkProgress}%` }}
                />
              </div>
              <span className="text-xs font-bold text-indigo-600 w-10 text-right">{Math.round(bulkProgress)}%</span>
            </div>
          </div>
        )}

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
                            className={`px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-r border-slate-100 ${col.center ? 'text-center' : ''}`}
                          >
                            {col.label}
                          </div>
                        ))}
                        <div className="px-1 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400" />
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
                                className={`border-r border-slate-100 flex items-center ${col.center ? 'justify-center' : ''}`}
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
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => generateRowDocx(row)}
                              disabled={generatingId === `${row.studentId}-${row.name}`}
                              className="p-1 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                              title="Generate grade card"
                            >
                              {generatingId === `${row.studentId}-${row.name}`
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <FileDown className="w-3.5 h-3.5" />
                              }
                            </button>
                          </div>
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
          <span>Click any cell to edit &middot; <strong className="text-amber-500">Save to DB</strong> to persist or <strong className="text-emerald-600">Download .xlsx</strong> to export</span>
          <span>Tip: Click <FileDown className="w-3 h-3 inline" /> on any row to generate a grade card</span>
        </div>
      </div>
    </div>
  );
};

export default GradeCardPreview;
