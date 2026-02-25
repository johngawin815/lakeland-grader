import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileCheck, Search, Loader2, CheckCircle, AlertTriangle,
  Sparkles, Target, BookOpen, Plus, Printer, Download, Save,
  Users, Trash2, Star, X,
} from 'lucide-react';
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

// ─── INLINE FORM COMPONENTS ─────────────────────────────────────────────────

const FInput = ({ value, onChange, w = '', placeholder = '' }) => (
  <input
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    className={`border-b border-gray-400 bg-transparent outline-none px-1 text-blue-800 focus:border-blue-600 focus:bg-blue-50/30 text-[9pt] ${w}`}
    placeholder={placeholder}
  />
);

const FArea = ({ value, onChange, rows = 3, placeholder = '' }) => (
  <textarea
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    rows={rows}
    className="w-full border border-gray-300 bg-gray-50 p-2 text-[9pt] outline-none focus:border-blue-500 focus:bg-blue-50/20 resize-y text-blue-800"
    placeholder={placeholder}
  />
);

const FCheck = ({ checked, onChange, label }) => (
  <label className="inline-flex items-center gap-1 mr-3 cursor-pointer text-[9pt]">
    <span className={`inline-block w-3.5 h-3.5 border border-black text-[8px] leading-[14px] text-center flex-shrink-0 ${checked ? 'bg-black text-white' : ''}`}>
      {checked ? '\u2713' : ''}
    </span>
    <span>{label}</span>
  </label>
);

const FSelect = ({ value, onChange, options, placeholder = 'Select...' }) => (
  <select
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    className="border-b border-gray-400 bg-transparent outline-none px-1 text-blue-800 text-[9pt] focus:border-blue-600 cursor-pointer"
  >
    <option value="">{placeholder}</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

// ─── GOAL BANK MODAL ────────────────────────────────────────────────────────

const GoalBankModal = ({ show, onClose, goals, draft, onAddGoal, studentName }) => {
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('All');
  const [expanded, setExpanded] = useState(null);

  const addedIds = new Set(draft.goals.map(g => g.sourceId));

  const filtered = useMemo(() => {
    const all = [...goals.suggested, ...goals.other];
    return all.filter(g => {
      if (areaFilter !== 'All' && g.area !== areaFilter) return false;
      if (search && !g.goalText.toLowerCase().includes(search.toLowerCase()) && !g.domain.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [goals, areaFilter, search]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:hidden">
      <div className="bg-white rounded-xl shadow-2xl w-[700px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-bold text-lg flex items-center gap-2"><BookOpen className="w-5 h-5" /> Goal Bank</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 border-b border-gray-200 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-200" placeholder="Search goals..." />
          </div>
          <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
            <option value="All">All Areas</option>
            {GOAL_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {draft.goals.length >= 3 && (
            <div className="text-sm font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
              3 goals selected (maximum reached).
            </div>
          )}
          {filtered.map(goal => {
            const isAdded = addedIds.has(goal.id);
            const isSuggested = goals.suggested.some(g => g.id === goal.id);
            const isExpanded = expanded === goal.id;
            return (
              <div key={goal.id} className={`p-3 rounded-lg border ${isSuggested ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : goal.id)}>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{goal.area}</span>
                      <span className="text-xs text-gray-400">{goal.domain}</span>
                      {isSuggested && (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" /> Suggested
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">{goal.goalText.replace(/{name}/g, studentName || 'Student').slice(0, 180)}...</p>
                  </div>
                  <button
                    onClick={() => !isAdded && draft.goals.length < 3 && onAddGoal(goal)}
                    disabled={isAdded || draft.goals.length >= 3}
                    className={`shrink-0 p-1.5 rounded-lg transition-colors ${isAdded ? 'text-emerald-500 bg-emerald-50' : 'text-blue-600 hover:bg-blue-100'} disabled:opacity-50`}
                  >
                    {isAdded ? <CheckCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </button>
                </div>
                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                    {goal.benchmarks.map((bm, j) => (
                      <div key={j} className="text-xs text-gray-500 flex items-start gap-1.5">
                        <span className="text-blue-400 mt-0.5">&#9679;</span> {bm}
                      </div>
                    ))}
                    <div className="text-xs text-gray-400 italic mt-1">Measurement: {goal.measureMethod}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

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

  // Goal bank modal
  const [showGoalBank, setShowGoalBank] = useState(false);

  // Services inline form
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [newService, setNewService] = useState({ type: '', location: '', frequency: '', duration: '' });

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

    const snapshot = {};
    if (kteaData) {
      snapshot.preReadingGE = kteaData.preReadingGE;
      snapshot.preMathGE = kteaData.preMathGE;
      snapshot.preWritingGE = kteaData.preWritingGE;
      snapshot.postReadingGE = kteaData.postReadingGE;
      snapshot.postMathGE = kteaData.postMathGE;
      snapshot.postWritingGE = kteaData.postWritingGE;
    }

    setDraft(prev => ({
      ...prev,
      academicLevels: narratives.academic,
      functionalLevels: narratives.functional,
      strengthsText: narratives.strengths,
      impactStatement: narratives.impact,
      kteaSnapshot: snapshot,
    }));
  }, [selectedStudent, kteaData, enrollments]);

  const handleAddGoal = (goal) => {
    const goalEntry = {
      id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      area: goal.area,
      goalText: goal.goalText.replace(/{name}/g, selectedStudent?.firstName || 'The student'),
      benchmarks: goal.benchmarks.map(b => ({ text: b, targetDate: '', status: 'Not Started' })),
      measureMethod: goal.measureMethod,
      measureMethods: [],
      domains: [],
      baselineData: '',
      targetDate: '',
      sourceId: goal.id,
    };
    setDraft(prev => ({ ...prev, goals: [...prev.goals, goalEntry] }));
  };

  const handleRemoveGoal = (goalId) => {
    setDraft(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== goalId) }));
  };

  const toggleGoalMeasure = (goalId, methodId) => {
    setDraft(prev => ({
      ...prev,
      goals: prev.goals.map(g => {
        if (g.id !== goalId) return g;
        const current = g.measureMethods || [];
        const updated = current.includes(methodId) ? current.filter(m => m !== methodId) : [...current, methodId];
        return { ...g, measureMethods: updated };
      }),
    }));
  };

  const toggleGoalDomain = (goalId, domainId) => {
    setDraft(prev => ({
      ...prev,
      goals: prev.goals.map(g => {
        if (g.id !== goalId) return g;
        const current = g.domains || [];
        const updated = current.includes(domainId) ? current.filter(d => d !== domainId) : [...current, domainId];
        return { ...g, domains: updated };
      }),
    }));
  };

  const handleAddService = () => {
    if (!newService.type) return;
    const svc = { ...newService, id: `svc-${Date.now()}`, startDate: '', endDate: '' };
    setDraft(prev => ({ ...prev, services: [...prev.services, svc] }));
    setNewService({ type: '', location: '', frequency: '', duration: '' });
    setShowServiceForm(false);
  };

  const handleRemoveService = (svcId) => {
    setDraft(prev => ({ ...prev, services: prev.services.filter(s => s.id !== svcId) }));
  };

  const toggleAccommodation = (accId) => {
    setDraft(prev => {
      const accs = prev.accommodations.includes(accId)
        ? prev.accommodations.filter(a => a !== accId)
        : [...prev.accommodations, accId];
      return { ...prev, accommodations: accs };
    });
  };

  const toggleModification = (modId) => {
    setDraft(prev => {
      const mods = prev.modifications.includes(modId)
        ? prev.modifications.filter(m => m !== modId)
        : [...prev.modifications, modId];
      return { ...prev, modifications: mods };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await databaseService.saveIepDraft({ ...draft, createdBy: user?.email || 'unknown', status: 'Draft' });
      setDraft(saved);
      await databaseService.logAudit(user, 'Saved IEP Draft', `Saved IEP draft for ${draft.studentName}`);
      setSaveMessage('Draft saved successfully');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveMessage('Save failed');
    }
    setSaving(false);
  };

  const handlePrint = () => window.print();

  const handleExportDocx = async () => {
    const dd = draft;

    try {
      const response = await fetch('/templates/IEP Master Form.docx');
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
        'edEmail ': dd.decisionMakerEmail || '',
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
        disabilityImpact: [dd.academicLevels, dd.functionalLevels, dd.impactStatement].filter(Boolean).join('\n\n') || '',
        studentStrengths: dd.strengthsText || '',
        parentConcerns: dd.parentInput || '',
        changesInFunctioning: dd.changesFunctioning || '',
        evalSummary: buildEvalSummary(dd, kteaData),
        transitionSummary: dd.transitionAssessments || '',
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
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white bg-slate-400">
                        {s.firstName?.[0]}{s.lastName?.[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{s.studentName}</div>
                        <div className="text-xs text-slate-500">Grade {s.gradeLevel} &middot; {s.unitName} &middot; {s.district}</div>
                      </div>
                    </div>
                    {urgency && (
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        urgency === 'overdue' ? 'bg-red-100 text-red-700' :
                        urgency === 'soon' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {urgency === 'overdue' ? <><AlertTriangle className="w-3 h-3 inline mr-1" />Overdue</> :
                         <>{daysUntilDue}d</>}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
            {filteredStudents.length === 0 && !loading && (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="font-semibold">No IEP students found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Student selected — show the IEP form
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-200 font-sans">

      {/* Goal Bank Modal */}
      <GoalBankModal
        show={showGoalBank}
        onClose={() => setShowGoalBank(false)}
        goals={goalSuggestions}
        draft={draft}
        onAddGoal={handleAddGoal}
        studentName={selectedStudent?.firstName}
      />

      {/* ─── STICKY TOOLBAR ─── */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-300 shadow-sm print:hidden">
        <div className="max-w-[8.5in] mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 mr-auto">
            <FileCheck className="w-5 h-5 text-cyan-600" />
            <span className="font-bold text-sm text-slate-800">IEP:</span>
            <span className="font-bold text-sm text-blue-700">{d.studentName}</span>
            <button onClick={() => { setSelectedStudent(null); setDraft(createEmptyDraft()); }} className="text-xs text-slate-400 hover:text-slate-600 ml-1">(change)</button>
          </div>
          {saveMessage && (
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${saveMessage.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {saveMessage}
            </span>
          )}
          <button onClick={handleSmartPopulate} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg">
            <Sparkles className="w-3.5 h-3.5" /> Smart Populate
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
          </button>
          <button onClick={handlePrint} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button onClick={handleExportDocx} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow">
            <Download className="w-3.5 h-3.5" /> Export Word
          </button>
        </div>
      </div>

      {/* ─── SCROLLABLE FORM ─── */}
      <div className="flex justify-center py-8 px-4 print:p-0 print:bg-white">
        <div className="iep-form bg-white w-full max-w-[8.5in] shadow-2xl print:shadow-none print:max-w-full" style={{ fontSize: '9pt', lineHeight: '1.45' }}>

          {/* ═══════════════════════════════════════════════════════════════════
              PAGE 1: DEMOGRAPHICS
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="p-[0.5in]">

            {/* Title */}
            <div className="text-center mb-3">
              <div className="font-bold text-[12pt] tracking-wide">THE INDIVIDUALIZED EDUCATION PROGRAM (IEP) FOR:</div>
              <div className="mt-1">
                <span className="font-bold">Name:</span>{' '}
                <FInput value={d.studentName} onChange={v => setDraft(prev => ({ ...prev, studentName: v }))} w="min-w-[250px]" />
              </div>
              <div className="mt-0.5">
                <span className="font-bold">Disability Category:</span>{' '}
                <FInput value={d.disabilityCategory} onChange={v => setDraft(prev => ({ ...prev, disabilityCategory: v }))} w="min-w-[200px]" placeholder="e.g. Emotional Disturbance" />
              </div>
              <div className="mt-0.5">
                <span className="font-bold">Secondary Disability:</span>{' '}
                <FInput value={d.secondaryDisability} onChange={v => setDraft(prev => ({ ...prev, secondaryDisability: v }))} w="min-w-[200px]" placeholder="e.g. SLD" />
              </div>
            </div>

            {/* Student Demographic Information */}
            <div className="border border-black p-2 mb-2">
              <div className="font-bold mb-1">STUDENT DEMOGRAPHIC INFORMATION (Optional):</div>
              <div className="space-y-1">
                <div>
                  <span className="font-bold">Current Address:</span>{' '}
                  <FInput value={d.studentAddress} onChange={v => setDraft(prev => ({ ...prev, studentAddress: v }))} w="min-w-[300px]" placeholder="Student address" />
                </div>
                <div>
                  <span className="font-bold">Phone:</span>{' '}
                  <FInput value={d.studentPhone} onChange={v => setDraft(prev => ({ ...prev, studentPhone: v }))} w="min-w-[120px]" placeholder="Phone" />
                  <span className="ml-4 font-bold">Birth Date:</span>{' '}
                  <FInput value={d.birthDate} onChange={v => setDraft(prev => ({ ...prev, birthDate: v }))} w="min-w-[80px]" placeholder="MM/DD/YYYY" />
                  <span className="ml-4 font-bold">Age:</span>{' '}
                  <FInput value={d.studentAge} onChange={v => setDraft(prev => ({ ...prev, studentAge: v }))} w="min-w-[30px]" placeholder="Age" />
                </div>
                <div>
                  <span className="font-bold">Student ID #/MOSIS#:</span>{' '}
                  <FInput value={d.studentMosisId} onChange={v => setDraft(prev => ({ ...prev, studentMosisId: v }))} w="min-w-[100px]" placeholder="ID number" />
                </div>
                <div>
                  <span className="font-bold">Present Grade Level:</span>{' '}
                  <FInput value={String(d.gradeLevel || '')} onChange={v => setDraft(prev => ({ ...prev, gradeLevel: v }))} w="min-w-[40px]" />
                </div>
                <div>
                  <span className="font-bold">Resident District Home School:</span>{' '}
                  <FInput value={d.district} onChange={v => setDraft(prev => ({ ...prev, district: v }))} w="min-w-[200px]" />
                </div>
              </div>
            </div>

            {/* School Info — pre-filled */}
            <div className="border border-black p-2 mb-2 text-[8pt]">
              <div className="italic text-gray-600 mb-1">If the child is not receiving his/her special education and related services in his/her home school or resident district, indicate below where the services are being provided.</div>
              <div><span className="font-bold">District/Agency Name:</span> Lakeland Behavioral Health System</div>
              <div><span className="font-bold">School Name:</span> Lakeland Regional School</div>
              <div><span className="font-bold">Address:</span> 2323 West Grand Street, Springfield, MO 65802</div>
              <div><span className="font-bold">Phone:</span> 417-865-5581</div>
            </div>

            {/* Language & Decision Maker */}
            <div className="border border-black p-2 mb-2">
              <div className="mb-1">
                <span className="font-bold">Primary Language or Communication Mode(s):</span>{' '}
                <FCheck checked={true} onChange={() => {}} label="English" />
                <FCheck checked={false} onChange={() => {}} label="Spanish" />
                <FCheck checked={false} onChange={() => {}} label="Sign language" />
                <FCheck checked={false} onChange={() => {}} label="Other" />
              </div>
              <div className="mb-1">
                <span className="font-bold">Educational Decision Maker is:</span>{' '}
                {DECISION_MAKER_ROLES.map(r => (
                  <FCheck key={r} checked={d.decisionMakerRole === r} onChange={() => setDraft(prev => ({ ...prev, decisionMakerRole: r }))} label={r} />
                ))}
              </div>
              <div>
                <span className="font-bold">Name:</span>{' '}
                <FInput value={d.decisionMakerName} onChange={v => setDraft(prev => ({ ...prev, decisionMakerName: v }))} w="min-w-[200px]" placeholder="Parent/Guardian name" />
              </div>
              <div>
                <span className="font-bold">Address:</span>{' '}
                <FInput value={d.decisionMakerAddress} onChange={v => setDraft(prev => ({ ...prev, decisionMakerAddress: v }))} w="min-w-[300px]" placeholder="Address" />
              </div>
              <div>
                <span className="font-bold">Phone:</span>{' '}
                <FInput value={d.decisionMakerPhone} onChange={v => setDraft(prev => ({ ...prev, decisionMakerPhone: v }))} w="min-w-[100px]" placeholder="Phone" />
                <span className="ml-2 font-bold">Email:</span>{' '}
                <FInput value={d.decisionMakerEmail} onChange={v => setDraft(prev => ({ ...prev, decisionMakerEmail: v }))} w="min-w-[120px]" placeholder="Email" />
                <span className="ml-2 font-bold">Fax:</span>{' '}
                <FInput value={d.decisionMakerFax} onChange={v => setDraft(prev => ({ ...prev, decisionMakerFax: v }))} w="min-w-[100px]" placeholder="Fax" />
              </div>
            </div>

            {/* Case Manager & Dates */}
            <div className="border border-black p-2 mb-2">
              <div className="mb-1">
                <span className="font-bold">IEP Case Manager:</span>{' '}
                <FInput value={d.caseManager} onChange={v => setDraft(prev => ({ ...prev, caseManager: v }))} w="min-w-[150px]" placeholder="Case manager name" />
                <span className="ml-6 font-bold">Case Manager Phone:</span>{' '}
                <FInput value={d.caseManagerPhone} onChange={v => setDraft(prev => ({ ...prev, caseManagerPhone: v }))} w="min-w-[100px]" placeholder="Phone" />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div>
                  <span className="font-bold">IEP Type:</span>{' '}
                  <FCheck checked={d.meetingType === 'Initial'} onChange={() => setDraft(prev => ({ ...prev, meetingType: 'Initial' }))} label="Initial" />
                  <FCheck checked={d.meetingType === 'Annual Review'} onChange={() => setDraft(prev => ({ ...prev, meetingType: 'Annual Review' }))} label="Annual" />
                </div>
                <div>
                  <span className="font-bold">Date of most recent evaluation/reevaluation:</span>{' '}
                  <FInput value={d.evalDate} onChange={v => setDraft(prev => ({ ...prev, evalDate: v }))} w="min-w-[80px]" placeholder="MM/DD/YYYY" />
                </div>
                <div>
                  <span className="font-bold">Date of Previous IEP Review:</span>{' '}
                  <FInput value={d.prevIepDate} onChange={v => setDraft(prev => ({ ...prev, prevIepDate: v }))} w="min-w-[80px]" placeholder="MM/DD/YYYY" />
                </div>
                <div>
                  <span className="font-bold">Projected date for next triennial evaluation:</span>{' '}
                  <FInput value={d.triennialDate} onChange={v => setDraft(prev => ({ ...prev, triennialDate: v }))} w="min-w-[80px]" placeholder="MM/DD/YYYY" />
                </div>
              </div>
            </div>

            {/* IEP Content Dates */}
            <div className="border border-black p-2 mb-2">
              <div className="font-bold mb-1">IEP CONTENT (Required):</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div>
                  <span className="font-bold">Date of IEP Meeting:</span>{' '}
                  <FInput value={d.iepDate} onChange={v => setDraft(prev => ({ ...prev, iepDate: v }))} w="min-w-[80px]" placeholder="MM/DD/YYYY" />
                </div>
                <div>
                  <span className="font-bold">Initiation Date of IEP:</span>{' '}
                  <FInput value={d.iepInitiationDate} onChange={v => setDraft(prev => ({ ...prev, iepInitiationDate: v }))} w="min-w-[80px]" placeholder="MM/DD/YYYY" />
                </div>
                <div>
                  <span className="font-bold">Projected Date of Annual IEP Review:</span>{' '}
                  <FInput value={d.iepDueDate} onChange={v => setDraft(prev => ({ ...prev, iepDueDate: v }))} w="min-w-[80px]" placeholder="MM/DD/YYYY" />
                </div>
                <div>
                  <span className="font-bold">Parent(s)/Legal Guardian(s) provided copy of this IEP:</span>{' '}
                  <FInput value={d.copyProvidedDate} onChange={v => setDraft(prev => ({ ...prev, copyProvidedDate: v }))} w="min-w-[80px]" placeholder="MM/DD/YYYY" />
                </div>
              </div>
            </div>

            {/* Participants Table */}
            <div className="border border-black mb-2 text-[8pt]">
              <div className="font-bold p-1 bg-gray-200 border-b border-black text-[9pt]">PARTICIPANTS IN IEP MEETING AND ROLES</div>
              <div className="p-1 border-b border-black italic text-gray-600">The names and roles of individuals participating in developing the IEP meeting must be documented.</div>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-black p-1 text-left w-[45%] bg-gray-100">Name of Person and Role</th>
                    <th className="border border-black p-1 text-left w-[55%] bg-gray-100">Method of Attendance/Participation</th>
                  </tr>
                </thead>
                <tbody>
                  {PARTICIPANT_ROWS.map(p => (
                    <tr key={p.key}>
                      <td className="border border-black p-1">{p.label}</td>
                      <td className="border border-black p-1">
                        <FSelect value={d[p.key]} onChange={v => setDraft(prev => ({ ...prev, [p.key]: v }))} options={ATTENDANCE_METHODS} placeholder="Select method..." />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              PAGE 2: PRESENT LEVELS (PLAAFP)
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="p-[0.5in] pt-0">
            <div className="font-bold text-[10pt] bg-gray-200 p-1 border border-black mb-0">Present Level of Academic Achievement and Functional Performance</div>
            <div className="border border-black border-t-0 p-2 mb-2 text-[8pt]">
              <div className="italic text-gray-600 mb-2">(Functional Performance refers to general ability and problem solving, attention and organization, communication, social skills, behavior, independent living skills, and career/vocational skills.)</div>

              <div className="font-bold mb-0.5">How the child's disability affects his/her involvement and progress in the general education curriculum:</div>
              <FArea value={d.academicLevels || d.impactStatement} onChange={v => setDraft(prev => ({ ...prev, academicLevels: v }))} rows={5} placeholder="Describe how the disability affects involvement and progress in the general education curriculum..." />

              <div className="font-bold mb-0.5 mt-2">The strengths of the child:</div>
              <FArea value={d.strengthsText} onChange={v => setDraft(prev => ({ ...prev, strengthsText: v }))} rows={3} placeholder="Describe the student's strengths and interests..." />

              <div className="font-bold mb-0.5 mt-2">Concerns of the parent/guardian for enhancing the education of the student:</div>
              <FArea value={d.parentInput} onChange={v => setDraft(prev => ({ ...prev, parentInput: v }))} rows={3} placeholder="Document parent concerns and input..." />

              <div className="font-bold mb-0.5 mt-2">Changes in current functioning of the student since the initial or prior IEP:</div>
              <FArea value={d.changesFunctioning} onChange={v => setDraft(prev => ({ ...prev, changesFunctioning: v }))} rows={3} placeholder="Changes in current functioning since the initial or prior IEP..." />

              <div className="font-bold mb-0.5 mt-2">A summary of the most recent evaluation/re-evaluation results:</div>
              <FArea value={d.evalSummary} onChange={v => setDraft(prev => ({ ...prev, evalSummary: v }))} rows={4} placeholder="Summary of the most recent evaluation/re-evaluation results..." />

              <div className="font-bold mb-0.5 mt-2">A summary of formal and/or informal age appropriate transition assessments:</div>
              <FArea value={d.transitionAssessments} onChange={v => setDraft(prev => ({ ...prev, transitionAssessments: v }))} rows={3} placeholder="Summary of formal/informal age appropriate transition assessments..." />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              PAGE 3: SPECIAL CONSIDERATIONS
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="p-[0.5in] pt-0">
            <div className="font-bold text-[10pt] bg-gray-200 p-1 border border-black mb-0">2. Special Considerations: Federal and State Requirements</div>
            <div className="border border-black border-t-0 p-2 mb-2 text-[8pt] space-y-1">
              <div>
                <span className="font-bold">Does the student exhibit behaviors that impede his/her learning or that of others?</span>{' '}
                <FCheck checked={d.behaviorImpedes} onChange={() => setDraft(prev => ({ ...prev, behaviorImpedes: !prev.behaviorImpedes }))} label="Yes" />
                <FCheck checked={!d.behaviorImpedes} onChange={() => setDraft(prev => ({ ...prev, behaviorImpedes: !prev.behaviorImpedes }))} label="No" />
                {d.behaviorImpedes && <span className="ml-1 italic text-gray-600">Positive behavior interventions and supports are addressed in this IEP.</span>}
              </div>
              <div>
                <span className="font-bold">Is the child blind or visually impaired?</span>{' '}
                <FCheck checked={d.isBlind} onChange={() => setDraft(prev => ({ ...prev, isBlind: !prev.isBlind }))} label="Yes" />
                <FCheck checked={!d.isBlind} onChange={() => setDraft(prev => ({ ...prev, isBlind: !prev.isBlind }))} label="No" />
              </div>
              <div>
                <span className="font-bold">Is the child deaf or hard of hearing?</span>{' '}
                <FCheck checked={d.isDeaf} onChange={() => setDraft(prev => ({ ...prev, isDeaf: !prev.isDeaf }))} label="Yes" />
                <FCheck checked={!d.isDeaf} onChange={() => setDraft(prev => ({ ...prev, isDeaf: !prev.isDeaf }))} label="No" />
              </div>
              <div>
                <span className="font-bold">Does the child have limited English proficiency?</span>{' '}
                <FCheck checked={d.isLEP} onChange={() => setDraft(prev => ({ ...prev, isLEP: !prev.isLEP }))} label="Yes" />
                <FCheck checked={!d.isLEP} onChange={() => setDraft(prev => ({ ...prev, isLEP: !prev.isLEP }))} label="No" />
              </div>
              <div>
                <span className="font-bold">Does the child have communication needs?</span>{' '}
                <FCheck checked={d.communicationNeeds} onChange={() => setDraft(prev => ({ ...prev, communicationNeeds: !prev.communicationNeeds }))} label="Yes" />
                <FCheck checked={!d.communicationNeeds} onChange={() => setDraft(prev => ({ ...prev, communicationNeeds: !prev.communicationNeeds }))} label="No" />
              </div>
              <div>
                <span className="font-bold">Does the child require assistive technology devices and/or services?</span>{' '}
                <FCheck checked={d.assistiveTechnology} onChange={() => setDraft(prev => ({ ...prev, assistiveTechnology: !prev.assistiveTechnology }))} label="Yes" />
                <FCheck checked={!d.assistiveTechnology} onChange={() => setDraft(prev => ({ ...prev, assistiveTechnology: !prev.assistiveTechnology }))} label="No" />
              </div>
              <div>
                <span className="font-bold">Extended School Year:</span>{' '}
                <FCheck checked={d.extendedSchoolYear} onChange={() => setDraft(prev => ({ ...prev, extendedSchoolYear: !prev.extendedSchoolYear }))} label="Yes" />
                <FCheck checked={!d.extendedSchoolYear} onChange={() => setDraft(prev => ({ ...prev, extendedSchoolYear: !prev.extendedSchoolYear }))} label="No" />
              </div>
              <div>
                <span className="font-bold">Post-secondary Transition Services:</span>{' '}
                <FCheck checked={d.hasTransitionPlan} onChange={() => setDraft(prev => ({ ...prev, hasTransitionPlan: !prev.hasTransitionPlan }))} label="Yes (Form C)" />
                <FCheck checked={!d.hasTransitionPlan} onChange={() => setDraft(prev => ({ ...prev, hasTransitionPlan: !prev.hasTransitionPlan }))} label="No" />
              </div>
              <div>
                <span className="font-bold">Transfer of Rights at Age of Majority (at least one year prior to age 18):</span>{' '}
                <FCheck checked={d.transferOfRights} onChange={() => setDraft(prev => ({ ...prev, transferOfRights: !prev.transferOfRights }))} label="Yes" />
                <FCheck checked={!d.transferOfRights} onChange={() => setDraft(prev => ({ ...prev, transferOfRights: !prev.transferOfRights }))} label="No" />
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              PAGES 4-5: ANNUAL MEASURABLE GOALS
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="p-[0.5in] pt-0">
            <div className="font-bold text-[10pt] bg-gray-200 p-1 border border-black mb-0 flex items-center justify-between">
              <span>3. Annual Measurable Goals</span>
              <button
                onClick={() => setShowGoalBank(true)}
                disabled={d.goals.length >= 3}
                className="flex items-center gap-1 px-2 py-0.5 text-[8pt] font-bold text-cyan-700 bg-white hover:bg-cyan-50 border border-cyan-300 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed print:hidden"
              >
                <Plus className="w-3 h-3" /> Add from Goal Bank
              </button>
            </div>
            <div className="border border-black border-t-0 p-2 mb-2">

              {d.goals.length === 0 && (
                <div className="text-center py-6 text-gray-400 italic">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No goals added yet. Click &quot;Add from Goal Bank&quot; above (3 goals required).</p>
                </div>
              )}

              {d.goals.map((goal, i) => (
                <div key={goal.id} className={`${i > 0 ? 'mt-4 pt-4 border-t-2 border-gray-300' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[10pt]">Annual Goal #{i + 1}</span>
                    <button onClick={() => handleRemoveGoal(goal.id)} className="text-red-400 hover:text-red-600 transition-colors print:hidden">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="border border-gray-300 bg-gray-50 p-2 mb-2 whitespace-pre-wrap text-[9pt]">{goal.goalText}</div>

                  <div className="font-bold mb-1 text-[9pt]">Measurable Benchmarks/Objectives:</div>
                  {goal.benchmarks.map((bm, j) => (
                    <div key={j} className="mb-0.5 pl-2 text-[9pt]">
                      <span className="font-bold">{j + 1}.</span> {bm.text}
                    </div>
                  ))}

                  {/* Transition Domain Selection */}
                  {d.hasTransitionPlan && (
                    <div className="mt-2 pt-1 border-t border-gray-200">
                      <div className="font-bold text-[8pt]">For students with Post-secondary Transition Plans, this annual goal supports:</div>
                      <div className="text-[8pt] mt-0.5">
                        {GOAL_DOMAINS.map(dom => (
                          <FCheck key={dom.id} checked={(goal.domains || []).includes(dom.id)} onChange={() => toggleGoalDomain(goal.id, dom.id)} label={dom.label} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Measurement Methods */}
                  <div className="mt-2 pt-1 border-t border-gray-200">
                    <div className="font-bold text-[8pt]">Progress toward the goal will be measured by:</div>
                    <div className="text-[8pt] mt-0.5">
                      {MEASUREMENT_METHODS.map(m => (
                        <FCheck key={m.id} checked={(goal.measureMethods || []).includes(m.id)} onChange={() => toggleGoalMeasure(goal.id, m.id)} label={m.label} />
                      ))}
                    </div>
                  </div>

                  {/* Progress Reporting Table */}
                  <div className="mt-2">
                    <table className="w-full border-collapse text-[8pt]">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-black p-1 text-left w-[15%]">Date of Report</th>
                          <th className="border border-black p-1 text-left w-[30%]">Summary Statement</th>
                          <th className="border border-black p-1 text-left w-[55%]">Description of progress data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3].map(r => (
                          <tr key={r}>
                            <td className="border border-black p-1 h-8"></td>
                            <td className="border border-black p-1 h-8 text-[7pt]">
                              <FCheck checked={false} onChange={() => {}} label="Making progress" /><br/>
                              <FCheck checked={false} onChange={() => {}} label="Not making progress" /><br/>
                              <FCheck checked={false} onChange={() => {}} label="Goal met" />
                            </td>
                            <td className="border border-black p-1 h-8"></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              PAGE 6: SERVICE SUMMARY
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="p-[0.5in] pt-0">
            <div className="font-bold text-[10pt] bg-gray-200 p-1 border border-black mb-0">5. Service Summary</div>
            <div className="border border-black border-t-0 mb-2 text-[8pt]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1 text-left" colSpan={2}>Service</th>
                    <th className="border border-black p-1 text-center">Amount</th>
                    <th className="border border-black p-1 text-center">Frequency</th>
                    <th className="border border-black p-1 text-center">Location</th>
                    <th className="border border-black p-1 text-center">Begin Date*</th>
                    <th className="border border-black p-1 text-center">End Date*</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Pre-filled Special Ed row */}
                  <tr>
                    <td className="border border-black p-1 font-bold bg-gray-50" colSpan={2}>Special Education Service</td>
                    <td className="border border-black p-1 text-center">1050 min</td>
                    <td className="border border-black p-1 text-center">Weekly</td>
                    <td className="border border-black p-1 text-center">sped</td>
                    <td className="border border-black p-1 text-center"></td>
                    <td className="border border-black p-1 text-center"></td>
                  </tr>

                  {/* Related Services header */}
                  <tr>
                    <td className="border border-black p-1 font-bold bg-gray-50" colSpan={7}>
                      Related Services
                      <button onClick={() => setShowServiceForm(!showServiceForm)} className="ml-3 text-cyan-600 hover:text-cyan-800 text-[8pt] font-bold print:hidden">
                        [+ Add Service]
                      </button>
                    </td>
                  </tr>

                  {/* Add service form row */}
                  {showServiceForm && (
                    <tr className="print:hidden">
                      <td className="border border-black p-1" colSpan={2}>
                        <select value={newService.type} onChange={e => setNewService(s => ({ ...s, type: e.target.value }))} className="w-full p-1 border border-gray-300 rounded text-[8pt] bg-white">
                          <option value="">Select service...</option>
                          {SERVICE_TYPES.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                        </select>
                      </td>
                      <td className="border border-black p-1">
                        <select value={newService.duration} onChange={e => setNewService(s => ({ ...s, duration: e.target.value }))} className="w-full p-1 border border-gray-300 rounded text-[8pt] bg-white">
                          <option value="">Duration...</option>
                          {DURATION_OPTIONS.map(dd => <option key={dd} value={dd}>{dd}</option>)}
                        </select>
                      </td>
                      <td className="border border-black p-1">
                        <select value={newService.frequency} onChange={e => setNewService(s => ({ ...s, frequency: e.target.value }))} className="w-full p-1 border border-gray-300 rounded text-[8pt] bg-white">
                          <option value="">Freq...</option>
                          {FREQUENCY_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </td>
                      <td className="border border-black p-1">
                        <select value={newService.location} onChange={e => setNewService(s => ({ ...s, location: e.target.value }))} className="w-full p-1 border border-gray-300 rounded text-[8pt] bg-white">
                          <option value="">Location...</option>
                          {SERVICE_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </td>
                      <td className="border border-black p-1 text-center" colSpan={2}>
                        <button onClick={handleAddService} disabled={!newService.type} className="px-2 py-0.5 text-[8pt] font-bold text-white bg-cyan-600 rounded hover:bg-cyan-700 disabled:opacity-50">
                          Add
                        </button>
                      </td>
                    </tr>
                  )}

                  {/* Service rows */}
                  {d.services.map(svc => (
                    <tr key={svc.id}>
                      <td className="border border-black p-1" colSpan={2}>
                        {svc.type}
                        <button onClick={() => handleRemoveService(svc.id)} className="ml-2 text-red-400 hover:text-red-600 print:hidden">
                          <Trash2 className="w-3 h-3 inline" />
                        </button>
                      </td>
                      <td className="border border-black p-1 text-center">{svc.duration || '-'}</td>
                      <td className="border border-black p-1 text-center">{svc.frequency || '-'}</td>
                      <td className="border border-black p-1 text-center">{svc.location || '-'}</td>
                      <td className="border border-black p-1 text-center"></td>
                      <td className="border border-black p-1 text-center"></td>
                    </tr>
                  ))}
                  {d.services.length === 0 && (
                    <tr>
                      <td className="border border-black p-1 text-gray-400 italic" colSpan={7}>No related services added.</td>
                    </tr>
                  )}

                  {/* Accommodations & Modifications */}
                  <tr>
                    <td className="border border-black p-1 font-bold bg-gray-50" colSpan={7}>Program Modifications and Accommodations</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2" colSpan={7}>
                      {Object.entries(ACCOMMODATIONS).map(([category, items]) => (
                        <div key={category} className="mb-2">
                          <div className="font-bold text-[8pt] mb-0.5">{category}</div>
                          <div className="grid grid-cols-2 gap-x-4">
                            {items.map(acc => (
                              <FCheck key={acc.id} checked={d.accommodations.includes(acc.id)} onChange={() => toggleAccommodation(acc.id)} label={acc.label} />
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="mt-2 pt-1 border-t border-gray-200">
                        <div className="font-bold text-[8pt] mb-0.5">Modifications</div>
                        <div className="grid grid-cols-2 gap-x-4">
                          {MODIFICATIONS.map(mod => (
                            <FCheck key={mod.id} checked={d.modifications.includes(mod.id)} onChange={() => toggleModification(mod.id)} label={mod.label} />
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="p-1 text-[7pt] italic text-gray-500">*N/A if will be same as initiation and annual review date indicated on page 1.</div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              PAGES 7-8: REGULAR ED PARTICIPATION & PLACEMENT
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="p-[0.5in] pt-0">
            <div className="font-bold text-[10pt] bg-gray-200 p-1 border border-black mb-0">7. Regular Education Participation</div>
            <div className="border border-black border-t-0 p-2 mb-2 text-[8pt] space-y-1">
              <div className="font-bold">For K-12: Will this child receive all special education and related services in the regular education environment?</div>
              <div>
                <FCheck checked={d.regularEdInRegular} onChange={() => setDraft(prev => ({ ...prev, regularEdInRegular: !prev.regularEdInRegular }))} label="Yes" />
                {' '}
                <FCheck checked={!d.regularEdInRegular} onChange={() => setDraft(prev => ({ ...prev, regularEdInRegular: !prev.regularEdInRegular }))} label="No" />
              </div>
              {!d.regularEdInRegular && (
                <div>
                  <span className="font-bold">If no, explain why services cannot be provided in the regular education environment:</span>
                  <FArea value={d.regularEdExplanation} onChange={v => setDraft(prev => ({ ...prev, regularEdExplanation: v }))} rows={2} placeholder="Student is placed in a private residential facility (Lakeland Behavioral Health System)." />
                </div>
              )}
            </div>
          </div>

          <div className="p-[0.5in] pt-0">
            <div className="font-bold text-[10pt] bg-gray-200 p-1 border border-black mb-0">8. Placement Considerations and Decision</div>
            <div className="border border-black border-t-0 p-2 mb-2 text-[8pt]">
              <div className="mb-1 font-bold">Placement Continuum (K-12)</div>
              <table className="w-full border-collapse text-[8pt]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1 text-left">Placement Option</th>
                    <th className="border border-black p-1 text-center w-16">Considered</th>
                    <th className="border border-black p-1 text-center w-16">Selected</th>
                  </tr>
                </thead>
                <tbody>
                  {(d.placementOptions || []).map((pl, i) => (
                    <tr key={i}>
                      <td className="border border-black p-1">{pl.label}</td>
                      <td className="border border-black p-0.5 text-center">
                        <FCheck checked={pl.considered} onChange={() => {
                          setDraft(prev => {
                            const opts = [...prev.placementOptions];
                            opts[i] = { ...opts[i], considered: !opts[i].considered };
                            return { ...prev, placementOptions: opts };
                          });
                        }} label="" />
                      </td>
                      <td className="border border-black p-0.5 text-center">
                        <FCheck checked={pl.selected} onChange={() => {
                          setDraft(prev => {
                            const opts = prev.placementOptions.map((o, j) => ({ ...o, selected: j === i ? !o.selected : false }));
                            return { ...prev, placementOptions: opts };
                          });
                        }} label="" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              PAGES 11-14: TRANSITION PLAN (if enabled)
              ═══════════════════════════════════════════════════════════════════ */}
          {d.hasTransitionPlan && (
            <div className="p-[0.5in] pt-0">
              <div className="font-bold text-[10pt] bg-gray-200 p-1 border border-black mb-0">Form C: Post-Secondary Transition Plan</div>
              <div className="border border-black border-t-0 p-2 mb-2 text-[8pt] space-y-4">

                {/* Assessment Table */}
                <div>
                  <div className="font-bold text-[9pt] mb-1">Age-Appropriate Transition Assessments</div>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-1 text-left w-[15%]">Date</th>
                        <th className="border border-black p-1 text-left w-[25%]">Assessment</th>
                        <th className="border border-black p-1 text-left w-[60%]">Summary of Results</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black p-1">
                          <FInput value={d.transitionAssessmentDate1} onChange={v => setDraft(prev => ({ ...prev, transitionAssessmentDate1: v }))} w="w-full" placeholder="Date" />
                        </td>
                        <td className="border border-black p-1">Career Interest Survey</td>
                        <td className="border border-black p-1">
                          <FInput value={d.careerInterestAreas} onChange={v => setDraft(prev => ({ ...prev, careerInterestAreas: v }))} w="w-full" placeholder="Career interest areas..." />
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1">
                          <FInput value={d.transitionAssessmentDate2} onChange={v => setDraft(prev => ({ ...prev, transitionAssessmentDate2: v }))} w="w-full" placeholder="Date" />
                        </td>
                        <td className="border border-black p-1">KTEA-III</td>
                        <td className="border border-black p-1 text-[7pt]">{buildKteaSummary(kteaData) || <span className="text-gray-400 italic">Auto-filled from KTEA data</span>}</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1">
                          <FInput value={d.transitionAssessmentDate3} onChange={v => setDraft(prev => ({ ...prev, transitionAssessmentDate3: v }))} w="w-full" placeholder="Date" />
                        </td>
                        <td className="border border-black p-1">Independent Living</td>
                        <td className="border border-black p-1">
                          <FInput value={d.assessSummary3} onChange={v => setDraft(prev => ({ ...prev, assessSummary3: v }))} w="w-full" placeholder="Summary..." />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Graduation Info */}
                <div>
                  <div className="font-bold text-[9pt] mb-1">Graduation Information</div>
                  <div className="mb-1">
                    <span className="font-bold">Anticipated Graduation Date:</span>{' '}
                    <FInput value={d.anticipatedGraduationDate} onChange={v => setDraft(prev => ({ ...prev, anticipatedGraduationDate: v }))} w="min-w-[100px]" placeholder="MM/DD/YYYY" />
                  </div>
                  <div className="mb-1">
                    <span className="font-bold">Graduation Option:</span>{' '}
                    <FCheck checked={d.graduationOptCredits} onChange={() => setDraft(prev => ({ ...prev, graduationOptCredits: !prev.graduationOptCredits }))} label="Regular diploma based on credits" />
                    <FCheck checked={d.graduationOptGoals} onChange={() => setDraft(prev => ({ ...prev, graduationOptGoals: !prev.graduationOptGoals }))} label="Regular diploma based on meeting goals" />
                  </div>
                  <div>
                    <span className="font-bold">Pre-ETS Begin Date:</span>{' '}
                    <FInput value={d.preEtsDate} onChange={v => setDraft(prev => ({ ...prev, preEtsDate: v }))} w="min-w-[80px]" placeholder="MM/DD/YYYY" />
                    <span className="ml-4 font-bold">VR Introduction Date:</span>{' '}
                    <FInput value={d.vrIntroDate} onChange={v => setDraft(prev => ({ ...prev, vrIntroDate: v }))} w="min-w-[80px]" placeholder="MM/DD/YYYY" />
                  </div>
                </div>

                {/* ─── EMPLOYMENT ─── */}
                <div>
                  <div className="font-bold text-[9pt] bg-amber-50 p-1 border border-amber-200 mb-1">Employment</div>
                  <div className="mb-1">
                    <span className="font-bold">Post-secondary Goal:</span> After high school,{' '}
                    <FInput value={d.transition.postSecondaryEmployment} onChange={v => setDraft(prev => ({ ...prev, transition: { ...prev.transition, postSecondaryEmployment: v } }))} w="min-w-[350px]" placeholder="the student will pursue employment in..." />
                  </div>
                  <div className="mb-1">
                    <span className="font-bold">Skills Already Obtained:</span>
                    <FArea value={d.employmentSkillsObtained} onChange={v => setDraft(prev => ({ ...prev, employmentSkillsObtained: v }))} rows={2} placeholder="List employment-related skills the student already has..." />
                  </div>
                  <div className="mb-1">
                    <span className="font-bold">Skills Needed Before Graduation:</span>
                    <FArea value={d.employmentSkillsNeeded} onChange={v => setDraft(prev => ({ ...prev, employmentSkillsNeeded: v }))} rows={2} placeholder="Resume writing, job applications, interview skills..." />
                  </div>
                  <table className="w-full border-collapse mt-1">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-1 text-left w-[25%]">Agency</th>
                        <th className="border border-black p-1 text-left w-[35%]">Target Skills</th>
                        <th className="border border-black p-1 text-left w-[40%]">Services/Activities</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black p-1 font-bold">School</td>
                        <td className="border border-black p-1"><FInput value={d.empSchoolSkills} onChange={v => setDraft(prev => ({ ...prev, empSchoolSkills: v }))} w="w-full" placeholder="Target skills..." /></td>
                        <td className="border border-black p-1"><FInput value={d.schoolEmploymentServices} onChange={v => setDraft(prev => ({ ...prev, schoolEmploymentServices: v }))} w="w-full" placeholder="provide career exploration..." /></td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1 font-bold">Student</td>
                        <td className="border border-black p-1"><FInput value={d.empStudentSkill} onChange={v => setDraft(prev => ({ ...prev, empStudentSkill: v }))} w="w-full" placeholder="Target skills..." /></td>
                        <td className="border border-black p-1"><FInput value={d.studentEmploymentServices} onChange={v => setDraft(prev => ({ ...prev, studentEmploymentServices: v }))} w="w-full" placeholder="participate in career exploration..." /></td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1 font-bold">Parent/Guardian</td>
                        <td className="border border-black p-1"><FInput value={d.empParentSkill} onChange={v => setDraft(prev => ({ ...prev, empParentSkill: v }))} w="w-full" placeholder="Target skills..." /></td>
                        <td className="border border-black p-1"><FInput value={d.parentEmploymentServices} onChange={v => setDraft(prev => ({ ...prev, parentEmploymentServices: v }))} w="w-full" placeholder="assist the student with..." /></td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1 font-bold">Outside Agency</td>
                        <td className="border border-black p-1" colSpan={2}><FInput value={d.empAgencyName} onChange={v => setDraft(prev => ({ ...prev, empAgencyName: v }))} w="w-full" placeholder="Agency name..." /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* ─── EDUCATION/TRAINING ─── */}
                <div>
                  <div className="font-bold text-[9pt] bg-blue-50 p-1 border border-blue-200 mb-1">Education / Training</div>
                  <div className="mb-1">
                    <span className="font-bold">Post-secondary Goal:</span> After high school,{' '}
                    <FInput value={d.transition.postSecondaryEducation} onChange={v => setDraft(prev => ({ ...prev, transition: { ...prev.transition, postSecondaryEducation: v } }))} w="min-w-[350px]" placeholder="the student will attend..." />
                  </div>
                  <div className="mb-1">
                    <span className="font-bold">Skills Already Obtained:</span>
                    <FArea value={d.educationSkillsObtained} onChange={v => setDraft(prev => ({ ...prev, educationSkillsObtained: v }))} rows={2} placeholder="Use electronic media for career info, variety of resources..." />
                  </div>
                  <div className="mb-1">
                    <span className="font-bold">Skills Needed Before Graduation:</span>
                    <FArea value={d.educationSkillsNeeded} onChange={v => setDraft(prev => ({ ...prev, educationSkillsNeeded: v }))} rows={2} placeholder="Identify vocational service providers, sources of financial aid..." />
                  </div>
                  <table className="w-full border-collapse mt-1">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-1 text-left w-[25%]">Agency</th>
                        <th className="border border-black p-1 text-left w-[35%]">Target Skills</th>
                        <th className="border border-black p-1 text-left w-[40%]">Services/Activities</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black p-1 font-bold">School</td>
                        <td className="border border-black p-1"><FInput value={d.eduSchoolSkill} onChange={v => setDraft(prev => ({ ...prev, eduSchoolSkill: v }))} w="w-full" placeholder="Target skills..." /></td>
                        <td className="border border-black p-1"><FInput value={d.schoolEducationServices} onChange={v => setDraft(prev => ({ ...prev, schoolEducationServices: v }))} w="w-full" placeholder="provide educational opportunities..." /></td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1 font-bold">Student</td>
                        <td className="border border-black p-1"><FInput value={d.eduStudentSkill} onChange={v => setDraft(prev => ({ ...prev, eduStudentSkill: v }))} w="w-full" placeholder="Target skills..." /></td>
                        <td className="border border-black p-1"><FInput value={d.studentEducationServices} onChange={v => setDraft(prev => ({ ...prev, studentEducationServices: v }))} w="w-full" placeholder="take advantage of educational opportunities..." /></td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1 font-bold">Parent/Guardian</td>
                        <td className="border border-black p-1"><FInput value={d.eduParentSkill} onChange={v => setDraft(prev => ({ ...prev, eduParentSkill: v }))} w="w-full" placeholder="Target skills..." /></td>
                        <td className="border border-black p-1"><FInput value={d.parentEducationServices} onChange={v => setDraft(prev => ({ ...prev, parentEducationServices: v }))} w="w-full" placeholder="assist the student in locating..." /></td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1 font-bold">Outside Agency</td>
                        <td className="border border-black p-1" colSpan={2}><FInput value={d.eduAgencyName} onChange={v => setDraft(prev => ({ ...prev, eduAgencyName: v }))} w="w-full" placeholder="Agency name..." /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* ─── INDEPENDENT LIVING ─── */}
                <div>
                  <div className="font-bold text-[9pt] bg-emerald-50 p-1 border border-emerald-200 mb-1">Independent Living</div>
                  <div className="mb-1">
                    <span className="font-bold">Post-secondary Goal:</span> After high school,{' '}
                    <FInput value={d.transition.independentLiving} onChange={v => setDraft(prev => ({ ...prev, transition: { ...prev.transition, independentLiving: v } }))} w="min-w-[350px]" placeholder="the student will demonstrate the ability to..." />
                  </div>
                  <div className="mb-1">
                    <span className="font-bold">Skills Already Obtained:</span>
                    <FArea value={d.independentLivingSkillsObtained} onChange={v => setDraft(prev => ({ ...prev, independentLivingSkillsObtained: v }))} rows={2} placeholder="Skills the student already has for independent living..." />
                  </div>
                  <div className="mb-1">
                    <span className="font-bold">Skills Needed Before Graduation:</span>
                    <FArea value={d.independentLivingSkillsNeeded} onChange={v => setDraft(prev => ({ ...prev, independentLivingSkillsNeeded: v }))} rows={2} placeholder="Banking, checking account, ATM, budgeting, cooking..." />
                  </div>
                  <table className="w-full border-collapse mt-1">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-1 text-left w-[25%]">Agency</th>
                        <th className="border border-black p-1 text-left w-[35%]">Target Skills</th>
                        <th className="border border-black p-1 text-left w-[40%]">Services/Activities</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black p-1 font-bold">School</td>
                        <td className="border border-black p-1"><FInput value={d.livSchoolSkill} onChange={v => setDraft(prev => ({ ...prev, livSchoolSkill: v }))} w="w-full" placeholder="Target skills..." /></td>
                        <td className="border border-black p-1"><FInput value={d.schoolIndependentLivingServices} onChange={v => setDraft(prev => ({ ...prev, schoolIndependentLivingServices: v }))} w="w-full" placeholder="provide life skills materials..." /></td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1 font-bold">Student</td>
                        <td className="border border-black p-1"><FInput value={d.livStudentSkill} onChange={v => setDraft(prev => ({ ...prev, livStudentSkill: v }))} w="w-full" placeholder="Target skills..." /></td>
                        <td className="border border-black p-1"><FInput value={d.studentIndependentLivingServices} onChange={v => setDraft(prev => ({ ...prev, studentIndependentLivingServices: v }))} w="w-full" placeholder="study and complete life skills materials..." /></td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1 font-bold">Parent/Guardian</td>
                        <td className="border border-black p-1"><FInput value={d.livParentSkill} onChange={v => setDraft(prev => ({ ...prev, livParentSkill: v }))} w="w-full" placeholder="Target skills..." /></td>
                        <td className="border border-black p-1"><FInput value={d.parentIndependentLivingServices} onChange={v => setDraft(prev => ({ ...prev, parentIndependentLivingServices: v }))} w="w-full" placeholder="assist the student in determining..." /></td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1 font-bold">Outside Agency</td>
                        <td className="border border-black p-1" colSpan={2}><FInput value={d.livAgencySvc} onChange={v => setDraft(prev => ({ ...prev, livAgencySvc: v }))} w="w-full" placeholder="Agency name/service..." /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Transition Skills Checklist */}
                <div>
                  <div className="font-bold text-[9pt] mb-1">Transition Skills Checklist</div>
                  {Object.entries(TRANSITION_SKILL_AREAS).map(([area, skills]) => (
                    <div key={area} className="mb-2">
                      <div className="font-bold text-[8pt] mb-0.5">{area}</div>
                      <div className="grid grid-cols-2 gap-x-4">
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
            </div>
          )}

        </div>
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
    parts.push(`\nPost-test scores:`);
    if (kteaData.postReadingGE) parts.push(`Reading: ${kteaData.postReadingGE}`);
    if (kteaData.postMathGE) parts.push(`Math: ${kteaData.postMathGE}`);
    if (kteaData.postWritingGE) parts.push(`Written Expression: ${kteaData.postWritingGE}`);
  }
  return parts.join('\n');
}

// Print CSS
const printStyles = `
  @media print {
    @page { margin: 0.25in; size: letter; }
    body * { visibility: hidden; }
    .iep-form, .iep-form * { visibility: visible; }
    .iep-form { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none !important; }
    ::-webkit-scrollbar { display: none; }
  }
`;

if (typeof document !== 'undefined') {
  const existing = document.getElementById('iep-print-styles');
  if (!existing) {
    const style = document.createElement('style');
    style.id = 'iep-print-styles';
    style.textContent = printStyles;
    document.head.appendChild(style);
  }
}

export default IEPGenerator;
