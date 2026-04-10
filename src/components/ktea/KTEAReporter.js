import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { databaseService } from '../../services/databaseService';
import { autoEnrollStudent } from '../../services/defaultEnrollmentService';
import { getCurrentSchoolYear } from '../../utils/smartUtils';
import { generateStudentNumber, formatStudentLabel } from '../../utils/studentUtils';
import { ClipboardList, Download, CheckCircle, Zap, ArrowDown, Send, Trash2, X, Calculator, Target, Telescope, Bird, Leaf, Flame, Droplets, Printer, Table, Filter, Loader2, Layers, Plus, UserPlus, AlertTriangle } from 'lucide-react';
import EditableStudentName from '../EditableStudentName';
const UNIT_CONFIG = [
  { key: "Determination", label: "Determination", icon: Target },
  { key: "Discovery", label: "Discovery", icon: Telescope },
  { key: "Freedom", label: "Freedom", icon: Bird },
  { key: "Harmony", label: "Harmony", icon: Leaf },
  { key: "Integrity", label: "Integrity", icon: Flame },
  { key: "Serenity", label: "Serenity", icon: Droplets }
];

const UNIT_COLORS = {
  Determination: { bg: 'bg-amber-600', text: 'text-amber-900', light: 'bg-amber-50' },
  Discovery: { bg: 'bg-sky-600', text: 'text-sky-900', light: 'bg-sky-50' },
  Freedom: { bg: 'bg-emerald-600', text: 'text-emerald-900', light: 'bg-emerald-50' },
  Harmony: { bg: 'bg-violet-600', text: 'text-violet-900', light: 'bg-violet-50' },
  Integrity: { bg: 'bg-rose-600', text: 'text-rose-900', light: 'bg-rose-50' },
  Serenity: { bg: 'bg-cyan-600', text: 'text-cyan-900', light: 'bg-cyan-50' },
};

const QUARTERS = [
  { value: 1, label: 'Q1', months: 'Jan – Mar', range: [1, 2, 3] },
  { value: 2, label: 'Q2', months: 'Apr – Jun', range: [4, 5, 6] },
  { value: 3, label: 'Q3', months: 'Jul – Sep', range: [7, 8, 9] },
  { value: 4, label: 'Q4', months: 'Oct – Dec', range: [10, 11, 12] },
];

function getBusinessQuarter(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const fiscalYear = d.getFullYear();
  if (month >= 1 && month <= 3) return { quarter: 1, fiscalYear };
  if (month >= 4 && month <= 6) return { quarter: 2, fiscalYear };
  if (month >= 7 && month <= 9) return { quarter: 3, fiscalYear };
  if (month >= 10 && month <= 12) return { quarter: 4, fiscalYear };
  return null;
}

export const calculateGEGrowth = (pre, post) => {
  // Strip non-numeric characters like '>' or '<' often found in GE scores
  const p1 = parseFloat(String(pre).replace(/[^0-9.]/g, ''));
  const p2 = parseFloat(String(post).replace(/[^0-9.]/g, ''));
  if (isNaN(p1) || isNaN(p2)) return "N/A";
  const diff = (p2 - p1).toFixed(1);
  return (diff > 0 ? "+" : "") + diff;
};

