import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { cosmosService } from '../../services/cosmosService';

// --- CONFIGURATION: MODERN GRADIENT THEMES ---
const UNIT_CONFIG = [
  { key: "Determination", label: "Determination", bg: "linear-gradient(135deg, #cb2d3e 0%, #ef473a 100%)", icon: "🎯" },
  { key: "Discovery", label: "Discovery", bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", icon: "🔭" },
  { key: "Freedom", label: "Freedom", bg: "linear-gradient(135deg, #00b09b 0%, #96c93d 100%)", icon: "🕊️" },
  { key: "Harmony", label: "Harmony", bg: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)", icon: "🌿" },
  { key: "Integrity", label: "Integrity", bg: "linear-gradient(135deg, #FF9966 0%, #FF5E62 100%)", icon: "🔥" },
  { key: "Serenity", label: "Serenity", bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", icon: "💧" }
];

const OTHER_THEME = { key: "Other", label: "Other / Unassigned", bg: "linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)", icon: "📂" };

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

  if (loading) return <div style={{padding: "60px", textAlign: "center", color: "#888", fontWeight: "300"}}>Loading Records...</div>;

  // --- VIEW B: ROSTER (3x2 GRID - NO SCROLL) ---
  if (!activeStudentName || !profileData) {
    const grouped = getGroupedData();
    const displayedUnits = filterUnit === "All" ? UNIT_CONFIG : UNIT_CONFIG.filter(u => u.key === filterUnit);

    return (
      <div style={styles.container}>
        
        {/* HEADER AREA */}
        <div style={styles.header}>
            <div>
                <h2 style={{margin: 0, color: "#2c3e50", fontSize: "24px", fontWeight: "800", letterSpacing: "-0.5px"}}>Resident Roster</h2>
                <p style={{margin: "5px 0 0 0", color: "#95a5a6", fontSize: "13px"}}>Manage active students and unit assignments.</p>
            </div>
            <button 
                onClick={() => setShowAddForm(!showAddForm)} 
                style={showAddForm ? styles.cancelBtn : styles.addBtn}
            >
                {showAddForm ? "Cancel" : "＋ Add Resident"}
            </button>
        </div>

        {/* FILTER BAR */}
        <div style={styles.filterBar}>
            <button 
                onClick={() => setFilterUnit("All")}
                style={filterUnit === "All" ? styles.filterBtnActive : styles.filterBtn}
            >
                All Units
            </button>
            {UNIT_CONFIG.map(u => (
                <button 
                    key={u.key} 
                    onClick={() => setFilterUnit(u.key)}
                    style={filterUnit === u.key ? {...styles.filterBtnActive, background: u.bg, color: "white", border: "none"} : styles.filterBtn}
                >
                    {u.icon} {u.label}
                </button>
            ))}
        </div>

        {/* NEW DATA INPUT FORM */}
        {showAddForm && (
            <div style={styles.formContainer}>
                {/* (Form content same as previous - hidden for brevity unless clicked) */}
                <h3 style={{margin: "0 0 15px 0", fontSize: "14px", color: "#34495e", textTransform: "uppercase", letterSpacing: "1px"}}>New Intake Form</h3>
                <form onSubmit={handleSubmit(onAddStudent)}>
                    <div style={styles.formGrid}>
                        <div><label style={styles.label}>Name</label><input {...register("studentName")} style={styles.input} /></div>
                        <div><label style={styles.label}>Unit</label><select {...register("unitName")} style={styles.select}>{UNIT_CONFIG.map(u=><option key={u.key}>{u.key}</option>)}</select></div>
                        <div><label style={styles.label}>Grade</label><select {...register("gradeLevel")} style={styles.select}><option>9</option><option>10</option><option>11</option><option>12</option></select></div>
                        <div><label style={styles.label}>Admit</label><input type="date" {...register("admitDate")} style={styles.input} /></div>
                        <div><label style={styles.label}>Discharge</label><input type="date" {...register("dischargeDate")} style={styles.input} /></div>
                        <div><label style={styles.label}>IEP</label><select {...register("iepStatus")} style={styles.select}><option>No</option><option>Yes</option></select></div>
                        <div style={{gridColumn: "span 2"}}><label style={styles.label}>District</label><input {...register("district")} style={styles.input} /></div>
                        <div style={{display: "flex", alignItems: "flex-end"}}><button type="submit" style={styles.saveBtn}>Save</button></div>
                    </div>
                </form>
            </div>
        )}
        
        {/* ROSTER GRID - 3 COLUMNS, 2 ROWS */}
        <div style={filterUnit === "All" ? styles.grid : styles.gridSingle}>
            {displayedUnits.map(theme => {
                const students = grouped[theme.key] || [];
                return (
                    <div key={theme.key} style={styles.card}>
                        <div style={{...styles.cardHeader, background: theme.bg}}>
                            <div style={{display:"flex", alignItems:"center", gap:"8px"}}>
                                <span style={{fontSize: "18px", textShadow: "0 2px 5px rgba(0,0,0,0.1)"}}>{theme.icon}</span>
                                <span style={styles.unitTitle}>{theme.label}</span>
                            </div>
                            <span style={styles.badge}>{students.length} Residents</span>
                        </div>
                        
                        <div style={styles.list}>
                            {students.length === 0 ? (
                                <div style={styles.emptyUnit}>No active residents</div>
                            ) : (
                                students.map(s => (
                                    <div 
                                        key={s.id} 
                                        onClick={() => setActiveStudent(s.studentName)}
                                        style={styles.listItem}
                                    >
                                        <div>
                                            <div style={styles.studentName}>{s.studentName}</div>
                                            <div style={styles.gradeLevel}>
                                                GR: {s.gradeLevel} {s.district ? `• ${s.district}` : ""}
                                            </div>
                                        </div>
                                        {s.iep === "Yes" && <span style={styles.iepBadge}>IEP</span>}
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
    <div style={styles.container}>
        <div style={styles.profileHeader}>
            <div style={styles.avatarLarge}>{profileData.studentName.charAt(0)}</div>
            <div style={{flex: 1}}>
                <h1 style={{margin: 0, color: "#2c3e50", fontSize: "28px", fontWeight: "800"}}>{profileData.studentName}</h1>
                <div style={{display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap"}}>
                    <div style={styles.tag}>Unit: <strong>{profileData.unitName}</strong></div>
                    <div style={styles.tag}>Grade: <strong>{profileData.gradeLevel}</strong></div>
                    <div style={styles.tag}>IEP: <strong>{profileData.iep || "No"}</strong></div>
                    <div style={styles.tag}>District: <strong>{profileData.district || "N/A"}</strong></div>
                </div>
            </div>
            <div style={styles.statBox}>
                <div style={{fontSize: "11px", textTransform: "uppercase", fontWeight: "700", color: "#7f8c8d"}}>Days in Care</div>
                <div style={{fontSize: "32px", fontWeight: "800", color: "#2c3e50"}}>{getDaysInProgram(profileData.admitDate)}</div>
            </div>
        </div>
        <div style={styles.profileGrid}>
            <div style={{...styles.card, flex: 2}}>
                <div style={styles.detailHeader}>
                    Academic Progress (KTEA-III)
                    <button onClick={() => setView('ktea')} style={styles.editBtn}>Edit Data</button>
                </div>
                <div style={{padding: "25px"}}>
                    <ScoreBar label="Reading" pre={profileData.preReadingGE} post={profileData.postReadingGE} color="#3498db" />
                    <ScoreBar label="Math" pre={profileData.preMathGE} post={profileData.postMathGE} color="#e74c3c" />
                    <ScoreBar label="Writing" pre={profileData.preWritingGE} post={profileData.postWritingGE} color="#f1c40f" />
                </div>
            </div>
            <div style={{...styles.card, flex: 1}}>
                <div style={styles.detailHeader}>Quick Actions</div>
                <div style={{padding: "20px"}}>
                    <button onClick={() => setView('discharge')} style={styles.actionBtn}>
                        <div style={styles.actionIcon}>📄</div>
                        <div style={{textAlign: "left"}}>
                            <div style={{fontWeight: "700", color: "#2c3e50"}}>Discharge Letter</div>
                            <div style={{fontSize: "12px", color: "#95a5a6"}}>Generate PDF Report</div>
                        </div>
                    </button>
                    <button onClick={() => setView('ktea')} style={styles.actionBtn}>
                        <div style={styles.actionIcon}>📝</div>
                        <div style={{textAlign: "left"}}>
                            <div style={{fontWeight: "700", color: "#2c3e50"}}>KTEA Assessment</div>
                            <div style={{fontSize: "12px", color: "#95a5a6"}}>Input Test Scores</div>
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
        <div style={{marginBottom: "25px"}}>
            <div style={{display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "#34495e"}}>
                <span>{label}</span>
                <span style={{color: (p2-p1) > 0 ? "#27ae60" : "#95a5a6", fontSize: "12px"}}>Growth: {((p2 - p1) > 0 ? "+" : "") + (p2 - p1).toFixed(1)} GE</span>
            </div>
            <div style={{height: "12px", background: "#ecf0f1", borderRadius: "6px", position: "relative", overflow: "hidden"}}>
                <div style={{position: "absolute", left: 0, top: 0, height: "100%", width: `${w2}%`, background: color, opacity: 0.3, borderRadius: "6px"}}></div>
                <div style={{position: "absolute", left: 0, top: 0, height: "100%", width: `${w1}%`, background: color, borderRadius: "6px"}}></div>
            </div>
            <div style={{display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "11px", color: "#7f8c8d", fontWeight: "500"}}>
                <span>Pre: {pre}</span><span>Post: {post}</span>
            </div>
        </div>
    )
}

// --- STYLES ---
const styles = {
    container: { maxWidth: "100%", minHeight: "100%", padding: "20px 30px", boxSizing: "border-box", display: "flex", flexDirection: "column", fontFamily: "'Inter', 'Segoe UI', sans-serif" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexShrink: 0 },
    addBtn: { background: "#2c3e50", color: "white", border: "none", padding: "10px 20px", borderRadius: "30px", fontWeight: "bold", cursor: "pointer", fontSize: "13px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" },
    cancelBtn: { background: "#f8f9fa", color: "#333", border: "1px solid #ddd", padding: "10px 20px", borderRadius: "30px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" },

    filterBar: { display: "flex", gap: "10px", marginBottom: "25px", flexWrap: "wrap" },
    filterBtn: { background: "white", border: "1px solid #e0e0e0", padding: "8px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", color: "#7f8c8d", cursor: "pointer", transition: "all 0.2s" },
    filterBtnActive: { background: "#2c3e50", border: "1px solid #2c3e50", padding: "8px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", color: "white", cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" },

    formContainer: { background: "white", padding: "25px", borderRadius: "16px", marginBottom: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0", position: "absolute", top: "80px", left: "30px", right: "30px", zIndex: 50 },
    formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" },
    label: { display: "block", fontSize: "11px", fontWeight: "700", color: "#7f8c8d", marginBottom: "5px", textTransform: "uppercase" },
    input: { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e0e0e0", fontSize: "13px", boxSizing: "border-box" },
    select: { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e0e0e0", fontSize: "13px", background: "white", boxSizing: "border-box" },
    saveBtn: { width: "100%", padding: "10px", background: "#27ae60", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" },

    // THE FIX: Auto-expanding grid instead of fixed height
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "25px", paddingBottom: "60px" },
    gridSingle: { display: "flex", flexDirection: "column", maxWidth: "800px", margin: "0 auto", paddingBottom: "60px" },
    
    card: { background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.04)", overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column" },
    cardHeader: { padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "white", flexShrink: 0 },
    unitTitle: { fontSize: "15px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", textShadow: "0 2px 4px rgba(0,0,0,0.1)" },
    badge: { background: "rgba(255,255,255,0.25)", borderRadius: "20px", padding: "4px 10px", fontSize: "11px", fontWeight: "700", backdropFilter: "blur(4px)" },
    
    // LIST EXPANDS (No internal scroll)
    list: { padding: "10px 0" },
    listItem: { padding: "12px 20px", borderBottom: "1px solid #f7f9fa", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "background 0.2s" },
    studentName: { fontWeight: "700", color: "#2c3e50", fontSize: "13px", marginBottom: "2px" },
    gradeLevel: { fontSize: "11px", color: "#95a5a6", fontWeight: "500" },
    iepBadge: { fontSize: "10px", background: "#fff3cd", color: "#856404", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold", border: "1px solid #ffeeba" },
    emptyUnit: { textAlign: "center", padding: "30px", color: "#bdc3c7", fontSize: "12px", fontStyle: "italic" },

    // Profile View (keeps max width for readability)
    profileHeader: { background: "white", padding: "35px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "30px", border: "1px solid rgba(0,0,0,0.04)", marginBottom: "30px", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" },
    avatarLarge: { width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)", color: "white", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "32px", fontWeight: "bold" },
    statBox: { background: "#f8f9fa", padding: "15px 30px", borderRadius: "12px", textAlign: "center" },
    tag: { background: "#f1f3f5", padding: "6px 14px", borderRadius: "8px", fontSize: "12px", color: "#495057", border: "1px solid #e5e7eb" },
    profileGrid: { display: "flex", gap: "30px", flexWrap: "wrap" },
    detailHeader: { padding: "20px 25px", borderBottom: "1px solid #f1f3f5", fontWeight: "700", color: "#2c3e50", display: "flex", justifyContent: "space-between", alignItems: "center" },
    editBtn: { background: "transparent", border: "1px solid #dcdde1", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "700", color: "#7f8c8d" },
    actionBtn: { width: "100%", display: "flex", alignItems: "center", gap: "15px", padding: "15px", background: "white", border: "1px solid #eaebed", borderRadius: "12px", marginBottom: "15px", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 2px 5px rgba(0,0,0,0.02)" },
    actionIcon: { fontSize: "20px", background: "#f8f9fa", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px" }
};

export default StudentMasterDashboard;