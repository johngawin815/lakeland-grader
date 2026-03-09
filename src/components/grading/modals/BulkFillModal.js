import React, { useState } from 'react';
import { useAutoSave } from '../../../hooks/useAutoSave';
import { X, ArrowDown } from 'lucide-react';

const BulkFillModal = ({ isOpen, onClose, assignmentName, studentCount, onApply }) => {
  const [value, setValue] = useState('');
  // Auto-save integration
  const isDirty = value !== '';
  const autoSaveFn = async () => {
    // Optionally call onApply for auto-save
    if (onApply) onApply(value);
  };
  const { saveStatus, lastSavedAt } = useAutoSave(isDirty, autoSaveFn, { delay: 2500, enabled: true });

  // Auto-save status feedback
  const autoSaveStatus = (
    <>
      {saveStatus === 'saving' && <div className="p-2 bg-indigo-50 border border-indigo-200 rounded text-indigo-700 text-xs font-semibold flex items-center gap-1.5">Auto-saving...</div>}
      {saveStatus === 'saved' && lastSavedAt && <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-700 text-xs font-semibold flex items-center gap-1.5">Auto-saved {lastSavedAt.toLocaleTimeString()}</div>}
      {saveStatus === 'error' && <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs font-semibold">Auto-save failed</div>}
    </>
  );

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onApply(value);
    setValue('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl shadow-slate-900/10 w-full max-w-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200/80 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <span className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600"><ArrowDown className="w-6 h-6" /></span> Bulk Fill Grades
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-200/50">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <p className="text-sm text-slate-500 mb-4">
              This will overwrite grades for {studentCount} student{studentCount !== 1 ? 's' : ''} for <strong>{assignmentName}</strong>.
            </p>
            <label className="block text-sm font-bold text-slate-600 mb-1.5">Grade to Apply</label>
            <input type="number" autoFocus value={value} onChange={(e) => setValue(e.target.value)} className="w-full p-3 rounded-xl border border-slate-300/80 focus:ring-4 focus:ring-indigo-500/20 outline-none text-base transition-all" placeholder="e.g. 100" />
          </div>
          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="w-full bg-slate-100 text-slate-700 font-bold py-3 px-6 rounded-xl hover:bg-slate-200/80 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-colors">Cancel</button>
            <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all">Apply</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkFillModal;
