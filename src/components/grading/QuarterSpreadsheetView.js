import React, { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet, Download, Filter, Loader2, RefreshCw } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { databaseService } from '../../services/databaseService';

const GRADE_LEVELS = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4', 'Sem 1', 'Sem 2', 'Year'];

const UNIT_COLORS = {
  Determination: '#d97706',
  Discovery:     '#0284c7',
  Freedom:       '#059669',
  Harmony:       '#7c3aed',
  Integrity:     '#e11d48',
  Serenity:      '#0891b2',
};

// Fixed columns always present (togglable)
const FIXED_COLS = [
  { id: 'name',       label: 'Student Name', default: true  },
  { id: 'gradeLevel', label: 'Grade Level',  default: true  },
  { id: 'unit',       label: 'Unit',         default: false },
];

// Subject groups — each maps to multiple spread columns
const SUBJECT_GROUPS = [
  {
    id: 'soc', label: 'Social Studies', default: true,
    cols: [
      { key: 'socCourse', label: 'Course' },
      { key: 'socGrade',  label: 'Grade',  isGrade: true },
      { key: 'socPct',    label: '%',      isPct:   true },
    ],
  },
  {
    id: 'sci', label: 'Science', default: true,
    cols: [
      { key: 'sciCourse', label: 'Course' },
      { key: 'sciGrade',  label: 'Grade',  isGrade: true },
      { key: 'sciPct',    label: '%',      isPct:   true },
    ],
  },
  {
    id: 'math', label: 'Math', default: true,
    cols: [
      { key: 'mathCourse', label: 'Course' },
      { key: 'mathGrade',  label: 'Grade',  isGrade: true },
      { key: 'mathPct',    label: '%',      isPct:   true },
    ],
  },
  {
    id: 'eng', label: 'English', default: true,
    cols: [
      { key: 'engCourse', label: 'Course' },
      { key: 'engGrade',  label: 'Grade',  isGrade: true },
      { key: 'engPct',    label: '%',      isPct:   true },
    ],
  },
  {
    id: 'elec', label: 'Electives', default: true,
    cols: [
      { key: 'elec1Course', label: 'Elective 1' },
      { key: 'elec1Grade',  label: 'Grade',      isGrade: true },
      { key: 'elec2Course', label: 'Elective 2' },
      { key: 'elec2Grade',  label: 'Grade',      isGrade: true },
    ],
  },
];

const EXTRA_COLS = [
  { id: 'absences', label: 'Absences', default: false },
];

const DEFAULT_FIXED  = FIXED_COLS.filter(c => c.default).map(c => c.id);
const DEFAULT_GROUPS = SUBJECT_GROUPS.filter(g => g.default).map(g => g.id);
const DEFAULT_EXTRA  = EXTRA_COLS.filter(c => c.default).map(c => c.id);

const gradeColor = (g) => {
  if (!g) return '#334155';
  const c = String(g).toUpperCase().charAt(0);
  if (c === 'A') return '#059669';
  if (c === 'B') return '#2563eb';
  if (c === 'C') return '#d97706';
  if (c === 'D') return '#ea580c';
  if (c === 'F') return '#dc2626';
  return '#334155';
};

// ── Shared Checkbox button ──────────────────────────────────────────────
const ToggleBtn = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border text-left flex items-center gap-2 ${
      active
        ? 'bg-indigo-600 text-white border-indigo-600'
        : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-slate-700'
    }`}
  >
    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${active ? 'bg-white/20 border-white/40' : 'border-slate-300'}`}>
      {active && (
        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
          <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
    {label}
  </button>
);

const QuarterSpreadsheetView = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTerm, setActiveTerm] = useState('Q3'); // Default to Q3 or dynamic depending on current school term logic.

  // UI State
  const [activeUnits, setActiveUnits] = useState(['Harmony', 'Integrity', 'Determined', 'Discovery', 'Freedom', 'Serenity']);
  const [activeGrades, setActiveGrades] = useState([]);
  
  // Column toggles
  const [showFixed, setShowFixed] = useState(DEFAULT_FIXED);
  const [showGroups, setShowGroups] = useState(DEFAULT_GROUPS);
  const [showExtra, setShowExtra] = useState(DEFAULT_EXTRA);
  const [showConfig, setShowConfig] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const allStudents = await databaseService.getAllStudents();
      const allEnrollments = await databaseService.getAllEnrollments();
      
      const filteredEnrollments = allEnrollments.filter(e => activeTerm === 'All' || e.term === activeTerm);
      
      const grouped = {};
      
      for (const student of allStudents) {
        if (!student.unitName) continue;
        if (!grouped[student.unitName]) grouped[student.unitName] = [];
        
        const enrolls = filteredEnrollments.filter(e => e.studentId === student.id);
        
        let socName='', socGrade='', socPct='';
        let sciName='', sciGrade='', sciPct='';
        let mathName='', mathGrade='', mathPct='';
        let engName='', engGrade='', engPct='';
        let elec1Name='', elec1Grade='';
        let elec2Name='', elec2Grade='';
        let elecCount = 0;

        for (const e of enrolls) {
          const area = (e.subjectArea || '').toLowerCase();
          const p = e.percentage;
          const g = e.letterGrade;
          if (area.includes('social')) { socName = e.courseName; socGrade = g; socPct = p; }
          else if (area.includes('science')) { sciName = e.courseName; sciGrade = g; sciPct = p; }
          else if (area.includes('math')) { mathName = e.courseName; mathGrade = g; mathPct = p; }
          else if (area.includes('english') || area.includes('ela')) { engName = e.courseName; engGrade = g; engPct = p; }
          else {
            if (elecCount === 0) { elec1Name = e.courseName; elec1Grade = g; elecCount++; }
            else if (elecCount === 1) { elec2Name = e.courseName; elec2Grade = g; elecCount++; }
          }
        }

        grouped[student.unitName].push({
          id: student.id,
          name: student.studentName || `${student.firstName} ${student.lastName}`,
          gradeLevel: student.gradeLevel || '',
          unit: student.unitName,
          socCourse: socName, socGrade, socPct,
          sciCourse: sciName, sciGrade, sciPct,
          mathCourse: mathName, mathGrade, mathPct,
          engCourse: engName, engGrade, engPct,
          elec1Course: elec1Name, elec1Grade,
          elec2Course: elec2Name, elec2Grade,
          totalAbsences: '',
        });
      }

      setData(grouped);
    } catch (error) {
      console.error('Error loading spreadsheet data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTerm]);

  // Handle toggles
  const toggleItem = (list, setList, val) => {
    if (list.includes(val)) setList(list.filter(x => x !== val));
    else setList([...list, val]);
  };

  const toggleAllUnits = () => {
    const all = Object.keys(UNIT_COLORS);
    if (activeUnits.length === all.length) setActiveUnits([]);
    else setActiveUnits(all);
  };

  // The subset of columns we actually render
  const visibleFixed = FIXED_COLS.filter(c => showFixed.includes(c.id));
  const visibleGroups = SUBJECT_GROUPS.filter(g => showGroups.includes(g.id));
  const visibleExtra = EXTRA_COLS.filter(c => showExtra.includes(c.id));

  // Build rows array matching filters
  const rows = useMemo(() => {
    const arr = [];
    Object.entries(data).forEach(([unit, students]) => {
      if (!activeUnits.includes(unit)) return;
      students.forEach(st => {
        if (activeGrades.length > 0 && !activeGrades.includes(String(st.gradeLevel))) return;
        arr.push(st);
      });
    });
    // Optional: Sort by unit, then by grade level, then name
    return arr.sort((a,b) => {
      if (a.unit !== b.unit) return a.unit.localeCompare(b.unit);
      const ga = parseInt(a.gradeLevel) || 0;
      const gb = parseInt(b.gradeLevel) || 0;
      if (ga !== gb) return ga - gb;
      return a.name.localeCompare(b.name);
    });
  }, [data, activeUnits, activeGrades]);

  // Export to Excel
  const exportExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`${activeTerm} Grades`);

    // Build Header
    const hdrFixed = visibleFixed.map(c => c.label);
    const hdrGroups = visibleGroups.flatMap(g => g.cols.map(c => c.label));
    const hdrExtra = visibleExtra.map(c => c.label);
    ws.addRow([...hdrFixed, ...hdrGroups, ...hdrExtra]);

    // Build Data Rows
    rows.forEach(r => {
      const fixedVals = visibleFixed.map(c => r[c.id]);
      const groupVals = visibleGroups.flatMap(g => g.cols.map(c => r[c.key]));
      const extraVals = visibleExtra.map(c => r[c.id]);
      ws.addRow([...fixedVals, ...groupVals, ...extraVals]);
    });

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), `GradeSpreadsheet_${activeTerm}_Lakeland.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12 w-full flex-col">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm font-medium text-slate-500">Compiling LIVE Quarter Grades...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 relative w-full overflow-hidden">
      
      {/* Top Config Header */}
      <div className="shrink-0 bg-white border-b border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between md:items-start">
          
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex items-center gap-3">
              <select
                value={activeTerm}
                onChange={e => setActiveTerm(e.target.value)}
                className="p-1 px-2 rounded border border-slate-300 text-sm font-bold text-slate-700 outline-none hover:border-indigo-400 bg-slate-50 cursor-pointer"
              >
                <option value="All">All Terms</option>
                {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
              <button 
                onClick={fetchData} 
                className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors"
                title="Refresh Live Data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Units Filter */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Units Filter</span>
                <button
                  onClick={toggleAllUnits}
                  className="text-[10px] text-indigo-600 hover:underline ml-1 font-semibold"
                >
                  {activeUnits.length === Object.keys(UNIT_COLORS).length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(UNIT_COLORS).map(u => (
                  <button
                    key={u}
                    onClick={() => toggleItem(activeUnits, setActiveUnits, u)}
                    className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${
                      activeUnits.includes(u)
                        ? 'bg-white shadow-sm'
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-200'
                    }`}
                    style={activeUnits.includes(u) ? { borderColor: UNIT_COLORS[u], color: UNIT_COLORS[u] } : {}}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Grade Levels Filter */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-6">Grades Filter</span>
              <div className="flex flex-wrap gap-1 pl-6">
                <button
                  onClick={() => setActiveGrades([])}
                  className={`px-2 py-1 rounded text-xs font-bold transition-colors border ${
                    activeGrades.length === 0 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                  }`}
                >All</button>
                {GRADE_LEVELS.map(g => (
                  <button
                    key={g}
                    onClick={() => toggleItem(activeGrades, setActiveGrades, g)}
                    className={`px-2 py-1 rounded text-xs font-bold transition-colors border ${
                      activeGrades.includes(g) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0 md:items-end w-full md:w-auto">
            <button
              onClick={exportExcel}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-700 transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Export XLSX
            </button>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition flex items-center justify-center gap-2"
            >
              Column Configuration {showConfig ? '↑' : '↓'}
            </button>
          </div>
        </div>
        
        {/* Column Config Dropdown equivalent */}
        {showConfig && (
          <div className="mt-4 p-4 border border-indigo-100 bg-indigo-50/50 rounded-xl flex flex-col gap-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configure Spreadsheet Columns</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Student Info</label>
                {FIXED_COLS.map(c => (
                  <ToggleBtn key={c.id} label={c.label} active={showFixed.includes(c.id)} onClick={() => toggleItem(showFixed, setShowFixed, c.id)} />
                ))}
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Subject Areas</label>
                <div className="grid grid-cols-2 gap-2">
                  {SUBJECT_GROUPS.map(g => (
                    <ToggleBtn key={g.id} label={g.label} active={showGroups.includes(g.id)} onClick={() => toggleItem(showGroups, setShowGroups, g.id)} />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Additional Data</label>
                {EXTRA_COLS.map(c => (
                  <ToggleBtn key={c.id} label={c.label} active={showExtra.includes(c.id)} onClick={() => toggleItem(showExtra, setShowExtra, c.id)} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Spreadsheet Main View */}
      <div className="flex-1 overflow-auto bg-slate-50 p-4 w-full">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <FileSpreadsheet className="w-10 h-10 mb-2 opacity-20" />
            <p>No student records match the active filters.</p>
          </div>
        ) : (
          <div className="inline-block min-w-full align-middle bg-white border border-slate-200 shadow-sm">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-300">
                  {/* Fixed Headers */}
                  {visibleFixed.map((c, i) => (
                    <th key={c.id} className={`sticky top-0 bg-slate-100/90 z-10 px-3 py-2 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200 ${i === 0 ? 'sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-20' : ''}`}>
                      {c.label}
                    </th>
                  ))}
                  {/* Subject Group Headers */}
                  {visibleGroups.map(g => (
                    <th key={g.id} colSpan={g.cols.length} className="sticky top-0 bg-slate-100/90 z-10 px-3 py-2 text-center text-[11px] font-bold text-slate-800 uppercase tracking-wider border-r border-slate-300">
                      {g.label}
                    </th>
                  ))}
                  {/* Extra Headers */}
                  {visibleExtra.map(c => (
                    <th key={c.id} className="sticky top-0 bg-slate-100/90 z-10 px-3 py-2 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200">
                      {c.label}
                    </th>
                  ))}
                </tr>
                {/* Secondary Subject Info Headers */}
                {visibleGroups.length > 0 && (
                  <tr className="bg-white border-b border-slate-200">
                    {visibleFixed.map((c, i) => (
                      <th key={`sec-${c.id}`} className={`top-[35px] bg-white z-10 border-r border-slate-200 ${i === 0 ? 'sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-20' : ''}`}></th>
                    ))}
                    {visibleGroups.map(g => g.cols.map((col, idx) => (
                      <th key={`sec-${g.id}-${idx}`} className={`top-[35px] bg-white z-10 px-2 py-1.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider border-r border-slate-100 ${idx === g.cols.length - 1 ? 'border-r-slate-300' : ''}`}>
                        {col.label}
                      </th>
                    )))}
                    {visibleExtra.map(c => (
                      <th key={`sec-ex-${c.id}`} className="top-[35px] bg-white z-10 border-r border-slate-200"></th>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {rows.map((r, rIdx) => (
                  <tr key={r.id || rIdx} className="hover:bg-slate-50 transition-colors group">
                    {/* Fixed Cells */}
                    {visibleFixed.map((c, i) => {
                      const val = r[c.id];
                      const isName = c.id === 'name';
                      const isUnit = c.id === 'unit';
                      return (
                        <td key={`${r.id}-${c.id}`} className={`px-3 py-1.5 whitespace-nowrap text-xs border-r border-slate-100 ${
                          i === 0 ? 'sticky left-0 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10' : ''
                        }`}>
                          {isName ? (
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: UNIT_COLORS[r.unit] || '#ccc' }} />
                              <span className="font-bold text-slate-800">{val}</span>
                            </div>
                          ) : isUnit ? (
                            <span className="font-semibold text-[10px] uppercase" style={{ color: UNIT_COLORS[val] }}>{val}</span>
                          ) : (
                            <span className="text-slate-600 font-medium">{val}</span>
                          )}
                        </td>
                      );
                    })}
                    {/* Subject Cells */}
                    {visibleGroups.map(g => g.cols.map((col, idx) => {
                      const val = r[col.key] || '';
                      return (
                        <td key={`${r.id}-${col.key}`} className={`px-2 py-1.5 whitespace-nowrap text-xs border-r border-slate-100 text-center ${idx === g.cols.length - 1 ? 'border-r-slate-300' : ''}`}>
                          {col.isGrade ? (
                            <span className="font-black px-1.5 py-0.5 rounded" style={{ color: gradeColor(val), backgroundColor: `${gradeColor(val)}15` }}>
                              {val || '-'}
                            </span>
                          ) : col.isPct ? (
                            <span className="text-slate-500 font-mono text-[11px]">{val ? `${val}%` : '-'}</span>
                          ) : (
                            <span className="text-slate-500 text-[10px] truncate max-w-[100px] inline-block" title={val}>{val || '-'}</span>
                          )}
                        </td>
                      );
                    }))}
                    {/* Extra Cells */}
                    {visibleExtra.map(c => (
                       <td key={`${r.id}-${c.id}`} className="px-3 py-1.5 whitespace-nowrap text-xs border-r border-slate-100 text-center text-slate-500">
                         {r[c.id] || '-'}
                       </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuarterSpreadsheetView;
