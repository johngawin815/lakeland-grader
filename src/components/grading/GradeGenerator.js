import React, { useState, useEffect } from 'react';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { databaseService } from '../../services/databaseService';
import { FileDown, FileSpreadsheet, Printer, FileText, User, BookOpen, Calculator, FlaskConical, Globe, Music, Hash, CloudUpload, CheckCircle, Loader2, Eye, EyeOff, Zap, Users, Info, RefreshCw } from 'lucide-react';
import { useGrading } from '../../context/GradingContext';
import GradeCardPreview from './GradeCardPreview';
import BatchExportModal from './BatchExportModal';

// --- SUBJECT AREA → FORM FIELD MAPPING ---
const SUBJECT_FIELD_MAP = {
  'English': { classField: 'engClass', gradeField: 'engGrade', pctField: 'engPct', creditsField: 'engCredits' },
  'Math': { classField: 'mathClass', gradeField: 'mathGrade', pctField: 'mathPct', creditsField: 'mathCredits' },
  'Science': { classField: 'sciClass', gradeField: 'sciGrade', pctField: 'sciPct', creditsField: 'sciCredits' },
  'Social Studies': { classField: 'socClass', gradeField: 'socGrade', pctField: 'socPct', creditsField: 'socCredits' },
};

// --- COURSE OPTIONS BY CATEGORY ---
const COURSE_OPTIONS = {
  English: [
    'English 6', 'English 7', 'English 8',
    'English 9', 'English 10', 'English 11', 'English 12',
    'Honors English 9', 'Honors English 10', 'AP English Language', 'AP English Literature',
    'Creative Writing', 'Journalism', 'Speech & Debate',
    'Reading Foundations', 'English Language Development',
  ],
  Math: [
    'Math 6', 'Math 7', 'Math 8', 'Pre-Algebra',
    'Algebra I', 'Geometry', 'Algebra II', 'Pre-Calculus',
    'Honors Algebra II', 'Honors Geometry',
    'AP Calculus AB', 'AP Calculus BC', 'AP Statistics',
    'Integrated Math I', 'Integrated Math II', 'Integrated Math III',
    'Consumer Math', 'Financial Literacy',
  ],
  Science: [
    'General Science 6', 'Life Science 7', 'Physical Science 8',
    'Earth Science', 'Biology', 'Chemistry', 'Physics',
    'Honors Biology', 'Honors Chemistry',
    'AP Biology', 'AP Chemistry', 'AP Physics',
    'Environmental Science', 'AP Environmental Science',
    'Anatomy & Physiology', 'Forensic Science',
  ],
  'Social Studies': [
    'Social Studies 6', 'Social Studies 7', 'Civics 8',
    'World Geography', 'World History', 'US History', 'US Government', 'Economics',
    'Honors World History', 'Honors US History',
    'AP World History', 'AP US History', 'AP US Government', 'AP Economics',
    'Psychology', 'AP Psychology', 'Sociology', 'Current Events',
  ],
  Electives: [
    'Art I', 'Art II', 'Art III', 'Ceramics', 'Digital Art',
    'Band', 'Choir', 'Orchestra', 'Music Theory', 'Guitar',
    'Physical Education', 'Health', 'Weightlifting',
    'Spanish I', 'Spanish II', 'French I', 'French II',
    'Computer Science', 'Web Design', 'Digital Media',
    'Family & Consumer Science', 'Wood Shop', 'STEM Lab',
    'Study Skills', 'Career Exploration', 'Leadership',
    'Drama', 'Yearbook', 'Library Aide',
  ],
};

