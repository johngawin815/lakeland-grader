import React, { useState, useEffect } from 'react';
import { X, Save, MessageSquare } from 'lucide-react';

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {string} props.studentName
 * @param {string} props.assignmentName
 * @param {string} props.initialNote
 * @param {function} props.onSave
 */
const GradeNoteModal = ({ isOpen, onClose, studentName, assignmentName, initialNote = '', onSave }) => {
  const [note, setNote] = useState(initialNote);

  useEffect(() => {
    if (isOpen) {
      setNote(initialNote || '');
    }
  }, [isOpen, initialNote]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(note);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Grade Note</h3>
              <p className="text-xs text-slate-500 font-medium">{studentName} • {assignmentName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">Short Note / Comment</label>
            <textarea
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-4 rounded-xl border border-slate-300 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-base transition-all min-h-[120px] resize-none"
              placeholder="e.g., Late submission, corrected after review..."
              maxLength={200}
            />
            <div className="flex justify-between mt-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Max 200 characters</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{note.length}/200</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" /> Save Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GradeNoteModal;
