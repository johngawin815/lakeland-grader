import HonorRollCard from './HonorRollCard';
import React, { useState, useEffect } from 'react';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import toast from 'react-hot-toast';
import { z } from 'zod';

import { saveAs } from 'file-saver';
import { databaseService } from '../../services/databaseService';
import { FileDown, Printer, FileText, User, BookOpen, Calculator, FlaskConical, Globe, Music, Hash, CloudUpload, CheckCircle, Loader2, Eye, EyeOff, Users, Info, RefreshCw } from 'lucide-react';
import { useGrading } from '../../context/GradingContext';
import GradeCardPreview from './GradeCardPreview';
import BatchExportModal from './BatchExportModal';
import ElementaryGradeCard from './ElementaryGradeCard';

// --- SUBJECT AREA → FORM FIELD MAPPING ---
const SUBJECT_FIELD_MAP = {
  'English': { classField: 'engClass', gradeField: 'engGrade', pctField: 'engPct', creditsField: 'engCredits', instructorField: 'engInstructor' },
  'Math': { classField: 'mathClass', gradeField: 'mathGrade', pctField: 'mathPct', creditsField: 'mathCredits', instructorField: 'mathInstructor' },
  'Science': { classField: 'sciClass', gradeField: 'sciGrade', pctField: 'sciPct', creditsField: 'sciCredits', instructorField: 'sciInstructor' },
  'Social Studies': { classField: 'socClass', gradeField: 'socGrade', pctField: 'socPct', creditsField: 'socCredits', instructorField: 'socInstructor' },
};

// Instructor lookup: maps (unitName, subjectArea) → instructor name
const INSTRUCTOR_MAP = {
  Harmony:   { Science: 'Ms. Lee', Math: 'Ms. Lee', English: 'Mr. John', 'Social Studies': 'Mr. John' },
  Integrity: { Science: 'Ms. Lee', Math: 'Ms. Lee', English: 'Mr. John', 'Social Studies': 'Mr. John' },
};

const getInstructor = (unitName, subjectArea) =>
  (INSTRUCTOR_MAP[unitName] && INSTRUCTOR_MAP[unitName][subjectArea]) || '';

// A grade of D or higher (>= 60%) earns 0.25 credits per course for Upper Level at quarter end.
const PASSING_GRADES = ['A', 'B', 'C', 'D'];
const getAutoCredits = (letterGrade, pct, gradeLevelStr) => {
  if (!letterGrade && pct === '') return '';
  
  const gl = parseInt(gradeLevelStr, 10);
  const isUpperLevel = (!isNaN(gl) && gl >= 9 && gl <= 12);

  if (isUpperLevel) {
    if (pct !== '') {
      return parseFloat(pct) >= 60 ? '0.25' : '0';
    } else if (letterGrade) {
      const first = String(letterGrade).trim().toUpperCase().charAt(0);
      return PASSING_GRADES.includes(first) ? '0.25' : '0';
    }
  }

  // Fallback for MS or other templates
  const first = String(letterGrade || '').trim().toUpperCase().charAt(0);
  return PASSING_GRADES.includes(first) ? '0.5' : '';
};

