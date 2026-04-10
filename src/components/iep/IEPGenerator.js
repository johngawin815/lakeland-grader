import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileCheck, Search, Loader2, CheckCircle, AlertTriangle,
  Sparkles, Target, BookOpen, Plus, Download, Save,
  Users, Trash2, Star, X,
  ChevronDown, ChevronUp, User, Calendar, ClipboardList, Settings, Briefcase, GraduationCap,
} from 'lucide-react';
import EditableStudentName from '../EditableStudentName';
import { getStudentInitials, formatStudentLabel } from '../../utils/studentUtils';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import { databaseService } from '../../services/databaseService';
import { IEP_GOAL_BANK, getSuggestedGoals, GOAL_AREAS } from '../../data/iepGoalBank';
import {
  SERVICE_TYPES, SERVICE_LOCATIONS, FREQUENCY_OPTIONS, DURATION_OPTIONS,
  ACCOMMODATIONS, MODIFICATIONS, TRANSITION_SKILL_AREAS,
} from '../../data/iepServiceOptions';
import { generatePresentLevels } from '../../utils/iepNarrativeGenerator';
import { useAutoSave } from '../../hooks/useAutoSave';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const DECISION_MAKER_ROLES = ['Parent', 'Legal Guardian', 'Educational Surrogate', 'Foster Parent', 'Child [age 18+]', 'Other'];

const ATTENDANCE_METHODS = ['In Person', 'By Phone', 'By Video', 'Written Input', 'Excused'];

const MEASUREMENT_METHODS = [
  { id: 'Work', label: 'Work samples' },
  { id: 'Tests', label: 'Curriculum based tests' },
  { id: 'Portfolios', label: 'Portfolios' },
  { id: 'Checklists', label: 'Checklists' },
  { id: 'ScoringGuides', label: 'Scoring guides' },
  { id: 'Obs', label: 'Observation chart' },
  { id: 'Readingrecord', label: 'Reading record' },
  { id: 'Other', label: 'Other' },
];

const GOAL_DOMAINS = [
  { id: 'Ed', label: 'Post-secondary Education/Training' },
  { id: 'Emp', label: 'Employment' },
  { id: 'Liv', label: 'Independent Living' },
];

const PARTICIPANT_ROWS = [
  { label: 'Parent/Guardian 1', key: 'parent1Method' },
  { label: 'Parent/Guardian 2', key: 'parent2Method' },
  { label: 'Student', key: 'studentMethod' },
  { label: 'LEA Representative', key: 'leaRepMethod' },
  { label: 'Special Education Teacher', key: 'spedTeacherMethod' },
  { label: 'Regular Classroom Teacher', key: 'regTeacherMethod' },
  { label: 'Person who can interpret evaluation results', key: 'interpreterMethod' },
  { label: 'Part C Representative', key: 'partCRepMethod' },
  { label: 'Transition Agency Representative', key: 'transitionRepMethod' },
  { label: 'Other', key: 'otherParticipantMethod' },
];

const SPECIAL_CONSIDERATION_ITEMS = [
  { key: 'behaviorImpedes', question: 'Does the student exhibit behaviors that impede learning?' },
  { key: 'isBlind', question: 'Is the child blind or visually impaired?' },
  { key: 'isDeaf', question: 'Is the child deaf or hard of hearing?' },
  { key: 'isLEP', question: 'Does the child have limited English proficiency?' },
  { key: 'communicationNeeds', question: 'Does the child have communication needs?' },
  { key: 'assistiveTechnology', question: 'Does the child require assistive technology?' },
  { key: 'extendedSchoolYear', question: 'Extended School Year?' },
  { key: 'hasTransitionPlan', question: 'Post-secondary Transition Services (Form C)?' },
  { key: 'transferOfRights', question: 'Transfer of Rights at Age of Majority?' },
];

const TRANSITION_SUBSECTIONS = [
  {
    id: 'employment', title: 'Employment',
    colorClass: 'bg-amber-50 text-amber-800 border-amber-200',
    goalKey: 'postSecondaryEmployment',
    skillsObtainedKey: 'employmentSkillsObtained', skillsNeededKey: 'employmentSkillsNeeded',
    schoolSkillKey: 'empSchoolSkills', schoolSvcKey: 'schoolEmploymentServices',
    studentSkillKey: 'empStudentSkill', studentSvcKey: 'studentEmploymentServices',
    parentSkillKey: 'empParentSkill', parentSvcKey: 'parentEmploymentServices',
    agencyKey: 'empAgencyName',
  },
  {
    id: 'education', title: 'Education / Training',
    colorClass: 'bg-blue-50 text-blue-800 border-blue-200',
    goalKey: 'postSecondaryEducation',
    skillsObtainedKey: 'educationSkillsObtained', skillsNeededKey: 'educationSkillsNeeded',
    schoolSkillKey: 'eduSchoolSkill', schoolSvcKey: 'schoolEducationServices',
    studentSkillKey: 'eduStudentSkill', studentSvcKey: 'studentEducationServices',
    parentSkillKey: 'eduParentSkill', parentSvcKey: 'parentEducationServices',
    agencyKey: 'eduAgencyName',
  },
  {
    id: 'independentLiving', title: 'Independent Living',
    colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    goalKey: 'independentLiving',
    skillsObtainedKey: 'independentLivingSkillsObtained', skillsNeededKey: 'independentLivingSkillsNeeded',
    schoolSkillKey: 'livSchoolSkill', schoolSvcKey: 'schoolIndependentLivingServices',
    studentSkillKey: 'livStudentSkill', studentSvcKey: 'studentIndependentLivingServices',
    parentSkillKey: 'livParentSkill', parentSvcKey: 'parentIndependentLivingServices',
    agencyKey: 'livAgencySvc',
  },
];

// ─── INLINE FORM COMPONENTS ─────────────────────────────────────────────────

const INPUT_CLS = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-slate-50/50 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 hover:bg-white outline-none transition-all';

const FInput = ({ value, onChange, w = '', placeholder = '', label = '' }) => (
  <div className={w || 'w-full'}>
    {label && <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>}
    <input value={value || ''} onChange={e => onChange(e.target.value)} className={INPUT_CLS} placeholder={placeholder} />
  </div>
);

