import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Loader2, GraduationCap, Calendar, Building2, FileCheck, MapPin, Clock } from 'lucide-react';
import { databaseService } from '../services/databaseService';

const UNIT_OPTIONS = [
  { key: 'Determination', label: 'Determination', bg: 'bg-purple-500', text: 'text-purple-700', light: 'bg-purple-50', badge: 'bg-purple-100 text-purple-800' },
  { key: 'Discovery', label: 'Discovery', bg: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800' },
  { key: 'Freedom', label: 'Freedom', bg: 'bg-sky-500', text: 'text-sky-700', light: 'bg-sky-50', badge: 'bg-sky-100 text-sky-800' },
  { key: 'Harmony', label: 'Harmony', bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-800' },
  { key: 'Integrity', label: 'Integrity', bg: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-50', badge: 'bg-orange-100 text-orange-800' },
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
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const watchedUnit = watch('unitName');
  const unitStyle = UNIT_OPTIONS.find(u => u.key === (watchedUnit || studentData?.unitName))
    || { bg: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600' };

  const initials = (studentData?.firstName?.[0] || studentData?.studentName?.[0] || '') +
    (studentData?.lastName?.[0] || studentData?.studentName?.split(' ')[1]?.[0] || '');

  const admitDate = studentData?.admitDate ? new Date(studentData.admitDate) : null;
  const today = new Date();
  const daysIn = admitDate ? Math.max(0, Math.floor((today - admitDate) / (1000 * 60 * 60 * 24))) : 0;

  let progressPct = 0;
  let daysRemaining = null;
  if (admitDate && studentData?.expectedDischargeDate) {
    const dischargeDate = new Date(studentData.expectedDischargeDate);
    const total = dischargeDate - admitDate;
    if (total > 0) progressPct = Math.min(100, Math.round(((today - admitDate) / total) * 100));
    daysRemaining = Math.max(0, Math.ceil((dischargeDate - today) / (1000 * 60 * 60 * 24)));
  }

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
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Compact Header */}
        <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
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

          {/* Thin progress bar */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div className={`h-full rounded-full ${progressPct >= 80 ? 'bg-emerald-400' : progressPct >= 50 ? 'bg-indigo-400' : 'bg-amber-400'}`}
                style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-[10px] font-bold text-white/50 tabular-nums">{progressPct}%</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-3">

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

          {/* IEP Status + ID row */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                <FileCheck className="w-3 h-3" />IEP
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <label className={`flex items-center justify-center px-2 py-1.5 rounded-lg border-2 text-xs font-bold cursor-pointer transition-all ${
                  watch('iepStatus') === 'no' ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-50/50 text-slate-400 border-transparent hover:bg-slate-100'
                } ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input type="radio" value="no" {...register('iepStatus')} disabled={isSaving} className="sr-only" />
                  No IEP
                </label>
                <label className={`flex items-center justify-center px-2 py-1.5 rounded-lg border-2 text-xs font-bold cursor-pointer transition-all ${
                  watch('iepStatus') === 'yes' ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-slate-50/50 text-slate-400 border-transparent hover:bg-slate-100'
                } ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input type="radio" value="yes" {...register('iepStatus')} disabled={isSaving} className="sr-only" />
                  Has IEP
                </label>
              </div>
            </div>
            <div className="text-right pb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${studentData.active !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                {studentData.active !== false ? 'Active' : 'Discharged'}
              </span>
              <div className="text-[10px] text-slate-400 mt-0.5">{studentData.id}</div>
            </div>
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
