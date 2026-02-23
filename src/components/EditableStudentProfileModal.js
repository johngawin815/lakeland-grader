import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Loader2 } from 'lucide-react';
import { databaseService } from '../services/databaseService';

/**
 * EditableStudentProfileModal
 * Provides a secure, form-based interface for editing student data.
 * @param {Object} studentData - The student object with id, studentName, gradeLevel, unitName, admitDate, iep
 * @param {Function} onClose - Callback to close the modal
 * @param {Object} user - Current user object for audit logging
 */
const EditableStudentProfileModal = ({ studentData, onClose, user }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
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

  const UNIT_OPTIONS = [
    { key: 'Determination', label: 'Determination' },
    { key: 'Discovery', label: 'Discovery' },
    { key: 'Freedom', label: 'Freedom' },
    { key: 'Harmony', label: 'Harmony' },
    { key: 'Integrity', label: 'Integrity' },
    { key: 'Serenity', label: 'Serenity' },
  ];

  const onSubmit = async (formData) => {
    setIsSaving(true);
    setError('');
    setSuccess(false);

    try {
      // Input validation
      if (!formData.gradeLevel || !formData.unitName || !formData.admitDate) {
        throw new Error('All fields are required.');
      }

      // Sanitize and prepare data
      const updatePayload = {
        id: studentData.id,
        studentName: studentData.studentName,
        gradeLevel: parseInt(formData.gradeLevel, 10),
        unitName: formData.unitName,
        admitDate: formData.admitDate,
        iep: formData.iepStatus === 'yes' ? 'Yes' : 'No',
        lastModified: new Date().toISOString(),
      };

      // Update student in Azure Cosmos DB
      await databaseService.upsertStudent(updatePayload);

      // Log the audit action
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
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-2xl shadow-slate-900/10 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Edit Student Profile</h3>
            <p className="text-sm text-slate-500 mt-1">{studentData.studentName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          
          {/* Error Message */}
          {saveError && (
            <div className="p-3.5 bg-red-50 border border-red-200/80 rounded-xl text-red-700 text-sm font-bold flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <span>{saveError}</span>
            </div>
          )}

          {/* Success Message */}
          {saveSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-700 text-sm font-bold flex items-center gap-2">
              <span>✓</span>
              <span>Changes saved successfully!</span>
            </div>
          )}

          {/* Grade Level */}
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
              Grade Level
            </label>
            <select
              {...register('gradeLevel', { required: 'Grade level is required' })}
              className="w-full p-3.5 rounded-xl border border-slate-300/80 text-base focus:ring-4 focus:ring-indigo-500/20 bg-white outline-none transition-all disabled:opacity-50"
              disabled={isSaving}
            >
              <option value="">Select Grade</option>
              <option value="9">9th Grade</option>
              <option value="10">10th Grade</option>
              <option value="11">11th Grade</option>
              <option value="12">12th Grade</option>
            </select>
            {errors.gradeLevel && (
              <p className="text-xs text-red-600 mt-1">{errors.gradeLevel.message}</p>
            )}
          </div>

          {/* Unit Name */}
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
              Unit Assignment
            </label>
            <select
              {...register('unitName', { required: 'Unit is required' })}
              className="w-full p-3.5 rounded-xl border border-slate-300/80 text-base focus:ring-4 focus:ring-indigo-500/20 bg-white outline-none transition-all disabled:opacity-50"
              disabled={isSaving}
            >
              <option value="">Select Unit</option>
              {UNIT_OPTIONS.map((unit) => (
                <option key={unit.key} value={unit.key}>
                  {unit.label}
                </option>
              ))}
            </select>
            {errors.unitName && (
              <p className="text-xs text-red-600 mt-1">{errors.unitName.message}</p>
            )}
          </div>

          {/* Admit Date */}
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
              Admit Date
            </label>
            <input
              type="date"
              {...register('admitDate', { required: 'Admit date is required' })}
              className="w-full p-3.5 rounded-xl border border-slate-300/80 text-base focus:ring-4 focus:ring-indigo-500/20 bg-white outline-none transition-all disabled:opacity-50"
              disabled={isSaving}
            />
            {errors.admitDate && (
              <p className="text-xs text-red-600 mt-1">{errors.admitDate.message}</p>
            )}
          </div>

          {/* IEP Status */}
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
              IEP Status
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 flex-1 cursor-pointer">
                <input
                  type="radio"
                  value="no"
                  {...register('iepStatus')}
                  disabled={isSaving}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-slate-700">No IEP</span>
              </label>
              <label className="flex items-center gap-2 flex-1 cursor-pointer">
                <input
                  type="radio"
                  value="yes"
                  {...register('iepStatus')}
                  disabled={isSaving}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-slate-700">Has IEP</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200/80 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 px-4 rounded-xl hover:bg-slate-200/80 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
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