import React, { useState } from 'react';
import { Plus, Check, BookOpen } from 'lucide-react';

// --- CONFIGURATION ---
// Removed color properties to align with the new design system.
const UNITS = [
  { id: 'determination', label: 'Determination' },
  { id: 'discovery',     label: 'Discovery'     },
  { id: 'freedom',       label: 'Freedom'       },
  { id: 'harmony',       label: 'Harmony'       },
  { id: 'integrity',     label: 'Integrity'     },
  { id: 'serenity',      label: 'Serenity'      },
];

// Initial Data (Simulating a database fetch)
const INITIAL_DATA = [
  { id: 1, name: 'Nora Taylor',  grade: '10', district: 'Local School District', unitId: 'determination', iep: true },
  { id: 2, name: 'Stella Thomas',grade: '12', district: 'Local School District', unitId: 'determination', iep: false },
  { id: 3, name: 'Fiona Thomas', grade: '11', district: 'Local School District', unitId: 'discovery',     iep: true },
];

export default function ResidentRoster() {
  // --- STATE MANAGEMENT ---
  const [students, setStudents] = useState(INITIAL_DATA);
  const [activeUnitId, setActiveUnitId] = useState('determination');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', grade: '9', district: '', iep: false });

  // derived state
  const activeUnit = UNITS.find(u => u.id === activeUnitId);
  const roster = students.filter(s => s.unitId === activeUnitId);

  // --- HANDLERS ---
  const handleSave = (e) => {
    e.preventDefault();
    if(!newStudent.name) return alert("Student Name is required");

    const record = {
      id: Date.now(),
      unitId: activeUnitId,
      ...newStudent
    };

    setStudents([...students, record]);
    setIsModalOpen(false);
    setNewStudent({ name: '', grade: '9', district: '', iep: false });
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans relative">
      
      {/* --- LEFT RAIL --- */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-lg z-10">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Resident Roster</h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Select Unit</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {UNITS.map((unit) => {
            const isActive = activeUnitId === unit.id;
            const count = students.filter(s => s.unitId === unit.id).length;
            return (
              <button
                key={unit.id}
                onClick={() => setActiveUnitId(unit.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 group ${isActive ? 'bg-teal-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-white' : 'bg-slate-400'}`} />
                  <span className={`font-semibold ${isActive ? 'text-white' : 'text-slate-700'}`}>{unit.label}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* --- RIGHT CONTENT --- */}
      <main className="flex-1 flex flex-col h-full relative z-0">
        <header className="bg-white p-8 border-b border-slate-200 flex justify-between items-center shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-teal-100 text-teal-700`}>Current Unit</span>
              <span className="text-slate-500 text-sm font-medium">Academic Year 2025-2026</span>
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{activeUnit.label}</h1>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 shadow-md transition-colors duration-200"
          >
            <Plus size={18} />
            <span>Add Resident</span>
          </button>
        </header>

        <div className="flex-1 p-8 overflow-y-auto bg-slate-100">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden min-h-[400px]">
            {roster.length === 0 ? (
              <div className="p-12 text-center text-slate-500 mt-10">
                <div className="mb-4 text-5xl">📭</div>
                <p className="text-lg font-medium">No residents assigned to {activeUnit.label} yet.</p>
                <button onClick={() => setIsModalOpen(true)} className="text-teal-600 font-bold mt-2 hover:underline">Add the first one?</button>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">Student Name</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">Grade</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">District</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roster.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                      <td className="py-4 px-6 font-bold text-slate-800">{student.name}</td>
                      <td className="py-4 px-6"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-sm font-bold">{student.grade}th</span></td>
                      <td className="py-4 px-6 text-slate-600 font-medium">{student.district}</td>
                      <td className="py-4 px-6 text-right">{student.iep && <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded border border-amber-200">IEP</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* --- MODAL (POPUP) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          {/* The Modal Box */}
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md relative z-10 overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-800">Add to {activeUnit.label}</h3>
              <p className="text-slate-500 text-sm">Enter new resident details below.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Student Name</label>
                <input 
                  autoFocus
                  type="text" 
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                  placeholder="e.g. Jordan Smith"
                  value={newStudent.name}
                  onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Grade Level</label>
                  <select 
                    className="w-full p-3 border border-slate-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-teal-500"
                    value={newStudent.grade}
                    onChange={e => setNewStudent({...newStudent, grade: e.target.value})}
                  >
                    {[9, 10, 11, 12].map(g => <option key={g} value={g}>{g}th Grade</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">IEP Status</label>
                  <div 
                    onClick={() => setNewStudent({...newStudent, iep: !newStudent.iep})}
                    className={`cursor-pointer w-full p-3 border rounded-lg flex items-center justify-center font-bold transition-colors ${newStudent.iep ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {newStudent.iep ? 'Has IEP' : 'No IEP'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Home District</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="e.g. Lakeland Regional"
                  value={newStudent.district}
                  onChange={e => setNewStudent({...newStudent, district: e.target.value})}
                />
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-lg font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md transition"
                >
                  Save Resident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}