import React, { useState } from 'react';

// --- CONFIGURATION ---
const UNITS = [
  { id: 'determination', label: 'Determination', color: 'bg-red-500',   text: 'text-red-600',   border: 'border-red-200',   hover: 'hover:bg-red-50' },
  { id: 'discovery',     label: 'Discovery',     color: 'bg-purple-500',text: 'text-purple-600',border: 'border-purple-200',hover: 'hover:bg-purple-50' },
  { id: 'freedom',       label: 'Freedom',       color: 'bg-green-500', text: 'text-green-600', border: 'border-green-200', hover: 'hover:bg-green-50' },
  { id: 'harmony',       label: 'Harmony',       color: 'bg-teal-500',   text: 'text-teal-600',   border: 'border-teal-200',   hover: 'hover:bg-teal-50' },
  { id: 'integrity',     label: 'Integrity',     color: 'bg-orange-500',text: 'text-orange-600',border: 'border-orange-200',hover: 'hover:bg-orange-50' },
  { id: 'serenity',      label: 'Serenity',      color: 'bg-cyan-500',   text: 'text-cyan-600',   border: 'border-cyan-200',   hover: 'hover:bg-cyan-50' },
];

// Initial Data (Simulating a database fetch)
const INITIAL_DATA = [
  { id: 1, name: 'Nora Taylor',  grade: '10', district: 'Local School District', unitId: 'determination', iep: true },
  { id: 2, name: 'Stella Thomas',grade: '12', district: 'Local School District', unitId: 'determination', iep: false },
  { id: 3, name: 'Fiona Thomas', grade: '11', district: 'Local School District', unitId: 'discovery',     iep: true },
];

export default function ResidentRoster() {
  // --- STATE MANAGEMENT ---
  const [students, setStudents] = useState(INITIAL_DATA); // Now editable!
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

    // Create new record (In the future, this is where we send to Cosmos DB)
    const record = {
      id: Date.now(), // temporary random ID
      unitId: activeUnitId, // Auto-assign to current unit
      ...newStudent
    };

    setStudents([...students, record]); // Update UI instantly
    setIsModalOpen(false); // Close modal
    setNewStudent({ name: '', grade: '9', district: '', iep: false }); // Reset form
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans relative">
      
      {/* --- LEFT RAIL --- */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">Resident Roster</h2>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">Select Unit</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {UNITS.map((unit) => {
            const isActive = activeUnitId === unit.id;
            const count = students.filter(s => s.unitId === unit.id).length;
            return (
              <button
                key={unit.id}
                onClick={() => setActiveUnitId(unit.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-gray-900 text-white shadow-md transform scale-[1.02]' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${unit.color} ${isActive ? 'ring-2 ring-white' : ''}`} />
                  <span className={`font-semibold ${isActive ? 'text-white' : 'text-gray-700'}`}>{unit.label}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* --- RIGHT CONTENT --- */}
      <main className="flex-1 flex flex-col h-full relative z-0">
        <header className="bg-white p-8 border-b border-gray-100 flex justify-between items-center shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${activeUnit.color} bg-opacity-10 ${activeUnit.text}`}>Current Unit</span>
              <span className="text-gray-500 text-sm font-medium">Academic Year 2023-2024</span>
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{activeUnit.label}</h1>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-transform active:scale-95"
          >
            <span>+ Add Resident</span>
          </button>
        </header>

        <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
            {roster.length === 0 ? (
              <div className="p-12 text-center text-gray-400 mt-10">
                <div className="mb-4 text-5xl">📭</div>
                <p className="text-lg font-medium">No residents assigned to {activeUnit.label} yet.</p>
                <button onClick={() => setIsModalOpen(true)} className="text-blue-600 font-bold mt-2 hover:underline">Add the first one?</button>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Student Name</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Grade</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">District</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {roster.map((student) => (
                    <tr key={student.id} className="hover:bg-blue-50/50 transition-colors group cursor-pointer">
                      <td className="py-4 px-6 font-bold text-gray-800">{student.name}</td>
                      <td className="py-4 px-6"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm font-bold">{student.grade}th</span></td>
                      <td className="py-4 px-6 text-gray-600 font-medium">{student.district}</td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 1. The Backdrop (Blur) */}
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsModalOpen(false)}
          />

          {/* 2. The Modal Box */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden transform transition-all scale-100">
            {/* Header */}
            <div className={`p-6 ${activeUnit.color} text-white`}>
              <h3 className="text-2xl font-bold">Add to {activeUnit.label}</h3>
              <p className="text-white/80 text-sm">Enter new resident details below.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Student Name</label>
                <input 
                  autoFocus
                  type="text" 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="e.g. Jordan Smith"
                  value={newStudent.name}
                  onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Grade Level</label>
                  <select 
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white"
                    value={newStudent.grade}
                    onChange={e => setNewStudent({...newStudent, grade: e.target.value})}
                  >
                    {[9, 10, 11, 12].map(g => <option key={g} value={g}>{g}th Grade</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">IEP Status</label>
                  <div 
                    onClick={() => setNewStudent({...newStudent, iep: !newStudent.iep})}
                    className={`cursor-pointer w-full p-3 border rounded-lg flex items-center justify-center font-bold transition-colors ${newStudent.iep ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                  >
                    {newStudent.iep ? 'Has IEP' : 'No IEP'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Home District</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Lakeland Regional"
                  value={newStudent.district}
                  onChange={e => setNewStudent({...newStudent, district: e.target.value})}
                />
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-lg font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={`flex-1 py-3 px-4 rounded-lg font-bold text-white shadow-lg transition transform active:scale-95 ${activeUnit.color.replace('bg-', 'bg-')}`} // Uses unit color
                  style={{filter: 'brightness(0.9)'}} // slight darken for button contrast
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