import React, { useState, useEffect } from 'react';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import { databaseService } from '../../services/databaseService';
import { FileDown, Printer, FileText, User, BookOpen, Calculator, FlaskConical, Globe, Music, Hash, CloudUpload, CheckCircle, Loader2, Eye, EyeOff, Zap, Users, Info, RefreshCw } from 'lucide-react';
import { useGrading } from '../../context/GradingContext';
import GradeCardPreview from './GradeCardPreview';
import BatchExportModal from './BatchExportModal';

// --- SUBJECT AREA → FORM FIELD MAPPING ---
const SUBJECT_FIELD_MAP = {
  'English': { classField: 'engClass', gradeField: 'engGrade', pctField: 'engPct' },
  'Math': { classField: 'mathClass', gradeField: 'mathGrade', pctField: 'mathPct' },
  'Science': { classField: 'sciClass', gradeField: 'sciGrade', pctField: 'sciPct' },
  'Social Studies': { classField: 'socClass', gradeField: 'socGrade', pctField: 'socPct' },
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
    engClass: 'English', engGrade: '', engPct: '',
    mathClass: 'Math', mathGrade: '', mathPct: '',
    sciClass: 'Science', sciGrade: '', sciPct: '',
    socClass: 'Social Studies', socGrade: '', socPct: '',

    // Electives
    elec1Class: '', elec1Grade: '', elec1Pct: '',
    elec2Class: '', elec2Grade: '', elec2Pct: '',
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
      let totalCredits = 0;

      enrollments.forEach(enrollment => {
        const subjectArea = enrollment.subjectArea || '';
        const mapping = SUBJECT_FIELD_MAP[subjectArea];

        const courseName = enrollment.courseName || '';
        const letterGrade = enrollment.letterGrade || '';
        const pct = enrollment.percentage != null ? String(enrollment.percentage) : '';

        if (mapping) {
          updates[mapping.classField] = courseName;
          updates[mapping.gradeField] = letterGrade;
          updates[mapping.pctField] = pct;
        } else if (subjectArea === 'Elective' || !mapping) {
          electiveCount++;
          if (electiveCount === 1) {
            updates.elec1Class = courseName;
            updates.elec1Grade = letterGrade;
            updates.elec1Pct = pct;
          } else if (electiveCount === 2) {
            updates.elec2Class = courseName;
            updates.elec2Grade = letterGrade;
            updates.elec2Pct = pct;
          }
        }

        if (enrollment.credits) totalCredits += enrollment.credits;
      });

      if (totalCredits > 0) updates.totalCredits = String(totalCredits);

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

      eng_class: formData.engClass, eng_grade: formData.engGrade, eng_pct: formData.engPct,
      math_class: formData.mathClass, math_grade: formData.mathGrade, math_pct: formData.mathPct,
      sci_class: formData.sciClass, sci_grade: formData.sciGrade, sci_pct: formData.sciPct,
      soc_class: formData.socClass, soc_grade: formData.socGrade, soc_pct: formData.socPct,

      elec1_class: formData.elec1Class, elec1_grade: formData.elec1Grade, elec1_pct: formData.elec1Pct,
      elec2_class: formData.elec2Class, elec2_grade: formData.elec2Grade, elec2_pct: formData.elec2Pct,
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
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">

      {/* HEADER & ACTIONS */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600" />
            Grade Cards
          </h1>
          <p className="text-slate-500 mt-1">Select a template, fill in the grades, and export.</p>
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
            <div className="bg-slate-100 p-6 border-b border-slate-200">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Template Type</label>
              <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="w-full md:w-1/2 p-3 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
                {Object.values(TEMPLATES).map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100"><User className="w-5 h-5 text-indigo-500" /> Student Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input label="Student Name" name="studentName" value={formData.studentName} onChange={handleChange} placeholder="Jane Doe" />
                  <Input label="Report Date" name="reportDate" type="date" value={formData.reportDate} onChange={handleChange} />
                  <Input label="Quarter" name="quarterName" value={formData.quarterName} onChange={handleChange} placeholder="Q1, Mid-Term..." />
                  {currentConfig.hasGradeLevel && <Input label="Grade Level" name="gradeLevel" value={formData.gradeLevel} onChange={handleChange} placeholder="9" />}
                  {currentConfig.hasSchoolYear && <Input label="School Year" name="schoolYear" value={formData.schoolYear} onChange={handleChange} placeholder="2025-2026" />}
                  {currentConfig.hasTeacher && <Input label="Teacher Name" name="teacherName" value={formData.teacherName} onChange={handleChange} placeholder="Mr. Smith" />}
                  {currentConfig.hasCredits && <Input label="Total Credits" name="totalCredits" value={formData.totalCredits} onChange={handleChange} placeholder="3.5" />}
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100"><BookOpen className="w-5 h-5 text-emerald-500" /> Core Classes</h3>
                <div className="space-y-3">
                  <ClassRow icon={<BookOpen className="w-4 h-4" />} label="English" prefix="eng" data={formData} onChange={handleChange} />
                  <ClassRow icon={<Calculator className="w-4 h-4" />} label="Math" prefix="math" data={formData} onChange={handleChange} />
                  <ClassRow icon={<FlaskConical className="w-4 h-4" />} label="Science" prefix="sci" data={formData} onChange={handleChange} />
                  <ClassRow icon={<Globe className="w-4 h-4" />} label="Social Studies" prefix="soc" data={formData} onChange={handleChange} />
                </div>
              </section>

              {currentConfig.hasElectives && (
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100"><Music className="w-5 h-5 text-purple-500" /> Electives</h3>
                  <div className="space-y-3">
                    <ClassRow icon={<Hash className="w-4 h-4" />} label="Elective 1" prefix="elec1" data={formData} onChange={handleChange} isElective />
                    <ClassRow icon={<Hash className="w-4 h-4" />} label="Elective 2" prefix="elec2" data={formData} onChange={handleChange} isElective />
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100"><FileText className="w-5 h-5 text-orange-500" /> Comments</h3>
                <textarea name="comments" value={formData.comments} onChange={handleChange} className="w-full p-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-y text-sm" placeholder="Enter overall comments..." />
              </section>
            </div>
          </div>

          {/* LIVE PREVIEW */}
          {showPreview && (
            <div className="lg:sticky lg:top-6 lg:self-start">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" /> Live Preview
              </div>
              <GradeCardPreview formData={formData} templateConfig={currentConfig} />
            </div>
          )}
        </div>
      )}

      {/* PRINT VIEW */}
      <div className="hidden print:block p-8 bg-white">
        <div className="text-center mb-8 border-b-2 border-black pb-4"><h1 className="text-4xl font-bold uppercase tracking-widest mb-2">{currentConfig.label}</h1><p className="text-xl">{formData.studentName} | {formData.quarterName} | {formData.schoolYear}</p></div>
        <div className="grid grid-cols-2 gap-8 mb-8 text-sm"><div><p><strong>Report Date:</strong> {formData.reportDate}</p>{currentConfig.hasTeacher && <p><strong>Teacher:</strong> {formData.teacherName}</p>}{currentConfig.hasGradeLevel && <p><strong>Grade Level:</strong> {formData.gradeLevel}</p>}</div><div className="text-right">{currentConfig.hasCredits && <p><strong>Total Credits:</strong> {formData.totalCredits}</p>}</div></div>
        <table className="w-full border-collapse border border-black mb-8 text-sm"><thead><tr className="bg-gray-200"><th className="border border-black p-2 text-left">Class</th><th className="border border-black p-2 text-center w-24">Grade</th><th className="border border-black p-2 text-center w-24">%</th></tr></thead><tbody><PrintRow label={formData.engClass} grade={formData.engGrade} pct={formData.engPct} /><PrintRow label={formData.mathClass} grade={formData.mathGrade} pct={formData.mathPct} /><PrintRow label={formData.sciClass} grade={formData.sciGrade} pct={formData.sciPct} /><PrintRow label={formData.socClass} grade={formData.socGrade} pct={formData.socPct} />{currentConfig.hasElectives && <><PrintRow label={formData.elec1Class} grade={formData.elec1Grade} pct={formData.elec1Pct} /><PrintRow label={formData.elec2Class} grade={formData.elec2Grade} pct={formData.elec2Pct} /></>}</tbody></table>
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
const ClassRow = ({ icon, label, prefix, data, onChange, isElective = false }) => (<div className="flex flex-col md:flex-row gap-3 items-end md:items-center bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="flex items-center gap-2 w-full md:w-48"><div className="text-slate-400">{icon}</div>{isElective ? <input name={`${prefix}Class`} value={data[`${prefix}Class`]} onChange={onChange} placeholder="Elective Name" className="w-full bg-transparent border-b border-slate-300 focus:border-indigo-500 outline-none text-sm font-bold text-slate-700 pb-1" /> : <span className="text-sm font-bold text-slate-700">{label}</span>}</div><div className="flex gap-2 flex-1 w-full"><div className="flex-1"><input name={`${prefix}Grade`} value={data[`${prefix}Grade`]} onChange={onChange} placeholder="Letter Grade" className="w-full p-2 rounded border border-slate-200 text-xs text-center focus:border-indigo-500 outline-none" /></div><div className="flex-1"><input name={`${prefix}Pct`} value={data[`${prefix}Pct`]} onChange={onChange} placeholder="Percentage" className="w-full p-2 rounded border border-slate-200 text-xs text-center focus:border-indigo-500 outline-none" /></div></div></div>);
const PrintRow = ({ label, grade, pct }) => { if (!label && !grade) return null; return (<tr><td className="border border-black p-2">{label}</td><td className="border border-black p-2 text-center font-bold">{grade}</td><td className="border border-black p-2 text-center text-gray-600">{pct}</td></tr>); };

export default GradeGenerator;
