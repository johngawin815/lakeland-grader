import React from 'react';
import { X, FileDown, Download } from 'lucide-react';

const ReportCardExportModal = ({ isOpen, onClose, student, currentSubject, onDownload }) => {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl shadow-slate-900/10 w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-200/80 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <span className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600"><FileDown className="w-5 h-5" /></span>
            Export Report Card
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-200/50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-indigo-50 border border-indigo-200/50 rounded-xl p-4">
            <p className="text-sm text-indigo-900 font-medium">
              Ready to export grades for <span className="font-bold">{student.name}</span>.
            </p>
            <div className="mt-2 flex justify-between items-end">
              <span className="text-xs text-indigo-600 uppercase font-bold tracking-wider">{currentSubject}</span>
              <span className="text-3xl font-bold text-indigo-700">{student.finalPercentage ? student.finalPercentage.toFixed(1) : '0.0'}%</span>
            </div>
          </div>

          <p className="text-sm text-slate-500">
            This will generate a PDF report card including all graded assignments and attendance records for the current term.
          </p>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={onClose}
              className="w-full bg-slate-100 text-slate-700 font-bold py-3 px-6 rounded-xl hover:bg-slate-200/80 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-colors duration-200 ease-in-out"
            >
              Cancel
            </button>
            <button 
              onClick={async () => {
                await onDownload();
                onClose();
              }}
              className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCardExportModal;