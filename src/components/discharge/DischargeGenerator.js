import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import { cosmosService } from '../../services/cosmosService';
import { Printer, FileText, Loader2, CheckCircle, Save, Download } from 'lucide-react';

// Boilerplate text from your template
const BOILERPLATE_INTRO = "Lakeland Regional School operates within a Level IV residential treatment center. Students are admitted for clinical treatment, and the school provides academic instruction during their stay. Classrooms include students from multiple states and a wide range of grade and ability levels. Instruction is based on Missouri’s Major Instructional Goals, and collaboration with sending schools occurs when possible.";

const DischargeGenerator = ({ user, activeStudent }) => {
  const { register, setValue, watch, handleSubmit, getValues } = useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dbRecord, setDbRecord] = useState(null);

  // Watch all fields for live preview
  const values = watch();

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

  const handleSaveAndExport = async () => {
    setSaving(true);
    const data = getValues();

    try {
        // 1. Save Narratives to DB
        if (dbRecord && dbRecord.id) {
            const updatedData = {
                ...dbRecord,
                admissionReason: data.admissionReason,
                behaviorNarrative: data.behaviorNarrative,
                analysisNarrative: data.analysisNarrative
            };
            await cosmosService.updateItem(dbRecord.id, updatedData);
        }

        // 2. Log Audit
        await cosmosService.logAudit(user, 'Generated Discharge', `Generated discharge summary for ${data.studentName}`);

    } catch (error) {
        console.error("Auto-save failed:", error);
    } finally {
        setSaving(false);
    }
  };

  const handleDownloadDocx = async () => {
    const data = getValues();
    
    // Helper to calculate change for the Word Doc
    const getChange = (pre, post) => {
        const p1 = parseFloat(pre);
        const p2 = parseFloat(post);
        if (isNaN(p1) || isNaN(p2)) return "--";
        const diff = (p2 - p1).toFixed(1);
        return (diff > 0 ? "+" : "") + diff;
    };

    // Helper for table cells
    const createCell = (text, bold = false) => {
        return new TableCell({
            children: [new Paragraph({ 
                children: [new TextRun({ text: text || "-", bold: bold, size: 22 })], // 11pt
                alignment: AlignmentType.CENTER 
            })],
            verticalAlign: "center",
        });
    };

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                // HEADER
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "LAKELAND REGIONAL SCHOOL", bold: true, size: 28 })], // 14pt
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "EDUCATIONAL DISCHARGE NARRATIVE", bold: true, size: 24 })], // 12pt
                    spacing: { after: 400 }
                }),

                // STUDENT INFO ROW 1
                new Paragraph({
                    children: [
                        new TextRun({ text: "Student Name: ", bold: true }),
                        new TextRun({ text: data.studentName || "" }),
                        new TextRun({ text: "\t\tGrade: ", bold: true }),
                        new TextRun({ text: data.gradeLevel || "" }),
                        new TextRun({ text: "\t\tDOB/Age: ", bold: true }),
                        new TextRun({ text: data.age || "" }),
                    ],
                    tabStops: [
                        { type: "left", position: 4000 },
                        { type: "left", position: 7000 },
                    ]
                }),
                // STUDENT INFO ROW 2
                new Paragraph({
                    children: [
                        new TextRun({ text: "Admission Date: ", bold: true }),
                        new TextRun({ text: data.admitDate || "" }),
                        new TextRun({ text: "\t\tDischarge Date: ", bold: true }),
                        new TextRun({ text: data.dischargeDate || "" }),
                    ],
                    tabStops: [
                        { type: "left", position: 4000 },
                    ],
                    spacing: { after: 400 }
                }),

                // NARRATIVES
                new Paragraph({ children: [new TextRun(data.admissionReason || "")] }),
                new Paragraph({ children: [new TextRun(BOILERPLATE_INTRO)], spacing: { before: 200 } }),

                // BEHAVIOR HEADER
                new Paragraph({
                    children: [new TextRun({ text: "CLASSROOM PERFORMANCE & BEHAVIOR", bold: true, underline: { type: "single" } })],
                    spacing: { before: 400, after: 100 }
                }),
                new Paragraph({ children: [new TextRun(data.behaviorNarrative || "")] }),

                // SCORES HEADER
                new Paragraph({
                    children: [new TextRun({ text: "KTEA III ASSESSMENT RESULTS", bold: true, underline: { type: "single" } })],
                    spacing: { before: 400, after: 100 }
                }),

                // SCORES TABLE
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({ children: [createCell("Subject", true), createCell("Pre Test (GE)", true), createCell("Post Test (GE)", true), createCell("Change", true)] }),
                        new TableRow({ children: [createCell("Reading", true), createCell(data.preReading), createCell(data.postReading), createCell(getChange(data.preReading, data.postReading))] }),
                        new TableRow({ children: [createCell("Math", true), createCell(data.preMath), createCell(data.postMath), createCell(getChange(data.preMath, data.postMath))] }),
                        new TableRow({ children: [createCell("Writing", true), createCell(data.preWriting), createCell(data.postWriting), createCell(getChange(data.preWriting, data.postWriting))] }),
                    ]
                }),

                // ANALYSIS
                new Paragraph({ children: [new TextRun(data.analysisNarrative || "")], spacing: { before: 200 } }),

                // FOOTER
                new Paragraph({
                    children: [new TextRun(`${data.studentName || "The student"} was discharged successfully from residential care on ${data.dischargeDate || "[Date]"}. If further information is needed, please contact Lakeland Regional School.`)],
                    spacing: { before: 600, after: 400 }
                }),
                new Paragraph({
                    children: [new TextRun({ text: "John Gawin, MSEd, School Instructor", bold: true })]
                }),
                new Paragraph({ text: "Lakeland Regional School – 1-417-680-0166" }),
                new Paragraph({ text: "john.gawin@lakelandbehavioralhealth.com" }),
            ]
        }]
    });

    // Generate and Save
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${data.studentName || "Student"}_Discharge_Summary.docx`);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-100 overflow-hidden font-sans">
      
      {/* LEFT COLUMN: EDITOR FORM */}
      <div className="w-full lg:w-[35%] bg-white/70 backdrop-blur-xl p-6 flex flex-col gap-4 overflow-y-auto border-r border-slate-200/50 print:hidden shadow-2xl z-10">
        
        {/* Header / Status */}
        <div className="mb-2">
            <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3 mb-1">
                <span className="p-2 bg-indigo-100 rounded-xl text-indigo-600"><FileText className="w-6 h-6" /></span>
                Discharge Writer
            </h2>
            <p className="text-slate-500 text-sm">Edit the narrative below. The preview updates automatically.</p>
            
            {loading ? (
                <div className="mt-3 p-3 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-2 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" /> Syncing with Azure...
                </div>
            ) : dbRecord ? (
                <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-2 border border-emerald-200/50">
                    <CheckCircle className="w-4 h-4" /> Data Loaded from KTEA
                </div>
            ) : (
                <div className="mt-3 p-3 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">
                    Ready for input
                </div>
            )}
        </div>

        {/* Form Fields */}
        <form className="flex flex-col gap-6">
            
            {/* Section: Student Info */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider border-b border-slate-200/80 pb-2">Student Information</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Student Name</label>
                        <input {...register("studentName")} className="w-full p-2.5 border border-slate-300/80 rounded-lg text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Grade Level</label>
                        <input {...register("gradeLevel")} className="w-full p-2.5 border border-slate-300/80 rounded-lg text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">DOB / Age</label>
                        <input {...register("age")} className="w-full p-2.5 border border-slate-300/80 rounded-lg text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Admit Date</label>
                        <input type="date" {...register("admitDate")} className="w-full p-2.5 border border-slate-300/80 rounded-lg text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Discharge Date</label>
                        <input type="date" {...register("dischargeDate")} className="w-full p-2.5 border border-slate-300/80 rounded-lg text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" />
                    </div>
                </div>
            </div>

            {/* Section: Narratives */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider border-b border-slate-200/80 pb-2">Narratives</h3>
                
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Reason for Admission</label>
                    <textarea 
                        {...register("admissionReason")} 
                        rows={3}
                        className="w-full p-2.5 border border-slate-300/80 rounded-lg text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
                        placeholder="e.g. was admitted for educational services..."
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Classroom Performance & Behavior</label>
                    <textarea 
                        {...register("behaviorNarrative")} 
                        rows={5}
                        className="w-full p-2.5 border border-slate-300/80 rounded-lg text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
                        placeholder="Describe work ethic, behavior, strengths..."
                    />
                </div>
            </div>

            {/* Section: Scores */}
            <div className="space-y-3 bg-slate-100/50 p-4 rounded-xl border border-slate-200/80">
                <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider border-b border-slate-200/80 pb-2">KTEA-III Scores (GE)</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="text-xs font-bold text-slate-500">Subject</div>
                    <div className="text-xs font-bold text-slate-500">Pre-Test</div>
                    <div className="text-xs font-bold text-slate-500">Post-Test</div>

                    <div className="text-sm font-semibold text-slate-700 self-center text-left pl-1">Reading</div>
                    <input {...register("preReading")} className="p-2 border border-slate-300/80 rounded-lg text-sm text-center focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" placeholder="-" />
                    <input {...register("postReading")} className="p-2 border border-slate-300/80 rounded-lg text-sm text-center focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" placeholder="-" />

                    <div className="text-sm font-semibold text-slate-700 self-center text-left pl-1">Math</div>
                    <input {...register("preMath")} className="p-2 border border-slate-300/80 rounded-lg text-sm text-center focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" placeholder="-" />
                    <input {...register("postMath")} className="p-2 border border-slate-300/80 rounded-lg text-sm text-center focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" placeholder="-" />

                    <div className="text-sm font-semibold text-slate-700 self-center text-left pl-1">Writing</div>
                    <input {...register("preWriting")} className="p-2 border border-slate-300/80 rounded-lg text-sm text-center focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" placeholder="-" />
                    <input {...register("postWriting")} className="p-2 border border-slate-300/80 rounded-lg text-sm text-center focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" placeholder="-" />
                </div>
            </div>

            {/* Section: Analysis */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider border-b border-slate-200/80 pb-2">Analysis</h3>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Score Analysis</label>
                    <textarea 
                        {...register("analysisNarrative")} 
                        rows={4}
                        className="w-full p-2.5 border border-slate-300/80 rounded-lg text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
                        placeholder="The comparative data indicates..."
                    />
                </div>
            </div>

        </form>

        {/* Action Button */}
        <div className="mt-auto pt-5 border-t border-slate-200/80 flex gap-3">
            <button 
                onClick={async () => {
                    await handleSaveAndExport();
                    handlePrint();
                }} 
                disabled={saving}
                className="flex-1 py-3 bg-white text-indigo-600 rounded-xl font-bold shadow-lg shadow-slate-200/50 border border-slate-300/80 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />} 
                Print / PDF
            </button>
            <button 
                onClick={async () => {
                    await handleSaveAndExport();
                    handleDownloadDocx();
                }} 
                disabled={saving}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} 
                Word Doc
            </button>
        </div>
      </div>

      {/* RIGHT COLUMN: LIVE PREVIEW */}
      <div className="flex-1 bg-slate-100 p-8 overflow-y-auto flex justify-center print:p-0 print:bg-white print:overflow-visible">
        <div className="page bg-white w-[8.5in] min-h-[11in] p-[0.75in] shadow-2xl shadow-slate-300/60 text-black font-serif print:shadow-none print:w-full print:m-0 print:absolute print:top-0 print:left-0">
            
            {/* DOCUMENT HEADER */}
            <header className="text-center mb-8 border-b-2 border-black pb-4">
                <h1 className="m-0 text-2xl uppercase tracking-widest font-bold text-black">LAKELAND REGIONAL SCHOOL</h1>
                <div className="text-base font-bold mt-2 text-black">EDUCATIONAL DISCHARGE NARRATIVE</div>
            </header>

            {/* DEMOGRAPHICS */}
            <section className="flex flex-col gap-2 mb-6 border border-black p-4 text-[11pt]">
                <div className="flex justify-between">
                    <div><span className="font-bold">Student Name:</span> {values.studentName}</div>
                    <div><span className="font-bold">Grade:</span> {values.gradeLevel}</div>
                    <div><span className="font-bold">DOB/Age:</span> {values.age}</div>
                </div>
                <div className="flex justify-between">
                    <div><span className="font-bold">Admission Date:</span> {values.admitDate}</div>
                    <div><span className="font-bold">Discharge Date:</span> {values.dischargeDate}</div>
                </div>
            </section>

            {/* CONTENT */}
            <section className="text-[12pt] leading-relaxed space-y-4">
                
                {/* Intro */}
                <div className="text-justify">
                    {values.admissionReason || "[Student Name] was admitted for educational services..."}
                </div>

                <div className="text-justify">{BOILERPLATE_INTRO}</div>

                {/* Behavior */}
                <div>
                    <h4 className="text-[12pt] uppercase border-b border-black mt-6 mb-2 font-bold">Classroom Performance & Behavior</h4>
                    <div className="whitespace-pre-wrap text-justify min-h-[2rem]">
                        {values.behaviorNarrative || "No behavior narrative provided."}
                    </div>
                </div>

                {/* Scores Table */}
                <div>
                    <h4 className="text-[12pt] uppercase border-b border-black mt-6 mb-2 font-bold">KTEA III Assessment Results</h4>
                    <table className="w-full border-collapse mb-4 mt-2 text-[11pt]">
                        <thead>
                            <tr className="bg-gray-100 print:bg-gray-100">
                                <th className="border border-black p-2 text-center font-bold">Subject</th>
                                <th className="border border-black p-2 text-center font-bold">Pre Test (GE)</th>
                                <th className="border border-black p-2 text-center font-bold">Post Test (GE)</th>
                                <th className="border border-black p-2 text-center font-bold">Change</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-black p-2 text-center font-bold">Reading</td>
                                <td className="border border-black p-2 text-center">{values.preReading || "-"}</td>
                                <td className="border border-black p-2 text-center">{values.postReading || "-"}</td>
                                <td className="border border-black p-2 text-center">
                                    {calculateChange(values.preReading, values.postReading)}
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 text-center font-bold">Math</td>
                                <td className="border border-black p-2 text-center">{values.preMath || "-"}</td>
                                <td className="border border-black p-2 text-center">{values.postMath || "-"}</td>
                                <td className="border border-black p-2 text-center">
                                    {calculateChange(values.preMath, values.postMath)}
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 text-center font-bold">Writing</td>
                                <td className="border border-black p-2 text-center">{values.preWriting || "-"}</td>
                                <td className="border border-black p-2 text-center">{values.postWriting || "-"}</td>
                                <td className="border border-black p-2 text-center">
                                    {calculateChange(values.preWriting, values.postWriting)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Analysis */}
                <div>
                    <div className="whitespace-pre-wrap text-justify min-h-[2rem]">
                        {values.analysisNarrative || "The comparative data indicates..."}
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="mt-12 border-t border-black pt-6 text-[11pt]">
                <p className="text-justify">
                    {values.studentName || "The student"} was discharged successfully from residential care on {values.dischargeDate || "[Date]"}. 
                    If further information is needed, please contact Lakeland Regional School.
                </p>
                <div className="mt-8">
                    <div className="font-bold">John Gawin, MSEd, School Instructor</div>
                    <div>Lakeland Regional School – 1-417-680-0166</div>
                    <div>john.gawin@lakelandbehavioralhealth.com</div>
                </div>
            </footer>

        </div>
      </div>
    </div>
  );
};

// Helper for score change
const calculateChange = (pre, post) => {
    const p1 = parseFloat(pre);
    const p2 = parseFloat(post);
    if (isNaN(p1) || isNaN(p2)) return "--";
    const diff = (p2 - p1).toFixed(1);
    return (diff > 0 ? "+" : "") + diff;
};

// CSS for Print Mode
const printStyles = `
  @media print {
    @page { margin: 0; size: auto; }
    body * { visibility: hidden; }
    .page, .page * { visibility: visible; }
    .page { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0.5in; box-shadow: none !important; }
    /* Hide scrollbars in print */
    ::-webkit-scrollbar { display: none; }
  }
`;

// Inject Print CSS
const styleSheet = document.createElement("style");
styleSheet.innerText = printStyles;
document.head.appendChild(styleSheet);

export default DischargeGenerator;