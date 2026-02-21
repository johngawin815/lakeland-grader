import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { cosmosService } from '../../services/cosmosService';
import { ClipboardList, Eye, Download, CheckCircle, Zap, ArrowDown, Send, Trash2, X, Calculator, Target, Telescope, Bird, Leaf, Flame, Droplets, Printer } from 'lucide-react';

const UNIT_CONFIG = [
  { key: "Determination", label: "Determination", bg: "bg-gradient-to-br from-red-600 to-red-500", icon: Target },
  { key: "Discovery", label: "Discovery", bg: "bg-gradient-to-br from-indigo-500 to-purple-600", icon: Telescope },
  { key: "Freedom", label: "Freedom", bg: "bg-gradient-to-br from-teal-500 to-lime-500", icon: Bird },
  { key: "Harmony", label: "Harmony", bg: "bg-gradient-to-br from-emerald-600 to-green-400", icon: Leaf },
  { key: "Integrity", label: "Integrity", bg: "bg-gradient-to-br from-orange-400 to-red-400", icon: Flame },
  { key: "Serenity", label: "Serenity", bg: "bg-gradient-to-br from-sky-400 to-cyan-300", icon: Droplets }
];

function KTEAReporter({ user, activeStudent }) {
  const { register, handleSubmit, reset, setValue, getValues, formState: { errors } } = useForm();
  
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
  const [searchResults, setSearchResults] = useState([]);
  const [editingId, setEditingId] = useState(null); 
  const [currentDoc, setCurrentDoc] = useState(null);

  // --- 1. CONNECTIVITY ---
  useEffect(() => {
    if (activeStudent) {
      if (activeStudent.trim()) {
        cosmosService.searchStudents(activeStudent)
          .then(setSearchResults)
          .catch(error => console.error("Azure Search error:", error));
      }
      if (!editingId) setValue("studentName", activeStudent);
    }
  }, [activeStudent, setValue, editingId]);

  // --- 2. AZURE ACTIONS ---
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

  const calculateGrowth = () => {
    const data = getValues();
    const calc = (pre, post) => {
        const p1 = parseFloat(pre);
        const p2 = parseFloat(post);
        if (isNaN(p1) || isNaN(p2)) return "N/A";
        const diff = (p2 - p1).toFixed(1);
        return (diff > 0 ? "+" : "") + diff;
    };

    const msg = `📊 Growth Calculation:\n\nReading: ${calc(data.preReadingGE, data.postReadingGE)}\nMath: ${calc(data.preMathGE, data.postMathGE)}\nWriting: ${calc(data.preWritingGE, data.postWritingGE)}`;
    alert(msg);
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
        
        // Styles
        const preStyle = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } } }; // Light Blue
        const postStyle = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } } }; // Light Green
        const infoStyle = { alignment: { horizontal: 'left' } };

        // Define Columns
        sheet.columns = [
            { header: 'Student Name', key: 'studentName', width: 25, style: infoStyle },
            { header: 'Grade', key: 'gradeLevel', width: 8, style: { alignment: { horizontal: 'center' } } },
            { header: 'Admit Date', key: 'admitDate', width: 12, style: { alignment: { horizontal: 'center' } } },
            { header: 'Discharge Date', key: 'dischargeDate', width: 12, style: { alignment: { horizontal: 'center' } } },
            { header: 'Teacher', key: 'teacherName', width: 20, style: infoStyle },
            
            // Pre-Test
            { header: 'Pre Read Raw', key: 'preReadingRaw', width: 12, style: preStyle },
            { header: 'Pre Read Std', key: 'preReadingStd', width: 12, style: preStyle },
            { header: 'Pre Read GE', key: 'preReadingGE', width: 12, style: preStyle },
            { header: 'Pre Math Raw', key: 'preMathRaw', width: 12, style: preStyle },
            { header: 'Pre Math Std', key: 'preMathStd', width: 12, style: preStyle },
            { header: 'Pre Math GE', key: 'preMathGE', width: 12, style: preStyle },
            { header: 'Pre Writ Raw', key: 'preWritingRaw', width: 12, style: preStyle },
            { header: 'Pre Writ Std', key: 'preWritingStd', width: 12, style: preStyle },
            { header: 'Pre Writ GE', key: 'preWritingGE', width: 12, style: preStyle },

            // Post-Test
            { header: 'Post Read Raw', key: 'postReadingRaw', width: 12, style: postStyle },
            { header: 'Post Read Std', key: 'postReadingStd', width: 12, style: postStyle },
            { header: 'Post Read GE', key: 'postReadingGE', width: 12, style: postStyle },
            { header: 'Post Math Raw', key: 'postMathRaw', width: 12, style: postStyle },
            { header: 'Post Math Std', key: 'postMathStd', width: 12, style: postStyle },
            { header: 'Post Math GE', key: 'postMathGE', width: 12, style: postStyle },
            { header: 'Post Writ Raw', key: 'postWritingRaw', width: 12, style: postStyle },
            { header: 'Post Writ Std', key: 'postWritingStd', width: 12, style: postStyle },
            { header: 'Post Writ GE', key: 'postWritingGE', width: 12, style: postStyle },
        ];

        // Style Header Row
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF263238' } // Dark Slate
        };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.height = 24;

        // Add Data
        units[unitName].forEach(s => {
            sheet.addRow({
                ...s,
                // Ensure numeric values are treated as numbers if possible
                preReadingRaw: parseFloat(s.preReadingRaw) || s.preReadingRaw,
                preReadingStd: parseFloat(s.preReadingStd) || s.preReadingStd,
            });
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `LRS_Master_Report.xlsx`);
    } catch (e) { console.error(e); alert("Export Error"); }
  };

  // --- RENDER ---
  return (
    <div className="h-full flex flex-col text-slate-800 font-sans p-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
            <h2 className="m-0 text-slate-800 font-extrabold text-2xl flex items-center gap-2"><ClipboardList className="w-6 h-6 text-red-500" /> KTEA Reporter</h2>
            <div className="text-[10px] bg-sky-100 text-sky-700 px-2.5 py-0.5 rounded-full font-bold border border-sky-200">Azure Online</div>
        </div>
        <div className="flex gap-2">
            <button onClick={calculateGrowth} className="bg-white border border-gray-300 px-3 py-1.5 rounded-md text-xs font-bold text-slate-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors shadow-sm">
                <Calculator className="w-3.5 h-3.5" /> Calc Growth
            </button>
            <button onClick={generatePreviewData} className="bg-purple-600 border border-purple-700 px-3 py-1.5 rounded-md text-xs font-bold text-white shadow-sm hover:bg-purple-700 flex items-center gap-1.5 transition-colors">
                {loadingPreview ? <span className="animate-spin">⏳</span> : <Eye className="w-3.5 h-3.5" />} Spreadsheet Preview
            </button>
            <button onClick={downloadReport} className="bg-white border border-gray-300 px-3 py-1.5 rounded-md text-xs font-bold text-slate-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors shadow-sm"><Download className="w-3.5 h-3.5" /> Master Export</button>
        </div>
      </div>

      {msg && <div className="absolute top-5 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-green-600 text-white rounded-full text-sm font-bold shadow-lg z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-2"><CheckCircle className="w-4 h-4" /> {msg}</div>}

      <div className="flex gap-5 flex-1 overflow-hidden">
        {/* MAIN FORM AREA */}
        <div className="flex-1 bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-sm flex flex-col border border-gray-200 overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
                <div className="flex gap-3 mb-6 items-end">
                    <div className="flex-1"> <label className="text-[11px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">Teacher</label> <input {...register("teacherName")} className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" /> </div>
                    <div className="flex-1"> <label className="text-[11px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">Unit</label> <select {...register("unitName")} className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"><option value="">Select...</option>{UNIT_CONFIG.map(u => <option key={u.key} value={u.key}>{u.label}</option>)}</select> </div>
                    <div className="flex-[1.5]"> <label className="text-[11px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">Student Name</label> <input {...register("studentName")} className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold border-l-4 border-l-blue-500" /> </div>
                    <div className="w-[70px]"> <label className="text-[11px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">Grade</label> <select {...register("gradeLevel")} className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"><option value="9">9</option><option value="10">10</option><option value="11">11</option><option value="12">12</option></select> </div>
                    <div className="w-[130px]"> <label className="text-[11px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">Admit</label> <input type="date" {...register("admitDate")} className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" /> </div>
                    <div className="w-[130px]"> <label className="text-[11px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">Discharge</label> <input type="date" {...register("dischargeDate")} className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" /> </div>
                </div>

                <div className="flex gap-5 flex-1 mb-6">
                    <div className="flex-1 bg-white rounded-xl border border-blue-100 overflow-hidden flex flex-col shadow-sm">
                        <div className="p-3 text-center font-extrabold text-xs tracking-widest text-blue-600 bg-blue-50/50 border-b border-blue-100">PRE-TEST</div>
                        <div className="p-5">
                            <ScoreRow label="Reading Comp" type="preReading" register={register} errors={errors} />
                            <ScoreRow label="Math Concepts" type="preMath" register={register} errors={errors} />
                            <ScoreRow label="Writing Fluency" type="preWriting" register={register} errors={errors} />
                        </div>
                    </div>
                    <div className="flex-1 bg-white rounded-xl border border-green-100 overflow-hidden flex flex-col shadow-sm">
                        <div className="p-3 text-center font-extrabold text-xs tracking-widest text-green-600 bg-green-50/50 border-b border-green-100">POST-TEST</div>
                        <div className="p-5">
                            <ScoreRow label="Reading Comp" type="postReading" register={register} errors={errors} />
                            <ScoreRow label="Math Concepts" type="postMath" register={register} errors={errors} />
                            <ScoreRow label="Writing Fluency" type="postWriting" register={register} errors={errors} />
                        </div>
                    </div>
                </div>

                <div className="mt-auto flex gap-3 pt-4 border-t border-gray-100">
                    {editingId ? (
                        <button type="submit" className="flex-[2] p-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-md"><Zap className="w-4 h-4" /> UPDATE RECORD</button>
                    ) : (
                        <>
                            <button type="submit" onClick={() => setSubmitMode('queue')} className="flex-1 p-3 bg-slate-700 text-white rounded-lg font-bold hover:bg-slate-600 transition-colors shadow-md flex items-center justify-center gap-2"><ArrowDown className="w-4 h-4" /> ADD TO QUEUE</button>
                            <button type="submit" onClick={() => setSubmitMode('direct')} className="flex-1 p-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-md flex items-center justify-center gap-2"><Send className="w-4 h-4" /> SAVE & SUBMIT</button>
                        </>
                    )}
                    <button type="button" onClick={() => reset()} className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 font-bold transition-colors">Clear</button>
                </div>
            </form>
        </div>

        {/* QUEUE SIDEBAR */}
        <div className="w-72 bg-white rounded-xl p-5 flex flex-col border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100 text-sm text-slate-700">
                <strong className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-slate-400" /> Batch Queue</strong> 
                <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-[10px] font-bold">{queue.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-1">
                {queue.map((item) => (
                  <div key={item.tempId} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center border border-gray-100 group hover:border-gray-300 transition-colors">
                    <div><div className="font-bold text-xs text-slate-700">{item.studentName}</div></div>
                    <button onClick={() => setQueue(queue.filter(q => q.tempId !== item.tempId))} className="text-gray-400 hover:text-red-500 p-1 transition-colors"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                {queue.length === 0 && <div className="text-center text-gray-300 text-xs italic mt-10">Queue is empty</div>}
            </div>
            <button onClick={uploadBatch} disabled={saving || queue.length === 0} className="w-full p-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md">{saving ? "Saving..." : <><Send className="w-4 h-4" /> SUBMIT BATCH</>}</button>
        </div>
      </div>
      
      {/* SEARCH DROPDOWN */}
      {searchResults.length > 0 && (
         <div className="absolute top-[70px] right-5 w-80 bg-white rounded-xl shadow-2xl z-50 overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
             <div className="p-3 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50">DB Results</div>
             {searchResults.map(s => (
               <div key={s.id} onClick={() => loadStudent(s)} className="p-3 border-b border-gray-50 cursor-pointer flex justify-between items-center hover:bg-blue-50 transition-colors group">
                 <div className="text-sm text-slate-700"><strong className="group-hover:text-blue-600 transition-colors">{s.studentName}</strong> <span className="text-xs text-gray-400">({s.gradeLevel}th)</span></div>
                 <button onClick={(e) => handleDelete(s.id, s.studentName, e)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
               </div>
             ))}
         </div>
      )}

      {/* --- SPREADSHEET PREVIEW MODAL --- */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex justify-center items-center backdrop-blur-sm p-10 print:p-0">
            <div className="bg-white w-full h-full max-w-6xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:max-w-none print:max-h-none print:rounded-none print:shadow-none print:h-auto print:w-auto print:absolute print:inset-0 print:z-[9999]">
                <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50 print:hidden">
                    <h3 className="m-0 text-lg font-bold text-slate-700 flex items-center gap-2"><Eye className="w-5 h-5 text-purple-500" /> Spreadsheet Preview</h3>
                    <div className="flex gap-2">
                        <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1"><Printer className="w-4 h-4" /> Print</button>
                        <button onClick={() => setShowPreview(false)} className="bg-white border border-gray-300 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-100 hover:text-red-600 transition-colors flex items-center gap-1"><X className="w-4 h-4" /> Close</button>
                    </div>
                </div>
                <div className="flex-1 p-8 overflow-auto bg-slate-50 print:bg-white print:p-4 print:overflow-visible">
                    {Object.keys(previewData).length === 0 ? <p className="text-center text-gray-400">No data found.</p> : 
                     Object.keys(previewData).sort().map(unit => (
                        <div key={unit} className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <h4 className="bg-slate-100 p-3 m-0 border-b border-gray-200 font-bold text-sm text-slate-700 uppercase tracking-wider flex justify-between items-center">
                                <span>{unit}</span>
                                <span className="text-[10px] bg-white border border-gray-300 px-2 py-0.5 rounded-full text-slate-500">{previewData[unit].length} Students</span>
                            </h4>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-[10px] font-sans">
                                    <thead>
                                        <tr className="bg-slate-800 text-white print:bg-black">
                                            <th colSpan="2" className="border border-slate-600 p-1">Student</th>
                                            <th colSpan="9" className="border border-slate-600 p-1 bg-sky-700 text-sky-50">PRE-TEST (Entry)</th>
                                            <th colSpan="9" className="border border-slate-600 p-1 bg-emerald-700 text-emerald-50">POST-TEST (Exit)</th>
                                            <th colSpan="3" className="border border-slate-600 p-1">Admin</th>
                                        </tr>
                                        <tr className="bg-slate-100 text-slate-600 font-bold text-[9px] uppercase tracking-wider">
                                            <th className="border border-slate-300 p-1 w-32 text-left">Name</th>
                                            <th className="border border-slate-300 p-1 w-8">Gr</th>
                                            
                                            {/* Pre Headers */}
                                            <th className="border border-slate-300 p-1 bg-sky-50 text-sky-800" colSpan="3">Reading</th>
                                            <th className="border border-slate-300 p-1 bg-sky-50 text-sky-800" colSpan="3">Math</th>
                                            <th className="border border-slate-300 p-1 bg-sky-50 text-sky-800" colSpan="3">Writing</th>

                                            {/* Post Headers */}
                                            <th className="border border-slate-300 p-1 bg-emerald-50 text-emerald-800" colSpan="3">Reading</th>
                                            <th className="border border-slate-300 p-1 bg-emerald-50 text-emerald-800" colSpan="3">Math</th>
                                            <th className="border border-slate-300 p-1 bg-emerald-50 text-emerald-800" colSpan="3">Writing</th>

                                            <th className="border border-slate-300 p-1 w-16">Admit</th>
                                            <th className="border border-slate-300 p-1 w-16">Disch</th>
                                            <th className="border border-slate-300 p-1 w-20">Teacher</th>
                                        </tr>
                                        <tr className="text-[8px] text-center text-slate-400 bg-white">
                                            <td className="border border-slate-200"></td>
                                            <td className="border border-slate-200"></td>
                                            
                                            {/* Pre Sub-headers */}
                                            {[1,2,3].map(k => (
                                                <React.Fragment key={k}>
                                                    <td className="border border-slate-200 bg-sky-50/50">Raw</td>
                                                    <td className="border border-slate-200 bg-sky-50/50">Std</td>
                                                    <td className="border border-slate-200 bg-sky-50/50 font-bold text-sky-700">GE</td>
                                                </React.Fragment>
                                            ))}

                                            {/* Post Sub-headers */}
                                            {[1,2,3].map(k => (
                                                <React.Fragment key={k}>
                                                    <td className="border border-slate-200 bg-emerald-50/50">Raw</td>
                                                    <td className="border border-slate-200 bg-emerald-50/50">Std</td>
                                                    <td className="border border-slate-200 bg-emerald-50/50 font-bold text-emerald-700">GE</td>
                                                </React.Fragment>
                                            ))}
                                            
                                            <td colSpan="3" className="border border-slate-200"></td>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData[unit].map((s, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 text-center border-b border-gray-200">
                                                <td className="border-r border-gray-200 p-1 text-left font-bold text-slate-700 truncate max-w-[150px]">{s.studentName}</td>
                                                <td className="border-r border-gray-200 p-1">{s.gradeLevel}</td>

                                                {/* Pre Scores */}
                                                <td className="p-1 bg-sky-50/30 border-r border-sky-100">{s.preReadingRaw}</td>
                                                <td className="p-1 bg-sky-50/30 border-r border-sky-100">{s.preReadingStd}</td>
                                                <td className="p-1 bg-sky-100/50 border-r border-sky-200 font-bold text-sky-900">{s.preReadingGE}</td>

                                                <td className="p-1 bg-sky-50/30 border-r border-sky-100">{s.preMathRaw}</td>
                                                <td className="p-1 bg-sky-50/30 border-r border-sky-100">{s.preMathStd}</td>
                                                <td className="p-1 bg-sky-100/50 border-r border-sky-200 font-bold text-sky-900">{s.preMathGE}</td>

                                                <td className="p-1 bg-sky-50/30 border-r border-sky-100">{s.preWritingRaw}</td>
                                                <td className="p-1 bg-sky-50/30 border-r border-sky-100">{s.preWritingStd}</td>
                                                <td className="p-1 bg-sky-100/50 border-r border-slate-300 font-bold text-sky-900">{s.preWritingGE}</td>

                                                {/* Post Scores */}
                                                <td className="p-1 bg-emerald-50/30 border-r border-emerald-100">{s.postReadingRaw}</td>
                                                <td className="p-1 bg-emerald-50/30 border-r border-emerald-100">{s.postReadingStd}</td>
                                                <td className="p-1 bg-emerald-100/50 border-r border-emerald-200 font-bold text-emerald-900">{s.postReadingGE}</td>

                                                <td className="p-1 bg-emerald-50/30 border-r border-emerald-100">{s.postMathRaw}</td>
                                                <td className="p-1 bg-emerald-50/30 border-r border-emerald-100">{s.postMathStd}</td>
                                                <td className="p-1 bg-emerald-100/50 border-r border-emerald-200 font-bold text-emerald-900">{s.postMathGE}</td>

                                                <td className="p-1 bg-emerald-50/30 border-r border-emerald-100">{s.postWritingRaw}</td>
                                                <td className="p-1 bg-emerald-50/30 border-r border-emerald-100">{s.postWritingStd}</td>
                                                <td className="p-1 bg-emerald-100/50 border-r border-slate-300 font-bold text-emerald-900">{s.postWritingGE}</td>
                                                
                                                <td className="p-1 text-[9px] text-slate-500 border-r border-gray-200">{s.admitDate}</td>
                                                <td className="p-1 text-[9px] text-slate-500 border-r border-gray-200">{s.dischargeDate}</td>
                                                <td className="p-1 text-[9px] text-slate-500 truncate max-w-[80px]">{s.teacherName}</td>
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
function ScoreRow({ label, type, register, errors }) {
    const rawError = errors?.[`${type}Raw`];
    const stdError = errors?.[`${type}Std`];

    return (
        <div className="flex items-center mb-3">
            <label className="flex-1 text-xs font-bold text-gray-500">{label}</label>
            <div className="flex gap-1.5 flex-[2]">
                <div className="w-full relative">
                    <input {...register(`${type}Raw`, { min: { value: 0, message: "Min 0" } })} placeholder="Raw" type="number" className={`w-full p-2 rounded border text-xs text-center focus:ring-2 outline-none ${rawError ? 'border-red-500 bg-red-50 focus:ring-red-200' : 'border-gray-200 bg-gray-50 focus:ring-blue-500'}`} />
                    {rawError && <div className="absolute -top-6 left-0 right-0 bg-red-500 text-white text-[9px] rounded px-1 py-0.5 text-center shadow-sm z-10">{rawError.message}</div>}
                </div>
                <div className="w-full relative">
                    <input {...register(`${type}Std`, { min: { value: 40, message: "Min 40" }, max: { value: 160, message: "Max 160" } })} placeholder="Std" type="number" className={`w-full p-2 rounded border text-xs text-center focus:ring-2 outline-none ${stdError ? 'border-red-500 bg-red-50 focus:ring-red-200' : 'border-gray-200 bg-gray-50 focus:ring-blue-500'}`} />
                    {stdError && <div className="absolute -top-6 left-0 right-0 bg-red-500 text-white text-[9px] rounded px-1 py-0.5 text-center shadow-sm z-10">{stdError.message}</div>}
                </div>
                <input {...register(`${type}GE`)} placeholder="GE" type="text" className="w-full p-2 rounded border border-gray-200 bg-gray-50 text-xs text-center focus:ring-2 focus:ring-blue-500 outline-none" />
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

export default KTEAReporter;