import React, { useEffect, useState } from 'react';
import { cosmosService } from '../../services/cosmosService';
import IntakeForm from './IntakeForm';
import { FileText, ClipboardList, Target, Telescope, Bird, Leaf, Flame, Droplets, X } from 'lucide-react';

const UNIT_CONFIG = [
  { key: "Determination", label: "Determination", bg: "bg-gradient-to-br from-red-600 to-red-500", icon: Target },
  { key: "Discovery", label: "Discovery", bg: "bg-gradient-to-br from-indigo-500 to-purple-600", icon: Telescope },
  { key: "Freedom", label: "Freedom", bg: "bg-gradient-to-br from-teal-500 to-lime-500", icon: Bird },
  { key: "Harmony", label: "Harmony", bg: "bg-gradient-to-br from-emerald-600 to-green-400", icon: Leaf },
  { key: "Integrity", label: "Integrity", bg: "bg-gradient-to-br from-orange-400 to-red-400", icon: Flame },
  { key: "Serenity", label: "Serenity", bg: "bg-gradient-to-br from-sky-400 to-cyan-300", icon: Droplets }
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
        // Scores
        preReadingGE: (Math.random() * 5 + 4).toFixed(1),
        postReadingGE: (Math.random() * 5 + 5).toFixed(1),
        preMathGE: (Math.random() * 5 + 4).toFixed(1),
        postMathGE: (Math.random() * 5 + 5).toFixed(1),
        preWritingGE: (Math.random() * 5 + 4).toFixed(1),
        postWritingGE: (Math.random() * 5 + 5).toFixed(1)
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
        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm h-full min-h-[300px] flex flex-col">
          <div className="h-14 bg-slate-100 animate-pulse border-b border-slate-50"></div>
          <div className="p-0 flex-1">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="px-5 py-4 border-b border-gray-50 flex flex-col gap-2">
                <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-slate-50 rounded w-1/2 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const StudentMasterDashboard = ({ activeStudentName, setActiveStudent, setView }) => {
  // STATE
  const [profileData, setProfileData] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false); 
  const [filterUnit, setFilterUnit] = useState("All");
  const [editingStudent, setEditingStudent] = useState(null);

  // --- 1. DATA LOADING ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (activeStudentName) {
          // A. LOAD SINGLE PROFILE
          let results = await cosmosService.searchStudents(activeStudentName);
          if (!results || results.length === 0) {
             results = MOCK_ROSTER.filter(s => s.studentName.toLowerCase().includes(activeStudentName.toLowerCase()));
          }
          setProfileData(results && results.length > 0 ? results[0] : null);
        } else {
          // B. LOAD FULL ROSTER
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

  // --- 2. ADD STUDENT HANDLER ---
  const onAddStudent = async (data) => {
    if (!data.studentName) return alert("Student Name is required");

    const newStudent = {
        id: Date.now().toString(),
        ...data,
        preReadingGE: "", postReadingGE: "",
        preMathGE: "", postMathGE: "",
        preWritingGE: "", postWritingGE: ""
    };

    setRoster([...roster, newStudent]);
    setShowAddForm(false);
    alert(`✅ Added ${data.studentName} to ${data.unitName}`);
  };

  // --- 3. UPDATE STUDENT HANDLER ---
  const handleUpdateStudent = async (updatedData) => {
    setLoading(true);
    try {
        // 1. Update in Database
        await cosmosService.updateItem(updatedData.id, updatedData);

        // 2. Update Local State
        setRoster(prev => prev.map(s => s.id === updatedData.id ? updatedData : s));
        
        // 3. Close Modal
        setEditingStudent(null);
    } catch (error) {
        console.error("Update failed", error);
        alert("Failed to update student record.");
    }
    setLoading(false);
  };

  // --- 4. ROSTER LOGIC ---
  const getGroupedData = () => {
    const groups = {};
    UNIT_CONFIG.forEach(u => groups[u.key] = []);
    groups["Other"] = [];

    roster.forEach(s => {
      let u = s.unitName || "Other";
      u = u.charAt(0).toUpperCase() + u.slice(1); 
      if (groups[u]) groups[u].push(s);
      else groups["Other"].push(s);
    });
    return groups;
  };

  const getDaysInProgram = (admit) => {
    if (!admit) return "N/A";
    const start = new Date(admit);
    const end = new Date();
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  if (loading) return <SkeletonLoader />;

  // --- VIEW B: ROSTER (3x2 GRID - NO SCROLL) ---
  if (!activeStudentName || !profileData) {
    const grouped = getGroupedData();
    const displayedUnits = filterUnit === "All" ? UNIT_CONFIG : UNIT_CONFIG.filter(u => u.key === filterUnit);

    return (
      <div className="w-full min-h-full p-8 box-border flex flex-col font-sans max-w-7xl mx-auto relative">
        
        {/* HEADER AREA */}
        <div className="flex justify-between items-center mb-5 shrink-0">
            <div>
                <h2 className="m-0 text-slate-800 text-2xl font-extrabold tracking-tight flex items-center gap-3">
                    Resident Roster
                    <span className="bg-blue-50 text-blue-600 text-sm px-3 py-1 rounded-full border border-blue-100 font-bold">
                        {roster.length} Students
                    </span>
                    <span className="bg-amber-50 text-amber-600 text-sm px-3 py-1 rounded-full border border-amber-100 font-bold">
                        {roster.filter(s => s.iep === "Yes").length} IEPs
                    </span>
                </h2>
                <p className="m-1 text-slate-400 text-xs">Manage active students and unit assignments.</p>
            </div>
            <button 
                onClick={() => setShowAddForm(!showAddForm)} 
                className={`px-5 py-2.5 rounded-full font-bold text-xs cursor-pointer transition-all ${showAddForm ? 'bg-gray-100 text-gray-800 border border-gray-200' : 'bg-slate-800 text-white shadow-md hover:bg-slate-700'}`}
            >
                {showAddForm ? "Cancel" : "＋ Add Resident"}
            </button>
        </div>

        {/* FILTER BAR */}
        <div className="flex gap-2.5 mb-6 flex-wrap">
            <button 
                onClick={() => setFilterUnit("All")}
                className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-all ${filterUnit === "All" ? 'bg-slate-800 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
                All Units
            </button>
            {UNIT_CONFIG.map(u => (
                <button 
                    key={u.key} 
                    onClick={() => setFilterUnit(u.key)}
                    className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${filterUnit === u.key ? `text-white shadow-md border-transparent ${u.bg}` : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                >
                    <u.icon className="w-3 h-3" /> {u.label}
                </button>
            ))}
        </div>

        {/* NEW DATA INPUT FORM */}
        {showAddForm && <IntakeForm onSave={onAddStudent} units={UNIT_CONFIG} />}
        
        {/* ROSTER GRID */}
        <div className={filterUnit === "All" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-16" : "w-full pb-16"}>
            {displayedUnits.map(theme => {
                const students = grouped[theme.key] || [];
                return (
                    <div key={theme.key} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex flex-col h-full">
                        <div className={`p-4 flex justify-between items-center text-white ${theme.bg}`}>
                            <div className="flex items-center gap-2">
                                <theme.icon className="w-5 h-5 drop-shadow-md" />
                                <span className="text-sm font-extrabold uppercase tracking-wider drop-shadow-md">{theme.label}</span>
                            </div>
                            <span className="bg-white/20 rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm">{students.length} Residents</span>
                        </div>
                        
                        <div className={filterUnit === "All" ? "py-2 flex-1 max-h-[400px] overflow-y-auto" : "p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
                            {students.length === 0 ? (
                                <div className="text-center p-8 text-gray-300 text-xs italic">No active residents</div>
                            ) : (
                                students.map(s => (
                                    <div 
                                        key={s.id} 
                                        onClick={() => setEditingStudent(s)}
                                        className={`cursor-pointer flex justify-between items-center hover:bg-gray-50 transition-all duration-200 group hover:ring-2 hover:ring-blue-400 ${filterUnit === "All" ? "px-5 py-3 border-b border-gray-50" : "p-4 border border-gray-200 rounded-xl hover:shadow-md bg-white"}`}
                                    >
                                        <div>
                                            <div className="font-bold text-slate-700 text-sm mb-0.5 group-hover:text-blue-600 transition-colors">{s.studentName}</div>
                                            <div className="text-[10px] text-slate-400 font-medium">
                                                GR: {s.gradeLevel} {s.district ? `• ${s.district}` : ""}
                                            </div>
                                        </div>
                                        {s.iep === "Yes" && (
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 font-bold">IEP</span>
                                                <span className={`text-[9px] mt-0.5 ${s.iepDueDate && new Date(s.iepDueDate) < new Date() ? "text-red-600 font-bold" : "text-slate-400"}`}>Due: {s.iepDueDate || "N/A"}</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

        {/* EDIT MODAL */}
        {editingStudent && (
            <EditStudentModal 
                student={editingStudent} 
                onClose={() => setEditingStudent(null)} 
                onSave={handleUpdateStudent} 
            />
        )}
      </div>
    );
  }

  // --- VIEW C: STUDENT PROFILE (Unchanged) ---
  return (
    <div className="w-full min-h-full p-8 box-border flex flex-col font-sans max-w-7xl mx-auto">
        <div className="bg-white p-8 rounded-2xl flex items-center gap-8 border border-gray-100 mb-8 shadow-sm">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-200 to-blue-200 text-white flex justify-center items-center text-3xl font-bold shadow-inner">
                {profileData.studentName.charAt(0)}
            </div>
            <div className="flex-1">
                <h1 className="m-0 text-slate-800 text-3xl font-extrabold">{profileData.studentName}</h1>
                <div className="flex gap-2.5 mt-3 flex-wrap">
                    <div className="bg-gray-100 px-3 py-1.5 rounded-lg text-xs text-gray-600 border border-gray-200">Unit: <strong>{profileData.unitName}</strong></div>
                    <div className="bg-gray-100 px-3 py-1.5 rounded-lg text-xs text-gray-600 border border-gray-200">Grade: <strong>{profileData.gradeLevel}</strong></div>
                    <div className="bg-gray-100 px-3 py-1.5 rounded-lg text-xs text-gray-600 border border-gray-200">IEP: <strong>{profileData.iep || "No"}</strong></div>
                    <div className="bg-gray-100 px-3 py-1.5 rounded-lg text-xs text-gray-600 border border-gray-200">District: <strong>{profileData.district || "N/A"}</strong></div>
                </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl text-center min-w-[120px]">
                <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Days in Care</div>
                <div className="text-3xl font-extrabold text-slate-700">{getDaysInProgram(profileData.admitDate)}</div>
            </div>
        </div>
        <div className="flex gap-8 flex-wrap">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex flex-col flex-[2]">
                <div className="p-5 border-b border-gray-100 font-bold text-slate-700 flex justify-between items-center bg-gray-50/50">
                    Academic Progress (KTEA-III)
                    <button onClick={() => setView('ktea')} className="bg-transparent border border-gray-300 px-3 py-1.5 rounded-md cursor-pointer text-[11px] font-bold text-gray-500 hover:bg-gray-50 transition-colors">Edit Data</button>
                </div>
                <div className="p-6">
                    <ScoreBar label="Reading" pre={profileData.preReadingGE} post={profileData.postReadingGE} color="#3498db" />
                    <ScoreBar label="Math" pre={profileData.preMathGE} post={profileData.postMathGE} color="#e74c3c" />
                    <ScoreBar label="Writing" pre={profileData.preWritingGE} post={profileData.postWritingGE} color="#f1c40f" />
                </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex flex-col flex-1 h-fit">
                <div className="p-5 border-b border-gray-100 font-bold text-slate-700 bg-gray-50/50">Quick Actions</div>
                <div className="p-5 flex flex-col gap-3">
                    <button onClick={() => setView('discharge')} className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl cursor-pointer transition-all hover:shadow-md hover:border-blue-200 group">
                        <div className="text-xl bg-blue-50 w-10 h-10 flex items-center justify-center rounded-lg text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors"><FileText className="w-5 h-5" /></div>
                        <div className="text-left">
                            <div className="font-bold text-slate-700 text-sm">Discharge Letter</div>
                            <div className="text-[11px] text-slate-400">Generate PDF Report</div>
                        </div>
                    </button>
                    <button onClick={() => setView('ktea')} className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl cursor-pointer transition-all hover:shadow-md hover:border-purple-200 group">
                        <div className="text-xl bg-purple-50 w-10 h-10 flex items-center justify-center rounded-lg text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors"><ClipboardList className="w-5 h-5" /></div>
                        <div className="text-left">
                            <div className="font-bold text-slate-700 text-sm">KTEA Assessment</div>
                            <div className="text-[11px] text-slate-400">Input Test Scores</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

// --- SCORE BAR ---
const ScoreBar = ({ label, pre, post, color }) => {
    const p1 = parseFloat(pre) || 0;
    const p2 = parseFloat(post) || 0;
    const w1 = Math.min((p1 / 13) * 100, 100);
    const w2 = Math.min((p2 / 13) * 100, 100);
    return (
        <div className="mb-6">
            <div className="flex justify-between text-[13px] font-bold mb-2 text-slate-600">
                <span>{label}</span>
                <span className={`text-xs ${p2 - p1 > 0 ? "text-green-600" : "text-gray-400"}`}>Growth: {((p2 - p1) > 0 ? "+" : "") + (p2 - p1).toFixed(1)} GE</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full rounded-full opacity-30 transition-all duration-500" style={{ width: `${w2}%`, background: color }}></div>
                <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-500" style={{ width: `${w1}%`, background: color }}></div>
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-slate-400 font-medium">
                <span>Pre: {pre}</span><span>Post: {post}</span>
            </div>
        </div>
    )
}

// --- EDIT MODAL COMPONENT ---
const EditStudentModal = ({ student, onClose, onSave }) => {
    const [formData, setFormData] = useState(student);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? "Yes" : "No") : value
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">Edit Student Details</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Student Name</label>
                        <input name="studentName" value={formData.studentName} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-slate-700" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Grade Level</label>
                            <select name="gradeLevel" value={formData.gradeLevel} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white text-slate-700">
                                {[9, 10, 11, 12].map(g => <option key={g} value={g}>{g}th Grade</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unit Assignment</label>
                            <select name="unitName" value={formData.unitName} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white text-slate-700">
                                {UNIT_CONFIG.map(u => <option key={u.key} value={u.key}>{u.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Local School District</label>
                        <input name="district" value={formData.district || ""} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-700" placeholder="e.g. Springfield Public Schools" />
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <input type="checkbox" name="iep" checked={formData.iep === "Yes"} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                        <label className="text-sm font-bold text-slate-700">Student has an Active IEP</label>
                    </div>
                </div>

                <div className="p-5 border-t border-gray-100 flex gap-3 bg-gray-50">
                    <button onClick={onClose} className="flex-1 py-2.5 text-slate-600 font-bold hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                    <button onClick={() => onSave(formData)} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default StudentMasterDashboard;