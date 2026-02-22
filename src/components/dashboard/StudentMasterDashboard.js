import React, { useEffect, useState } from 'react';
import { cosmosService } from '../../services/cosmosService';
import IntakeForm from './IntakeForm';
import { FileText, ClipboardList, Target, Telescope, Bird, Leaf, Flame, Droplets, X, Users, ChevronRight, Plus, StickyNote } from 'lucide-react';

const UNIT_CONFIG = [
  { key: "Determination", label: "Determination", icon: Target },
  { key: "Discovery", label: "Discovery", icon: Telescope },
  { key: "Freedom", label: "Freedom", icon: Bird },
  { key: "Harmony", label: "Harmony", icon: Leaf },
  { key: "Integrity", label: "Integrity", icon: Flame },
  { key: "Serenity", label: "Serenity", icon: Droplets }
];

// --- DATA GENERATOR (Creates 108 Fictional Students) ---
const generateMockRoster = () => {
  const students = [];
  const units = UNIT_CONFIG.map(u => u.key);
  const firstNames = ["Aiden", "Bella", "Caleb", "Daisy", "Ethan", "Fiona", "Gavin", "Hazel", "Isaac", "Jenna", "Kyle", "Luna", "Mason", "Nora", "Owen", "Piper", "Quinn", "Ryan", "Stella", "Tyler", "Violet", "Wyatt", "Xander", "Yara", "Zoe"];
  const lastNames = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson"];
  
  let idCounter = 1;

  units.forEach(unit => {
    for (let i = 0; i < 18; i++) { // 18 Students per unit
      const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
      const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
      
      students.push({
        id: idCounter.toString(),
        studentName: `${randomFirst} ${randomLast}`,
        gradeLevel: Math.floor(Math.random() * 4) + 9, // 9-12
        unitName: unit,
        admitDate: "2023-09-01",
        district: "Local School District",
        iep: i % 3 === 0 ? "Yes" : "No", // Every 3rd student has IEP
        iepDueDate: i % 3 === 0 ? "2025-05-15" : null,
        preReadingGE: (Math.random() * 5 + 4).toFixed(1),
        postReadingGE: (Math.random() * 5 + 5).toFixed(1),
        preMathGE: (Math.random() * 5 + 4).toFixed(1),
        postMathGE: (Math.random() * 5 + 5).toFixed(1),
        preWritingGE: (Math.random() * 5 + 4).toFixed(1),
        postWritingGE: (Math.random() * 5 + 5).toFixed(1),
        mtpUpdates: [
            { date: "2024-02-15", text: "Student is showing improved focus during group therapy. Needs reminders to complete independent work.", author: "Staff" },
            { date: "2024-01-10", text: "Initial MTP goals established. Student is hesitant but cooperative.", author: "Staff" }
        ]
      });
      idCounter++;
    }
  });
  return students;
};

const MOCK_ROSTER = generateMockRoster();

