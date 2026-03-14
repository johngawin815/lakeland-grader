import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, BookOpen, Flag, TrendingUp, AlertTriangle,
  CheckCircle2, Download, Save, Loader2, UserPlus, GraduationCap, Info, Pencil, Trash2,
  ChevronDown, ChevronRight, ExternalLink, Plus, ClipboardList, XCircle
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { databaseService } from '../../services/databaseService';
import stateGraduationRequirements, { SUBJECT_AREAS } from '../../data/stateGraduationRequirements';
import { useAutoSave } from '../../hooks/useAutoSave';

// ─── HELPERS ────────────────────────────────────────────────────────────────

const isPassing = (grade) => grade && !['F', 'I', '', null, undefined].includes(grade);

/** Return credit value based on term: quarter (Q1–Q4) = 0.25, everything else = 0.5 */
const getTermCredits = (enrollment) => {
  const term = (enrollment.term || '').toUpperCase().trim();
  return /^Q[1-4]$/.test(term) ? 0.25 : 0.5;
};

/** Auto-compute earned credits based on term length and passing grade */
const getEarnedCredits = (enrollment) => {
  const creditValue = getTermCredits(enrollment);
  const pct = parseFloat(enrollment.percentage);
  if (!isNaN(pct) && pct >= 60) return creditValue;
  if (isPassing(enrollment.letterGrade)) return creditValue;
  return 0;
};

/** Deduplicate enrollments by courseId, keeping the best record */
function deduplicateEnrollments(enrollments) {
  const byCourse = {};
  for (const e of enrollments) {
    const key = e.courseId || e.id;
    if (!byCourse[key]) {
      byCourse[key] = e;
    } else {
      const existing = byCourse[key];
      if (!existing.letterGrade && e.letterGrade) {
        byCourse[key] = e;
      } else if (!e.letterGrade && existing.letterGrade) {
        // keep existing
      } else {
        const ed = existing.lastModified || existing.enrollmentDate || '';
        const nd = e.lastModified || e.enrollmentDate || '';
        if (nd > ed) byCourse[key] = e;
      }
    }
  }
  return Object.values(byCourse);
}

function computeCreditsEarned(enrollments) {
  const earned = {};
  for (const area of SUBJECT_AREAS) earned[area] = 0;
  for (const e of enrollments) {
    const area = SUBJECT_AREAS.includes(e.subjectArea) ? e.subjectArea : 'Elective';
    const cr = getEarnedCredits(e);
    if (cr > 0) earned[area] = (earned[area] || 0) + cr;
  }
  return earned;
}

function computeCreditsInProgress(enrollments) {
  const inProgress = {};
  for (const area of SUBJECT_AREAS) inProgress[area] = 0;
  for (const e of enrollments) {
    if (e.status === 'Active' && getEarnedCredits(e) === 0) {
      const area = SUBJECT_AREAS.includes(e.subjectArea) ? e.subjectArea : 'Elective';
      inProgress[area] = (inProgress[area] || 0) + getTermCredits(e);
    }
  }
  return inProgress;
}

function computeGaps(earned, requirements) {
  const gaps = {};
  for (const area of SUBJECT_AREAS) {
    const needed = requirements[area] || 0;
    const have = earned[area] || 0;
    gaps[area] = Math.max(0, needed - have);
  }
  return gaps;
}

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '');
};

// ─── NEW HELPERS ─────────────────────────────────────────────────────────────

const getOnTrackStatus = (gradeLevel, totalEarned) => {
  const thresholds = { 8: 2, 9: 5.5, 10: 11, 11: 16.5, 12: 21 };
  const threshold = thresholds[gradeLevel] ?? 0;
  if (totalEarned >= threshold) return 'on-track';
  if (totalEarned >= threshold - 2) return 'needs-attention';
  return 'at-risk';
};

const getStatePdfUrl = (homeState) =>
  homeState ? `/high_school_grad_requirements/${homeState.toLowerCase()}.pdf` : null;

const calcGradYear = (gradeLevel) => {
  const now = new Date();
  const schoolYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return schoolYear + (12 - gradeLevel);
};

const getPriorityGaps = (gaps, creditsEarned) =>
  SUBJECT_AREAS
    .filter(a => (gaps[a] ?? 0) > 0)
    .sort((a, b) => {
      const aZero = (creditsEarned[a] ?? 0) === 0 ? 0 : 1;
      const bZero = (creditsEarned[b] ?? 0) === 0 ? 0 : 1;
      if (aZero !== bZero) return aZero - bZero;
      return (gaps[b] ?? 0) - (gaps[a] ?? 0);
    });

// ─── COMPACT PROGRESS BAR (kept for Plan tab gap cards) ─────────────────────