// --- COURSE OPTIONS BY CATEGORY ---
const COURSE_OPTIONS = {
  English: [
    'English 6', 'English 7', 'English 8',
    'ELA 9', 'ELA 10', 'ELA 11', 'ELA 12',
    'English 9', 'English 10', 'English 11', 'English 12',
    'Honors English 9', 'Honors English 10', 'AP English Language', 'AP English Literature',
    'Creative Writing', 'Writing', 'Journalism', 'Speech & Debate',
    'Reading Foundations', 'English Language Development',
  ],
  Math: [
    'Math 6', 'Math 7', 'Math 8', 'Pre-Algebra',
    'Integrated Math', 'Algebra 1', 'Algebra I', 'Geometry', 'Algebra 2', 'Algebra II', 'Pre-Calculus',
    'Honors Algebra II', 'Honors Geometry',
    'AP Calculus AB', 'AP Calculus BC', 'AP Statistics',
    'Integrated Math I', 'Integrated Math II', 'Integrated Math III',
    'Consumer Math', 'Financial Literacy', 'Financial Lit',
  ],
  Science: [
    'General Science 6', 'Life Science 7', 'Physical Science 8',
    'Integrated Science', 'Physical Science', 'Earth Science', 'Biology', 'Chemistry', 'Physics',
    'Space Science', 'Ecology',
    'Honors Biology', 'Honors Chemistry',
    'AP Biology', 'AP Chemistry', 'AP Physics',
    'Environmental Science', 'AP Environmental Science',
    'Anatomy & Physiology', 'Forensic Science',
  ],
  'Social Studies': [
    'Social Studies 6', 'Social Studies 7', 'Civics 8',
    'American History', 'World Geography', 'World History', 'US History', 'Civics', 'US Government', 'Economics',
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
    'Drama', 'Yearbook', 'Library Aide', 'Psychology', 'Novels',
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
  },
  upper_level: {
    id: 'upper_level',
    label: 'Upper Level Grade Card',
    filename: 'Upper Level Grade Card.docx',
    hasElectives: true,
    hasTeacher: false,
    hasCredits: true,
    hasGradeLevel: true,
    hasSchoolYear: true,
    hasInstructors: true,
    hasAdmitDischarge: true,
    hasSummerQuarter: true,
  },
  elementary_grand: {
    id: 'elementary_grand',
    label: 'Elementary Grade Card (K-5)',
    filename: 'grade_card_elementary_grand.docx',
    hasElectives: false,
    hasTeacher: true,
    hasCredits: false,
    hasGradeLevel: true,
    hasSchoolYear: true
  }
};

// --- ZOD VALIDATION SCHEMA ---
const pctRefine = (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 120);

const gradeFormSchema = z.object({
  studentName: z.string().trim().min(1, "Student name is required."),
  schoolYear: z.string().regex(/^\d{4}-\d{4}$/, "School year must be in YYYY-YYYY format (e.g., 2025-2026)."),
  quarterName: z.string().min(1, "Quarter is required."),
  reportDate: z.string().refine(val => !isNaN(Date.parse(val)), "Invalid report date."),
  engPct: z.string().optional().refine(pctRefine, "English % must be between 0-120."),
  mathPct: z.string().optional().refine(pctRefine, "Math % must be between 0-120."),
  sciPct: z.string().optional().refine(pctRefine, "Science % must be between 0-120."),
  socPct: z.string().optional().refine(pctRefine, "Social Studies % must be between 0-120."),
  elec1Pct: z.string().optional().refine(pctRefine, "Elective 1 % must be between 0-120."),
  elec2Pct: z.string().optional().refine(pctRefine, "Elective 2 % must be between 0-120."),
}).passthrough();

