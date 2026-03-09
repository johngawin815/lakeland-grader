import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, BookOpen, Flag, TrendingUp, Lightbulb, AlertTriangle,
  CheckCircle2, Download, Save, Loader2, UserPlus, GraduationCap, Info, Pencil, Trash2
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { databaseService } from '../../services/databaseService';
import stateGraduationRequirements, { SUBJECT_AREAS } from '../../data/stateGraduationRequirements';

// ─── HELPERS ────────────────────────────────────────────────────────────────

const isPassing = (grade) => grade && !['F', 'I', '', null, undefined].includes(grade);

/** Auto-compute earned credits: 0.5 if percentage >= 60 or passing letter grade */
const getEarnedCredits = (enrollment) => {
  const pct = parseFloat(enrollment.percentage);
  if (!isNaN(pct) && pct >= 60) return 0.5;
  if (isPassing(enrollment.letterGrade)) return 0.5;
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
      // Prefer the record with a grade
      if (!existing.letterGrade && e.letterGrade) {
        byCourse[key] = e;
      } else if (!e.letterGrade && existing.letterGrade) {
        // keep existing
      } else {
        // Both have or both lack grades; keep the most recent
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
      inProgress[area] = (inProgress[area] || 0) + 0.5;
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

// ─── COMPACT PROGRESS BAR ──────────────────────────────────────────────────

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

// ─── DONUT CHART ────────────────────────────────────────────────────────────

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

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

const TranscriptGenerator = ({ user }) => {

  // --- State ---
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
  const [enrolling, setEnrolling] = useState(null);
  const [saveMsg, setSaveMsg] = useState('');

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
  const { saveStatus, lastSavedAt, forceSave } = useAutoSave(transcriptDirty, saveFn, { delay: 3000, enabled: !!selectedStudent });

  // Mark dirty on transcript edit
  useEffect(() => {
    if (selectedStudent) setTranscriptDirty(true);
  }, [editedEnrollments, removedEnrollmentIds]);

  // --- Load students and courses on mount ---
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
    try {
      const [enrollments, masterGrades, plan] = await Promise.all([
        databaseService.getStudentEnrollments(student.id),
        databaseService.getStudentMasterGrades(student.id),
        databaseService.getTranscriptPlanByStudent(student.id),
      ]);
      // Merge: use master grades for all records (includes completed and active)
      const merged = masterGrades.length > 0 ? masterGrades : enrollments;
      // Deduplicate by courseId to prevent duplicate rows
      const deduped = deduplicateEnrollments(merged);
      // Auto-populate credits for passing grades
      const withCredits = deduped.map(e => ({
        ...e,
        credits: getEarnedCredits(e),
      }));
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

  // --- Inline editing handlers ---
  const handleEditField = (enrollmentId, field, value) => {
    setEditedEnrollments(prev => {
      const updated = prev.map(e => {
        if (e.id !== enrollmentId) return e;
        const newE = { ...e, [field]: value };
        // Auto-recompute credits when grade/percentage changes
        if (field === 'letterGrade' || field === 'percentage') {
          newE.credits = getEarnedCredits(newE);
        }
        return newE;
      });
      return updated;
    });
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
      for (const enrollment of editedEnrollments) {
        await databaseService.enrollStudent(enrollment);
      }
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

  // --- Computed values (use editedEnrollments for live preview) ---
  const stateReqs = selectedStudent?.homeState ? stateGraduationRequirements[selectedStudent.homeState] : null;
  const creditsEarned = useMemo(() => computeCreditsEarned(editedEnrollments), [editedEnrollments]);
  const creditsInProgress = useMemo(() => computeCreditsInProgress(editedEnrollments), [editedEnrollments]);
  const gaps = useMemo(() => stateReqs ? computeGaps(creditsEarned, stateReqs.requirements) : null, [creditsEarned, stateReqs]);
  const totalEarned = useMemo(() => Object.values(creditsEarned).reduce((s, v) => s + v, 0), [creditsEarned]);
  const totalRequired = stateReqs?.totalCredits || 0;
  const allMet = gaps ? Object.values(gaps).every(g => g === 0) && totalEarned >= totalRequired : false;

  // --- Group enrollments by subject ---
  const enrollmentsBySubject = useMemo(() => {
    const grouped = {};
    for (const area of SUBJECT_AREAS) grouped[area] = [];
    for (const e of editedEnrollments) {
      const area = SUBJECT_AREAS.includes(e.subjectArea) ? e.subjectArea : 'Elective';
      grouped[area].push(e);
    }
    return grouped;
  }, [editedEnrollments]);

  // --- Available courses for gaps ---
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

  // --- Filter students ---
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

  // --- Quick Enroll ---
  const handleQuickEnroll = async (course) => {
    if (!selectedStudent || !window.confirm(`Enroll ${selectedStudent.studentName} in ${course.courseName}?`)) return;
    setEnrolling(course.id);
    try {
      const enrollId = `${selectedStudent.id}-${course.id}`;
      await databaseService.enrollStudent({
        id: enrollId, studentId: selectedStudent.id, courseId: course.id,
        courseName: course.courseName, subjectArea: course.subjectArea,
        teacherName: course.teacherName, letterGrade: '',
        percentage: null, enrollmentDate: new Date().toISOString().split('T')[0],
        term: course.term, status: 'Active', credits: 0,
      });
      if (user) await databaseService.logAudit(user, 'QuickEnroll', `Enrolled ${selectedStudent.studentName} in ${course.courseName}`);
      // Refresh
      await handleSelectStudent(selectedStudent);
    } catch (e) {
      console.error('Enrollment failed:', e);
    } finally {
      setEnrolling(null);
    }
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

      // --- Sheet 1: Transcript ---
      const ws1 = workbook.addWorksheet('Transcript');
      const orange = 'FFea580c';
      const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: orange } };

      // Student info rows
      ws1.addRow(['Student Name', selectedStudent.studentName]);
      ws1.addRow(['Grade Level', selectedStudent.gradeLevel]);
      ws1.addRow(['Home State', stateReqs ? stateReqs.name : (selectedStudent.homeState || 'Not set')]);
      ws1.addRow(['District', selectedStudent.district || '']);
      ws1.addRow(['Admit Date', selectedStudent.admitDate || '']);
      ws1.addRow([]);

      // Transcript table header
      const headerRow = ws1.addRow(['Subject Area', 'Course Name', 'Term', 'Grade', 'Credits', 'Status']);
      headerRow.eachCell(cell => { cell.font = headerFont; cell.fill = headerFill; cell.alignment = { horizontal: 'center' }; });

      for (const area of SUBJECT_AREAS) {
        const courses = enrollmentsBySubject[area];
        if (courses.length === 0) continue;
        // Subject area header
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
        // Subtotal
        const sub = creditsEarned[area] || 0;
        const stRow = ws1.addRow(['', '', '', 'Subtotal:', sub, '']);
        stRow.getCell(4).font = { bold: true }; stRow.getCell(5).font = { bold: true };
      }
      ws1.addRow([]);
      const totRow = ws1.addRow(['', '', '', 'TOTAL CREDITS:', totalEarned, '']);
      totRow.getCell(4).font = { bold: true, size: 12 }; totRow.getCell(5).font = { bold: true, size: 12 };

      // Auto column widths
      ws1.columns = [{ width: 16 }, { width: 28 }, { width: 14 }, { width: 12 }, { width: 10 }, { width: 12 }];

      // --- Sheet 2: Graduation Plan ---
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
        if (stateReqs.notes) {
          ws2.addRow(['Notes:', stateReqs.notes]);
        }
      } else {
        ws2.addRow(['No home state set — graduation requirements unavailable.']);
      }

      ws2.addRow([]);
      ws2.addRow(['Recommended Courses']);
      ws2.getRow(ws2.rowCount).font = { bold: true, size: 12 };

      if (recommendedCourses.length > 0) {
        const rcHeader = ws2.addRow(['Course Name', 'Subject Area', 'Credits', 'Teacher', 'Term']);
        rcHeader.eachCell(cell => { cell.font = headerFont; cell.fill = headerFill; cell.alignment = { horizontal: 'center' }; });
        for (const c of recommendedCourses) {
          ws2.addRow([c.courseName, c.subjectArea, c.credits, c.teacherName, c.term]);
        }
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

      // Write file
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
  };

  // ─── RENDER: Student Picker ─────────────────────────────────────────────────

  if (!selectedStudent) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-orange-50/40 to-slate-50">
        {/* Header */}
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
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {filteredStudents.length === 0 && (
                <div className="text-center py-12">
                  <UserPlus className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-medium">No students found. Add students via the Dashboard.</p>
                </div>
              )}
              {filteredStudents.map(s => (
                <button key={s.id} onClick={() => handleSelectStudent(s)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-orange-300 hover:shadow-md hover:shadow-orange-100/50 transition-all group text-left">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-orange-700">{getInitials(s.studentName)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{s.studentName}</p>
                    <p className="text-xs text-slate-400">Grade {s.gradeLevel} &middot; {s.unitName}</p>
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
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER: Selected Student ─ Compact two-column layout ─────────────────

  const hasGaps = gaps && SUBJECT_AREAS.some(area => (gaps[area] || 0) > 0);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-orange-50/40 to-slate-50">
      {/* ── Sticky Toolbar ── */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="text-white/80 hover:text-white text-xs font-semibold">&larr; Back</button>
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">{getInitials(selectedStudent.studentName)}</span>
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white leading-tight">{selectedStudent.studentName}</h2>
            <p className="text-[11px] text-orange-100">
              Grade {selectedStudent.gradeLevel}
              {stateReqs && <> &middot; {stateReqs.name}</>}
              {selectedStudent.district && <> &middot; {selectedStudent.district}</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {saveMsg && <span className="text-[11px] text-orange-100 font-medium mr-1">{saveMsg}</span>}
          {transcriptDirty && (
            <button onClick={handleSaveTranscript} disabled={savingTranscript}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold transition disabled:opacity-50">
              {savingTranscript ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save Transcript
            </button>
          )}
          <button onClick={handleSavePlan} disabled={saving}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold transition disabled:opacity-50">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save Plan
          </button>
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-orange-600 text-[11px] font-bold hover:bg-orange-50 transition disabled:opacity-50">
            {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            Export
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* ── Two-column layout: Transcript (left) + Requirements (right) ── */}
          <div className="flex flex-col lg:flex-row gap-0 min-h-0">

            {/* ── LEFT: Editable Transcript Table ── */}
            <div className="flex-1 p-3 min-w-0">
              <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Transcript</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">{totalEarned} cr earned</span>
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
                        <th className="text-left px-2 py-1.5 font-semibold">Course</th>
                        <th className="text-left px-2 py-1.5 font-semibold w-20">Term</th>
                        <th className="text-center px-2 py-1.5 font-semibold w-14">Grade</th>
                        <th className="text-center px-2 py-1.5 font-semibold w-14">%</th>
                        <th className="text-center px-2 py-1.5 font-semibold w-14">Credits</th>
                        <th className="text-center px-2 py-1.5 font-semibold w-20">Status</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {SUBJECT_AREAS.map(area => {
                        const courses = enrollmentsBySubject[area];
                        if (courses.length === 0) return null;
                        return (
                          <React.Fragment key={area}>
                            <tr>
                              <td colSpan={7} className="px-2 pt-2.5 pb-0.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">{area}</span>
                                  <span className="text-[10px] font-semibold text-slate-400">{creditsEarned[area] || 0} cr</span>
                                </div>
                              </td>
                            </tr>
                            {courses.map(e => {
                              const cr = getEarnedCredits(e);
                              return (
                                <tr key={e.id} className="border-b border-slate-50 hover:bg-orange-50/30 group">
                                  <td className="px-2 py-1 font-medium text-slate-700">{e.courseName}</td>
                                  <td className="px-2 py-1">
                                    <input
                                      type="text"
                                      value={e.term || ''}
                                      onChange={ev => handleEditField(e.id, 'term', ev.target.value)}
                                      className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-orange-400 focus:bg-white text-xs text-slate-500 outline-none px-0.5 py-0.5 transition-colors"
                                    />
                                  </td>
                                  <td className="px-2 py-1 text-center">
                                    <input
                                      type="text"
                                      value={e.letterGrade || ''}
                                      onChange={ev => handleEditField(e.id, 'letterGrade', ev.target.value)}
                                      placeholder="—"
                                      className={`w-full text-center bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-orange-400 focus:bg-white text-xs font-bold outline-none px-0.5 py-0.5 transition-colors ${
                                        e.letterGrade === 'F' ? 'text-red-600' : isPassing(e.letterGrade) ? 'text-emerald-600' : 'text-slate-400'
                                      }`}
                                    />
                                  </td>
                                  <td className="px-2 py-1 text-center">
                                    <input
                                      type="text"
                                      value={e.percentage != null && e.percentage !== '' ? e.percentage : ''}
                                      onChange={ev => handleEditField(e.id, 'percentage', ev.target.value)}
                                      placeholder="—"
                                      className="w-full text-center bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-orange-400 focus:bg-white text-xs text-slate-600 outline-none px-0.5 py-0.5 transition-colors"
                                    />
                                  </td>
                                  <td className="px-2 py-1 text-center">
                                    <span className={`text-xs font-bold ${cr > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                                      {cr > 0 ? cr : '—'}
                                    </span>
                                  </td>
                                  <td className="px-2 py-1 text-center">
                                    <select
                                      value={e.status || 'Active'}
                                      onChange={ev => handleEditField(e.id, 'status', ev.target.value)}
                                      className="bg-transparent border-0 text-[10px] font-semibold outline-none cursor-pointer text-slate-500 hover:text-slate-700"
                                    >
                                      <option value="Active">Active</option>
                                      <option value="Completed">Completed</option>
                                      <option value="Withdrawn">Withdrawn</option>
                                    </select>
                                  </td>
                                  <td className="px-1 py-1 text-center">
                                    <button
                                      onClick={() => handleDeleteEnrollment(e.id, e.courseName)}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all"
                                      title="Remove from transcript"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                      {editedEnrollments.length === 0 && (
                        <tr><td colSpan={7} className="text-center py-6 text-slate-400 text-xs">No courses on transcript yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Course Plan Builder (inline, below transcript) ── */}
              {stateReqs && hasGaps && (
                <div className="mt-3 bg-white rounded-lg border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Recommended Courses</span>
                  </div>
                  <div className="p-3 space-y-3">
                    {SUBJECT_AREAS.filter(area => (gaps[area] || 0) > 0).map(area => {
                      const available = availableCoursesBySubject[area] || [];
                      const recCredits = recommendedCourses
                        .filter(c => (SUBJECT_AREAS.includes(c.subjectArea) ? c.subjectArea : 'Elective') === area)
                        .reduce((sum, c) => sum + (parseFloat(c.credits) || 0), 0);
                      return (
                        <div key={area}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-700">
                              {area} <span className="text-red-500 text-[10px] ml-1">needs {gaps[area]}</span>
                            </span>
                            {recCredits > 0 && (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+{recCredits}</span>
                            )}
                          </div>
                          {available.length === 0 ? (
                            <p className="text-[10px] text-slate-400 italic pl-2">No available courses.</p>
                          ) : (
                            <div className="space-y-1">
                              {available.map(course => {
                                const isSelected = recommendedCourses.some(c => c.courseId === course.id);
                                return (
                                  <div key={course.id}
                                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md border transition-all text-xs ${
                                      isSelected ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100 hover:border-slate-200'
                                    }`}>
                                    <input type="checkbox" checked={isSelected} onChange={() => toggleRecommended(course)}
                                      className="w-3.5 h-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer" />
                                    <div className="flex-1 min-w-0">
                                      <span className="font-medium text-slate-700">{course.courseName}</span>
                                      <span className="text-slate-400 ml-1.5">{course.teacherName}</span>
                                    </div>
                                    <button onClick={() => handleQuickEnroll(course)} disabled={enrolling === course.id}
                                      className="text-[10px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded transition disabled:opacity-50 shrink-0">
                                      {enrolling === course.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Enroll'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Plan Notes */}
                    <div className="pt-2 border-t border-slate-100">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Plan Notes</label>
                      <textarea value={planNotes} onChange={e => setPlanNotes(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none resize-vertical min-h-[48px]"
                        placeholder="Notes about course plan..."
                        rows={2} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: Requirements + Gap Analysis ── */}
            <div className="lg:w-72 xl:w-80 shrink-0 p-3 lg:pl-0 space-y-3">
              {/* State Requirements */}
              <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100">
                  <Flag className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    {stateReqs ? stateReqs.name : 'State Reqs'}
                  </span>
                </div>

                {!stateReqs ? (
                  <div className="p-3">
                    <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-50 border border-amber-200/60">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-800">No home state set.</p>
                        <p className="text-[10px] text-amber-600 mt-0.5">Edit the student profile to set their home state.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {/* Requirement cards */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {SUBJECT_AREAS.map(area => (
                        <div key={area} className="bg-orange-50/60 rounded-md border border-orange-100 px-2 py-1.5 text-center">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{area}</p>
                          <p className="text-base font-extrabold text-orange-700">{stateReqs.requirements[area] || 0}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <GraduationCap className="w-3.5 h-3.5 text-orange-500" />
                      <span className="font-bold">{stateReqs.totalCredits}</span>
                      <span>total required</span>
                    </div>
                    {stateReqs.notes && (
                      <div className="flex gap-1.5 p-2 rounded-md bg-slate-50 border border-slate-100">
                        <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-slate-500 leading-relaxed">{stateReqs.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Gap Analysis */}
              {stateReqs && (
                <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Progress</span>
                  </div>
                  <div className="p-3 space-y-2">
                    {allMet && (
                      <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-50 border border-emerald-200/60 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <p className="text-[11px] font-bold text-emerald-800">All requirements met!</p>
                      </div>
                    )}

                    <div className="flex justify-center mb-2">
                      <DonutChart earned={totalEarned} total={totalRequired} />
                    </div>

                    <div className="space-y-2">
                      {SUBJECT_AREAS.map(area => (
                        <ProgressBar key={area} label={area}
                          earned={creditsEarned[area] || 0}
                          required={stateReqs.requirements[area] || 0}
                          inProgress={creditsInProgress[area] || 0} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptGenerator;