// Date input — shows native date picker, converts between YYYY-MM-DD (stored) and display
const FDateInput = ({ value, onChange, label = '' }) => {
  // Convert stored MM/DD/YYYY → YYYY-MM-DD for the input, and back on change
  const toInputVal = (v) => {
    if (!v) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const parts = v.split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}`;
    return '';
  };
  const toStored = (v) => {
    if (!v) return '';
    const [y, m, d] = v.split('-');
    return `${m}/${d}/${y}`;
  };
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>}
      <input
        type="date"
        value={toInputVal(value)}
        onChange={e => onChange(toStored(e.target.value))}
        className={INPUT_CLS + ' cursor-pointer'}
      />
    </div>
  );
};

const FArea = ({ value, onChange, rows = 3, placeholder = '', label = '' }) => (
  <div className="w-full">
    {label && <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>}
    <textarea
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      className={INPUT_CLS + ' resize-y'}
      placeholder={placeholder}
    />
  </div>
);

const FCheck = ({ checked, onChange, label }) => (
  <label className="inline-flex items-center gap-2 cursor-pointer text-sm py-0.5 mr-4 select-none">
    <span className={`inline-flex items-center justify-center w-4 h-4 rounded border transition-colors flex-shrink-0
      ${checked ? 'bg-cyan-600 border-cyan-600 text-white' : 'border-slate-300 bg-white'}`}>
      {checked && <span className="text-[10px] leading-none font-bold">&#10003;</span>}
    </span>
    {label && <span className="text-slate-700">{label}</span>}
  </label>
);

const FSelect = ({ value, onChange, options, placeholder = 'Select...', label = '' }) => (
  <div className="w-full">
    {label && <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>}
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 outline-none transition-all cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

// ─── SECTION CARD ────────────────────────────────────────────────────────────

// status: 'complete' | 'partial' | 'empty'
const SectionCard = ({ id, title, icon: Icon, badge, status, isOpen, onToggle, children }) => {
  const statusIcon = status === 'complete'
    ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">✓</span>
    : status === 'partial'
    ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-xs">~</span>
    : null;
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-cyan-600" />}
          <span className="font-bold text-slate-800">{title}</span>
          {statusIcon}
          {badge && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
              {badge}
            </span>
          )}
        </div>
        {isOpen
          ? <ChevronUp className="w-5 h-5 text-slate-400" />
          : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  );
};

// ─── GOAL BANK MODAL ────────────────────────────────────────────────────────

const GoalBankModal = ({ show, onClose, goals, draft, onAddGoal, studentName }) => {
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('All');
  const [expanded, setExpanded] = useState(null);

  if (!show) return null;

  const filteredGoals = (items) =>
    items.filter(g =>
      (areaFilter === 'All' || g.area === areaFilter) &&
      (!search || g.goalText.toLowerCase().includes(search.toLowerCase()) || g.area.toLowerCase().includes(search.toLowerCase()))
    );

  const goalCount = draft.goals?.length || 0;
  const maxReached = goalCount >= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2"><Target className="w-5 h-5 text-cyan-600" /> Goal Bank</h3>
            <p className="text-sm text-slate-500 mt-0.5">{maxReached ? <span className="text-amber-600 font-bold">3 goals selected (maximum reached)</span> : `${goalCount}/3 goals selected`}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-4 border-b border-slate-100 flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-cyan-500/20" placeholder="Search goals..." />
          </div>
          <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm cursor-pointer outline-none">
            <option value="All">All Areas</option>
            {GOAL_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {goals.suggested?.length > 0 && (
            <>
              <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 flex items-center gap-1"><Star className="w-3.5 h-3.5" /> Suggested for this student</div>
              {filteredGoals(goals.suggested).map(g => (
                <GoalBankItem key={g.id} goal={g} expanded={expanded === g.id} onExpand={() => setExpanded(expanded === g.id ? null : g.id)}
                  onAdd={() => onAddGoal(g)} disabled={maxReached || draft.goals?.some(dg => dg.sourceId === g.id)}
                  isAdded={draft.goals?.some(dg => dg.sourceId === g.id)} studentName={studentName} isSuggested />
              ))}
              <hr className="my-3 border-slate-200" />
            </>
          )}
          {filteredGoals(goals.other || []).map(g => (
            <GoalBankItem key={g.id} goal={g} expanded={expanded === g.id} onExpand={() => setExpanded(expanded === g.id ? null : g.id)}
              onAdd={() => onAddGoal(g)} disabled={maxReached || draft.goals?.some(dg => dg.sourceId === g.id)}
              isAdded={draft.goals?.some(dg => dg.sourceId === g.id)} studentName={studentName} />
          ))}
        </div>
      </div>
    </div>
  );
};

const GoalBankItem = ({ goal, expanded, onExpand, onAdd, disabled, isAdded, studentName, isSuggested }) => (
  <div className={`border rounded-xl overflow-hidden transition-all ${isSuggested ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'}`}>
    <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={onExpand}>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full">{goal.area}</span>
          <span className="text-xs text-slate-400">{goal.domain}</span>
        </div>
        <div className="text-sm text-slate-700">{goal.goalText.replace(/\{name\}/g, studentName || 'the student')}</div>
      </div>
      <button onClick={e => { e.stopPropagation(); onAdd(); }} disabled={disabled}
        className={`shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${isAdded ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200'}`}>
        {isAdded ? <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Added</span> : <span className="flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</span>}
      </button>
    </div>
    {expanded && (
      <div className="px-3 pb-3 text-xs text-slate-500 border-t border-slate-100 pt-2 space-y-1">
        <div className="font-bold text-slate-600">Benchmarks:</div>
        {goal.benchmarks.map((b, i) => <div key={i} className="ml-2">{i + 1}. {b.text}</div>)}
        <div className="mt-1"><span className="font-bold text-slate-600">Measurement:</span> {goal.measureMethod}</div>
      </div>
    )}
  </div>
);

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

const IEPGenerator = ({ user }) => {

  // --- State ---
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [allStudents, setAllStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected student & loaded data
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [kteaData, setKteaData] = useState(null);
  const [enrollments, setEnrollments] = useState([]);

  // IEP Draft
  const [draft, setDraft] = useState(createEmptyDraft());
  const [isDirty, setIsDirty] = useState(false);

  // Goal bank modal
  const [showGoalBank, setShowGoalBank] = useState(false);
  const [showCustomGoalForm, setShowCustomGoalForm] = useState(false);
  const [customGoalText, setCustomGoalText] = useState('');

  // Services inline form
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [newService, setNewService] = useState({ type: '', location: '', frequency: '', duration: '' });

  // Accordion state
  const [openSections, setOpenSections] = useState({
    demographics: true,
    decisionMaker: false,
    meeting: false,
    presentLevels: false,
    specialConsiderations: false,
    goals: false,
    services: false,
    regularEd: false,
    transition: false,
  });

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Auto-save integration
  const saveFn = useCallback(async () => {
    if (!selectedStudent) return;
    await databaseService.saveIepDraft({ ...draft, lastModified: new Date().toISOString(), modifiedBy: user?.name || 'Unknown' });
    setIsDirty(false);
  }, [draft, selectedStudent, user]);
  useAutoSave(isDirty, saveFn, { delay: 3000, enabled: !!selectedStudent });

  // Mark dirty on draft change
  useEffect(() => {
    if (selectedStudent) setIsDirty(true);
  }, [draft, selectedStudent]);

  // Load students on mount
  useEffect(() => {
    const load = async () => {
      const students = await databaseService.getAllStudents();
      setAllStudents(students.filter(s => s.active && s.iep === 'Yes'));
    };
    load();
  }, []);

  // Filter students for search
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return allStudents;
    return allStudents.filter(s =>
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allStudents, searchTerm]);

  // Suggested goals
  const goalSuggestions = useMemo(() => {
    if (!selectedStudent) return { suggested: [], other: IEP_GOAL_BANK };
    return getSuggestedGoals(selectedStudent.gradeLevel, kteaData);
  }, [selectedStudent, kteaData]);

  // ─── HANDLERS ───────────────────────────────────────────────────────────────

  const handleSelectStudent = useCallback(async (student) => {
    setSelectedStudent(student);
    setLoading(true);

    try {
      const kteaResults = await databaseService.searchKteaReports(student.studentName);
      const ktea = kteaResults?.[0] || null;
      setKteaData(ktea);

      const enroll = await databaseService.getStudentEnrollments(student.id);
      setEnrollments(enroll);

      const existingDrafts = await databaseService.getIepByStudent(student.id);
      if (existingDrafts && existingDrafts.length > 0) {
        setDraft(existingDrafts[0]);
      } else {
        // Calculate age from birthDate if available
        const age = student.birthDate ? String(Math.floor((Date.now() - new Date(student.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))) : '';
        // Determine if transition plan needed (age 14+)
        const gradeNum = parseInt(student.gradeLevel, 10);
        const needsTransition = gradeNum >= 9 || (age && parseInt(age, 10) >= 14);

        setDraft({
          ...createEmptyDraft(),
          studentId: student.id,
          studentName: student.studentName,
          gradeLevel: student.gradeLevel,
          unitName: student.unitName,
          district: student.district,
          iepDueDate: student.iepDueDate || '',
          birthDate: student.birthDate || '',
          studentAge: age,
          caseManager: user?.name || '',
          meetingType: 'Annual Review',
          // Lakeland defaults
          behaviorImpedes: true,
          regularEdExplanation: 'Student is placed in a private residential facility (Lakeland Behavioral Health System).',
          hasTransitionPlan: needsTransition,
        });
      }
    } catch (err) {
      console.error('Error loading student data:', err);
    }
    setLoading(false);
  }, [user]);

  const handleSmartPopulate = useCallback(() => {
    if (!selectedStudent) return;
    const narratives = generatePresentLevels(selectedStudent, kteaData, enrollments, selectedStudent.mtpNotes);
    setDraft(prev => ({
      ...prev,
      academicLevels: narratives.academic || prev.academicLevels,
      functionalLevels: narratives.functional || prev.functionalLevels,
      strengthsText: narratives.strengths || prev.strengthsText,
      impactStatement: narratives.impact || prev.impactStatement,
      evalSummary: buildEvalSummary(prev, kteaData),
      kteaSnapshot: kteaData || prev.kteaSnapshot,
    }));
  }, [selectedStudent, kteaData, enrollments]);

  // ─── SECTION COMPLETION STATUS ──────────────────────────────────────────────────────────
  const sectionStatus = useMemo(() => {
    const filled = (...keys) => keys.filter(k => !!draft[k]).length;
    const total = (...keys) => keys.length;
    const pct = (...keys) => filled(...keys) / total(...keys);
    const demographics = pct('studentName', 'birthDate', 'gradeLevel', 'district', 'studentMosisId');
    const decisionMaker = pct('decisionMakerRole', 'decisionMakerName');
    const meeting = pct('iepDate', 'iepInitiationDate', 'iepDueDate', 'evalDate');
    const plaafp = pct('disabilityImpact', 'strengthsText', 'parentInput', 'changesFunctioning', 'evalSummary');
    const specialC = SPECIAL_CONSIDERATION_ITEMS.length > 0 ? 'complete' : 'empty';
    const goals = draft.goals.length >= 1 ? (draft.goals.length >= 2 ? 'complete' : 'partial') : 'empty';
    const services = (draft.services.length > 0 || draft.accommodations.length > 0) ? 'complete' : 'empty';
    const s = (p) => p >= 1 ? 'complete' : p > 0 ? 'partial' : 'empty';
    return {
      demographics: s(demographics),
      decisionMaker: s(decisionMaker),
      meeting: s(meeting),
      presentLevels: s(plaafp),
      specialConsiderations: specialC,
      goals,
      services,
      regularEd: draft.regularEdExplanation ? 'complete' : (draft.regularEdInRegular === false ? 'partial' : 'empty'),
      transition: draft.hasTransitionPlan
        ? (draft.transition?.postSecondaryEmployment ? 'partial' : 'empty')
        : 'empty',
    };
  }, [draft]);

  const handleAddCustomGoal = useCallback(() => {
    if (!customGoalText.trim() || draft.goals.length >= 3) return;
    const newGoal = {
      id: Date.now(),
      sourceId: null,
      area: 'Custom',
      goalText: customGoalText.trim(),
      benchmarks: [{ text: '', targetDate: '' }, { text: '', targetDate: '' }, { text: '', targetDate: '' }],
      measureMethods: [],
      domains: [],
      baselineData: '',
      targetDate: '',
    };
    setDraft(prev => ({ ...prev, goals: [...prev.goals, newGoal] }));
    setCustomGoalText('');
    setShowCustomGoalForm(false);
    setIsDirty(true);
  }, [customGoalText, draft.goals]);

  const updateGoalField = useCallback((goalId, field, value) => {
    setDraft(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id !== goalId ? g : { ...g, [field]: value }),
    }));
  }, []);

  const updateBenchmarkText = useCallback((goalId, bIndex, value) => {
    setDraft(prev => ({
      ...prev,
      goals: prev.goals.map(g => {
        if (g.id !== goalId) return g;
        const bms = [...(g.benchmarks || [])];
        bms[bIndex] = { ...(bms[bIndex] || {}), text: value };
        return { ...g, benchmarks: bms };
      }),
    }));
  }, []);

  const handleAddGoal = useCallback((bankGoal) => {
    if (draft.goals.length >= 3) return;
    const newGoal = {
      id: Date.now(),
      sourceId: bankGoal.id,
      area: bankGoal.area,
      goalText: bankGoal.goalText.replace(/\{name\}/g, draft.studentName || 'the student').replace(/\{target\}/g, '___'),
      benchmarks: bankGoal.benchmarks.map(b => ({ text: b.text.replace(/\{name\}/g, draft.studentName || 'the student'), targetDate: '', status: '' })),
      measureMethod: bankGoal.measureMethod,
      measureMethods: [bankGoal.measureMethod.includes('Work') ? 'Work' : bankGoal.measureMethod.includes('test') ? 'Tests' : 'Obs'],
      domains: [],
      baselineData: '',
      targetDate: '',
    };
    setDraft(prev => ({ ...prev, goals: [...prev.goals, newGoal] }));
    setIsDirty(true);
  }, [draft.goals, draft.studentName]);

  const handleRemoveGoal = useCallback((goalId) => {
    setDraft(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== goalId) }));
  }, []);

  const toggleGoalMeasure = useCallback((goalId, methodId) => {
    setDraft(prev => ({
      ...prev,
      goals: prev.goals.map(g => {
        if (g.id !== goalId) return g;
        const methods = g.measureMethods || [];
        return { ...g, measureMethods: methods.includes(methodId) ? methods.filter(m => m !== methodId) : [...methods, methodId] };
      }),
    }));
  }, []);

  const toggleGoalDomain = useCallback((goalId, domainId) => {
    setDraft(prev => ({
      ...prev,
      goals: prev.goals.map(g => {
        if (g.id !== goalId) return g;
        const domains = g.domains || [];
        return { ...g, domains: domains.includes(domainId) ? domains.filter(d => d !== domainId) : [...domains, domainId] };
      }),
    }));
  }, []);

  const handleAddService = useCallback(() => {
    if (!newService.type) return;
    setDraft(prev => ({
      ...prev,
      services: [...prev.services, { ...newService, id: Date.now() }],
    }));
    setNewService({ type: '', location: '', frequency: '', duration: '' });
    setShowServiceForm(false);
  }, [newService]);

  const handleRemoveService = useCallback((serviceId) => {
    setDraft(prev => ({ ...prev, services: prev.services.filter(s => s.id !== serviceId) }));
  }, []);

  const toggleAccommodation = useCallback((accId) => {
    setDraft(prev => ({
      ...prev,
      accommodations: prev.accommodations.includes(accId) ? prev.accommodations.filter(a => a !== accId) : [...prev.accommodations, accId],
    }));
  }, []);

  const toggleModification = useCallback((modId) => {
    setDraft(prev => ({
      ...prev,
      modifications: prev.modifications.includes(modId) ? prev.modifications.filter(m => m !== modId) : [...prev.modifications, modId],
    }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await databaseService.saveIepDraft({ ...draft, lastModified: new Date().toISOString(), modifiedBy: user?.name || 'Unknown' });
      await databaseService.logAudit(user, 'Saved IEP Draft', `Saved IEP draft for ${draft.studentName}`);
      setSaveMessage('Saved successfully!');
    } catch (err) {
      console.error('Error saving IEP:', err);
      setSaveMessage('Error saving.');
    }
    setSaving(false);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleExportDocx = async () => {
    const dd = draft;

    try {
      const response = await fetch('/IEP/IEP Master Form.docx');
      if (!response.ok) throw new Error('Could not find template: IEP Master Form.docx');
      const arrayBuffer = await response.arrayBuffer();

      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        nullGetter: () => '',
      });

      // Pad goals array to 3 entries so template rows always render
      const paddedGoals = [...dd.goals];
      while (paddedGoals.length < 3) {
        paddedGoals.push({ goalText: '', benchmarks: [], measureMethods: [], domains: [] });
      }

      const data = {
        // Page 1 - Demographics
        residentName: dd.studentName || '',
        dob: dd.birthDate || '',
        grade: String(dd.gradeLevel || ''),
        address: dd.studentAddress || '',
        phone: dd.studentPhone || '',
        Age: dd.studentAge || '',
        StudentID: dd.studentMosisId || '',
        residentDistrict: dd.district || '',
        decisionMakerRole: dd.decisionMakerRole || '',
        edName: dd.decisionMakerName || '',
        edAddress: dd.decisionMakerAddress || '',
        edPhone: dd.decisionMakerPhone || '',
        edEmail: dd.decisionMakerEmail || '',
        caseManager: dd.caseManager || user?.name || '',
        caseManagerPhone: dd.caseManagerPhone || '',
        initial: dd.meetingType === 'Initial' ? '\u2612' : '\u2610',
        annual: dd.meetingType === 'Annual Review' ? '\u2612' : '\u2610',
        evalDate: dd.evalDate || '',
        prevIepDate: dd.prevIepDate || '',
        nextEvalDate: dd.triennialDate || '',
        meetingDate: dd.iepDate || '',
        initiationDate: dd.iepInitiationDate || '',
        projectedReviewDate: dd.iepDueDate || '',
        parentCopyDate: dd.copyProvidedDate || '',
        // Participants
        parent1Method: dd.parent1Method || '',
        parent2Method: dd.parent2Method || '',
        studentMethod: dd.studentMethod || '',
        leaRepMethod: dd.leaRepMethod || '',
        spedTeacherMethod: dd.spedTeacherMethod || '',
        regTeacherMethod: dd.regTeacherMethod || '',
        interpreterMethod: dd.interpreterMethod || '',
        PartcRepresentativeMethod: dd.partCRepMethod || '',
        transistionRepresentativeMethod: dd.transitionRepMethod || '',
        otherMethod: dd.otherParticipantMethod || '',
        // Page 2 - Present Levels (PLAAFP)
        disabilityImpact: dd.disabilityImpact || [dd.academicLevels, dd.impactStatement].filter(Boolean).join('\n\n') || '',
        studentStrengths: dd.strengthsText || '',
        parentConcerns: dd.parentInput || '',
        changesInFunctioning: dd.changesFunctioning || '',
        evalSummary: buildEvalSummary(dd, kteaData),
        transitionSummary: dd.transitionAssessments || '',
        // Language checkboxes
        lang_English: (dd.primaryLanguage || 'English') === 'English' ? '\u2612' : '\u2610',
        lang_Spanish: dd.primaryLanguage === 'Spanish' ? '\u2612' : '\u2610',
        lang_Sign: dd.primaryLanguage === 'Sign Language' ? '\u2612' : '\u2610',
        lang_Other: dd.primaryLanguage === 'Other' ? '\u2612' : '\u2610',
        // Pages 4-5 - Goals (loop)
        goals: paddedGoals.map((goal, i) => ({
          id: i + 1,
          goalText: goal.goalText || '',
          objective1Text: goal.benchmarks?.[0]?.text || '',
          objective2Text: goal.benchmarks?.[1]?.text || '',
          objective3Text: goal.benchmarks?.[2]?.text || '',
          domain_Ed: (goal.domains || []).includes('Ed') ? '\u2612' : '\u2610',
          domain_Emp: (goal.domains || []).includes('Emp') ? '\u2612' : '\u2610',
          domain_Liv: (goal.domains || []).includes('Liv') ? '\u2612' : '\u2610',
          meas_Work: (goal.measureMethods || []).includes('Work') ? '\u2612' : '\u2610',
          meas_Tests: (goal.measureMethods || []).includes('Tests') ? '\u2612' : '\u2610',
          meas_Portfolios: (goal.measureMethods || []).includes('Portfolios') ? '\u2612' : '\u2610',
          meas_Checklists: (goal.measureMethods || []).includes('Checklists') ? '\u2612' : '\u2610',
          meas_scoringGuides: (goal.measureMethods || []).includes('ScoringGuides') ? '\u2612' : '\u2610',
          meas_Obs: (goal.measureMethods || []).includes('Obs') ? '\u2612' : '\u2610',
          meas_Readingrecord: (goal.measureMethods || []).includes('Readingrecord') ? '\u2612' : '\u2610',
          meas_Other: (goal.measureMethods || []).includes('Other') ? '\u2612' : '\u2610',
          'date of report': '',
          progress: '\u2610',
          noProgress: '\u2610',
          GoalnotAddressed: '\u2610',
          Goalmet: '\u2610',
          descriptionOfProgress: '',
        })),
        // Transition Assessment Summaries
        assesSummary_1: dd.careerInterestAreas || '',
        assessSummary_2: buildKteaSummary(kteaData),
        assessSummary_3: dd.assessSummary3 || '',
        // Graduation
        gradeDate: dd.anticipatedGraduationDate || '',
        gradeOpt_Credits: dd.graduationOptCredits ? '\u2612' : '\u2610',
        GradeOpt_Goals: dd.graduationOptGoals ? '\u2612' : '\u2610',
        preEtsDate: dd.preEtsDate || '',
        vrIntroDate: dd.vrIntroDate || '',
        // Employment Transition
        postSecGoal_Emp: dd.transition.postSecondaryEmployment || '',
        empSkills_Obtained: dd.employmentSkillsObtained || '',
        empSkills_Needed: dd.employmentSkillsNeeded || '',
        emp_School_Skills: dd.empSchoolSkills || '',
        emp_School_Svc: dd.schoolEmploymentServices || 'provide career exploration and planning on a weekly basis.',
        emp_Student_Skill: dd.empStudentSkill || '',
        emp_Student_Svc: dd.studentEmploymentServices || 'participate in career exploration and planning.',
        emp_Parent_Skill: dd.empParentSkill || '',
        emp_Parent_Svc: dd.parentEmploymentServices || 'assist the student with locating services from outside agencies.',
        emp_Agency_Name: dd.empAgencyName || '',
        // Education Transition
        postSecGoal_Edu: dd.transition.postSecondaryEducation || '',
        eduSkills_Obtained: dd.educationSkillsObtained || '',
        eduSkills_Needed: dd.educationSkillsNeeded || '',
        edu_School_Skill: dd.eduSchoolSkill || '',
        edu_School_Svc: dd.schoolEducationServices || 'provide educational opportunities for the student to gain skills to graduate.',
        edu_Student_Skill: dd.eduStudentSkill || '',
        edu_Student_Svc: dd.studentEducationServices || 'take advantage of secondary educational opportunities.',
        edu_Parent_Skill: dd.eduParentSkill || '',
        edu_Parent_Svc: dd.parentEducationServices || 'assist the student in locating post-secondary educational facilities.',
        edu_Agency_Name: dd.eduAgencyName || '',
        // Independent Living Transition
        postSecGoal_Liv: dd.transition.independentLiving || '',
        livSkills_Obtained: dd.independentLivingSkillsObtained || '',
        livSkills_Needed: dd.independentLivingSkillsNeeded || '',
        liv_School_Skill: dd.livSchoolSkill || '',
        liv_School_Svc: dd.schoolIndependentLivingServices || 'provide life skills educational materials.',
        liv_Student_Skill: dd.livStudentSkill || '',
        liv_Student_Svc: dd.studentIndependentLivingServices || 'study and complete the life skills materials.',
        liv_Parent_Skill: dd.livParentSkill || '',
        liv_Parent_Svc: dd.parentIndependentLivingServices || 'assist the student in determining independent living resources.',
        liv_Agency_Svc: dd.livAgencySvc || '',
      };

      doc.render(data);

      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      saveAs(out, `${dd.studentName || 'Student'}_IEP.docx`);

      await databaseService.logAudit(user, 'Exported IEP', `Exported IEP document for ${dd.studentName}`);
    } catch (error) {
      console.error('Error generating IEP document:', error);
      alert('Error generating IEP document. Ensure template files exist in public/templates/.');
    }
  };

  const d = draft;

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  // No student selected — show student picker
  if (!selectedStudent) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-slate-100 flex items-start justify-center p-8 font-sans">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3 mb-1">
            <span className="p-2 bg-cyan-100 rounded-xl text-cyan-600"><FileCheck className="w-6 h-6" /></span>
            IEP Generator
          </h2>
          <p className="text-slate-500 text-sm mb-5">Select a student with active IEP status to begin.</p>
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-4 focus:ring-cyan-500/20 outline-none bg-white"
              placeholder="Search IEP students..."
            />
          </div>
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
              <span className="ml-3 text-sm font-semibold text-slate-500">Loading...</span>
            </div>
          )}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filteredStudents.map(s => {
              const dueDate = s.iepDueDate ? new Date(s.iepDueDate) : null;
              const daysUntilDue = dueDate ? Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
              const urgency = daysUntilDue !== null ? (daysUntilDue < 0 ? 'overdue' : daysUntilDue <= 30 ? 'soon' : 'ok') : null;
              return (
                <button
                  key={s.id}
                  onClick={() => handleSelectStudent(s)}
                  className="w-full text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-cyan-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <EditableStudentName 
                        studentId={s.id} 
                        studentName={s.studentName} 
                        size="sm"
                      />
                      <div>
                        <div className="font-bold text-slate-800">{formatStudentLabel(s)}</div>
                        <div className="text-xs text-slate-400">Grade {s.gradeLevel} &middot; {s.unitName}</div>
                      </div>
                    </div>
                    {urgency && (
                      <div className={`text-xs font-bold px-2 py-1 rounded-full ${urgency === 'overdue' ? 'bg-red-50 text-red-600' : urgency === 'soon' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {urgency === 'overdue' ? <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Overdue</span>
                          : `${daysUntilDue}d`}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
            {!loading && filteredStudents.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-semibold">No IEP students found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Student selected — show the IEP data entry form
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-100 font-sans">

      {/* Goal Bank Modal */}
      <GoalBankModal
        show={showGoalBank}
        onClose={() => setShowGoalBank(false)}
        goals={goalSuggestions}
        draft={draft}
        onAddGoal={handleAddGoal}
        studentName={formatStudentLabel(selectedStudent)}
      />

      {/* ─── STICKY TOOLBAR ─── */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 mr-auto">
            <FileCheck className="w-5 h-5 text-cyan-600" />
            <span className="font-bold text-sm text-slate-800">IEP:</span>
            <EditableStudentName 
              studentId={selectedStudent.id} 
              studentName={d.studentName || selectedStudent.studentName} 
              size="sm"
            />
            <button onClick={() => { setSelectedStudent(null); setDraft(createEmptyDraft()); }} className="text-xs text-slate-400 hover:text-slate-600 ml-1">(change)</button>
          </div>
          {saveMessage && (
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${saveMessage.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {saveMessage}
            </span>
          )}
          <button onClick={handleSmartPopulate} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg transition-colors">
            <Sparkles className="w-3.5 h-3.5" /> Smart Populate
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
          </button>
          <button onClick={handleExportDocx} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow transition-colors">
            <Download className="w-3.5 h-3.5" /> Export Word
          </button>
        </div>
      </div>

      {/* ─── CARD-BASED FORM ─── */}
      <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">

        {/* ══════════════════ 1. STUDENT DEMOGRAPHICS ══════════════════ */}
        <SectionCard id="demographics" title="Student Demographics" icon={User} status={sectionStatus.demographics} isOpen={openSections.demographics} onToggle={toggleSection}>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="w-full">
                <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
                  <User className="w-3 h-3" /> Student Name (Syncs Globally)
                </label>
                <div className="p-2 border border-slate-200 rounded-lg bg-slate-50/50">
                  <EditableStudentName 
                    studentId={selectedStudent.id} 
                    studentName={d.studentName} 
                  />
                </div>
              </div>
              <FInput label="Disability Category" value={d.disabilityCategory} onChange={v => setDraft(prev => ({ ...prev, disabilityCategory: v }))} placeholder="e.g. Emotional Disturbance" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FInput label="Secondary Disability" value={d.secondaryDisability} onChange={v => setDraft(prev => ({ ...prev, secondaryDisability: v }))} placeholder="e.g. SLD" />
              <FInput label="Birth Date" value={d.birthDate} onChange={v => setDraft(prev => ({ ...prev, birthDate: v }))} placeholder="MM/DD/YYYY" />
              <FInput label="Age" value={d.studentAge} onChange={v => setDraft(prev => ({ ...prev, studentAge: v }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FInput label="Grade Level" value={String(d.gradeLevel || '')} onChange={v => setDraft(prev => ({ ...prev, gradeLevel: v }))} />
              <FInput label="Student ID / MOSIS #" value={d.studentMosisId} onChange={v => setDraft(prev => ({ ...prev, studentMosisId: v }))} />
              <FInput label="Resident District" value={d.district} onChange={v => setDraft(prev => ({ ...prev, district: v }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FInput label="Current Address" value={d.studentAddress} onChange={v => setDraft(prev => ({ ...prev, studentAddress: v }))} placeholder="Student address" />
              <FInput label="Phone" value={d.studentPhone} onChange={v => setDraft(prev => ({ ...prev, studentPhone: v }))} />
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-500 border border-slate-100">
              <p className="font-semibold text-slate-600 mb-1">Serving School</p>
              <p>Lakeland Regional School &middot; 2323 West Grand Street, Springfield, MO 65802 &middot; 417-865-5581</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Primary Language / Communication Mode</label>
              <div className="flex flex-wrap gap-1">
                {['English', 'Spanish', 'Sign Language', 'Other'].map(lang => (
                  <FCheck key={lang} checked={(d.primaryLanguage || 'English') === lang}
                    onChange={() => setDraft(prev => ({ ...prev, primaryLanguage: lang }))}
                    label={lang} />
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ══════════════════ 2. DECISION MAKER & CASE MANAGER ══════════════════ */}
        <SectionCard id="decisionMaker" title="Decision Maker & Case Manager" icon={Users} status={sectionStatus.decisionMaker} isOpen={openSections.decisionMaker} onToggle={toggleSection}>
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Educational Decision Maker Role</label>
              <div className="flex flex-wrap gap-1">
                {DECISION_MAKER_ROLES.map(r => (
                  <FCheck key={r} checked={d.decisionMakerRole === r} onChange={() => setDraft(prev => ({ ...prev, decisionMakerRole: r }))} label={r} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FInput label="Decision Maker Name" value={d.decisionMakerName} onChange={v => setDraft(prev => ({ ...prev, decisionMakerName: v }))} />
              <FInput label="Phone" value={d.decisionMakerPhone} onChange={v => setDraft(prev => ({ ...prev, decisionMakerPhone: v }))} />
            </div>
            <FInput label="Address" value={d.decisionMakerAddress} onChange={v => setDraft(prev => ({ ...prev, decisionMakerAddress: v }))} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FInput label="Email" value={d.decisionMakerEmail} onChange={v => setDraft(prev => ({ ...prev, decisionMakerEmail: v }))} />
              <FInput label="Fax" value={d.decisionMakerFax} onChange={v => setDraft(prev => ({ ...prev, decisionMakerFax: v }))} />
            </div>
            <hr className="border-slate-200" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FInput label="IEP Case Manager" value={d.caseManager} onChange={v => setDraft(prev => ({ ...prev, caseManager: v }))} />
              <FInput label="Case Manager Phone" value={d.caseManagerPhone} onChange={v => setDraft(prev => ({ ...prev, caseManagerPhone: v }))} />
            </div>
          </div>
        </SectionCard>

        {/* ══════════════════ 3. MEETING INFORMATION ══════════════════ */}
        <SectionCard id="meeting" title="Meeting Information" icon={Calendar} badge={d.iepDate ? `Meeting: ${d.iepDate}` : null} status={sectionStatus.meeting} isOpen={openSections.meeting} onToggle={toggleSection}>
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">IEP Type</label>
              <div className="flex gap-4">
                <FCheck checked={d.meetingType === 'Initial'} onChange={() => setDraft(prev => ({ ...prev, meetingType: 'Initial' }))} label="Initial" />
                <FCheck checked={d.meetingType === 'Annual Review'} onChange={() => setDraft(prev => ({ ...prev, meetingType: 'Annual Review' }))} label="Annual Review" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FDateInput label="Date of IEP Meeting" value={d.iepDate} onChange={v => setDraft(prev => ({ ...prev, iepDate: v }))} />
              <FDateInput label="Initiation Date of IEP" value={d.iepInitiationDate} onChange={v => setDraft(prev => ({ ...prev, iepInitiationDate: v }))} />
              <FDateInput label="Most Recent Evaluation Date" value={d.evalDate} onChange={v => setDraft(prev => ({ ...prev, evalDate: v }))} />
              <FDateInput label="Previous IEP Review Date" value={d.prevIepDate} onChange={v => setDraft(prev => ({ ...prev, prevIepDate: v }))} />
              <FDateInput label="Next Triennial Evaluation" value={d.triennialDate} onChange={v => setDraft(prev => ({ ...prev, triennialDate: v }))} />
              <FDateInput label="Projected Annual Review Date" value={d.iepDueDate} onChange={v => setDraft(prev => ({ ...prev, iepDueDate: v }))} />
              <FDateInput label="Copy Provided to Parent(s)" value={d.copyProvidedDate} onChange={v => setDraft(prev => ({ ...prev, copyProvidedDate: v }))} />
            </div>
            <hr className="border-slate-200" />
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-3">Meeting Participants</label>
              <div className="space-y-2">
                {PARTICIPANT_ROWS.map(p => (
                  <div key={p.key} className="flex items-center gap-3">
                    <span className="text-sm text-slate-700 w-56 shrink-0">{p.label}</span>
                    <FSelect value={d[p.key]} onChange={v => setDraft(prev => ({ ...prev, [p.key]: v }))} options={ATTENDANCE_METHODS} placeholder="Select method..." />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ══════════════════ 4. PRESENT LEVELS (PLAAFP) ══════════════════ */}
        <SectionCard id="presentLevels" title="Present Levels (PLAAFP)" icon={ClipboardList} status={sectionStatus.presentLevels} isOpen={openSections.presentLevels} onToggle={toggleSection}>
          <div className="space-y-4 pt-4">
            <FArea label="How the disability affects involvement and progress in general education"
              value={d.disabilityImpact || d.academicLevels || d.impactStatement} onChange={v => setDraft(prev => ({ ...prev, disabilityImpact: v }))} rows={5}
              placeholder="Describe how the disability affects involvement and progress in the general education curriculum..." />
            <FArea label="Current Functional Performance (supports the above)" value={d.functionalLevels} onChange={v => setDraft(prev => ({ ...prev, functionalLevels: v }))} rows={3}
              placeholder="Functional skills: attention, behavior, communication, social skills..." />
            <FArea label="Student Strengths, Preferences &amp; Interests" value={d.strengthsText} onChange={v => setDraft(prev => ({ ...prev, strengthsText: v }))} rows={3}
              placeholder="Student's strengths, preferences, and interests..." />
            <FArea label="Parent/Guardian Concerns" value={d.parentInput} onChange={v => setDraft(prev => ({ ...prev, parentInput: v }))} rows={3}
              placeholder="Concerns of the parent(s) for enhancing the education of their child..." />
            <FArea label="Changes in Functioning Since Prior IEP" value={d.changesFunctioning} onChange={v => setDraft(prev => ({ ...prev, changesFunctioning: v }))} rows={3}
              placeholder="Changes in condition or circumstance since the prior IEP..." />
            <FArea label="Most Recent Evaluation / Re-evaluation Summary" value={d.evalSummary} onChange={v => setDraft(prev => ({ ...prev, evalSummary: v }))} rows={4}
              placeholder="Summary of most recent evaluation results..." />
            <FArea label="Age-Appropriate Transition Assessments Summary" value={d.transitionAssessments} onChange={v => setDraft(prev => ({ ...prev, transitionAssessments: v }))} rows={3}
              placeholder="Summary of age-appropriate transition assessments..." />
          </div>
        </SectionCard>

        {/* ══════════════════ 5. SPECIAL CONSIDERATIONS ══════════════════ */}
        <SectionCard id="specialConsiderations" title="Special Considerations" icon={Settings}
          badge={`${SPECIAL_CONSIDERATION_ITEMS.filter(i => d[i.key]).length} selected`}
          status={sectionStatus.specialConsiderations}
          isOpen={openSections.specialConsiderations} onToggle={toggleSection}>
          <div className="space-y-1 pt-4">
            {SPECIAL_CONSIDERATION_ITEMS.map(item => (
              <div key={item.key} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-700">{item.question}</span>
                <div className="flex gap-3 shrink-0 ml-4">
                  <FCheck checked={d[item.key]} onChange={() => setDraft(prev => ({ ...prev, [item.key]: !prev[item.key] }))} label="Yes" />
                  <FCheck checked={!d[item.key]} onChange={() => setDraft(prev => ({ ...prev, [item.key]: !prev[item.key] }))} label="No" />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ══════════════════ 6. ANNUAL GOALS ══════════════════ */}
        <SectionCard id="goals" title="Annual Measurable Goals" icon={Target} badge={`${d.goals.length}/3 goals`} status={sectionStatus.goals} isOpen={openSections.goals} onToggle={toggleSection}>
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-slate-500">Add up to 3 annual goals. You can edit any goal text directly.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowCustomGoalForm(s => !s); setShowGoalBank(false); }}
                  disabled={d.goals.length >= 3}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" /> Custom Goal
                </button>
                <button
                  onClick={() => { setShowGoalBank(true); setShowCustomGoalForm(false); }}
                  disabled={d.goals.length >= 3}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg transition-colors disabled:opacity-40"
                >
                  <BookOpen className="w-4 h-4" /> Goal Bank
                </button>
              </div>
            </div>

            {showCustomGoalForm && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <label className="block text-xs font-semibold text-slate-500">Write a Custom Goal</label>
                <FArea value={customGoalText} onChange={setCustomGoalText} rows={3}
                  placeholder="After a year of instruction, [student name] will..." />
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setShowCustomGoalForm(false); setCustomGoalText(''); }}
                    className="px-3 py-1.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                    Cancel
                  </button>
                  <button onClick={handleAddCustomGoal} disabled={!customGoalText.trim()}
                    className="px-4 py-1.5 text-sm font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50">
                    Add Goal
                  </button>
                </div>
              </div>
            )}

            {d.goals.length === 0 && !showCustomGoalForm && (
              <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-semibold">No goals added yet</p>
                <p className="text-xs mt-1">Use the Goal Bank to add up to 3 goals</p>
              </div>
            )}

            {d.goals.map((goal, i) => (
              <div key={goal.id} className="border border-slate-200 rounded-xl overflow-hidden">
                {/* Goal Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-700">Goal #{i + 1}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-semibold">{goal.area}</span>
                  </div>
                  <button onClick={() => handleRemoveGoal(goal.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  {/* Editable Goal Text */}
                  <FArea
                    label="Goal Statement (editable)"
                    value={goal.goalText}
                    onChange={v => updateGoalField(goal.id, 'goalText', v)}
                    rows={3}
                    placeholder="Annual measurable goal statement..."
                  />
                  {/* Baseline & Target Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FInput label="Baseline Data" value={goal.baselineData || ''}
                      onChange={v => updateGoalField(goal.id, 'baselineData', v)}
                      placeholder="Current performance level..." />
                    <FDateInput label="Target Date"
                      value={goal.targetDate || ''}
                      onChange={v => updateGoalField(goal.id, 'targetDate', v)} />
                  </div>
                  {/* Editable Benchmarks */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Measurable Benchmarks / Objectives (edit to customize)</label>
                    {(goal.benchmarks?.length > 0 ? goal.benchmarks : [{text:''},{text:''},{text:''}]).map((bm, j) => (
                      <div key={j} className="flex items-start gap-2 mb-2">
                        <span className="text-cyan-500 font-bold text-sm mt-2.5 shrink-0">{j + 1}.</span>
                        <FInput
                          value={bm.text || ''}
                          onChange={v => updateBenchmarkText(goal.id, j, v)}
                          placeholder={`Benchmark ${j + 1}...`}
                        />
                      </div>
                    ))}
                  </div>
                  {/* Transition Domain */}
                  {d.hasTransitionPlan && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">Supports Post-secondary Domain</label>
                      <div className="flex flex-wrap gap-1">
                        {GOAL_DOMAINS.map(dom => (
                          <FCheck key={dom.id} checked={(goal.domains || []).includes(dom.id)} onChange={() => toggleGoalDomain(goal.id, dom.id)} label={dom.label} />
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Measurement Methods */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Progress will be measured by (check all that apply)</label>
                    <div className="grid grid-cols-2 gap-x-4">
                      {MEASUREMENT_METHODS.map(m => (
                        <FCheck key={m.id} checked={(goal.measureMethods || []).includes(m.id)} onChange={() => toggleGoalMeasure(goal.id, m.id)} label={m.label} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ══════════════════ 7. SERVICES, ACCOMMODATIONS, MODIFICATIONS ══════════════════ */}
        <SectionCard id="services" title="Services, Accommodations & Modifications" icon={Briefcase}
          badge={`${d.services.length} svc, ${d.accommodations.length} acc`}
          status={sectionStatus.services}
          isOpen={openSections.services} onToggle={toggleSection}>
          <div className="space-y-5 pt-4">
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 border border-slate-100">
              <span className="font-semibold">Special Education Service:</span> 1050 min &middot; Weekly &middot; sped
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-slate-500">Related Services</label>
                <button onClick={() => setShowServiceForm(!showServiceForm)}
                  className="flex items-center gap-1 text-sm font-bold text-cyan-600 hover:text-cyan-700 transition-colors">
                  <Plus className="w-4 h-4" /> Add Service
                </button>
              </div>

              {showServiceForm && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-cyan-50/50 rounded-lg border border-cyan-100 mb-3">
                  <FSelect value={newService.type} onChange={v => setNewService(s => ({ ...s, type: v }))} options={SERVICE_TYPES.map(s => s.label)} placeholder="Service type..." />
                  <FSelect value={newService.duration} onChange={v => setNewService(s => ({ ...s, duration: v }))} options={DURATION_OPTIONS} placeholder="Duration..." />
                  <FSelect value={newService.frequency} onChange={v => setNewService(s => ({ ...s, frequency: v }))} options={FREQUENCY_OPTIONS} placeholder="Frequency..." />
                  <FSelect value={newService.location} onChange={v => setNewService(s => ({ ...s, location: v }))} options={SERVICE_LOCATIONS} placeholder="Location..." />
                  <div className="col-span-2 sm:col-span-4 flex justify-end">
                    <button onClick={handleAddService} disabled={!newService.type}
                      className="px-4 py-1.5 text-sm font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition-colors">
                      Add
                    </button>
                  </div>
                </div>
              )}

              {d.services.length === 0 && !showServiceForm && (
                <p className="text-sm text-slate-400 italic">No related services added.</p>
              )}
              <div className="space-y-2">
                {d.services.map(svc => (
                  <div key={svc.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                    <div className="text-sm">
                      <span className="font-semibold text-slate-800">{svc.type}</span>
                      <span className="text-slate-400 ml-2">{svc.duration} &middot; {svc.frequency} &middot; {svc.location}</span>
                    </div>
                    <button onClick={() => handleRemoveService(svc.id)} className="text-red-400 hover:text-red-600 p-1 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-slate-200" />

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-3">Accommodations</label>
              {Object.entries(ACCOMMODATIONS).map(([category, items]) => (
                <div key={category} className="mb-4">
                  <div className="text-sm font-semibold text-slate-600 mb-1.5">{category}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                    {items.map(acc => (
                      <FCheck key={acc.id} checked={d.accommodations.includes(acc.id)} onChange={() => toggleAccommodation(acc.id)} label={acc.label} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <hr className="border-slate-200" />

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-3">Modifications</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                {MODIFICATIONS.map(mod => (
                  <FCheck key={mod.id} checked={d.modifications.includes(mod.id)} onChange={() => toggleModification(mod.id)} label={mod.label} />
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ══════════════════ 8. REGULAR ED & PLACEMENT ══════════════════ */}
        <SectionCard id="regularEd" title="Regular Ed Participation & Placement" icon={GraduationCap} isOpen={openSections.regularEd} onToggle={toggleSection}>
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Will this child receive all special education services in the regular education environment?
              </label>
              <div className="flex gap-4">
                <FCheck checked={d.regularEdInRegular} onChange={() => setDraft(prev => ({ ...prev, regularEdInRegular: !prev.regularEdInRegular }))} label="Yes" />
                <FCheck checked={!d.regularEdInRegular} onChange={() => setDraft(prev => ({ ...prev, regularEdInRegular: !prev.regularEdInRegular }))} label="No" />
              </div>
            </div>
            {!d.regularEdInRegular && (
              <FArea label="Explain why services cannot be provided in the regular education environment"
                value={d.regularEdExplanation} onChange={v => setDraft(prev => ({ ...prev, regularEdExplanation: v }))} rows={2} />
            )}
            <hr className="border-slate-200" />
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-3">Placement Continuum (K-12)</label>
              <div className="space-y-2">
                {(d.placementOptions || []).map((pl, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <span className="text-sm text-slate-700">{pl.label}</span>
                    <div className="flex items-center gap-6 shrink-0 ml-4">
                      <FCheck checked={pl.considered} onChange={() => {
                        setDraft(prev => {
                          const opts = [...prev.placementOptions];
                          opts[i] = { ...opts[i], considered: !opts[i].considered };
                          return { ...prev, placementOptions: opts };
                        });
                      }} label="Considered" />
                      <FCheck checked={pl.selected} onChange={() => {
                        setDraft(prev => {
                          const opts = prev.placementOptions.map((o, j) => ({ ...o, selected: j === i ? !o.selected : false }));
                          return { ...prev, placementOptions: opts };
                        });
                      }} label="Selected" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ══════════════════ 9. TRANSITION PLAN (conditional) ══════════════════ */}
        {d.hasTransitionPlan && (
          <SectionCard id="transition" title="Post-Secondary Transition Plan (Form C)" icon={BookOpen} isOpen={openSections.transition} onToggle={toggleSection}>
            <div className="space-y-6 pt-4">

              {/* Assessment Table */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-3">Age-Appropriate Transition Assessments</label>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 items-end">
                    <FInput label="Date" value={d.transitionAssessmentDate1} onChange={v => setDraft(prev => ({ ...prev, transitionAssessmentDate1: v }))} placeholder="MM/DD/YYYY" />
                    <div className="text-sm font-medium text-slate-600 pb-2">Career Interest Survey</div>
                    <FInput label="Areas of Interest" value={d.careerInterestAreas} onChange={v => setDraft(prev => ({ ...prev, careerInterestAreas: v }))} />
                  </div>
                  <div className="grid grid-cols-3 gap-3 items-end">
                    <FInput label="Date" value={d.transitionAssessmentDate2} onChange={v => setDraft(prev => ({ ...prev, transitionAssessmentDate2: v }))} placeholder="MM/DD/YYYY" />
                    <div className="text-sm font-medium text-slate-600 pb-2">KTEA-III</div>
                    <div className="text-sm text-slate-600 pb-2">{buildKteaSummary(kteaData) || <span className="italic text-slate-400">Auto-filled from KTEA data</span>}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 items-end">
                    <FInput label="Date" value={d.transitionAssessmentDate3} onChange={v => setDraft(prev => ({ ...prev, transitionAssessmentDate3: v }))} placeholder="MM/DD/YYYY" />
                    <div className="text-sm font-medium text-slate-600 pb-2">Independent Living</div>
                    <FInput label="Summary" value={d.assessSummary3} onChange={v => setDraft(prev => ({ ...prev, assessSummary3: v }))} />
                  </div>
                </div>
              </div>

              {/* Graduation Info */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-3">Graduation Information</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FInput label="Anticipated Graduation Date" value={d.anticipatedGraduationDate} onChange={v => setDraft(prev => ({ ...prev, anticipatedGraduationDate: v }))} placeholder="MM/DD/YYYY" />
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Graduation Option</label>
                    <FCheck checked={d.graduationOptCredits} onChange={() => setDraft(prev => ({ ...prev, graduationOptCredits: !prev.graduationOptCredits }))} label="Regular diploma (credits)" />
                    <FCheck checked={d.graduationOptGoals} onChange={() => setDraft(prev => ({ ...prev, graduationOptGoals: !prev.graduationOptGoals }))} label="Regular diploma (goals)" />
                  </div>
                  <FInput label="Pre-ETS Begin Date" value={d.preEtsDate} onChange={v => setDraft(prev => ({ ...prev, preEtsDate: v }))} placeholder="MM/DD/YYYY" />
                  <FInput label="VR Introduction Date" value={d.vrIntroDate} onChange={v => setDraft(prev => ({ ...prev, vrIntroDate: v }))} placeholder="MM/DD/YYYY" />
                </div>
              </div>

              {/* Transition Subsections: Employment, Education, Independent Living */}
              {TRANSITION_SUBSECTIONS.map(sub => (
                <div key={sub.id}>
                  <div className={`text-sm font-bold px-3 py-2 rounded-lg border mb-3 ${sub.colorClass}`}>
                    {sub.title}
                  </div>
                  <div className="space-y-3 pl-1">
                    <FInput label="Post-secondary Goal" value={d.transition[sub.goalKey] || ''} onChange={v => setDraft(prev => ({ ...prev, transition: { ...prev.transition, [sub.goalKey]: v } }))} placeholder="After high school, the student will..." />
                    <FArea label="Skills Already Obtained" value={d[sub.skillsObtainedKey] || ''} onChange={v => setDraft(prev => ({ ...prev, [sub.skillsObtainedKey]: v }))} rows={2} />
                    <FArea label="Skills Needed Before Graduation" value={d[sub.skillsNeededKey] || ''} onChange={v => setDraft(prev => ({ ...prev, [sub.skillsNeededKey]: v }))} rows={2} />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs font-semibold text-slate-500 mb-2">School</div>
                        <FInput label="Target Skills" value={d[sub.schoolSkillKey] || ''} onChange={v => setDraft(prev => ({ ...prev, [sub.schoolSkillKey]: v }))} placeholder="Target skills..." />
                        <div className="mt-2">
                          <FInput label="Services/Activities" value={d[sub.schoolSvcKey] || ''} onChange={v => setDraft(prev => ({ ...prev, [sub.schoolSvcKey]: v }))} placeholder="Services..." />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 mb-2">Student</div>
                        <FInput label="Target Skills" value={d[sub.studentSkillKey] || ''} onChange={v => setDraft(prev => ({ ...prev, [sub.studentSkillKey]: v }))} placeholder="Target skills..." />
                        <div className="mt-2">
                          <FInput label="Services/Activities" value={d[sub.studentSvcKey] || ''} onChange={v => setDraft(prev => ({ ...prev, [sub.studentSvcKey]: v }))} placeholder="Services..." />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 mb-2">Parent/Guardian</div>
                        <FInput label="Target Skills" value={d[sub.parentSkillKey] || ''} onChange={v => setDraft(prev => ({ ...prev, [sub.parentSkillKey]: v }))} placeholder="Target skills..." />
                        <div className="mt-2">
                          <FInput label="Services/Activities" value={d[sub.parentSvcKey] || ''} onChange={v => setDraft(prev => ({ ...prev, [sub.parentSvcKey]: v }))} placeholder="Services..." />
                        </div>
                      </div>
                    </div>
                    <FInput label="Outside Agency" value={d[sub.agencyKey] || ''} onChange={v => setDraft(prev => ({ ...prev, [sub.agencyKey]: v }))} placeholder="Agency name/service..." />
                  </div>
                </div>
              ))}

              {/* Transition Skills Checklist */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-3">Transition Skills Checklist</label>
                {Object.entries(TRANSITION_SKILL_AREAS).map(([area, skills]) => (
                  <div key={area} className="mb-4">
                    <div className="text-sm font-semibold text-slate-600 mb-1.5">{area}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                      {skills.map(skill => (
                        <FCheck
                          key={skill}
                          checked={d.transition.targetSkills?.includes(skill) || false}
                          onChange={() => {
                            setDraft(prev => {
                              const current = prev.transition.targetSkills || [];
                              const updated = current.includes(skill)
                                ? current.filter(s => s !== skill)
                                : [...current, skill];
                              return { ...prev, transition: { ...prev.transition, targetSkills: updated } };
                            });
                          }}
                          label={skill}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        )}

      </div>
    </div>
  );
};

// ─── HELPERS ────────────────────────────────────────────────────────────────

function createEmptyDraft() {
  return {
    studentId: '', studentName: '', gradeLevel: '', unitName: '', district: '',
    iepDate: '', iepDueDate: '', meetingType: '',
    disabilityCategory: '', secondaryDisability: '',
    studentAddress: '', studentPhone: '', birthDate: '', studentAge: '',
    studentMosisId: '',
    primaryLanguage: 'English',
    disabilityImpact: '',
    decisionMakerRole: '',
    decisionMakerName: '', decisionMakerAddress: '', decisionMakerPhone: '',
    decisionMakerEmail: '', decisionMakerFax: '',
    caseManager: '', caseManagerPhone: '',
    evalDate: '', prevIepDate: '', triennialDate: '',
    iepInitiationDate: '', copyProvidedDate: '',
    parent1Method: '', parent2Method: '', studentMethod: '',
    leaRepMethod: '', spedTeacherMethod: '', regTeacherMethod: '',
    interpreterMethod: '', partCRepMethod: '', transitionRepMethod: '',
    otherParticipantMethod: '',
    // Section 1 - Present Levels (PLAAFP)
    academicLevels: '', functionalLevels: '', parentInput: '', strengthsText: '', impactStatement: '',
    changesFunctioning: '', evalSummary: '', transitionAssessments: '',
    kteaSnapshot: {},
    // Section 2 - Special Considerations
    behaviorImpedes: true,
    extendedSchoolYear: false,
    isBlind: false, isDeaf: false, isLEP: false,
    communicationNeeds: false, assistiveTechnology: false,
    transferOfRights: false,
    // Section 3 - Goals
    goals: [],
    // Section 5 - Services
    services: [],
    accommodations: [],
    modifications: [],
    // Section 7 - Regular Ed
    regularEdInRegular: false,
    regularEdExplanation: '',
    // Section 8 - Placement
    placementOptions: [
      { label: 'Inside regular class at least 80% of time', considered: true, selected: false },
      { label: 'Inside regular class 40% to 79% of time', considered: true, selected: false },
      { label: 'Inside regular class less than 40% of time', considered: true, selected: false },
      { label: 'Public separate school (day) facility', considered: true, selected: false },
      { label: 'Private separate school (day) facility', considered: true, selected: false },
      { label: 'Public residential facility', considered: true, selected: false },
      { label: 'Private residential facility', considered: true, selected: true },
      { label: 'Home/hospital', considered: false, selected: false },
    ],
    // Transition Plan (Form C)
    hasTransitionPlan: false,
    transition: { postSecondaryEducation: '', postSecondaryEmployment: '', independentLiving: '', transitionServices: [], targetSkills: [] },
    empSchoolSkills: '', empStudentSkill: '', empParentSkill: '', empAgencyName: '',
    eduSchoolSkill: '', eduStudentSkill: '', eduParentSkill: '', eduAgencyName: '',
    livSchoolSkill: '', livStudentSkill: '', livParentSkill: '', livAgencySvc: '',
    schoolEmploymentServices: '', studentEmploymentServices: '', parentEmploymentServices: '',
    schoolEducationServices: '', studentEducationServices: '', parentEducationServices: '',
    schoolIndependentLivingServices: '', studentIndependentLivingServices: '', parentIndependentLivingServices: '',
    employmentSkillsObtained: '', employmentSkillsNeeded: '',
    educationSkillsObtained: '', educationSkillsNeeded: '',
    independentLivingSkillsObtained: '', independentLivingSkillsNeeded: '',
    careerInterestAreas: '', anticipatedGraduationDate: '',
    transitionAssessmentDate1: '', transitionAssessmentDate2: '', transitionAssessmentDate3: '',
    graduationOptCredits: false, graduationOptGoals: false,
    preEtsDate: '', vrIntroDate: '',
    assessSummary3: '',
    status: 'Draft',
  };
}

function buildKteaSummary(kteaData) {
  if (!kteaData) return '';
  const parts = [];
  const readGE = kteaData.postReadingGE || kteaData.preReadingGE;
  const mathGE = kteaData.postMathGE || kteaData.preMathGE;
  const writeGE = kteaData.postWritingGE || kteaData.preWritingGE;
  if (readGE) parts.push(`Reading: ${readGE}`);
  if (mathGE) parts.push(`Math: ${mathGE}`);
  if (writeGE) parts.push(`Written Expression: ${writeGE}`);
  return parts.join(', ');
}

function buildEvalSummary(draft, kteaData) {
  if (draft.evalSummary) return draft.evalSummary;
  if (!kteaData) return '';
  const name = draft.studentName || 'The student';
  const parts = [`Upon entrance to Lakeland Regional School, students are administered the KTEA-III in Math Computation, Reading Comprehension, and Written Expression. ${name} had grade level scores as follows:`];
  if (kteaData.preReadingGE) parts.push(`Reading: ${kteaData.preReadingGE}`);
  if (kteaData.preMathGE) parts.push(`Math: ${kteaData.preMathGE}`);
  if (kteaData.preWritingGE) parts.push(`Written Expression: ${kteaData.preWritingGE}`);
  if (kteaData.postReadingGE || kteaData.postMathGE || kteaData.postWritingGE) {
    parts.push(`\nUpon most recent testing:`);
    if (kteaData.postReadingGE) parts.push(`Reading: ${kteaData.postReadingGE}`);
    if (kteaData.postMathGE) parts.push(`Math: ${kteaData.postMathGE}`);
    if (kteaData.postWritingGE) parts.push(`Written Expression: ${kteaData.postWritingGE}`);
  }
  return parts.join('\n');
}

export default IEPGenerator;
