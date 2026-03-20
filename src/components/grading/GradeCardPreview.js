import { useEffect, useState, useCallback, useRef } from 'react';
import { X, Loader2, Download, RotateCcw, FileDown, CloudUpload, ChevronDown, FileArchive, Eraser, Check, MoreVertical, Edit } from 'lucide-react';
import { databaseService } from '../../services/databaseService';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import JSZip from 'jszip';
import toast from 'react-hot-toast';

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

// localStorage key for remembering last-used bulk export type (Task 7)
const EXPORT_PREF_KEY = 'gradeCardPreview_lastExportType';
const LS_KEY = 'gradeCardPreview_data';
const UNIT_ORDER = Object.keys(UNIT_COLORS);

const GradeCardPreview = ({ formData, onClose, onEditStudent, onCreateCard }) => {
  const [data, setData]                   = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [downloading, setDownloading]     = useState(false);
  const [saving, setSaving]               = useState(false);
  const [generatingId, setGeneratingId]   = useState(null);
  const [bulkExporting, setBulkExporting] = useState(null);
  const [bulkProgress, setBulkProgress]   = useState(0);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef(null);
  const [actionMenuOpenId, setActionMenuOpenId] = useState(null);
  const actionMenuRef = useRef(null);
  const [createCardMenuOpen, setCreateCardMenuOpen] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [gradeCardModalType, setGradeCardModalType] = useState(null);

  // Task 4: per-row save flash state
  const [savedRows, setSavedRows] = useState(new Set());

  // Task 6: active unit tab ('null' = show all)
  const [activeUnitTab, setActiveUnitTab] = useState(null);

  // Task 7: smart default export
  const [lastExportType, setLastExportType] = useState(
    () => localStorage.getItem(EXPORT_PREF_KEY) || 'upper'
  );

  // ---------- Data loading ----------
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const students = await databaseService.getAllStudents();
      const activeStudents = students.filter(s => s.active !== false);
      const mapped = {};

      await Promise.all(activeStudents.map(async (student) => {
        const enrollments = await databaseService.getStudentEnrollments(student.id);
        // Filter by term to map matching school year
        const termEnrollments = enrollments.filter(e => !formData.schoolYear || e.term === formData.schoolYear);

        const getCourse = (area) => termEnrollments.find(e => e.subjectArea === area);
        const eng = getCourse('English') || {};
        const math = getCourse('Math') || {};
        const sci = getCourse('Science') || {};
        const soc = getCourse('Social Studies') || {};

        const electives = termEnrollments.filter(e => e.subjectArea === 'Elective' || !['English', 'Math', 'Science', 'Social Studies'].includes(e.subjectArea));
        const elec1 = electives[0] || {};
        const elec2 = electives[1] || {};

        const unit = student.unitName || 'Unassigned';
        if (!mapped[unit]) mapped[unit] = [];
        
        mapped[unit].push({
          id: student.id,
          studentId: student.id,
          name: student.studentName || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          grade: student.gradeLevel ? String(student.gradeLevel) : '',
          unitName: unit,
          socCourse: soc.courseName || '', socGrade: soc.letterGrade || '', socPct: soc.percentage != null ? String(soc.percentage) : '', socCred: soc.credits != null ? String(soc.credits) : '',
          sciCourse: sci.courseName || '', sciGrade: sci.letterGrade || '', sciPct: sci.percentage != null ? String(sci.percentage) : '', sciCred: sci.credits != null ? String(sci.credits) : '',
          mathCourse: math.courseName || '', mathGrade: math.letterGrade || '', mathPct: math.percentage != null ? String(math.percentage) : '', mathCred: math.credits != null ? String(math.credits) : '',
          engCourse: eng.courseName || '', engGrade: eng.letterGrade || '', engPct: eng.percentage != null ? String(eng.percentage) : '', engCred: eng.credits != null ? String(eng.credits) : '',
          elec1Course: elec1.courseName || '', elec1Grade: elec1.letterGrade || '', elec1Pct: elec1.percentage != null ? String(elec1.percentage) : '', elec1Cred: elec1.credits != null ? String(elec1.credits) : '',
          elec2Course: elec2.courseName || '', elec2Grade: elec2.letterGrade || '', elec2Pct: elec2.percentage != null ? String(elec2.percentage) : '', elec2Cred: elec2.credits != null ? String(elec2.credits) : '',
        });
      }));

      Object.keys(mapped).forEach(unit => {
        mapped[unit].sort((a, b) => a.name.localeCompare(b.name));
      });

      setData(mapped);
    } catch (err) {
      console.error('Error loading spreadsheet data:', err);
      setError('Failed to load student data.');
    } finally {
      setLoading(false);
    }
  }, [formData.schoolYear]);

  useEffect(() => { if (!data) loadData(); }, [data, loadData]);

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

  // Close row action menu on outside click
  useEffect(() => {
    const h = (e) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        setActionMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { if (!data) loadData(); }, [data, loadData]);

  // Persist to localStorage whenever data changes
  useEffect(() => {
    if (data) {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
      localStorage.setItem('gradebook_last_saved', new Date().toLocaleTimeString());
    }
  }, [data]);

  // ---------- Inline edit with per-row save flash (Task 4) ----------
  const handleCellChange = (unitName, rowIdx, key, value) => {
    const rowKey = `${unitName}-${rowIdx}`;
    setData(prev => {
      const next = { ...prev };
      next[unitName] = [...prev[unitName]];
      next[unitName][rowIdx] = { ...next[unitName][rowIdx], [key]: value };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      localStorage.setItem('gradebook_last_saved', new Date().toLocaleTimeString());
      return next;
    });
    // Flash the row green for 2 s
    setSavedRows(prev => new Set([...prev, rowKey]));
    setTimeout(() => {
      setSavedRows(prev => {
        const next = new Set(prev);
        next.delete(rowKey);
        return next;
      });
    }, 2000);
  };

  // ---------- Generate grade card for a single row ----------
  const buildRowTemplateData = (row) => {
    const gl = parseInt(row.grade, 10);
    const useUpperLevel = gl >= 9 && gl <= 12;
    const useElementary = gl >= 1 && gl <= 5;
    const qMap = { Q1: 'q1', Q2: 'q2', Q3: 'q3', Q4: 'q4', Summer: 'q5' };
    const qPrefix = qMap[formData.quarterName] || 'q1';
    const qNum = (formData.quarterName || 'Q1').replace('Q', '');

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
        { course: row.engCourse,  grade: row.engGrade,  cred: row.engCred,  area: 'English',       row: 1 },
        { course: row.mathCourse, grade: row.mathGrade, cred: row.mathCred, area: 'Math',          row: 2 },
        { course: row.sciCourse,  grade: row.sciGrade,  cred: row.sciCred,  area: 'Science',       row: 3 },
        { course: row.socCourse,  grade: row.socGrade,  cred: row.socCred,  area: 'Social Studies', row: 4 },
        { course: row.elec1Course, grade: row.elec1Grade, cred: row.elec1Cred, area: 'Elective',   row: 5 },
        { course: row.elec2Course, grade: row.elec2Grade, cred: row.elec2Cred, area: 'Elective',   row: 6 },
      ];
      subjects.forEach(s => {
        templateData[`${qPrefix}_r${s.row}_course`]     = s.course || '';
        templateData[`${qPrefix}_r${s.row}_grade`]      = s.grade || '';
        templateData[`${qPrefix}_r${s.row}_credits`]    = s.cred || getAutoCredits(s.grade);
        templateData[`${qPrefix}_r${s.row}_instructor`] = getInstructor(unit, s.area);
      });
      return { templateData, useUpperLevel, useElementary };
    } else if (useElementary) {
      const templateData = {
        student_name: row.name,
        grade_level: row.grade,
        school_year: formData.schoolYear || '',
        teacher: '',
        admit_date: '',
        discharge_date: '',
      };
      templateData[`q${qNum}_subj1`] = row.engGrade || '';
      templateData[`q${qNum}_subj2`] = row.mathGrade || '';
      templateData[`q${qNum}_subj3`] = row.sciGrade || '';
      templateData[`q${qNum}_subj4`] = row.socGrade || '';
      templateData[`q${qNum}_subj5`] = row.elec1Grade || ''; // PE

      for (let b = 1; b <= 22; b++) {
        templateData[`q${qNum}_beh${b}`] = (row.engGrade || row.mathGrade) ? 'S' : '';
      }
      return { templateData, useUpperLevel: false, useElementary: true };
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
        eng_class:  row.engCourse,  eng_grade:  row.engGrade,  eng_pct:  row.engPct,  eng_cred:  row.engCred  || getAutoCredits(row.engGrade),
        math_class: row.mathCourse, math_grade: row.mathGrade, math_pct: row.mathPct, math_cred: row.mathCred || getAutoCredits(row.mathGrade),
        sci_class:  row.sciCourse,  sci_grade:  row.sciGrade,  sci_pct:  row.sciPct,  sci_cred:  row.sciCred  || getAutoCredits(row.sciGrade),
        soc_class:  row.socCourse,  soc_grade:  row.socGrade,  soc_pct:  row.socPct,  soc_cred:  row.socCred  || getAutoCredits(row.socGrade),
        elec1_class: row.elec1Course, elec1_grade: row.elec1Grade, elec1_pct: '', elec1_cred: row.elec1Cred || getAutoCredits(row.elec1Grade),
        elec2_class: row.elec2Course, elec2_grade: row.elec2Grade, elec2_pct: '', elec2_cred: row.elec2Cred || getAutoCredits(row.elec2Grade),
      };
      return { templateData, useUpperLevel: false, useElementary: false };
    }
  };

  const generateRowDocx = async (row) => {
    const rowKey = `${row.studentId}-${row.name}`;
    setGeneratingId(rowKey);
    try {
      const { templateData, useUpperLevel, useElementary } = buildRowTemplateData(row);
      let templateFile = 'quarter_card_template.docx';
      if (useUpperLevel) {
        templateFile = 'Upper Level Grade Card.docx';
      } else if (useElementary) {
        templateFile = 'grade_card_elementary_grand.docx';
      }

      const response = await fetch(`/templates/${templateFile}`);
      if (!response.ok) throw new Error(`Template not found: ${templateFile}`);

      const arrayBuffer = await response.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, nullGetter: () => '' });
      doc.render(templateData);
      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      saveAs(out, `${row.name}_GradeCard_${formData.quarterName}.docx`);
    } catch (err) {
      console.error('Error generating grade card:', err);
      toast.error('Error generating grade card. Ensure template files exist in public/templates/.');
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
        toast.error(`No students match the "${label}" filter.`);
        return;
      }

      const [upperResp, quarterResp, elemResp] = await Promise.all([
        fetch('/templates/Upper Level Grade Card.docx'),
        fetch('/templates/quarter_card_template.docx'),
        fetch('/templates/grade_card_elementary_grand.docx'),
      ]);
      const upperBuffer   = upperResp.ok   ? await upperResp.arrayBuffer()   : null;
      const quarterBuffer = quarterResp.ok ? await quarterResp.arrayBuffer() : null;
      const elemBuffer    = elemResp.ok    ? await elemResp.arrayBuffer()    : null;
      if (!quarterBuffer) throw new Error('quarter_card_template.docx not found');

      const archive = new JSZip();
      for (let i = 0; i < filtered.length; i++) {
        const row = filtered[i];
        const { templateData, useUpperLevel, useElementary } = buildRowTemplateData(row);
        
        const templateBuffer = (useUpperLevel && upperBuffer) ? upperBuffer : (useElementary && elemBuffer) ? elemBuffer : quarterBuffer;
        const docZip = new PizZip(templateBuffer);
        const doc = new Docxtemplater(docZip, { paragraphLoop: true, linebreaks: true, nullGetter: () => '' });
        doc.render(templateData);
        const docBuffer = doc.getZip().generate({ type: 'arraybuffer' });
        archive.file(`${row.name}_GradeCard_${formData.quarterName}.docx`, docBuffer);
        setBulkProgress(((i + 1) / filtered.length) * 100);
        
        // Yield to the main thread so React can paint the progress bar
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      const zipBlob = await archive.generateAsync({ type: 'blob' });
      saveAs(zipBlob, zipFilename);
    } catch (err) {
      console.error('Bulk export error:', err);
      toast.error('Error during bulk export. Ensure template files exist in public/templates/.');
    } finally {
      setBulkExporting(null);
      setBulkProgress(0);
    }
  };

  // ---------- Bulk export handlers (Task 7: save pref after each) ----------
  const handleBulkUpperLevel = () => {
    setExportMenuOpen(false);
    localStorage.setItem(EXPORT_PREF_KEY, 'upper');
    setLastExportType('upper');
    generateBulkDocx(
      (row) => { const gl = parseInt(row.grade, 10); return gl >= 9 && gl <= 12; },
      `UpperLevel_GradeCards_${formData.quarterName}_${formData.schoolYear}.zip`,
      'Upper Level (9-12)',
    );
  };

  const handleBulkElementary = () => {
    setExportMenuOpen(false);
    localStorage.setItem(EXPORT_PREF_KEY, 'elementary');
    setLastExportType('elementary');
    generateBulkDocx(
      (row) => { const gl = parseInt(row.grade, 10); return isNaN(gl) || gl < 9; },
      `Elementary_GradeCards_${formData.quarterName}_${formData.schoolYear}.zip`,
      'Elementary/MS (K-8)',
    );
  };

  const handleBulkUnit = (unitName) => {
    setExportMenuOpen(false);
    localStorage.setItem(EXPORT_PREF_KEY, unitName);
    setLastExportType(unitName);
    generateBulkDocx(
      (row) => row.unitName === unitName,
      `${unitName}_GradeCards_${formData.quarterName}_${formData.schoolYear}.zip`,
      unitName,
    );
  };

  // Task 7: invoke the last-used export type with one click
  const handleSmartExport = () => {
    if (!data || bulkExporting) return;
    if (lastExportType === 'upper')       handleBulkUpperLevel();
    else if (lastExportType === 'elementary') handleBulkElementary();
    else if (unitList.includes(lastExportType)) handleBulkUnit(lastExportType);
    else handleBulkUpperLevel();
  };

  const getSmartExportLabel = () => {
    if (lastExportType === 'upper')       return 'Upper Level (9-12)';
    if (lastExportType === 'elementary')  return 'Elementary / MS (K-8)';
    if (data && unitList.includes(lastExportType)) return lastExportType;
    return 'Export Cards';
  };

  const handleOpenGradeCardModal = (type) => {
    setCreateCardMenuOpen(false);
    setGradeCardModalType(type);
  };

  // eslint-disable-next-line no-unused-vars
  const handleCloseGradeCardModal = () => {
    setGradeCardModalType(null);
  };

  // ---------- Save all rows to DB ----------
  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const allRows = Object.values(data).flat();
      const promises = [];
      allRows.forEach(row => {
        if (!row.studentId) return;
        const subjects = [
          { prefix: 'eng',   subjectArea: 'English',       course: row.engCourse,   grade: row.engGrade,   pct: row.engPct,   cred: row.engCred   },
          { prefix: 'math',  subjectArea: 'Math',           course: row.mathCourse,  grade: row.mathGrade,  pct: row.mathPct,  cred: row.mathCred  },
          { prefix: 'sci',   subjectArea: 'Science',        course: row.sciCourse,   grade: row.sciGrade,   pct: row.sciPct,   cred: row.sciCred   },
          { prefix: 'soc',   subjectArea: 'Social Studies', course: row.socCourse,   grade: row.socGrade,   pct: row.socPct,   cred: row.socCred   },
          { prefix: 'elec1', subjectArea: 'Elective',       course: row.elec1Course, grade: row.elec1Grade, pct: '',           cred: row.elec1Cred },
          { prefix: 'elec2', subjectArea: 'Elective',       course: row.elec2Course, grade: row.elec2Grade, pct: '',           cred: row.elec2Cred },
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
      toast.success('Saved!');
    } catch (err) {
      console.error('Error saving spreadsheet:', err);
      toast.error('Error saving spreadsheet!');
    } finally {
      setSaving(false);
    }
  };

  // ---------- Refresh ----------
  const handleRefresh = async () => {
    await loadData();
    toast.success('Refreshed!');
  };

  // ---------- Clear all grades ----------
  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all grades for all students currently shown? This cannot be undone.')) return;
    setLoading(true);
    try {
      const allRows = Object.values(data || {}).flat();
      await Promise.all(allRows.map(async (row) => {
        const students = await databaseService.getAllStudents();
        const student = students.find(s => s.id === row.studentId);
        if (student && Array.isArray(student.grades)) {
          student.grades = student.grades.map(g => ({ ...g, Q1: '', Q2: '', Q3: '', Q4: '', percentage: '', letterGrade: '' }));
          await databaseService.upsertStudent(student);
        }
      }));
      toast.success('All grades cleared!');
      setData(null);
    } catch (err) {
      toast.error('Failed to clear grades.');
      console.error('Clear all error:', err);
    } finally {
      setLoading(false);
    }
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
      ws.addRow([`${formData.quarterName} Grade Spreadsheet ${formData.schoolYear}`]);
      ws.addRow([]);
      ws.addRow(COLUMNS.map(c => c.label));

      units.forEach(unitName => {
        ws.addRow([`${unitName} (${data[unitName].length})`]);
        data[unitName].forEach(r => {
          ws.addRow(COLUMNS.map(c => {
            const val = r[c.key] || '';
            if (c.isPct && val) return `${val}%`;
            return val;
          }));
        });
        ws.addRow([]);
      });

      ws.columns = COLUMNS.map(c => ({ width: c.label.length < 8 ? 8 : c.label.length + 4 }));
      ws.getColumn(1).width = 24;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${formData.quarterName}_GradeSpreadsheet_${formData.schoolYear}.xlsx`);
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to generate spreadsheet. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // ---------- Derived values ----------
  const gridTemplate = COLUMNS.map(c => c.width).join(' ') + ' 40px';
  const totalStudents = data ? Object.values(data).reduce((s, arr) => s + arr.length, 0) : 0;
  const unitList = data
    ? [...UNIT_ORDER.filter(u => data[u]?.length > 0), ...Object.keys(data).filter(u => !UNIT_ORDER.includes(u) && data[u]?.length > 0)]
    : [];

  // Task 6: units to display based on active tab
  const displayedUnits = activeUnitTab ? [activeUnitTab] : unitList;

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

          {/* Step 1: Add Create Grade Card dropdown/button */}
          <div className="flex items-center gap-2">
            <div className="relative" style={{ marginRight: 12 }}>
              <button
                onClick={() => setCreateCardMenuOpen(prev => !prev)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50"
                title="Create Grade Card"
              >
                Create Grade Card
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {createCardMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50">
                  <button
                    onClick={() => handleOpenGradeCardModal('upper')}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center justify-between"
                  >
                    Upper Level Grade Card (6–12)
                  </button>
                  <button
                    onClick={() => handleOpenGradeCardModal('elementary')}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center justify-between"
                  >
                    Elementary Grade Card (K–5)
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40"
              title="Reload data from database"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button
              onClick={handleSave}
              disabled={!data || saving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
              {saving ? 'Saving…' : 'Save to DB'}
            </button>
            <button
              onClick={handleClearAll}
              disabled={loading || !data}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eraser className="w-3.5 h-3.5" />}
              {loading ? 'Clearing…' : 'Clear All'}
            </button>

            {/* Task 7: Smart default export — split button */}
            <div className="relative flex rounded-lg overflow-hidden shadow-sm" ref={exportMenuRef}>
              <button
                onClick={handleSmartExport}
                disabled={!data || !!bulkExporting}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                title={`Export: ${getSmartExportLabel()}`}
              >
                {bulkExporting
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <FileArchive className="w-3.5 h-3.5" />
                }
                {bulkExporting ? 'Exporting…' : getSmartExportLabel()}
              </button>
              <button
                onClick={() => setExportMenuOpen(prev => !prev)}
                disabled={!data || !!bulkExporting}
                className="px-2 py-1.5 bg-indigo-700 text-white hover:bg-indigo-800 transition-colors border-l border-indigo-800/40 disabled:opacity-50"
                title="More export options"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {exportMenuOpen && !bulkExporting && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50">
                  <button onClick={handleBulkUpperLevel} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center justify-between">
                    Upper Level (9-12)
                    {lastExportType === 'upper' && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                  </button>
                  <button onClick={handleBulkElementary} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center justify-between">
                    Elementary / MS (K-8)
                    {lastExportType === 'elementary' && <Check className="w-3.5 h-3.5 text-indigo-500" />}
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
                          <span className="flex-1">{u}</span>
                          {lastExportType === u && <Check className="w-3.5 h-3.5 text-indigo-500" />}
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
              <span className="text-xs font-bold text-indigo-700">Exporting {bulkExporting}…</span>
              <div className="flex-1 h-2 bg-indigo-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${bulkProgress}%` }} />
              </div>
              <span className="text-xs font-bold text-indigo-600 w-10 text-right">{Math.round(bulkProgress)}%</span>
            </div>
          </div>
        )}

        {/* ========== TASK 6: UNIT TAB STRIP ========== */}
        {data && unitList.length > 1 && (
          <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-200 bg-white overflow-x-auto shrink-0">
            <button
              onClick={() => setActiveUnitTab(null)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeUnitTab === null
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              All Units
            </button>
            {unitList.map(u => {
              const colors = UNIT_COLORS[u] || { bg: '#475569' };
              const isActive = activeUnitTab === u;
              return (
                <button
                  key={u}
                  onClick={() => setActiveUnitTab(u)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  style={isActive ? { background: colors.bg } : {}}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colors.bg }} />
                  {u}
                  <span className={`text-[10px] font-medium ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                    ({data[u]?.length || 0})
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ========== BODY ========== */}
        <div className="flex-1 overflow-auto bg-slate-50 px-5 py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <p className="text-sm font-medium">Loading students…</p>
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
              {displayedUnits.map(unitName => {
                const rows = data[unitName];
                const colors = UNIT_COLORS[unitName] || { bg: '#475569', header: '#1e293b' };

                return (
                  <div key={unitName} className="rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm">
                    {/* Unit header */}
                    <div
                      className="px-4 py-2.5 flex items-center justify-between sticky top-0 z-20"
                      style={{ background: colors.bg }}
                    >
                      <span className="text-white font-semibold text-sm tracking-wide">{unitName}</span>
                      <span className="text-white/70 text-xs font-medium">{rows.length} student{rows.length !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Column headers */}
                    <div className="overflow-x-auto">
                      <div
                        style={{ display: 'grid', gridTemplateColumns: gridTemplate, minWidth: 1200 }}
                        className="bg-slate-50 border-b border-slate-200 sticky top-[44px] z-10"
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
                      {rows.map((row, ri) => {
                        const rowKey = `${unitName}-${ri}`;
                        const justSaved = savedRows.has(rowKey);

                        return (
                          <div
                            key={ri}
                            style={{ display: 'grid', gridTemplateColumns: gridTemplate, minWidth: 1200 }}
                            className={`border-b border-slate-100 last:border-b-0 transition-colors ${
                              justSaved
                                ? 'bg-emerald-50/60'
                                : ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                            } hover:bg-indigo-50/30`}
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
                            {/* Task 4: action column — shows save flash or card-gen button */}
                            <div className="flex items-center justify-center relative">
                              {justSaved ? (
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActionMenuOpenId(actionMenuOpenId === rowKey ? null : rowKey);
                                    }}
                                    className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                                    title="Actions"
                                  >
                                    {generatingId === `${row.studentId}-${row.name}`
                                      ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                                      : <MoreVertical className="w-3.5 h-3.5" />
                                    }
                                  </button>
                                  
                                  {actionMenuOpenId === rowKey && !generatingId && (
                                    <div 
                                      ref={actionMenuRef}
                                      className="absolute right-full top-0 mr-2 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200"
                                    >
                                      <button
                                        onClick={() => { setActionMenuOpenId(null); generateRowDocx(row); }}
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2"
                                      >
                                        <FileDown className="w-3.5 h-3.5" /> Generate Card
                                      </button>
                                      {onEditStudent && (
                                        <button
                                          onClick={() => { setActionMenuOpenId(null); onEditStudent(row); }}
                                          className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2"
                                        >
                                          <Edit className="w-3.5 h-3.5" /> Edit Student
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
