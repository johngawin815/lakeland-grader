import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileCheck, Search, ChevronRight, ChevronLeft, Loader2, CheckCircle, AlertTriangle,
  Sparkles, Target, BookOpen, Wrench, Plus, Printer, Download, Save,
  Clock, Brain, Users, Compass, Trash2,
  AlertCircle, TrendingUp, Star,
} from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx';
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
    const cell = (text, bold = false) =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: text || '-', bold, size: 20 })], alignment: AlignmentType.LEFT })],
        verticalAlign: 'center',
      });

    const sections = [];

    // Header
    sections.push(
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'LAKELAND REGIONAL SCHOOL', bold: true, size: 28 })], spacing: { after: 80 } }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'INDIVIDUALIZED EDUCATION PROGRAM (IEP)', bold: true, size: 24 })], spacing: { after: 300 } }),
    );

    // Demographics
    sections.push(
      new Paragraph({ children: [new TextRun({ text: 'Student: ', bold: true }), new TextRun(d.studentName || '')] }),
      new Paragraph({ children: [new TextRun({ text: 'Grade: ', bold: true }), new TextRun(String(d.gradeLevel || '')), new TextRun({ text: '    District: ', bold: true }), new TextRun(d.district || '')] }),
      new Paragraph({ children: [new TextRun({ text: 'IEP Date: ', bold: true }), new TextRun(d.iepDate || ''), new TextRun({ text: '    Due Date: ', bold: true }), new TextRun(d.iepDueDate || '')] }),
      new Paragraph({ children: [new TextRun({ text: 'Meeting Type: ', bold: true }), new TextRun(d.meetingType || '')], spacing: { after: 300 } }),
    );

    // Present Levels
    sections.push(
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'PRESENT LEVELS OF ACADEMIC ACHIEVEMENT AND FUNCTIONAL PERFORMANCE', bold: true })], spacing: { before: 200, after: 100 } }),
      new Paragraph({ children: [new TextRun({ text: 'Academic Achievement:', bold: true, underline: {} })], spacing: { after: 50 } }),
      ...splitToParagraphs(d.academicLevels),
      new Paragraph({ children: [new TextRun({ text: 'Functional Performance:', bold: true, underline: {} })], spacing: { before: 200, after: 50 } }),
      ...splitToParagraphs(d.functionalLevels),
      new Paragraph({ children: [new TextRun({ text: 'Strengths:', bold: true, underline: {} })], spacing: { before: 200, after: 50 } }),
      ...splitToParagraphs(d.strengthsText),
      new Paragraph({ children: [new TextRun({ text: 'Impact of Disability:', bold: true, underline: {} })], spacing: { before: 200, after: 50 } }),
      ...splitToParagraphs(d.impactStatement),
    );

    // Goals
    if (d.goals.length > 0) {
      sections.push(
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'MEASURABLE ANNUAL GOALS', bold: true })], spacing: { before: 400, after: 100 } }),
      );
      d.goals.forEach((goal, i) => {
        sections.push(
          new Paragraph({ children: [new TextRun({ text: `Goal ${i + 1} (${goal.area}): `, bold: true }), new TextRun(goal.goalText)], spacing: { before: 200, after: 50 } }),
          new Paragraph({ children: [new TextRun({ text: 'Measurement: ', bold: true, italics: true }), new TextRun({ text: goal.measureMethod, italics: true })], spacing: { after: 50 } }),
        );
        goal.benchmarks.forEach((bm, j) => {
          sections.push(new Paragraph({ children: [new TextRun({ text: `  Benchmark ${j + 1}: `, bold: true }), new TextRun(bm.text)], spacing: { after: 30 } }));
        });
      });
    }

    // Services
    if (d.services.length > 0) {
      sections.push(
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'SPECIAL EDUCATION SERVICES', bold: true })], spacing: { before: 400, after: 100 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [cell('Service', true), cell('Location', true), cell('Frequency', true), cell('Duration', true)] }),
            ...d.services.map(s => new TableRow({ children: [cell(s.type), cell(s.location), cell(s.frequency), cell(s.duration)] })),
          ],
        }),
      );
    }

    // Accommodations
    const accLabels = getAllAccommodationLabels(d.accommodations);
    if (accLabels.length > 0) {
      sections.push(
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'ACCOMMODATIONS', bold: true })], spacing: { before: 400, after: 100 } }),
        ...accLabels.map(label => new Paragraph({ children: [new TextRun(`• ${label}`)], spacing: { after: 30 } })),
      );
    }

    // Modifications
    const modLabels = d.modifications.map(id => MODIFICATIONS.find(m => m.id === id)?.label).filter(Boolean);
    if (modLabels.length > 0) {
      sections.push(
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'MODIFICATIONS', bold: true })], spacing: { before: 300, after: 100 } }),
        ...modLabels.map(label => new Paragraph({ children: [new TextRun(`• ${label}`)], spacing: { after: 30 } })),
      );
    }

    // Transition
    if (d.hasTransitionPlan) {
      sections.push(
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'TRANSITION PLAN', bold: true })], spacing: { before: 400, after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: 'Post-Secondary Education Goal: ', bold: true }), new TextRun(d.transition.postSecondaryEducation || 'Not specified')] }),
        new Paragraph({ children: [new TextRun({ text: 'Employment Goal: ', bold: true }), new TextRun(d.transition.postSecondaryEmployment || 'Not specified')] }),
        new Paragraph({ children: [new TextRun({ text: 'Independent Living Goal: ', bold: true }), new TextRun(d.transition.independentLiving || 'Not specified')], spacing: { after: 100 } }),
      );
    }

    // Signature lines
    sections.push(
      new Paragraph({ text: '', spacing: { before: 600 } }),
      new Paragraph({ children: [new TextRun({ text: '___________________________________', size: 20 })], spacing: { after: 30 } }),
      new Paragraph({ children: [new TextRun({ text: 'Special Education Teacher          Date', size: 18 })] }),
      new Paragraph({ text: '', spacing: { before: 200 } }),
      new Paragraph({ children: [new TextRun({ text: '___________________________________', size: 20 })], spacing: { after: 30 } }),
      new Paragraph({ children: [new TextRun({ text: 'Parent/Guardian                              Date', size: 18 })] }),
      new Paragraph({ text: '', spacing: { before: 200 } }),
      new Paragraph({ children: [new TextRun({ text: '___________________________________', size: 20 })], spacing: { after: 30 } }),
      new Paragraph({ children: [new TextRun({ text: 'LEA Representative                        Date', size: 18 })] }),
    );

    const doc = new Document({ sections: [{ children: sections }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${d.studentName || 'Student'}_IEP.docx`);

    await databaseService.logAudit(user, 'Exported IEP', `Exported IEP document for ${d.studentName}`);
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
          {step === 0 && <StudentStep students={filteredStudents} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onSelect={handleSelectStudent} loading={loading} selectedStudent={selectedStudent} />}
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

const StudentStep = ({ students, searchTerm, setSearchTerm, onSelect, loading, selectedStudent }) => (
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
        <div className="text-sm font-bold text-slate-700">Include Transition Plan</div>
        <div className="text-xs text-slate-500">Required for students age 14+ or grade 9+</div>
      </div>
    </label>

    {draft.hasTransitionPlan && (
      <>
        <NarrativeField
          label="Post-Secondary Education Goal"
          value={draft.transition.postSecondaryEducation}
          onChange={v => setDraft(prev => ({ ...prev, transition: { ...prev.transition, postSecondaryEducation: v } }))}
          placeholder="After completing high school, the student will..."
          rows={3}
        />
        <NarrativeField
          label="Employment Goal"
          value={draft.transition.postSecondaryEmployment}
          onChange={v => setDraft(prev => ({ ...prev, transition: { ...prev.transition, postSecondaryEmployment: v } }))}
          placeholder="After completing high school, the student will pursue employment in..."
          rows={3}
        />
        <NarrativeField
          label="Independent Living Goal"
          value={draft.transition.independentLiving}
          onChange={v => setDraft(prev => ({ ...prev, transition: { ...prev.transition, independentLiving: v } }))}
          placeholder="The student will demonstrate the ability to..."
          rows={3}
        />

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

// ─── HELPERS ────────────────────────────────────────────────────────────────

function createEmptyDraft() {
  return {
    studentId: '', studentName: '', gradeLevel: '', unitName: '', district: '',
    iepDate: '', iepDueDate: '', meetingType: '',
    academicLevels: '', functionalLevels: '', parentInput: '', strengthsText: '', impactStatement: '',
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

function splitToParagraphs(text) {
  if (!text) return [new Paragraph({ text: '' })];
  return text.split('\n').filter(Boolean).map(line =>
    new Paragraph({ children: [new TextRun({ text: line, size: 22 })], spacing: { after: 80 } })
  );
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
