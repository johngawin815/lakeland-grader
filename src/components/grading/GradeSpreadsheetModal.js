import React, { useState, useEffect, useMemo } from 'react';
import { useAutoSave } from '../../hooks/useAutoSave';
import { X, FileSpreadsheet, Download, Filter, Loader2 } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { databaseService } from '../../services/databaseService';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const GRADE_LEVELS = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const COLUMNS = [
  { id: 'name', label: 'Student Name', default: true },
  { id: 'gradeLevel', label: 'Grade Level', default: true },
  { id: 'unit', label: 'Unit', default: false },
  { id: 'subject', label: 'Subject', default: true },
  { id: 'grade', label: 'Grade', default: true },
  { id: 'percentage', label: 'Percentage', default: true },
  { id: 'absences', label: 'Absences', default: false },
];

const GradeSpreadsheetModal = ({ isOpen, onClose, onAutoSave }) => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);

  const [selectedQuarters, setSelectedQuarters] = useState(['Q3']);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedColumns, setSelectedColumns] = useState(
    COLUMNS.filter(c => c.default).map(c => c.id)
  );

  useEffect(() => {
    if (!isOpen) return;

    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const allStudents = await databaseService.getAllStudents();
        setStudents(allStudents.filter(s => s.active !== false));

        // Auto-save status feedback
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students. Using empty dataset.');
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [isOpen]);

  const filteredStudents = useMemo(() => {
    let result = students;
    if (selectedGradeLevel) {
      result = result.filter(s => String(s.gradeLevel) === selectedGradeLevel);
    }
    if (selectedUnit) {
      result = result.filter(s => s.unit === selectedUnit);
    }
    return result;
  }, [students, selectedGradeLevel, selectedUnit]);

  const availableUnits = useMemo(() => {
    const units = new Set(students.map(s => s.unit).filter(Boolean));
    return Array.from(units).sort();
  }, [students]);

  const previewData = useMemo(() => {
    return filteredStudents.slice(0, 10).map(s => {
      const row = {};
      if (selectedColumns.includes('name')) row['Student Name'] = s.name || `${s.firstName} ${s.lastName}`;
      if (selectedColumns.includes('gradeLevel')) row['Grade Level'] = s.gradeLevel || '';
      if (selectedColumns.includes('unit')) row['Unit'] = s.unit || '';
      if (selectedColumns.includes('subject')) row['Subject'] = s.grades?.[0]?.subject || '';
      if (selectedColumns.includes('grade')) row['Grade'] = s.grades?.[0]?.Q1 || '';
      if (selectedColumns.includes('percentage')) row['Percentage'] = '';
      if (selectedColumns.includes('absences')) row['Absences'] = '';
      return row;
    });
  }, [filteredStudents, selectedColumns]);

  const toggleQuarter = (q) => {
    setSelectedQuarters(prev =>
      prev.includes(q) ? prev.filter(x => x !== q) : [...prev, q]
    );
  };

  const toggleColumn = (colId) => {
    setSelectedColumns(prev =>
      prev.includes(colId) ? prev.filter(x => x !== colId) : [...prev, colId]
    );
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Grades');

      const headers = selectedColumns.map(id => COLUMNS.find(c => c.id === id)?.label || id);
      ws.addRow(headers);

      filteredStudents.forEach(student => {
        const name = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim();

        if (student.grades && student.grades.length > 0) {
          student.grades.forEach(grade => {
            const row = [];
            selectedColumns.forEach(colId => {
              switch (colId) {
                case 'name': row.push(name); break;
                case 'gradeLevel': row.push(student.gradeLevel || ''); break;
                case 'unit': row.push(student.unit || ''); break;
                case 'subject': row.push(grade.subject || ''); break;
                case 'grade':
                  const qGrades = selectedQuarters.map(q => grade[q]).filter(Boolean);
                  row.push(qGrades.join(', ') || '');
                  break;
                case 'percentage': row.push(grade.percentage || ''); break;
                case 'absences': row.push(student.totalAbsences || ''); break;
                default: row.push('');
              }
            });
            ws.addRow(row);
          });
        } else {
          const row = [];
          selectedColumns.forEach(colId => {
            switch (colId) {
              case 'name': row.push(name); break;
              case 'gradeLevel': row.push(student.gradeLevel || ''); break;
              case 'unit': row.push(student.unit || ''); break;
              default: row.push('');
            }
          });
          ws.addRow(row);
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const quarterLabel = selectedQuarters.join('_') || 'All';
      saveAs(
        new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `Grade_Report_${quarterLabel}_${new Date().toISOString().split('T')[0]}.xlsx`
      );
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export spreadsheet.');
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl shadow-slate-900/10 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-slate-200/80 flex justify-between items-center shrink-0">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <span className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600"><FileSpreadsheet className="w-6 h-6" /></span>
            Grade Spreadsheet Export
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-200/50">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-slate-200/60 space-y-5 shrink-0">

          {/* Quarters */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quarter Selection</label>
            <div className="flex gap-2">
              {QUARTERS.map(q => (
                <button
                  key={q}
                  onClick={() => toggleQuarter(q)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${selectedQuarters.includes(q) ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Grade Level */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Grade Level</label>
              <select
                value={selectedGradeLevel}
                onChange={(e) => setSelectedGradeLevel(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300/80 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
              >
                <option value="">All Grade Levels</option>
                {GRADE_LEVELS.map(gl => <option key={gl} value={gl}>Grade {gl}</option>)}
              </select>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Unit</label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300/80 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
              >
                <option value="">All Units</option>
                {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Column Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Filter className="w-3 h-3 inline mr-1" /> Columns
            </label>
            <div className="flex flex-wrap gap-2">
              {COLUMNS.map(col => (
                <button
                  key={col.id}
                  onClick={() => toggleColumn(col.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedColumns.includes(col.id) ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'}`}
                >
                  {col.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Table */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-3" />
              <span className="text-sm font-medium text-slate-500">Loading students...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-amber-600 font-medium">{error}</p>
            </div>
          ) : previewData.length > 0 ? (
            <>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Preview (first 10 of {filteredStudents.length})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      {Object.keys(previewData[0]).map(col => (
                        <th key={col} className="text-left p-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="p-2.5 text-slate-700">{val || <span className="text-slate-300">—</span>}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-sm text-slate-400">
              No students match current filters
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200/80 flex items-center justify-between shrink-0 bg-slate-50/50">
          <span className="text-sm font-bold text-slate-600">
            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} to export
          </span>
          <button
            onClick={handleExport}
            disabled={exporting || filteredStudents.length === 0}
            className="bg-indigo-600 text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {exporting ? 'Exporting...' : 'Export to .XLSX'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GradeSpreadsheetModal;