const ProgressBar = ({ label, earned, required, inProgress = 0 }) => {
  const pct = required > 0 ? Math.min(100, (earned / required) * 100) : 100;
  const pctWithIp = required > 0 ? Math.min(100, ((earned + inProgress) / required) * 100) : 100;
  const gap = Math.max(0, required - earned);
  const color = pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const ipColor = pct >= 100 ? 'bg-emerald-200' : pct >= 50 ? 'bg-amber-200' : 'bg-red-200';

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500">{earned}/{required}</span>
          {gap > 0 && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1 py-0.5 rounded">-{gap}</span>}
          {gap === 0 && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
        </div>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full relative" style={{ width: `${pctWithIp}%` }}>
          <div className={`absolute inset-0 ${ipColor} rounded-full`} />
          <div className={`absolute inset-y-0 left-0 ${color} rounded-full`} style={{ width: pct > 0 ? `${(pct / pctWithIp) * 100}%` : '0%' }} />
        </div>
      </div>
    </div>
  );
};

// ─── DONUT CHART (overall progress ring) ────────────────────────────────────

const DonutChart = ({ earned, total }) => {
  const pct = total > 0 ? Math.min(100, (earned / total) * 100) : 0;
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 100 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <svg width="76" height="76" viewBox="0 0 76 76">
        <circle cx="38" cy="38" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="5" />
        <circle cx="38" cy="38" r={radius} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 38 38)"
          className="transition-all duration-700" />
        <text x="38" y="36" textAnchor="middle" className="text-sm font-extrabold" fill="#1e293b">{Math.round(pct)}%</text>
        <text x="38" y="48" textAnchor="middle" className="text-[8px] font-semibold" fill="#94a3b8">complete</text>
      </svg>
      <p className="text-[10px] font-bold text-slate-500 mt-0.5">{earned}/{total} credits</p>
    </div>
  );
};

// ─── NEW SUB-COMPONENTS ──────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const config = {
    'on-track':        { bg: 'bg-green-100', text: 'text-green-700',  border: 'border-green-200',  label: 'On Track',        Icon: CheckCircle2 },
    'needs-attention': { bg: 'bg-amber-100', text: 'text-amber-700',  border: 'border-amber-200',  label: 'Needs Attention', Icon: AlertTriangle },
    'at-risk':         { bg: 'bg-red-100',   text: 'text-red-700',    border: 'border-red-200',    label: 'At Risk',         Icon: XCircle },
  };
  const c = config[status] || config['on-track'];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <c.Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
};

const CreditRing = ({ earned, required, size = 64 }) => {
  const strokeWidth = size < 50 ? 4 : 5;
  const r = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const pct = required > 0 ? Math.min(1, earned / required) : 0;
  const offset = circumference - pct * circumference;
  const color = pct >= 1 ? '#10b981' : pct > 0 ? '#f97316' : '#f1f5f9';
  const fontSize = size < 50 ? size * 0.22 : size * 0.18;
  const subFontSize = size < 50 ? size * 0.15 : size * 0.13;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
      <text x={cx} y={cy - 1} textAnchor="middle" fill="#1e293b" fontSize={fontSize} fontWeight="700">{earned}</text>
      <text x={cx} y={cy + subFontSize + 2} textAnchor="middle" fill="#94a3b8" fontSize={subFontSize} fontWeight="600">/{required}</text>
    </svg>
  );
};

const SubjectProgressCard = ({ subject, required, earned, inProgress }) => {
  const met = earned >= required && required > 0;
  const hasIp = inProgress > 0 && !met;
  const neverStarted = !met && !hasIp && earned === 0 && required > 0;
  const borderClass = met ? 'border-green-300' : hasIp ? 'border-amber-300' : neverStarted ? 'border-red-300' : 'border-slate-200';
  const bgClass = met ? 'bg-green-50/40' : hasIp ? 'bg-amber-50/40' : neverStarted ? 'bg-red-50/40' : 'bg-white';
  return (
    <div className={`flex flex-col items-center p-2.5 rounded-xl border ${borderClass} ${bgClass}`}>
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider text-center mb-2 leading-tight">{subject}</p>
      <CreditRing earned={earned} required={required} size={52} />
      <p className="text-[10px] font-semibold text-slate-600 mt-1.5">{earned}/{required} cr</p>
      {hasIp && (
        <span className="mt-1 text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">+{inProgress} in prog.</span>
      )}
      {met && (
        <span className="mt-1 text-[9px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">Met ✓</span>
      )}
    </div>
  );
};