const GradeGenerator = ({ user, activeStudent }) => {
  // --- STATE ---
  const [showHonorRoll, setShowHonorRoll] = useState(false);
  const [honorRollStudents, setHonorRollStudents] = useState([]);
  const { gradeCardPayload, clearGradeCardPayload } = useGrading();
  const [selectedTemplate, setSelectedTemplate] = useState('quarter');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
    engClass: 'English', engGrade: '', engPct: '', engCredits: '',
    mathClass: 'Math', mathGrade: '', mathPct: '', mathCredits: '',
    sciClass: 'Science', sciGrade: '', sciPct: '', sciCredits: '',
    socClass: 'Social Studies', socGrade: '', socPct: '', socCredits: '',

    // Electives
    elec1Class: '', elec1Grade: '', elec1Pct: '', elec1Credits: '',
    elec2Class: '', elec2Grade: '', elec2Pct: '', elec2Credits: '',

    // Upper Level fields
    admitDate: '',
    dischargeDate: '',
    engInstructor: '', mathInstructor: '', sciInstructor: '', socInstructor: '',
    elec1Instructor: '', elec2Instructor: '',
  });

  // Honor Roll logic: fetch students and filter for all As and/or Bs
  const handleHonorRoll = async () => {
    setShowHonorRoll(true);
    setHonorRollStudents([]);
    try {
      const allStudents = await databaseService.getAllStudents();
      const active = allStudents.filter(s => s.active !== false);
      const honorRoll = [];
      for (const student of active) {
        const enrollments = await databaseService.getStudentEnrollments(student.id);
        // Only consider enrollments for the selected quarter
        const quarter = formData.quarterName;
        const grades = enrollments.filter(e => e.term === formData.schoolYear && e.quarter === quarter && e.letterGrade);
        if (grades.length === 0) continue;
        // All As or Bs
        const allAB = grades.every(e => {
          const g = (e.letterGrade || '').toUpperCase();
          return g.startsWith('A') || g.startsWith('B');
        });
        if (allAB) {
          honorRoll.push({ name: student.studentName || `${student.firstName || ''} ${student.lastName || ''}`.trim(), status: 'All As/Bs' });
        }
      }
      setHonorRollStudents(honorRoll);
    } catch (err) {
      setHonorRollStudents([]);
    }
  };
  useEffect(() => {
    if (gradeCardPayload) {
      // Auto-switch to elementary and let ElementaryGradeCard handle the payload
      const gl = parseInt(gradeCardPayload.gradeLevel, 10);
      if (gl >= 1 && gl <= 5) {
        setSelectedTemplate('elementary_grand');
        return; // Do not clear the payload here; ElementaryGradeCard will pick it up
      }

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
      setAutoFillBanner(true);
      clearGradeCardPayload();
      setTimeout(() => setAutoFillBanner(false), 5000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeCardPayload, clearGradeCardPayload, selectedTemplate]);

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
      const unitName = student.unitName || '';
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
        
        const effectiveGradeLevel = student.gradeLevel ? String(student.gradeLevel) : formData.gradeLevel;
        const credits = enrollment.credits != null ? String(enrollment.credits) : getAutoCredits(letterGrade, pct, effectiveGradeLevel);

        if (mapping) {
          updates[mapping.classField] = courseName;
          updates[mapping.gradeField] = letterGrade;
          updates[mapping.pctField] = pct;
          updates[mapping.creditsField] = credits;
          updates[mapping.instructorField] = getInstructor(unitName, subjectArea);
        } else if (subjectArea === 'Elective' || !mapping) {
          electiveCount++;
          if (electiveCount === 1) {
            updates.elec1Class = courseName;
            updates.elec1Grade = letterGrade;
            updates.elec1Pct = pct;
            updates.elec1Credits = credits;
            updates.elec1Instructor = getInstructor(unitName, subjectArea);
          } else if (electiveCount === 2) {
            updates.elec2Class = courseName;
            updates.elec2Grade = letterGrade;
            updates.elec2Pct = pct;
            updates.elec2Credits = credits;
            updates.elec2Instructor = getInstructor(unitName, subjectArea);
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
    }
  }, [activeStudent]);

  // Auto-select Upper Level template for grades 9-12
  useEffect(() => {
    const gl = parseInt(formData.gradeLevel, 10);
    if (gl >= 9 && gl <= 12) {
      setSelectedTemplate('upper_level');
    } else if (gl >= 1 && gl <= 5) {
      setSelectedTemplate('elementary_grand');
    } else if (gl >= 6 && gl <= 8 && (selectedTemplate === 'upper_level' || selectedTemplate === 'elementary_grand')) {
      setSelectedTemplate('quarter');
    }
  }, [formData.gradeLevel, selectedTemplate]);

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

  const getUpperLevelMappedData = () => {
    const qMap = { Q1: 'q1', Q2: 'q2', Q3: 'q3', Q4: 'q4', Summer: 'q5' };
    const qPrefix = qMap[formData.quarterName] || 'q1';

    const data = {
      student_name: formData.studentName,
      school_year: formData.schoolYear,
      grade: formData.gradeLevel,
      admit_date: formData.admitDate,
      discharge_date: formData.dischargeDate,
    };

    const subjects = [
      { prefix: 'eng', row: 1 },
      { prefix: 'math', row: 2 },
      { prefix: 'sci', row: 3 },
      { prefix: 'soc', row: 4 },
      { prefix: 'elec1', row: 5 },
      { prefix: 'elec2', row: 6 },
    ];

    subjects.forEach(({ prefix, row }) => {
      data[`${qPrefix}_r${row}_credits`] = formData[`${prefix}Credits`] || '';
      data[`${qPrefix}_r${row}_course`] = formData[`${prefix}Class`] || '';
      data[`${qPrefix}_r${row}_grade`] = formData[`${prefix}Grade`] || '';
      data[`${qPrefix}_r${row}_instructor`] = formData[`${prefix}Instructor`] || '';
    });

    return data;
  };

  const generateDocx = async () => {
    try {
      gradeFormSchema.parse(formData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        err.errors.forEach(e => toast.error(e.message));
        return;
      }
    }

    const templateConfig = TEMPLATES[selectedTemplate];
    setLoading(true);

    try {
      const response = await fetch(`/templates/${templateConfig.filename}`);
      if (!response.ok) throw new Error(`Could not find template: ${templateConfig.filename}`);

      const arrayBuffer = await response.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        nullGetter: () => '',
      });

      const data = selectedTemplate === 'upper_level'
        ? getUpperLevelMappedData()
        : getMappedData();
      doc.render(data);

      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      saveAs(out, `${formData.studentName || 'Student'}_${templateConfig.label}.docx`);
    } catch (error) {
      console.error("Error generating document:", error);
      toast.error("Error generating document. Ensure template files exist in public/templates/.");
    } finally {
      setLoading(false);
    }
  };

  const saveToCloud = async () => {
    try {
      gradeFormSchema.parse(formData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        err.errors.forEach(e => toast.error(e.message));
        return;
      }
    }

    const nameToSave = formData.studentName;

    setSaving(true);
    try {
      // --- Persist to Enrollments (same pattern as ClassGradebook) ---
      const students = await databaseService.findStudentByName(nameToSave.trim());
      if (!students || students.length === 0) {
        toast.error('Student not found in database. Please check the name and try again.');
        setSaving(false);
        return;
      }
      const student = students[0];

      const ENROLLMENT_SUBJECTS = [
        { prefix: 'eng', subjectArea: 'English' },
        { prefix: 'math', subjectArea: 'Math' },
        { prefix: 'sci', subjectArea: 'Science' },
        { prefix: 'soc', subjectArea: 'Social Studies' },
        { prefix: 'elec1', subjectArea: 'Elective' },
        { prefix: 'elec2', subjectArea: 'Elective' },
      ];

      const enrollmentPromises = ENROLLMENT_SUBJECTS
        .filter(({ prefix }) => formData[`${prefix}Grade`] || formData[`${prefix}Class`])
        .map(({ prefix, subjectArea }) => {
          const courseId = `manual-${prefix}`;
          return databaseService.saveCourseGrade({
            id: `${student.id}-${courseId}`,
            studentId: student.id,
            courseId,
            courseName: formData[`${prefix}Class`] || '',
            subjectArea,
            teacherName: formData[`${prefix}Instructor`] || user?.name || '',
            letterGrade: formData[`${prefix}Grade`] || '',
            percentage: formData[`${prefix}Pct`] ? parseFloat(formData[`${prefix}Pct`]) : null,
            credits: formData[`${prefix}Credits`] ? parseFloat(formData[`${prefix}Credits`]) : null,
            term: formData.schoolYear || '',
            status: 'Active',
          });
        });

      try {
        await Promise.all(enrollmentPromises);
      } catch (enrollErr) {
        console.error('Error saving enrollments:', enrollErr);
      }

      // --- Also save to KTEA_Reports as audit trail ---
      const record = {
        ...formData,
        type: 'grade_report',
        templateType: selectedTemplate,
        submittedBy: user?.email || 'unknown',
        createdAt: new Date().toISOString(),
      };

      await databaseService.addKteaReport(record);

      toast.success('Saved to Database!');
    } catch (error) {
      console.error("Database Error:", error);
      toast.error("Failed to save to database: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentConfig = TEMPLATES[selectedTemplate];

  const handleOpenBatch = async () => {
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
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans text-slate-800">

      {/* ZONE 1: SLIM HEADER */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-3 print:hidden">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Grade Cards
          </h1>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {Object.values(TEMPLATES)
              .filter(t => {
                if (t.id === 'upper_level') {
                  const gl = parseInt(formData.gradeLevel, 10);
                  return gl >= 9 && gl <= 12;
                }
                return true;
              })
              .map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {/* ZONE 2: SCROLLABLE FORM BODY */}
      <div className="flex-1 overflow-y-auto px-4 py-5 pb-28 print:hidden">
        <div className="max-w-6xl mx-auto space-y-4">

          {/* AUTO-FILL BANNER */}
          {autoFillBanner && (
            <div className="bg-indigo-50 border border-indigo-200/80 rounded-xl px-5 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <Info className="w-5 h-5 text-indigo-500 shrink-0" />
              <p className="text-sm font-medium text-indigo-800">Auto-filled from gradebook data. Review and edit before exporting.</p>
            </div>
          )}

          {/* AGGREGATION BANNER */}
          {aggregationBanner && (
            <div className={`rounded-xl px-5 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
              aggregationBanner.startsWith('Aggregated')
                ? 'bg-emerald-50 border border-emerald-200/80'
                : 'bg-amber-50 border border-amber-200/80'
            }`}>
              <Info className={`w-5 h-5 shrink-0 ${aggregationBanner.startsWith('Aggregated') ? 'text-emerald-500' : 'text-amber-500'}`} />
              <p className={`text-sm font-medium ${aggregationBanner.startsWith('Aggregated') ? 'text-emerald-800' : 'text-amber-800'}`}>{aggregationBanner}</p>
            </div>
          )}

          {/* UNIFIED FORM CARD */}
          {selectedTemplate === 'elementary_grand' ? (
            <div className="flex-1 overflow-hidden relative print:hidden">
              <ElementaryGradeCard user={user} activeStudent={activeStudent || formData.studentName} isEmbedded={true} />
            </div>
          ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100 mb-6">

            {/* Student Information */}
            <div className="p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><User className="w-4 h-4 text-indigo-500" /> Student Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input label="Student Name" name="studentName" value={formData.studentName} onChange={handleChange} placeholder="Jane Doe" />
                <Input label="Report Date" name="reportDate" type="date" value={formData.reportDate} onChange={handleChange} />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quarter</label>
                  <select name="quarterName" value={formData.quarterName} onChange={handleChange} className="p-2.5 rounded border border-slate-200 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
                    <option value="Q1">Q1</option>
                    <option value="Q2">Q2</option>
                    <option value="Q3">Q3</option>
                    <option value="Q4">Q4</option>
                    {currentConfig.hasSummerQuarter && <option value="Summer">Summer Credit Recovery</option>}
                  </select>
                </div>
                {currentConfig.hasGradeLevel && <Input label="Grade Level" name="gradeLevel" value={formData.gradeLevel} onChange={handleChange} placeholder="9" />}
                {currentConfig.hasSchoolYear && <Input label="School Year" name="schoolYear" value={formData.schoolYear} onChange={handleChange} placeholder="2025-2026" />}
                {currentConfig.hasTeacher && <Input label="Teacher Name" name="teacherName" value={formData.teacherName} onChange={handleChange} placeholder="Mr. Smith" />}
                {currentConfig.hasAdmitDischarge && <Input label="Admit Date" name="admitDate" type="date" value={formData.admitDate} onChange={handleChange} />}
                {currentConfig.hasAdmitDischarge && <Input label="Discharge Date" name="dischargeDate" type="date" value={formData.dischargeDate} onChange={handleChange} />}
                {currentConfig.hasCredits && formData.totalCredits && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Credits</label>
                    <div className="p-2.5 rounded border border-slate-200 text-sm bg-slate-50 text-slate-700 font-bold">{formData.totalCredits}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Core Classes + Electives + Comments */}
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* LEFT COLUMN: Core Classes */}
                <section>
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-emerald-500" /> Core Classes</h3>
                  {(() => {
                    const showCr = currentConfig.hasCredits;
                    const showInstr = currentConfig.hasInstructors;
                    return (
                      <>
                        {showCr && (
                          <div className="flex items-center gap-2 px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <span className="flex-1 pl-6">Course</span>
                            <span className="w-16 text-center">Grade</span>
                            <span className="w-14 text-center">%</span>
                            <span className="w-16 text-center">Credits</span>
                            {showInstr && <span className="w-24 text-center">Instructor</span>}
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <ClassRow icon={<BookOpen className="w-4 h-4" />} label="English" prefix="eng" data={formData} onChange={handleChange} category="English" showCredits={showCr} showInstructor={showInstr} />
                          <ClassRow icon={<Calculator className="w-4 h-4" />} label="Math" prefix="math" data={formData} onChange={handleChange} category="Math" showCredits={showCr} showInstructor={showInstr} />
                          <ClassRow icon={<FlaskConical className="w-4 h-4" />} label="Science" prefix="sci" data={formData} onChange={handleChange} category="Science" showCredits={showCr} showInstructor={showInstr} />
                          <ClassRow icon={<Globe className="w-4 h-4" />} label="Social Studies" prefix="soc" data={formData} onChange={handleChange} category="Social Studies" showCredits={showCr} showInstructor={showInstr} />
                        </div>
                      </>
                    );
                  })()}
                </section>

                {/* RIGHT COLUMN: Electives + Comments */}
                <div className="space-y-4">
                  {currentConfig.hasElectives && (
                    <section>
                      <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><Music className="w-4 h-4 text-purple-500" /> Electives</h3>
                      {(() => {
                        const showCr = currentConfig.hasCredits;
                        const showInstr = currentConfig.hasInstructors;
                        return (
                          <div className="space-y-1.5">
                            <ClassRow icon={<Hash className="w-4 h-4" />} label="Elective 1" prefix="elec1" data={formData} onChange={handleChange} isElective category="Electives" showCredits={showCr} showInstructor={showInstr} />
                            <ClassRow icon={<Hash className="w-4 h-4" />} label="Elective 2" prefix="elec2" data={formData} onChange={handleChange} isElective category="Electives" showCredits={showCr} showInstructor={showInstr} />
                          </div>
                        );
                      })()}
                    </section>
                  )}

                  <section>
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-orange-500" /> Comments</h3>
                    <textarea name="comments" value={formData.comments} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-y text-sm" placeholder="Enter overall comments..." />
                  </section>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* ZONE 3: STICKY ACTION FOOTER */}
      {selectedTemplate !== 'elementary_grand' && (
      <div className="shrink-0 sticky bottom-0 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] px-6 py-3 z-20 print:hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">

          {/* Left: Secondary Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAllGrades(formData.studentName)}
              disabled={isFetchingGrades || !formData.studentName.trim()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-40"
              title="Fetch grades from all enrolled courses"
            >
              {isFetchingGrades ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Fetch Grades
            </button>
            <button
              onClick={handleHonorRoll}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Show Honor Roll students"
            >
              <CheckCircle className="w-4 h-4" /> Honor Roll
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              Preview
            </button>
            <button
              onClick={handleOpenBatch}
              disabled={isBatchLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-40"
            >
              {isBatchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              Batch
            </button>
          </div>

          {/* Center: Status (Removed for global toast) */}
          <div className="flex-1 flex justify-center"></div>

          {/* Right: Primary Actions */}
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Printer className="w-4 h-4" /> Print
            </button>

            <div className="w-px h-6 bg-slate-200 mx-1" />

            <button onClick={generateDocx} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              {loading ? 'Generating...' : 'Word'}
            </button>
            <button onClick={saveToCloud} disabled={saving} className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>
      </div>
      )}

      {/* PREVIEW MODAL */}
      {showPreview && (
        <GradeCardPreview formData={formData} onClose={() => setShowPreview(false)} />
      )}
      {showHonorRoll && (
        <HonorRollCard students={honorRollStudents} onClose={() => setShowHonorRoll(false)} />
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
const ClassRow = ({ icon, label, prefix, data, onChange, isElective = false, category, showCredits, showInstructor }) => {
  const options = category ? COURSE_OPTIONS[category] || [] : [];
  const classFieldName = `${prefix}Class`;
  const creditsFieldName = `${prefix}Credits`;
  const instructorFieldName = `${prefix}Instructor`;
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
      {showInstructor && (
        <input name={instructorFieldName} value={data[instructorFieldName] || ''} onChange={onChange} placeholder="Instructor" className="w-24 p-1.5 rounded border border-slate-200 text-xs text-center focus:border-indigo-500 outline-none" />
      )}
    </div>
  );
};
const PrintRow = ({ label, grade, pct, credits, showCredits }) => { if (!label && !grade) return null; return (<tr><td className="border border-black p-2">{label}</td><td className="border border-black p-2 text-center font-bold">{grade}</td><td className="border border-black p-2 text-center text-gray-600">{pct}</td>{showCredits && <td className="border border-black p-2 text-center text-gray-600">{credits}</td>}</tr>); };

export default GradeGenerator;