function KTEAReporter({ user, activeStudent }) {
  const { register, handleSubmit, reset, setValue, getValues, formState: { errors } } = useForm();

  // STATE
  const [queue, setQueue] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [growthResult, setGrowthResult] = useState(null);
  const submitModeRef = useRef('queue');

  // SPREADSHEET VIEW STATE
  const [showSpreadsheet, setShowSpreadsheet] = useState(false);
  const [spreadsheetData, setSpreadsheetData] = useState({});
  const [loadingSpreadsheet, setLoadingSpreadsheet] = useState(false);
  // Spreadsheet Addition State
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [addingToUnit, setAddingToUnit] = useState(null);
  const [newStudentData, setNewStudentData] = useState({
    studentName: '',
    gradeLevel: 9,
    admitDate: new Date().toISOString().split('T')[0]
  });

  const [deleteChoice, setDeleteChoice] = useState(null); // { reportId, studentId, studentName }
  const [spreadsheetMode, setSpreadsheetMode] = useState('all'); // 'all' or 'discharged'
  const [filterQuarter, setFilterQuarter] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // SEARCH STATE
  const [searchResults, setSearchResults] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [currentDoc, setCurrentDoc] = useState(null);

  // Close spreadsheet modal on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape' && showSpreadsheet) setShowSpreadsheet(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showSpreadsheet]);

  // --- 1. CONNECTIVITY ---
  useEffect(() => {
    if (activeStudent) {
      if (activeStudent.trim()) {
        databaseService.searchKteaReports(activeStudent)
          .then(setSearchResults)
          .catch(error => console.error("Azure Search error:", error));
      }
      if (!editingId) setValue("studentName", activeStudent);
    }
  }, [activeStudent, setValue, editingId]);

  // --- 2. AZURE ACTIONS ---
  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete record for ${name}?`)) return;
    try {
      await databaseService.deleteKteaReport(id);
      setSearchResults(prev => prev.filter(item => item.id !== id));
    } catch (error) { alert("Could not delete."); }
  };

  const loadStudent = (student) => {
    setEditingId(student.id);
    setCurrentDoc(student);
    setSearchResults([]);

    const fields = [
      "studentName", "gradeLevel", "admitDate", "dischargeDate", "teacherName", "unitName",
      "age", "sped504", "title1", "preReadingRaw", "preReadingStd", "preReadingGE", "preMathRaw", "preMathStd", "preMathGE", "preWritingRaw", "preWritingStd", "preWritingGE",
      "postReadingRaw", "postReadingStd", "postReadingGE", "postMathRaw", "postMathStd", "postMathGE", "postWritingRaw", "postWritingStd", "postWritingGE"
    ];
    fields.forEach(f => setValue(f, student[f]));
  };

  const onSubmit = async (data) => {
    if (!data.studentName) return alert("Enter Student Name.");

    // UPDATE EXISTING
    if (editingId && currentDoc) {
      setSaving(true);
      try {
        const updatedDoc = { ...currentDoc, ...data, lastUpdatedBy: user.email };
        await databaseService.updateKteaReport(editingId, updatedDoc);
        setMsg(`Updated: ${data.studentName}`);
        setTimeout(() => setMsg(''), 3000);
        setEditingId(null);
        reset({ teacherName: data.teacherName, unitName: data.unitName, gradeLevel: data.gradeLevel });
        setGrowthResult(null);
      } catch (e) { alert("Update Failed: " + e.message); }
      setSaving(false);
      return;
    }

    // NEW ENTRY
    const fixedName = formatName(data.studentName);
    const newRecord = { ...data, studentName: fixedName, tempId: Date.now() };

    if (submitModeRef.current === 'direct') {
        setSaving(true);
        try {
            await databaseService.addKteaReport({ ...newRecord, submittedBy: user.email, schoolYear: "2024-2025" });
            setMsg(`Saved & Submitted: ${fixedName}`);
            setTimeout(() => setMsg(''), 3000);
            reset({ teacherName: data.teacherName, unitName: data.unitName, gradeLevel: data.gradeLevel });
            setGrowthResult(null);
        } catch (e) { alert("Submission Failed: " + e.message); }
        setSaving(false);
    } else {
        setQueue([...queue, newRecord]);
        reset({ teacherName: data.teacherName, unitName: data.unitName, gradeLevel: data.gradeLevel });
        setGrowthResult(null);
    }
  };

  const uploadBatch = async () => {
    if (queue.length === 0) return;
    setSaving(true);
    try {
      const CHUNK_SIZE = 5;
      for (let i = 0; i < queue.length; i += CHUNK_SIZE) {
        const chunk = queue.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(student => {
          const { tempId, ...cleanData } = student;
          return databaseService.addKteaReport({ ...cleanData, submittedBy: user.email, schoolYear: "2024-2025" });
        }));
        
        // Brief pause between chunks to avoid hitting Azure's rate limits
        if (i + CHUNK_SIZE < queue.length) {
          await new Promise(res => setTimeout(res, 500));
        }
      }
      setMsg(`Saved ${queue.length} records to Azure.`);
      setQueue([]);
      setTimeout(() => setMsg(''), 4000);
    } catch (e) { alert("Batch Failed: " + e.message); }
    setSaving(false);
  };

  const calculateGrowth = () => {
    const data = getValues();

    setGrowthResult({
      reading: calculateGEGrowth(data.preReadingGE, data.postReadingGE),
      math: calculateGEGrowth(data.preMathGE, data.postMathGE),
      writing: calculateGEGrowth(data.preWritingGE, data.postWritingGE)
    });
  };

  // --- 3. SPREADSHEET VIEW ---

  const loadSpreadsheetData = async (mode, quarter, year) => {
    setLoadingSpreadsheet(true);
    try {
      const allStudents = await databaseService.getAllKteaReports();
      if (!allStudents || allStudents.length === 0) {
        setSpreadsheetData({});
        setLoadingSpreadsheet(false);
        return;
      }

      let filtered = allStudents;

      // Filter by quarter if in discharged mode
      if (mode === 'discharged' && quarter && year) {
        const q = QUARTERS.find(q => q.value === parseInt(quarter));
        if (q) {
          filtered = allStudents.filter(s => {
            // CRITICAL: Per user request, only show students who have a discharge date in this quarter
            if (!s.dischargeDate) return false;
            const bq = getBusinessQuarter(s.dischargeDate);
            if (!bq) return false;
            return bq.quarter === q.value && bq.fiscalYear === parseInt(year);
          });
        }
      }

      // Group by Unit (in UNIT_CONFIG order)
      const units = {};
      const unitOrder = UNIT_CONFIG.map(u => u.key);
      filtered.forEach(s => {
        const u = s.unitName || "Other";
        if (!units[u]) units[u] = [];
        units[u].push(s);
      });

      // Sort by unit config order, put "Other"/"Discharged" at end
      const sorted = {};
      unitOrder.forEach(key => {
        if (units[key]) sorted[key] = units[key];
      });
      // Add any remaining units not in config
      Object.keys(units).forEach(key => {
        if (!sorted[key]) sorted[key] = units[key];
      });

      setSpreadsheetData(sorted);
    } catch (e) { console.error(e); }
    setLoadingSpreadsheet(false);
  };

  const handleCreateStudent = async (unitName) => {
    if (!newStudentData.studentName.trim()) {
      alert("Please enter a student name.");
      return;
    }

    try {
      setLoadingSpreadsheet(true);
      const nameParts = newStudentData.studentName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

      const newStudent = {
        id: `student-${Date.now()}`,
        studentName: newStudentData.studentName.trim(),
        firstName,
        lastName,
        studentNumber: generateStudentNumber(),
        gradeLevel: parseInt(newStudentData.gradeLevel, 10),
        unitName: unitName,
        admitDate: newStudentData.admitDate,
        active: true,
        lastModified: new Date().toISOString()
      };

      // 1. Create Student
      await databaseService.upsertStudent(newStudent);

      // 2. Auto-enroll
      await autoEnrollStudent(newStudent, "System", getCurrentSchoolYear());

      // 3. Create initial KTEA report for this student
      const initialReport = {
        id: `ktea-${Date.now()}`,
        studentId: newStudent.id,
        studentName: newStudent.studentName,
        studentNumber: newStudent.studentNumber,
        unitName: unitName,
        gradeLevel: newStudent.gradeLevel,
        admitDate: newStudent.admitDate,
        teacherName: 'John Gawin',
        preReadingRaw: '', preReadingStd: '', preReadingGE: '',
        preMathRaw: '', preMathStd: '', preMathGE: '',
        preWritingRaw: '', preWritingStd: '', preWritingGE: '',
        postReadingRaw: '', postReadingStd: '', postReadingGE: '',
        postMathRaw: '', postMathStd: '', postMathGE: '',
        postWritingRaw: '', postWritingStd: '', postWritingGE: '',
        timestamp: new Date().toISOString(),
        lastUpdatedBy: 'john.gawin@lakeland.edu'
      };
      await databaseService.updateKteaReport(initialReport.id, initialReport);

      // 4. Audit Log
      await databaseService.logAudit({ name: 'System' }, 'CreateStudentViaKTEA', `Created student via KTEA spreadsheet.`);

      setMsg("Student Created Successfully!");
      setIsAddingStudent(false);
      setAddingToUnit(null);
      setNewStudentData({ studentName: '', gradeLevel: 9, admitDate: new Date().toISOString().split('T')[0] });
      loadSpreadsheetData(spreadsheetMode, filterQuarter, filterYear);
    } catch (err) {
      console.error(err);
      alert("Failed to create student: " + err.message);
    } finally {
      setLoadingSpreadsheet(false);
    }
  };

  const handleDeleteStudentChoice = async (choice) => {
    // choice: 'report_only' or 'full_student'
    if (!deleteChoice) return;

    try {
      setLoadingSpreadsheet(true);
      if (choice === 'full_student') {
        await databaseService.deleteStudent(deleteChoice.studentId);
        await databaseService.logAudit({ name: 'System' }, 'DeleteStudentViaKTEA', `Deleted student entirely.`);
      } else {
        await databaseService.deleteKteaReport(deleteChoice.reportId);
        await databaseService.logAudit({ name: 'System' }, 'DeleteKTEAViaKTEA', `Deleted KTEA report.`);
      }

      setMsg(choice === 'full_student' ? "Student Deleted Entirely" : "KTEA Record Deleted");
      setDeleteChoice(null);
      loadSpreadsheetData(spreadsheetMode, filterQuarter, filterYear);
    } catch (err) {
      console.error(err);
      alert("Delete failed: " + err.message);
    } finally {
      setLoadingSpreadsheet(false);
    }
  };

  const toggleSpreadsheet = async () => {
    if (showSpreadsheet) {
      setShowSpreadsheet(false);
      return;
    }
    setShowSpreadsheet(true);
    await loadSpreadsheetData(spreadsheetMode, filterQuarter, filterYear);
  };

  const handleQuarterFilter = async (quarter, year) => {
    setFilterQuarter(quarter);
    setFilterYear(year);
    if (quarter) {
      setSpreadsheetMode('discharged');
      await loadSpreadsheetData('discharged', quarter, year);
    } else {
      setSpreadsheetMode('all');
      await loadSpreadsheetData('all', '', year);
    }
  };



  // --- 4. EXPORT ---
  const generateExcelReport = async (unitsData, filename) => {
    try {
      const response = await fetch('/templates/ktea_master.xlsx');
      if (!response.ok) throw new Error('Could not find template: ktea_master.xlsx');
      const templateBuffer = await response.arrayBuffer();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(templateBuffer);

      // The template has a single sheet ("Harmony ") we use as the base
      const templateSheet = workbook.worksheets[0];

      // Column mapping matching the template layout (row 5 headers):
      // A=Name, B=Grade Level, C=Age, D=Sped/504, E=Title 1
      // F/G/H=Pre Reading (Raw/Standard/GE), I/J/K=Pre Math, L/M/N=Pre Writing
      // O/P/Q=Post Reading, R/S/T=Post Math, U/V/W=Post Writing
      // X=Admit, Y=Discharge, Z=Name (teacher)
      const DATA_START_ROW = 6;

      const fillSheet = (sheet, unitName, students) => {
        // Fill header fields
        sheet.getCell('A1').value = unitName;

        // Add Unit header in row 5, column AA
        const headerRow = sheet.getRow(5);
        headerRow.getCell(27).value = 'Unit';

        // Fill student data starting at row 6
        students.forEach((s, idx) => {
          const row = DATA_START_ROW + idx;
          const r = sheet.getRow(row);

          r.getCell(1).value = s.studentName || '';          // A - Name
          r.getCell(2).value = s.gradeLevel || '';           // B - Grade Level
          r.getCell(3).value = s.age || '';                  // C - Age
          r.getCell(4).value = s.sped504 || '';              // D - Sped/504
          r.getCell(5).value = s.title1 || '';               // E - Title 1

          // Pre-Test scores
          r.getCell(6).value = parseFloat(s.preReadingRaw) || s.preReadingRaw || '';    // F
          r.getCell(7).value = parseFloat(s.preReadingStd) || s.preReadingStd || '';    // G
          r.getCell(8).value = s.preReadingGE || '';         // H
          r.getCell(9).value = parseFloat(s.preMathRaw) || s.preMathRaw || '';          // I
          r.getCell(10).value = parseFloat(s.preMathStd) || s.preMathStd || '';         // J
          r.getCell(11).value = s.preMathGE || '';           // K
          r.getCell(12).value = parseFloat(s.preWritingRaw) || s.preWritingRaw || '';   // L
          r.getCell(13).value = parseFloat(s.preWritingStd) || s.preWritingStd || '';   // M
          r.getCell(14).value = s.preWritingGE || '';        // N

          // Post-Test scores
          r.getCell(15).value = parseFloat(s.postReadingRaw) || s.postReadingRaw || ''; // O
          r.getCell(16).value = parseFloat(s.postReadingStd) || s.postReadingStd || ''; // P
          r.getCell(17).value = s.postReadingGE || '';       // Q
          r.getCell(18).value = parseFloat(s.postMathRaw) || s.postMathRaw || '';       // R
          r.getCell(19).value = parseFloat(s.postMathStd) || s.postMathStd || '';       // S
          r.getCell(20).value = s.postMathGE || '';          // T
          r.getCell(21).value = parseFloat(s.postWritingRaw) || s.postWritingRaw || ''; // U
          r.getCell(22).value = parseFloat(s.postWritingStd) || s.postWritingStd || ''; // V
          r.getCell(23).value = s.postWritingGE || '';       // W

          r.getCell(24).value = s.admitDate || '';           // X - Admit
          r.getCell(25).value = s.dischargeDate || '';       // Y - Discharge
          r.getCell(26).value = s.teacherName || '';         // Z - Teacher Name
          r.getCell(27).value = unitName || '';               // AA - Unit Name

          r.commit();
        });
      };

      // Use the template sheet for the first unit, duplicate for the rest
      const unitNames = Object.keys(unitsData).sort();

      if (unitNames.length > 0) {
        // Rename the template sheet to the first unit
        templateSheet.name = unitNames[0];
        fillSheet(templateSheet, unitNames[0], unitsData[unitNames[0]]);

        // For additional units, duplicate the template approach:
        // ExcelJS doesn't have native sheet cloning, so we create new sheets
        // with the same header structure
        for (let i = 1; i < unitNames.length; i++) {
          const unitName = unitNames[i];
          const newSheet = workbook.addWorksheet(unitName);

          // Copy header rows (1-5) from template
          for (let rowNum = 1; rowNum <= 5; rowNum++) {
            const srcRow = templateSheet.getRow(rowNum);
            const dstRow = newSheet.getRow(rowNum);
            srcRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              const dstCell = dstRow.getCell(colNumber);
              dstCell.value = cell.value;
              dstCell.style = JSON.parse(JSON.stringify(cell.style));
            });
            dstRow.height = srcRow.height;
          }

          // Copy column widths
          for (let col = 1; col <= 27; col++) {
            const srcCol = templateSheet.getColumn(col);
            const dstCol = newSheet.getColumn(col);
            if (srcCol.width) dstCol.width = srcCol.width;
          }

          // Copy merged cells for header area
          templateSheet.model.merges.forEach(merge => {
            try { newSheet.mergeCells(merge); } catch (e) { /* skip if already merged */ }
          });

          fillSheet(newSheet, unitName, unitsData[unitName]);
        }
      }

      // Remove extra empty sheets (Sheet2, Sheet3 from template)
      workbook.worksheets.forEach(ws => {
        if (ws.name === 'Sheet2' || ws.name === 'Sheet3') {
          workbook.removeWorksheet(ws.id);
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, filename);
    } catch (e) { console.error(e); alert("Export Error"); }
  };

  const downloadReport = async () => {
    try {
      const allStudents = await databaseService.getAllKteaReports();
      if (!allStudents || allStudents.length === 0) return alert(`No records found.`);

      const units = {};
      allStudents.forEach(s => {
        const u = s.unitName || "Other";
        if (!units[u]) units[u] = [];
        units[u].push(s);
      });

      await generateExcelReport(units, `LRS_Master_Report.xlsx`);
    } catch (e) { console.error(e); alert("Could not load data for export."); }
  };

  const downloadSpreadsheetView = async () => {
    if (Object.keys(spreadsheetData).length === 0 || totalSpreadsheetStudents === 0) {
      return alert("No records found in current view.");
    }
    
    let filename = `LRS_KTEA_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    if (spreadsheetMode === 'discharged' && filterQuarter && filterYear) {
       const qLabel = QUARTERS.find(q => q.value === parseInt(filterQuarter))?.label || `Q${filterQuarter}`;
       filename = `LRS_Quarterly_Discharge_${qLabel}_${filterYear}.xlsx`;
    }

    await generateExcelReport(spreadsheetData, filename);
  };

  // Total students in current spreadsheet view
  const totalSpreadsheetStudents = Object.values(spreadsheetData).reduce((sum, arr) => sum + arr.length, 0);

  // --- RENDER ---
  return (
    <div className="h-full flex flex-col text-slate-800 font-sans p-6 bg-slate-50">

      {/* HEADER */}
      <div className="flex justify-between items-center pb-5 mb-5 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
            <h2 className="m-0 text-slate-900 font-extrabold text-3xl flex items-center gap-3">
              <span className="p-2 bg-indigo-100 rounded-xl text-indigo-600"><ClipboardList className="w-7 h-7" /></span>
              KTEA Reporter
            </h2>
            <div className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold border border-emerald-200/80">Azure Online</div>
        </div>
        <div className="flex gap-2">
            <button onClick={calculateGrowth} className="bg-white border border-slate-300/80 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100/80 flex items-center gap-1.5 transition-colors shadow-sm">
                <Calculator className="w-4 h-4" /> Calc Growth
            </button>
            <button onClick={toggleSpreadsheet} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm ${showSpreadsheet ? 'bg-indigo-600 text-white shadow-indigo-500/10' : 'bg-white border border-slate-300/80 text-slate-700 hover:bg-slate-100/80'}`}>
                <Table className="w-4 h-4" /> {showSpreadsheet ? 'Hide Spreadsheet' : 'Spreadsheet View'}
            </button>
            <button onClick={downloadReport} className="bg-white border border-slate-300/80 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100/80 flex items-center gap-1.5 transition-colors shadow-sm"><Download className="w-4 h-4" /> Master Export</button>
        </div>
      </div>

      {msg && <div className="absolute top-5 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-emerald-600 text-white rounded-full text-sm font-bold shadow-2xl z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300"><CheckCircle className="w-5 h-5" /> {msg}</div>}

      {/* SPREADSHEET VIEW - Full Screen Modal */}
      {showSpreadsheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowSpreadsheet(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[97vw] h-[93vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>

            {/* Modal Header / Toolbar */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-900 flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h3 className="text-white font-extrabold text-sm tracking-wide m-0">
                  {spreadsheetMode === 'discharged' ? 'Quarterly Discharge Report' : 'Master KTEA Spreadsheet'}
                </h3>
              </div>

              <div className="flex items-center gap-2 ml-6">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quarter:</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleQuarterFilter('', filterYear)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      !filterQuarter ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  {QUARTERS.map(q => (
                    <button
                      key={q.value}
                      onClick={() => handleQuarterFilter(q.value, filterYear)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        parseInt(filterQuarter) === q.value ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                      }`}
                      title={q.months}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 ml-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Year:</span>
                  <select
                    value={filterYear}
                    onChange={e => handleQuarterFilter(filterQuarter, e.target.value)}
                    className="bg-white/10 text-white text-xs font-bold px-2 py-1.5 rounded-lg border border-white/20 outline-none cursor-pointer"
                  >
                    {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y} className="text-slate-800">{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-3">
                <span className="text-xs text-white/50 font-medium">
                  {totalSpreadsheetStudents} student{totalSpreadsheetStudents !== 1 ? 's' : ''}
                  {filterQuarter && ` discharged in ${QUARTERS.find(q => q.value === parseInt(filterQuarter))?.label} ${filterYear}`}
                </span>
                <button onClick={downloadSpreadsheetView} className="bg-white/10 text-white/70 hover:text-white hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button onClick={() => window.print()} className="bg-white/10 text-white/70 hover:text-white hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button onClick={() => setShowSpreadsheet(false)} className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white/70 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stacked Card Content */}
            <div className="flex-1 overflow-auto p-6 bg-slate-100">
              {loadingSpreadsheet ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <p className="text-sm font-medium text-slate-500">Loading spreadsheet data...</p>
                </div>
              ) : totalSpreadsheetStudents === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Table className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">
                    {filterQuarter
                      ? `No students discharged in ${QUARTERS.find(q => q.value === parseInt(filterQuarter))?.label} ${filterYear}.`
                      : 'No KTEA records found.'}
                  </p>
                  {filterQuarter && (
                    <button onClick={() => handleQuarterFilter('', filterYear)} className="mt-3 text-indigo-600 text-xs font-bold hover:underline">
                      Show all records instead
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span>{totalSpreadsheetStudents} students across {Object.keys(spreadsheetData).length} units</span>
                  </div>

                  {Object.keys(spreadsheetData).map(unit => {
                    const students = spreadsheetData[unit];
                    const colors = UNIT_COLORS[unit] || { bg: 'bg-slate-600', text: 'text-slate-900', light: 'bg-slate-50' };

                    return (
                      <div key={unit} className="bg-white rounded-xl border border-slate-200/80 shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-sm">
                            <thead>
                              <tr>
                                <th colSpan="25" className={`${colors.bg} text-white text-sm font-bold py-3 px-4 text-left tracking-wide flex items-center justify-between`}>
                                  <div className="flex items-center gap-3">
                                    {unit}
                                    <span className="text-white/70 font-medium text-xs">({students.length} student{students.length !== 1 ? 's' : ''})</span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setAddingToUnit(unit);
                                      setIsAddingStudent(true);
                                    }}
                                    className="bg-white/20 hover:bg-white/30 text-white text-[10px] uppercase tracking-wider font-bold py-1 px-3 rounded-lg flex items-center gap-1.5 transition-all"
                                  >
                                    <Plus className="w-3 h-3" /> Add Student
                                  </button>
                                </th>
                              </tr>
                              <tr>
                                <td colSpan="25" className="border border-slate-300 bg-white h-2"></td>
                              </tr>
                              <tr className="bg-slate-800 text-white">
                                <th colSpan="3" className="border border-slate-600 p-2 text-[10px] font-bold">Student</th>
                                <th colSpan="9" className="border border-slate-600 p-2 bg-blue-900/50 text-blue-100 text-[10px] font-bold">PRE-TEST (Entry)</th>
                                <th colSpan="9" className="border border-slate-600 p-2 bg-emerald-900/50 text-emerald-100 text-[10px] font-bold">POST-TEST (Exit)</th>
                                <th colSpan="4" className="border border-slate-600 p-2 text-[10px] font-bold">Admin</th>
                              </tr>
                              <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                                <th className="border border-slate-200 p-1.5 w-40 text-left">Name</th>
                                <th className="border border-slate-200 p-1.5 w-8">Gr</th>
                                <th className="border border-slate-200 p-1.5 w-20 text-left">Unit</th>
                                <th className="border border-slate-200 p-1 bg-blue-50 text-blue-700">R.Raw</th>
                                <th className="border border-slate-200 p-1 bg-blue-50 text-blue-700">R.Std</th>
                                <th className="border border-slate-200 p-1 bg-blue-200 text-blue-900 font-extrabold">R.GE</th>
                                <th className="border border-slate-200 p-1 bg-blue-50 text-blue-700">M.Raw</th>
                                <th className="border border-slate-200 p-1 bg-blue-50 text-blue-700">M.Std</th>
                                <th className="border border-slate-200 p-1 bg-blue-200 text-blue-900 font-extrabold">M.GE</th>
                                <th className="border border-slate-200 p-1 bg-blue-50 text-blue-700">W.Raw</th>
                                <th className="border border-slate-200 p-1 bg-blue-50 text-blue-700">W.Std</th>
                                <th className="border border-slate-200 p-1 bg-blue-200 text-blue-900 font-extrabold">W.GE</th>
                                <th className="border border-slate-200 p-1 bg-emerald-50 text-emerald-700">R.Raw</th>
                                <th className="border border-slate-200 p-1 bg-emerald-50 text-emerald-700">R.Std</th>
                                <th className="border border-slate-200 p-1 bg-emerald-200 text-emerald-900 font-extrabold">R.GE</th>
                                <th className="border border-slate-200 p-1 bg-emerald-50 text-emerald-700">M.Raw</th>
                                <th className="border border-slate-200 p-1 bg-emerald-50 text-emerald-700">M.Std</th>
                                <th className="border border-slate-200 p-1 bg-emerald-200 text-emerald-900 font-extrabold">M.GE</th>
                                <th className="border border-slate-200 p-1 bg-emerald-50 text-emerald-700">W.Raw</th>
                                <th className="border border-slate-200 p-1 bg-emerald-50 text-emerald-700">W.Std</th>
                                <th className="border border-slate-200 p-1 bg-emerald-200 text-emerald-900 font-extrabold">W.GE</th>
                                <th className="border border-slate-200 p-1.5 w-20">Admit</th>
                                <th className="border border-slate-200 p-1.5 w-20">Disch</th>
                                <th className="border border-slate-200 p-1.5 w-20">Teacher</th>
                                <th className="border border-slate-200 p-1.5 w-8"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* INLINE ADD STUDENT ROW */}
                              {isAddingStudent && addingToUnit === unit && (
                                <tr className="bg-indigo-50/50 animate-in fade-in slide-in-from-top-2 duration-200">
                                  <td className="border border-slate-200 p-2">
                                    <input
                                      autoFocus
                                      type="text"
                                      placeholder="Full Student Name..."
                                      className="w-full bg-white border border-indigo-200 rounded px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                      value={newStudentData.studentName}
                                      onChange={e => setNewStudentData({...newStudentData, studentName: e.target.value})}
                                    />
                                  </td>
                                  <td className="border border-slate-200 p-2">
                                    <select
                                      className="w-full bg-white border border-indigo-200 rounded px-1 py-1 text-xs font-bold"
                                      value={newStudentData.gradeLevel}
                                      onChange={e => setNewStudentData({...newStudentData, gradeLevel: e.target.value})}
                                    >
                                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                  </td>
                                  <td className="border border-slate-200 p-2 text-xs font-bold text-slate-500">{unit}</td>
                                  <td colSpan="18" className="border border-slate-200 bg-slate-50/30"></td>
                                  <td className="border border-slate-200 p-2" colSpan="3">
                                    <div className="flex gap-1.5 justify-end">
                                      <button onClick={() => setIsAddingStudent(false)} className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-[10px] font-bold transition-all">Cancel</button>
                                      <button onClick={() => handleCreateStudent(unit)} className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-1 transition-all">
                                        <UserPlus className="w-3 h-3" /> Save Student
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )}

                              {students.map((s, idx) => (
                                <tr key={s.id || idx} className="hover:bg-indigo-50/30 text-center border-b border-slate-100 text-[11px] transition-colors group">
                                   <td className="border-r border-slate-200/50 p-1.5 text-left font-bold text-slate-700 truncate max-w-[160px]">
                                     <EditableStudentName 
                                       studentId={s.studentId || s.id} 
                                       studentName={s.studentName} 
                                       size="sm"
                                     />
                                   </td>
                                  <td className="border-r border-slate-200/50 p-1.5 font-medium">{s.gradeLevel}</td>
                                  <td className="border-r border-slate-200/50 p-1.5 text-left text-slate-500 truncate max-w-[80px]">{s.unitName || unit}</td>
                                  <td className="p-1 bg-blue-50/30 border-r border-blue-100/30">{s.preReadingRaw || '-'}</td>
                                  <td className="p-1 bg-blue-50/30 border-r border-blue-100/30">{s.preReadingStd || '-'}</td>
                                  <td className="p-1 bg-blue-200/60 border-r border-blue-300/50 font-extrabold text-blue-900 text-xs">{s.preReadingGE || '-'}</td>
                                  <td className="p-1 bg-blue-50/30 border-r border-blue-100/30">{s.preMathRaw || '-'}</td>
                                  <td className="p-1 bg-blue-50/30 border-r border-blue-100/30">{s.preMathStd || '-'}</td>
                                  <td className="p-1 bg-blue-200/60 border-r border-blue-300/50 font-extrabold text-blue-900 text-xs">{s.preMathGE || '-'}</td>
                                  <td className="p-1 bg-blue-50/30 border-r border-blue-100/30">{s.preWritingRaw || '-'}</td>
                                  <td className="p-1 bg-blue-50/30 border-r border-blue-100/30">{s.preWritingStd || '-'}</td>
                                  <td className="p-1 bg-blue-200/60 border-r border-slate-200/50 font-extrabold text-blue-900 text-xs">{s.preWritingGE || '-'}</td>
                                  <td className="p-1 bg-emerald-50/30 border-r border-emerald-100/30">{s.postReadingRaw || '-'}</td>
                                  <td className="p-1 bg-emerald-50/30 border-r border-emerald-100/30">{s.postReadingStd || '-'}</td>
                                  <td className="p-1 bg-emerald-200/60 border-r border-emerald-300/50 font-extrabold text-emerald-900 text-xs">{s.postReadingGE || '-'}</td>
                                  <td className="p-1 bg-emerald-50/30 border-r border-emerald-100/30">{s.postMathRaw || '-'}</td>
                                  <td className="p-1 bg-emerald-50/30 border-r border-emerald-100/30">{s.postMathStd || '-'}</td>
                                  <td className="p-1 bg-emerald-200/60 border-r border-emerald-300/50 font-extrabold text-emerald-900 text-xs">{s.postMathGE || '-'}</td>
                                  <td className="p-1 bg-emerald-50/30 border-r border-emerald-100/30">{s.postWritingRaw || '-'}</td>
                                  <td className="p-1 bg-emerald-50/30 border-r border-emerald-100/30">{s.postWritingStd || '-'}</td>
                                  <td className="p-1 bg-emerald-200/60 border-r border-slate-200/50 font-extrabold text-emerald-900 text-xs">{s.postWritingGE || '-'}</td>
                                  <td className="p-1.5 text-slate-500 border-r border-slate-200/50 whitespace-nowrap">{s.admitDate || '-'}</td>
                                  <td className={`p-1.5 border-r border-slate-200/50 whitespace-nowrap ${s.dischargeDate ? 'text-slate-700 font-semibold' : 'text-slate-300'}`}>{s.dischargeDate || '-'}</td>
                                  <td className="p-1.5 text-slate-500 border-r border-slate-200/50 truncate max-w-[80px]">{s.teacherName || '-'}</td>
                                  <td className="border border-slate-200 p-1 text-center">
                                    <button 
                                      onClick={() => setDeleteChoice({ reportId: s.id, studentId: s.studentId, studentName: s.studentName })}
                                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-all opacity-0 group-hover:opacity-100"
                                      title="Delete Options"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* DELETE CHOICE MODAL */}
            {deleteChoice && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                   <div className="p-6">
                      <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Selection</h3>
                      <p className="text-slate-500 text-sm leading-relaxed mb-6">
                        You are deleting records for <span className="font-bold text-slate-900">{deleteChoice.studentName}</span>. How would you like to proceed?
                      </p>

                      <div className="space-y-3">
                        <button 
                          onClick={() => handleDeleteStudentChoice('report_only')}
                          className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all group"
                        >
                          <div className="text-left">
                            <div className="font-bold text-slate-900 text-sm">Delete KTEA Record Only</div>
                            <div className="text-[11px] text-slate-400">Removes this line from the spreadsheet. Student remains in roster.</div>
                          </div>
                          <Trash2 className="w-4 h-4 text-slate-300 group-hover:text-amber-600" />
                        </button>

                        <button 
                          onClick={() => handleDeleteStudentChoice('full_student')}
                          className="w-full flex items-center justify-between p-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all group"
                        >
                          <div className="text-left">
                            <div className="font-bold text-rose-900 text-sm italic">Delete Student Entirely</div>
                            <div className="text-[11px] text-rose-400">Global removal from Roster, Gradebook, and all Assessments.</div>
                          </div>
                          <Trash2 className="w-4 h-4 text-rose-300 group-hover:text-rose-600" />
                        </button>
                      </div>
                   </div>
                   <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
                      <button 
                        onClick={() => setDeleteChoice(null)}
                        className="px-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        Cancel
                      </button>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* MAIN FORM AREA */}
        <div className="flex-1 bg-slate-50/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl shadow-slate-200/60 flex flex-col border border-slate-200/50 overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
                <div className="grid grid-cols-7 gap-4 mb-4 items-end">
                    <div className="col-span-1"> <label className="text-[11px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Teacher</label> <input {...register("teacherName")} className="w-full p-3 rounded-xl border border-slate-300/80 bg-white text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" /> </div>
                    <div className="col-span-1"> <label className="text-[11px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Unit</label> <select {...register("unitName")} className="w-full p-3 rounded-xl border border-slate-300/80 bg-white text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"><option value="">Select...</option>{UNIT_CONFIG.map(u => <option key={u.key} value={u.key}>{u.label}</option>)}</select> </div>
                    <div className="col-span-2"> <label className="text-[11px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Student Name</label> <input {...register("studentName")} className="w-full p-3 rounded-xl border border-indigo-300/80 bg-indigo-50/50 text-base focus:ring-4 focus:ring-indigo-500/30 outline-none font-bold transition-all" /> </div>
                    <div className="w-[80px]"> <label className="text-[11px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Grade</label> <select {...register("gradeLevel")} className="w-full p-3 rounded-xl border border-slate-300/80 bg-white text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"><option value="K">K</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option><option value="8">8</option><option value="9">9</option><option value="10">10</option><option value="11">11</option><option value="12">12</option></select> </div>
                    <div className="col-span-1"> <label className="text-[11px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Admit</label> <input type="date" {...register("admitDate")} className="w-full p-3 rounded-xl border border-slate-300/80 bg-white text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" /> </div>
                    <div className="col-span-1"> <label className="text-[11px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Discharge</label> <input type="date" {...register("dischargeDate")} className="w-full p-3 rounded-xl border border-slate-300/80 bg-white text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" /> </div>
                </div>

                <div className="grid grid-cols-7 gap-4 mb-6 items-end">
                    <div className="col-span-1"> <label className="text-[11px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Age</label> <input type="number" {...register("age")} className="w-full p-3 rounded-xl border border-slate-300/80 bg-white text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" /> </div>
                    <div className="col-span-2"> <label className="text-[11px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Sped/504</label> <select {...register("sped504")} className="w-full p-3 rounded-xl border border-slate-300/80 bg-white text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"><option value="">None</option><option value="IEP">IEP</option><option value="504">504 Plan</option></select> </div>
                    <div className="col-span-2"> <label className="text-[11px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Title 1</label> <select {...register("title1")} className="w-full p-3 rounded-xl border border-slate-300/80 bg-white text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"><option value="">No</option><option value="Yes">Yes</option></select> </div>
                </div>

                <div className="flex gap-6 flex-1 mb-4">
                    <div className="flex-1 bg-white/80 rounded-xl border border-blue-200/50 overflow-hidden flex flex-col shadow-lg shadow-blue-500/5">
                        <div className="p-3 text-center font-extrabold text-xs tracking-widest text-blue-700 bg-blue-100/60 border-b border-blue-200/50">PRE-TEST</div>
                        <div className="p-5 space-y-4">
                            <ScoreRow label="Reading Comp" type="preReading" register={register} errors={errors} />
                            <ScoreRow label="Math Concepts" type="preMath" register={register} errors={errors} />
                            <ScoreRow label="Writing Fluency" type="preWriting" register={register} errors={errors} />
                        </div>
                    </div>
                    <div className="flex-1 bg-white/80 rounded-xl border border-emerald-200/50 overflow-hidden flex flex-col shadow-lg shadow-emerald-500/5">
                        <div className="p-3 text-center font-extrabold text-xs tracking-widest text-emerald-700 bg-emerald-100/60 border-b border-emerald-200/50">POST-TEST</div>
                        <div className="p-5 space-y-4">
                            <ScoreRow label="Reading Comp" type="postReading" register={register} errors={errors} />
                            <ScoreRow label="Math Concepts" type="postMath" register={register} errors={errors} />
                            <ScoreRow label="Writing Fluency" type="postWriting" register={register} errors={errors} />
                        </div>
                    </div>
                </div>

                {/* GROWTH CALCULATION RESULTS PANEL */}
                {growthResult && (
                  <div className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-inner flex items-center justify-around animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-3">
                          <Calculator className="w-6 h-6 text-emerald-600" />
                          <div><div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Reading Growth</div><div className="text-xl font-extrabold text-slate-800">{growthResult.reading}</div></div>
                      </div>
                      <div className="w-px h-10 bg-emerald-200"></div>
                      <div className="flex items-center gap-3">
                          <Calculator className="w-6 h-6 text-emerald-600" />
                          <div><div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Math Growth</div><div className="text-xl font-extrabold text-slate-800">{growthResult.math}</div></div>
                      </div>
                      <div className="w-px h-10 bg-emerald-200"></div>
                      <div className="flex items-center gap-3">
                          <Calculator className="w-6 h-6 text-emerald-600" />
                          <div><div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Writing Growth</div><div className="text-xl font-extrabold text-slate-800">{growthResult.writing}</div></div>
                      </div>
                  </div>
                )}

                <div className="mt-auto flex gap-3 pt-5 border-t border-slate-200/80">
                    {editingId ? (
                        <button type="submit" className="w-full p-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"><Zap className="w-4 h-4" /> UPDATE RECORD</button>
                    ) : (
                        <>
                            <button type="submit" onClick={() => { submitModeRef.current = 'queue'; }} className="flex-1 p-3 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600 transition-colors shadow-lg shadow-slate-500/10 flex items-center justify-center gap-2"><ArrowDown className="w-4 h-4" /> ADD TO QUEUE</button>
                            <button type="submit" onClick={() => { submitModeRef.current = 'direct'; }} className="flex-1 p-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"><Send className="w-4 h-4" /> SAVE & SUBMIT</button>
                        </>
                    )}
                    <button type="button" onClick={() => { reset(); setGrowthResult(null); }} className="px-6 py-3 bg-white border border-slate-300/80 rounded-xl text-slate-500 hover:bg-slate-100/80 font-bold transition-colors shadow-sm">Clear</button>
                </div>
            </form>
        </div>

        {/* QUEUE SIDEBAR */}
        <div className="w-72 bg-slate-50/80 backdrop-blur-xl rounded-2xl p-5 flex flex-col border border-slate-200/50 shadow-2xl shadow-slate-200/60">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200/80 text-sm text-slate-700">
                <strong className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-slate-400" /> Batch Queue</strong>
                <span className="bg-indigo-600 text-white rounded-full px-2 py-0.5 text-[10px] font-bold">{queue.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-1">
                {queue.map((item) => (
                  <div key={item.tempId} className="bg-slate-100/80 p-3 rounded-lg flex justify-between items-center border border-slate-200/50 group hover:border-slate-300/80 transition-colors">
                     <div><div className="font-bold text-xs text-slate-700">{formatStudentLabel(item)}</div></div>
                    <button onClick={() => setQueue(queue.filter(q => q.tempId !== item.tempId))} className="text-slate-400 hover:text-red-500 p-1 transition-colors opacity-50 group-hover:opacity-100"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                {queue.length === 0 && <div className="text-center text-slate-400 text-sm italic mt-10">Queue is empty</div>}
            </div>
            <button onClick={uploadBatch} disabled={saving || queue.length === 0} className="w-full p-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10">{saving ? "Saving..." : <><Send className="w-4 h-4" /> SUBMIT BATCH</>}</button>
        </div>
      </div>

      {/* SEARCH DROPDOWN */}
      {searchResults.length > 0 && (
         <div className="absolute top-[85px] right-8 w-96 bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl z-50 overflow-hidden border border-slate-200/50 animate-in fade-in zoom-in-95 duration-200">
             <div className="p-3 border-b border-slate-200/50 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">DB Search Results</div>
             {searchResults.map(s => (
               <div key={s.id} onClick={() => loadStudent(s)} className="p-3 border-b border-slate-100/80 cursor-pointer flex justify-between items-center hover:bg-indigo-50 transition-colors group">
                  <div className="text-sm text-slate-700">
                    <strong className="group-hover:text-indigo-600 transition-colors">{formatStudentLabel(s)}</strong> 
                    <span className="text-xs text-slate-400 ml-2">({s.gradeLevel}th)</span>
                  </div>
                 <button onClick={(e) => handleDelete(s.id, s.studentName, e)} className="text-slate-400 hover:text-red-500 hover:bg-red-100/50 p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
               </div>
             ))}
         </div>
      )}
    </div>
  );
}

// --- HELPERS ---
function ScoreRow({ label, type, register, errors }) {
    const rawError = errors?.[`${type}Raw`];
    const stdError = errors?.[`${type}Std`];

    const errorRing = 'ring-2 ring-red-400/50 border-red-400/80';
    const defaultRing = 'focus:ring-4 focus:ring-indigo-500/20 border-slate-300/80';

    return (
        <div className="flex items-center">
            <label className="flex-1 text-sm font-semibold text-slate-600">{label}</label>
            <div className="flex gap-2 flex-[2]">
                <div className="w-full relative">
                    <input {...register(`${type}Raw`, { min: { value: 0, message: "Min 0" } })} placeholder="Raw" type="number" className={`w-full p-2.5 rounded-lg text-sm text-center outline-none transition-all ${rawError ? errorRing : defaultRing }`} />
                    {rawError && <span className="absolute -bottom-4 left-0 w-full text-center text-[10px] text-red-500 font-bold">{rawError.message}</span>}
                </div>
                <div className="w-full relative">
                    <input {...register(`${type}Std`, { min: { value: 40, message: "Min 40" } })} placeholder="Std" type="number" className={`w-full p-2.5 rounded-lg text-sm text-center outline-none transition-all ${stdError ? errorRing : defaultRing }`} />
                    {stdError && <span className="absolute -bottom-4 left-0 w-full text-center text-[10px] text-red-500 font-bold">{stdError.message}</span>}
                </div>
                <input {...register(`${type}GE`)} placeholder="GE" type="text" className={`w-full p-2.5 rounded-lg border-2 border-amber-400 bg-amber-50 text-sm text-center font-bold outline-none transition-all focus:ring-4 focus:ring-amber-400/30`} />
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