const TabBar = ({ activeTab, onChange }) => {
  const tabs = [
    { id: 'transcript', label: 'Transcript', Icon: BookOpen },
    { id: 'plan',       label: 'Plan',       Icon: ClipboardList },
    { id: 'export',     label: 'Export',     Icon: Download },
  ];
  return (
    <div className="flex border-b border-slate-200 bg-white px-4">
      {tabs.map(({ id, label, Icon }) => (
        <button key={id} onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === id
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}>
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

const TranscriptGenerator = ({ user }) => {

  // --- Existing State ---
  const [allStudents, setAllStudents] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [, setStudentEnrollments] = useState([]);
  const [editedEnrollments, setEditedEnrollments] = useState([]);
  const [removedEnrollmentIds, setRemovedEnrollmentIds] = useState([]);
  const [transcriptDirty, setTranscriptDirty] = useState(false);
  const [savingTranscript, setSavingTranscript] = useState(false);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [planNotes, setPlanNotes] = useState('');
  const [savedPlan, setSavedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // --- New State ---
  const [activeTab, setActiveTab] = useState('transcript');
  const [addingCourseToSubject, setAddingCourseToSubject] = useState(null);
  const [newCourseForm, setNewCourseForm] = useState({ courseId: '', term: '', grade: '', percentage: '', status: 'Active' });
  const [collapsedSubjects, setCollapsedSubjects] = useState(new Set());

  // Auto-save integration
  const saveFn = useCallback(async () => {
    if (!selectedStudent) return;
    for (const enrollment of editedEnrollments) {
      await databaseService.enrollStudent(enrollment);
    }
    for (const id of removedEnrollmentIds) {
      try { await databaseService.unenrollStudent(id); } catch (err) { console.warn('Delete enrollment failed:', id, err); }
    }
    if (user) await databaseService.logAudit(user, 'AutoSaveTranscript', `Auto-saved transcript edits for ${selectedStudent.studentName}`);
    setStudentEnrollments(editedEnrollments.map(e => ({ ...e })));
    setRemovedEnrollmentIds([]);
    setTranscriptDirty(false);
    setSaveMsg('Transcript auto-saved');
    setTimeout(() => setSaveMsg(''), 2000);
  }, [editedEnrollments, removedEnrollmentIds, selectedStudent, user]);

  // eslint-disable-next-line no-unused-vars
  const { saveStatus, lastSavedAt, forceSave } = useAutoSave(transcriptDirty, saveFn, { delay: 3000, enabled: !!selectedStudent });

  // Load students and courses on mount
  useEffect(() => {
    (async () => {
      const [studs, courses] = await Promise.all([
        databaseService.getAllStudents(),
        databaseService.getAllCourses(),
      ]);
      setAllStudents(studs.filter(s => s.active !== false));
      setAllCourses(courses);
    })();
  }, []);

  // --- Select a student ---
  const handleSelectStudent = useCallback(async (student) => {
    setLoading(true);
    setSelectedStudent(student);
    setRecommendedCourses([]);
    setPlanNotes('');
    setSavedPlan(null);
    setSaveMsg('');
    setTranscriptDirty(false);
    setRemovedEnrollmentIds([]);
    setActiveTab('transcript');
    setAddingCourseToSubject(null);
    setCollapsedSubjects(new Set());
    try {
      const [enrollments, masterGrades, plan] = await Promise.all([
        databaseService.getStudentEnrollments(student.id),
        databaseService.getStudentMasterGrades(student.id),
        databaseService.getTranscriptPlanByStudent(student.id),
      ]);
      const merged = masterGrades.length > 0 ? masterGrades : enrollments;
      const deduped = deduplicateEnrollments(merged);
      const withCredits = deduped.map(e => ({ ...e, credits: getEarnedCredits(e) }));
      setStudentEnrollments(withCredits);
      setEditedEnrollments(withCredits.map(e => ({ ...e })));
      if (plan) {
        setSavedPlan(plan);
        setRecommendedCourses(plan.recommendedCourses || []);
        setPlanNotes(plan.notes || '');
      }
    } catch (e) {
      console.error('Failed to load student data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Inline editing ---
  const handleEditField = (enrollmentId, field, value) => {
    setEditedEnrollments(prev => prev.map(e => {
      if (e.id !== enrollmentId) return e;
      const newE = { ...e, [field]: value };
      if (field === 'letterGrade' || field === 'percentage') newE.credits = getEarnedCredits(newE);
      return newE;
    }));
    setTranscriptDirty(true);
  };

  const handleDeleteEnrollment = (enrollmentId, courseName) => {
    if (!window.confirm(`Remove "${courseName}" from the transcript?`)) return;
    setRemovedEnrollmentIds(prev => [...prev, enrollmentId]);
    setEditedEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
    setTranscriptDirty(true);
  };

  const handleSaveTranscript = async () => {
    setSavingTranscript(true);
    setSaveMsg('');
    try {
      for (const enrollment of editedEnrollments) await databaseService.enrollStudent(enrollment);
      for (const id of removedEnrollmentIds) {
        try { await databaseService.unenrollStudent(id); } catch (err) { console.warn('Delete enrollment failed:', id, err); }
      }
      if (user) await databaseService.logAudit(user, 'SaveTranscript', `Saved transcript edits for ${selectedStudent.studentName}`);
      setStudentEnrollments(editedEnrollments.map(e => ({ ...e })));
      setRemovedEnrollmentIds([]);
      setTranscriptDirty(false);
      setSaveMsg('Transcript saved');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e) {
      console.error('Save transcript failed:', e);
      setSaveMsg('Save failed');
    } finally {
      setSavingTranscript(false);
    }
  };

  // --- Computed values ---
  const stateReqs = selectedStudent?.homeState ? stateGraduationRequirements[selectedStudent.homeState] : null;
  const creditsEarned = useMemo(() => computeCreditsEarned(editedEnrollments), [editedEnrollments]);
  const creditsInProgress = useMemo(() => computeCreditsInProgress(editedEnrollments), [editedEnrollments]);
  const gaps = useMemo(() => stateReqs ? computeGaps(creditsEarned, stateReqs.requirements) : null, [creditsEarned, stateReqs]);
  const totalEarned = useMemo(() => Object.values(creditsEarned).reduce((s, v) => s + v, 0), [creditsEarned]);
  const totalRequired = stateReqs?.totalCredits || 0;
  const allMet = gaps ? Object.values(gaps).every(g => g === 0) && totalEarned >= totalRequired : false;
  const hasGaps = gaps && SUBJECT_AREAS.some(area => (gaps[area] || 0) > 0);

  const enrollmentsBySubject = useMemo(() => {
    const grouped = {};
    for (const area of SUBJECT_AREAS) grouped[area] = [];
    for (const e of editedEnrollments) {
      const area = SUBJECT_AREAS.includes(e.subjectArea) ? e.subjectArea : 'Elective';
      grouped[area].push(e);
    }
    return grouped;
  }, [editedEnrollments]);

  const enrolledCourseIds = useMemo(() => new Set(editedEnrollments.map(e => e.courseId)), [editedEnrollments]);
  const availableCoursesBySubject = useMemo(() => {
    const result = {};
    for (const area of SUBJECT_AREAS) {
      result[area] = allCourses.filter(c => {
        const courseArea = SUBJECT_AREAS.includes(c.subjectArea) ? c.subjectArea : 'Elective';
        return courseArea === area && !enrolledCourseIds.has(c.id);
      });
    }
    return result;
  }, [allCourses, enrolledCourseIds]);

  const filteredStudents = useMemo(() => {
    let list = allStudents;
    if (gradeFilter) list = list.filter(s => String(s.gradeLevel) === gradeFilter);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(s => s.studentName?.toLowerCase().includes(term));
    }
    return list;
  }, [allStudents, gradeFilter, searchTerm]);

  // --- Toggle recommended course ---
  const toggleRecommended = (course) => {
    setRecommendedCourses(prev => {
      const exists = prev.find(c => c.courseId === course.id);
      if (exists) return prev.filter(c => c.courseId !== course.id);
      return [...prev, {
        courseId: course.id, courseName: course.courseName,
        subjectArea: course.subjectArea, credits: course.credits,
        teacherName: course.teacherName, term: course.term,
      }];
    });
  };

  // --- Save Plan ---
  const handleSavePlan = async () => {
    if (!selectedStudent) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const plan = {
        ...(savedPlan || {}),
        studentId: selectedStudent.id,
        studentName: selectedStudent.studentName,
        homeState: selectedStudent.homeState || '',
        stateRequirements: stateReqs?.requirements || {},
        totalRequired,
        creditsEarned,
        gaps,
        recommendedCourses,
        notes: planNotes,
      };
      const saved = await databaseService.saveTranscriptPlan(plan);
      setSavedPlan(saved);
      if (user) await databaseService.logAudit(user, 'SaveTranscriptPlan', `Saved transcript plan for ${selectedStudent.studentName}`);
      setSaveMsg('Plan saved');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e) {
      console.error('Save failed:', e);
      setSaveMsg('Save failed');
    } finally {
      setSaving(false);
    }
  };

  // --- Export to Excel ---
  const handleExport = async () => {
    if (!selectedStudent) return;
    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const ws1 = workbook.addWorksheet('Transcript');
      const orange = 'FFea580c';
      const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: orange } };

      ws1.addRow(['Student Name', selectedStudent.studentName]);
      ws1.addRow(['Grade Level', selectedStudent.gradeLevel]);
      ws1.addRow(['Home State', stateReqs ? stateReqs.name : (selectedStudent.homeState || 'Not set')]);
      ws1.addRow(['District', selectedStudent.district || '']);
      ws1.addRow(['Admit Date', selectedStudent.admitDate || '']);
      ws1.addRow([]);

      const headerRow = ws1.addRow(['Subject Area', 'Course Name', 'Term', 'Grade', 'Credits', 'Status']);
      headerRow.eachCell(cell => { cell.font = headerFont; cell.fill = headerFill; cell.alignment = { horizontal: 'center' }; });

      for (const area of SUBJECT_AREAS) {
        const courses = enrollmentsBySubject[area];
        if (courses.length === 0) continue;
        const subRow = ws1.addRow([area, '', '', '', '', '']);
        subRow.getCell(1).font = { bold: true, size: 11 };
        subRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        for (const e of courses) {
          const cr = getEarnedCredits(e);
          const row = ws1.addRow(['', e.courseName, e.term || '', e.letterGrade || 'In Progress', cr, e.status || '']);
          if (e.letterGrade === 'F') row.getCell(4).font = { color: { argb: 'FFDC2626' }, bold: true };
          else if (isPassing(e.letterGrade)) row.getCell(4).font = { color: { argb: 'FF16a34a' }, bold: true };
          else row.getCell(4).font = { color: { argb: 'FFd97706' }, italic: true };
        }
        const sub = creditsEarned[area] || 0;
        const stRow = ws1.addRow(['', '', '', 'Subtotal:', sub, '']);
        stRow.getCell(4).font = { bold: true }; stRow.getCell(5).font = { bold: true };
      }
      ws1.addRow([]);
      const totRow = ws1.addRow(['', '', '', 'TOTAL CREDITS:', totalEarned, '']);
      totRow.getCell(4).font = { bold: true, size: 12 }; totRow.getCell(5).font = { bold: true, size: 12 };
      ws1.columns = [{ width: 16 }, { width: 28 }, { width: 14 }, { width: 12 }, { width: 10 }, { width: 12 }];

      const ws2 = workbook.addWorksheet('Graduation Plan');
      ws2.addRow(['GRADUATION PLAN — ' + selectedStudent.studentName]);
      ws2.getRow(1).font = { bold: true, size: 14, color: { argb: orange } };
      ws2.addRow([]);

      if (stateReqs) {
        ws2.addRow([`${stateReqs.name} Graduation Requirements`]);
        ws2.getRow(3).font = { bold: true, size: 12 };
        ws2.addRow(['Total Credits Required:', stateReqs.totalCredits]);
        const reqHeader = ws2.addRow(['Subject Area', 'Required', 'Earned', 'In Progress', 'Gap']);
        reqHeader.eachCell(cell => { cell.font = headerFont; cell.fill = headerFill; cell.alignment = { horizontal: 'center' }; });
        for (const area of SUBJECT_AREAS) {
          const req = stateReqs.requirements[area] || 0;
          const have = creditsEarned[area] || 0;
          const ip = creditsInProgress[area] || 0;
          const g = gaps?.[area] || 0;
          const row = ws2.addRow([area, req, have, ip, g]);
          if (g > 0) row.getCell(5).font = { color: { argb: 'FFDC2626' }, bold: true };
          else row.getCell(5).font = { color: { argb: 'FF16a34a' }, bold: true };
        }
        ws2.addRow([]);
        if (stateReqs.notes) ws2.addRow(['Notes:', stateReqs.notes]);
      } else {
        ws2.addRow(['No home state set — graduation requirements unavailable.']);
      }

      ws2.addRow([]);
      ws2.addRow(['Recommended Courses']);
      ws2.getRow(ws2.rowCount).font = { bold: true, size: 12 };
      if (recommendedCourses.length > 0) {
        const rcHeader = ws2.addRow(['Course Name', 'Subject Area', 'Credits', 'Teacher', 'Term']);
        rcHeader.eachCell(cell => { cell.font = headerFont; cell.fill = headerFill; cell.alignment = { horizontal: 'center' }; });
        for (const c of recommendedCourses) ws2.addRow([c.courseName, c.subjectArea, c.credits, c.teacherName, c.term]);
      } else {
        ws2.addRow(['No recommended courses selected.']);
      }
      if (planNotes) {
        ws2.addRow([]);
        ws2.addRow(['Plan Notes']);
        ws2.getRow(ws2.rowCount).font = { bold: true };
        ws2.addRow([planNotes]);
      }
      ws2.columns = [{ width: 28 }, { width: 16 }, { width: 10 }, { width: 20 }, { width: 14 }];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const today = new Date().toISOString().split('T')[0];
      saveAs(blob, `${selectedStudent.studentName.replace(/\s+/g, '_')}_Transcript_${today}.xlsx`);
      if (user) await databaseService.logAudit(user, 'ExportTranscript', `Exported transcript for ${selectedStudent.studentName}`);
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  // --- Back to picker ---
  const handleBack = () => {
    setSelectedStudent(null);
    setStudentEnrollments([]);
    setEditedEnrollments([]);
    setRemovedEnrollmentIds([]);
    setTranscriptDirty(false);
    setRecommendedCourses([]);
    setPlanNotes('');
    setSavedPlan(null);
    setSearchTerm('');
    setActiveTab('transcript');
    setAddingCourseToSubject(null);
    setCollapsedSubjects(new Set());
  };

  // --- Add new course (inline form) ---
  const handleAddNewCourse = (subjectArea) => {
    const course = allCourses.find(c => c.id === newCourseForm.courseId);
    const newEnrollment = {
      id: `manual-${Date.now()}`,
      courseId: newCourseForm.courseId || null,
      courseName: course?.courseName || 'Manual Entry',
      subjectArea,
      term: newCourseForm.term,
      letterGrade: newCourseForm.grade,
      percentage: newCourseForm.percentage,
      status: newCourseForm.status,
      isManual: true,
    };
    setEditedEnrollments(prev => [...prev, newEnrollment]);
    setTranscriptDirty(true);
    setAddingCourseToSubject(null);
    setNewCourseForm({ courseId: '', term: '', grade: '', percentage: '', status: 'Active' });
  };

  const toggleSubjectCollapse = (area) => {
    setCollapsedSubjects(prev => {
      const next = new Set(prev);
      if (next.has(area)) next.delete(area);
      else next.add(area);
      return next;
    });
  };

  // ─── RENDER: Student Picker ─────────────────────────────────────────────────

  if (!selectedStudent) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-orange-50/40 to-slate-50">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5">
          <h1 className="text-xl font-extrabold text-white tracking-tight">Transcript Generator</h1>
          <p className="text-sm text-orange-100 mt-0.5">Analyze graduation requirements and build course plans</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Search + Filter */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none"
                  placeholder="Search students..." />
              </div>
              <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none">
                <option value="">All Grades</option>
                {['K','1','2','3','4','5','6','7','8','9','10','11','12'].map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>

            {/* Student List */}
            <div className="space-y-2">
              {filteredStudents.length === 0 && (
                <div className="text-center py-12">
                  <UserPlus className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-medium">No students found. Add students via the Dashboard.</p>
                </div>
              )}
              {filteredStudents.map(s => {
                const gradYear = calcGradYear(s.gradeLevel);
                return (
                  <button key={s.id} onClick={() => handleSelectStudent(s)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-orange-300 hover:shadow-md hover:shadow-orange-100/50 transition-all group text-left">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-orange-700">{getInitials(s.studentName)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{s.studentName}</p>
                      <p className="text-xs text-slate-400">Grade {s.gradeLevel} &middot; Class of {gradYear} &middot; {s.unitName}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.homeState ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200/60">
                          {s.homeState}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />No state
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-400 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER: Selected Student ─────────────────────────────────────────────

  const onTrackStatus = getOnTrackStatus(selectedStudent.gradeLevel, totalEarned);
  const statePdfUrl = getStatePdfUrl(selectedStudent.homeState);
  const gradYear = calcGradYear(selectedStudent.gradeLevel);
  const priorityGaps = gaps ? getPriorityGaps(gaps, creditsEarned) : [];

  return (
    <div className="h-full flex flex-col bg-slate-50">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm shrink-0">
        <div className="px-4 py-3 flex items-center justify-between gap-3">

          {/* Left: Back + identity */}
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={handleBack}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm font-medium shrink-0 transition-colors">
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back
            </button>
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-orange-700">{getInitials(selectedStudent.studentName)}</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-slate-800 leading-tight truncate">{selectedStudent.studentName}</h2>
              <p className="text-[11px] text-slate-400 leading-tight">
                Grade {selectedStudent.gradeLevel} &middot; Class of {gradYear}
                {stateReqs && <> &middot; {stateReqs.name}</>}
              </p>
            </div>
          </div>

          {/* Right: Status badge + credits + save */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {totalRequired > 0 && <StatusBadge status={onTrackStatus} />}
            {totalRequired > 0 && (
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                {totalEarned} / {totalRequired} cr
              </span>
            )}
            {saveMsg && <span className="text-[11px] text-slate-500 font-medium">{saveMsg}</span>}
            {transcriptDirty && (
              <button onClick={handleSaveTranscript} disabled={savingTranscript}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold transition disabled:opacity-50">
                {savingTranscript ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save
              </button>
            )}
          </div>
        </div>

        {/* Tab Bar */}
        <TabBar activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* ── Content Area ── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">

          {/* ══════════════════ TRANSCRIPT TAB ══════════════════ */}
          {activeTab === 'transcript' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">

              {/* Left: Editable transcript table */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-bold text-slate-700">Transcript</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{totalEarned} cr earned</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Pencil className="w-3 h-3" />
                      <span>Click cells to edit</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 text-slate-400 uppercase tracking-wider text-[10px]">
                          <th className="text-left px-3 py-2 font-semibold">Course</th>
                          <th className="text-left px-2 py-2 font-semibold w-20">Term</th>
                          <th className="text-center px-2 py-2 font-semibold w-14">Grade</th>
                          <th className="text-center px-2 py-2 font-semibold w-14">%</th>
                          <th className="text-center px-2 py-2 font-semibold w-16">Credits</th>
                          <th className="text-center px-2 py-2 font-semibold w-24">Status</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {SUBJECT_AREAS.map(area => {
                          const courses = enrollmentsBySubject[area];
                          const isCollapsed = collapsedSubjects.has(area);
                          const hasCoursesOrAdding = courses.length > 0 || addingCourseToSubject === area;
                          if (!hasCoursesOrAdding) return null;
                          return (
                            <React.Fragment key={area}>
                              {/* Subject section header */}
                              <tr className="bg-slate-50/60">
                                <td colSpan={7} className="px-3 py-2">
                                  <div className="flex items-center justify-between">
                                    <button onClick={() => toggleSubjectCollapse(area)}
                                      className="flex items-center gap-1.5 text-[11px] font-bold text-orange-700 uppercase tracking-wider hover:text-orange-800 transition-colors">
                                      {isCollapsed
                                        ? <ChevronRight className="w-3.5 h-3.5" />
                                        : <ChevronDown className="w-3.5 h-3.5" />}
                                      {area}
                                    </button>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-semibold text-slate-400">{creditsEarned[area] || 0} cr</span>
                                      <button
                                        onClick={() => {
                                          setAddingCourseToSubject(addingCourseToSubject === area ? null : area);
                                          setNewCourseForm({ courseId: '', term: '', grade: '', percentage: '', status: 'Active' });
                                          if (isCollapsed) toggleSubjectCollapse(area);
                                        }}
                                        className="flex items-center gap-0.5 text-[10px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded transition-colors">
                                        <Plus className="w-3 h-3" />
                                        Add
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>

                              {/* Course rows */}
                              {!isCollapsed && courses.map(e => {
                                const cr = getEarnedCredits(e);
                                const isFailing = e.letterGrade === 'F' || (e.percentage !== '' && e.percentage != null && parseFloat(e.percentage) < 60);
                                const isPassed = cr > 0 && e.status !== 'Active';
                                const isActive = e.status === 'Active';
                                const leftBorder = isFailing ? 'border-l-4 border-red-400' : isPassed ? 'border-l-4 border-emerald-400' : isActive ? 'border-l-4 border-amber-300' : '';
                                return (
                                  <tr key={e.id} className={`border-b border-slate-50 hover:bg-orange-50/20 group ${leftBorder}`}>
                                    <td className="px-3 py-1.5 font-medium text-slate-700">{e.courseName}</td>
                                    <td className="px-2 py-1.5">
                                      <input type="text" value={e.term || ''}
                                        onChange={ev => handleEditField(e.id, 'term', ev.target.value)}
                                        className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-orange-400 focus:bg-white text-xs text-slate-500 outline-none px-0.5 py-0.5 transition-colors" />
                                    </td>
                                    <td className="px-2 py-1.5 text-center">
                                      <input type="text" value={e.letterGrade || ''} placeholder="—"
                                        onChange={ev => handleEditField(e.id, 'letterGrade', ev.target.value)}
                                        className={`w-full text-center bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-orange-400 focus:bg-white text-xs font-bold outline-none px-0.5 py-0.5 transition-colors ${
                                          e.letterGrade === 'F' ? 'text-red-600' : isPassing(e.letterGrade) ? 'text-emerald-600' : 'text-slate-400'
                                        }`} />
                                    </td>
                                    <td className="px-2 py-1.5 text-center">
                                      <input type="text"
                                        value={e.percentage != null && e.percentage !== '' ? e.percentage : ''}
                                        placeholder="—"
                                        onChange={ev => handleEditField(e.id, 'percentage', ev.target.value)}
                                        className="w-full text-center bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-orange-400 focus:bg-white text-xs text-slate-600 outline-none px-0.5 py-0.5 transition-colors" />
                                    </td>
                                    <td className="px-2 py-1.5 text-center">
                                      <span className={`text-xs font-bold ${cr > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                                        {cr > 0 ? cr : '—'}
                                      </span>
                                    </td>
                                    <td className="px-2 py-1.5 text-center">
                                      <select value={e.status || 'Active'}
                                        onChange={ev => handleEditField(e.id, 'status', ev.target.value)}
                                        className="bg-transparent border-0 text-[10px] font-semibold outline-none cursor-pointer text-slate-500 hover:text-slate-700">
                                        <option value="Active">Active</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Withdrawn">Withdrawn</option>
                                      </select>
                                    </td>
                                    <td className="px-1 py-1.5 text-center">
                                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                                        <span className="p-0.5 rounded text-slate-300" title="Click any cell to edit">
                                          <Pencil className="w-3 h-3" />
                                        </span>
                                        <button onClick={() => handleDeleteEnrollment(e.id, e.courseName)}
                                          className="p-0.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                                          title="Remove from transcript">
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}

                              {/* Inline Add Course form */}
                              {!isCollapsed && addingCourseToSubject === area && (
                                <tr className="bg-orange-50/40 border-b border-orange-100">
                                  <td className="px-3 py-2">
                                    <select value={newCourseForm.courseId}
                                      onChange={e => setNewCourseForm(f => ({ ...f, courseId: e.target.value }))}
                                      className="w-full text-xs border border-slate-200 rounded px-1.5 py-1 bg-white focus:border-orange-400 outline-none">
                                      <option value="">— Select course —</option>
                                      {(availableCoursesBySubject[area] || []).map(c => (
                                        <option key={c.id} value={c.id}>{c.courseName}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-2 py-2">
                                    <input type="text" placeholder="Term"
                                      value={newCourseForm.term}
                                      onChange={e => setNewCourseForm(f => ({ ...f, term: e.target.value }))}
                                      className="w-full text-xs border border-slate-200 rounded px-1.5 py-1 bg-white focus:border-orange-400 outline-none" />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input type="text" placeholder="A"
                                      value={newCourseForm.grade}
                                      onChange={e => setNewCourseForm(f => ({ ...f, grade: e.target.value }))}
                                      className="w-full text-center text-xs border border-slate-200 rounded px-1.5 py-1 bg-white focus:border-orange-400 outline-none" />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input type="text" placeholder="90"
                                      value={newCourseForm.percentage}
                                      onChange={e => setNewCourseForm(f => ({ ...f, percentage: e.target.value }))}
                                      className="w-full text-center text-xs border border-slate-200 rounded px-1.5 py-1 bg-white focus:border-orange-400 outline-none" />
                                  </td>
                                  <td className="px-2 py-2 text-center text-[10px] text-slate-400">auto</td>
                                  <td className="px-2 py-2">
                                    <select value={newCourseForm.status}
                                      onChange={e => setNewCourseForm(f => ({ ...f, status: e.target.value }))}
                                      className="w-full text-[10px] border border-slate-200 rounded px-1 py-1 bg-white focus:border-orange-400 outline-none">
                                      <option value="Active">Active</option>
                                      <option value="Completed">Completed</option>
                                      <option value="Withdrawn">Withdrawn</option>
                                    </select>
                                  </td>
                                  <td className="px-1 py-2">
                                    <div className="flex flex-col gap-1">
                                      <button onClick={() => handleAddNewCourse(area)}
                                        className="text-[10px] font-bold text-white bg-orange-500 hover:bg-orange-600 px-1.5 py-0.5 rounded transition-colors">
                                        Add
                                      </button>
                                      <button onClick={() => setAddingCourseToSubject(null)}
                                        className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded transition-colors">
                                        ✕
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                        {editedEnrollments.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                              No courses on transcript yet. Use the "Add" button next to any subject area.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right: Progress sidebar */}
              <div className="space-y-4">

                {/* No state warning */}
                {!stateReqs && (
                  <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-800">No home state set</p>
                        <p className="text-[11px] text-amber-600 mt-0.5">Edit the student profile to set their home state and unlock graduation tracking.</p>
                      </div>
                    </div>
                  </div>
                )}

                {stateReqs && (
                  <>
                    {/* Overall credit gauge */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-bold text-slate-700">Overall Progress</span>
                      </div>
                      {allMet && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 mb-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <p className="text-xs font-bold text-emerald-800">All requirements met!</p>
                        </div>
                      )}
                      <div className="flex justify-center mb-3">
                        <DonutChart earned={totalEarned} total={totalRequired} />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 justify-center">
                        <GraduationCap className="w-3.5 h-3.5 text-orange-500" />
                        <span className="font-bold">{totalRequired}</span>
                        <span>credits required &middot; {stateReqs.name}</span>
                      </div>
                    </div>

                    {/* Subject progress cards */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Flag className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-bold text-slate-700">By Subject</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {SUBJECT_AREAS.map(area => (
                          <SubjectProgressCard key={area}
                            subject={area}
                            required={stateReqs.requirements[area] || 0}
                            earned={creditsEarned[area] || 0}
                            inProgress={creditsInProgress[area] || 0} />
                        ))}
                      </div>
                    </div>

                    {/* State notes */}
                    {stateReqs.notes && (
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
                        <div className="flex gap-2">
                          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-slate-500 leading-relaxed">{stateReqs.notes}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════ PLAN TAB ══════════════════ */}
          {activeTab === 'plan' && (
            <div className="max-w-3xl mx-auto p-4 space-y-4">

              {/* Graduation readiness banner */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <GraduationCap className="w-5 h-5 text-orange-600" />
                      <h3 className="text-base font-bold text-slate-800">Graduation Readiness</h3>
                      {totalRequired > 0 && <StatusBadge status={onTrackStatus} />}
                    </div>
                    {totalRequired > 0 ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${
                              allMet ? 'bg-emerald-500' : totalEarned / totalRequired >= 0.5 ? 'bg-amber-400' : 'bg-red-400'
                            }`} style={{ width: `${Math.min(100, (totalEarned / totalRequired) * 100)}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-600 shrink-0">
                            {Math.round((totalEarned / totalRequired) * 100)}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {totalEarned} of {totalRequired} credits earned &middot; {stateReqs?.name || 'Unknown State'} requirements
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-400">Set a home state on the student profile to track graduation requirements.</p>
                    )}
                  </div>
                  {statePdfUrl && (
                    <a href={statePdfUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold hover:bg-orange-100 transition-colors shrink-0">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Official Requirements
                    </a>
                  )}
                </div>
                {allMet && (
                  <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <p className="text-sm font-bold text-emerald-800">All graduation requirements have been met!</p>
                  </div>
                )}
              </div>

              {/* Gap analysis — priority order */}
              {stateReqs && hasGaps && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Course Gaps — Priority Order
                  </h3>
                  <div className="space-y-3">
                    {priorityGaps.map(area => {
                      const req = stateReqs.requirements[area] || 0;
                      const have = creditsEarned[area] || 0;
                      const gap = gaps[area] || 0;
                      const pct = req > 0 ? Math.min(100, (have / req) * 100) : 0;
                      const available = availableCoursesBySubject[area] || [];
                      const neverStarted = have === 0;
                      return (
                        <div key={area} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                          neverStarted ? 'border-red-200' : 'border-amber-200'
                        }`}>
                          <div className={`px-4 py-3 border-b ${neverStarted ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-slate-800">{area}</span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                neverStarted ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                needs {gap} cr
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-white/80 rounded-full overflow-hidden border border-slate-200">
                                <div className={`h-full rounded-full transition-all duration-700 ${
                                  neverStarted ? 'bg-red-400' : 'bg-amber-400'
                                }`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[11px] font-semibold text-slate-600 shrink-0">{have}/{req} cr</span>
                            </div>
                          </div>
                          {available.length > 0 ? (
                            <div className="p-3 space-y-1.5">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Available Courses</p>
                              {available.map(course => {
                                const isSelected = recommendedCourses.some(c => c.courseId === course.id);
                                return (
                                  <div key={course.id}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all ${
                                      isSelected ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100 hover:border-slate-200'
                                    }`}>
                                    <input type="checkbox" checked={isSelected} onChange={() => toggleRecommended(course)}
                                      className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-semibold text-slate-700 truncate">{course.courseName}</p>
                                      {course.teacherName && <p className="text-[10px] text-slate-400">{course.teacherName}</p>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic p-4">No available courses in this subject. Add courses via the Dashboard.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All met celebration */}
              {stateReqs && !hasGaps && allMet && (
                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-emerald-800 mb-1">Ready to Graduate!</h3>
                  <p className="text-sm text-emerald-600">All {stateReqs.name} graduation requirements have been satisfied.</p>
                </div>
              )}

              {/* Plan notes */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-slate-700">Plan Notes</label>
                  <span className="text-[10px] text-slate-400">{planNotes.length} chars</span>
                </div>
                <textarea value={planNotes} onChange={e => setPlanNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none resize-vertical min-h-[80px]"
                  placeholder="Notes about this student's course plan, goals, or special considerations..." />
                <div className="flex justify-end mt-2">
                  <button onClick={handleSavePlan} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition disabled:opacity-50">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Plan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════ EXPORT TAB ══════════════════ */}
          {activeTab === 'export' && (
            <div className="max-w-2xl mx-auto p-4 space-y-4">

              {/* Export transcript */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Download className="w-4 h-4 text-orange-600" />
                  <h3 className="text-sm font-bold text-slate-800">Export Transcript</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Downloads a two-sheet Excel workbook: full course transcript and graduation gap analysis.
                </p>
                <button onClick={handleExport} disabled={exporting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition disabled:opacity-50">
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Download Transcript (Excel)
                </button>
              </div>

              {/* Official state requirements PDF */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Flag className="w-4 h-4 text-orange-600" />
                  <h3 className="text-sm font-bold text-slate-800">Official State Requirements</h3>
                </div>
                {statePdfUrl ? (
                  <>
                    <p className="text-xs text-slate-500 mb-4">
                      View the official {stateReqs?.name || selectedStudent.homeState} graduation requirements document.
                    </p>
                    <a href={statePdfUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition">
                      <ExternalLink className="w-4 h-4" />
                      View {stateReqs?.name || selectedStudent.homeState} Requirements (PDF)
                    </a>
                  </>
                ) : (
                  <div className="text-xs text-slate-400 space-y-1 mt-2">
                    <p>No PDF on file for <strong className="text-slate-600">{stateReqs?.name || selectedStudent.homeState || 'this state'}</strong>.</p>
                    <p>To add one, place a PDF at <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">public/high_school_grad_requirements/{(selectedStudent.homeState || 'xx').toLowerCase()}.pdf</code></p>
                  </div>
                )}
              </div>

              {/* Grade card — coming soon */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 opacity-60">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-500">Grade Card Export</h3>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">Coming Soon</span>
                </div>
                <p className="text-xs text-slate-400 mb-4">Export a formatted grade card document for this student.</p>
                <button disabled
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 text-slate-400 text-sm font-bold cursor-not-allowed">
                  <Download className="w-4 h-4" />
                  Download Grade Card
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default TranscriptGenerator;
