import React, { useState, useEffect } from 'react';

const GradeReporter = ({ activeStudent }) => {
  // These "states" hold the information as you type it in
  const [studentName, setStudentName] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [comments, setComments] = useState('');
  const [saved, setSaved] = useState(false);

  // This automatically fills in the student's name if you selected one in the top search bar!
  useEffect(() => {
    if (activeStudent) {
      setStudentName(activeStudent);
    }
  }, [activeStudent]);

  // This happens when you click the Save button
  const handleSave = (e) => {
    e.preventDefault(); // Prevents the page from refreshing
    
    // In the future, this is where we will tell it to save to your Azure Database!
    console.log("Saving grade for:", studentName, subject, grade);
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000); // Hides the "Success" message after 3 seconds
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <h2 style={styles.title}>🏫 Grade Reporter</h2>
        <p style={styles.subtitle}>Enter academic progress for your students.</p>

        {/* This message only shows up if 'saved' is true */}
        {saved && <div style={styles.successBadge}>✅ Grades Saved Successfully!</div>}

        <form onSubmit={handleSave} style={styles.form}>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Student Name:</label>
            <input 
              type="text" 
              value={studentName} 
              onChange={(e) => setStudentName(e.target.value)}
              style={styles.input}
              placeholder="e.g. Jane Doe"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Subject:</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} style={styles.input} required>
              <option value="">-- Select a Subject --</option>
              <option value="Math">Math</option>
              <option value="English">English / Language Arts</option>
              <option value="Science">Science</option>
              <option value="Social Studies">Social Studies</option>
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Current Grade (% or Letter):</label>
            <input 
              type="text" 
              value={grade} 
              onChange={(e) => setGrade(e.target.value)}
              style={styles.input}
              placeholder="e.g. 85% or B+"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Teacher Comments:</label>
            <textarea 
              value={comments} 
              onChange={(e) => setComments(e.target.value)}
              style={{...styles.input, height: '80px', resize: 'vertical'}}
              placeholder="Notes on student progress..."
            />
          </div>

          <button type="submit" style={styles.submitBtn}>💾 Save Grades</button>
        </form>
      </div>
    </div>
  );
};

// --- STYLES ---
const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "40px", height: "100%" },
  formCard: { background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", width: "100%", maxWidth: "500px" },
  title: { margin: "0 0 5px 0", color: "#2c3e50" },
  subtitle: { margin: "0 0 20px 0", color: "#7f8c8d", fontSize: "14px" },
  successBadge: { background: "#d4edda", color: "#155724", padding: "10px", borderRadius: "6px", marginBottom: "20px", textAlign: "center", fontWeight: "bold" },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "5px" },
  label: { fontWeight: "bold", color: "#34495e", fontSize: "14px" },
  input: { padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px", fontFamily: "inherit" },
  submitBtn: { background: "#3498db", color: "white", border: "none", padding: "12px", borderRadius: "6px", fontWeight: "bold", fontSize: "16px", cursor: "pointer", marginTop: "10px" }
};

export default GradeReporter;