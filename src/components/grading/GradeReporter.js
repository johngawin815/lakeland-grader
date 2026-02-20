import React, { useState, useEffect } from 'react';
import { School, Save, CheckCircle } from 'lucide-react';

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
    <div className="flex justify-center items-start p-10 h-full bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-sm w-full max-w-lg border border-gray-200">
        <h2 className="m-0 mb-1 text-slate-800 text-2xl font-bold flex items-center gap-2"><School className="w-6 h-6 text-orange-500" /> Grade Reporter</h2>
        <p className="m-0 mb-6 text-slate-400 text-sm">Enter academic progress for your students.</p>

        {/* This message only shows up if 'saved' is true */}
        {saved && <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-5 text-center font-bold text-sm flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Grades Saved Successfully!</div>}

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-slate-600 text-xs uppercase tracking-wider">Student Name:</label>
            <input 
              type="text" 
              value={studentName} 
              onChange={(e) => setStudentName(e.target.value)}
              className="p-3 rounded-lg border border-gray-300 text-sm font-sans focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Jane Doe"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-slate-600 text-xs uppercase tracking-wider">Subject:</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="p-3 rounded-lg border border-gray-300 text-sm font-sans bg-white focus:ring-2 focus:ring-blue-500 outline-none" required>
              <option value="">-- Select a Subject --</option>
              <option value="Math">Math</option>
              <option value="English">English / Language Arts</option>
              <option value="Science">Science</option>
              <option value="Social Studies">Social Studies</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-slate-600 text-xs uppercase tracking-wider">Current Grade (% or Letter):</label>
            <input 
              type="text" 
              value={grade} 
              onChange={(e) => setGrade(e.target.value)}
              className="p-3 rounded-lg border border-gray-300 text-sm font-sans focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. 85% or B+"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-slate-600 text-xs uppercase tracking-wider">Teacher Comments:</label>
            <textarea 
              value={comments} 
              onChange={(e) => setComments(e.target.value)}
              className="p-3 rounded-lg border border-gray-300 text-sm font-sans focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-y"
              placeholder="Notes on student progress..."
            />
          </div>

          <button type="submit" className="mt-2 bg-blue-500 text-white p-3 rounded-lg font-bold text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Save Grades</button>
        </form>
      </div>
    </div>
  );
};

export default GradeReporter;