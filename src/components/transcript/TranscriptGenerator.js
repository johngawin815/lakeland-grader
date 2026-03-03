import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, BookOpen, Flag, TrendingUp, Lightbulb, ChevronDown, AlertTriangle,
  CheckCircle2, Download, Save, Loader2, UserPlus, GraduationCap, Info, Globe
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { databaseService } from '../../services/databaseService';
import stateGraduationRequirements, { SUBJECT_AREAS, STATE_OPTIONS } from '../../data/stateGraduationRequirements';

// ─── HELPERS ────────────────────────────────────────────────────────────────

const isPassing = (grade) => grade && !['F', 'I', '', null, undefined].includes(grade);

function computeCreditsEarned(enrollments) {
  const earned = {};
  for (const area of SUBJECT_AREAS) earned[area] = 0;
  for (const e of enrollments) {
    const area = SUBJECT_AREAS.includes(e.subjectArea) ? e.subjectArea : 'Elective';
    if (isPassing(e.letterGrade)) {
      earned[area] = (earned[area] || 0) + (parseFloat(e.credits) || 0);
    }
  }
  return earned;
}

function computeCreditsInProgress(enrollments) {
  const inProgress = {};
  for (const area of SUBJECT_AREAS) inProgress[area] = 0;
  for (const e of enrollments) {
    if (e.status === 'Active' && !e.letterGrade) {
      const area = SUBJECT_AREAS.includes(e.subjectArea) ? e.subjectArea : 'Elective';
      inProgress[area] = (inProgress[area] || 0) + (parseFloat(e.credits) || 0);
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

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

// ─── SECTION CARD WRAPPER ───────────────────────────────────────────────────

const Section = ({ icon: Icon, title, badge, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-lg">
            <Icon className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
          {badge && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{badge}</span>}
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 pb-5 border-t border-slate-100">{children}</div>}
    </div>
  );
};

// ─── PROGRESS BAR ───────────────────────────────────────────────────────────

const ProgressBar = ({ label, earned, required, inProgress = 0 }) => {
  const pct = required > 0 ? Math.min(100, (earned / required) * 100) : 100;
  const pctWithIp = required > 0 ? Math.min(100, ((earned + inProgress) / required) * 100) : 100;
  const gap = Math.max(0, required - earned);
  const color = pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const ipColor = pct >= 100 ? 'bg-emerald-200' : pct >= 50 ? 'bg-amber-200' : 'bg-red-200';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">{earned} / {required} credits</span>
          {gap > 0 && <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Needs {gap}</span>}
          {gap === 0 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        </div>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full relative" style={{ width: `${pctWithIp}%` }}>
          <div className={`absolute inset-0 ${ipColor} rounded-full`} />
          <div className={`absolute inset-y-0 left-0 ${color} rounded-full`} style={{ width: pct > 0 ? `${(pct / pctWithIp) * 100}%` : '0%' }} />
        </div>
      </div>
      {inProgress > 0 && (
        <p className="text-[11px] text-slate-400 italic">{inProgress} credits in progress</p>
      )}
    </div>
  );
};

// ─── DONUT CHART ────────────────────────────────────────────────────────────

const DonutChart = ({ earned, total }) => {
  const pct = total > 0 ? Math.min(100, (earned / total) * 100) : 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 100 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 50 50)"
          className="transition-all duration-700" />
        <text x="50" y="47" textAnchor="middle" className="text-lg font-extrabold" fill="#1e293b">{Math.round(pct)}%</text>
        <text x="50" y="62" textAnchor="middle" className="text-[10px] font-semibold" fill="#94a3b8">complete</text>
      </svg>
      <p className="text-xs font-bold text-slate-600">{earned} / {total} total credits</p>
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
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [planNotes, setPlanNotes] = useState('');
  const [savedPlan, setSavedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [enrolling, setEnrolling] = useState(null);
  const [saveMsg, setSaveMsg] = useState('');

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
    try {
      const [enrollments, masterGrades, plan] = await Promise.all([
        databaseService.getStudentEnrollments(student.id),
        databaseService.getStudentMasterGrades(student.id),
        databaseService.getTranscriptPlanByStudent(student.id),
      ]);
      // Merge: use master grades for all records (includes completed and active)
      const merged = masterGrades.length > 0 ? masterGrades : enrollments;
      setStudentEnrollments(merged);
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

  // --- Computed values ---
  const stateReqs = selectedStudent?.homeState ? stateGraduationRequirements[selectedStudent.homeState] : null;
  const creditsEarned = useMemo(() => computeCreditsEarned(studentEnrollments), [studentEnrollments]);
  const creditsInProgress = useMemo(() => computeCreditsInProgress(studentEnrollments), [studentEnrollments]);
  const gaps = useMemo(() => stateReqs ? computeGaps(creditsEarned, stateReqs.requirements) : null, [creditsEarned, stateReqs]);
  const totalEarned = useMemo(() => Object.values(creditsEarned).reduce((s, v) => s + v, 0), [creditsEarned]);
  const totalRequired = stateReqs?.totalCredits || 0;
  const allMet = gaps ? Object.values(gaps).every(g => g === 0) && totalEarned >= totalRequired : false;

  // --- Group enrollments by subject ---
  const enrollmentsBySubject = useMemo(() => {
    const grouped = {};
    for (const area of SUBJECT_AREAS) grouped[area] = [];
    for (const e of studentEnrollments) {
      const area = SUBJECT_AREAS.includes(e.subjectArea) ? e.subjectArea : 'Elective';
      grouped[area].push(e);
    }
    return grouped;
  }, [studentEnrollments]);

  // --- Available courses for gaps ---
  const enrolledCourseIds = useMemo(() => new Set(studentEnrollments.map(e => e.courseId)), [studentEnrollments]);
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
        term: course.term, status: 'Active', credits: course.credits,
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
          const row = ws1.addRow(['', e.courseName, e.term || '', e.letterGrade || 'In Progress', e.credits || '', e.status || '']);
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
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
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

  // ─── RENDER: Selected Student View ──────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-orange-50/40 to-slate-50">
      {/* Sticky Toolbar */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="text-white/80 hover:text-white text-sm font-semibold mr-2">&larr; Back</button>
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-sm font-bold text-white">{getInitials(selectedStudent.studentName)}</span>
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">{selectedStudent.studentName}</h2>
            <p className="text-xs text-orange-100">
              Grade {selectedStudent.gradeLevel}
              {stateReqs && <> &middot; {stateReqs.name}</>}
              {selectedStudent.district && <> &middot; {selectedStudent.district}</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveMsg && <span className="text-xs text-orange-100 font-medium mr-2">{saveMsg}</span>}
          <button onClick={handleSavePlan} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Plan
          </button>
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-orange-600 text-xs font-bold hover:bg-orange-50 transition disabled:opacity-50">
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* ── Section: Current Transcript ── */}
          <Section icon={BookOpen} title="Current Transcript" badge={`${totalEarned} credits`} defaultOpen={true}>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-3 py-2 font-semibold">Course</th>
                    <th className="text-left px-3 py-2 font-semibold">Term</th>
                    <th className="text-center px-3 py-2 font-semibold">Grade</th>
                    <th className="text-center px-3 py-2 font-semibold">Credits</th>
                    <th className="text-center px-3 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {SUBJECT_AREAS.map(area => {
                    const courses = enrollmentsBySubject[area];
                    if (courses.length === 0) return null;
                    return (
                      <React.Fragment key={area}>
                        <tr>
                          <td colSpan={5} className="px-3 pt-4 pb-1">
                            <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">{area}</span>
                          </td>
                        </tr>
                        {courses.map(e => (
                          <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="px-3 py-2 font-medium text-slate-700">{e.courseName}</td>
                            <td className="px-3 py-2 text-slate-500">{e.term || '—'}</td>
                            <td className="px-3 py-2 text-center">
                              {e.letterGrade ? (
                                <span className={`font-bold ${e.letterGrade === 'F' ? 'text-red-600' : isPassing(e.letterGrade) ? 'text-emerald-600' : 'text-slate-400'}`}>
                                  {e.letterGrade}{e.percentage != null ? ` (${e.percentage}%)` : ''}
                                </span>
                              ) : (
                                <span className="text-amber-500 italic text-xs">In Progress</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center text-slate-600">{e.credits || '—'}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${e.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                {e.status || 'Active'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50/50">
                          <td className="px-3 py-1.5 text-right text-xs font-bold text-slate-400" colSpan={3}>Subtotal</td>
                          <td className="px-3 py-1.5 text-center text-xs font-bold text-slate-600">{creditsEarned[area] || 0}</td>
                          <td />
                        </tr>
                      </React.Fragment>
                    );
                  })}
                  {studentEnrollments.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-slate-400 text-sm">No courses on transcript yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── Section: State Requirements ── */}
          <Section icon={Flag} title={stateReqs ? `${stateReqs.name} Graduation Requirements` : 'State Requirements'} defaultOpen={!!stateReqs}>
            {!stateReqs ? (
              <div className="mt-4 flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200/60">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">No home state set for this student.</p>
                  <p className="text-xs text-amber-600 mt-0.5">Edit the student profile to set their home state and view graduation requirements.</p>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {SUBJECT_AREAS.map(area => (
                    <div key={area} className="bg-orange-50/60 rounded-lg border border-orange-100 p-3 text-center">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{area}</p>
                      <p className="text-2xl font-extrabold text-orange-700">{stateReqs.requirements[area] || 0}</p>
                      <p className="text-[11px] text-slate-400 font-medium">credits</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <GraduationCap className="w-4 h-4 text-orange-500" />
                  <span className="font-bold">{stateReqs.totalCredits} total credits</span> required for graduation
                </div>
                {stateReqs.notes && (
                  <div className="flex gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500 leading-relaxed">{stateReqs.notes}</p>
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* ── Section: Gap Analysis ── */}
          {stateReqs && (
            <Section icon={TrendingUp} title="Gap Analysis" defaultOpen={true}>
              <div className="mt-4">
                {allMet && (
                  <div className="mb-5 flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200/60">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <div>
                      <p className="text-sm font-bold text-emerald-800">All graduation requirements met!</p>
                      <p className="text-xs text-emerald-600">This student has earned all required credits for {stateReqs.name}.</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Progress bars */}
                  <div className="flex-1 space-y-4">
                    {SUBJECT_AREAS.map(area => (
                      <ProgressBar key={area} label={area}
                        earned={creditsEarned[area] || 0}
                        required={stateReqs.requirements[area] || 0}
                        inProgress={creditsInProgress[area] || 0} />
                    ))}
                  </div>

                  {/* Donut */}
                  <div className="flex flex-col items-center justify-center lg:w-40 shrink-0">
                    <DonutChart earned={totalEarned} total={totalRequired} />
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* ── Section: Course Plan Builder ── */}
          {stateReqs && gaps && (
            <Section icon={Lightbulb} title="Recommended Course Plan" defaultOpen={true}>
              <div className="mt-4 space-y-5">
                {SUBJECT_AREAS.filter(area => (gaps[area] || 0) > 0).length === 0 && !allMet && (
                  <p className="text-sm text-slate-400">No credit gaps found based on current requirements.</p>
                )}

                {allMet && (
                  <p className="text-sm text-emerald-600 font-medium">No additional courses needed — all requirements are met.</p>
                )}

                {SUBJECT_AREAS.filter(area => (gaps[area] || 0) > 0).map(area => {
                  const available = availableCoursesBySubject[area] || [];
                  const recCredits = recommendedCourses
                    .filter(c => (SUBJECT_AREAS.includes(c.subjectArea) ? c.subjectArea : 'Elective') === area)
                    .reduce((sum, c) => sum + (parseFloat(c.credits) || 0), 0);

                  return (
                    <div key={area} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-700">
                          {area} <span className="text-red-500 font-semibold text-xs ml-1">needs {gaps[area]} more credits</span>
                        </h4>
                        {recCredits > 0 && (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            +{recCredits} planned
                          </span>
                        )}
                      </div>

                      {available.length === 0 ? (
                        <p className="text-xs text-slate-400 italic pl-4">No available courses for this subject. Consider adding courses in the Dashboard.</p>
                      ) : (
                        <div className="space-y-1.5 pl-1">
                          {available.map(course => {
                            const isSelected = recommendedCourses.some(c => c.courseId === course.id);
                            return (
                              <div key={course.id}
                                className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                                  isSelected ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100 hover:border-slate-200'
                                }`}>
                                <input type="checkbox" checked={isSelected} onChange={() => toggleRecommended(course)}
                                  className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-700">{course.courseName}</p>
                                  <p className="text-xs text-slate-400">{course.teacherName} &middot; {course.credits} credits &middot; {course.term}</p>
                                </div>
                                <button onClick={() => handleQuickEnroll(course)} disabled={enrolling === course.id}
                                  className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-md transition disabled:opacity-50 shrink-0">
                                  {enrolling === course.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Quick Enroll'}
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
                <div className="pt-3 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Plan Notes</label>
                  <textarea value={planNotes} onChange={e => setPlanNotes(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none resize-vertical min-h-[80px]"
                    placeholder="Add notes about the student's course plan, accommodations, or special considerations..."
                    rows={3} />
                </div>
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  );
};

export default TranscriptGenerator;
