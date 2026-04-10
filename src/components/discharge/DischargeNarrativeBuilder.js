import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  FileText, Search, Loader2, CheckCircle, AlertTriangle,
  Sparkles, Download, Printer, ChevronDown, ChevronUp,
  ArrowRight, TrendingUp, TrendingDown, ClipboardList,
  MessageSquare, StickyNote, BookOpen, User, Calendar, GraduationCap, Save
} from 'lucide-react';
import EditableStudentName from '../EditableStudentName';
import { getStudentInitials, formatStudentLabel } from '../../utils/studentUtils';
import { databaseService } from '../../services/databaseService';
import { useAutoSave } from '../../hooks/useAutoSave';
import {
  generateAdmissionDraft, generateBehaviorDraft, generateAnalysisDraft,
  SENTENCE_STARTERS, describePerformanceLevel,
} from '../../utils/dischargeNarrativeGenerator';
import { exportDischargeDocx } from '../../utils/dischargeDocxExport';

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const INPUT_CLASS = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 bg-white outline-none transition-all disabled:opacity-50 placeholder:text-slate-400';
const LABEL_CLASS = 'block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1.5';
const TEXTAREA_CLASS = 'w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 bg-white outline-none transition-all disabled:opacity-50 placeholder:text-slate-400 resize-vertical';

function createEmptyDraft() {
  return {
    studentName: '', firstName: '', gradeLevel: '',
    admitDate: '', dischargeDate: '', age: '',
    admissionReason: '', behaviorNarrative: '', analysisNarrative: '',
    preReadingGE: '', postReadingGE: '',
    preMathGE: '', postMathGE: '',
    preWritingGE: '', postWritingGE: '',
  };
}

function wordCount(text) {
  return (text || '').trim().split(/\s+/).filter(Boolean).length;
}

function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

// ─── SECTION CARD ───────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, isOpen, onToggle, isComplete, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
            <Icon className="w-4 h-4" />
          </span>
          <span className="font-bold text-slate-800 text-sm">{title}</span>
          {isComplete && <CheckCircle className="w-4 h-4 text-emerald-500" />}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-2 space-y-3 border-t border-slate-100 animate-[slide-up-fade_0.2s_ease-out]">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── SCORE CARD (inline) ────────────────────────────────────────────────────

