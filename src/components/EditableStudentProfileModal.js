import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Loader2, GraduationCap, Calendar, Building2, FileCheck, MapPin, Clock, UserCheck, Phone, CalendarClock, StickyNote, Plus, Trash2 } from 'lucide-react';
import { databaseService } from '../services/databaseService';

const UNIT_OPTIONS = [
  { key: 'Determination', label: 'Determination', bg: 'bg-purple-600', text: 'text-purple-700', light: 'bg-purple-50', badge: 'bg-purple-100 text-purple-800' },
  { key: 'Discovery', label: 'Discovery', bg: 'bg-amber-600', text: 'text-amber-700', light: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800' },
  { key: 'Freedom', label: 'Freedom', bg: 'bg-sky-500', text: 'text-sky-700', light: 'bg-sky-50', badge: 'bg-sky-100 text-sky-800' },
  { key: 'Harmony', label: 'Harmony', bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-800' },
  { key: 'Integrity', label: 'Integrity', bg: 'bg-orange-600', text: 'text-orange-700', light: 'bg-orange-50', badge: 'bg-orange-100 text-orange-800' },
  { key: 'Serenity', label: 'Serenity', bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800' },
];

const INPUT_CLASS = 'w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white outline-none transition-all disabled:opacity-50 placeholder:text-slate-400';

const LABEL_CLASS = 'flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide';

const COMPACT_INPUT_CLASS = 'w-full px-2 py-1.5 rounded-md border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white outline-none transition-all disabled:opacity-50 placeholder:text-slate-400';

const COMPACT_LABEL_CLASS = 'flex items-center gap-1 text-[10px] font-semibold text-slate-500 mb-0.5 uppercase tracking-wide';

const EditableStudentProfileModal = ({ studentData, onClose, onSaved, user, mode = 'modal' }) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      gradeLevel: String(studentData?.gradeLevel || ''),
      unitName: studentData?.unitName || '',
      admitDate: studentData?.admitDate || '',
      expectedDischargeDate: studentData?.expectedDischargeDate || '',
      district: studentData?.district || '',
      iepStatus: studentData?.iep === 'Yes' ? 'yes' : 'no',
      homeSchoolContact: studentData?.homeSchoolContact || '',
      guardianName: studentData?.guardianName || '',
      guardianPhone: studentData?.guardianPhone || '',
      iepDueDate: studentData?.iepDueDate || '',
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [mtpNotes, setMtpNotes] = useState(studentData?.mtpNotes || []);
  const [newMtpNote, setNewMtpNote] = useState('');
  const [showMtpInput, setShowMtpInput] = useState(false);
  const [detailTab, setDetailTab] = useState('profile');

  const watchedUnit = watch('unitName');
  const watchedIep = watch('iepStatus');
  const unitStyle = UNIT_OPTIONS.find(u => u.key === (watchedUnit || studentData?.unitName))
    || { bg: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600', light: 'bg-slate-50', text: 'text-slate-700' };

  const initials = (studentData?.firstName?.[0] || studentData?.studentName?.[0] || '') +
    (studentData?.lastName?.[0] || studentData?.studentName?.split(' ')[1]?.[0] || '');

  const admitDate = studentData?.admitDate ? new Date(studentData.admitDate) : null;
  const today = new Date();
  const daysIn = admitDate ? Math.max(0, Math.floor((today - admitDate) / (1000 * 60 * 60 * 24))) : 0;

  let daysRemaining = null;
  if (admitDate && studentData?.expectedDischargeDate) {
    const dischargeDate = new Date(studentData.expectedDischargeDate);
    daysRemaining = Math.max(0, Math.ceil((dischargeDate - today) / (1000 * 60 * 60 * 24)));
  }

  const addMtpNote = () => {
    if (!newMtpNote.trim()) return;
    const note = {
      id: `mtp-${Date.now()}`,
      date: new Date().toISOString(),
      note: newMtpNote.trim(),
      author: user?.name || 'Unknown',
    };
    setMtpNotes(prev => [...prev, note]);
    setNewMtpNote('');
    setShowMtpInput(false);
  };

  const removeMtpNote = (noteId) => {
    setMtpNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const onSubmit = async (formData) => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      const updatePayload = {
        ...studentData,
        gradeLevel: parseInt(formData.gradeLevel, 10),
        unitName: formData.unitName,
        admitDate: formData.admitDate,
        expectedDischargeDate: formData.expectedDischargeDate || null,
        district: formData.district,
        iep: formData.iepStatus === 'yes' ? 'Yes' : 'No',
        homeSchoolContact: formData.homeSchoolContact || '',
        guardianName: formData.guardianName || '',
        guardianPhone: formData.guardianPhone || '',
        iepDueDate: formData.iepStatus === 'yes' ? (formData.iepDueDate || '') : '',
        mtpNotes: mtpNotes,
        lastModified: new Date().toISOString(),
      };
      await databaseService.upsertStudent(updatePayload);
      if (user) {
        await databaseService.logAudit(user, 'UpdateStudent', `Updated profile for ${studentData.studentName} (ID: ${studentData.id})`);
      }
      setSaveSuccess(true);
      if (mode === 'modal') {
        setTimeout(() => { if (onSaved) onSaved(); onClose(); }, 800);
      } else {
        if (onSaved) onSaved();
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Profile update failed:', err);
      setSaveError(err.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!studentData) return null;

  // --- Profile Tab Content ---
  const profileContent = (
    <>
      {/* Row 1: Grade + Admit Date + Discharge */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={LABEL_CLASS}>
            <GraduationCap className="w-3.5 h-3.5" />Grade
          </label>
          <select {...register('gradeLevel', { required: 'Required' })} disabled={isSaving} className={INPUT_CLASS}>
            <option value="">--</option>
            <option value="9">9th</option>
            <option value="10">10th</option>
            <option value="11">11th</option>
            <option value="12">12th</option>
          </select>
          {errors.gradeLevel && <p className="text-xs text-red-500 mt-0.5">{errors.gradeLevel.message}</p>}
        </div>
        <div>
          <label className={LABEL_CLASS}>
            <Calendar className="w-3.5 h-3.5" />Admit
          </label>
          <input type="date" {...register('admitDate', { required: 'Required' })} disabled={isSaving} className={INPUT_CLASS} />
          {errors.admitDate && <p className="text-xs text-red-500 mt-0.5">{errors.admitDate.message}</p>}
        </div>
        <div>
          <label className={LABEL_CLASS}>
            <Clock className="w-3.5 h-3.5" />Discharge
          </label>
          <input type="date" {...register('expectedDischargeDate')} disabled={isSaving} className={INPUT_CLASS} />
        </div>
      </div>

      {/* Row 2: District */}
      <div>
        <label className={LABEL_CLASS}>
          <MapPin className="w-3.5 h-3.5" />District
        </label>
        <input type="text" {...register('district')} disabled={isSaving} placeholder="School district" className={INPUT_CLASS} />
      </div>

      {/* Row 3: Home School Contact */}
      <div>
        <label className={LABEL_CLASS}>
          <UserCheck className="w-3.5 h-3.5" />Lead Contact (Home School)
        </label>
        <input type="text" {...register('homeSchoolContact')} disabled={isSaving} placeholder="e.g., Jane Smith, Guidance Counselor" className={INPUT_CLASS} />
      </div>

      {/* Row 4: Guardian Info */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLASS}>
            <Phone className="w-3.5 h-3.5" />Guardian Name
          </label>
          <input type="text" {...register('guardianName')} disabled={isSaving} placeholder="Parent/Guardian" className={INPUT_CLASS} />
        </div>
        <div>
          <label className={LABEL_CLASS}>
            <Phone className="w-3.5 h-3.5" />Guardian Phone
          </label>
          <input type="tel" {...register('guardianPhone')} disabled={isSaving} placeholder="(555) 123-4567" className={INPUT_CLASS} />
        </div>
      </div>

      {/* Unit Assignment */}
      <div>
        <label className={LABEL_CLASS}>
          <Building2 className="w-3.5 h-3.5" />Unit
        </label>
        <div className="grid grid-cols-2 gap-2">
          {UNIT_OPTIONS.map((unit) => {
            const isSelected = watchedUnit === unit.key;
            return (
              <label key={unit.key}
                className={`flex items-center justify-center px-3 py-2.5 rounded-lg border-2 text-xs font-bold cursor-pointer transition-all ${
                  isSelected ? `${unit.light} ${unit.text} border-current` : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100 hover:text-slate-600'
                } ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
                <input type="radio" value={unit.key} {...register('unitName', { required: 'Required' })} disabled={isSaving} className="sr-only" />
                {unit.label}
              </label>
            );
          })}
        </div>
        {errors.unitName && <p className="text-xs text-red-500 mt-0.5">{errors.unitName.message}</p>}
      </div>

      {/* IEP Status */}
      <div>
        <label className={LABEL_CLASS}>
          <FileCheck className="w-3.5 h-3.5" />IEP Status
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className={`flex items-center justify-center px-3 py-2.5 rounded-lg border-2 text-xs font-bold cursor-pointer transition-all ${
            watchedIep === 'no' ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'
          } ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
            <input type="radio" value="no" {...register('iepStatus')} disabled={isSaving} className="sr-only" />
            No IEP
          </label>
          <label className={`flex items-center justify-center px-3 py-2.5 rounded-lg border-2 text-xs font-bold cursor-pointer transition-all ${
            watchedIep === 'yes' ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'
          } ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
            <input type="radio" value="yes" {...register('iepStatus')} disabled={isSaving} className="sr-only" />
            Has IEP
          </label>
        </div>
      </div>

      {/* Conditional: IEP Due Date */}
      {watchedIep === 'yes' && (
        <div>
          <label className={LABEL_CLASS}>
            <CalendarClock className="w-3.5 h-3.5" />IEP Due Date
          </label>
          <input type="date" {...register('iepDueDate')} disabled={isSaving} className={INPUT_CLASS} />
        </div>
      )}

      {/* Status Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${studentData.active !== false ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : 'bg-slate-100 text-slate-500 border border-slate-200/60'}`}>
          {studentData.active !== false ? 'Active' : 'Discharged'}
        </span>
        <span className="text-xs text-slate-400 font-mono">{studentData.id}</span>
      </div>
    </>
  );
  // --- Compact Profile Content (detail mode -- side-by-side with sticky notes) ---
  const compactProfileContent = (
    <>
      {/* Row 1: Grade + Admit + Discharge + District */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
        <div>
          <label className={COMPACT_LABEL_CLASS}>
            <GraduationCap className="w-3 h-3" />Grade
          </label>
          <select {...register('gradeLevel', { required: 'Required' })} disabled={isSaving} className={COMPACT_INPUT_CLASS}>
            <option value="">--</option>
            <option value="9">9th</option>
            <option value="10">10th</option>
            <option value="11">11th</option>
            <option value="12">12th</option>
          </select>
          {errors.gradeLevel && <p className="text-[10px] text-red-500 mt-0.5">{errors.gradeLevel.message}</p>}
        </div>
        <div>
          <label className={COMPACT_LABEL_CLASS}>
            <Calendar className="w-3 h-3" />Admit
          </label>
          <input type="date" {...register('admitDate', { required: 'Required' })} disabled={isSaving} className={COMPACT_INPUT_CLASS} />
          {errors.admitDate && <p className="text-[10px] text-red-500 mt-0.5">{errors.admitDate.message}</p>}
        </div>
        <div>
          <label className={COMPACT_LABEL_CLASS}>
            <Clock className="w-3 h-3" />Discharge
          </label>
          <input type="date" {...register('expectedDischargeDate')} disabled={isSaving} className={COMPACT_INPUT_CLASS} />
        </div>
        <div>
          <label className={COMPACT_LABEL_CLASS}>
            <MapPin className="w-3 h-3" />District
          </label>
          <input type="text" {...register('district')} disabled={isSaving} placeholder="District" className={COMPACT_INPUT_CLASS} />
        </div>
      </div>

      {/* Row 2: Contact + Guardian + Phone */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className={COMPACT_LABEL_CLASS}>
            <UserCheck className="w-3 h-3" />Contact
          </label>
          <input type="text" {...register('homeSchoolContact')} disabled={isSaving} placeholder="Home school contact" className={COMPACT_INPUT_CLASS} />
        </div>
        <div>
          <label className={COMPACT_LABEL_CLASS}>
            <Phone className="w-3 h-3" />Guardian
          </label>
          <input type="text" {...register('guardianName')} disabled={isSaving} placeholder="Parent/Guardian" className={COMPACT_INPUT_CLASS} />
        </div>
        <div>
          <label className={COMPACT_LABEL_CLASS}>
            <Phone className="w-3 h-3" />Phone
          </label>
          <input type="tel" {...register('guardianPhone')} disabled={isSaving} placeholder="(555) 123-4567" className={COMPACT_INPUT_CLASS} />
        </div>
      </div>

      {/* Row 3: Unit chips */}
      <div>
        <label className={COMPACT_LABEL_CLASS}>
          <Building2 className="w-3 h-3" />Unit
        </label>
        <div className="flex flex-wrap gap-1.5">
          {UNIT_OPTIONS.map((unit) => {
            const isUnitSelected = watchedUnit === unit.key;
            return (
              <label key={unit.key}
                className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md border text-[11px] font-bold cursor-pointer transition-all ${
                  isUnitSelected ? `${unit.light} ${unit.text} border-current` : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100 hover:text-slate-600'
                } ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
                <input type="radio" value={unit.key} {...register('unitName', { required: 'Required' })} disabled={isSaving} className="sr-only" />
                {unit.label}
              </label>
            );
          })}
        </div>
        {errors.unitName && <p className="text-[10px] text-red-500 mt-0.5">{errors.unitName.message}</p>}
      </div>

      {/* Row 4: IEP inline */}
      <div>
        <label className={COMPACT_LABEL_CLASS}>
          <FileCheck className="w-3 h-3" />IEP
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          <label className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md border text-[11px] font-bold cursor-pointer transition-all ${
            watchedIep === 'no' ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'
          } ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
            <input type="radio" value="no" {...register('iepStatus')} disabled={isSaving} className="sr-only" />
            No IEP
          </label>
          <label className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md border text-[11px] font-bold cursor-pointer transition-all ${
            watchedIep === 'yes' ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'
          } ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
            <input type="radio" value="yes" {...register('iepStatus')} disabled={isSaving} className="sr-only" />
            Has IEP
          </label>
          {watchedIep === 'yes' && (
            <div className="flex items-center gap-1.5 ml-1">
              <span className="text-[10px] text-slate-500 font-semibold">Due:</span>
              <input type="date" {...register('iepDueDate')} disabled={isSaving}
                className="px-2 py-1 rounded-md border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white outline-none transition-all disabled:opacity-50 w-36" />
            </div>
          )}
        </div>
      </div>

      {/* Status Footer */}
      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${studentData.active !== false ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : 'bg-slate-100 text-slate-500 border border-slate-200/60'}`}>
          {studentData.active !== false ? 'Active' : 'Discharged'}
        </span>
        <span className="text-[10px] text-slate-400 font-mono">{studentData.id}</span>
      </div>
    </>
  );

  // --- MTP Notes Tab Content ---
  const notesContent = (
    <div className="space-y-4">
      {/* Header + Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">MTP Notes</span>
          <span className="text-xs text-slate-400 font-medium">Monthly Treatment Progress</span>
        </div>
        <button type="button" onClick={() => setShowMtpInput(prev => !prev)} disabled={isSaving}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition disabled:opacity-50">
          <Plus className="w-3.5 h-3.5" />
          Add Note
        </button>
      </div>

      {/* Composition Area */}
      {showMtpInput && (
        <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-4 space-y-3">
          <textarea
            value={newMtpNote}
            onChange={e => setNewMtpNote(e.target.value)}
            disabled={isSaving}
            placeholder="Describe the student's academic, behavioral, and social progress this month..."
            className="w-full px-3 py-3 rounded-lg border border-amber-200 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-amber-300/40 focus:border-amber-400 bg-white outline-none transition-all disabled:opacity-50 resize-vertical min-h-[120px]"
            rows={5}
          />
          <div className="flex gap-2">
            <button type="button" onClick={addMtpNote} disabled={isSaving || !newMtpNote.trim()}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm">
              Save Note
            </button>
            <button type="button" onClick={() => { setShowMtpInput(false); setNewMtpNote(''); }} disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition disabled:opacity-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      {mtpNotes.length === 0 ? (
        <div className="text-center py-8">
          <StickyNote className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-medium">No monthly progress notes yet.</p>
        </div>
      ) : (
        <div className={`space-y-3 overflow-y-auto ${mode === 'detail' ? '' : mode === 'panel' ? 'max-h-[50vh]' : 'max-h-60'}`}>
          {[...mtpNotes].reverse().map((note) => (
            <div key={note.id} className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm group/note">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    {new Date(note.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <span className="text-xs text-slate-400">&middot;</span>
                  <span className="text-xs text-slate-400 font-medium">{note.author}</span>
                </div>
                <button type="button" onClick={() => removeMtpNote(note.id)} disabled={isSaving}
                  className="opacity-0 group-hover/note:opacity-100 p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all disabled:opacity-50">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{note.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // --- Windows 11 Sticky Note Panel (detail mode) ---
  const stickyNotePanel = (
    <div className="h-64 md:h-auto w-full md:w-72 xl:w-80 shrink-0 border-t md:border-t-0 md:border-l border-slate-200/60 bg-amber-50 flex flex-col">
      {/* Panel Header */}
      <div className="px-3 py-2.5 bg-amber-100/80 border-b border-amber-200/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <StickyNote className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-bold text-amber-800">MTP Notes</span>
          {mtpNotes.length > 0 && (
            <span className="text-[10px] font-bold min-w-[16px] h-[16px] inline-flex items-center justify-center rounded-full bg-amber-200/60 text-amber-700">
              {mtpNotes.length}
            </span>
          )}
        </div>
        <button type="button" onClick={() => setShowMtpInput(prev => !prev)} disabled={isSaving}
          className="p-1 rounded-md text-amber-600 hover:bg-amber-200/60 transition disabled:opacity-50"
          title="Add note">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Notes List (scrollable -- only scroll point in the layout) */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {mtpNotes.length === 0 && !showMtpInput ? (
          <div className="text-center py-6">
            <StickyNote className="w-6 h-6 text-amber-300 mx-auto mb-1.5" />
            <p className="text-[11px] text-amber-600/60 font-medium">No notes yet</p>
          </div>
        ) : (
          [...mtpNotes].reverse().map((note) => (
            <div key={note.id} className="bg-white/60 rounded-lg p-2.5 border border-amber-200/40 group/note">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-amber-800">
                    {new Date(note.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-[10px] text-amber-500">{note.author}</span>
                </div>
                <button type="button" onClick={() => removeMtpNote(note.id)} disabled={isSaving}
                  className="opacity-0 group-hover/note:opacity-100 p-0.5 rounded text-amber-300 hover:text-rose-500 hover:bg-rose-50 transition-all disabled:opacity-50">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{note.note}</p>
            </div>
          ))
        )}
      </div>

      {/* Compose Area (bottom, shrink-0) */}
      {showMtpInput && (
        <div className="border-t border-amber-200/60 bg-white/80 px-3 py-2 shrink-0 space-y-1.5">
          <textarea
            value={newMtpNote}
            onChange={e => setNewMtpNote(e.target.value)}
            disabled={isSaving}
            placeholder="Monthly progress..."
            className="w-full px-2 py-1.5 rounded-md border border-amber-200 text-xs text-slate-800 focus:ring-2 focus:ring-amber-300/40 focus:border-amber-400 bg-white outline-none resize-none disabled:opacity-50"
            rows={2}
          />
          <div className="flex gap-1.5">
            <button type="button" onClick={addMtpNote} disabled={isSaving || !newMtpNote.trim()}
              className="px-2.5 py-1 rounded-md bg-amber-600 text-white text-[11px] font-bold hover:bg-amber-700 transition disabled:opacity-50">
              Save
            </button>
            <button type="button" onClick={() => { setShowMtpInput(false); setNewMtpNote(''); }} disabled={isSaving}
              className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 text-[11px] font-bold hover:bg-amber-200 transition disabled:opacity-50">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // --- Shared Header ---
  const header = (
    <div className={`relative px-5 pt-5 pb-4 ${unitStyle.light} border-b border-slate-200/80 shrink-0`}>
      <button type="button" onClick={onClose} disabled={isSaving}
        className="absolute top-3 right-3 p-2 rounded-lg bg-white/80 hover:bg-white text-slate-400 hover:text-slate-600 transition disabled:opacity-50 border border-slate-200/60" aria-label="Close">
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl ${unitStyle.bg} ring-2 ring-white flex items-center justify-center text-white font-extrabold text-base tracking-wide shadow-sm shrink-0`}>
          {initials.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-extrabold text-slate-900 leading-tight truncate">{studentData.studentName}</h3>
          <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-slate-500">
            <span>Grade {studentData.gradeLevel}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>{daysIn}d in program</span>
            {daysRemaining !== null && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className={daysRemaining <= 30 ? 'text-rose-600 font-bold' : ''}>
                  {daysRemaining}d remaining
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // --- Tab Navigation (panel mode only) ---
  const tabNav = (
    <div className="flex border-b border-slate-200 shrink-0 bg-white">
      <button type="button"
        onClick={() => setDetailTab('profile')}
        className={`px-5 py-3 text-xs font-bold border-b-2 transition-colors ${
          detailTab === 'profile'
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-slate-400 hover:text-slate-600'
        }`}
      >
        Profile
      </button>
      <button type="button"
        onClick={() => setDetailTab('notes')}
        className={`px-5 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
          detailTab === 'notes'
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-slate-400 hover:text-slate-600'
        }`}
      >
        MTP Notes
        {mtpNotes.length > 0 && (
          <span className={`text-xs min-w-[18px] h-[18px] inline-flex items-center justify-center rounded-full font-bold ${
            detailTab === 'notes'
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-slate-100 text-slate-500'
          }`}>
            {mtpNotes.length}
          </span>
        )}
      </button>
    </div>
  );

  // --- Status Messages ---
  const statusMessages = (
    <>
      {saveError && <div className="p-2.5 bg-red-50 border border-red-200/80 rounded-lg text-red-700 text-xs font-semibold">{saveError}</div>}
      {saveSuccess && <div className="p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-lg text-emerald-700 text-xs font-semibold flex items-center gap-1.5"><Save className="w-3.5 h-3.5" />Saved!</div>}
    </>
  );

  // --- Sticky Footer ---
  const footer = (
    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 shrink-0 flex gap-2.5">
      <button type="button" onClick={onClose} disabled={isSaving}
        className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 px-4 rounded-xl hover:bg-slate-200/80 transition-all disabled:opacity-50 text-sm">
        {mode === 'panel' || mode === 'detail' ? 'Close' : 'Cancel'}
      </button>
      <button type="submit" disabled={isSaving}
        className="flex-[1.5] bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
        {isSaving ? (<><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>) : (<><Save className="w-4 h-4" /> Save Changes</>)}
      </button>
    </div>
  );

  // ==========================================
  // DETAIL MODE: side-by-side profile + sticky notes (no scrolling)
  // ==========================================
  if (mode === 'detail') {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col bg-white">
        {/* Compact Header */}
        <div className={`relative px-4 pt-3 pb-2 ${unitStyle.light} border-b border-slate-200/80 shrink-0`}>
          <button type="button" onClick={onClose} disabled={isSaving}
            className="absolute top-2.5 right-3 p-1.5 rounded-md bg-white/80 hover:bg-white text-slate-400 hover:text-slate-600 transition border border-slate-200/60 disabled:opacity-50"
            aria-label="Close">
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${unitStyle.bg} ring-2 ring-white flex items-center justify-center text-white font-bold text-sm tracking-wide shadow-sm shrink-0`}>
              {initials.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-extrabold text-slate-900 leading-tight truncate">
                {studentData.studentName}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 text-xs font-semibold text-slate-500">
                <span>Grade {studentData.gradeLevel}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>{daysIn}d in program</span>
                {daysRemaining !== null && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className={daysRemaining <= 30 ? 'text-rose-600 font-bold' : ''}>
                      {daysRemaining}d remaining
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Side-by-side content: Profile (left) + Sticky Notes (right) */}
        <div className="flex flex-col md:flex-row overflow-hidden">
          {/* Profile Column */}
          <div className="flex-1 px-4 py-3 space-y-2">
            {statusMessages}
            {compactProfileContent}
          </div>

          {/* Sticky Note Column */}
          {stickyNotePanel}
        </div>

        {/* Compact Footer */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 shrink-0 flex gap-2">
          <button type="button" onClick={onClose} disabled={isSaving}
            className="px-4 bg-slate-100 text-slate-600 font-bold py-1.5 rounded-lg hover:bg-slate-200/80 transition-all disabled:opacity-50 text-xs">
            Close
          </button>
          <button type="submit" disabled={isSaving}
            className="flex-1 max-w-[200px] bg-indigo-600 text-white font-bold py-1.5 px-3 rounded-lg shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs">
            {isSaving ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>) : (<><Save className="w-3.5 h-3.5" /> Save</>)}
          </button>
        </div>
      </form>
    );
  }

  // ==========================================
  // PANEL MODE: inline detail panel with tabs
  // ==========================================
  if (mode === 'panel') {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-2xl shadow-slate-200/60 border border-slate-200/50 overflow-hidden flex flex-col max-h-[85vh]">
        {header}
        {tabNav}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {statusMessages}
          {detailTab === 'profile' && profileContent}
          {detailTab === 'notes' && notesContent}
        </div>
        {footer}
      </form>
    );
  }

  // ==========================================
  // MODAL MODE: original fixed overlay (default)
  // ==========================================
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {header}

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {statusMessages}
          {profileContent}
          {notesContent}

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-1">
            <button type="button" onClick={onClose} disabled={isSaving}
              className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 px-4 rounded-xl hover:bg-slate-200/80 transition-all disabled:opacity-50 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={isSaving}
              className="flex-[1.5] bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {isSaving ? (<><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>) : (<><Save className="w-4 h-4" /> Save Changes</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditableStudentProfileModal;