// --- SKELETON LOADER ---
const SkeletonLoader = () => (
  <div className="w-full min-h-full p-8 box-border flex flex-col font-sans max-w-7xl mx-auto">
    <div className="flex justify-between items-center mb-5 shrink-0">
      <div>
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-2"></div>
        <div className="h-3 w-64 bg-slate-100 rounded animate-pulse"></div>
      </div>
      <div className="h-9 w-32 bg-slate-200 rounded-full animate-pulse"></div>
    </div>
    <div className="flex gap-2.5 mb-6">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="h-8 w-24 bg-slate-100 rounded-full animate-pulse"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-16">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm h-full min-h-[300px] flex flex-col">
          <div className="h-14 bg-slate-100 animate-pulse border-b border-slate-200"></div>
          <div className="p-0 flex-1">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="px-5 py-4 border-b border-slate-100 flex flex-col gap-2">
                <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const StudentMasterDashboard = ({ activeStudentName, setActiveStudent, setView }) => {
  const [profileData, setProfileData] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false); 
  const [filterUnit, setFilterUnit] = useState("All");
  const [editingStudent, setEditingStudent] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (activeStudentName) {
          let results = await cosmosService.searchStudents(activeStudentName);
          if (!results || results.length === 0) {
             results = MOCK_ROSTER.filter(s => s.studentName.toLowerCase().includes(activeStudentName.toLowerCase()));
          }
          setProfileData(results && results.length > 0 ? results[0] : null);
        } else {
          const all = await cosmosService.getAllItems();
          setRoster(all && all.length > 0 ? all : MOCK_ROSTER);
          setProfileData(null);
        }
      } catch (e) { 
          console.error(e); 
          setRoster(MOCK_ROSTER); 
      }
      setLoading(false);
    };
    loadData();
  }, [activeStudentName]);

  const onAddStudent = async (data) => {
    if (!data.studentName) return alert("Student Name is required");
    const newStudent = { id: Date.now().toString(), ...data, preReadingGE: "", postReadingGE: "", preMathGE: "", postMathGE: "", preWritingGE: "", postWritingGE: "" };
    setRoster([...roster, newStudent]);
    setShowAddForm(false);
    alert(`✅ Added ${data.studentName} to ${data.unitName}`);
  };

  const handleUpdateStudent = async (updatedData) => {
    setLoading(true);
    try {
        await cosmosService.updateItem(updatedData.id, updatedData);
        setRoster(prev => prev.map(s => s.id === updatedData.id ? updatedData : s));
        setEditingStudent(null);
    } catch (error) {
        console.error("Update failed", error);
        alert("Failed to update student record.");
    }
    setLoading(false);
  };

  const getDaysInProgram = (admit) => {
    if (!admit) return "N/A";
    const start = new Date(admit);
    const end = new Date();
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  if (loading) return <SkeletonLoader />;

  if (!activeStudentName || !profileData) {
    return (
      <div className="w-full min-h-full p-8 box-border flex flex-col font-sans max-w-7xl mx-auto relative">
        <div className="flex justify-between items-center mb-5 shrink-0">
            <div>
                <h2 className="m-0 text-slate-800 text-2xl font-extrabold tracking-tight flex items-center gap-3">
                    Resident Roster
                    <span className="bg-slate-200 text-slate-700 text-sm px-3 py-1 rounded-full border border-slate-300 font-bold">
                        {roster.length} Students
                    </span>
                    <span className="bg-amber-100 text-amber-700 text-sm px-3 py-1 rounded-full border border-amber-200 font-bold">
                        {roster.filter(s => s.iep === "Yes").length} IEPs
                    </span>
                </h2>
                <p className="m-1 text-slate-500 text-sm">Manage active students and unit assignments.</p>
            </div>
            <button 
                onClick={() => setShowAddForm(!showAddForm)} 
                className={`px-5 py-2.5 rounded-full font-semibold text-sm cursor-pointer transition-all flex items-center gap-2 ${showAddForm ? 'bg-slate-200 text-slate-800' : 'bg-teal-600 text-white shadow-md hover:bg-teal-700'}`}
            >
                {showAddForm ? <X size={16}/> : <Plus size={16}/>}
                {showAddForm ? "Cancel" : "Add Resident"}
            </button>
        </div>

        <div className="flex gap-2 mb-0 overflow-x-auto pb-2 scrollbar-hide">
            <button 
                onClick={() => setFilterUnit("All")}
                className={`px-6 py-3 rounded-t-lg font-bold text-sm transition-all flex items-center gap-2 border-t border-x ${filterUnit === "All" ? 'bg-white border-slate-200 text-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 relative top-[1px]' : 'bg-slate-100 border-transparent text-slate-500 hover:bg-slate-200 hover:text-slate-600'}`}
            >
                <Users className="w-4 h-4" /> Master List
            </button>
            {UNIT_CONFIG.map(u => (
                <button 
                    key={u.key} 
                    onClick={() => setFilterUnit(u.key)}
                    className={`px-6 py-3 rounded-t-lg font-bold text-sm transition-all flex items-center gap-2 border-t border-x ${filterUnit === u.key ? 'bg-white border-slate-200 text-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 relative top-[1px]' : 'bg-slate-100 border-transparent text-slate-500 hover:bg-slate-200 hover:text-slate-600'}`}
                >
                    <u.icon className={`w-4 h-4 ${filterUnit === u.key ? 'text-teal-600' : ''}`} /> {u.label}
                </button>
            ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-b-xl rounded-tr-xl shadow-md min-h-[500px] p-6 relative z-0">
            {showAddForm && <IntakeForm onSave={onAddStudent} units={UNIT_CONFIG} />}
            {filterUnit === "All" && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="p-3">Student Name</th>
                                <th className="p-3">Unit</th>
                                <th className="p-3">Grade</th>
                                <th className="p-3">District</th>
                                <th className="p-3 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {roster.map(s => (
                                <tr key={s.id} onClick={() => setEditingStudent(s)} className={`cursor-pointer transition-colors group border-l-4 border-transparent hover:bg-slate-50 hover:border-teal-500`}>
                                    <td className="p-3 font-bold text-slate-700 group-hover:text-teal-600">{s.studentName}</td>
                                    <td className="p-3 text-sm text-slate-500"><span className={`px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600`}>{s.unitName}</span></td>
                                    <td className="p-3 text-sm text-slate-500">{s.gradeLevel}th</td>
                                    <td className="p-3 text-sm text-slate-500">{s.district || "-"}</td>
                                    <td className="p-3 text-right">
                                        {s.iep === "Yes" && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold border border-amber-200">IEP</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {filterUnit !== "All" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {roster.filter(s => s.unitName === filterUnit).length === 0 ? (
                        <div className="col-span-full text-center py-20 text-slate-400 italic">No students assigned to this unit.</div>
                    ) : (
                        roster.filter(s => s.unitName === filterUnit).map(s => (
                            <div 
                                key={s.id} 
                                onClick={() => setEditingStudent(s)}
                                className={`p-4 border border-slate-200 rounded-xl shadow-sm bg-white cursor-pointer transition-all group flex flex-col gap-2 hover:shadow-md hover:border-teal-500`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="font-bold text-slate-700 text-lg group-hover:text-teal-600">{s.studentName}</div>
                                    {s.iep === "Yes" && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-200 font-bold">IEP</span>}
                                </div>
                                <div className="text-xs text-slate-500 font-medium flex justify-between items-center mt-auto">
                                    <span>Grade {s.gradeLevel}</span>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>

        {editingStudent && <EditStudentModal student={editingStudent} onClose={() => setEditingStudent(null)} onSave={handleUpdateStudent} />}
      </div>
    );
  }

  // --- VIEW C: STUDENT PROFILE ---
  return (
    <div className="w-full min-h-full p-8 box-border flex flex-col font-sans max-w-7xl mx-auto">
        <div className="bg-white p-8 rounded-xl flex items-center gap-8 border border-slate-200 mb-8 shadow-md">
            <div className="w-20 h-20 rounded-full bg-slate-200 text-slate-600 flex justify-center items-center text-3xl font-bold">
                {profileData.studentName.charAt(0)}
            </div>
            <div className="flex-1">
                <h1 className="m-0 text-slate-800 text-3xl font-extrabold">{profileData.studentName}</h1>
                <div className="flex gap-2.5 mt-3 flex-wrap">
                    <div className="bg-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-700 border border-slate-300">Unit: <strong>{profileData.unitName}</strong></div>
                    <div className="bg-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-700 border border-slate-300">Grade: <strong>{profileData.gradeLevel}</strong></div>
                    <div className="bg-amber-100 px-3 py-1.5 rounded-lg text-xs text-amber-700 border border-amber-200">IEP: <strong>{profileData.iep || "No"}</strong></div>
                    <div className="bg-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-700 border border-slate-300">District: <strong>{profileData.district || "N/A"}</strong></div>
                </div>
            </div>
            <div className="bg-slate-100 p-4 rounded-xl text-center min-w-[120px]">
                <div className="text-xs uppercase font-bold text-slate-500 mb-1">Days in Care</div>
                <div className="text-3xl font-extrabold text-slate-700">{getDaysInProgram(profileData.admitDate)}</div>
            </div>
        </div>
        <div className="flex gap-8 flex-wrap">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-md flex flex-col flex-[2]">
                <div className="p-5 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center bg-slate-50">
                    Academic Progress (KTEA-III)
                    <button onClick={() => setView('ktea')} className="bg-white border border-slate-300 px-3 py-1.5 rounded-md cursor-pointer text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">Edit Data</button>
                </div>
                <div className="p-6">
                    <ScoreBar label="Reading" pre={profileData.preReadingGE} post={profileData.postReadingGE} color="#475569" />
                    <ScoreBar label="Math" pre={profileData.preMathGE} post={profileData.postMathGE} color="#0d9488" />
                    <ScoreBar label="Writing" pre={profileData.preWritingGE} post={profileData.postWritingGE} color="#d97706" />
                </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-md flex flex-col flex-1 h-fit">
                <div className="p-5 border-b border-slate-200 font-bold text-slate-700 bg-slate-50">Quick Actions</div>
                <div className="p-5 flex flex-col gap-3">
                    <button onClick={() => setView('discharge')} className="w-full flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer transition-all hover:shadow-md hover:border-teal-300 group">
                        <div className="text-xl bg-teal-50 w-10 h-10 flex items-center justify-center rounded-lg text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors"><FileText className="w-5 h-5" /></div>
                        <div className="text-left">
                            <div className="font-bold text-slate-700 text-sm">Discharge Letter</div>
                            <div className="text-xs text-slate-500">Generate PDF Report</div>
                        </div>
                    </button>
                    <button onClick={() => setView('ktea')} className="w-full flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer transition-all hover:shadow-md hover:border-teal-300 group">
                        <div className="text-xl bg-teal-50 w-10 h-10 flex items-center justify-center rounded-lg text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors"><ClipboardList className="w-5 h-5" /></div>
                        <div className="text-left">
                            <div className="font-bold text-slate-700 text-sm">KTEA Assessment</div>
                            <div className="text-xs text-slate-500">Input Test Scores</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

const ScoreBar = ({ label, pre, post, color }) => {
    const p1 = parseFloat(pre) || 0;
    const p2 = parseFloat(post) || 0;
    const w1 = Math.min((p1 / 13) * 100, 100);
    const w2 = Math.min((p2 / 13) * 100, 100);
    return (
        <div className="mb-6">
            <div className="flex justify-between text-sm font-bold mb-2 text-slate-600">
                <span>{label}</span>
                <span className={`text-xs ${p2 - p1 > 0 ? "text-green-600" : "text-slate-500"}`}>Growth: {((p2 - p1) > 0 ? "+" : "") + (p2 - p1).toFixed(1)} GE</span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full rounded-full opacity-40 transition-all duration-500" style={{ width: `${w2}%`, background: color }}></div>
                <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-500" style={{ width: `${w1}%`, background: color }}></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-slate-500 font-medium">
                <span>Pre: {pre}</span><span>Post: {post}</span>
            </div>
        </div>
    )
}

const EditStudentModal = ({ student, onClose, onSave }) => {
    const [formData, setFormData] = useState({ ...student, mtpUpdates: student.mtpUpdates || [] });
    const [newNote, setNewNote] = useState("");

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (checked ? "Yes" : "No") : value }));
    };

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        const note = { date: new Date().toISOString().split('T')[0], text: newNote, author: "Staff" };
        setFormData(prev => ({ ...prev, mtpUpdates: [note, ...prev.mtpUpdates] }));
        setNewNote("");
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] border border-slate-200">
                
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">Edit Student Details</h3>
                        <button onClick={onClose} className="text-slate-500 hover:text-slate-700 hover:bg-slate-200 p-1 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                    
                    <div className="p-6 space-y-4 overflow-y-auto flex-1">
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-1">Student Name</label>
                            <input name="studentName" value={formData.studentName} onChange={handleChange} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-bold text-slate-700" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Grade Level</label>
                                <select name="gradeLevel" value={formData.gradeLevel} onChange={handleChange} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white text-slate-700">
                                    {[9, 10, 11, 12].map(g => <option key={g} value={g}>{g}th Grade</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Unit Assignment</label>
                                <select name="unitName" value={formData.unitName} onChange={handleChange} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white text-slate-700">
                                    {UNIT_CONFIG.map(u => <option key={u.key} value={u.key}>{u.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-1">Local School District</label>
                            <input name="district" value={formData.district || ""} onChange={handleChange} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-700" placeholder="e.g. Springfield Public Schools" />
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
                            <input type="checkbox" name="iep" checked={formData.iep === "Yes"} onChange={handleChange} className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500" />
                            <label className="text-sm font-bold text-slate-700">Student has an Active IEP</label>
                        </div>
                    </div>

                    <div className="p-5 border-t border-slate-200 flex gap-3 bg-slate-50">
                        <button onClick={onClose} className="flex-1 py-2.5 text-slate-600 font-bold bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors">Cancel</button>
                        <button onClick={() => onSave(formData)} className="flex-1 py-2.5 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors shadow-md">Save Changes</button>
                    </div>
                </div>
                
                <div className={`w-full md:w-[400px] bg-slate-100 flex flex-col border-l border-slate-200 shadow-inner relative`}>
                    <div className={`h-12 bg-slate-200 flex items-center justify-between px-4 shrink-0 border-b border-slate-300`}>
                        <div className={`font-bold text-slate-600 flex items-center gap-2 text-sm`}>
                            <StickyNote className="w-4 h-4" /> MTP Updates
                        </div>
                        <button onClick={handleAddNote} className={`p-1 hover:bg-slate-300 rounded transition-colors text-slate-600`}>
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans">
                        <div className="bg-white rounded-lg p-3 shadow-sm focus-within:shadow-md transition-all">
                            <textarea 
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Type a new update..." 
                                className="w-full bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400 resize-none min-h-[60px]"
                            />
                            <div className="text-xs text-slate-400 text-right mt-1">Press + to add</div>
                        </div>

                        {formData.mtpUpdates.map((note, idx) => (
                            <div key={idx} className={`bg-white p-3 rounded-lg shadow-sm border border-slate-200 animate-in slide-in-from-top-2 duration-300`}>
                                <div className={`text-xs font-bold text-slate-500 mb-1 flex justify-between`}>
                                    <span>{note.date}</span>
                                    <span className="opacity-70">{note.author}</span>
                                </div>
                                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                            </div>
                        ))}
                        
                        {formData.mtpUpdates.length === 0 && (
                            <div className={`text-center text-slate-400 text-sm italic mt-10`}>No updates recorded yet.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentMasterDashboard;