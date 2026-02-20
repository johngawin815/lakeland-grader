import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { cosmosService } from '../../services/cosmosService';
import { Printer, FileText, Loader2, CheckCircle } from 'lucide-react';

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
    <div className="flex h-full bg-gray-50">
      
      {/* LEFT: CONTROLS (Screen Only) */}
      <div className="w-[300px] p-6 bg-slate-800 text-white flex flex-col print:hidden">
        <h2 className="text-white m-0 mb-2.5 text-xl font-bold flex items-center gap-2"><FileText className="w-5 h-5" /> Discharge Writer</h2>
        
        {loading ? (
           <div className="p-2.5 rounded-md bg-blue-600 text-center font-bold text-xs mt-2.5 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Syncing with Azure...</div>
        ) : dbRecord ? (
           <div className="p-2.5 rounded-md bg-green-600 text-center font-bold text-xs mt-2.5 flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Data Loaded from KTEA</div>
        ) : (
           <div className="p-2.5 rounded-md bg-slate-500 text-center font-bold text-xs mt-2.5">Waiting for Student...</div>
        )}

        <div className="mt-5">
            <p className="text-slate-300 text-xs leading-relaxed">
               This tool automatically pulls dates and scores from the KTEA Reporter. 
               Review the generated narrative below and edit as needed.
            </p>
            <button onClick={handlePrint} className="w-full p-4 bg-blue-500 text-white border-none rounded-lg font-bold text-base cursor-pointer mt-5 hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-md"><Printer className="w-5 h-5" /> Print / Save PDF</button>
        </div>
      </div>

      {/* RIGHT: THE DOCUMENT (Visual Representation) */}
      <div className="flex-1 p-10 overflow-y-auto flex justify-center bg-gray-100 print:p-0 print:bg-white print:overflow-visible">
        <div className="page bg-white w-[8.5in] min-h-[11in] p-[0.75in] shadow-xl font-serif text-black print:shadow-none print:w-full print:m-0 print:absolute print:top-0 print:left-0">
            
            {/* HEADER */}
            <header className="text-center mb-8 border-b-2 border-black pb-2">
                <h1 className="m-0 text-2xl uppercase tracking-widest font-bold">LAKELAND REGIONAL SCHOOL</h1>
                <div className="text-base font-bold mt-1">EDUCATIONAL DISCHARGE NARRATIVE</div>
            </header>

            {/* DEMOGRAPHICS GRID */}
            <section className="flex flex-col gap-2.5 mb-6 border border-gray-300 p-4 print:border-black">
                <div className="flex gap-5 items-baseline">
                    <div className="flex items-baseline gap-1">
                        <span className="font-bold text-[11pt]">Student Name:</span>
                        <input {...register("studentName")} className="border-none border-b border-gray-300 font-serif text-[11pt] w-[180px] px-1 py-0.5 text-black focus:outline-none focus:border-black bg-transparent print:border-none" />
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="font-bold text-[11pt]">Grade:</span>
                        <input {...register("gradeLevel")} className="border-none border-b border-gray-300 font-serif text-[11pt] w-[50px] px-1 py-0.5 text-black focus:outline-none focus:border-black bg-transparent print:border-none" />
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="font-bold text-[11pt]">DOB/Age:</span>
                        <input {...register("age")} className="border-none border-b border-gray-300 font-serif text-[11pt] w-[50px] px-1 py-0.5 text-black focus:outline-none focus:border-black bg-transparent print:border-none" />
                    </div>
                </div>
                <div className="flex gap-5 items-baseline">
                    <div className="flex items-baseline gap-1">
                        <span className="font-bold text-[11pt]">Admission Date:</span>
                        <input {...register("admitDate")} className="border-none border-b border-gray-300 font-serif text-[11pt] w-[180px] px-1 py-0.5 text-black focus:outline-none focus:border-black bg-transparent print:border-none" />
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="font-bold text-[11pt]">Discharge Date:</span>
                        <input {...register("dischargeDate")} className="border-none border-b border-gray-300 font-serif text-[11pt] w-[180px] px-1 py-0.5 text-black focus:outline-none focus:border-black bg-transparent print:border-none" />
                    </div>
                </div>
            </section>

            {/* NARRATIVE SECTIONS */}
            <section className="text-[12pt] leading-relaxed">
                
                {/* 1. Admission Context */}
                <div className="mb-4">
                    <textarea 
                        {...register("admissionReason")} 
                        className="w-full border border-dashed border-gray-300 p-1 font-serif text-[11pt] resize-y leading-relaxed focus:outline-none focus:border-black bg-transparent print:border-none print:resize-none" 
                        placeholder="[Student Name] was admitted for educational services while receiving residential treatment..."
                        defaultValue={watch("studentName") ? `${watch("studentName")} was admitted for educational services...` : ""}
                    />
                </div>

                <div className="mb-4 text-justify">{BOILERPLATE_INTRO}</div>

                {/* 2. Behavior/Academics */}
                <h4 className="text-[12pt] uppercase border-b border-gray-300 mt-5 mb-2 font-bold print:border-black">Classroom Performance & Behavior</h4>
                <textarea 
                    {...register("behaviorNarrative")} 
                    className="w-full border border-dashed border-gray-300 p-1 font-serif text-[11pt] resize-y leading-relaxed focus:outline-none focus:border-black bg-transparent h-[120px] print:border-none print:resize-none" 
                    placeholder="Describe student's work ethic, behavior, and strengths..."
                />

                {/* 3. KTEA TABLE */}
                <h4 className="text-[12pt] uppercase border-b border-gray-300 mt-5 mb-2 font-bold print:border-black">KTEA III Assessment Results</h4>
                <table className="w-full border-collapse mb-5 mt-2">
                    <thead>
                        <tr>
                            <th className="border border-black p-2 bg-gray-100 text-center font-bold print:bg-gray-200">Subject</th>
                            <th className="border border-black p-2 bg-gray-100 text-center font-bold print:bg-gray-200">Pre Test (GE)</th>
                            <th className="border border-black p-2 bg-gray-100 text-center font-bold print:bg-gray-200">Post Test (GE)</th>
                            <th className="border border-black p-2 bg-gray-100 text-center font-bold print:bg-gray-200">Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-black p-2 text-center">Reading</td>
                            <td className="border border-black p-2 text-center"><input {...register("preReading")} className="w-full border-none text-center font-serif text-[11pt] bg-transparent focus:outline-none" /></td>
                            <td className="border border-black p-2 text-center"><input {...register("postReading")} className="w-full border-none text-center font-serif text-[11pt] bg-transparent focus:outline-none" /></td>
                            <td className="border border-black p-2 text-center">--</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 text-center">Math</td>
                            <td className="border border-black p-2 text-center"><input {...register("preMath")} className="w-full border-none text-center font-serif text-[11pt] bg-transparent focus:outline-none" /></td>
                            <td className="border border-black p-2 text-center"><input {...register("postMath")} className="w-full border-none text-center font-serif text-[11pt] bg-transparent focus:outline-none" /></td>
                            <td className="border border-black p-2 text-center">--</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 text-center">Writing</td>
                            <td className="border border-black p-2 text-center"><input {...register("preWriting")} className="w-full border-none text-center font-serif text-[11pt] bg-transparent focus:outline-none" /></td>
                            <td className="border border-black p-2 text-center"><input {...register("postWriting")} className="w-full border-none text-center font-serif text-[11pt] bg-transparent focus:outline-none" /></td>
                            <td className="border border-black p-2 text-center">--</td>
                        </tr>
                    </tbody>
                </table>

                {/* 4. Analysis */}
                <div className="mb-4">
                    <textarea 
                        {...register("analysisNarrative")} 
                        className="w-full border border-dashed border-gray-300 p-1 font-serif text-[11pt] resize-y leading-relaxed focus:outline-none focus:border-black bg-transparent h-[100px] print:border-none print:resize-none" 
                        placeholder="The comparative data indicates..."
                    />
                </div>
            </section>

            {/* FOOTER */}
            <footer className="mt-10 border-t border-gray-300 pt-5 text-[11pt] print:border-black">
                <p>
                    {watch("studentName")} was discharged successfully from residential care on {watch("dischargeDate")}. 
                    If further information is needed, please contact Lakeland Regional School.
                </p>
                <div className="mt-5">
                    <div className="font-bold mt-10">John Gawin, MSEd, School Instructor</div>
                    <div>Lakeland Regional School – 1-417-680-0166</div>
                    <div>john.gawin@lakelandbehavioralhealth.com</div>
                </div>
            </footer>

        </div>
      </div>
    </div>
  );
};

// CSS for Print Mode
const printStyles = `
  @media print {
    body * { visibility: hidden; height: 0; overflow: hidden; }
    .page, .page * { visibility: visible; }
    .page { position: absolute; left: 0; top: 0; margin: 0; padding: 0.5in; box-shadow: none; width: 100%; height: auto; overflow: visible; }
    input, textarea { border: none !important; resize: none; background: transparent; }
  }
`;

// Inject Print CSS
const styleSheet = document.createElement("style");
styleSheet.innerText = printStyles;
document.head.appendChild(styleSheet);

export default DischargeGenerator;