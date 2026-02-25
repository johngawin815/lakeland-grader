import React, { useState } from 'react';
import { X, Save, BookOpen } from 'lucide-react';

const NewAssignmentModal = ({ isOpen, onClose, categories, onSave }) => {
  const [newAssignment, setNewAssignment] = useState({ name: '', categoryId: categories[0]?.id || 'hw', maxScore: 100 });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(newAssignment);
    setNewAssignment({ name: '', categoryId: categories[0]?.id || 'hw', maxScore: 100 });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl shadow-slate-900/10 w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-200/80 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <span className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600"><BookOpen className="w-6 h-6" /></span> New Assignment
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-200/50">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1.5">Name</label>
            <input type="text" required value={newAssignment.name} onChange={(e) => setNewAssignment({ ...newAssignment, name: e.target.value })} className="w-full p-3 rounded-xl border border-slate-300/80 focus:ring-4 focus:ring-indigo-500/20 outline-none text-base transition-all" placeholder="e.g. Chapter 5 Quiz" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1.5">Category</label>
              <select value={newAssignment.categoryId} onChange={(e) => setNewAssignment({ ...newAssignment, categoryId: e.target.value })} className="w-full p-3 rounded-xl border border-slate-300/80 focus:ring-4 focus:ring-indigo-500/20 outline-none bg-white text-base transition-all">
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1.5">Max Score</label>
              <input type="number" required min="1" value={newAssignment.maxScore} onChange={(e) => setNewAssignment({ ...newAssignment, maxScore: e.target.value })} className="w-full p-3 rounded-xl border border-slate-300/80 focus:ring-4 focus:ring-indigo-500/20 outline-none text-base transition-all" />
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="w-full bg-slate-100 text-slate-700 font-bold py-3 px-6 rounded-xl hover:bg-slate-200/80 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-colors duration-200 ease-in-out">Cancel</button>
            <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 ease-in-out flex items-center justify-center gap-2">
              <Save className="w-5 h-5" /> Save Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewAssignmentModal;
