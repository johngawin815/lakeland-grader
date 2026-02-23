import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Loader2, GraduationCap, Calendar, Building2, FileCheck } from 'lucide-react';
import { databaseService } from '../services/databaseService';

/**
 * EditableStudentProfileModal
 * Provides a secure, form-based interface for editing student data.
 * @param {Object} studentData - The student object with id, studentName, gradeLevel, unitName, admitDate, iep
 * @param {Function} onClose - Callback to close the modal
 * @param {Object} user - Current user object for audit logging
 */
const EditableStudentProfileModal = ({ studentData, onClose, user }) => {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      gradeLevel: studentData?.gradeLevel || '',
      unitName: studentData?.unitName || '',
      admitDate: studentData?.admitDate || '',
      iepStatus: studentData?.iep === 'Yes' ? 'yes' : 'no',
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setError] = useState('');
  const [saveSuccess, setSuccess] = useState(false);

  const watchedUnit = watch('unitName');

  const UNIT_OPTIONS = [
    { key: 'Determination', label: 'Determination', color: 'purple' },
    { key: 'Discovery', label: 'Discovery', color: 'yellow' },
    { key: 'Freedom', label: 'Freedom', color: 'sky' },
    { key: 'Harmony', label: 'Harmony', color: 'green' },
    { key: 'Integrity', label: 'Integrity', color: 'orange' },
    { key: 'Serenity', label: 'Serenity', color: 'blue' },
  ];

  const UNIT_COLORS = {
    Determination: { bg: 'bg-purple-500', ring: 'ring-purple-200', text: 'text-purple-700', light: 'bg-purple-50' },
    Discovery: { bg: 'bg-yellow-500', ring: 'ring-yellow-200', text: 'text-yellow-700', light: 'bg-yellow-50' },
    Freedom: { bg: 'bg-sky-500', ring: 'ring-sky-200', text: 'text-sky-700', light: 'bg-sky-50' },
    Harmony: { bg: 'bg-green-500', ring: 'ring-green-200', text: 'text-green-700', light: 'bg-green-50' },
    Integrity: { bg: 'bg-orange-500', ring: 'ring-orange-200', text: 'text-orange-700', light: 'bg-orange-50' },
    Serenity: { bg: 'bg-blue-500', ring: 'ring-blue-200', text: 'text-blue-700', light: 'bg-blue-50' },
  };

  const unitColor = UNIT_COLORS[watchedUnit || studentData?.unitName] || { bg: 'bg-slate-400', ring: 'ring-slate-200', text: 'text-slate-600', light: 'bg-slate-50' };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const onSubmit = async (formData) => {
    setIsSaving(true);
    setError('');
    setSuccess(false);

    try {
      if (!formData.gradeLevel || !formData.unitName || !formData.admitDate) {
        throw new Error('All fields are required.');
      }

      const updatePayload = {
        id: studentData.id,
        studentName: studentData.studentName,
        gradeLevel: parseInt(formData.gradeLevel, 10),
        unitName: formData.unitName,
        admitDate: formData.admitDate,
        iep: formData.iepStatus === 'yes' ? 'Yes' : 'No',
        lastModified: new Date().toISOString(),
      };

      await databaseService.upsertStudent(updatePayload);

      await databaseService.logAudit(
        user,
        'UpdateStudent',
        `Updated profile for ${studentData.studentName} (ID: ${studentData.id})`
      );

      setSuccess(true);
      setTimeout(() => {
        reset();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Profile update failed:', err);
      setError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!studentData) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-2xl shadow-slate-900/10 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-slate-500 hover:text-slate-900 transition-all shadow-sm disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Student Profile Card Header */}
        <div className="relative px-6 pt-8 pb-6 text-center">
          <div className={`mx-auto w-20 h-20 rounded-2xl ${unitColor.bg} ring-4 ${unitColor.ring} flex items-center justify-center shadow-lg mb-4`}>
            <span className="text-2xl font-bold text-white tracking-wide">
              {getInitials(studentData.studentName)}
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">{studentData.studentName}</h3>
          <p className="text-sm text-slate-500 mt-1 font-medium">Student ID: {studentData.id}</p>
        </div>

        {/* Status Message Area */}
        <div className="px-6">
          {saveError && (
            <div className="p-3 mb-4 bg-red-50 border border-red-200/80 rounded-xl text-red-700 text-sm font-semibold flex items-center gap-2">
              <span className="shrink-0">⚠️</span>
              <span>{saveError}</span>
            </div>
          )}
          {saveSuccess && (
            <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-700 text-sm font-semibold flex items-center gap-2">
              <span className="shrink-0">✓</span>
              <span>Changes saved successfully!</span>
            </div>
          )}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-4">

          {/* Two-column row: Grade Level + Admit Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                <GraduationCap className="w-3.5 h-3.5" />
                Grade
              </label>
              <select
                {...register('gradeLevel', { required: 'Required' })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-300 bg-slate-50/50 hover:bg-white outline-none transition-all disabled:opacity-50"
                disabled={isSaving}
              >
                <option value="">Select</option>
                <option value="9">9th Grade</option>
                <option value="10">10th Grade</option>
                <option value="11">11th Grade</option>
                <option value="12">12th Grade</option>
              </select>
              {errors.gradeLevel && (
                <p className="text-xs text-red-500 mt-1">{errors.gradeLevel.message}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5" />
                Admit Date
              </label>
              <input
                type="date"
                {...register('admitDate', { required: 'Required' })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-300 bg-slate-50/50 hover:bg-white outline-none transition-all disabled:opacity-50"
                disabled={isSaving}
              />
              {errors.admitDate && (
                <p className="text-xs text-red-500 mt-1">{errors.admitDate.message}</p>
              )}
            </div>
          </div>

          {/* Unit Assignment */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              Unit Assignment
            </label>
            <div className="grid grid-cols-3 gap-2">
              {UNIT_OPTIONS.map((unit) => {
                const colors = UNIT_COLORS[unit.key];
                const isSelected = watchedUnit === unit.key;
                return (
                  <label
                    key={unit.key}
                    className={`relative flex items-center justify-center px-2 py-2 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? `${colors.light} ${colors.text} border-current shadow-sm`
                        : 'bg-slate-50/50 text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-700'
                    } ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <input
                      type="radio"
                      value={unit.key}
                      {...register('unitName', { required: 'Unit is required' })}
                      disabled={isSaving}
                      className="sr-only"
                    />
                    {unit.label}
                  </label>
                );
              })}
            </div>
            {errors.unitName && (
              <p className="text-xs text-red-500 mt-1.5">{errors.unitName.message}</p>
            )}
          </div>

          {/* IEP Status */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
              <FileCheck className="w-3.5 h-3.5" />
              IEP Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all duration-200 ${
                  watch('iepStatus') === 'no'
                    ? 'bg-slate-100 text-slate-700 border-slate-300 shadow-sm'
                    : 'bg-slate-50/50 text-slate-400 border-transparent hover:bg-slate-100 hover:text-slate-600'
                } ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input
                  type="radio"
                  value="no"
                  {...register('iepStatus')}
                  disabled={isSaving}
                  className="sr-only"
                />
                No IEP
              </label>
              <label
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all duration-200 ${
                  watch('iepStatus') === 'yes'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-sm'
                    : 'bg-slate-50/50 text-slate-400 border-transparent hover:bg-slate-100 hover:text-slate-600'
                } ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input
                  type="radio"
                  value="yes"
                  {...register('iepStatus')}
                  disabled={isSaving}
                  className="sr-only"
                />
                Has IEP
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex gap-3">
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
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditableStudentProfileModal;
