import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { cosmosService } from '../../services/cosmosService';
import { Target, Telescope, Bird, Leaf, Flame, Droplets, Folder, FileText, ClipboardList } from 'lucide-react';

// --- CONFIGURATION: MODERN GRADIENT THEMES ---
const UNIT_CONFIG = [
  { key: "Determination", label: "Determination", bg: "bg-gradient-to-br from-red-600 to-red-500", icon: Target },
  { key: "Discovery", label: "Discovery", bg: "bg-gradient-to-br from-indigo-500 to-purple-600", icon: Telescope },
  { key: "Freedom", label: "Freedom", bg: "bg-gradient-to-br from-teal-500 to-lime-500", icon: Bird },
  { key: "Harmony", label: "Harmony", bg: "bg-gradient-to-br from-emerald-600 to-green-400", icon: Leaf },
  { key: "Integrity", label: "Integrity", bg: "bg-gradient-to-br from-orange-400 to-red-400", icon: Flame },
  { key: "Serenity", label: "Serenity", bg: "bg-gradient-to-br from-sky-400 to-cyan-300", icon: Droplets }
];

const OTHER_THEME = { key: "Other", label: "Other / Unassigned", bg: "bg-gradient-to-br from-gray-400 to-slate-700", icon: Folder };

// --- DATA GENERATOR (Creates 108 Fictional Students) ---
const generateMockRoster = () => {
  const students = [];
  const units = ["Determination", "Discovery", "Freedom", "Harmony", "Integrity", "Serenity"];
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

const StudentMasterDashboard = ({ activeStudentName, setActiveStudent, setView }) => {
  // STATE
  const [profileData, setProfileData] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false); 
  const [filterUnit, setFilterUnit] = useState("All");

  // FORM HOOKS
  const { register, handleSubmit, reset } = useForm();

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
    reset();
    setShowAddForm(false);
    alert(`✅ Added ${data.studentName} to ${data.unitName}`);
  };

  // --- 3. ROSTER LOGIC ---
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

  if (loading) return <div className="p-16 text-center text-gray-400 font-light">Loading Records...</div>;

  // --- VIEW B: ROSTER (3x2 GRID - NO SCROLL) ---
  if (!activeStudentName || !profileData) {
    const grouped = getGroupedData();
    const displayedUnits = filterUnit === "All" ? UNIT_CONFIG : UNIT_CONFIG.filter(u => u.key === filterUnit);

    return (
      <div className="w-full min-h-full p-8 box-border flex flex-col font-sans">
        
        {/* HEADER AREA */}
        <div className="flex justify-between items-center mb-5 shrink-0">
            <div>
                <h2 className="m-0 text-slate-800 text-2xl font-extrabold tracking-tight">Resident Roster</h2>
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
                    className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${filterUnit === u.key ? 'text-white shadow-md border-transparent' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    style={filterUnit === u.key ? { backgroundImage: u.bg } : {}}
                >
                    <u.icon className="w-3 h-3" /> {u.label}
                </button>
            ))}
        </div>

        {/* NEW DATA INPUT FORM */}
        {showAddForm && (
            <div className="bg-white p-6 rounded-2xl mb-5 shadow-xl border border-gray-100 absolute top-20 left-8 right-8 z-50">
                <h3 className="m-0 mb-4 text-sm text-slate-600 uppercase tracking-widest font-bold">New Intake Form</h3>
                <form onSubmit={handleSubmit(onAddStudent)}>
                    <div className="grid grid-cols-3 gap-4">
                        <div><label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">Name</label><input {...register("studentName")} className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                        <div><label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">Unit</label><select {...register("unitName")} className="w-full p-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">{UNIT_CONFIG.map(u=><option key={u.key}>{u.key}</option>)}</select></div>
                        <div><label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">Grade</label><select {...register("gradeLevel")} className="w-full p-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"><option>9</option><option>10</option><option>11</option><option>12</option></select></div>
                        <div><label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">Admit</label><input type="date" {...register("admitDate")} className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                        <div><label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">Discharge</label><input type="date" {...register("dischargeDate")} className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                        <div><label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">IEP</label><select {...register("iepStatus")} className="w-full p-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"><option>No</option><option>Yes</option></select></div>
                        <div className="col-span-2"><label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">District</label><input {...register("district")} className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                        <div className="flex items-end"><button type="submit" className="w-full p-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors">Save</button></div>
                    </div>
                </form>
            </div>
        )}
        
        {/* ROSTER GRID */}
        <div className={filterUnit === "All" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-16" : "flex flex-col max-w-3xl mx-auto pb-16 gap-6"}>
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
                        
                        <div className="py-2 flex-1">
                            {students.length === 0 ? (
                                <div className="text-center p-8 text-gray-300 text-xs italic">No active residents</div>
                            ) : (
                                students.map(s => (
                                    <div 
                                        key={s.id} 
                                        onClick={() => setActiveStudent(s.studentName)}
                                        className="px-5 py-3 border-b border-gray-50 cursor-pointer flex justify-between items-center hover:bg-gray-50 transition-colors group"
                                    >
                                        <div>
                                            <div className="font-bold text-slate-700 text-sm mb-0.5 group-hover:text-blue-600 transition-colors">{s.studentName}</div>
                                            <div className="text-[10px] text-slate-400 font-medium">
                                                GR: {s.gradeLevel} {s.district ? `• ${s.district}` : ""}
                                            </div>
                                        </div>
                                        {s.iep === "Yes" && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 font-bold">IEP</span>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    );
  }

  // --- VIEW C: STUDENT PROFILE (Unchanged) ---
  return (
    <div className="w-full min-h-full p-8 box-border flex flex-col font-sans">
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

export default StudentMasterDashboard;