import React, { useState, useMemo, useEffect } from 'react';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import { databaseService } from '../../services/databaseService';
import { useAutoSave } from '../../hooks/useAutoSave';
import {
  FileSpreadsheet, User, BookOpen, Heart, Wrench,
  FileDown, CloudUpload, RefreshCw, Loader2, CheckCircle,
  ChevronDown, ChevronUp, Copy, Eraser, PaintBucket, Info,
} from 'lucide-react';
import {
  ACADEMIC_SUBJECTS,
  PERSONAL_SOCIAL_BEHAVIORS,
  WORK_HABITS_BEHAVIORS,
  ACADEMIC_GRADE_OPTIONS,
  BEHAVIOR_GRADE_OPTIONS,
  QUARTERS,
  ACADEMIC_GRADE_COLORS,
  BEHAVIOR_GRADE_COLORS,
  getElementaryGrandDefaults,
  getElementaryGrandMappedData,
  getQuarterCompletion,
  getTotalCompletion,
} from './elementaryGradeCardData';

const ElementaryGradeCard = ({ user }) => {
  // Local storage key for elementary grade card
  const LS_KEY = `elementaryGradeCard_${user?.email || 'anon'}`;
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(LS_KEY);
    return saved ? JSON.parse(saved) : getElementaryGrandDefaults;
  });
  const [activeQuarter, setActiveQuarter] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchBanner, setFetchBanner] = useState('');
  const [showScoringKey, setShowScoringKey] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyFrom, setCopyFrom] = useState(1);
  const [copyTo, setCopyTo] = useState(2);
  const [dirty, setDirty] = useState(false);

  // --- Derived completion data ---
  const quarterCompletions = useMemo(() =>
    QUARTERS.map(q => getQuarterCompletion(formData, q)),
    [formData]
  );
  const totalCompletion = useMemo(() => getTotalCompletion(formData), [formData]);

  // --- Handlers ---
  const handleChange = (key, value) => {
    setFormData(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
    setDirty(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
    setDirty(true);
  };

  const fetchStudent = async () => {
    const name = formData.studentName?.trim();
    if (!name) return;

    setIsFetching(true);
    setFetchBanner('');

    try {
      const students = await databaseService.findStudentByName(name);
      if (!students || students.length === 0) {
        setFetchBanner('No student found with that name.');
        setIsFetching(false);
        return;
      }

      const student = students[0];
      setFormData(prev => ({
        ...prev,
        studentName: student.studentName || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        gradeLevel: student.gradeLevel ? String(student.gradeLevel) : prev.gradeLevel,
        admitDate: student.admitDate || prev.admitDate,
        dischargeDate: student.dischargeDate || prev.dischargeDate,
      }));
      setFetchBanner('Student data loaded.');
      setTimeout(() => setFetchBanner(''), 4000);
    } catch (err) {
      console.error('Error fetching student:', err);
      setFetchBanner('Failed to fetch student.');
    } finally {
      setIsFetching(false);
    }
  };

  // --- Quick-fill actions ---
  const fillQuarter = (quarter, section, value) => {
    setFormData(prev => {
      const updates = { ...prev };
      if (section === 'academic' || section === 'all') {
        for (let s = 1; s <= 5; s++) {
          updates[`eg_q${quarter}_subj${s}`] = value;
        }
      }
      if (section === 'behaviors' || section === 'all') {
        for (let b = 1; b <= 22; b++) {
          updates[`eg_q${quarter}_beh${b}`] = value;
        }
      }
      localStorage.setItem(LS_KEY, JSON.stringify(updates));
      return updates;
    });
    setDirty(true);
  };

  const clearQuarter = (quarter) => {
    setFormData(prev => {
      const updates = { ...prev };
      for (let s = 1; s <= 5; s++) {
        updates[`eg_q${quarter}_subj${s}`] = '';
      }
      for (let b = 1; b <= 22; b++) {
        updates[`eg_q${quarter}_beh${b}`] = '';
      }
      localStorage.setItem(LS_KEY, JSON.stringify(updates));
      return updates;
    });
    setDirty(true);
  };

    // Manual save handler for button
    const saveToDatabase = async () => {
      await saveFn();
    };
  const copyQuarter = (from, to) => {
    setFormData(prev => {
      const updates = { ...prev };
      for (let s = 1; s <= 5; s++) {
        updates[`eg_q${to}_subj${s}`] = prev[`eg_q${from}_subj${s}`];
      }
      for (let b = 1; b <= 22; b++) {
        updates[`eg_q${to}_beh${b}`] = prev[`eg_q${from}_beh${b}`];
      }
      localStorage.setItem(LS_KEY, JSON.stringify(updates));
      return updates;
    });
    setDirty(true);
    setShowCopyModal(false);
  };

  // --- Export ---
  const generateDocx = async () => {
    setLoading(true);
    try {
      const response = await fetch('/templates/grade_card_elementary_grand.docx');
      if (!response.ok) throw new Error('Could not find template');

      const arrayBuffer = await response.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        nullGetter: () => '',
      });

      const data = getElementaryGrandMappedData(formData);
      doc.render(data);

      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      saveAs(out, `${formData.studentName || 'Student'}_Elementary_Grade_Card.docx`);
    } catch (error) {
      console.error('Error generating document:', error);
      alert('Error generating document. Ensure template file exists in public/templates/.');
    } finally {
      setLoading(false);
    }
  };

  // --- Save ---
  const saveFn = async () => {
    if (!formData.studentName?.trim()) return;
    setSaving(true);
    try {
      const record = {
        ...formData,
        type: 'elementary_grade_card',
        templateType: 'elementary_grand',
        submittedBy: user?.email || 'unknown',
        createdAt: new Date().toISOString(),
      };
      await databaseService.addKteaReport(record);
      setSuccessMsg('Auto-saved to Database!');
      setTimeout(() => setSuccessMsg(''), 2000);
      setDirty(false);
    } catch (error) {
      console.error('Database Error:', error);
      setSuccessMsg('Auto-save failed!');
      setTimeout(() => setSuccessMsg(''), 2000);
    } finally {
      setSaving(false);
    }
  };

  // Auto-save hook
  const { saveStatus, lastSavedAt, forceSave } = useAutoSave(dirty, saveFn, {
    delay: 2500,
    enabled: !!formData.studentName?.trim(),
  });

  // --- Render helpers ---
  const GradeSelect = ({ fieldKey, options, colorMap }) => {
    const value = formData[fieldKey] || '';
    const colorClass = value && colorMap[value] ? colorMap[value] : 'bg-white text-slate-700';

    return (
      <select
        value={value}
        onChange={(e) => handleChange(fieldKey, e.target.value)}
        className={`w-full p-1.5 rounded border border-slate-200 text-xs text-center font-semibold
          focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all
          cursor-pointer ${colorClass}`}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt || '\u2014'}</option>
        ))}
      </select>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans text-slate-800">

      {/* HEADER */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-pink-600" />
            Elementary Grade Card
          </h1>
          {formData.studentName && (
            <span className="text-sm text-slate-500 font-medium">— {formData.studentName}</span>
          )}
        </div>
      </div>

      {/* SCROLLABLE BODY */}
      <div className="flex-1 overflow-y-auto px-4 py-5 pb-28">
        <div className="max-w-6xl mx-auto space-y-4">

          {/* FETCH BANNER */}
          {fetchBanner && (
            <div className={`rounded-xl px-5 py-3 flex items-center gap-3 ${
              fetchBanner.includes('loaded')
                ? 'bg-emerald-50 border border-emerald-200/80'
                : 'bg-amber-50 border border-amber-200/80'
            }`}>
              <Info className={`w-5 h-5 shrink-0 ${
                fetchBanner.includes('loaded') ? 'text-emerald-500' : 'text-amber-500'
              }`} />
              <p className={`text-sm font-medium ${
                fetchBanner.includes('loaded') ? 'text-emerald-800' : 'text-amber-800'
              }`}>{fetchBanner}</p>
            </div>
          )}

          {/* STUDENT INFO */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-pink-500" /> Student Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <FieldInput label="Student Name" name="studentName" value={formData.studentName} onChange={handleInputChange} placeholder="Jane Doe" />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grade Level</label>
                <select
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleInputChange}
                  className="p-2.5 rounded border border-slate-200 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                >
                  <option value="">--</option>
                  <option value="K">K</option>
                  {[1,2,3,4,5,6,7,8].map(g => <option key={g} value={String(g)}>{g}</option>)}
                </select>
              </div>
              <FieldInput label="School Year" name="schoolYear" value={formData.schoolYear} onChange={handleInputChange} placeholder="2025-2026" />
              <FieldInput label="Teacher" name="teacher" value={formData.teacher} onChange={handleInputChange} placeholder="Mr. Smith" />
              <FieldInput label="Admit Date" name="admitDate" type="date" value={formData.admitDate} onChange={handleInputChange} />
              <FieldInput label="Discharge Date" name="dischargeDate" type="date" value={formData.dischargeDate} onChange={handleInputChange} />
            </div>
          </div>

          {/* QUARTER TABS + PROGRESS */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              {QUARTERS.map((q, i) => {
                const { filled, total } = quarterCompletions[i];
                const isActive = activeQuarter === q;
                const isComplete = filled === total;
                return (
                  <button
                    key={q}
                    onClick={() => setActiveQuarter(q)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Q{q}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      isActive
                        ? (isComplete ? 'bg-emerald-400 text-white' : 'bg-white/20 text-white')
                        : (isComplete ? 'bg-emerald-100 text-emerald-700' : filled > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500')
                    }`}>
                      {filled}/{total}
                    </span>
                  </button>
                );
              })}
              <div className="flex-1" />
              <span className="text-xs text-slate-400 font-medium">
                {totalCompletion.filled}/{totalCompletion.total} total
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${(totalCompletion.filled / totalCompletion.total) * 100}%` }}
              />
            </div>
          </div>

          {/* ACADEMIC GRADES */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-500" /> Academic Grades
              </h3>
              <div className="flex items-center gap-1">
                <QuickFillMenu
                  label={`Fill Q${activeQuarter}`}
                  options={ACADEMIC_GRADE_OPTIONS.filter(Boolean)}
                  onSelect={(val) => fillQuarter(activeQuarter, 'academic', val)}
                />
              </div>
            </div>
            <div className="px-4 pb-4">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2 pl-2 w-56">Subject</th>
                    {QUARTERS.map(q => (
                      <th key={q} className={`text-center text-[10px] font-bold uppercase tracking-wider pb-2 w-20 ${
                        q === activeQuarter ? 'text-indigo-600' : 'text-slate-400'
                      }`}>Q{q}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ACADEMIC_SUBJECTS.map((subj, idx) => (
                    <tr key={subj.id} className={idx % 2 === 0 ? 'bg-slate-50/50' : ''}>
                      <td className="pl-2 py-1.5 text-sm font-medium text-slate-700">{subj.label}</td>
                      {QUARTERS.map(q => (
                        <td key={q} className={`px-1 py-1.5 ${q === activeQuarter ? 'bg-indigo-50/40' : ''}`}>
                          <GradeSelect
                            fieldKey={`eg_q${q}_subj${subj.id}`}
                            options={ACADEMIC_GRADE_OPTIONS}
                            colorMap={ACADEMIC_GRADE_COLORS}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SCORING KEY (collapsible) */}
          <button
            onClick={() => setShowScoringKey(!showScoringKey)}
            className="w-full flex items-center justify-between px-5 py-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <span>Scoring Key Reference</span>
            {showScoringKey ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showScoringKey && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Academic Grades</h4>
                <div className="space-y-1 text-xs text-slate-600">
                  <div><span className="font-bold text-emerald-700">A</span> — Exemplary: exceeds required performance</div>
                  <div><span className="font-bold text-blue-700">B</span> — Proficient: consistently demonstrates understanding</div>
                  <div><span className="font-bold text-yellow-700">C</span> — Developing: does not consistently demonstrate understanding</div>
                  <div><span className="font-bold text-orange-700">D</span> — Emerging: does not yet demonstrate understanding</div>
                  <div><span className="font-bold text-red-700">F</span> — Struggling: little or no mastery</div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Behavior Grades</h4>
                <div className="space-y-1 text-xs text-slate-600">
                  <div><span className="font-bold text-emerald-700">O</span> — Outstanding</div>
                  <div><span className="font-bold text-blue-700">S</span> — Satisfactory</div>
                  <div><span className="font-bold text-amber-700">NI</span> — Needs Improvement</div>
                </div>
              </div>
            </div>
          )}

          {/* BEHAVIORS - PERSONAL & SOCIAL GROWTH */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" /> Personal & Social Growth
              </h3>
              <QuickFillMenu
                label={`Fill Q${activeQuarter}`}
                options={BEHAVIOR_GRADE_OPTIONS.filter(Boolean)}
                onSelect={(val) => {
                  setFormData(prev => {
                    const updates = { ...prev };
                    PERSONAL_SOCIAL_BEHAVIORS.forEach(b => {
                      updates[`eg_q${activeQuarter}_beh${b.id}`] = val;
                    });
                    return updates;
                  });
                }}
              />
            </div>
            <div className="px-4 pb-4">
              <BehaviorTable
                behaviors={PERSONAL_SOCIAL_BEHAVIORS}
                formData={formData}
                activeQuarter={activeQuarter}
                onChange={handleChange}
                GradeSelect={GradeSelect}
              />
            </div>
          </div>

          {/* BEHAVIORS - WORK HABITS */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-slate-400" /> Work Habits
              </h3>
              <QuickFillMenu
                label={`Fill Q${activeQuarter}`}
                options={BEHAVIOR_GRADE_OPTIONS.filter(Boolean)}
                onSelect={(val) => {
                  setFormData(prev => {
                    const updates = { ...prev };
                    WORK_HABITS_BEHAVIORS.forEach(b => {
                      updates[`eg_q${activeQuarter}_beh${b.id}`] = val;
                    });
                    return updates;
                  });
                }}
              />
            </div>
            <div className="px-4 pb-4">
              <BehaviorTable
                behaviors={WORK_HABITS_BEHAVIORS}
                formData={formData}
                activeQuarter={activeQuarter}
                onChange={handleChange}
                GradeSelect={GradeSelect}
              />
            </div>
          </div>
        </div>
      </div>

      {/* STICKY FOOTER */}
      <div className="shrink-0 sticky bottom-0 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] px-6 py-3 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Secondary */}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStudent}
              disabled={isFetching || !formData.studentName?.trim()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-40"
            >
              {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Fetch Student
            </button>
            <div className="w-px h-6 bg-slate-200" />
            <button
              onClick={() => fillQuarter(activeQuarter, 'behaviors', 'S')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              title={`Fill all Q${activeQuarter} behaviors with S`}
            >
              <PaintBucket className="w-4 h-4" />
              Fill Q{activeQuarter}
            </button>
            <button
              onClick={() => setShowCopyModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy Q
            </button>
            <button
              onClick={() => clearQuarter(activeQuarter)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              title={`Clear all Q${activeQuarter} grades`}
            >
              <Eraser className="w-4 h-4" />
              Clear Q{activeQuarter}
            </button>
          </div>

          {/* Center: Status */}
          <div className="flex-1 flex justify-center">
            {successMsg && (
              <span className="text-emerald-600 font-bold text-sm flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> {successMsg}
              </span>
            )}
          </div>

          {/* Right: Primary */}
          <div className="flex items-center gap-2">
            <button
              onClick={generateDocx}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              {loading ? 'Generating...' : 'Word'}
            </button>
            <button
              onClick={saveToDatabase}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>
      </div>

      {/* COPY QUARTER MODAL */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowCopyModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-800 mb-4">Copy Quarter Grades</h3>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">From</label>
                <select value={copyFrom} onChange={e => setCopyFrom(Number(e.target.value))} className="w-full p-2 rounded border border-slate-200 text-sm">
                  {QUARTERS.map(q => <option key={q} value={q}>Q{q}</option>)}
                </select>
              </div>
              <span className="text-slate-400 mt-5">→</span>
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">To</label>
                <select value={copyTo} onChange={e => setCopyTo(Number(e.target.value))} className="w-full p-2 rounded border border-slate-200 text-sm">
                  {QUARTERS.map(q => <option key={q} value={q}>Q{q}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowCopyModal(false)} className="flex-1 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => copyQuarter(copyFrom, copyTo)}
                disabled={copyFrom === copyTo}
                className="flex-1 px-3 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENTS ---

const FieldInput = ({ label, name, value, onChange, type = 'text', placeholder }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="p-2.5 rounded border border-slate-200 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
    />
  </div>
);

const BehaviorTable = ({ behaviors, formData, activeQuarter, onChange, GradeSelect }) => (
  <table className="w-full">
    <thead>
      <tr>
        <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2 pl-2" style={{ width: '280px' }}>Behavior</th>
        {QUARTERS.map(q => (
          <th key={q} className={`text-center text-[10px] font-bold uppercase tracking-wider pb-2 w-20 ${
            q === activeQuarter ? 'text-indigo-600' : 'text-slate-400'
          }`}>Q{q}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {behaviors.map((beh, idx) => (
        <tr key={beh.id} className={idx % 2 === 0 ? 'bg-slate-50/50' : ''}>
          <td className="pl-2 py-1 text-xs text-slate-600">{beh.label}</td>
          {QUARTERS.map(q => (
            <td key={q} className={`px-1 py-1 ${q === activeQuarter ? 'bg-indigo-50/40' : ''}`}>
              <GradeSelect
                fieldKey={`eg_q${q}_beh${beh.id}`}
                options={BEHAVIOR_GRADE_OPTIONS}
                colorMap={BEHAVIOR_GRADE_COLORS}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const QuickFillMenu = ({ label, options, onSelect }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
      >
        <PaintBucket className="w-3 h-3" />
        {label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-20 min-w-[80px]">
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => { onSelect(opt); setOpen(false); }}
                className="w-full px-3 py-1.5 text-sm font-semibold text-left hover:bg-slate-100 transition-colors"
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ElementaryGradeCard;
