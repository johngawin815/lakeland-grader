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

const INPUT_CLASS = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 bg-slate-50/50 hover:bg-white outline-none transition-all disabled:opacity-50';

const EditableStudentProfileModal = ({ studentData, onClose, onSaved, user }) => {
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

  const watchedUnit = watch('unitName');
  const watchedIep = watch('iepStatus');
  const unitStyle = UNIT_OPTIONS.find(u => u.key === (watchedUnit || studentData?.unitName))
    || { bg: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600' };

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
      setTimeout(() => { if (onSaved) onSaved(); onClose(); }, 800);
    } catch (err) {
      console.error('Profile update failed:', err);
      setSaveError(err.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!studentData) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Compact Header */}
        <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-slate-800 to-slate-900 text-white shrink-0">
          <button type="button" onClick={onClose} disabled={isSaving}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition disabled:opacity-50" aria-label="Close">
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${unitStyle.bg} ring-2 ring-white/20 flex items-center justify-center text-white font-extrabold text-base tracking-wide shadow-md shrink-0`}>
              {initials.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-extrabold leading-tight truncate">{studentData.studentName}</h3>
              <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-white/60">
                <span>Grade {studentData.gradeLevel}</span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span>{daysIn}d in</span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span className={daysRemaining !== null && daysRemaining <= 30 ? 'text-rose-400' : ''}>
                  {daysRemaining !== null ? `${daysRemaining}d left` : '---'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-3 overflow-y-auto flex-1">

          {/* Status Messages */}
          {saveError && <div className="p-2.5 bg-red-50 border border-red-200/80 rounded-lg text-red-700 text-xs font-semibold">{saveError}</div>}
          {saveSuccess && <div className="p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-lg text-emerald-700 text-xs font-semibold flex items-center gap-1.5"><Save className="w-3.5 h-3.5" />Saved!</div>}

          {/* Row 1: Grade + Admit Date + Discharge */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                <GraduationCap className="w-3 h-3" />Grade
              </label>
              <select {...register('gradeLevel', { required: 'Required' })} disabled={isSaving} className={INPUT_CLASS}>
                <option value="">--</option>
                <option value="9">9th</option>
                <option value="10">10th</option>
                <option value="11">11th</option>
                <option value="12">12th</option>
              </select>
              {errors.gradeLevel && <p className="text-[10px] text-red-500 mt-0.5">{errors.gradeLevel.message}</p>}
            </div>
            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                <Calendar className="w-3 h-3" />Admit
              </label>
              <input type="date" {...register('admitDate', { required: 'Required' })} disabled={isSaving} className={INPUT_CLASS} />
              {errors.admitDate && <p className="text-[10px] text-red-500 mt-0.5">{errors.admitDate.message}</p>}
            </div>
            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                <Clock className="w-3 h-3" />Discharge
              </label>
              <input type="date" {...register('expectedDischargeDate')} disabled={isSaving} className={INPUT_CLASS} />
            </div>
          </div>

          {/* Row 2: District */}
          <div>
            <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
              <MapPin className="w-3 h-3" />District
            </label>
            <input type="text" {...register('district')} disabled={isSaving} placeholder="School district" className={INPUT_CLASS} />
          </div>

          {/* Row 3: Home School Contact */}
          <div>
            <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
              <UserCheck className="w-3 h-3" />Lead Contact (Home School)
            </label>
            <input type="text" {...register('homeSchoolContact')} disabled={isSaving} placeholder="e.g., Jane Smith, Guidance Counselor" className={INPUT_CLASS} />
          </div>

          {/* Row 4: Guardian Info */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                <Phone className="w-3 h-3" />Guardian Name
              </label>
              <input type="text" {...register('guardianName')} disabled={isSaving} placeholder="Parent/Guardian" className={INPUT_CLASS} />
            </div>
            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                <Phone className="w-3 h-3" />Guardian Phone
              </label>
              <input type="tel" {...register('guardianPhone')} disabled={isSaving} placeholder="(555) 123-4567" className={INPUT_CLASS} />
            </div>
          </div>

          {/* Unit Assignment */}
          <div>
            <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              <Building2 className="w-3 h-3" />Unit
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {UNIT_OPTIONS.map((unit) => {
                const isSelected = watchedUnit === unit.key;
                return (
                  <label key={unit.key}
                    className={`flex items-center justify-center px-1.5 py-1.5 rounded-lg border-2 text-[11px] font-bold cursor-pointer transition-all ${
                      isSelected ? `${unit.light} ${unit.text} border-current` : 'bg-slate-50/50 text-slate-400 border-transparent hover:bg-slate-100 hover:text-slate-600'
                    } ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input type="radio" value={unit.key} {...register('unitName', { required: 'Required' })} disabled={isSaving} className="sr-only" />
                    {unit.label}
                  </label>
                );
              })}
            </div>
            {errors.unitName && <p className="text-[10px] text-red-500 mt-0.5">{errors.unitName.message}</p>}
          </div>

          {/* IEP Status + IEP Due Date */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                <FileCheck className="w-3 h-3" />IEP
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <label className={`flex items-center justify-center px-2 py-1.5 rounded-lg border-2 text-xs font-bold cursor-pointer transition-all ${
                  watchedIep === 'no' ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-50/50 text-slate-400 border-transparent hover:bg-slate-100'
                } ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input type="radio" value="no" {...register('iepStatus')} disabled={isSaving} className="sr-only" />
                  No IEP
                </label>
                <label className={`flex items-center justify-center px-2 py-1.5 rounded-lg border-2 text-xs font-bold cursor-pointer transition-all ${
                  watchedIep === 'yes' ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-slate-50/50 text-slate-400 border-transparent hover:bg-slate-100'
                } ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input type="radio" value="yes" {...register('iepStatus')} disabled={isSaving} className="sr-only" />
                  Has IEP
                </label>
              </div>
            </div>
            {watchedIep === 'yes' && (
              <div className="flex-1">
                <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  <CalendarClock className="w-3 h-3" />IEP Due Date
                </label>
                <input type="date" {...register('iepDueDate')} disabled={isSaving} className={INPUT_CLASS} />
              </div>
            )}
            <div className="text-right pb-1 shrink-0">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${studentData.active !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                {studentData.active !== false ? 'Active' : 'Discharged'}
              </span>
              <div className="text-[10px] text-slate-400 mt-0.5">{studentData.id}</div>
            </div>
          </div>

          {/* MTP Notes Section - Sticky Note Style */}
          <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <StickyNote className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">MTP Notes</span>
                <span className="text-[10px] text-amber-400 font-medium ml-1">Monthly Treatment Progress</span>
              </div>
              <button type="button" onClick={() => setShowMtpInput(prev => !prev)} disabled={isSaving}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-800 transition disabled:opacity-50">
                <Plus className="w-3.5 h-3.5" />
                Add Note
              </button>
            </div>

            {/* Add new note input */}
            {showMtpInput && (
              <div className="mb-3 space-y-2">
                <textarea
                  value={newMtpNote}
                  onChange={e => setNewMtpNote(e.target.value)}
                  disabled={isSaving}
                  placeholder="Describe the student's academic, behavioral, and social progress this month..."
                  className="w-full px-3 py-2.5 rounded-lg border border-amber-300 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-amber-300/40 focus:border-amber-400 bg-white outline-none transition-all disabled:opacity-50 resize-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button type="button" onClick={addMtpNote} disabled={isSaving || !newMtpNote.trim()}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition disabled:opacity-50">
                    Save Note
                  </button>
                  <button type="button" onClick={() => { setShowMtpInput(false); setNewMtpNote(''); }} disabled={isSaving}
                    className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold hover:bg-amber-200 transition disabled:opacity-50">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Existing notes */}
            {mtpNotes.length === 0 ? (
              <p className="text-[11px] text-amber-400 italic font-medium">No monthly progress notes yet.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {[...mtpNotes].reverse().map((note) => (
                  <div key={note.id} className="bg-white/70 rounded-lg p-2.5 border border-amber-100 group/note">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-amber-600">
                        {new Date(note.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">{note.author}</span>
                        <button type="button" onClick={() => removeMtpNote(note.id)} disabled={isSaving}
                          className="opacity-0 group-hover/note:opacity-100 p-0.5 rounded text-slate-300 hover:text-rose-500 transition-all disabled:opacity-50">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed font-medium">{note.note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

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
