import React, { useState, useCallback, useEffect } from 'react';
import { useAutoSave } from '../../hooks/useAutoSave';
import { Upload, FileText, CheckCircle, Lock, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { databaseService } from '../../services/databaseService';

const DocumentUploadPortal = ({ onBack }) => {
  const [passcodeInput, setPasscodeInput] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const LS_KEY = `documentUpload_${studentData?.id || 'anon'}`;
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Auto-save integration
  const saveFn = useCallback(async () => {
    if (!studentData) return;
    await databaseService.upsertStudent({
      ...studentData,
      uploadedDocuments: studentData.uploadedDocuments || [],
      lastModified: new Date().toISOString(),
    });
    setIsDirty(false);
  }, [studentData]);

  useAutoSave(isDirty, saveFn, { delay: 3000, enabled: !!studentData });

  // Mark dirty on uploaded documents change
  useEffect(() => {
    if (studentData) {
      setIsDirty(true);
      if (studentData.id) localStorage.setItem(LS_KEY, JSON.stringify(studentData));
    }
  }, [studentData, LS_KEY]);

  const verifyPasscode = async () => {
    setError('');
    setVerifying(true);
    try {
      const allStudents = await databaseService.getAllStudents();
      const code = passcodeInput.toUpperCase().trim();
      const student = allStudents.find(s =>
        s.uploadPasscode && s.uploadPasscode.toUpperCase() === code
      );
      if (!student) {
        setError('Invalid passcode. Please check and try again.');
        setVerifying(false);
        return;
      }
      setStudentData(student);
      setAuthenticated(true);
    } catch (err) {
      setError('Unable to verify passcode. Please try again.');
      console.error('Passcode verification failed:', err);
    }
    setVerifying(false);
  };

  const handleFiles = useCallback(async (files) => {
    if (!studentData) return;
    setUploading(true);

    const newDocs = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the 5MB limit and was skipped.`);
        continue;
      }
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      newDocs.push({
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fileName: file.name,
        fileSize: file.size,
        uploadedBy: 'Home School Upload',
        uploadedAt: new Date().toISOString(),
        dataUrl,
      });
    }

    if (newDocs.length > 0) {
      const updatedDocs = [...(studentData.uploadedDocuments || []), ...newDocs];
      setStudentData(prev => ({ ...prev, uploadedDocuments: updatedDocs }));
      setUploadedFiles(prev => [...prev, ...newDocs.map(d => d.fileName)]);
      setIsDirty(true);
    }
    setUploading(false);
  }, [studentData]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFiles(files);
  }, [handleFiles]);

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) handleFiles(files);
    e.target.value = '';
  };

  // --- Passcode Entry Screen ---
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/60 w-full max-w-md p-8 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Secure Document Upload</h1>
            <p className="text-sm text-slate-500 mt-2">
              Lakeland Regional School &middot; Educational Records Portal
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Enter Passcode
              </label>
              <input
                type="text"
                value={passcodeInput}
                onChange={e => { setPasscodeInput(e.target.value.toUpperCase()); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && verifyPasscode()}
                placeholder="e.g., ABC123"
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center text-2xl font-mono font-bold tracking-[0.3em] text-indigo-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white outline-none transition-all placeholder:text-slate-300 placeholder:text-lg placeholder:tracking-normal"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200/80 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-xs font-semibold text-red-700">{error}</span>
              </div>
            )}

            <button
              onClick={verifyPasscode}
              disabled={passcodeInput.length < 6 || verifying}
              className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {verifying ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
              ) : (
                'Verify & Continue'
              )}
            </button>
          </div>

          <p className="text-[11px] text-center text-slate-400">
            This passcode was provided by Lakeland staff. Contact them if you need assistance.
          </p>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-indigo-500 transition-colors pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Login
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- Upload Screen ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/60 w-full max-w-lg p-8 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Upload Educational Records</h1>
          <p className="text-sm text-slate-500 mt-2">
            Securely upload documents for student records
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragOver
              ? 'border-indigo-400 bg-indigo-50/50'
              : 'border-slate-200 hover:border-indigo-300'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm font-medium text-slate-600">Uploading...</p>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600 mb-1">
                Drag and drop files here
              </p>
              <p className="text-xs text-slate-400 mb-4">PDF, images, Word documents (max 5MB each)</p>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20">
                <Upload className="w-4 h-4" />
                Choose Files
                <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif" onChange={handleFileInput} className="sr-only" />
              </label>
            </>
          )}
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Successfully Uploaded
            </p>
            {uploadedFiles.map((name, i) => (
              <div key={i} className="flex items-center gap-3 bg-emerald-50 rounded-lg px-3 py-2.5 border border-emerald-200/60">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-sm font-medium text-emerald-800 truncate">{name}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-center text-slate-400">
          Documents are securely stored and accessible only to authorized Lakeland staff.
        </p>
      </div>
    </div>
  );
};

export default DocumentUploadPortal;