function ScoreCard({ label, preGE, postGE, gradeLevel }) {
  const pre = parseFloat(preGE);
  const post = parseFloat(postGE);
  const hasBoth = !isNaN(pre) && !isNaN(post);
  const change = hasBoth ? (post - pre).toFixed(1) : null;
  const isPositive = change > 0;
  const currentGE = !isNaN(post) ? post : pre;
  const progressPct = !isNaN(currentGE) ? Math.min(100, (currentGE / gradeLevel) * 100) : 0;

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-center">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</div>
      <div className="text-lg font-extrabold text-slate-800 flex items-center justify-center gap-2">
        <span>{preGE || '\u2014'}</span>
        <ArrowRight className="w-4 h-4 text-slate-400" />
        <span>{postGE || '\u2014'}</span>
      </div>
      {change && (
        <div className={`text-sm font-bold mt-1 flex items-center justify-center gap-1 ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {isPositive ? '+' : ''}{change} GE
        </div>
      )}
      <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${progressPct >= 90 ? 'bg-emerald-500' : progressPct >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
      {!isNaN(currentGE) && (
        <div className="text-xs text-slate-400 mt-1">{describePerformanceLevel(currentGE, gradeLevel)}</div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

const DischargeNarrativeBuilder = ({ user }) => {
  // ── Student picker state
  const [allStudents, setAllStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Loaded data
  const [kteaData, setKteaData] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [dbRecord, setDbRecord] = useState(null);

  // ── Draft state
  const [draft, setDraft] = useState(() => {
    // Restore from localStorage if available
    const LS_KEY = `dischargeNarrative_${selectedStudent?.id || 'anon'}`;
    const saved = selectedStudent?.id ? localStorage.getItem(LS_KEY) : null;
    if (saved) return JSON.parse(saved);
    return createEmptyDraft();
  });
  const [isDirty, setIsDirty] = useState(false);

  // Auto-save draft to localStorage
  useEffect(() => {
    const LS_KEY = `dischargeNarrative_${selectedStudent?.id || 'anon'}`;
    if (draft && selectedStudent?.id) {
      localStorage.setItem(LS_KEY, JSON.stringify(draft));
    }
  }, [draft, selectedStudent]);

  // ── UI state
  const [openSections, setOpenSections] = useState({
    demographics: true, admission: true, scores: true, behavior: true, analysis: true,
  });
  const [showStarters, setShowStarters] = useState(null); // null | 'behavior' | 'analysis' | 'admission'
  const [showMtpRef, setShowMtpRef] = useState(false);
  const [showGradeRef, setShowGradeRef] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ── Refs for cursor insertion
  const behaviorRef = useRef(null);
  const analysisRef = useRef(null);
  const admissionRef = useRef(null);

  // ── Helpers
  const updateDraft = useCallback((field, value) => {
    setDraft(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  // ── Completion tracking
  const completion = useMemo(() => {
    const sections = {
      demographics: !!(draft.studentName && draft.gradeLevel && draft.admitDate && draft.dischargeDate),
      admission: (draft.admissionReason || '').trim().length >= 20,
      scores: kteaData != null,
      behavior: (draft.behaviorNarrative || '').trim().length >= 50,
      analysis: (draft.analysisNarrative || '').trim().length >= 30,
    };
    const completed = Object.values(sections).filter(Boolean).length;
    const total = Object.keys(sections).length;
    return { sections, completed, total, ready: completed === total };
  }, [draft, kteaData]);

  // ── Auto-save
  const saveFn = useCallback(async () => {
    if (!dbRecord?.id) return;
    const updatedData = {
      ...dbRecord,
      admissionReason: draft.admissionReason,
      behaviorNarrative: draft.behaviorNarrative,
      analysisNarrative: draft.analysisNarrative,
      dischargeDate: draft.dischargeDate,
    };
    await databaseService.updateKteaReport(dbRecord.id, updatedData);
    setIsDirty(false);
  }, [dbRecord, draft.admissionReason, draft.behaviorNarrative, draft.analysisNarrative, draft.dischargeDate]);

  const { saveStatus, lastSavedAt, forceSave } = useAutoSave(isDirty, saveFn, { delay: 3000, enabled: !!dbRecord?.id });

  // ── Load all students
  useEffect(() => {
    const load = async () => {
      const students = await databaseService.getAllStudents();
      setAllStudents(students.filter(s => s.active !== false));
    };
    load();
  }, []);

  // ── Filtered students for picker
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return allStudents;
    const term = searchTerm.toLowerCase();
    return allStudents.filter(s =>
      s.studentName?.toLowerCase().includes(term) ||
      s.unitName?.toLowerCase().includes(term) ||
      String(s.gradeLevel).includes(term)
    );
  }, [allStudents, searchTerm]);

  // ── Handle student selection
  const handleSelectStudent = useCallback(async (student) => {
    setSelectedStudent(student);
    setLoading(true);
    try {
      // Search by the student name as-is first
      let kteaResults = [];
      let studentEnrollments = [];
      [kteaResults, studentEnrollments] = await Promise.all([
        databaseService.searchKteaReports(student.studentName),
        databaseService.getStudentEnrollments(student.id),
      ]);

      // If no results, try "Last, First" format (KTEAReporter stores names that way)
      if ((!kteaResults || kteaResults.length === 0) && student.studentName) {
        const parts = student.studentName.trim().split(' ');
        if (parts.length >= 2) {
          const last = parts[parts.length - 1];
          const first = parts.slice(0, -1).join(' ');
          const reversed = `${last}, ${first}`;
          kteaResults = await databaseService.searchKteaReports(reversed);
        }
        // Also try searching by first name only as a fallback
        if ((!kteaResults || kteaResults.length === 0) && student.firstName) {
          kteaResults = await databaseService.searchKteaReports(student.firstName);
        }
      }

      const ktea = kteaResults?.[0] || null;
      setKteaData(ktea);
      setDbRecord(ktea);
      setEnrollments(studentEnrollments || []);

      setDraft({
        studentName: student.studentName || '',
        firstName: student.firstName || student.studentName?.split(' ')[0] || '',
        gradeLevel: String(ktea?.gradeLevel || student.gradeLevel || ''),
        admitDate: ktea?.admitDate || student.admitDate || '',
        dischargeDate: ktea?.dischargeDate || student.expectedDischargeDate || '',
        age: '',
        admissionReason: ktea?.admissionReason || '',
        behaviorNarrative: ktea?.behaviorNarrative || '',
        analysisNarrative: ktea?.analysisNarrative || '',
        preReadingGE: ktea?.preReadingGE || '',
        postReadingGE: ktea?.postReadingGE || '',
        preMathGE: ktea?.preMathGE || '',
        postMathGE: ktea?.postMathGE || '',
        preWritingGE: ktea?.preWritingGE || '',
        postWritingGE: ktea?.postWritingGE || '',
      });
      setIsDirty(false);
    } catch (err) {
      console.error('Error loading student data:', err);
    }
    setLoading(false);
  }, []);

  // ── Insert text at cursor
  const insertAtCursor = useCallback((text, field) => {
    const refMap = { behaviorNarrative: behaviorRef, analysisNarrative: analysisRef, admissionReason: admissionRef };
    const el = refMap[field]?.current;
    if (!el) {
      updateDraft(field, (draft[field] || '') + text);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const current = draft[field] || '';
    const newValue = current.substring(0, start) + text + current.substring(end);
    updateDraft(field, newValue);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    });
  }, [draft, updateDraft]);

  // ── Toggle section
  const toggleSection = useCallback((key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ── Draft generation handlers
  const handleGenerateAdmission = useCallback(() => {
    const text = generateAdmissionDraft(selectedStudent, kteaData);
    updateDraft('admissionReason', text);
  }, [selectedStudent, kteaData, updateDraft]);

  const handleGenerateBehavior = useCallback(() => {
    const text = generateBehaviorDraft(selectedStudent, kteaData, enrollments, selectedStudent?.mtpNotes);
    updateDraft('behaviorNarrative', text);
  }, [selectedStudent, kteaData, enrollments, updateDraft]);

  const handleGenerateAnalysis = useCallback(() => {
    const text = generateAnalysisDraft(selectedStudent, kteaData);
    updateDraft('analysisNarrative', text);
  }, [selectedStudent, kteaData, updateDraft]);

  // ── Export handler
  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      if (isDirty && dbRecord?.id) await forceSave();
      await exportDischargeDocx({
        studentName: draft.studentName,
        gradeLevel: draft.gradeLevel,
        age: draft.age,
        admitDate: draft.admitDate,
        dischargeDate: draft.dischargeDate,
        admissionReason: draft.admissionReason,
        behaviorNarrative: draft.behaviorNarrative,
        analysisNarrative: draft.analysisNarrative,
        preReadingGE: draft.preReadingGE,
        postReadingGE: draft.postReadingGE,
        preMathGE: draft.preMathGE,
        postMathGE: draft.postMathGE,
        preWritingGE: draft.preWritingGE,
        postWritingGE: draft.postWritingGE,
      });
      await databaseService.logAudit(user, 'Exported Discharge Narrative', `Exported discharge narrative for ${draft.studentName}`);
    } catch (err) {
      console.error('Export failed:', err);
    }
    setExporting(false);
  }, [draft, user, isDirty, dbRecord, forceSave]);

  // ── Print handler
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ── Sentence starter helper
  const renderSentenceStarters = (section, targetField) => {
    if (showStarters !== section) return null;
    const firstName = draft.firstName || draft.studentName?.split(' ')[0] || 'The student';
    return (
      <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-3 space-y-1">
        <div className="text-xs font-bold text-rose-600 mb-2">Click to insert at cursor:</div>
        {SENTENCE_STARTERS[section].map((starter, i) => (
          <button
            key={i}
            type="button"
            onClick={() => insertAtCursor(starter.replace(/\{name\}/g, firstName), targetField)}
            className="block w-full text-left text-sm text-slate-600 hover:bg-rose-100/50 px-2 py-1.5 rounded transition-colors"
          >
            {starter.replace(/\{name\}/g, firstName)}
          </button>
        ))}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════════════════
  // STUDENT PICKER (no student selected)
  // ════════════════════════════════════════════════════════════════════════════

  if (!selectedStudent) {
    return (
      <div className="h-full flex flex-col bg-slate-50 font-sans">
        {/* Compact Header Row */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200/80 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-rose-100 rounded-xl text-rose-600">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 leading-tight">Discharge Narrative Builder</h1>
              <p className="text-xs text-slate-400">Select a student to begin</p>
            </div>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, grade, or unit..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-4 focus:ring-rose-500/20 focus:border-rose-400 bg-white outline-none transition-all"
            />
          </div>
        </div>

        {/* Student List — fills remaining space */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="max-w-3xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-sm">No students found</p>
                </div>
              ) : (
                filteredStudents.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectStudent(s)}
                    className="w-full text-left px-4 py-2.5 hover:bg-rose-50/50 transition-colors flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0 group-hover:bg-rose-100 group-hover:text-rose-700 transition-colors">
                      {getStudentInitials(s.studentName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-slate-800 truncate">{formatStudentLabel(s)}</div>
                      <div className="text-xs text-slate-400">
                        Grade {s.gradeLevel} &middot; {s.unitName || 'Unassigned'}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {s.unitName && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          {s.unitName}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ════════════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="h-full bg-slate-100 flex items-center justify-center font-sans">
        <div className="text-center animate-pulse">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600">Loading student data...</p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // NARRATIVE BUILDER (student selected)
  // ════════════════════════════════════════════════════════════════════════════

  const mtpNotes = selectedStudent?.mtpNotes || [];
  const activeEnrollments = enrollments.filter(e => e.status === 'Active');
  const gradeNum = parseInt(draft.gradeLevel) || 10;

  return (
    <div className="h-full flex flex-col bg-slate-100 font-sans overflow-hidden">

      {/* ── STICKY TOOLBAR ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm print:hidden">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center gap-3 flex-wrap">
          {/* Left: Title */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="p-1.5 bg-rose-100 rounded-lg text-rose-600 shrink-0">
              <FileText className="w-4 h-4" />
            </span>
            <span className="font-bold text-slate-800 text-sm shrink-0">
              Discharge:
            </span>
            <EditableStudentName 
              studentId={selectedStudent.id} 
              studentName={draft.studentName} 
              size="sm"
            />
            <button
              type="button"
              onClick={() => { setSelectedStudent(null); setDraft(createEmptyDraft()); setKteaData(null); setEnrollments([]); setDbRecord(null); setIsDirty(false); }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold shrink-0"
            >
              change
            </button>
          </div>

          {/* Center: Progress */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${completion.ready ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
              {completion.completed}/{completion.total} sections
            </span>
            {saveStatus === 'saving' && (
              <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
              </span>
            )}
            {saveStatus === 'saved' && lastSavedAt && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Saved {timeAgo(lastSavedAt)}
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-xs font-semibold text-red-600">Save failed</span>
            )}
          </div>

          {/* Right: Save + Export */}
          <button
            type="button"
            onClick={forceSave}
            disabled={!isDirty && saveStatus !== 'error'}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-xs border border-slate-300 shadow-sm transition-all disabled:opacity-40 flex items-center gap-1.5 shrink-0"
          >
            {saveStatus === 'saving' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-sm shadow-rose-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export Word
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">

        {/* ── SECTION 1: DEMOGRAPHICS ─────────────────────────────────── */}
        <SectionCard
          title="Student Demographics"
          icon={User}
          isOpen={openSections.demographics}
          onToggle={() => toggleSection('demographics')}
          isComplete={completion.sections.demographics}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={LABEL_CLASS}><User className="w-3 h-3" />Student Name (Syncs Globally)</label>
              <div className="p-1 px-3 bg-slate-50 border border-slate-200 rounded-lg">
                <EditableStudentName 
                  studentId={selectedStudent.id} 
                  studentName={draft.studentName} 
                />
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS}><GraduationCap className="w-3 h-3" />Grade Level</label>
              <select value={draft.gradeLevel} onChange={e => updateDraft('gradeLevel', e.target.value)} className={INPUT_CLASS}>
                <option value="">--</option>
                {['K', ...Array.from({length: 12}, (_, i) => i + 1)].map(g => <option key={g} value={String(g)}>{g === 'K' ? 'K' : `${g}th`}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>DOB / Age</label>
              <input type="text" value={draft.age} onChange={e => updateDraft('age', e.target.value)} placeholder="e.g. 16 or 01/15/2009" className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}><Calendar className="w-3 h-3" />Admission Date</label>
              <input type="date" value={draft.admitDate} onChange={e => updateDraft('admitDate', e.target.value)} className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}><Calendar className="w-3 h-3" />Discharge Date</label>
              <input type="date" value={draft.dischargeDate} onChange={e => updateDraft('dischargeDate', e.target.value)} className={INPUT_CLASS} />
            </div>
          </div>
        </SectionCard>

        {/* ── SECTION 2: ADMISSION REASON ─────────────────────────────── */}
        <SectionCard
          title="Reason for Admission"
          icon={ClipboardList}
          isOpen={openSections.admission}
          onToggle={() => toggleSection('admission')}
          isComplete={completion.sections.admission}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowStarters(showStarters === 'admission' ? null : 'admission')}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${showStarters === 'admission' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
              >
                <MessageSquare className="w-3 h-3 inline mr-1" />Starters
              </button>
            </div>
            <button
              type="button"
              onClick={handleGenerateAdmission}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Draft for me
            </button>
          </div>
          {renderSentenceStarters('admission', 'admissionReason')}
          <textarea
            ref={admissionRef}
            value={draft.admissionReason}
            onChange={e => updateDraft('admissionReason', e.target.value)}
            rows={3}
            placeholder="Describe why the student was admitted for educational services..."
            className={TEXTAREA_CLASS}
          />
          <div className="text-right text-xs text-slate-400">
            {wordCount(draft.admissionReason)} words
            {wordCount(draft.admissionReason) < 10 && wordCount(draft.admissionReason) > 0 && ' (add more detail)'}
          </div>
        </SectionCard>

        {/* ── SECTION 3: KTEA SCORES ──────────────────────────────────── */}
        <SectionCard
          title="KTEA Assessment Data"
          icon={ClipboardList}
          isOpen={openSections.scores}
          onToggle={() => toggleSection('scores')}
          isComplete={completion.sections.scores}
        >
          {kteaData ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ScoreCard label="Reading" preGE={draft.preReadingGE} postGE={draft.postReadingGE} gradeLevel={gradeNum} />
              <ScoreCard label="Math" preGE={draft.preMathGE} postGE={draft.postMathGE} gradeLevel={gradeNum} />
              <ScoreCard label="Writing" preGE={draft.preWritingGE} postGE={draft.postWritingGE} gradeLevel={gradeNum} />
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-sm">No KTEA data available</p>
              <p className="text-xs mt-1">Enter scores in the KTEA Reporter to populate this section</p>
            </div>
          )}
        </SectionCard>

        {/* ── SECTION 4: BEHAVIOR NARRATIVE ────────────────────────────── */}
        <SectionCard
          title="Classroom Performance & Behavior"
          icon={BookOpen}
          isOpen={openSections.behavior}
          onToggle={() => toggleSection('behavior')}
          isComplete={completion.sections.behavior}
        >
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowStarters(showStarters === 'behavior' ? null : 'behavior')}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${showStarters === 'behavior' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
              >
                <MessageSquare className="w-3 h-3 inline mr-1" />Starters
              </button>
              {mtpNotes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowMtpRef(!showMtpRef)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${showMtpRef ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                >
                  <StickyNote className="w-3 h-3 inline mr-1" />MTP Notes ({mtpNotes.length})
                </button>
              )}
              {activeEnrollments.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowGradeRef(!showGradeRef)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${showGradeRef ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                >
                  <BookOpen className="w-3 h-3 inline mr-1" />Grades ({activeEnrollments.length})
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleGenerateBehavior}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Draft for me
            </button>
          </div>

          {/* Reference Panels */}
          {renderSentenceStarters('behavior', 'behaviorNarrative')}

          {showMtpRef && mtpNotes.length > 0 && (
            <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
              <div className="text-xs font-bold text-amber-700 mb-1">Monthly Teaching Plan Notes</div>
              {[...mtpNotes].sort((a, b) => new Date(b.date) - new Date(a.date)).map(note => (
                <div key={note.id} className="text-sm text-slate-600 border-l-2 border-amber-300 pl-3">
                  <div className="text-xs text-slate-400 mb-0.5">
                    {note.author} &middot; {new Date(note.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                  <div className="italic">&ldquo;{note.note}&rdquo;</div>
                </div>
              ))}
            </div>
          )}

          {showGradeRef && activeEnrollments.length > 0 && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
              <div className="text-xs font-bold text-blue-700 mb-2">Current Coursework</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {activeEnrollments.map(e => (
                  <div key={e.id || e.courseId} className="text-sm text-slate-700 flex justify-between">
                    <span className="truncate">{e.courseName}</span>
                    <span className="font-bold shrink-0 ml-2">{e.letterGrade} ({e.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={behaviorRef}
            value={draft.behaviorNarrative}
            onChange={e => updateDraft('behaviorNarrative', e.target.value)}
            rows={8}
            placeholder="Describe the student's classroom performance, work ethic, behavior, strengths, and areas for growth..."
            className={TEXTAREA_CLASS}
          />
          <div className="text-right text-xs text-slate-400">
            {wordCount(draft.behaviorNarrative)} words
            {wordCount(draft.behaviorNarrative) > 0 && wordCount(draft.behaviorNarrative) < 30 && (
              <span className="text-amber-500"> (add more detail for a thorough narrative)</span>
            )}
          </div>
        </SectionCard>

        {/* ── SECTION 5: SCORE ANALYSIS ────────────────────────────────── */}
        <SectionCard
          title="Score Analysis"
          icon={TrendingUp}
          isOpen={openSections.analysis}
          onToggle={() => toggleSection('analysis')}
          isComplete={completion.sections.analysis}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowStarters(showStarters === 'analysis' ? null : 'analysis')}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${showStarters === 'analysis' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
              >
                <MessageSquare className="w-3 h-3 inline mr-1" />Starters
              </button>
            </div>
            <button
              type="button"
              onClick={handleGenerateAnalysis}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Draft for me
            </button>
          </div>

          {renderSentenceStarters('analysis', 'analysisNarrative')}

          {!kteaData && (
            <div className="bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg p-2.5 flex items-center gap-2 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Without KTEA data, this section will be based on your classroom observations.
            </div>
          )}

          <textarea
            ref={analysisRef}
            value={draft.analysisNarrative}
            onChange={e => updateDraft('analysisNarrative', e.target.value)}
            rows={5}
            placeholder="Analyze the student's KTEA score changes and overall academic progress..."
            className={TEXTAREA_CLASS}
          />
          <div className="text-right text-xs text-slate-400">
            {wordCount(draft.analysisNarrative)} words
          </div>
        </SectionCard>

        {/* ── SECTION 6: REVIEW & EXPORT ───────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
          <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-rose-600" />
            Review & Export
          </h3>

          {/* Completion Checklist */}
          <div className="space-y-2 mb-6">
            {[
              { key: 'demographics', label: 'Student demographics complete' },
              { key: 'admission', label: `Admission reason (${wordCount(draft.admissionReason)} words)` },
              { key: 'scores', label: `KTEA data ${kteaData ? 'loaded' : 'not available'}` },
              { key: 'behavior', label: `Behavior narrative (${wordCount(draft.behaviorNarrative)} words)` },
              { key: 'analysis', label: `Score analysis (${wordCount(draft.analysisNarrative)} words)` },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-3">
                {completion.sections[item.key]
                  ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  : <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                }
                <span className={`text-sm ${completion.sections[item.key] ? 'text-slate-700' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Document Summary */}
          <div className="bg-slate-50 rounded-lg p-3 mb-6 text-sm text-slate-500 border border-slate-100">
            <span className="font-semibold text-slate-600">Your document will include: </span>
            Header, student demographics, admission reason, institutional context paragraph,
            classroom performance narrative, KTEA-III results table (Reading/Math/Writing with pre/post/change),
            score analysis, closing statement, and signature block.
          </div>

          {/* Warnings */}
          {!draft.dischargeDate && (
            <div className="bg-amber-50 text-amber-700 text-sm font-semibold rounded-lg p-3 mb-4 flex items-center gap-2 border border-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Discharge date has not been set
            </div>
          )}

          {/* Export Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              Export Word Document
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="py-3 px-6 bg-white text-slate-600 rounded-xl font-bold shadow-lg shadow-slate-200/50 border border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" /> Print
            </button>
          </div>

          {/* Auto-save indicator */}
          <div className="text-center mt-3 text-xs text-slate-400">
            {saveStatus === 'saved' && lastSavedAt && `Auto-saved ${timeAgo(lastSavedAt)} \u00B7 `}
            {saveStatus === 'saving' && 'Saving... \u00B7 '}
            Narratives save automatically to the database.
          </div>
        </div>

      </div>

      </div>
      </div>
    </div>
  );
};

export default DischargeNarrativeBuilder;
