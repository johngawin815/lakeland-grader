import React, { useState, useMemo, useEffect } from 'react';
import { X, Download, CheckSquare, Square, Loader2, Users } from 'lucide-react';
import JSZip from 'jszip';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import { calculateLetterGrade } from '../../utils/gradeCalculator';
import { getAcademicQuarter, getCurrentSchoolYear } from '../../utils/smartUtils';

const BatchExportModal = ({ isOpen, onClose, students, finalGrades, formData, templateConfig }) => {
  const [selectedIds, setSelectedIds] = useState(() => new Set(students.map(s => s.id)));
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Upper level template config for grade-level-based auto-selection
  const UPPER_LEVEL_CONFIG = {
    id: 'upper_level',
    label: 'Upper Level Grade Card',
    filename: 'Upper Level Grade Card.docx',
  };

  useEffect(() => {
    if (students.length > 0) {
      setSelectedIds(new Set(students.map(s => s.id)));
    }
  }, [students]);

  const studentsWithGrades = useMemo(() => {
    return students.map(s => ({
      ...s,
      grade: finalGrades[s.id],
      letter: finalGrades[s.id] !== null && finalGrades[s.id] !== undefined
        ? calculateLetterGrade(finalGrades[s.id])
        : null,
    }));
  }, [students, finalGrades]);

  const selectedCount = selectedIds.size;

  if (!isOpen) return null;

  const toggleStudent = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(students.map(s => s.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const handleExport = async () => {
    const selected = studentsWithGrades.filter(s => selectedIds.has(s.id) && s.grade != null);
    if (selected.length === 0) return;

    setExporting(true);
    setProgress(0);

    try {
      // Pre-fetch both templates
      const defaultFilename = templateConfig?.filename || 'quarter_card_template.docx';
      const upperFilename = UPPER_LEVEL_CONFIG.filename;

      const [defaultResp, upperResp, elemResp] = await Promise.all([
        fetch(`/templates/${defaultFilename}`),
        fetch(`/templates/${upperFilename}`),
        fetch(`/templates/grade_card_elementary_grand.docx`),
      ]);
      if (!defaultResp.ok) throw new Error(`Template not found: ${defaultFilename}`);

      const defaultBuffer = await defaultResp.arrayBuffer();
      const upperBuffer = upperResp.ok ? await upperResp.arrayBuffer() : null;
      const elemBuffer = elemResp.ok ? await elemResp.arrayBuffer() : null;

      const zip = new JSZip();

      for (let i = 0; i < selected.length; i++) {
        const student = selected[i];
        const gradeLevel = parseInt(student.gradeLevel || formData?.gradeLevel || '0', 10);
        const useUpperLevel = gradeLevel >= 9 && gradeLevel <= 12 && upperBuffer;
        const useElementary = gradeLevel >= 1 && gradeLevel <= 5 && elemBuffer;

        const templateBuffer = useUpperLevel ? upperBuffer : useElementary ? elemBuffer : defaultBuffer;
        const docZip = new PizZip(templateBuffer);
        const doc = new Docxtemplater(docZip, {
          paragraphLoop: true,
          linebreaks: true,
          nullGetter: () => '',
        });

        let data;
        if (useUpperLevel) {
          const qMap = { Q1: 'q1', Q2: 'q2', Q3: 'q3', Q4: 'q4', Summer: 'q5' };
          const qPrefix = qMap[formData?.quarterName] || 'q1';

          data = {
            student_name: student.name,
            school_year: formData?.schoolYear || getCurrentSchoolYear(),
            grade: formData?.gradeLevel || '',
            admit_date: formData?.admitDate || '',
            discharge_date: formData?.dischargeDate || '',
          };

          const subjects = [
            { prefix: 'eng', row: 1 },
            { prefix: 'math', row: 2 },
            { prefix: 'sci', row: 3 },
            { prefix: 'soc', row: 4 },
            { prefix: 'elec1', row: 5 },
            { prefix: 'elec2', row: 6 },
          ];

          subjects.forEach(({ prefix, row }) => {
            data[`${qPrefix}_r${row}_credits`] = formData?.[`${prefix}Credits`] || '';
            data[`${qPrefix}_r${row}_course`] = formData?.[`${prefix}Class`] || '';
            data[`${qPrefix}_r${row}_grade`] = formData?.[`${prefix}Grade`] || '';
            data[`${qPrefix}_r${row}_instructor`] = formData?.[`${prefix}Instructor`] || '';
          });
        } else if (useElementary) {
          const qNum = (formData?.quarterName || 'Q1').replace('Q', '');
          data = {
            student_name: student.name,
            school_year: formData?.schoolYear || getCurrentSchoolYear(),
            grade_level: student.gradeLevel || formData?.gradeLevel || '',
            teacher: formData?.teacherName || '',
            admit_date: formData?.admitDate || '',
            discharge_date: formData?.dischargeDate || '',
          };
          data[`q${qNum}_subj1`] = formData?.engGrade || student.letter || '';
          data[`q${qNum}_subj2`] = formData?.mathGrade || '';
          data[`q${qNum}_subj3`] = formData?.sciGrade || '';
          data[`q${qNum}_subj4`] = formData?.socGrade || '';
          data[`q${qNum}_subj5`] = formData?.elec1Grade || '';
          
          for (let b = 1; b <= 22; b++) {
            data[`q${qNum}_beh${b}`] = 'S';
          }
        } else {
          data = {
            student_name: student.name,
            grade_level: formData?.gradeLevel || '',
            school_year: formData?.schoolYear || getCurrentSchoolYear(),
            quarter_name: formData?.quarterName || getAcademicQuarter(),
            report_date: formData?.reportDate || new Date().toLocaleDateString(),
            teacher_name: formData?.teacherName || '',
            total_credits: formData?.totalCredits || '',
            comments: `Current grade: ${student.grade != null ? student.grade.toFixed(1) : '0.0'}% (${student.letter || 'N/A'})`,

            eng_class: formData?.engClass || 'English',
            eng_grade: formData?.engGrade || '',
            eng_pct: formData?.engPct || '',
            eng_cred: formData?.engCredits || '',
            math_class: formData?.mathClass || 'Math',
            math_grade: formData?.mathGrade || '',
            math_pct: formData?.mathPct || '',
            math_cred: formData?.mathCredits || '',
            sci_class: formData?.sciClass || 'Science',
            sci_grade: formData?.sciGrade || '',
            sci_pct: formData?.sciPct || '',
            sci_cred: formData?.sciCredits || '',
            soc_class: formData?.socClass || 'Social Studies',
            soc_grade: formData?.socGrade || '',
            soc_pct: formData?.socPct || '',
            soc_cred: formData?.socCredits || '',

            elec1_class: formData?.elec1Class || '',
            elec1_grade: student.letter || '',
            elec1_pct: student.grade?.toFixed(1) || '',
            elec1_cred: formData?.elec1Credits || '',
            elec2_class: formData?.elec2Class || '',
            elec2_grade: formData?.elec2Grade || '',
            elec2_pct: formData?.elec2Pct || '',
            elec2_cred: formData?.elec2Credits || '',
          };
        }

        doc.render(data);

        const docBlob = doc.getZip().generate({ type: 'arraybuffer' });
        zip.file(`${student.name}_GradeCard.docx`, docBlob);

        setProgress(((i + 1) / selected.length) * 100);
        
        // Yield to the main thread so React can paint the progress bar
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `GradeCards_Batch_${new Date().toISOString().split('T')[0]}.zip`);

    } catch (error) {
      console.error('Batch export error:', error);
      toast.error('Error during batch export. Ensure template files exist in public/templates/.');
    } finally {
      setExporting(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl shadow-slate-900/10 w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="p-6 border-b border-slate-200/80 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <span className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600"><Users className="w-6 h-6" /></span>
            Batch Export Grade Cards
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-200/50">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-200/60 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">{selectedCount} of {students.length} selected</span>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Select All</button>
            <span className="text-slate-300">|</span>
            <button onClick={deselectAll} className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">Deselect All</button>
          </div>
        </div>

        {/* Student List */}
        <div className="max-h-[280px] overflow-y-auto px-6 py-3 divide-y divide-slate-100">
          {studentsWithGrades.map(s => (
            <button
              key={s.id}
              onClick={() => toggleStudent(s.id)}
              className="w-full flex items-center gap-3 py-3 px-2 hover:bg-slate-50 rounded-lg transition-colors text-left"
            >
              {selectedIds.has(s.id)
                ? <CheckSquare className="w-5 h-5 text-indigo-600 shrink-0" />
                : <Square className="w-5 h-5 text-slate-300 shrink-0" />
              }
              <span className="flex-1 text-sm font-bold text-slate-700">{s.name}</span>
              <span className={`text-sm font-bold ${s.grade != null ? (s.grade >= 60 ? 'text-emerald-600' : 'text-rose-600') : 'text-slate-400 italic'}`}>
                {s.grade != null ? `${s.grade.toFixed(1)}% (${s.letter})` : 'N/A'}
              </span>
            </button>
          ))}
        </div>

        {/* Progress Bar */}
        {exporting && (
          <div className="px-6 py-3 border-t border-slate-200/60">
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 font-medium text-center mt-2">
              Generating... {Math.round(progress)}%
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-slate-200/80 flex gap-3">
          <button
            onClick={onClose}
            className="w-full bg-slate-100 text-slate-700 font-bold py-3 px-6 rounded-xl hover:bg-slate-200/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || selectedCount === 0}
            className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {exporting ? 'Exporting...' : `Export ${selectedCount} Cards (ZIP)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchExportModal;
