import React, { useEffect, useState } from 'react';
import { cosmosService } from '../../services/cosmosService';
import IntakeForm from './IntakeForm';
import { FileText, ClipboardList, Target, Telescope, Bird, Leaf, Flame, Droplets, X, Users, ChevronRight, Plus, StickyNote, Archive } from 'lucide-react';

const UNIT_CONFIG = [
  { key: "Determination", label: "Determination", icon: Target, color: "text-purple-500", badge: "bg-purple-100 text-purple-800", border: "border-purple-200 hover:border-purple-400" },
  { key: "Discovery", label: "Discovery", icon: Telescope, color: "text-yellow-500", badge: "bg-yellow-100 text-yellow-800", border: "border-yellow-200 hover:border-yellow-400" },
  { key: "Freedom", label: "Freedom", icon: Bird, color: "text-sky-500", badge: "bg-sky-100 text-sky-800", border: "border-sky-200 hover:border-sky-400" },
  { key: "Harmony", label: "Harmony", icon: Leaf, color: "text-green-500", badge: "bg-green-100 text-green-800", border: "border-green-200 hover:border-green-400" },
  { key: "Integrity", label: "Integrity", icon: Flame, color: "text-orange-500", badge: "bg-orange-100 text-orange-800", border: "border-orange-200 hover:border-orange-400" },
  { key: "Serenity", label: "Serenity", icon: Droplets, color: "text-blue-500", badge: "bg-blue-100 text-blue-800", border: "border-blue-200 hover:border-blue-400" },
  { key: "Discharged", label: "Discharged Residents", icon: Archive, color: "text-slate-500", badge: "bg-slate-100 text-slate-600", border: "border-slate-200 hover:border-slate-400" }
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
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <div className="h-10 w-56 bg-slate-200 rounded-lg animate-pulse mb-2"></div>
          <div className="h-4 w-72 bg-slate-100 rounded animate-pulse"></div>
        </div>
        <div className="h-11 w-36 bg-slate-200 rounded-xl animate-pulse"></div>
      </div>
      <div className="flex gap-2 mb-0 border-b border-slate-200">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-12 w-32 bg-slate-100/80 rounded-t-lg animate-pulse"></div>
        ))}
      </div>
      <div className="bg-slate-50/50 rounded-b-2xl rounded-tr-2xl border border-slate-200/50 p-6 min-h-[500px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-white/80 rounded-xl border border-slate-200/50 p-4 flex flex-col justify-between animate-pulse">
                <div className="h-5 w-3/4 bg-slate-200 rounded"></div>
                <div className="h-3 w-1/2 bg-slate-100 rounded mt-2"></div>
              </div>
            ))}
          </div>
      </div>
    </div>
  );
  