// --- CONFIGURATION ---
const TEMPLATES = {
  quarter: {
    id: 'quarter',
    label: 'Quarter Card',
    filename: 'quarter_card_template.docx',
    hasElectives: true,
    hasTeacher: false,
    hasCredits: true,
    hasGradeLevel: true,
    hasSchoolYear: true
  },
  midterm: {
    id: 'midterm',
    label: 'Mid-Term Report',
    filename: 'midterm_template.docx',
    hasElectives: true,
    hasTeacher: true,
    hasCredits: false,
    hasGradeLevel: false,
    hasSchoolYear: false
  },
  midterm_no_elec: {
    id: 'midterm_no_elec',
    label: 'Mid-Term (No Electives)',
    filename: 'midterm_template_no_electives.docx',
    hasElectives: false,
    hasTeacher: true,
    hasCredits: false,
    hasGradeLevel: false,
    hasSchoolYear: false
  }
};

const GradeGenerator = ({ user, activeStudent }) => {
  // --- STATE ---
  const { gradeCardPayload, clearGradeCardPayload } = useGrading();
  const [selectedTemplate, setSelectedTemplate] = useState('quarter');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [mode, setMode] = useState('full'); // 'full' | 'quick'
  const [showPreview, setShowPreview] = useState(false);
  const [autoFillBanner, setAutoFillBanner] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [aggregationBanner, setAggregationBanner] = useState('');
  const [isFetchingGrades, setIsFetchingGrades] = useState(false);
  const [batchStudents, setBatchStudents] = useState([]);
  const [batchGrades, setBatchGrades] = useState({});
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [xlsxLoading, setXlsxLoading] = useState(false);

  const [formData, setFormData] = useState({
    studentName: activeStudent || '',
    gradeLevel: '',
    schoolYear: '2025-2026',
    quarterName: 'Q3',
    reportDate: new Date().toISOString().split('T')[0],
    teacherName: '',
    totalCredits: '',
    comments: '',

    // Core Classes
    engClass: 'English', engGrade: '', engPct: '', engCredits: '',
    mathClass: 'Math', mathGrade: '', mathPct: '', mathCredits: '',
    sciClass: 'Science', sciGrade: '', sciPct: '', sciCredits: '',
    socClass: 'Social Studies', socGrade: '', socPct: '', socCredits: '',

    // Electives
    elec1Class: '', elec1Grade: '', elec1Pct: '', elec1Credits: '',
    elec2Class: '', elec2Grade: '', elec2Pct: '', elec2Credits: '',
  });

  // Quick mode state
  const [quickData, setQuickData] = useState({
    studentName: activeStudent || '',
    subject: '',
    grade: '',
    comments: '',
  });

  // Auto-populate from gradebook context (uses subjectArea for proper slot mapping)
  useEffect(() => {
    if (gradeCardPayload) {
      const updates = {
        studentName: gradeCardPayload.studentName || '',
        gradeLevel: gradeCardPayload.gradeLevel || '',
        schoolYear: gradeCardPayload.schoolYear || formData.schoolYear,
        quarterName: gradeCardPayload.quarter || formData.quarterName,
        teacherName: gradeCardPayload.teacherName || formData.teacherName,
        comments: gradeCardPayload.generatedComment || formData.comments,
      };

      // Map grade data to the correct slot based on subjectArea
      const subjectArea = gradeCardPayload.subjectArea || '';
      const mapping = SUBJECT_FIELD_MAP[subjectArea];

      if (mapping) {
        updates[mapping.classField] = gradeCardPayload.courseName || '';
        updates[mapping.gradeField] = gradeCardPayload.courseLetterGrade || '';
        updates[mapping.pctField] = gradeCardPayload.coursePercentage ? gradeCardPayload.coursePercentage.toFixed(1) : '';
      } else {
        // Elective or unknown — put in first available elective slot
        updates.elec1Class = gradeCardPayload.courseName || formData.elec1Class;
        updates.elec1Grade = gradeCardPayload.courseLetterGrade || formData.elec1Grade;
        updates.elec1Pct = gradeCardPayload.coursePercentage ? gradeCardPayload.coursePercentage.toFixed(1) : formData.elec1Pct;
      }

      setFormData(prev => ({ ...prev, ...updates }));
      setMode('full');
      setAutoFillBanner(true);
      clearGradeCardPayload();
      setTimeout(() => setAutoFillBanner(false), 5000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeCardPayload, clearGradeCardPayload]);

  // Fetch all cross-course grades for a student
  const fetchAllGrades = async (studentName) => {
    if (!studentName?.trim()) return;

    setIsFetchingGrades(true);
    setAggregationBanner('');

    try {
      // Find student by name
      const students = await databaseService.findStudentByName(studentName.trim());
      if (!students || students.length === 0) {
        setAggregationBanner('No student found with that name.');
        setIsFetchingGrades(false);
        return;
      }

      const student = students[0];
      const enrollments = await databaseService.getStudentEnrollments(student.id);

      if (enrollments.length === 0) {
        setAggregationBanner('No active enrollments found for this student.');
        setIsFetchingGrades(false);
        return;
      }

      // Map enrollments to grade card fields
      const updates = {
        gradeLevel: student.gradeLevel ? String(student.gradeLevel) : formData.gradeLevel,
      };

      let electiveCount = 0;

      enrollments.forEach(enrollment => {
        const subjectArea = enrollment.subjectArea || '';
        const mapping = SUBJECT_FIELD_MAP[subjectArea];

        const courseName = enrollment.courseName || '';
        const letterGrade = enrollment.letterGrade || '';
        const pct = enrollment.percentage != null ? String(enrollment.percentage) : '';
        const credits = enrollment.credits != null ? String(enrollment.credits) : '';

        if (mapping) {
          updates[mapping.classField] = courseName;
          updates[mapping.gradeField] = letterGrade;
          updates[mapping.pctField] = pct;
          updates[mapping.creditsField] = credits;
        } else if (subjectArea === 'Elective' || !mapping) {
          electiveCount++;
          if (electiveCount === 1) {
            updates.elec1Class = courseName;
            updates.elec1Grade = letterGrade;
            updates.elec1Pct = pct;
            updates.elec1Credits = credits;
          } else if (electiveCount === 2) {
            updates.elec2Class = courseName;
            updates.elec2Grade = letterGrade;
            updates.elec2Pct = pct;
            updates.elec2Credits = credits;
          }
        }
      });

      setFormData(prev => ({ ...prev, ...updates }));
      setAggregationBanner(`Aggregated grades from ${enrollments.length} course${enrollments.length !== 1 ? 's' : ''}.`);
      setTimeout(() => setAggregationBanner(''), 8000);

    } catch (error) {
      console.error('Error fetching cross-course grades:', error);
      setAggregationBanner('Failed to fetch grades. Please try again.');
    } finally {
      setIsFetchingGrades(false);
    }
  };

  useEffect(() => {
    if (activeStudent) {
      setFormData(prev => ({ ...prev, studentName: activeStudent }));
      setQuickData(prev => ({ ...prev, studentName: activeStudent }));
    }
  }, [activeStudent]);

  // Auto-sum per-course credits into totalCredits
  useEffect(() => {
    const fields = ['engCredits', 'mathCredits', 'sciCredits', 'socCredits', 'elec1Credits', 'elec2Credits'];
    const sum = fields.reduce((acc, f) => acc + (parseFloat(formData[f]) || 0), 0);
    const rounded = sum > 0 ? sum.toFixed(2).replace(/\.?0+$/, '') : '';
    if (rounded !== formData.totalCredits) {
      setFormData(prev => ({ ...prev, totalCredits: rounded }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.engCredits, formData.mathCredits, formData.sciCredits, formData.socCredits, formData.elec1Credits, formData.elec2Credits]);

  // --- HANDLERS ---

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuickChange = (e) => {
    const { name, value } = e.target;
    setQuickData(prev => ({ ...prev, [name]: value }));
  };

  const getMappedData = () => {
    return {
      student_name: formData.studentName,
      grade_level: formData.gradeLevel,
      school_year: formData.schoolYear,
      quarter_name: formData.quarterName,
      report_date: formData.reportDate,
      teacher_name: formData.teacherName,
      total_credits: formData.totalCredits,
      comments: formData.comments,

      eng_class: formData.engClass, eng_grade: formData.engGrade, eng_pct: formData.engPct, eng_cred: formData.engCredits,
      math_class: formData.mathClass, math_grade: formData.mathGrade, math_pct: formData.mathPct, math_cred: formData.mathCredits,
      sci_class: formData.sciClass, sci_grade: formData.sciGrade, sci_pct: formData.sciPct, sci_cred: formData.sciCredits,
      soc_class: formData.socClass, soc_grade: formData.socGrade, soc_pct: formData.socPct, soc_cred: formData.socCredits,

      elec1_class: formData.elec1Class, elec1_grade: formData.elec1Grade, elec1_pct: formData.elec1Pct, elec1_cred: formData.elec1Credits,
      elec2_class: formData.elec2Class, elec2_grade: formData.elec2Grade, elec2_pct: formData.elec2Pct, elec2_cred: formData.elec2Credits,
    };
  };

  const generateDocx = async () => {
    const templateConfig = TEMPLATES[selectedTemplate];
    setLoading(true);

    try {
      const response = await fetch(`/templates/${templateConfig.filename}`);
      if (!response.ok) throw new Error(`Could not find template: ${templateConfig.filename}`);

      const arrayBuffer = await response.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

      doc.render(getMappedData());

      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      saveAs(out, `${formData.studentName || 'Student'}_${templateConfig.label}.docx`);
    } catch (error) {
      console.error("Error generating document:", error);
      alert("Error generating document. Ensure template files exist in public/templates/.");
    } finally {
      setLoading(false);
    }
  };

  const exportToSpreadsheet = async () => {
    setXlsxLoading(true);
    try {
      const response = await fetch('/templates/grade_spreadsheet.xlsx');
      if (!response.ok) throw new Error('Could not find template: grade_spreadsheet.xlsx');

      const templateBuffer = await response.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(templateBuffer);

      const sheet = workbook.worksheets[0];

      // Update title row with current quarter/year
      sheet.getCell('A1').value = `${formData.quarterName} Grade Spreadsheet ${formData.schoolYear}`;

      // Write student data into the first data row (row 4)
      const row = sheet.getRow(4);
      row.getCell(2).value = formData.studentName;       // B - Name
      row.getCell(3).value = formData.gradeLevel;         // C - Grade Level
      row.getCell(4).value = formData.socClass;            // D - Soc Studies course
      row.getCell(5).value = formData.socGrade;            // E - Soc Studies grade
      row.getCell(6).value = formData.sciClass;            // F - Science course
      row.getCell(7).value = formData.sciGrade;            // G - Science grade
      row.getCell(8).value = formData.mathClass;           // H - Mathematics course
      row.getCell(9).value = formData.mathGrade;           // I - Mathematics grade
      row.getCell(10).value = formData.engClass;           // J - English course
      row.getCell(11).value = formData.engGrade;           // K - English grade
      row.getCell(12).value = formData.elec1Grade || '';   // L - PE / Elective 1 grade
      row.getCell(13).value = formData.elec2Grade || '';   // M - AP / Elective 2 grade
      row.getCell(14).value = formData.studentName;        // N - Name (repeated)
      row.commit();

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${formData.studentName || 'Student'}_GradeSpreadsheet.xlsx`);
    } catch (error) {
      console.error('Error exporting spreadsheet:', error);
      alert('Error exporting spreadsheet. Ensure grade_spreadsheet.xlsx exists in public/templates/.');
    } finally {
      setXlsxLoading(false);
    }
  };

  const saveToCloud = async () => {
    const nameToSave = mode === 'quick' ? quickData.studentName : formData.studentName;
    if (!nameToSave) return alert("Please enter a student name.");

    setSaving(true);
    try {
      const record = mode === 'quick'
        ? {
            ...quickData,
            type: 'grade_report',
            templateType: 'quick',
            submittedBy: user?.email || 'unknown',
            createdAt: new Date().toISOString(),
          }
        : {
            ...formData,
            type: 'grade_report',
            templateType: selectedTemplate,
            submittedBy: user?.email || 'unknown',
            createdAt: new Date().toISOString(),
          };

      await databaseService.addKteaReport(record);

      setSuccessMsg('Saved to Database!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error("Database Error:", error);
      alert("Failed to save to database: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickSave = (e) => {
    e.preventDefault();
    saveToCloud();
  };

  const handlePrint = () => {
    window.print();
  };

  const currentConfig = TEMPLATES[selectedTemplate];

  return (
    <div className="bg-slate-50 p-4 font-sans text-slate-800">

      {/* HEADER & ACTIONS */}
      <div className="max-w-6xl mx-auto mb-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 print:hidden">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Grade Cards
          </h1>
          {mode === 'full' && (
            <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
              {Object.values(TEMPLATES).map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          )}
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          {successMsg && <span className="text-emerald-600 font-bold text-sm flex items-center gap-1 animate-in fade-in"><CheckCircle className="w-4 h-4" /> {successMsg}</span>}

          {/* Mode Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/80">
            <button
              onClick={() => setMode('full')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${mode === 'full' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <BookOpen className="w-4 h-4 inline mr-1.5" />Full
            </button>
            <button
              onClick={() => setMode('quick')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${mode === 'quick' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Zap className="w-4 h-4 inline mr-1.5" />Quick
            </button>
          </div>

          {mode === 'full' && (
            <>
              <button
                onClick={() => fetchAllGrades(formData.studentName)}
                disabled={isFetchingGrades || !formData.studentName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                title="Fetch grades from all enrolled courses"
              >
                {isFetchingGrades ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Fetch All Grades
              </button>

              <button onClick={() => setShowPreview(!showPreview)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all border ${showPreview ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPreview ? 'Hide Preview' : 'Preview'}
              </button>

              <button onClick={async () => {
                setIsBatchLoading(true);
                try {
                  const allStudents = await databaseService.getAllStudents();
                  const active = allStudents.filter(s => s.active !== false);
                  const studentsForBatch = active.map(s => ({
                    id: s.id,
                    name: s.studentName || `${s.firstName || ''} ${s.lastName || ''}`.trim(),
                  }));
                  const gradesMap = {};
                  for (const student of studentsForBatch) {
                    try {
                      const enrollments = await databaseService.getStudentEnrollments(student.id);
                      if (enrollments.length > 0) {
                        const grades = enrollments.filter(e => e.percentage != null);
                        if (grades.length > 0) {
                          const avg = grades.reduce((sum, e) => sum + e.percentage, 0) / grades.length;
                          gradesMap[student.id] = avg;
                        }
                      }
                    } catch { /* skip */ }
                  }
                  setBatchStudents(studentsForBatch);
                  setBatchGrades(gradesMap);
                } catch (err) {
                  console.error('Failed to load batch data:', err);
                } finally {
                  setIsBatchLoading(false);
                }
                setIsBatchModalOpen(true);
              }} disabled={isBatchLoading} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50">
                {isBatchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />} Batch
              </button>

              <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                <Printer className="w-4 h-4" /> Print
              </button>
            </>
          )}

          <button onClick={saveToCloud} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />} Save
          </button>

          {mode === 'full' && (
            <button onClick={generateDocx} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              {loading ? 'Generating...' : 'Download .DOCX'}
            </button>
          )}

          {mode === 'full' && (
            <button onClick={exportToSpreadsheet} disabled={xlsxLoading} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-bold text-sm hover:bg-teal-700 transition-colors shadow-md disabled:opacity-50">
              {xlsxLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              {xlsxLoading ? 'Exporting...' : 'Export .XLSX'}
            </button>
          )}
        </div>
      </div>

      {/* AUTO-FILL BANNER */}
      {autoFillBanner && (
        <div className="max-w-6xl mx-auto mb-4 print:hidden">
          <div className="bg-indigo-50 border border-indigo-200/80 rounded-xl px-5 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <Info className="w-5 h-5 text-indigo-500 shrink-0" />
            <p className="text-sm font-medium text-indigo-800">Auto-filled from gradebook data. Review and edit before exporting.</p>
          </div>
        </div>
      )}

      {/* AGGREGATION BANNER */}
      {aggregationBanner && (
        <div className="max-w-6xl mx-auto mb-4 print:hidden">
          <div className={`rounded-xl px-5 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
            aggregationBanner.startsWith('Aggregated')
              ? 'bg-emerald-50 border border-emerald-200/80'
              : 'bg-amber-50 border border-amber-200/80'
          }`}>
            <Info className={`w-5 h-5 shrink-0 ${aggregationBanner.startsWith('Aggregated') ? 'text-emerald-500' : 'text-amber-500'}`} />
            <p className={`text-sm font-medium ${aggregationBanner.startsWith('Aggregated') ? 'text-emerald-800' : 'text-amber-800'}`}>{aggregationBanner}</p>
          </div>
        </div>
      )}

      {/* QUICK MODE */}
      {mode === 'quick' && (
        <div className="max-w-lg mx-auto print:hidden">
          <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 p-8 rounded-2xl shadow-2xl shadow-slate-200/60">
            <h2 className="text-xl font-extrabold text-slate-800 mb-1 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-500" /> Quick Grade Entry
            </h2>
            <p className="text-sm text-slate-500 mb-6">Fast grade reporting for a single student and subject.</p>

            <form onSubmit={handleQuickSave} className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name</label>
                <input
                  type="text"
                  name="studentName"
                  required
                  value={quickData.studentName}
                  onChange={handleQuickChange}
                  className="p-3 rounded-xl border border-slate-300/80 text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
                  placeholder="e.g. Jane Doe"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                <select
                  name="subject"
                  required
                  value={quickData.subject}
                  onChange={handleQuickChange}
                  className="p-3 rounded-xl border border-slate-300/80 text-sm bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
                >
                  <option value="">-- Select a Subject --</option>
                  <option value="Math">Math</option>
                  <option value="English">English / Language Arts</option>
                  <option value="Science">Science</option>
                  <option value="Social Studies">Social Studies</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Grade (% or Letter)</label>
                <input
                  type="text"
                  name="grade"
                  required
                  value={quickData.grade}
                  onChange={handleQuickChange}
                  className="p-3 rounded-xl border border-slate-300/80 text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
                  placeholder="e.g. 85% or B+"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teacher Comments</label>
                <textarea
                  name="comments"
                  value={quickData.comments}
                  onChange={handleQuickChange}
                  className="p-3 rounded-xl border border-slate-300/80 text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none h-28 resize-y transition-all"
                  placeholder="Notes on student progress..."
                />
              </div>

              <button type="submit" disabled={saving} className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 disabled:opacity-50">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5" />}
                {saving ? 'Saving...' : 'Save Grade'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FULL MODE */}
      {mode === 'full' && (
        <div className={`max-w-6xl mx-auto print:hidden ${showPreview ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}`}>

          {/* FORM */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 space-y-3">
              <section>
                <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2"><User className="w-4 h-4 text-indigo-500" /> Student Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input label="Student Name" name="studentName" value={formData.studentName} onChange={handleChange} placeholder="Jane Doe" />
                  <Input label="Report Date" name="reportDate" type="date" value={formData.reportDate} onChange={handleChange} />
                  <Input label="Quarter" name="quarterName" value={formData.quarterName} onChange={handleChange} placeholder="Q1, Mid-Term..." />
                  {currentConfig.hasGradeLevel && <Input label="Grade Level" name="gradeLevel" value={formData.gradeLevel} onChange={handleChange} placeholder="9" />}
                  {currentConfig.hasSchoolYear && <Input label="School Year" name="schoolYear" value={formData.schoolYear} onChange={handleChange} placeholder="2025-2026" />}
                  {currentConfig.hasTeacher && <Input label="Teacher Name" name="teacherName" value={formData.teacherName} onChange={handleChange} placeholder="Mr. Smith" />}
                  {currentConfig.hasCredits && formData.totalCredits && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Credits</label>
                      <div className="p-2.5 rounded border border-slate-200 text-sm bg-slate-50 text-slate-700 font-bold">{formData.totalCredits}</div>
                    </div>
                  )}
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* LEFT COLUMN: Core Classes */}
                <section>
                  <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4 text-emerald-500" /> Core Classes</h3>
                  {(() => {
                    const showCr = currentConfig.hasCredits;
                    return (
                      <>
                        {showCr && (
                          <div className="flex items-center gap-2 px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <span className="flex-1 pl-6">Course</span>
                            <span className="w-16 text-center">Grade</span>
                            <span className="w-14 text-center">%</span>
                            <span className="w-16 text-center">Credits</span>
                          </div>
                        )}
                        <div className="space-y-1">
                          <ClassRow icon={<BookOpen className="w-4 h-4" />} label="English" prefix="eng" data={formData} onChange={handleChange} category="English" showCredits={showCr} />
                          <ClassRow icon={<Calculator className="w-4 h-4" />} label="Math" prefix="math" data={formData} onChange={handleChange} category="Math" showCredits={showCr} />
                          <ClassRow icon={<FlaskConical className="w-4 h-4" />} label="Science" prefix="sci" data={formData} onChange={handleChange} category="Science" showCredits={showCr} />
                          <ClassRow icon={<Globe className="w-4 h-4" />} label="Social Studies" prefix="soc" data={formData} onChange={handleChange} category="Social Studies" showCredits={showCr} />
                        </div>
                      </>
                    );
                  })()}
                </section>

                {/* RIGHT COLUMN: Electives + Comments */}
                <div className="space-y-3">
                  {currentConfig.hasElectives && (
                    <section>
                      <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2"><Music className="w-4 h-4 text-purple-500" /> Electives</h3>
                      {(() => {
                        const showCr = currentConfig.hasCredits;
                        return (
                          <div className="space-y-1">
                            <ClassRow icon={<Hash className="w-4 h-4" />} label="Elective 1" prefix="elec1" data={formData} onChange={handleChange} isElective category="Electives" showCredits={showCr} />
                            <ClassRow icon={<Hash className="w-4 h-4" />} label="Elective 2" prefix="elec2" data={formData} onChange={handleChange} isElective category="Electives" showCredits={showCr} />
                          </div>
                        );
                      })()}
                    </section>
                  )}

                  <section>
                    <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-orange-500" /> Comments</h3>
                    <textarea name="comments" value={formData.comments} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-y text-sm" placeholder="Enter overall comments..." />
                  </section>
                </div>
              </div>
            </div>
          </div>

          {/* LIVE PREVIEW */}
          {showPreview && (
            <div className="lg:sticky lg:top-6 lg:self-start">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" /> Spreadsheet Preview
              </div>
              <GradeCardPreview formData={formData} />
            </div>
          )}
        </div>
      )}

      {/* PRINT VIEW */}
      <div className="hidden print:block p-8 bg-white">
        <div className="text-center mb-8 border-b-2 border-black pb-4"><h1 className="text-4xl font-bold uppercase tracking-widest mb-2">{currentConfig.label}</h1><p className="text-xl">{formData.studentName} | {formData.quarterName} | {formData.schoolYear}</p></div>
        <div className="grid grid-cols-2 gap-8 mb-8 text-sm"><div><p><strong>Report Date:</strong> {formData.reportDate}</p>{currentConfig.hasTeacher && <p><strong>Teacher:</strong> {formData.teacherName}</p>}{currentConfig.hasGradeLevel && <p><strong>Grade Level:</strong> {formData.gradeLevel}</p>}</div><div className="text-right">{currentConfig.hasCredits && <p><strong>Total Credits:</strong> {formData.totalCredits}</p>}</div></div>
        <table className="w-full border-collapse border border-black mb-8 text-sm"><thead><tr className="bg-gray-200"><th className="border border-black p-2 text-left">Class</th><th className="border border-black p-2 text-center w-24">Grade</th><th className="border border-black p-2 text-center w-24">%</th>{currentConfig.hasCredits && <th className="border border-black p-2 text-center w-24">Credits</th>}</tr></thead><tbody><PrintRow label={formData.engClass} grade={formData.engGrade} pct={formData.engPct} credits={formData.engCredits} showCredits={currentConfig.hasCredits} /><PrintRow label={formData.mathClass} grade={formData.mathGrade} pct={formData.mathPct} credits={formData.mathCredits} showCredits={currentConfig.hasCredits} /><PrintRow label={formData.sciClass} grade={formData.sciGrade} pct={formData.sciPct} credits={formData.sciCredits} showCredits={currentConfig.hasCredits} /><PrintRow label={formData.socClass} grade={formData.socGrade} pct={formData.socPct} credits={formData.socCredits} showCredits={currentConfig.hasCredits} />{currentConfig.hasElectives && <><PrintRow label={formData.elec1Class} grade={formData.elec1Grade} pct={formData.elec1Pct} credits={formData.elec1Credits} showCredits={currentConfig.hasCredits} /><PrintRow label={formData.elec2Class} grade={formData.elec2Grade} pct={formData.elec2Pct} credits={formData.elec2Credits} showCredits={currentConfig.hasCredits} /></>}</tbody></table>
        <div className="border border-black p-4 min-h-[150px]"><h4 className="font-bold uppercase text-xs mb-2 text-gray-500">Teacher Comments</h4><p className="whitespace-pre-wrap">{formData.comments}</p></div>
      </div>

      {/* BATCH EXPORT MODAL */}
      <BatchExportModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        students={batchStudents}
        finalGrades={batchGrades}
        formData={formData}
        templateConfig={currentConfig}
      />
    </div>
  );
};

const Input = ({ label, name, value, onChange, type = "text", placeholder }) => (<div className="flex flex-col gap-1"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label><input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className="p-2.5 rounded border border-slate-200 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" /></div>);
const ClassRow = ({ icon, label, prefix, data, onChange, isElective = false, category, showCredits }) => {
  const options = category ? COURSE_OPTIONS[category] || [] : [];
  const classFieldName = `${prefix}Class`;
  const creditsFieldName = `${prefix}Credits`;
  const currentValue = data[classFieldName] || '';

  return (
    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100">
      <div className="text-slate-400 shrink-0">{icon}</div>
      <select
        name={classFieldName}
        value={options.includes(currentValue) ? currentValue : ''}
        onChange={onChange}
        className="min-w-0 flex-1 bg-white border border-slate-200 rounded-md text-sm font-bold text-slate-700 p-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none truncate"
      >
        <option value="">{`-- ${label} --`}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <input name={`${prefix}Grade`} value={data[`${prefix}Grade`]} onChange={onChange} placeholder="Grade" className="w-16 p-1.5 rounded border border-slate-200 text-xs text-center font-bold focus:border-indigo-500 outline-none" />
      <input name={`${prefix}Pct`} value={data[`${prefix}Pct`]} onChange={onChange} placeholder="%" className="w-14 p-1.5 rounded border border-slate-200 text-xs text-center focus:border-indigo-500 outline-none" />
      {showCredits && (
        <input name={creditsFieldName} value={data[creditsFieldName] || ''} onChange={onChange} placeholder="Cr" type="number" step="0.05" min="0" max="0.99" className="w-16 p-1.5 rounded border border-slate-200 text-xs text-center focus:border-indigo-500 outline-none" />
      )}
    </div>
  );
};
const PrintRow = ({ label, grade, pct, credits, showCredits }) => { if (!label && !grade) return null; return (<tr><td className="border border-black p-2">{label}</td><td className="border border-black p-2 text-center font-bold">{grade}</td><td className="border border-black p-2 text-center text-gray-600">{pct}</td>{showCredits && <td className="border border-black p-2 text-center text-gray-600">{credits}</td>}</tr>); };

export default GradeGenerator;
