import React, { useState, useEffect } from 'react';
import { useAutoSave } from '../../../hooks/useAutoSave';
import { X, Plus, Trash2, Percent } from 'lucide-react';

const WeightSettingsModal = ({ isOpen, onClose, categories, onSave }) => {
  const [editingCategories, setEditingCategories] = useState([]);
  // Auto-save integration
  const isDirty = editingCategories.some((cat, idx) => {
    return categories[idx]?.id !== cat.id || categories[idx]?.name !== cat.name || categories[idx]?.weight !== cat.weight;
  });
  const autoSaveFn = async () => {
    if (onSave) onSave(editingCategories);
  };
  useAutoSave(isDirty, autoSaveFn, { delay: 2500, enabled: true });


  useEffect(() => {
    if (isOpen) {
      setEditingCategories(JSON.parse(JSON.stringify(categories)));
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editingCategories);
    onClose();
  };

  const handleAddCategory = () => {
    setEditingCategories([...editingCategories, { id: `cat-${Date.now()}`, name: 'New Category', weight: 0 }]);
  };

  const handleDeleteCategory = (catId) => {
    if (editingCategories.length <= 1) return alert("You must have at least one category.");
    setEditingCategories(editingCategories.filter(c => c.id !== catId));
  };

  const totalWeight = editingCategories.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl shadow-slate-900/10 w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-200/80 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <span className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600"><Percent className="w-6 h-6" /></span> Category Weights
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-200/50">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-3">
            {editingCategories.map((cat, index) => (
              <div key={cat.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Category Name</label>
                  <input type="text" value={cat.name} onChange={(e) => {
                    const newCats = [...editingCategories];
                    newCats[index].name = e.target.value;
                    setEditingCategories(newCats);
                  }} className="w-full p-2.5 rounded-lg border border-slate-300/80 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-bold text-slate-700" />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Weight (%)</label>
                  <input type="number" min="0" max="100" value={cat.weight} onChange={(e) => {
                    const newCats = [...editingCategories];
                    newCats[index].weight = parseFloat(e.target.value) || 0;
                    setEditingCategories(newCats);
                  }} className="w-full p-2.5 rounded-lg border border-slate-300/80 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-bold text-slate-700 text-center" />
                </div>
                <button type="button" onClick={() => handleDeleteCategory(cat.id)} className="mt-6 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Remove Category">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={handleAddCategory} className="w-full py-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>
          <div className="pt-4 border-t border-slate-200/80 flex justify-between items-center">
            <div className="text-sm font-bold text-slate-600">Total: <span className={`${totalWeight === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>{totalWeight}%</span></div>
            <button type="submit" className="bg-indigo-600 text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all">Save Weights</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WeightSettingsModal;
