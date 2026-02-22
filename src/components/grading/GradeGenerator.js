import React, { useState, useEffect } from 'react';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import { cosmosService } from '../../services/cosmosService';
import { FileDown, Printer, FileText, User, BookOpen, Calculator, FlaskConical, Globe, Music, Hash, CloudUpload, CheckCircle, Loader2 } from 'lucide-react';
import ClassGradebook from './ClassGradebook';

// --- CONFIGURATION ---
const TEMPLATES = {
  quarter: {
    id: 'quarter',
    label: 'Quarter Card',
    filename: 'quarter_card.docx',
    hasElectives: true,
    hasTeacher: false,
    hasCredits: true,
    hasGradeLevel: true,
    hasSchoolYear: true
  },
  midterm: {
    id: 'midterm',
    label: 'Mid-Term Report',
    filename: 'midterm.docx',
    hasElectives: true,
    hasTeacher: true,
    hasCredits: false,
    hasGradeLevel: false,
    hasSchoolYear: false
  },
  midterm_no_elec: {
    id: 'midterm_no_elec',
    label: 'Mid-Term (No Electives)',
    filename: 'midterm_no_electives.docx',
    hasElectives: false,
    hasTeacher: true,
    hasCredits: false,
    hasGradeLevel: false,
    hasSchoolYear: false
  }
};

