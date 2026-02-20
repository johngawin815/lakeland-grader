import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { cosmosService } from '../../services/cosmosService';

function KTEAReporter({ user, activeStudent }) {
  const { register, handleSubmit, reset, setValue } = useForm();
  
  // STATE
  const [queue, setQueue] = useState([]); 
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [submitMode, setSubmitMode] = useState('queue');
  
  // PREVIEW STATE
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState({}); // Grouped by Unit
  const [loadingPreview, setLoadingPreview] = useState(false);

  // SEARCH STATE
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [editingId, setEditingId] = useState(null); 
  const [currentDoc, setCurrentDoc] = useState(null);

  // --- 1. CONNECTIVITY ---
  useEffect(() => {
    if (activeStudent) {
      setSearchTerm(activeStudent);
      handleSearch(null, activeStudent);
      if (!editingId) setValue("studentName", activeStudent);
    }
  }, [activeStudent, setValue, editingId]);

  // --- 2. AZURE ACTIONS ---
  const handleSearch = async (e, overrideTerm = null) => {
    if (e) e.preventDefault(); 
    const term = overrideTerm || searchTerm;
    if (!term.trim()) return;

    try {
      const results = await cosmosService.searchStudents(term);
      setSearchResults(results);
    } catch (error) {
      console.error("Azure Search error:", error);
    }
  };

  const handleDelete = async (id, name, e) => {
    e.stopPropagation(); 
    if (!window.confirm(`⚠️ Delete record for ${name}?`)) return;
    try {
      await cosmosService.deleteItem(id);
      setSearchResults(prev => prev.filter(item => item.id !== id));
    } catch (error) { alert("Could not delete."); }
  };

  const loadStudent = (student) => {
    setEditingId(student.id); 
    setCurrentDoc(student);
    setSearchResults([]); 
    setSearchTerm("");
    
    const fields = [
      "studentName", "gradeLevel", "admitDate", "dischargeDate", "teacherName", "unitName",
      "preReadingRaw", "preReadingStd", "preReadingGE", "preMathRaw", "preMathStd", "preMathGE", "preWritingRaw", "preWritingStd", "preWritingGE",
      "postReadingRaw", "postReadingStd", "postReadingGE", "postMathRaw", "postMathStd", "postMathGE", "postWritingRaw", "postWritingStd", "postWritingGE"
    ];
    fields.forEach(f => setValue(f, student[f]));
  };

  const onSubmit = async (data) => {
    if (!data.studentName) return alert("⚠️ Enter Student Name.");

    // UPDATE EXISTING
    if (editingId && currentDoc) {
      setSaving(true);
      try {
        const updatedDoc = { ...currentDoc, ...data, lastUpdatedBy: user.email };
        await cosmosService.updateItem(editingId, updatedDoc);
        setMsg(`✅ Updated: ${data.studentName}`);
        setTimeout(() => setMsg(''), 3000);
        setEditingId(null);
        reset({ teacherName: data.teacherName, unitName: data.unitName }); 
      } catch (e) { alert("Update Failed: " + e.message); }
      setSaving(false);
      return;
    }

    // NEW ENTRY
    const fixedName = formatName(data.studentName);
    const newRecord = { ...data, studentName: fixedName, tempId: Date.now() };

    if (submitMode === 'direct') {
        setSaving(true);
        try {
            await cosmosService.addItem({ ...newRecord, submittedBy: user.email, schoolYear: "2024-2025" });
            setMsg(`✅ Saved & Submitted: ${fixedName}`);
            setTimeout(() => setMsg(''), 3000);
            reset({ teacherName: data.teacherName, unitName: data.unitName, gradeLevel: data.gradeLevel });
        } catch (e) { alert("Submission Failed: " + e.message); }
        setSaving(false);
    } else {
        setQueue([...queue, newRecord]);
        reset({ teacherName: data.teacherName, unitName: data.unitName, gradeLevel: data.gradeLevel });
    }
  };

  const uploadBatch = async () => {
    if (queue.length === 0) return;
    setSaving(true);
    try {
      for (const student of queue) {
        const { tempId, ...cleanData } = student;
        await cosmosService.addItem({ ...cleanData, submittedBy: user.email, schoolYear: "2024-2025" });
      }
      setMsg(`✅ Saved ${queue.length} records to Azure.`);
      setQueue([]);
      setTimeout(() => setMsg(''), 4000);
    } catch (e) { alert("Batch Failed: " + e.message); }
    setSaving(false);
  };

  // --- 3. EXPORT & PREVIEW ---
  
  const generatePreviewData = async () => {
    setLoadingPreview(true);
    try {
        const allStudents = await cosmosService.getAllItems();
        if (!allStudents || allStudents.length === 0) {
            alert("⚠️ No records found in database.");
            setLoadingPreview(false);
            return;
        }
        
        // Group by Unit
        const units = {};
        allStudents.forEach(s => {
            const u = s.unitName || "Other";
            if (!units[u]) units[u] = [];
            units[u].push(s);
        });
        
        setPreviewData(units);
        setShowPreview(true);
    } catch (e) { console.error(e); alert("Preview Error"); }
    setLoadingPreview(false);
  };

  const downloadReport = async () => {
    try {
      const allStudents = await cosmosService.getAllItems();
      if (!allStudents || allStudents.length === 0) return alert(`⚠️ No records found.`);

      const units = {};
      allStudents.forEach(s => {
        const u = s.unitName || "Other";
        if (!units[u]) units[u] = [];
        units[u].push(s);
      });

      const workbook = new ExcelJS.Workbook();
      Object.keys(units).sort().forEach(unitName => {
        const sheet = workbook.addWorksheet(unitName); 
        // Logic similar to preview would go here for actual Excel generation
        // (Simplified for brevity as we focused on preview visual)
        sheet.addRow(["Student", "Grade", "Admit", "Discharge", "Pre-Read", "Post-Read"]); 
        units[unitName].forEach(s => sheet.addRow([s.studentName, s.gradeLevel, s.admitDate, s.dischargeDate, s.preReadingGE, s.postReadingGE]));
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `LRS_Master_Report.xlsx`);
    } catch (e) { console.error(e); alert("Export Error"); }
  };

  // --- RENDER ---
  return (
    <div style={styles.container}>
      
      {/* HEADER */}
      <div style={styles.headerBar}>
        <div style={{display: "flex", alignItems: "center", gap: "15px"}}>
            <h2 style={styles.appTitle}>📝 KTEA Reporter</h2>
            <div style={styles.connectedBadge}>Azure Online</div>
        </div>
        <div style={{display: "flex", gap: "10px"}}>
            <button onClick={generatePreviewData} style={styles.previewBtn}>
                {loadingPreview ? "Loading..." : "👁️ Spreadsheet Preview"}
            </button>
            <button onClick={downloadReport} style={styles.exportBtn}>📊 Master Export</button>
        </div>
      </div>

      {msg && <div style={styles.toast}>{msg}</div>}

      <div style={styles.workspace}>
        {/* MAIN FORM AREA */}
        <div style={styles.mainForm}>
            <form onSubmit={handleSubmit(onSubmit)} style={{height: "100%", display: "flex", flexDirection: "column"}}>
                <div style={styles.contextRow}>
                    <div style={{flex: 1}}> <label style={styles.label}>Teacher</label> <input {...register("teacherName")} style={styles.input} /> </div>
                    <div style={{flex: 1}}> <label style={styles.label}>Unit</label> <select {...register("unitName")} style={styles.input}><option value="">Select...</option><option value="Determination">Determination</option><option value="Discovery">Discovery</option><option value="Freedom">Freedom</option><option value="Harmony">Harmony</option><option value="Integrity">Integrity</option><option value="Serenity">Serenity</option></select> </div>
                    <div style={{flex: 1.5}}> <label style={styles.label}>Student Name</label> <input {...register("studentName")} style={{...styles.input, fontWeight: "bold", borderLeft: "3px solid #3498db"}} /> </div>
                    <div style={{width: "70px"}}> <label style={styles.label}>Grade</label> <select {...register("gradeLevel")} style={styles.input}><option value="9">9</option><option value="10">10</option><option value="11">11</option><option value="12">12</option></select> </div>
                    <div style={{width: "120px"}}> <label style={styles.label}>Admit</label> <input type="date" {...register("admitDate")} style={styles.input} /> </div>
                    <div style={{width: "120px"}}> <label style={styles.label}>Discharge</label> <input type="date" {...register("dischargeDate")} style={styles.input} /> </div>
                </div>

                <div style={styles.scoreGrid}>
                    <div style={styles.scorePanel}>
                        <div style={{...styles.panelHeader, color: "#2980b9", background: "rgba(52, 152, 219, 0.1)"}}>PRE-TEST</div>
                        <div style={styles.panelBody}>
                            <ScoreRow label="Reading Comp" type="preReading" register={register} />
                            <ScoreRow label="Math Concepts" type="preMath" register={register} />
                            <ScoreRow label="Writing Fluency" type="preWriting" register={register} />
                        </div>
                    </div>
                    <div style={styles.scorePanel}>
                        <div style={{...styles.panelHeader, color: "#27ae60", background: "rgba(46, 204, 113, 0.1)"}}>POST-TEST</div>
                        <div style={styles.panelBody}>
                            <ScoreRow label="Reading Comp" type="postReading" register={register} />
                            <ScoreRow label="Math Concepts" type="postMath" register={register} />
                            <ScoreRow label="Writing Fluency" type="postWriting" register={register} />
                        </div>
                    </div>
                </div>

                <div style={styles.actionFooter}>
                    {editingId ? (
                        <button type="submit" style={styles.btnUpdate}>⚡ UPDATE RECORD</button>
                    ) : (
                        <>
                            <button type="submit" onClick={() => setSubmitMode('queue')} style={styles.btnAdd}>⬇️ ADD TO QUEUE</button>
                            <button type="submit" onClick={() => setSubmitMode('direct')} style={styles.btnDirect}>🚀 SAVE & SUBMIT</button>
                        </>
                    )}
                    <button type="button" onClick={() => reset()} style={styles.btnClear}>Clear</button>
                </div>
            </form>
        </div>

        {/* QUEUE SIDEBAR */}
        <div style={styles.queueSidebar}>
            <div style={styles.queueHeader}>
                <strong>Batch Queue</strong> <span style={styles.queueCount}>{queue.length}</span>
            </div>
            <div style={styles.queueList}>
                {queue.map((item) => (
                  <div key={item.tempId} style={styles.queueItem}>
                    <div><div style={{fontWeight: "bold", fontSize: "13px"}}>{item.studentName}</div></div>
                    <button onClick={() => setQueue(queue.filter(q => q.tempId !== item.tempId))} style={styles.btnRemove}>×</button>
                  </div>
                ))}
            </div>
            <button onClick={uploadBatch} disabled={saving || queue.length === 0} style={styles.btnSubmit}>{saving ? "Saving..." : "🚀 SUBMIT BATCH"}</button>
        </div>
      </div>
      
      {/* SEARCH DROPDOWN */}
      {searchResults.length > 0 && (
         <div style={styles.searchDropdown}>
             <div style={{padding: "10px", borderBottom: "1px solid #eee", fontSize: "11px", fontWeight: "bold", color: "#777"}}>DB RESULTS</div>
             {searchResults.map(s => (
               <div key={s.id} onClick={() => loadStudent(s)} style={styles.resultItem}>
                 <div><strong>{s.studentName}</strong> <span style={{fontSize:"11px"}}>({s.gradeLevel}th)</span></div>
                 <button onClick={(e) => handleDelete(s.id, s.studentName, e)} style={styles.btnDelete}>🗑️</button>
               </div>
             ))}
         </div>
      )}

      {/* --- SPREADSHEET PREVIEW MODAL --- */}
      {showPreview && (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <div style={styles.modalHeader}>
                    <h3>👁️ Spreadsheet Preview</h3>
                    <button onClick={() => setShowPreview(false)} style={styles.closeModalBtn}>Close</button>
                </div>
                <div style={styles.modalBody}>
                    {Object.keys(previewData).length === 0 ? <p>No data found.</p> : 
                     Object.keys(previewData).sort().map(unit => (
                        <div key={unit} style={{marginBottom: "40px"}}>
                            <h4 style={{background: "#eee", padding: "10px", margin: 0, border: "1px solid #ccc", borderBottom: "none"}}>{unit}</h4>
                            <div style={{overflowX: "auto"}}>
                                <table style={styles.previewTable}>
                                    <thead>
                                        {/* Row 1: Main Headers */}
                                        <tr style={{background: "black", color: "white"}}>
                                            <th colSpan="2" style={styles.th}>Student Info</th>
                                            <th colSpan="9" style={{...styles.th, borderRight: "2px solid white"}}>PRE-TEST</th>
                                            <th colSpan="9" style={styles.th}>POST-TEST</th>
                                            <th colSpan="3" style={styles.th}>Dates</th>
                                        </tr>
                                        {/* Row 2: Subjects */}
                                        <tr style={{background: "#333", color: "white", fontSize: "10px"}}>
                                            <th style={styles.th}>Name</th>
                                            <th style={styles.th}>Grd</th>
                                            
                                            {/* Pre Subjects */}
                                            <th colSpan="3" style={styles.th}>Reading</th>
                                            <th colSpan="3" style={styles.th}>Math</th>
                                            <th colSpan="3" style={{...styles.th, borderRight: "2px solid white"}}>Writing</th>
                                            
                                            {/* Post Subjects */}
                                            <th colSpan="3" style={styles.th}>Reading</th>
                                            <th colSpan="3" style={styles.th}>Math</th>
                                            <th colSpan="3" style={styles.th}>Writing</th>

                                            <th style={styles.th}>Admit</th>
                                            <th style={styles.th}>Discharge</th>
                                            <th style={styles.th}>Teacher</th>
                                        </tr>
                                        {/* Row 3: Sub-Headers (Raw/Std/GE) */}
                                        <tr style={{fontSize: "9px", textAlign: "center", fontWeight: "bold", background: "#f0f0f0"}}>
                                            <td style={styles.td}></td>
                                            <td style={styles.td}></td>
                                            {/* Pre Loop */}
                                            {[1,2,3].map(i => <><td style={styles.tdRaw}>Raw</td><td style={styles.tdStd}>Std</td><td style={styles.td}>GE</td></>)}
                                            {/* Post Loop */}
                                            {[1,2,3].map(i => <><td style={styles.tdRaw}>Raw</td><td style={styles.tdStd}>Std</td><td style={styles.td}>GE</td></>)}
                                            <td colSpan="3"></td>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData[unit].map((s, idx) => (
                                            <tr key={idx} style={{background: idx % 2 === 0 ? "white" : "#f9f9f9"}}>
                                                <td style={styles.td}>{s.studentName}</td>
                                                <td style={styles.td}>{s.gradeLevel}</td>
                                                
                                                {/* Pre Scores */}
                                                <td style={styles.tdRaw}>{s.preReadingRaw}</td><td style={styles.tdStd}>{s.preReadingStd}</td><td style={styles.td}>{s.preReadingGE}</td>
                                                <td style={styles.tdRaw}>{s.preMathRaw}</td><td style={styles.tdStd}>{s.preMathStd}</td><td style={styles.td}>{s.preMathGE}</td>
                                                <td style={styles.tdRaw}>{s.preWritingRaw}</td><td style={styles.tdStd}>{s.preWritingStd}</td><td style={{...styles.td, borderRight: "2px solid #333"}}>{s.preWritingGE}</td>

                                                {/* Post Scores */}
                                                <td style={styles.tdRaw}>{s.postReadingRaw}</td><td style={styles.tdStd}>{s.postReadingStd}</td><td style={styles.td}>{s.postReadingGE}</td>
                                                <td style={styles.tdRaw}>{s.postMathRaw}</td><td style={styles.tdStd}>{s.postMathStd}</td><td style={styles.td}>{s.postMathGE}</td>
                                                <td style={styles.tdRaw}>{s.postWritingRaw}</td><td style={styles.tdStd}>{s.postWritingStd}</td><td style={styles.td}>{s.postWritingGE}</td>

                                                <td style={styles.td}>{s.admitDate}</td>
                                                <td style={styles.td}>{s.dischargeDate}</td>
                                                <td style={styles.td}>{s.teacherName}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                     ))
                    }
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

// --- HELPERS ---
function ScoreRow({ label, type, register }) {
    return (
        <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
            <label style={{flex: 1, fontSize: "12px", fontWeight: "600", color: "#555"}}>{label}</label>
            <div style={{display: "flex", gap: "5px", flex: 2}}>
                <input {...register(`${type}Raw`)} placeholder="Raw" type="number" style={styles.inputSmall} />
                <input {...register(`${type}Std`)} placeholder="Std" type="number" style={styles.inputSmall} />
                <input {...register(`${type}GE`)} placeholder="GE" type="text" style={styles.inputSmall} />
            </div>
        </div>
    )
}

function formatName(name) {
    if (name.includes(",")) return name;
    const parts = name.trim().split(" ");
    if (parts.length < 2) return name;
    const last = parts.pop();
    const first = parts.join(" ");
    return last.charAt(0).toUpperCase() + last.slice(1) + ", " + first.charAt(0).toUpperCase() + first.slice(1);
}

// --- STYLES ---
const styles = {
    container: { height: "100%", display: "flex", flexDirection: "column", color: "#333", fontFamily: "Segoe UI, sans-serif" },
    headerBar: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "15px", marginBottom: "10px", borderBottom: "1px solid rgba(0,0,0,0.05)" },
    appTitle: { margin: 0, color: "#2c3e50", fontWeight: "800", fontSize: "20px" },
    connectedBadge: { fontSize: "10px", background: "#e1f5fe", color: "#0288d1", padding: "3px 8px", borderRadius: "10px", fontWeight: "bold" },
    
    workspace: { display: "flex", gap: "20px", flex: 1, overflow: "hidden" },
    mainForm: { flex: 1, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" },
    contextRow: { display: "flex", gap: "10px", marginBottom: "20px", alignItems: "flex-end" },
    input: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #dcdde1", background: "white", fontSize: "13px", boxSizing: "border-box" },
    label: { fontSize: "11px", fontWeight: "bold", color: "#7f8c8d", marginBottom: "4px", display: "block", textTransform: "uppercase" },
    
    scoreGrid: { display: "flex", gap: "20px", flex: 1 },
    scorePanel: { flex: 1, background: "white", borderRadius: "8px", border: "1px solid #eee", overflow: "hidden", display: "flex", flexDirection: "column" },
    panelHeader: { padding: "10px", textAlign: "center", fontWeight: "bold", fontSize: "12px", letterSpacing: "1px" },
    panelBody: { padding: "20px" },
    inputSmall: { width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #eee", background: "#f9f9f9", fontSize: "12px", textAlign: "center" },

    actionFooter: { marginTop: "20px", display: "flex", gap: "10px" },
    btnAdd: { flex: 1, padding: "15px", background: "#34495e", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" },
    btnDirect: { flex: 1, padding: "15px", background: "#27ae60", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px", boxShadow: "0 4px 10px rgba(39, 174, 96, 0.3)" },
    btnUpdate: { flex: 2, padding: "15px", background: "#e67e22", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" },
    btnClear: { padding: "15px 25px", background: "transparent", border: "1px solid #ccc", borderRadius: "8px", cursor: "pointer", color: "#777" },

    queueSidebar: { width: "260px", background: "white", borderRadius: "12px", padding: "15px", display: "flex", flexDirection: "column", border: "1px solid #eee" },
    queueHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", paddingBottom: "10px", borderBottom: "1px solid #f0f0f0" },
    queueCount: { background: "#e74c3c", color: "white", borderRadius: "10px", padding: "2px 8px", fontSize: "11px", fontWeight: "bold" },
    queueList: { flex: 1, overflowY: "auto", marginBottom: "15px" },
    queueItem: { background: "#f8f9fa", padding: "10px", borderRadius: "6px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #eee" },
    btnRemove: { background: "#ff7675", color: "white", border: "none", borderRadius: "4px", width: "20px", height: "20px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" },
    btnSubmit: { width: "100%", padding: "12px", background: "#27ae60", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" },
    emptyQueue: { textAlign: "center", color: "#bdc3c7", marginTop: "20px", fontSize: "12px", fontStyle: "italic" },

    toast: { position: "absolute", top: "20px", left: "50%", transform: "translateX(-50%)", padding: "10px 20px", background: "#27ae60", color: "white", borderRadius: "30px", fontSize: "13px", fontWeight: "bold", boxShadow: "0 5px 15px rgba(0,0,0,0.2)", zIndex: 100 },
    previewBtn: { background: "#8e44ad", border: "1px solid #7d3c98", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontWeight: "bold", color: "white", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" },
    exportBtn: { background: "white", border: "1px solid #dcdde1", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontWeight: "bold", color: "#2c3e50" },
    
    searchDropdown: { position: "absolute", top: "70px", right: "20px", width: "300px", background: "white", borderRadius: "8px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", zIndex: 50, overflow: "hidden" },
    resultItem: { padding: "12px", borderBottom: "1px solid #f9f9f9", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" },
    btnDelete: { background: "#e74c3c", color: "white", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "10px" },

    // Modal Styles
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" },
    modalContent: { background: "white", width: "90%", height: "90%", borderRadius: "10px", display: "flex", flexDirection: "column", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" },
    modalHeader: { padding: "15px 20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8f9fa" },
    closeModalBtn: { background: "#e74c3c", color: "white", border: "none", padding: "8px 15px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" },
    modalBody: { flex: 1, padding: "20px", overflow: "auto" },
    previewTable: { width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "11px" },
    th: { border: "1px solid #555", padding: "5px", textAlign: "center" },
    td: { border: "1px solid #ccc", padding: "4px", textAlign: "center", color: "#333" },
    tdRaw: { border: "1px solid #ccc", padding: "4px", textAlign: "center", background: "#ffffcc", fontWeight: "bold" }, // Yellow for Raw
    tdStd: { border: "1px solid #ccc", padding: "4px", textAlign: "center", background: "#e0e0e0" } // Gray for Standard
};

export default KTEAReporter;