import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Loader2, GraduationCap, Calendar, Building2, FileCheck, MapPin, Clock } from 'lucide-react';
import { databaseService } from '../services/databaseService';

const UNIT_OPTIONS = [
  { key: 'Determination', label: 'Determination', bg: 'bg-purple-500', ring: 'ring-purple-200', text: 'text-purple-700', light: 'bg-purple-50', badge: 'bg-purple-100 text-purple-800' },
  { key: 'Discovery', label: 'Discovery', bg: 'bg-amber-500', ring: 'ring-amber-200', text: 'text-amber-700', light: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800' },
  { key: 'Freedom', label: 'Freedom', bg: 'bg-sky-500', ring: 'ring-sky-200', text: 'text-sky-700', light: 'bg-sky-50', badge: 'bg-sky-100 text-sky-800' },
  { key: 'Harmony', label: 'Harmony', bg: 'bg-emerald-500', ring: 'ring-emerald-200', text: 'text-emerald-700', light: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-800' },
  { key: 'Integrity', label: 'Integrity', bg: 'bg-orange-500', ring: 'ring-orange-200', text: 'text-orange-700', light: 'bg-orange-50', badge: 'bg-orange-100 text-orange-800' },
  { key: 'Serenity', label: 'Serenity', bg: 'bg-blue-500', ring: 'ring-blue-200', text: 'text-blue-700', light: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800' },
];

const INPUT_CLASS = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-300 bg-slate-50/50 hover:bg-white outline-none transition-all disabled:opacity-50';

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
    || { bg: 'bg-slate-400', ring: 'ring-slate-200', badge: 'bg-slate-100 text-slate-600' };

  const initials = (studentData?.firstName?.[0] || studentData?.studentName?.[0] || '') +
    (studentData?.lastName?.[0] || studentData?.studentName?.split(' ')[1]?.[0] || '');

  // Days in program
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
        await databaseService.logAudit(
          user,
          'UpdateStudent',
          `Updated profile for ${studentData.studentName} (ID: ${studentData.id})`
        );
      }

      setSaveSuccess(true);
      setTimeout(() => {
        if (onSaved) onSaved();
        onClose();
      }, 800);
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
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Hero Header */}
        <div className="relative px-6 pt-7 pb-5 bg-gradient-to-br from-slate-800 to-slate-900 text-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl ${unitStyle.bg} ring-4 ring-white/20 flex items-center justify-center text-white font-extrabold text-xl tracking-wide shadow-lg`}>
              {initials.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-extrabold leading-tight truncate">{studentData.studentName}</h3>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${unitStyle.badge}`}>
                  {watchedUnit || studentData.unitName}
                </span>
                {studentData.iep === 'Yes' && (
                  <span className="text-xs bg-amber-400/20 text-amber-300 px-2.5 py-1 rounded-lg font-bold border border-amber-400/30">IEP</span>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-5">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Program Progress</span>
              <span className="text-[11px] font-bold text-white/70">{progressPct}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${progressPct >= 80 ? 'bg-emerald-400' : progressPct >= 50 ? 'bg-indigo-400' : 'bg-amber-400'}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 shrink-0">
          <div className="px-4 py-3 text-center">
            <div className="text-xl font-extrabold text-slate-900">{studentData.gradeLevel}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grade</div>
          </div>
          <div className="px-4 py-3 text-center">
            <div className="text-xl font-extrabold text-slate-900">{daysIn}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Days In</div>
          </div>
          <div className="px-4 py-3 text-center">
            <div className={`text-xl font-extrabold ${daysRemaining !== null && daysRemaining <= 30 ? 'text-rose-600' : 'text-slate-900'}`}>
              {daysRemaining !== null ? daysRemaining : '---'}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Days Left</div>
          </div>
        </div>

        {/* Scrollable Form */}
        <div className="overflow-y-auto flex-1">
          {/* Status Messages */}
          <div className="px-6 pt-5">
            {saveError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200/80 rounded-xl text-red-700 text-sm font-semibold">{saveError}</div>
            )}
            {saveSuccess && (
              <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-700 text-sm font-semibold flex items-center gap-2">
                <Save className="w-4 h-4" /> Changes saved successfully!
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-4">

            {/* Row 1: Grade + Admit Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  <GraduationCap className="w-3.5 h-3.5" />Grade Level
                </label>
                <select {...register('gradeLevel', { required: 'Required' })} disabled={isSaving} className={INPUT_CLASS}>
                  <option value="">Select</option>
                  <option value="9">9th Grade</option>
                  <option value="10">10th Grade</option>
                  <option value="11">11th Grade</option>
                  <option value="12">12th Grade</option>
                </select>
                {errors.gradeLevel && <p className="text-xs text-red-500 mt-1">{errors.gradeLevel.message}</p>}
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5" />Admit Date
                </label>
                <input type="date" {...register('admitDate', { required: 'Required' })} disabled={isSaving} className={INPUT_CLASS} />
                {errors.admitDate && <p className="text-xs text-red-500 mt-1">{errors.admitDate.message}</p>}
              </div>
            </div>

            {/* Row 2: Expected Discharge + District */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />Expected Discharge
                </label>
                <input type="date" {...register('expectedDischargeDate')} disabled={isSaving} className={INPUT_CLASS} />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5" />District
                </label>
                <input type="text" {...register('district')} disabled={isSaving} placeholder="School district" className={INPUT_CLASS} />
              </div>
            </div>

            {/* Unit Assignment */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5" />Unit Assignment
              </label>
              <div className="grid grid-cols-3 gap-2">
                {UNIT_OPTIONS.map((unit) => {
                  const isSelected = watchedUnit === unit.key;
                  return (
                    <label
                      key={unit.key}
                      className={`relative flex items-center justify-center px-2 py-2 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? `${unit.light} ${unit.text} border-current shadow-sm`
                          : 'bg-slate-50/50 text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-700'
                      } ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <input type="radio" value={unit.key} {...register('unitName', { required: 'Required' })} disabled={isSaving} className="sr-only" />
                      {unit.label}
                    </label>
                  );
                })}
              </div>
              {errors.unitName && <p className="text-xs text-red-500 mt-1.5">{errors.unitName.message}</p>}
            </div>

            {/* IEP Status */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
                <FileCheck className="w-3.5 h-3.5" />IEP Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all duration-200 ${
                  watch('iepStatus') === 'no'
                    ? 'bg-slate-100 text-slate-700 border-slate-300 shadow-sm'
                    : 'bg-slate-50/50 text-slate-400 border-transparent hover:bg-slate-100 hover:text-slate-600'
                } ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input type="radio" value="no" {...register('iepStatus')} disabled={isSaving} className="sr-only" />
                  No IEP
                </label>
                <label className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all duration-200 ${
                  watch('iepStatus') === 'yes'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-sm'
                    : 'bg-slate-50/50 text-slate-400 border-transparent hover:bg-slate-100 hover:text-slate-600'
                } ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input type="radio" value="yes" {...register('iepStatus')} disabled={isSaving} className="sr-only" />
                  Has IEP
                </label>
              </div>
            </div>

            {/* ID + Status Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">ID: {studentData.id}</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${studentData.active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {studentData.active !== false ? 'Active' : 'Discharged'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 px-4 rounded-xl hover:bg-slate-200/80 focus:outline-none focus:ring-4 focus:ring-slate-200 transition-all duration-200 disabled:opacity-50 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-[1.5] bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-indigo-500/30 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Changes</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditableStudentProfileModal;