const GradeGenerator = ({ user, activeStudent }) => {
  // --- STATE ---
  const [showGradebook, setShowGradebook] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('quarter');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    studentName: activeStudent || '',
    gradeLevel: '',
    schoolYear: '2023-2024',
    quarterName: 'Q1',
    reportDate: new Date().toISOString().split('T')[0],
    teacherName: '',
    totalCredits: '',
    comments: '',
    
    // Core Classes
    engClass: 'English', engGrade: '', engPct: '',
    mathClass: 'Math', mathGrade: '', mathPct: '',
    sciClass: 'Science', sciGrade: '', sciPct: '',
    socClass: 'Social Studies', socGrade: '', socPct: '',

    // Electives
    elec1Class: '', elec1Grade: '', elec1Pct: '',
    elec2Class: '', elec2Grade: '', elec2Pct: '',
  });

  useEffect(() => {
    if (activeStudent) {
      setFormData(prev => ({ ...prev, studentName: activeStudent }));
    }
  }, [activeStudent]);

  // --- HANDLERS ---

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getMappedData = () => {
    return {
      student_name: formData.studentName,
      grade_level: formData.gradeLevel,
      school_year: formData.schoolYear,
      quarter_name: formData.quarterName,
      report_date: formData.reportDate,
      teacher_name: formData.teacherName,
      total_credits: formData.totalCredits,
      comments: formData.comments,

      eng_class: formData.engClass, eng_grade: formData.engGrade, eng_pct: formData.engPct,
      math_class: formData.mathClass, math_grade: formData.mathGrade, math_pct: formData.mathPct,
      sci_class: formData.sciClass, sci_grade: formData.sciGrade, sci_pct: formData.sciPct,
      soc_class: formData.socClass, soc_grade: formData.socGrade, soc_pct: formData.socPct,

      elec1_class: formData.elec1Class, elec1_grade: formData.elec1Grade, elec1_pct: formData.elec1Pct,
      elec2_class: formData.elec2Class, elec2_grade: formData.elec2Grade, elec2_pct: formData.elec2Pct,
    };
  };

  const generateDocx = async () => {
    const templateConfig = TEMPLATES[selectedTemplate];
    setLoading(true);

    try {
      const response = await fetch(`/templates/${templateConfig.filename}`);
      if (!response.ok) throw new Error(`Could not find template: ${templateConfig.filename}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

      doc.render(getMappedData());

      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      saveAs(out, `${formData.studentName || 'Student'}_${templateConfig.label}.docx`);
    } catch (error) {
      console.error("Error generating document:", error);
      alert("Error generating document. Ensure template files exist in public/templates/.");
    } finally {
      setLoading(false);
    }
  };

  const saveToCloud = async () => {
    if (!formData.studentName) return alert("Please enter a student name.");
    
    setSaving(true);
    try {
      // Prepare the record for Cosmos DB
      const record = {
        ...formData,
        type: 'grade_report', // Distinguishes this from KTEA or other records
        templateType: selectedTemplate,
        submittedBy: user?.email || 'unknown',
        createdAt: new Date().toISOString(),
        // We let Cosmos generate the 'id' automatically
      };

      await cosmosService.addItem(record);
      
      setSuccessMsg('Saved to Database!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error("Database Error:", error);
      alert("Failed to save to database: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (showGradebook) {
    return <ClassGradebook onExit={() => setShowGradebook(false)} />;
  }

  const currentConfig = TEMPLATES[selectedTemplate];

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      
      {/* HEADER & ACTIONS */}
      <div className="max-w-5xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" /> 
            Grade Generator
          </h1>
          <p className="text-slate-500 mt-1">Select a template, fill in the grades, and export.</p>
        </div>
        
        <div className="flex gap-3 items-center">
          {successMsg && <span className="text-green-600 font-bold text-sm flex items-center gap-1 animate-in fade-in"><CheckCircle className="w-4 h-4" /> {successMsg}</span>}
          
          <button onClick={() => setShowGradebook(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-md">
            <BookOpen className="w-4 h-4" /> Gradebook
          </button>
          
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <Printer className="w-4 h-4" /> Print
          </button>
          
          <button onClick={saveToCloud} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />} Save to Cloud
          </button>

          <button onClick={generateDocx} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50">
            {loading ? 'Generating...' : <><FileDown className="w-4 h-4" /> Download .DOCX</>}
          </button>
        </div>
      </div>

      {/* MAIN FORM CONTAINER */}
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:hidden">
        <div className="bg-slate-100 p-6 border-b border-slate-200">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Template Type</label>
          <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="w-full md:w-1/2 p-3 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 outline-none">
            {Object.values(TEMPLATES).map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>

        <div className="p-8 space-y-8">
          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100"><User className="w-5 h-5 text-blue-500" /> Student Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Student Name" name="studentName" value={formData.studentName} onChange={handleChange} placeholder="Jane Doe" />
              <Input label="Report Date" name="reportDate" type="date" value={formData.reportDate} onChange={handleChange} />
              <Input label="Quarter" name="quarterName" value={formData.quarterName} onChange={handleChange} placeholder="Q1, Mid-Term..." />
              {currentConfig.hasGradeLevel && <Input label="Grade Level" name="gradeLevel" value={formData.gradeLevel} onChange={handleChange} placeholder="9" />}
              {currentConfig.hasSchoolYear && <Input label="School Year" name="schoolYear" value={formData.schoolYear} onChange={handleChange} placeholder="2023-2024" />}
              {currentConfig.hasTeacher && <Input label="Teacher Name" name="teacherName" value={formData.teacherName} onChange={handleChange} placeholder="Mr. Smith" />}
              {currentConfig.hasCredits && <Input label="Total Credits" name="totalCredits" value={formData.totalCredits} onChange={handleChange} placeholder="3.5" />}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100"><BookOpen className="w-5 h-5 text-green-500" /> Core Classes</h3>
            <div className="space-y-3">
              <ClassRow icon={<BookOpen className="w-4 h-4" />} label="English" prefix="eng" data={formData} onChange={handleChange} />
              <ClassRow icon={<Calculator className="w-4 h-4" />} label="Math" prefix="math" data={formData} onChange={handleChange} />
              <ClassRow icon={<FlaskConical className="w-4 h-4" />} label="Science" prefix="sci" data={formData} onChange={handleChange} />
              <ClassRow icon={<Globe className="w-4 h-4" />} label="Social Studies" prefix="soc" data={formData} onChange={handleChange} />
            </div>
          </section>

          {currentConfig.hasElectives && (
            <section className="animate-in fade-in slide-in-from-top-4 duration-300">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100"><Music className="w-5 h-5 text-purple-500" /> Electives</h3>
              <div className="space-y-3">
                <ClassRow icon={<Hash className="w-4 h-4" />} label="Elective 1" prefix="elec1" data={formData} onChange={handleChange} isElective />
                <ClassRow icon={<Hash className="w-4 h-4" />} label="Elective 2" prefix="elec2" data={formData} onChange={handleChange} isElective />
              </div>
            </section>
          )}

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100"><FileText className="w-5 h-5 text-orange-500" /> Comments</h3>
            <textarea name="comments" value={formData.comments} onChange={handleChange} className="w-full p-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-y text-sm" placeholder="Enter overall comments..." />
          </section>
        </div>
      </div>

      {/* PRINT VIEW */}
      <div className="hidden print:block p-8 bg-white">
        {/* ... (Print view logic remains the same as previous version) ... */}
        <div className="text-center mb-8 border-b-2 border-black pb-4"><h1 className="text-4xl font-bold uppercase tracking-widest mb-2">{currentConfig.label}</h1><p className="text-xl">{formData.studentName} | {formData.quarterName} | {formData.schoolYear}</p></div>
        <div className="grid grid-cols-2 gap-8 mb-8 text-sm"><div><p><strong>Report Date:</strong> {formData.reportDate}</p>{currentConfig.hasTeacher && <p><strong>Teacher:</strong> {formData.teacherName}</p>}{currentConfig.hasGradeLevel && <p><strong>Grade Level:</strong> {formData.gradeLevel}</p>}</div><div className="text-right">{currentConfig.hasCredits && <p><strong>Total Credits:</strong> {formData.totalCredits}</p>}</div></div>
        <table className="w-full border-collapse border border-black mb-8 text-sm"><thead><tr className="bg-gray-200"><th className="border border-black p-2 text-left">Class</th><th className="border border-black p-2 text-center w-24">Grade</th><th className="border border-black p-2 text-center w-24">%</th></tr></thead><tbody><PrintRow label={formData.engClass} grade={formData.engGrade} pct={formData.engPct} /><PrintRow label={formData.mathClass} grade={formData.mathGrade} pct={formData.mathPct} /><PrintRow label={formData.sciClass} grade={formData.sciGrade} pct={formData.sciPct} /><PrintRow label={formData.socClass} grade={formData.socGrade} pct={formData.socPct} />{currentConfig.hasElectives && <><PrintRow label={formData.elec1Class} grade={formData.elec1Grade} pct={formData.elec1Pct} /><PrintRow label={formData.elec2Class} grade={formData.elec2Grade} pct={formData.elec2Pct} /></>}</tbody></table>
        <div className="border border-black p-4 min-h-[150px]"><h4 className="font-bold uppercase text-xs mb-2 text-gray-500">Teacher Comments</h4><p className="whitespace-pre-wrap">{formData.comments}</p></div>
      </div>
    </div>
  );
};

const Input = ({ label, name, value, onChange, type = "text", placeholder }) => (<div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label><input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className="p-2.5 rounded border border-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" /></div>);
const ClassRow = ({ icon, label, prefix, data, onChange, isElective = false }) => (<div className="flex flex-col md:flex-row gap-3 items-end md:items-center bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="flex items-center gap-2 w-full md:w-48"><div className="text-slate-400">{icon}</div>{isElective ? <input name={`${prefix}Class`} value={data[`${prefix}Class`]} onChange={onChange} placeholder="Elective Name" className="w-full bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none text-sm font-bold text-slate-700 pb-1" /> : <span className="text-sm font-bold text-slate-700">{label}</span>}</div><div className="flex gap-2 flex-1 w-full"><div className="flex-1"><input name={`${prefix}Grade`} value={data[`${prefix}Grade`]} onChange={onChange} placeholder="Letter Grade" className="w-full p-2 rounded border border-slate-200 text-xs text-center focus:border-blue-500 outline-none" /></div><div className="flex-1"><input name={`${prefix}Pct`} value={data[`${prefix}Pct`]} onChange={onChange} placeholder="Percentage" className="w-full p-2 rounded border border-slate-200 text-xs text-center focus:border-blue-500 outline-none" /></div></div></div>);
const PrintRow = ({ label, grade, pct }) => { if (!label && !grade) return null; return (<tr><td className="border border-black p-2">{label}</td><td className="border border-black p-2 text-center font-bold">{grade}</td><td className="border border-black p-2 text-center text-gray-600">{pct}</td></tr>); };

export default GradeGenerator;