import React from 'react';
import { X, FileDown, Download } from 'lucide-react';

const ReportCardExportModal = ({ isOpen, onClose, student, currentSubject }) => {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileDown className="w-5 h-5 text-teal-600" /> 
            Export Report Card
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-teal-50 border border-teal-100 rounded-lg p-4">
            <p className="text-sm text-teal-800 font-medium">
              Ready to export grades for <span className="font-bold">{student.name}</span>.
            </p>
            <div className="mt-2 flex justify-between items-end">
              <span className="text-xs text-teal-600 uppercase font-bold tracking-wider">{currentSubject}</span>
              <span className="text-2xl font-bold text-teal-700">{student.finalPercentage ? student.finalPercentage.toFixed(1) : '0.0'}%</span>
            </div>
          </div>

          <p className="text-sm text-slate-500">
            This will generate a PDF report card including all graded assignments and attendance records for the current term.
          </p>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-lg font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                alert(`Downloading report for ${student.name}...`);
                onClose();
              }}
              className="flex-1 py-2.5 px-4 rounded-lg font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCardExportModal;