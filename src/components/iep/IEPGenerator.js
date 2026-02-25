import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileCheck, Search, ChevronRight, ChevronLeft, Loader2, CheckCircle, AlertTriangle,
  Sparkles, Target, BookOpen, Wrench, Plus, Printer, Download, Save,
  Clock, Brain, Users, Compass, Trash2,
  AlertCircle, TrendingUp, Star,
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
import { generatePresentLevels, computeDeficits } from '../../utils/iepNarrativeGenerator';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'student', label: 'Student', icon: Users, short: 'Select Student' },
  { id: 'levels', label: 'Present Levels', icon: Brain, short: 'PLAAFP' },
  { id: 'goals', label: 'Goals', icon: Target, short: 'Goals & Objectives' },
  { id: 'services', label: 'Services', icon: Wrench, short: 'Services & Accommodations' },
  { id: 'transition', label: 'Transition', icon: Compass, short: 'Transition Plan' },
];

const MEETING_TYPES = ['Annual Review', 'Initial', 'Reevaluation', 'Amendment'];

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

const IEPGenerator = ({ user }) => {
  // --- State ---
  const [step, setStep] = useState(0);
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

  // Goal bank
  const [goalSearch, setGoalSearch] = useState('');
  const [goalAreaFilter, setGoalAreaFilter] = useState('All');
  const [showGoalBank, setShowGoalBank] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState(null);

  // Services
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

  // Computed deficits
  const deficits = useMemo(() => {
    if (!selectedStudent || !kteaData) return null;
    return computeDeficits(selectedStudent.gradeLevel, kteaData);
  }, [selectedStudent, kteaData]);

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
      // Load KTEA data
      const kteaResults = await databaseService.searchKteaReports(student.studentName);
      const ktea = kteaResults?.[0] || null;
      setKteaData(ktea);

      // Load enrollments
      const enroll = await databaseService.getStudentEnrollments(student.id);
      setEnrollments(enroll);

      // Check for existing draft
      const existingDrafts = await databaseService.getIepByStudent(student.id);
      if (existingDrafts && existingDrafts.length > 0) {
        setDraft(existingDrafts[0]);
      } else {
        setDraft({
          ...createEmptyDraft(),
          studentId: student.id,
          studentName: student.studentName,
          gradeLevel: student.gradeLevel,
          unitName: student.unitName,
          district: student.district,
          iepDueDate: student.iepDueDate || '',
        });
      }

      setStep(1);
    } catch (err) {
      console.error('Error loading student data:', err);
    }
    setLoading(false);
  }, []);

  const handleSmartPopulate = useCallback(() => {
    if (!selectedStudent) return;
    const narratives = generatePresentLevels(selectedStudent, kteaData, enrollments, selectedStudent.mtpNotes);

    // Build KTEA snapshot
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
      baselineData: '',
      targetDate: '',
      sourceId: goal.id,
    };
    setDraft(prev => ({ ...prev, goals: [...prev.goals, goalEntry] }));
  };

  const handleRemoveGoal = (goalId) => {
    setDraft(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== goalId) }));
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
    const d = draft;

    // Choose template based on whether transition plan is included
    const templateFile = d.hasTransitionPlan
      ? 'iep_template_with_transition.docx'
      : 'iep_template.docx';

    try {
      // Fetch the template
      const response = await fetch(`/templates/${templateFile}`);
      if (!response.ok) throw new Error(`Could not find template: ${templateFile}`);
      const arrayBuffer = await response.arrayBuffer();

      // Initialize docxtemplater
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

      // Build the data mapping
      const data = {
        // Demographics
        student_name: d.studentName || '',
        disability_category: d.disabilityCategory || '',
        secondary_disability: d.secondaryDisability || '',
        student_address: d.studentAddress || '',
        student_phone: d.studentPhone || '',
        birth_date: d.birthDate || '',
        student_age: d.studentAge || '',
        grade_level: String(d.gradeLevel || ''),
        resident_district: d.district || '',

        // Decision Maker
        decision_maker_name: d.decisionMakerName || '',
        decision_maker_address: d.decisionMakerAddress || '',
        decision_maker_phone: d.decisionMakerPhone || '',
        decision_maker_email: d.decisionMakerEmail || '',
        decision_maker_fax: d.decisionMakerFax || '',

        // Case Manager
        case_manager: d.caseManager || user?.name || '',
        case_manager_phone: d.caseManagerPhone || '',

        // Dates
        eval_date: d.evalDate || '',
        prev_iep_date: d.prevIepDate || '',
        triennial_date: d.triennialDate || '',
        iep_meeting_date: d.iepDate || '',
        iep_initiation_date: d.iepInitiationDate || '',
        annual_review_date: d.iepDueDate || '',
        copy_provided_date: d.copyProvidedDate || '',

        // Present Levels (PLAAFP)
        disability_impact: [d.academicLevels, d.functionalLevels, d.impactStatement].filter(Boolean).join('\n\n') || '',
        student_strengths: d.strengthsText || '',
        parent_concerns: d.parentInput || '',
        changes_functioning: d.changesFunctioning || '',
        eval_summary: buildEvalSummary(d, kteaData),
        transition_assessments: d.transitionAssessments || '',

        // Goals (up to 4)
        ...buildGoalData(d.goals, 1),
        ...buildGoalData(d.goals, 2),
        ...buildGoalData(d.goals, 3),
        ...buildGoalData(d.goals, 4),

        // Related Services (up to 3)
        ...buildServiceData(d.services, 1),
        ...buildServiceData(d.services, 2),
        ...buildServiceData(d.services, 3),
      };

      // Add transition data if applicable
      if (d.hasTransitionPlan) {
        const ktea = kteaData || {};
        Object.assign(data, {
          transition_assessment_date_1: d.transitionAssessmentDate1 || '',
          career_interest_areas: d.careerInterestAreas || '',
          transition_assessment_date_2: d.transitionAssessmentDate2 || '',
          ktea_reading_ge: ktea.postReadingGE || ktea.preReadingGE || '',
          ktea_math_ge: ktea.postMathGE || ktea.preMathGE || '',
          ktea_writing_ge: ktea.postWritingGE || ktea.preWritingGE || '',
          transition_assessment_date_3: d.transitionAssessmentDate3 || '',
          independent_living_worksheet: 'See Attached Worksheet',
          anticipated_graduation_date: d.anticipatedGraduationDate || '',

          // Employment
          employment_goal: d.transition.postSecondaryEmployment || '',
          employment_skills_obtained: d.employmentSkillsObtained || '',
          employment_skills_needed: d.employmentSkillsNeeded || '',
          school_employment_services: d.schoolEmploymentServices || 'The school will provide career exploration and planning on a weekly basis.',
          student_employment_services: d.studentEmploymentServices || 'The student will participate in career exploration and planning, and participate in educational opportunities as required to graduate.',
          parent_employment_services: d.parentEmploymentServices || 'The parent/guardian will assist the student with locating and accessing services from outside agencies.',

          // Education/Training
          education_goal: d.transition.postSecondaryEducation || '',
          education_skills_obtained: d.educationSkillsObtained || '',
          education_skills_needed: d.educationSkillsNeeded || '',
          school_education_services: d.schoolEducationServices || 'The school will provide the secondary educational opportunities necessary for the student to gain the skills to graduate and attend post-secondary schools.',
          student_education_services: d.studentEducationServices || 'The student will take advantage of secondary educational opportunities necessary for the student to gain the skills to graduate and attend post-secondary schools.',
          parent_education_services: d.parentEducationServices || 'The parent/guardian will assist the student in locating post-secondary educational facilities in order to achieve their goals.',

          // Independent Living
          independent_living_goal: d.transition.independentLiving || '',
          independent_living_skills_obtained: d.independentLivingSkillsObtained || '',
          independent_living_skills_needed: d.independentLivingSkillsNeeded || '',
          school_independent_living_services: d.schoolIndependentLivingServices || 'The school will provide life skills educational materials for practice in skills attainment.',
          student_independent_living_services: d.studentIndependentLivingServices || 'The student will study and complete the life skills educational materials as provided.',
          parent_independent_living_services: d.parentIndependentLivingServices || 'The parent/guardian will assist the student in determining independent living resources in their home state.',
        });
      }

      // Render the template
      doc.render(data);

      // Generate and download
      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      saveAs(out, `${d.studentName || 'Student'}_IEP.docx`);

      await databaseService.logAudit(user, 'Exported IEP', `Exported IEP document for ${d.studentName}`);
    } catch (error) {
      console.error('Error generating IEP document:', error);
      alert('Error generating IEP document. Ensure template files exist in public/templates/.');
    }
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-5rem)] bg-slate-100 overflow-hidden font-sans">

      {/* LEFT PANEL — Editor */}
      <div className="w-full lg:w-[42%] bg-white/70 backdrop-blur-xl flex flex-col border-r border-slate-200/50 shadow-2xl z-10 print:hidden">

        {/* Header */}
        <div className="p-5 border-b border-slate-200/80 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
              <span className="p-2 bg-cyan-100 rounded-xl text-cyan-600"><FileCheck className="w-6 h-6" /></span>
              IEP Generator
            </h2>
            {saveMessage && (
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${saveMessage.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {saveMessage}
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm">Smart IEP builder with auto-populated data from KTEA assessments and grades.</p>
        </div>

        {/* Step Tabs */}
        <div className="flex border-b border-slate-200/80 shrink-0 overflow-x-auto">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === i;
            const isComplete = i < step && selectedStudent;
            return (
              <button
                key={s.id}
                onClick={() => selectedStudent && setStep(i)}
                disabled={!selectedStudent && i > 0}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold uppercase tracking-wide transition-all border-b-2 whitespace-nowrap ${
                  isActive ? 'border-cyan-500 text-cyan-700 bg-cyan-50/50' :
                  isComplete ? 'border-emerald-400 text-emerald-600' :
                  'border-transparent text-slate-400 hover:text-slate-600'
                } ${!selectedStudent && i > 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isComplete ? <CheckCircle className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 0 && <StudentStep students={filteredStudents} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onSelect={handleSelectStudent} loading={loading} selectedStudent={selectedStudent} draft={draft} setDraft={setDraft} />}
          {step === 1 && <PresentLevelsStep draft={draft} setDraft={setDraft} deficits={deficits} onSmartPopulate={handleSmartPopulate} kteaData={kteaData} enrollments={enrollments} student={selectedStudent} />}
          {step === 2 && <GoalsStep draft={draft} goals={goalSuggestions} goalSearch={goalSearch} setGoalSearch={setGoalSearch} goalAreaFilter={goalAreaFilter} setGoalAreaFilter={setGoalAreaFilter} showGoalBank={showGoalBank} setShowGoalBank={setShowGoalBank} onAddGoal={handleAddGoal} onRemoveGoal={handleRemoveGoal} expandedGoal={expandedGoal} setExpandedGoal={setExpandedGoal} studentName={selectedStudent?.firstName} />}
          {step === 3 && <ServicesStep draft={draft} setDraft={setDraft} toggleAccommodation={toggleAccommodation} toggleModification={toggleModification} showServiceForm={showServiceForm} setShowServiceForm={setShowServiceForm} newService={newService} setNewService={setNewService} onAddService={handleAddService} onRemoveService={handleRemoveService} />}
          {step === 4 && <TransitionStep draft={draft} setDraft={setDraft} />}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200/80 shrink-0 flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          <div className="flex-1" />
          {selectedStudent && (
            <button onClick={handleSave} disabled={saving} className="px-4 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </button>
          )}
          {selectedStudent && (
            <button onClick={handlePrint} className="px-4 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5">
              <Printer className="w-4 h-4" /> Print
            </button>
          )}
          {selectedStudent && (
            <button onClick={handleExportDocx} className="px-4 py-2.5 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl shadow-lg shadow-cyan-500/10 transition-colors flex items-center gap-1.5">
              <Download className="w-4 h-4" /> Word
            </button>
          )}
          {step < 4 && selectedStudent && (
            <button onClick={() => setStep(s => s + 1)} className="px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/10 transition-colors flex items-center gap-1.5">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* RIGHT PANEL — Live Preview */}
      <div className="flex-1 bg-slate-100 p-8 overflow-y-auto flex justify-center print:p-0 print:bg-white print:overflow-visible">
        <IEPDocumentPreview draft={draft} deficits={deficits} />
      </div>
    </div>
  );
};

// ─── STEP 1: STUDENT SELECTION ──────────────────────────────────────────────

const StudentStep = ({ students, searchTerm, setSearchTerm, onSelect, loading, selectedStudent, draft, setDraft }) => (
  <div className="space-y-5">
    <div>
      <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider border-b border-slate-200/80 pb-2 mb-4">Select IEP Student</h3>
      <p className="text-sm text-slate-500 mb-3">Showing students with active IEP status. Select a student to auto-load their assessment data.</p>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-300/80 rounded-xl text-sm focus:ring-4 focus:ring-cyan-500/20 outline-none transition-all bg-white/80"
          placeholder="Search IEP students..."
        />
      </div>
    </div>

    {loading && (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
        <span className="ml-3 text-sm font-semibold text-slate-500">Loading student data from KTEA & gradebooks...</span>
      </div>
    )}

    <div className="space-y-2">
      {students.map(s => {
        const isSelected = selectedStudent?.id === s.id;
        const dueDate = s.iepDueDate ? new Date(s.iepDueDate) : null;
        const daysUntilDue = dueDate ? Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
        const urgency = daysUntilDue !== null ? (daysUntilDue < 0 ? 'overdue' : daysUntilDue <= 30 ? 'soon' : 'ok') : null;

        return (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              isSelected
                ? 'border-cyan-400 bg-cyan-50/80 shadow-md shadow-cyan-200/30'
                : 'border-slate-200/80 bg-white/60 hover:border-cyan-300 hover:shadow-md hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${isSelected ? 'bg-cyan-500' : 'bg-slate-400'}`}>
                  {s.firstName?.[0]}{s.lastName?.[0]}
                </div>
                <div>
                  <div className="font-bold text-slate-800">{s.studentName}</div>
                  <div className="text-xs text-slate-500">Grade {s.gradeLevel} &middot; {s.unitName} &middot; {s.district}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {urgency && (
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    urgency === 'overdue' ? 'bg-red-100 text-red-700' :
                    urgency === 'soon' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {urgency === 'overdue' ? <><AlertTriangle className="w-3 h-3 inline mr-1" />Overdue</> :
                     urgency === 'soon' ? <><Clock className="w-3 h-3 inline mr-1" />{daysUntilDue}d</> :
                     <><Clock className="w-3 h-3 inline mr-1" />{daysUntilDue}d</>}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            </div>
          </button>
        );
      })}
      {students.length === 0 && !loading && (
        <div className="text-center py-12 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="font-semibold">No IEP students found</p>
          <p className="text-xs mt-1">Students need IEP status set to "Yes" in their profile.</p>
        </div>
      )}
    </div>

    {/* Demographics & Dates — visible after student selection */}
    {selectedStudent && draft && (
      <div className="space-y-4 border-t border-slate-200/80 pt-5">
        <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Student Demographics</h4>
        <div className="grid grid-cols-2 gap-3">
          <SmallField label="Disability Category" value={draft.disabilityCategory} onChange={v => setDraft(prev => ({ ...prev, disabilityCategory: v }))} placeholder="e.g. Emotional Disturbance" />
          <SmallField label="Secondary Disability" value={draft.secondaryDisability} onChange={v => setDraft(prev => ({ ...prev, secondaryDisability: v }))} placeholder="e.g. SLD" />
          <SmallField label="Address" value={draft.studentAddress} onChange={v => setDraft(prev => ({ ...prev, studentAddress: v }))} placeholder="Student address" />
          <SmallField label="Phone" value={draft.studentPhone} onChange={v => setDraft(prev => ({ ...prev, studentPhone: v }))} placeholder="Phone number" />
          <SmallField label="Birth Date" value={draft.birthDate} onChange={v => setDraft(prev => ({ ...prev, birthDate: v }))} placeholder="MM/DD/YYYY" />
          <SmallField label="Age" value={draft.studentAge} onChange={v => setDraft(prev => ({ ...prev, studentAge: v }))} placeholder="Age" />
        </div>

        <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider pt-2">Educational Decision Maker</h4>
        <div className="grid grid-cols-2 gap-3">
          <SmallField label="Name" value={draft.decisionMakerName} onChange={v => setDraft(prev => ({ ...prev, decisionMakerName: v }))} placeholder="Parent/Guardian name" />
          <SmallField label="Phone" value={draft.decisionMakerPhone} onChange={v => setDraft(prev => ({ ...prev, decisionMakerPhone: v }))} placeholder="Phone" />
          <SmallField label="Address" value={draft.decisionMakerAddress} onChange={v => setDraft(prev => ({ ...prev, decisionMakerAddress: v }))} placeholder="Address" />
          <SmallField label="Email" value={draft.decisionMakerEmail} onChange={v => setDraft(prev => ({ ...prev, decisionMakerEmail: v }))} placeholder="Email" />
          <SmallField label="Fax" value={draft.decisionMakerFax} onChange={v => setDraft(prev => ({ ...prev, decisionMakerFax: v }))} placeholder="Fax" />
        </div>

        <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider pt-2">Case Manager & Dates</h4>
        <div className="grid grid-cols-2 gap-3">
          <SmallField label="IEP Case Manager" value={draft.caseManager} onChange={v => setDraft(prev => ({ ...prev, caseManager: v }))} placeholder="Case manager name" />
          <SmallField label="Case Manager Phone" value={draft.caseManagerPhone} onChange={v => setDraft(prev => ({ ...prev, caseManagerPhone: v }))} placeholder="Phone" />
          <SmallField label="Eval/Reeval Date" value={draft.evalDate} onChange={v => setDraft(prev => ({ ...prev, evalDate: v }))} placeholder="MM/DD/YYYY" />
          <SmallField label="Previous IEP Date" value={draft.prevIepDate} onChange={v => setDraft(prev => ({ ...prev, prevIepDate: v }))} placeholder="MM/DD/YYYY" />
          <SmallField label="Triennial Date" value={draft.triennialDate} onChange={v => setDraft(prev => ({ ...prev, triennialDate: v }))} placeholder="MM/DD/YYYY" />
          <SmallField label="Initiation Date" value={draft.iepInitiationDate} onChange={v => setDraft(prev => ({ ...prev, iepInitiationDate: v }))} placeholder="MM/DD/YYYY" />
          <SmallField label="Copy Provided" value={draft.copyProvidedDate} onChange={v => setDraft(prev => ({ ...prev, copyProvidedDate: v }))} placeholder="MM/DD/YYYY" />
        </div>
      </div>
    )}
  </div>
);

// ─── STEP 2: PRESENT LEVELS ────────────────────────────────────────────────

const PresentLevelsStep = ({ draft, setDraft, deficits, onSmartPopulate, kteaData, enrollments, student }) => (
  <div className="space-y-5">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider">Present Levels (PLAAFP)</h3>
      <button onClick={onSmartPopulate} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg transition-colors">
        <Sparkles className="w-3.5 h-3.5" /> Smart Populate
      </button>
    </div>

    {/* Meeting Info */}
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">IEP Date</label>
        <input type="date" value={draft.iepDate || ''} onChange={e => setDraft(prev => ({ ...prev, iepDate: e.target.value }))} className="w-full p-2.5 border border-slate-300/80 rounded-lg text-sm focus:ring-4 focus:ring-cyan-500/20 outline-none" />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">Meeting Type</label>
        <select value={draft.meetingType || ''} onChange={e => setDraft(prev => ({ ...prev, meetingType: e.target.value }))} className="w-full p-2.5 border border-slate-300/80 rounded-lg text-sm focus:ring-4 focus:ring-cyan-500/20 outline-none bg-white">
          <option value="">Select...</option>
          {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
    </div>

    {/* Deficit Radar */}
    {deficits && (
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" /> KTEA Deficit Analysis
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Reading', data: deficits.reading },
            { label: 'Math', data: deficits.math },
            { label: 'Writing', data: deficits.writing },
          ].map(area => (
            <DeficitBadge key={area.label} label={area.label} data={area.data} grade={student?.gradeLevel} />
          ))}
        </div>
      </div>
    )}

    {/* Narrative Fields */}
    <NarrativeField label="Academic Achievement" value={draft.academicLevels} onChange={v => setDraft(prev => ({ ...prev, academicLevels: v }))} placeholder="Describe the student's current academic performance..." rows={6} />
    <NarrativeField label="Functional Performance" value={draft.functionalLevels} onChange={v => setDraft(prev => ({ ...prev, functionalLevels: v }))} placeholder="Describe behavioral, social, and functional skills..." rows={5} />
    <NarrativeField label="Student Strengths" value={draft.strengthsText} onChange={v => setDraft(prev => ({ ...prev, strengthsText: v }))} placeholder="Describe the student's strengths and interests..." rows={3} />
    <NarrativeField label="Impact of Disability" value={draft.impactStatement} onChange={v => setDraft(prev => ({ ...prev, impactStatement: v }))} placeholder="How does the disability affect access to the general curriculum..." rows={4} />
    <NarrativeField label="Parent/Guardian Input" value={draft.parentInput} onChange={v => setDraft(prev => ({ ...prev, parentInput: v }))} placeholder="Document parent concerns and input..." rows={3} />
    <NarrativeField label="Changes in Functioning" value={draft.changesFunctioning} onChange={v => setDraft(prev => ({ ...prev, changesFunctioning: v }))} placeholder="Changes in current functioning since the initial or prior IEP..." rows={3} />
    <NarrativeField label="Evaluation Summary" value={draft.evalSummary} onChange={v => setDraft(prev => ({ ...prev, evalSummary: v }))} placeholder="Summary of the most recent evaluation/re-evaluation results..." rows={4} />
    <NarrativeField label="Transition Assessments" value={draft.transitionAssessments} onChange={v => setDraft(prev => ({ ...prev, transitionAssessments: v }))} placeholder="Summary of formal/informal age appropriate transition assessments..." rows={3} />
  </div>
);

// ─── STEP 3: GOALS & OBJECTIVES ────────────────────────────────────────────

const GoalsStep = ({ draft, goals, goalSearch, setGoalSearch, goalAreaFilter, setGoalAreaFilter, showGoalBank, setShowGoalBank, onAddGoal, onRemoveGoal, expandedGoal, setExpandedGoal, studentName }) => {
  const addedIds = new Set(draft.goals.map(g => g.sourceId));

  const filteredGoals = useMemo(() => {
    const all = [...goals.suggested, ...goals.other];
    return all.filter(g => {
      if (goalAreaFilter !== 'All' && g.area !== goalAreaFilter) return false;
      if (goalSearch && !g.goalText.toLowerCase().includes(goalSearch.toLowerCase()) && !g.domain.toLowerCase().includes(goalSearch.toLowerCase())) return false;
      return true;
    });
  }, [goals, goalAreaFilter, goalSearch]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider">Goals & Objectives</h3>
        <button onClick={() => setShowGoalBank(!showGoalBank)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg transition-colors">
          <BookOpen className="w-3.5 h-3.5" /> {showGoalBank ? 'Hide' : 'Browse'} Goal Bank
        </button>
      </div>

      {/* Selected Goals */}
      {draft.goals.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wide flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> {draft.goals.length} Goal{draft.goals.length > 1 ? 's' : ''} Selected
          </div>
          {draft.goals.map((goal, i) => (
            <div key={goal.id} className="p-3 bg-white border border-emerald-200 rounded-xl">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{goal.area}</span>
                  <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">{goal.goalText}</p>
                  <div className="mt-2 space-y-1">
                    {goal.benchmarks.map((bm, j) => (
                      <div key={j} className="text-xs text-slate-500 flex items-start gap-1.5">
                        <span className="text-emerald-400 mt-0.5">&#9679;</span>
                        {bm.text}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-slate-400 mt-2 italic">Measurement: {goal.measureMethod}</div>
                </div>
                <button onClick={() => onRemoveGoal(goal.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {draft.goals.length === 0 && !showGoalBank && (
        <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="font-semibold text-sm">No goals added yet</p>
          <p className="text-xs mt-1">Open the Goal Bank to browse and add suggested goals.</p>
        </div>
      )}

      {/* Goal Bank Browser */}
      {showGoalBank && (
        <div className="border border-cyan-200 bg-cyan-50/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={goalSearch}
                onChange={e => setGoalSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300/80 rounded-lg text-xs focus:ring-4 focus:ring-cyan-500/20 outline-none bg-white"
                placeholder="Search goals..."
              />
            </div>
            <select
              value={goalAreaFilter}
              onChange={e => setGoalAreaFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300/80 rounded-lg text-xs focus:ring-4 focus:ring-cyan-500/20 outline-none bg-white"
            >
              <option value="All">All Areas</option>
              {GOAL_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-1">
            {filteredGoals.map(goal => {
              const isAdded = addedIds.has(goal.id);
              const isSuggested = goals.suggested.some(g => g.id === goal.id);
              const isExpanded = expandedGoal === goal.id;
              return (
                <div key={goal.id} className={`p-3 bg-white rounded-lg border ${isSuggested ? 'border-amber-200' : 'border-slate-200'} transition-all`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 cursor-pointer" onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{goal.area}</span>
                        <span className="text-xs text-slate-400">{goal.domain}</span>
                        {isSuggested && (
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3" /> Suggested
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{goal.goalText.replace(/{name}/g, studentName || 'Student').slice(0, 150)}...</p>
                    </div>
                    <button
                      onClick={() => !isAdded && onAddGoal(goal)}
                      disabled={isAdded}
                      className={`shrink-0 p-1.5 rounded-lg transition-colors ${isAdded ? 'text-emerald-500 bg-emerald-50' : 'text-cyan-600 hover:bg-cyan-100'}`}
                    >
                      {isAdded ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                      {goal.benchmarks.map((bm, j) => (
                        <div key={j} className="text-xs text-slate-500 flex items-start gap-1.5">
                          <span className="text-cyan-400 mt-0.5">&#9679;</span> {bm}
                        </div>
                      ))}
                      <div className="text-xs text-slate-400 italic mt-1">Measurement: {goal.measureMethod}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── STEP 4: SERVICES & ACCOMMODATIONS ──────────────────────────────────────

const ServicesStep = ({ draft, setDraft, toggleAccommodation, toggleModification, showServiceForm, setShowServiceForm, newService, setNewService, onAddService, onRemoveService }) => (
  <div className="space-y-5">
    <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider border-b border-slate-200/80 pb-2">Services & Accommodations</h3>

    {/* Services */}
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Special Education Services</span>
        <button onClick={() => setShowServiceForm(!showServiceForm)} className="flex items-center gap-1 text-xs font-bold text-cyan-600 hover:text-cyan-700">
          <Plus className="w-3.5 h-3.5" /> Add Service
        </button>
      </div>

      {showServiceForm && (
        <div className="p-3 mb-3 bg-cyan-50/50 border border-cyan-200 rounded-xl space-y-2">
          <select value={newService.type} onChange={e => setNewService(s => ({ ...s, type: e.target.value }))} className="w-full p-2 border border-slate-300/80 rounded-lg text-xs bg-white outline-none">
            <option value="">Select service...</option>
            {SERVICE_TYPES.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <select value={newService.location} onChange={e => setNewService(s => ({ ...s, location: e.target.value }))} className="p-2 border border-slate-300/80 rounded-lg text-xs bg-white outline-none">
              <option value="">Location...</option>
              {SERVICE_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={newService.frequency} onChange={e => setNewService(s => ({ ...s, frequency: e.target.value }))} className="p-2 border border-slate-300/80 rounded-lg text-xs bg-white outline-none">
              <option value="">Frequency...</option>
              {FREQUENCY_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <select value={newService.duration} onChange={e => setNewService(s => ({ ...s, duration: e.target.value }))} className="p-2 border border-slate-300/80 rounded-lg text-xs bg-white outline-none">
              <option value="">Duration...</option>
              {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button onClick={onAddService} disabled={!newService.type} className="w-full py-2 text-xs font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Add Service
          </button>
        </div>
      )}

      {draft.services.map(svc => (
        <div key={svc.id} className="flex items-center justify-between p-3 mb-2 bg-white border border-slate-200 rounded-lg">
          <div>
            <div className="text-sm font-semibold text-slate-700">{svc.type}</div>
            <div className="text-xs text-slate-500">{[svc.location, svc.frequency, svc.duration].filter(Boolean).join(' · ')}</div>
          </div>
          <button onClick={() => onRemoveService(svc.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      {draft.services.length === 0 && !showServiceForm && (
        <p className="text-xs text-slate-400 italic">No services added. Click "Add Service" above.</p>
      )}
    </div>

    {/* Accommodations */}
    <div>
      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-3">Accommodations</span>
      {Object.entries(ACCOMMODATIONS).map(([category, items]) => (
        <div key={category} className="mb-3">
          <div className="text-xs font-bold text-slate-500 mb-1.5">{category}</div>
          <div className="grid grid-cols-1 gap-1">
            {items.map(acc => (
              <label key={acc.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900 py-0.5">
                <input type="checkbox" checked={draft.accommodations.includes(acc.id)} onChange={() => toggleAccommodation(acc.id)} className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                {acc.label}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>

    {/* Modifications */}
    <div>
      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-3">Modifications</span>
      <div className="grid grid-cols-1 gap-1">
        {MODIFICATIONS.map(mod => (
          <label key={mod.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900 py-0.5">
            <input type="checkbox" checked={draft.modifications.includes(mod.id)} onChange={() => toggleModification(mod.id)} className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
            {mod.label}
          </label>
        ))}
      </div>
    </div>
  </div>
);

// ─── STEP 5: TRANSITION PLAN ────────────────────────────────────────────────

const TransitionStep = ({ draft, setDraft }) => (
  <div className="space-y-5">
    <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider border-b border-slate-200/80 pb-2">Transition Planning</h3>

    <label className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-cyan-300 transition-colors">
      <input
        type="checkbox"
        checked={draft.hasTransitionPlan}
        onChange={e => setDraft(prev => ({ ...prev, hasTransitionPlan: e.target.checked }))}
        className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-5 h-5"
      />
      <div>
        <div className="text-sm font-bold text-slate-700">Include Transition Plan (Form C)</div>
        <div className="text-xs text-slate-500">Required for students age 14+ or grade 9+</div>
      </div>
    </label>

    {draft.hasTransitionPlan && (
      <>
        {/* Graduation & Assessment Dates */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Graduation & Assessment Info</h4>
          <div className="grid grid-cols-2 gap-3">
            <SmallField label="Anticipated Graduation Date" value={draft.anticipatedGraduationDate} onChange={v => setDraft(prev => ({ ...prev, anticipatedGraduationDate: v }))} placeholder="MM/DD/YYYY" />
            <SmallField label="Career Interest Areas" value={draft.careerInterestAreas} onChange={v => setDraft(prev => ({ ...prev, careerInterestAreas: v }))} placeholder="e.g. Healthcare, Technology" />
            <SmallField label="Assessment Date 1 (Career Survey)" value={draft.transitionAssessmentDate1} onChange={v => setDraft(prev => ({ ...prev, transitionAssessmentDate1: v }))} placeholder="MM/DD/YYYY" />
            <SmallField label="Assessment Date 2 (KTEA)" value={draft.transitionAssessmentDate2} onChange={v => setDraft(prev => ({ ...prev, transitionAssessmentDate2: v }))} placeholder="MM/DD/YYYY" />
            <SmallField label="Assessment Date 3 (Living Skills)" value={draft.transitionAssessmentDate3} onChange={v => setDraft(prev => ({ ...prev, transitionAssessmentDate3: v }))} placeholder="MM/DD/YYYY" />
          </div>
        </div>

        {/* Employment Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5" /> Employment
          </h4>
          <NarrativeField
            label="Employment Goal"
            value={draft.transition.postSecondaryEmployment}
            onChange={v => setDraft(prev => ({ ...prev, transition: { ...prev.transition, postSecondaryEmployment: v } }))}
            placeholder="After high school, the student will pursue employment in..."
            rows={2}
          />
          <NarrativeField label="Skills Already Obtained" value={draft.employmentSkillsObtained} onChange={v => setDraft(prev => ({ ...prev, employmentSkillsObtained: v }))} placeholder="List employment-related skills the student already has..." rows={2} />
          <NarrativeField label="Skills Needed Before Graduation" value={draft.employmentSkillsNeeded} onChange={v => setDraft(prev => ({ ...prev, employmentSkillsNeeded: v }))} placeholder="Resume writing, job applications, interview skills..." rows={2} />
          <NarrativeField label="School Will Provide" value={draft.schoolEmploymentServices} onChange={v => setDraft(prev => ({ ...prev, schoolEmploymentServices: v }))} placeholder="The school will provide career exploration and planning on a weekly basis." rows={2} />
          <NarrativeField label="Student Will" value={draft.studentEmploymentServices} onChange={v => setDraft(prev => ({ ...prev, studentEmploymentServices: v }))} placeholder="The student will participate in career exploration and planning..." rows={2} />
          <NarrativeField label="Parent/Guardian Will" value={draft.parentEmploymentServices} onChange={v => setDraft(prev => ({ ...prev, parentEmploymentServices: v }))} placeholder="The parent/guardian will assist the student with locating services..." rows={2} />
        </div>

        {/* Education/Training Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Education / Training
          </h4>
          <NarrativeField
            label="Education/Training Goal"
            value={draft.transition.postSecondaryEducation}
            onChange={v => setDraft(prev => ({ ...prev, transition: { ...prev.transition, postSecondaryEducation: v } }))}
            placeholder="After completing high school, the student will..."
            rows={2}
          />
          <NarrativeField label="Skills Already Obtained" value={draft.educationSkillsObtained} onChange={v => setDraft(prev => ({ ...prev, educationSkillsObtained: v }))} placeholder="Use electronic media for career info, variety of resources..." rows={2} />
          <NarrativeField label="Skills Needed Before Graduation" value={draft.educationSkillsNeeded} onChange={v => setDraft(prev => ({ ...prev, educationSkillsNeeded: v }))} placeholder="Identify vocational service providers, sources of financial aid..." rows={2} />
          <NarrativeField label="School Will Provide" value={draft.schoolEducationServices} onChange={v => setDraft(prev => ({ ...prev, schoolEducationServices: v }))} placeholder="The school will provide educational opportunities for the student to gain skills to graduate..." rows={2} />
          <NarrativeField label="Student Will" value={draft.studentEducationServices} onChange={v => setDraft(prev => ({ ...prev, studentEducationServices: v }))} placeholder="The student will take advantage of secondary educational opportunities..." rows={2} />
          <NarrativeField label="Parent/Guardian Will" value={draft.parentEducationServices} onChange={v => setDraft(prev => ({ ...prev, parentEducationServices: v }))} placeholder="The parent/guardian will assist the student in locating post-secondary educational facilities..." rows={2} />
        </div>

        {/* Independent Living Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" /> Independent Living
          </h4>
          <NarrativeField
            label="Independent Living Goal"
            value={draft.transition.independentLiving}
            onChange={v => setDraft(prev => ({ ...prev, transition: { ...prev.transition, independentLiving: v } }))}
            placeholder="The student will demonstrate the ability to..."
            rows={2}
          />
          <NarrativeField label="Skills Already Obtained" value={draft.independentLivingSkillsObtained} onChange={v => setDraft(prev => ({ ...prev, independentLivingSkillsObtained: v }))} placeholder="Skills the student already has for independent living..." rows={2} />
          <NarrativeField label="Skills Needed Before Graduation" value={draft.independentLivingSkillsNeeded} onChange={v => setDraft(prev => ({ ...prev, independentLivingSkillsNeeded: v }))} placeholder="Banking, checking account, ATM, budgeting, cooking..." rows={2} />
          <NarrativeField label="School Will Provide" value={draft.schoolIndependentLivingServices} onChange={v => setDraft(prev => ({ ...prev, schoolIndependentLivingServices: v }))} placeholder="The school will provide life skills educational materials..." rows={2} />
          <NarrativeField label="Student Will" value={draft.studentIndependentLivingServices} onChange={v => setDraft(prev => ({ ...prev, studentIndependentLivingServices: v }))} placeholder="The student will study and complete the life skills materials..." rows={2} />
          <NarrativeField label="Parent/Guardian Will" value={draft.parentIndependentLivingServices} onChange={v => setDraft(prev => ({ ...prev, parentIndependentLivingServices: v }))} placeholder="The parent/guardian will assist the student in determining independent living resources..." rows={2} />
        </div>

        {/* Skills Checklist */}
        <div>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-3">Transition Skills Checklist</span>
          {Object.entries(TRANSITION_SKILL_AREAS).map(([area, skills]) => (
            <div key={area} className="mb-3">
              <div className="text-xs font-bold text-slate-500 mb-1.5">{area}</div>
              <div className="grid grid-cols-1 gap-1">
                {skills.map(skill => (
                  <label key={skill} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900 py-0.5">
                    <input
                      type="checkbox"
                      checked={draft.transition.targetSkills?.includes(skill) || false}
                      onChange={() => {
                        setDraft(prev => {
                          const current = prev.transition.targetSkills || [];
                          const updated = current.includes(skill)
                            ? current.filter(s => s !== skill)
                            : [...current, skill];
                          return { ...prev, transition: { ...prev.transition, targetSkills: updated } };
                        });
                      }}
                      className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    {skill}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    )}
  </div>
);

// ─── LIVE DOCUMENT PREVIEW ──────────────────────────────────────────────────

const IEPDocumentPreview = ({ draft, deficits }) => {
  const d = draft;
  return (
    <div className="page bg-white w-[8.5in] min-h-[11in] p-[0.75in] shadow-2xl shadow-slate-300/60 text-black font-serif print:shadow-none print:w-full print:m-0 print:absolute print:top-0 print:left-0">
      {/* Header */}
      <header className="text-center mb-6 border-b-2 border-black pb-4">
        <h1 className="m-0 text-xl uppercase tracking-widest font-bold">LAKELAND REGIONAL SCHOOL</h1>
        <div className="text-base font-bold mt-2">INDIVIDUALIZED EDUCATION PROGRAM (IEP)</div>
      </header>

      {/* Demographics */}
      <section className="border border-black p-3 mb-5 text-[10pt] grid grid-cols-2 gap-1">
        <div><span className="font-bold">Student:</span> {d.studentName || '-'}</div>
        <div><span className="font-bold">Grade:</span> {d.gradeLevel || '-'}</div>
        <div><span className="font-bold">District:</span> {d.district || '-'}</div>
        <div><span className="font-bold">Unit:</span> {d.unitName || '-'}</div>
        <div><span className="font-bold">IEP Date:</span> {d.iepDate || '-'}</div>
        <div><span className="font-bold">Due Date:</span> {d.iepDueDate || '-'}</div>
        <div className="col-span-2"><span className="font-bold">Meeting Type:</span> {d.meetingType || '-'}</div>
      </section>

      {/* Present Levels */}
      <section className="mb-5 text-[11pt] leading-relaxed">
        <h3 className="text-[11pt] font-bold uppercase border-b border-black mb-2 pb-1">Present Levels of Academic Achievement and Functional Performance</h3>

        {d.academicLevels && (
          <div className="mb-3">
            <div className="font-bold text-[10pt] mb-1">Academic Achievement:</div>
            <div className="whitespace-pre-wrap text-justify">{d.academicLevels}</div>
          </div>
        )}
        {d.functionalLevels && (
          <div className="mb-3">
            <div className="font-bold text-[10pt] mb-1">Functional Performance:</div>
            <div className="whitespace-pre-wrap text-justify">{d.functionalLevels}</div>
          </div>
        )}
        {d.strengthsText && (
          <div className="mb-3">
            <div className="font-bold text-[10pt] mb-1">Strengths:</div>
            <div className="whitespace-pre-wrap text-justify">{d.strengthsText}</div>
          </div>
        )}
        {d.impactStatement && (
          <div className="mb-3">
            <div className="font-bold text-[10pt] mb-1">Impact of Disability:</div>
            <div className="whitespace-pre-wrap text-justify">{d.impactStatement}</div>
          </div>
        )}
        {d.parentInput && (
          <div>
            <div className="font-bold text-[10pt] mb-1">Parent/Guardian Input:</div>
            <div className="whitespace-pre-wrap text-justify">{d.parentInput}</div>
          </div>
        )}
      </section>

      {/* Goals */}
      {d.goals.length > 0 && (
        <section className="mb-5 text-[11pt]">
          <h3 className="text-[11pt] font-bold uppercase border-b border-black mb-2 pb-1">Measurable Annual Goals</h3>
          {d.goals.map((goal, i) => (
            <div key={goal.id} className="mb-4 pl-2 border-l-2 border-slate-300">
              <div className="font-bold text-[10pt]">Goal {i + 1} — {goal.area}</div>
              <div className="text-justify mt-1">{goal.goalText}</div>
              <div className="mt-1 ml-3 text-[10pt] italic text-gray-600">Measurement: {goal.measureMethod}</div>
              <div className="mt-1 ml-3 text-[10pt]">
                {goal.benchmarks.map((bm, j) => (
                  <div key={j} className="flex items-start gap-1 mt-0.5">
                    <span className="font-bold shrink-0">Benchmark {j + 1}:</span>
                    <span>{bm.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Services */}
      {d.services.length > 0 && (
        <section className="mb-5 text-[11pt]">
          <h3 className="text-[11pt] font-bold uppercase border-b border-black mb-2 pb-1">Special Education Services</h3>
          <table className="w-full border-collapse text-[10pt]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-1.5 text-left font-bold">Service</th>
                <th className="border border-black p-1.5 text-left font-bold">Location</th>
                <th className="border border-black p-1.5 text-left font-bold">Frequency</th>
                <th className="border border-black p-1.5 text-left font-bold">Duration</th>
              </tr>
            </thead>
            <tbody>
              {d.services.map(svc => (
                <tr key={svc.id}>
                  <td className="border border-black p-1.5">{svc.type}</td>
                  <td className="border border-black p-1.5">{svc.location || '-'}</td>
                  <td className="border border-black p-1.5">{svc.frequency || '-'}</td>
                  <td className="border border-black p-1.5">{svc.duration || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Accommodations */}
      {d.accommodations.length > 0 && (
        <section className="mb-5 text-[11pt]">
          <h3 className="text-[11pt] font-bold uppercase border-b border-black mb-2 pb-1">Accommodations</h3>
          <ul className="list-disc pl-6 text-[10pt] space-y-0.5">
            {getAllAccommodationLabels(d.accommodations).map((label, i) => (
              <li key={i}>{label}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Modifications */}
      {d.modifications.length > 0 && (
        <section className="mb-5 text-[11pt]">
          <h3 className="text-[11pt] font-bold uppercase border-b border-black mb-2 pb-1">Modifications</h3>
          <ul className="list-disc pl-6 text-[10pt] space-y-0.5">
            {d.modifications.map(id => MODIFICATIONS.find(m => m.id === id)).filter(Boolean).map((mod, i) => (
              <li key={i}>{mod.label}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Transition */}
      {d.hasTransitionPlan && (
        <section className="mb-5 text-[11pt]">
          <h3 className="text-[11pt] font-bold uppercase border-b border-black mb-2 pb-1">Transition Plan</h3>
          <div className="space-y-2 text-[10pt]">
            <div><span className="font-bold">Post-Secondary Education:</span> {d.transition.postSecondaryEducation || 'Not specified'}</div>
            <div><span className="font-bold">Employment:</span> {d.transition.postSecondaryEmployment || 'Not specified'}</div>
            <div><span className="font-bold">Independent Living:</span> {d.transition.independentLiving || 'Not specified'}</div>
            {d.transition.targetSkills?.length > 0 && (
              <div>
                <div className="font-bold mb-1">Target Skills:</div>
                <ul className="list-disc pl-6 space-y-0.5">
                  {d.transition.targetSkills.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Signatures */}
      <section className="mt-10 pt-6 border-t border-black text-[10pt]">
        <div className="grid grid-cols-2 gap-8 mt-4">
          <div>
            <div className="border-b border-black mb-1 h-8" />
            <div className="font-bold">Special Education Teacher</div>
            <div className="text-gray-500">Date: _______________</div>
          </div>
          <div>
            <div className="border-b border-black mb-1 h-8" />
            <div className="font-bold">Parent / Guardian</div>
            <div className="text-gray-500">Date: _______________</div>
          </div>
          <div>
            <div className="border-b border-black mb-1 h-8" />
            <div className="font-bold">LEA Representative</div>
            <div className="text-gray-500">Date: _______________</div>
          </div>
          <div>
            <div className="border-b border-black mb-1 h-8" />
            <div className="font-bold">General Education Teacher</div>
            <div className="text-gray-500">Date: _______________</div>
          </div>
        </div>
      </section>
    </div>
  );
};

// ─── SHARED UI COMPONENTS ───────────────────────────────────────────────────

const DeficitBadge = ({ label, data, grade }) => {
  if (!data) return (
    <div className="text-center p-3 bg-slate-100 rounded-lg">
      <div className="text-xs font-bold text-slate-400 uppercase">{label}</div>
      <div className="text-lg font-extrabold text-slate-300 mt-1">N/A</div>
    </div>
  );

  const colors = {
    critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100' },
    concern: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100' },
    watch: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', badge: 'bg-yellow-100' },
    'on-track': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100' },
  };
  const c = colors[data.level];

  return (
    <div className={`text-center p-3 rounded-lg border ${c.bg} ${c.border}`}>
      <div className={`text-xs font-bold uppercase ${c.text}`}>{label}</div>
      <div className={`text-lg font-extrabold ${c.text} mt-1`}>GE {data.current}</div>
      <div className="text-xs text-slate-500 mt-0.5">Grade {grade}</div>
      {data.deficit > 0 && (
        <div className={`text-xs font-bold mt-1.5 px-2 py-0.5 rounded-full inline-block ${c.badge} ${c.text}`}>
          {data.deficit.toFixed(1)}yr below
        </div>
      )}
      {data.growth !== null && (
        <div className={`text-xs mt-1 ${data.growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          <TrendingUp className="w-3 h-3 inline mr-0.5" />
          {data.growth >= 0 ? '+' : ''}{data.growth} growth
        </div>
      )}
    </div>
  );
};

const NarrativeField = ({ label, value, onChange, placeholder, rows = 4 }) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
    <textarea
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      className="w-full p-3 border border-slate-300/80 rounded-xl text-sm focus:ring-4 focus:ring-cyan-500/20 outline-none transition-all bg-white/80 leading-relaxed"
      placeholder={placeholder}
    />
  </div>
);

const SmallField = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 mb-1">{label}</label>
    <input
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="w-full p-2 border border-slate-300/80 rounded-lg text-sm focus:ring-4 focus:ring-cyan-500/20 outline-none transition-all bg-white/80"
      placeholder={placeholder}
    />
  </div>
);

// ─── HELPERS ────────────────────────────────────────────────────────────────

function createEmptyDraft() {
  return {
    studentId: '', studentName: '', gradeLevel: '', unitName: '', district: '',
    iepDate: '', iepDueDate: '', meetingType: '',
    // Demographics for template
    disabilityCategory: '', secondaryDisability: '',
    studentAddress: '', studentPhone: '', birthDate: '', studentAge: '',
    decisionMakerName: '', decisionMakerAddress: '', decisionMakerPhone: '',
    decisionMakerEmail: '', decisionMakerFax: '',
    caseManager: '', caseManagerPhone: '',
    evalDate: '', prevIepDate: '', triennialDate: '',
    iepInitiationDate: '', copyProvidedDate: '',
    // Present Levels
    academicLevels: '', functionalLevels: '', parentInput: '', strengthsText: '', impactStatement: '',
    changesFunctioning: '', evalSummary: '', transitionAssessments: '',
    kteaSnapshot: {},
    goals: [],
    services: [],
    accommodations: [],
    modifications: [],
    hasTransitionPlan: false,
    transition: { postSecondaryEducation: '', postSecondaryEmployment: '', independentLiving: '', transitionServices: [], targetSkills: [] },
    status: 'Draft',
  };
}

function getAllAccommodationLabels(selectedIds) {
  const labels = [];
  for (const items of Object.values(ACCOMMODATIONS)) {
    for (const acc of items) {
      if (selectedIds.includes(acc.id)) labels.push(acc.label);
    }
  }
  return labels;
}

function buildGoalData(goals, goalNum) {
  const idx = goalNum - 1;
  const goal = goals[idx];
  const prefix = `goal_${goalNum}`;
  if (!goal) {
    return {
      [`${prefix}_number`]: '',
      [`${prefix}_text`]: '',
      [`${prefix}_benchmark_1`]: '',
      [`${prefix}_benchmark_2`]: '',
      [`${prefix}_benchmark_3`]: '',
    };
  }
  return {
    [`${prefix}_number`]: String(goalNum),
    [`${prefix}_text`]: goal.goalText || '',
    [`${prefix}_benchmark_1`]: goal.benchmarks?.[0]?.text || '',
    [`${prefix}_benchmark_2`]: goal.benchmarks?.[1]?.text || '',
    [`${prefix}_benchmark_3`]: goal.benchmarks?.[2]?.text || '',
  };
}

function buildServiceData(services, serviceNum) {
  const idx = serviceNum - 1;
  const svc = services[idx];
  const prefix = `related_service_${serviceNum}`;
  if (!svc) {
    return {
      [`${prefix}_type`]: '',
      [`${prefix}_amount`]: '',
      [`${prefix}_frequency`]: '',
    };
  }
  return {
    [`${prefix}_type`]: svc.type || '',
    [`${prefix}_amount`]: svc.duration || '',
    [`${prefix}_frequency`]: svc.frequency || '',
  };
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
    @page { margin: 0; size: auto; }
    body * { visibility: hidden; }
    .page, .page * { visibility: visible; }
    .page { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0.5in; box-shadow: none !important; }
    ::-webkit-scrollbar { display: none; }
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = printStyles;
  document.head.appendChild(style);
}

export default IEPGenerator;
