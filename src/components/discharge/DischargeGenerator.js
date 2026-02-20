import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { cosmosService } from '../../services/cosmosService';

// Boilerplate text from your template
const BOILERPLATE_INTRO = "Lakeland Regional School operates within a Level IV residential treatment center. Students are admitted for clinical treatment, and the school provides academic instruction during their stay. Classrooms include students from multiple states and a wide range of grade and ability levels. Instruction is based on Missouri’s Major Instructional Goals, and collaboration with sending schools occurs when possible.";

// FIX: Added the missing "=>" below
const DischargeGenerator = ({ user, activeStudent }) => {
  const { register, setValue, watch } = useForm();
  const [loading, setLoading] = useState(false);
  const [dbRecord, setDbRecord] = useState(null);

  // --- 1. CONNECTIVITY: Listen for Student Change ---
  useEffect(() => {
    const fetchData = async () => {
      if (!activeStudent) return;
      setLoading(true);

      try {
        // Search Azure for this student
        const results = await cosmosService.searchStudents(activeStudent);
        
        if (results && results.length > 0) {
          // Use the most recent record found
          const record = results[0];
          setDbRecord(record);

          // --- AUTO-POPULATE FIELDS FROM KTEA DATA ---
          setValue("studentName", record.studentName || activeStudent);
          setValue("gradeLevel", record.gradeLevel || "");
          setValue("admitDate", record.admitDate || "");
          setValue("dischargeDate", record.dischargeDate || "");
          
          // --- AUTO-POPULATE SCORES ---
          setValue("preReading", record.preReadingGE || "");
          setValue("postReading", record.postReadingGE || "");
          setValue("preMath", record.preMathGE || "");
          setValue("postMath", record.postMathGE || "");
          setValue("preWriting", record.preWritingGE || "");
          setValue("postWriting", record.postWritingGE || "");
        } else {
          // No record found, just set the name
          setValue("studentName", activeStudent);
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, [activeStudent, setValue]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={styles.container}>
      
      {/* LEFT: CONTROLS (Screen Only) */}
      <div className="no-print" style={styles.controlPanel}>
        <h2 style={{color: "white", margin: "0 0 10px 0"}}>📄 Discharge Writer</h2>
        
        {loading ? (
           <div style={styles.statusBadge}>⏳ Syncing with Azure...</div>
        ) : dbRecord ? (
           <div style={styles.statusBadge}>✅ Data Loaded from KTEA</div>
        ) : (
           <div style={{...styles.statusBadge, background: "#7f8c8d"}}>Waiting for Student...</div>
        )}

        <div style={{marginTop: "20px"}}>
            <p style={{color: "#ccc", fontSize: "12px"}}>
               This tool automatically pulls dates and scores from the KTEA Reporter. 
               Review the generated narrative below and edit as needed.
            </p>
            <button onClick={handlePrint} style={styles.printBtn}>🖨️ Print / Save PDF</button>
        </div>
      </div>

      {/* RIGHT: THE DOCUMENT (Visual Representation) */}
      <div style={styles.paperWrapper}>
        <div style={styles.page}>
            
            {/* HEADER */}
            <header style={styles.docHeader}>
                <h1 style={styles.schoolName}>LAKELAND REGIONAL SCHOOL</h1>
                <div style={styles.subHeader}>EDUCATIONAL DISCHARGE NARRATIVE</div>
            </header>

            {/* DEMOGRAPHICS GRID */}
            <section style={styles.gridBox}>
                <div style={styles.row}>
                    <div style={styles.field}>
                        <span style={styles.label}>Student Name:</span>
                        <input {...register("studentName")} style={styles.inputInline} />
                    </div>
                    <div style={styles.field}>
                        <span style={styles.label}>Grade:</span>
                        <input {...register("gradeLevel")} style={{...styles.inputInline, width: "50px"}} />
                    </div>
                    <div style={styles.field}>
                        <span style={styles.label}>DOB/Age:</span>
                        <input {...register("age")} style={{...styles.inputInline, width: "50px"}} />
                    </div>
                </div>
                <div style={styles.row}>
                    <div style={styles.field}>
                        <span style={styles.label}>Admission Date:</span>
                        <input {...register("admitDate")} style={styles.inputInline} />
                    </div>
                    <div style={styles.field}>
                        <span style={styles.label}>Discharge Date:</span>
                        <input {...register("dischargeDate")} style={styles.inputInline} />
                    </div>
                </div>
            </section>

            {/* NARRATIVE SECTIONS */}
            <section style={styles.body}>
                
                {/* 1. Admission Context */}
                <div style={styles.paragraph}>
                    <textarea 
                        {...register("admissionReason")} 
                        style={styles.textArea} 
                        placeholder="[Student Name] was admitted for educational services while receiving residential treatment..."
                        defaultValue={watch("studentName") ? `${watch("studentName")} was admitted for educational services...` : ""}
                    />
                </div>

                <div style={styles.staticText}>{BOILERPLATE_INTRO}</div>

                {/* 2. Behavior/Academics */}
                <h4 style={styles.sectionTitle}>Classroom Performance & Behavior</h4>
                <textarea 
                    {...register("behaviorNarrative")} 
                    style={{...styles.textArea, height: "120px"}} 
                    placeholder="Describe student's work ethic, behavior, and strengths..."
                />

                {/* 3. KTEA TABLE */}
                <h4 style={styles.sectionTitle}>KTEA III Assessment Results</h4>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Subject</th>
                            <th style={styles.th}>Pre Test (GE)</th>
                            <th style={styles.th}>Post Test (GE)</th>
                            <th style={styles.th}>Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={styles.td}>Reading</td>
                            <td style={styles.td}><input {...register("preReading")} style={styles.tableInput} /></td>
                            <td style={styles.td}><input {...register("postReading")} style={styles.tableInput} /></td>
                            <td style={styles.td}>--</td>
                        </tr>
                        <tr>
                            <td style={styles.td}>Math</td>
                            <td style={styles.td}><input {...register("preMath")} style={styles.tableInput} /></td>
                            <td style={styles.td}><input {...register("postMath")} style={styles.tableInput} /></td>
                            <td style={styles.td}>--</td>
                        </tr>
                        <tr>
                            <td style={styles.td}>Writing</td>
                            <td style={styles.td}><input {...register("preWriting")} style={styles.tableInput} /></td>
                            <td style={styles.td}><input {...register("postWriting")} style={styles.tableInput} /></td>
                            <td style={styles.td}>--</td>
                        </tr>
                    </tbody>
                </table>

                {/* 4. Analysis */}
                <div style={styles.paragraph}>
                    <textarea 
                        {...register("analysisNarrative")} 
                        style={{...styles.textArea, height: "100px"}} 
                        placeholder="The comparative data indicates..."
                    />
                </div>
            </section>

            {/* FOOTER */}
            <footer style={styles.footer}>
                <p>
                    {watch("studentName")} was discharged successfully from residential care on {watch("dischargeDate")}. 
                    If further information is needed, please contact Lakeland Regional School.
                </p>
                <div style={styles.signatureBlock}>
                    <div style={{fontWeight: "bold", marginTop: "40px"}}>John Gawin, MSEd, School Instructor</div>
                    <div>Lakeland Regional School – 1-417-680-0166</div>
                    <div>john.gawin@lakelandbehavioralhealth.com</div>
                </div>
            </footer>

        </div>
      </div>
    </div>
  );
};

// --- STYLES ---
const styles = {
  container: { display: "flex", height: "100%", background: "#f0f2f5" },
  
  // Left Sidebar
  controlPanel: { width: "300px", padding: "25px", background: "#2c3e50", color: "white", display: "flex", flexDirection: "column" },
  statusBadge: { padding: "10px", borderRadius: "6px", background: "#27ae60", textAlign: "center", fontWeight: "bold", fontSize: "12px", marginTop: "10px" },
  printBtn: { width: "100%", padding: "15px", background: "#3498db", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer", marginTop: "20px" },

  // Document Preview Area
  paperWrapper: { flex: 1, padding: "40px", overflowY: "auto", display: "flex", justifyContent: "center" },
  page: { 
    background: "white", width: "8.5in", minHeight: "11in", padding: "0.75in", 
    boxShadow: "0 0 20px rgba(0,0,0,0.1)", fontFamily: "'Times New Roman', serif", color: "black" 
  },

  // Document Styles
  docHeader: { textAlign: "center", marginBottom: "30px", borderBottom: "2px solid #333", paddingBottom: "10px" },
  schoolName: { margin: 0, fontSize: "18pt", textTransform: "uppercase", letterSpacing: "1px" },
  subHeader: { fontSize: "12pt", fontWeight: "bold", marginTop: "5px" },

  gridBox: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "25px", border: "1px solid #ddd", padding: "15px" },
  row: { display: "flex", gap: "20px", alignItems: "baseline" },
  field: { display: "flex", alignItems: "baseline", gap: "5px" },
  label: { fontWeight: "bold", fontSize: "11pt" },
  inputInline: { border: "none", borderBottom: "1px solid #ccc", fontFamily: "inherit", fontSize: "11pt", width: "180px", padding: "2px 5px", color: "black" },

  body: { fontSize: "12pt", lineHeight: "1.5" },
  paragraph: { marginBottom: "15px" },
  staticText: { marginBottom: "15px", textAlign: "justify" },
  textArea: { width: "100%", border: "1px dashed #ccc", padding: "5px", fontFamily: "inherit", fontSize: "11pt", resize: "vertical", lineHeight: "1.5" },
  sectionTitle: { fontSize: "12pt", textTransform: "uppercase", borderBottom: "1px solid #ccc", marginTop: "20px", marginBottom: "10px" },

  table: { width: "100%", borderCollapse: "collapse", marginBottom: "20px", marginTop: "10px" },
  th: { border: "1px solid #000", padding: "8px", background: "#f0f0f0", textAlign: "center", fontWeight: "bold" },
  td: { border: "1px solid #000", padding: "8px", textAlign: "center" },
  tableInput: { width: "100%", border: "none", textAlign: "center", fontFamily: "inherit", fontSize: "11pt" },

  footer: { marginTop: "40px", borderTop: "1px solid #ccc", paddingTop: "20px", fontSize: "11pt" },
  signatureBlock: { marginTop: "20px" }
};

// CSS for Print Mode
const printStyles = `
  @media print {
    body * { visibility: hidden; }
    .no-print { display: none !important; }
    .page, .page * { visibility: visible; }
    .page { position: absolute; left: 0; top: 0; margin: 0; padding: 0.5in; box-shadow: none; width: 100%; }
    input, textarea { border: none !important; resize: none; background: transparent; }
  }
`;

// Inject Print CSS
const styleSheet = document.createElement("style");
styleSheet.innerText = printStyles;
document.head.appendChild(styleSheet);

export default DischargeGenerator;