const StudentMasterDashboard = ({ activeStudentName, setActiveStudent, setView }) => {
  const [profileData, setProfileData] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false); 
  const [filterUnit, setFilterUnit] = useState("All");
  const [filterIEP, setFilterIEP] = useState(false);
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

  const getEffectiveUnit = (s) => s.dischargeDate ? "Discharged" : s.unitName;

  if (loading) return <SkeletonLoader />;

  if (!activeStudentName || !profileData) {
    return (
      <div className="w-full min-h-full p-8 box-border flex flex-col font-sans max-w-7xl mx-auto relative">
        <div className="flex justify-between items-center mb-5 shrink-0">
            <div>
                <h2 className="m-0 text-slate-900 text-3xl font-extrabold tracking-tight flex items-center gap-3">
                    Resident Roster
                    <span className="bg-slate-200 text-slate-700 text-sm px-3 py-1.5 rounded-full font-bold">
                        {roster.length} Students
                    </span>
                    <button onClick={() => setFilterIEP(!filterIEP)} className={`text-sm px-3 py-1.5 rounded-full font-bold transition-all border ${filterIEP ? 'bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-500/20' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'}`}>
                        {roster.filter(s => s.iep === "Yes").length} IEPs
                        {filterIEP && <span className="ml-1.5 text-xs">▼</span>}
                    </button>
                </h2>
                <p className="m-1 text-slate-500 text-base">Manage active students and unit assignments.</p>
            </div>
            <button 
                onClick={() => setShowAddForm(!showAddForm)} 
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer transition-all flex items-center gap-2 ${showAddForm ? 'bg-slate-200 text-slate-800' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10 hover:bg-indigo-700'}`}
            >
                {showAddForm ? <X size={16}/> : <Plus size={16}/>}
                {showAddForm ? "Cancel" : "Add Resident"}
            </button>
        </div>

        <div className="flex gap-2 mb-0 overflow-x-auto pb-0 scrollbar-hide border-b border-slate-200/80">
            <button 
                onClick={() => setFilterUnit("All")}
                className={`px-6 py-3 rounded-t-lg font-bold text-sm transition-all flex items-center gap-2.5 border-b-2 ${filterUnit === "All" ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
                <Users className="w-5 h-5" /> Master List
            </button>
            {UNIT_CONFIG.map(u => (
                <button 
                    key={u.key} 
                    onClick={() => setFilterUnit(u.key)}
                    className={`px-6 py-3 rounded-t-lg font-bold text-sm transition-all flex items-center gap-2.5 border-b-2 ${filterUnit === u.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    <u.icon className={`w-5 h-5 ${filterUnit === u.key ? u.color : ''}`} /> {u.label}
                </button>
            ))}
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-b-2xl rounded-tr-2xl shadow-2xl shadow-slate-200/60 min-h-[500px] p-6 relative z-0">
            {showAddForm && <IntakeForm onSave={onAddStudent} units={UNIT_CONFIG} />}
            {!showAddForm && filterUnit === "All" && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100/80 backdrop-blur-sm border-b border-slate-200/50 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0">
                                <th className="p-4">Student Name</th>
                                <th className="p-4">Unit</th>
                                <th className="p-4">Grade</th>
                                <th className="p-4">District</th>
                                <th className="p-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/50">
                            {roster.filter(s => !filterIEP || s.iep === "Yes").map(s => (
                                {
                                    const effectiveUnit = getEffectiveUnit(s);
                                    return (
                                        <tr key={s.id} onClick={() => setEditingStudent(s)} className={`cursor-pointer transition-colors group border-l-4 border-transparent hover:bg-slate-100/50 hover:border-indigo-500`}>
                                            <td className="p-4 font-bold text-slate-700 group-hover:text-indigo-600">{s.studentName}</td>
                                            <td className="p-4 text-sm text-slate-500"><span className={`px-2.5 py-1 rounded-md text-xs font-bold ${UNIT_CONFIG.find(u => u.key === effectiveUnit)?.badge || 'bg-slate-100 text-slate-600'}`}>{effectiveUnit}</span></td>
                                            <td className="p-4 text-sm text-slate-500">{s.gradeLevel}th</td>
                                            <td className="p-4 text-sm text-slate-500">{s.district || "-"}</td>
                                            <td className="p-4 text-right">
                                                {s.iep === "Yes" && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-bold">IEP</span>}
                                            </td>
                                        </tr>
                                    );
                                }
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!showAddForm && filterUnit !== "All" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {roster.filter(s => getEffectiveUnit(s) === filterUnit && (!filterIEP || s.iep === "Yes")).length === 0 ? (
                        <div className="col-span-full text-center py-20 text-slate-400 italic">No students assigned to this unit{filterIEP ? " with an IEP" : ""}.</div>
                    ) : (
                        roster.filter(s => getEffectiveUnit(s) === filterUnit && (!filterIEP || s.iep === "Yes"))
                        .sort((a, b) => (parseInt(a.gradeLevel) || 0) - (parseInt(b.gradeLevel) || 0))
                        .map(s => {
                            const unitStyle = UNIT_CONFIG.find(u => u.key === getEffectiveUnit(s));
                            return (
                                <div 
                                    key={s.id} 
                                    onClick={() => setEditingStudent(s)}
                                    className={`p-4 border ${unitStyle?.border || 'border-slate-200/80 hover:border-indigo-400/50'} rounded-xl shadow-sm bg-white/80 cursor-pointer transition-all group flex flex-col gap-2 hover:shadow-xl hover:bg-white`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className={`font-bold text-lg group-hover:text-indigo-600 ${unitStyle?.color || 'text-slate-800'}`}>{s.studentName}</div>
                                        <div className="flex flex-col gap-1 items-end">
                                            {s.dischargeDate && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-bold uppercase tracking-wide">Discharged</span>}
                                            {s.iep === "Yes" && <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">IEP</span>}
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium flex justify-between items-center mt-auto">
                                        <span>Grade {s.gradeLevel}</span>
                                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                                    </div>
                                </div>
                            );
                        })
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
        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-2xl flex items-center gap-8 border border-slate-200/50 mb-8 shadow-2xl shadow-slate-200/60">
            <div className="w-24 h-24 rounded-full bg-indigo-100 text-indigo-600 flex justify-center items-center text-5xl font-bold border-4 border-white shadow-inner">
                {profileData.studentName.charAt(0)}
            </div>
            <div className="flex-1">
                <h1 className="m-0 text-slate-800 text-4xl font-extrabold">{profileData.studentName}</h1>
                <div className="flex gap-2.5 mt-4 flex-wrap">
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${UNIT_CONFIG.find(u => u.key === profileData.unitName)?.badge || 'bg-slate-200 text-slate-700'}`}>Unit: <strong>{profileData.unitName}</strong></div>
                    <div className="bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700">Grade: <strong>{profileData.gradeLevel}</strong></div>
                    <div className="bg-amber-100 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-800">IEP: <strong>{profileData.iep || "No"}</strong></div>
                    <div className="bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700">District: <strong>{profileData.district || "N/A"}</strong></div>
                </div>
            </div>
            <div className="bg-slate-100/80 p-5 rounded-2xl text-center min-w-[140px] border border-slate-200/50 shadow-xl shadow-slate-200/50">
                <div className="text-sm uppercase font-bold text-slate-500 mb-1">Days in Care</div>
                <div className="text-4xl font-extrabold text-indigo-600">{getDaysInProgram(profileData.admitDate)}</div>
            </div>
        </div>
        <div className="flex gap-8 flex-wrap">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 overflow-hidden shadow-2xl shadow-slate-200/60 flex flex-col flex-[2]">
                <div className="p-5 border-b border-slate-200/50 font-bold text-slate-700 flex justify-between items-center bg-slate-50/50">
                    Academic Progress (KTEA-III)
                    <button onClick={() => setView('ktea')} className="bg-white border border-slate-300/80 px-4 py-1.5 rounded-lg cursor-pointer text-xs font-bold text-slate-600 hover:bg-slate-100/50 hover:border-slate-400/50 transition-colors shadow-sm">Edit Data</button>
                </div>
                <div className="p-8">
                    <ScoreBar label="Reading" pre={profileData.preReadingGE} post={profileData.postReadingGE} color="bg-gradient-to-r from-sky-400 to-blue-500" />
                    <ScoreBar label="Math" pre={profileData.preMathGE} post={profileData.postMathGE} color="bg-gradient-to-r from-emerald-400 to-teal-500" />
                    <ScoreBar label="Writing" pre={profileData.preWritingGE} post={profileData.postWritingGE} color="bg-gradient-to-r from-amber-400 to-orange-500" />
                </div>
            </div>
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 overflow-hidden shadow-2xl shadow-slate-200/60 flex flex-col flex-1 h-fit">
                <div className="p-5 border-b border-slate-200/50 font-bold text-slate-700 bg-slate-50/50">Quick Actions</div>
                <div className="p-5 flex flex-col gap-3">
                    <button onClick={() => setView('discharge')} className="w-full flex items-center gap-4 p-4 bg-white/80 border border-slate-200/80 rounded-xl cursor-pointer transition-all hover:shadow-xl hover:border-indigo-400/50 hover:bg-white group">
                        <div className="text-xl bg-indigo-100 w-12 h-12 flex items-center justify-center rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300"><FileText className="w-6 h-6" /></div>
                        <div className="text-left">
                            <div className="font-bold text-slate-700 text-base">Discharge Letter</div>
                            <div className="text-sm text-slate-500">Generate PDF Report</div>
                        </div>
                    </button>
                    <button onClick={() => setView('ktea')} className="w-full flex items-center gap-4 p-4 bg-white/80 border border-slate-200/80 rounded-xl cursor-pointer transition-all hover:shadow-xl hover:border-indigo-400/50 hover:bg-white group">
                        <div className="text-xl bg-indigo-100 w-12 h-12 flex items-center justify-center rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300"><ClipboardList className="w-6 h-6" /></div>
                        <div className="text-left">
                            <div className="font-bold text-slate-700 text-base">KTEA Assessment</div>
                            <div className="text-sm text-slate-500">Input Test Scores</div>
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
    const growth = p2 - p1;
    const w1 = Math.min((p1 / 13) * 100, 100);
    const w2 = Math.min((p2 / 13) * 100, 100);
    
    const growthColor = growth > 0 ? "text-green-600" : "text-slate-500";
    const growthSign = growth > 0 ? "+" : "";

    return (
        <div className="mb-8">
            <div className="flex justify-between text-sm font-bold mb-2 text-slate-600">
                <span>{label}</span>
                <span className={`text-xs font-mono ${growthColor}`}>Growth: {growthSign}{(growth).toFixed(1)} GE</span>
            </div>
            <div className="h-4 bg-slate-200/70 rounded-full relative overflow-hidden border border-slate-200">
                <div className={`absolute left-0 top-0 h-full rounded-full opacity-40 transition-all duration-500 ${color}`} style={{ width: `${w2}%` }}></div>
                <div className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${w1}%` }}></div>
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-slate-500 font-medium">
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
    
    const handleSave = () => {
        if (formData.dischargeDate && !student.dischargeDate) {
            if (window.confirm(`Are you sure you want to discharge ${formData.studentName}? This will move them to the Discharged Residents list.`)) {
                onSave(formData);
            }
        } else {
            onSave(formData);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white/80 backdrop-blur-xl border-white/50 rounded-2xl shadow-2xl shadow-slate-900/10 w-full max-w-5xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
                
                <div className="flex-1 flex flex-col min-w-0 bg-white/90">
                    <div className="p-6 border-b border-slate-200/80 flex justify-between items-center">
                        <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
                            <span className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600"><ClipboardList className="w-6 h-6" /></span>
                            Edit Student Details
                        </h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-200/50"><X className="w-6 h-6" /></button>
                    </div>
                    
                    <div className="p-6 space-y-5 overflow-y-auto flex-1">
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-1.5">Student Name</label>
                            <input name="studentName" value={formData.studentName} onChange={handleChange} className="w-full p-3 border border-slate-300/80 rounded-xl focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold text-slate-800 text-lg transition-all" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1.5">Grade Level</label>
                                <select name="gradeLevel" value={formData.gradeLevel} onChange={handleChange} className="w-full p-3 border border-slate-300/80 rounded-xl focus:ring-4 focus:ring-indigo-500/20 outline-none bg-white text-slate-700 transition-all">
                                    {[9, 10, 11, 12].map(g => <option key={g} value={g}>{g}th Grade</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1.5">Unit Assignment</label>
                                <select name="unitName" value={formData.unitName} onChange={handleChange} className="w-full p-3 border border-slate-300/80 rounded-xl focus:ring-4 focus:ring-indigo-500/20 outline-none bg-white text-slate-700 transition-all">
                                    {UNIT_CONFIG.map(u => <option key={u.key} value={u.key}>{u.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1.5">Admit Date</label>
                                <input type="date" name="admitDate" value={formData.admitDate || ""} onChange={handleChange} className="w-full p-3 border border-slate-300/80 rounded-xl focus:ring-4 focus:ring-indigo-500/20 outline-none text-slate-700 transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1.5">Discharge Date</label>
                                <input type="date" name="dischargeDate" value={formData.dischargeDate || ""} onChange={handleChange} className="w-full p-3 border border-slate-300/80 rounded-xl focus:ring-4 focus:ring-indigo-500/20 outline-none text-slate-700 transition-all" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-1.5">Local School District</label>
                            <input name="district" value={formData.district || ""} onChange={handleChange} className="w-full p-3 border border-slate-300/80 rounded-xl focus:ring-4 focus:ring-indigo-500/20 outline-none text-slate-700 transition-all" placeholder="e.g. Springfield Public Schools" />
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-200/50">
                            <input type="checkbox" name="iep" checked={formData.iep === "Yes"} onChange={handleChange} className="w-5 h-5 text-indigo-600 rounded-md focus:ring-indigo-500/30" />
                            <label className="text-sm font-bold text-indigo-900">Student has an Active IEP</label>
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-200/80 flex gap-3 bg-slate-50/50">
                        <button onClick={onClose} className="w-full bg-slate-100 text-slate-700 font-bold py-3 px-6 rounded-xl hover:bg-slate-200/80 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-colors">Cancel</button>
                        <button onClick={handleSave} className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all">Save Changes</button>
                    </div>
                </div>
                
                <div className={`w-full md:w-[400px] bg-slate-100/70 flex flex-col border-l border-slate-200/50 shadow-inner`}>
                    <div className={`h-16 bg-slate-100/90 flex items-center justify-between px-4 shrink-0 border-b border-slate-200/80`}>
                        <div className={`font-bold text-slate-600 flex items-center gap-2 text-sm`}>
                            <StickyNote className="w-4 h-4" /> MTP Updates
                        </div>
                        <button onClick={handleAddNote} className={`p-1.5 hover:bg-slate-200/80 rounded-lg transition-colors text-slate-500 hover:text-slate-700`}>
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        <div className="bg-white rounded-xl p-3 shadow-sm focus-within:shadow-md transition-all border border-slate-200/80">
                            <textarea 
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Type a new update..." 
                                className="w-full bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400 resize-none min-h-[60px]"
                            />
                            <div className="text-xs text-slate-400 text-right mt-1">Press + to add note</div>
                        </div>

                        {formData.mtpUpdates.map((note, idx) => (
                            <div key={idx} className={`bg-white p-3.5 rounded-xl shadow-sm border border-slate-200/80 animate-in slide-in-from-top-2 duration-300`}>
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