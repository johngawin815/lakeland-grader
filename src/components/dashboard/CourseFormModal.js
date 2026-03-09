import React, { useState, useEffect } from 'react';
import { useAutoSave } from '../../hooks/useAutoSave';
import { X, BookOpen, Save, Loader2 } from 'lucide-react';
import { databaseService } from '../../services/databaseService';
import { getCurrentSchoolYear } from '../../utils/smartUtils';

const SUBJECT_AREAS = ['English', 'Math', 'Science', 'Social Studies', 'Elective'];

const CourseFormModal = ({ isOpen, onClose, course, user, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Track original data for dirtiness
  const [originalData, setOriginalData] = useState(null);

  const [formData, setFormData] = useState({
    courseName: '',
    subjectArea: '',
    credits: 5,
    term: getCurrentSchoolYear(),
  });

  useEffect(() => {
    if (course) {
      const data = {
        courseName: course.courseName || '',
        subjectArea: course.subjectArea || '',
        credits: course.credits || 5,
        term: course.term || getCurrentSchoolYear(),
      };
      setFormData(data);
      setOriginalData(data);
    } else {
      const data = {
        courseName: '',
        subjectArea: '',
        credits: 5,
        term: getCurrentSchoolYear(),
      };
      setFormData(data);
      setOriginalData(data);
    }
    setError('');
  }, [course, isOpen]);
  // Auto-save integration
  const isDirty = originalData && (
    formData.courseName !== originalData.courseName ||
    formData.subjectArea !== originalData.subjectArea ||
    formData.credits !== originalData.credits ||
    formData.term !== originalData.term
  );

  const autoSaveFn = async () => {
    setSaving(true);
    setError('');
    try {
      await databaseService.upsertCourse(formData);
      if (user) {
        await databaseService.logAudit(user, 'UpdateCourse', `Updated course ${formData.courseName}`);
      }
      setOriginalData({ ...formData });
    } catch (err) {
      setError(err.message || 'Failed to auto-save.');
    } finally {
      setSaving(false);
    }
  };

  const { saveStatus, lastSavedAt } = useAutoSave(isDirty, autoSaveFn, { delay: 2500, enabled: true });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'credits' ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.courseName.trim()) return setError('Course name is required.');
    if (!formData.subjectArea) return setError('Subject area is required.');

    setSaving(true);
    setError('');

    try {
      const payload = {
        ...formData,
        teacherName: user?.name || 'Unknown',
      };

      if (course) {
        await databaseService.updateCourse(course.id, { ...course, ...payload });
      } else {
        await databaseService.addCourse(payload);
      }

      databaseService.logAudit(user, course ? 'UpdateCourse' : 'CreateCourse', `${course ? 'Updated' : 'Created'} course: ${formData.courseName}`);

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving course:', err);
      setError('Failed to save course. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl shadow-slate-900/10 w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="p-6 border-b border-slate-200/80 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <span className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600"><BookOpen className="w-6 h-6" /></span>
            {course ? 'Edit Course' : 'Create Course'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-200/50">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Course Name</label>
            <input
              type="text"
              name="courseName"
              required
              value={formData.courseName}
              onChange={handleChange}
              className="w-full p-3 rounded-xl border border-slate-300/80 text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
              placeholder="e.g. English 9"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subject Area</label>
            <select
              name="subjectArea"
              required
              value={formData.subjectArea}
              onChange={handleChange}
              className="w-full p-3 rounded-xl border border-slate-300/80 text-sm bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
            >
              <option value="">-- Select Subject Area --</option>
              {SUBJECT_AREAS.map(sa => (
                <option key={sa} value={sa}>{sa}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1.5">
              This determines which slot this course fills on grade cards.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Credits</label>
              <input
                type="number"
                name="credits"
                min="0"
                max="10"
                step="any"
                value={formData.credits}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border border-slate-300/80 text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Term</label>
              <input
                type="text"
                name="term"
                value={formData.term}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border border-slate-300/80 text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
                placeholder="2025-2026"
              />
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200/60">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Teacher</div>
            <div className="text-sm font-bold text-slate-700">{user?.name || 'Unknown'}</div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-slate-100 text-slate-700 font-bold py-3 px-6 rounded-xl hover:bg-slate-200/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'Saving...' : (course ? 'Update Course' : 'Create Course')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseFormModal;
