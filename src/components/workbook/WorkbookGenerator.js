import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  NotebookPen, Key, Sparkles, ArrowLeft, Printer,
  Save, Loader2, Plus, AlertTriangle, Settings, Wrench,
  Layers, LayoutTemplate, MonitorPlay, Network, FileText, GalleryHorizontalEnd, CheckSquare, Table, UploadCloud
} from 'lucide-react';
import { useAutoSave } from '../../hooks/useAutoSave';
import { saveAs } from 'file-saver';
import { databaseService } from '../../services/databaseService';
import {
  hasApiKey, getApiKey, setApiKey,
  generateWorkbook, repairWorkbook, testConnection
} from '../../services/geminiService';
import { 
  PRINT_ENGINE_CSS, STRUCTURAL_REFERENCE, SINGLE_ACTIVITY_REFERENCE,
  SLIDE_DECK_REFERENCE, FLASH_CARD_REFERENCE, MIND_MAP_REFERENCE, 
  TABLE_INFOGRAPHIC_REFERENCE, QUIZ_REFERENCE, REPORT_REFERENCE
} from '../../data/workbookCssTemplate';
import { MLS_STANDARDS } from '../../data/missouriStandards';
import { generatePdfBlob } from '../../services/pdfService';
import { uploadToOneDrive } from '../../services/oneDriveService';
import { isMsalConfigured } from '../../config/msalInstance';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const READING_LEVELS = [
  { value: 'Kindergarten (Lexile BR–100L)', label: 'Kindergarten (BR–100L)' },
  { value: '1st Grade (Lexile 100L–200L)', label: '1st Grade (100L–200L)' },
  { value: '2nd Grade (Lexile 200L–400L)', label: '2nd Grade (200L–400L)' },
  { value: '3rd Grade (Lexile 400L–500L)', label: '3rd Grade (400L–500L)' },
  { value: '4th Grade (Lexile 500L–700L)', label: '4th Grade (500L–700L)' },
  { value: '5th Grade (Lexile 700L–800L)', label: '5th Grade (700L–800L)' },
  { value: '6th Grade (Lexile 800L–900L)', label: '6th Grade (800L–900L)' },
  { value: '7th Grade (Lexile 900L–1000L)', label: '7th Grade (900L–1000L)' },
  { value: '8th Grade (Lexile 1000L–1050L)', label: '8th Grade (1000L–1050L)' },
  { value: '9th Grade (Lexile 1050L–1100L)', label: '9th Grade (1050L–1100L)' },
  { value: '10th Grade (Lexile 1100L–1200L)', label: '10th Grade (1100L–1200L)' },
  { value: '11th Grade (Lexile 1200L–1300L)', label: '11th Grade (1200L–1300L)' },
  { value: '12th Grade (Lexile 1300L–1400L)', label: '12th Grade (1300L–1400L)' },
];

const TEXT_STYLES = [
  'Auto (AI Chooses)', 'Opinion', 'Historical Fiction', 'Informative',
  'Primary Source Document', 'Biography', 'Poetry', 'Drama',
  'Memoir', 'Symbolic Cartoon', 'Documentary Transcript', 'Fiction'
];

const QUESTION_STYLES = [
  'Auto (AI Chooses)', 'Multiple Choice (DOK 1-2)', 'Document-Based Questions (DBQ)',
  'Socratic Seminar Prep', 'Think-Pair-Share Scaffolds', 'Visual Mapping & Sequencing',
  'Short Answer Analytical', 'Extended Essay Scaffold'
];

const MODALITIES = [
  { id: 'unit', label: 'Independent Unit (10-pg)', icon: Layers, template: STRUCTURAL_REFERENCE, group: 'Student Facing' },
  { id: 'single', label: 'Single Activity (1-2 pg)', icon: LayoutTemplate, template: SINGLE_ACTIVITY_REFERENCE, group: 'Student Facing' },
  { id: 'flashcards', label: 'Printable Flash Cards', icon: GalleryHorizontalEnd, template: FLASH_CARD_REFERENCE, group: 'Student Facing' },
  { id: 'quiz', label: 'Quiz / Assessment', icon: CheckSquare, template: QUIZ_REFERENCE, group: 'Student Facing' },
  { id: 'slide', label: 'Slide Deck Outline', icon: MonitorPlay, template: SLIDE_DECK_REFERENCE, group: 'Teacher Tools' },
  { id: 'mindmap', label: 'Concept Mind Map', icon: Network, template: MIND_MAP_REFERENCE, group: 'Teacher Tools' },
  { id: 'report', label: 'Analytical Report', icon: FileText, template: REPORT_REFERENCE, group: 'Teacher Tools' },
  { id: 'table', label: 'Data Table Organizers', icon: Table, template: TABLE_INFOGRAPHIC_REFERENCE, group: 'Teacher Tools' }
];

const DAY_SCOPE_SEQUENCE = [
  { day: 1, label: 'Overview & Introduction', directive: 'Activate schema and build background knowledge.', standards: 'ELA: RI.1, L.4, L.6 / SS: Developing questions' },
  { day: 2, label: 'Opinion Texts', directive: 'Read and analyze high-interest opinion/editorial texts.', standards: 'ELA: RI.8, W.1, SL.1 / SS: Civic literacy' },
  { day: 3, label: 'Informational Research', directive: 'Engage with informational texts and research articles.', standards: 'ELA: RI.7, W.2, SL.4 / SS: Evaluating sources' },
  { day: 4, label: 'Primary Source Analysis', directive: 'Examine authentic primary documents.', standards: 'ELA: RI.6, RI.8, RI.9 / SS: Evaluating sources' },
  { day: 5, label: 'Argument & Persuasion', directive: 'Craft evidence-based argumentative writing.', standards: 'ELA: W.1, RI.8, SL.3 / SS: Civic literacy' },
  { day: 6, label: 'Engaging Activity I', directive: 'High-interest creative activity integrating reading and writing.', standards: 'ELA: SL.1, W.4, RI.7 / SS: Applying concepts' },
  { day: 7, label: 'Engaging Activity II', directive: 'Second high-interest activity using a different modality.', standards: 'ELA: SL.4, RI.7, W.6 / SS: Constructing explanations' },
  { day: 8, label: 'Informational Writing', directive: 'Synthesize unit learning into a structured text.', standards: 'ELA: W.2, W.4, W.5 / SS: Communicating conclusions' },
];

function getDayScope(dayNum) {
  if (dayNum >= 1 && dayNum <= 8) return DAY_SCOPE_SEQUENCE[dayNum - 1];
  return null;
}

const AUDIENCE_DIRECTIVE = `CRITICAL AUDIENCE CONSTRAINT: All students are HIGH SCHOOL TEENAGERS (ages 14-18), regardless of the reading level selected. The reading level controls ONLY vocabulary complexity, sentence length, and syntactic sophistication. It does NOT change the target age group. References, examples, and narrative protagonists should reflect teenage life, concerns, and cultural awareness.`;

function buildPreviousDaysContext(savedWorkbooks) {
  if (!savedWorkbooks || savedWorkbooks.length === 0) return '';
  return savedWorkbooks.map(w => `- Day ${w.dayNumber}`).join('\n');
}

function combineUnitHtml(workbooks) {
  const bodies = workbooks.map(wb => {
    const match = wb.htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    return match ? match[1] : wb.htmlContent;
  });
  const title = workbooks[0]?.unitTopic || 'Unit';
  return `<!DOCTYPE html>\n<html lang="en"><head><meta charset="UTF-8">\n<title>${title} — Full Unit</title>\n<style>${PRINT_ENGINE_CSS}</style>\n</head><body>${bodies.join('\n')}</body></html>`;
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

const WorkbookGenerator = ({ user }) => {

  // View: 'setup' | 'library' | 'form' | 'generating' | 'preview'
  const [view, setView] = useState(hasApiKey() ? 'library' : 'setup');

  // API key setup
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Library
  const [allWorkbooks, setAllWorkbooks] = useState([]);
  const [libSearch, setLibSearch] = useState('');
  const [libLoading, setLibLoading] = useState(true);

  // Form Base
  const [modality, setModality] = useState('single');
  const [unitTopic, setUnitTopic] = useState('');
  const [readingLevel, setReadingLevel] = useState(READING_LEVELS[6].value);
  const [sourceText, setSourceText] = useState('');
  const [fileStatus, setFileStatus] = useState('');
  
  // Specifics
  const [dayNumber, setDayNumber] = useState(1);
  const [unitWorkbooks, setUnitWorkbooks] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('ELA');
  const [selectedGradeBand, setSelectedGradeBand] = useState('6-8');
  const [selectedStandard, setSelectedStandard] = useState('');
  const [textStyle, setTextStyle] = useState(TEXT_STYLES[0]);
  const [questionStyle, setQuestionStyle] = useState(QUESTION_STYLES[0]);
  const fileInputRef = useRef(null);

  // Set initial standard when subject/grade band changes
  useEffect(() => {
    const stz = MLS_STANDARDS[selectedSubject]?.gradeBands[selectedGradeBand];
    if (stz && stz.length > 0) setSelectedStandard(stz[0].id);
  }, [selectedSubject, selectedGradeBand]);

  // Handle File Upload (Securely Local)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileStatus(`Parsing ${file.name}...`);
    
    try {
      if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.csv')) {
        const text = await file.text();
        setSourceText(prev => prev + '\n\n' + text);
        setFileStatus(`Added ${file.name}`);
      } else if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setSourceText(prev => prev + '\n\n' + result.value);
        setFileStatus(`Added ${file.name}`);
      } else if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(new Uint8Array(arrayBuffer)).promise;
        let pdfText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map(item => item.str);
          pdfText += strings.join(' ') + '\n';
        }
        setSourceText(prev => prev + '\n\n' + pdfText);
        setFileStatus(`Added ${file.name}`);
      } else {
        setFileStatus('Unsupported file type. Use TXT, PDF, or DOCX.');
      }
    } catch (err) {
      console.error(err);
      setFileStatus('Error reading file.');
    } finally {
      e.target.value = null; // reset
    }
  };

  // Auto-save integration
  const [isDirty, setIsDirty] = useState(false);
  const saveFn = useCallback(async () => {
    await databaseService.saveWorkbookDraft({
      unitTopic, dayNumber, readingLevel, sourceText,
      modality, selectedSubject, selectedGradeBand, selectedStandard, textStyle, questionStyle,
      lastModified: new Date().toISOString(),
      modifiedBy: user?.name || 'Unknown',
    });
    setIsDirty(false);
  }, [unitTopic, dayNumber, readingLevel, sourceText, modality, selectedSubject, selectedGradeBand, selectedStandard, textStyle, questionStyle, user]);

  useAutoSave(isDirty, saveFn, { delay: 3000, enabled: !!unitTopic });
  useEffect(() => { if (unitTopic) setIsDirty(true); }, [unitTopic, dayNumber, readingLevel, modality, selectedStandard, textStyle, questionStyle, sourceText]);

  // Generation
  const [streamText, setStreamText] = useState('');
  const [genError, setGenError] = useState('');
  const abortRef = useRef(null);
  const streamContainerRef = useRef(null);

  useEffect(() => {
    if (view === 'generating' && streamContainerRef.current) {
      streamContainerRef.current.scrollTop = streamContainerRef.current.scrollHeight;
    }
  }, [streamText, view]);

  // Preview
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewMeta, setPreviewMeta] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [repairMsg, setRepairMsg] = useState(null);
  const [repairing, setRepairing] = useState(false);
  const iframeRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);

  // ─── LOAD LIBRARY ────────────────────────────────────────────────────────

  const loadLibrary = useCallback(async () => {
    setLibLoading(true);
    try {
      const wbs = await databaseService.getAllWorkbooks();
      setAllWorkbooks(wbs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
    } catch { setAllWorkbooks([]); }
    setLibLoading(false);
  }, []);

  useEffect(() => { if (view === 'library') loadLibrary(); }, [view, loadLibrary]);

  useEffect(() => {
    if (modality === 'unit' && unitTopic.trim()) {
      (async () => {
        const existing = await databaseService.getWorkbooksByUnit(unitTopic.trim());
        setUnitWorkbooks(existing);
        if (existing.length > 0) setDayNumber(Math.min(Math.max(...existing.map(w => w.dayNumber || 0)) + 1, 8));
      })();
    } else { setUnitWorkbooks([]); }
  }, [unitTopic, modality]);

  // ─── GENERATE ─────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    setView('generating');
    setStreamText('');
    setGenError('');
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const agentResp = await fetch('/curriculum_generator_agent.md');
      const agentSpec = await agentResp.text();

      const modConfig = MODALITIES.find(m => m.id === modality);
      const htmlRef = modConfig.template;

      const fullSystemPrompt = [
        agentSpec,
        '\n\n=== MANDATORY CSS (THE MIT PRINT ENGINE V70 PLATINUM B&W APPLE STYLE) ===',
        'You MUST embed this EXACT CSS inside a <style> tag in the <head> of the HTML. Do NOT modify or omit any part of it.\n',
        PRINT_ENGINE_CSS,
        '\n\n=== MANDATORY HTML STRUCTURE REFERENCE ===',
        'You MUST follow this exact DOM structure. Do NOT deviate from these class names or nesting patterns.\n',
        htmlRef,
      ].join('\n');

      let userPrompt = '';
      if (modality === 'unit') {
        const prevContext = buildPreviousDaysContext(unitWorkbooks);
        const scope = getDayScope(dayNumber);
        userPrompt = [
          `[MODE]: Complex 10-page Independent Study Unit`,
          `[Unit Topic]: ${unitTopic.trim()}`,
          `[Day Sequence]: Day ${dayNumber} — ${scope?.label} (${scope?.directive})`,
          `[Target Audience Reading Level]: ${readingLevel}`,
          `\n${AUDIENCE_DIRECTIVE}`,
          prevContext ? `\n--- PREVIOUS DAYS:\\n${prevContext}` : '',
        ].filter(Boolean).join('\n');
      } else {
        const stdText = MLS_STANDARDS[selectedSubject]?.gradeBands[selectedGradeBand]?.find(s => s.id === selectedStandard)?.text || '';
        userPrompt = [
          `[OUTPUT MODALITY REQUIRED]: ${modConfig.label}`,
          `[Topic]: ${unitTopic.trim()}`,
          `[Standard Alignment]: ${selectedStandard} - ${stdText}`,
          `[Target Audience Reading Level]: ${readingLevel}`,
          document && (modality === 'single' || modality === 'quiz') ? `[Text Style]: ${textStyle}` : '',
          document && (modality === 'single' || modality === 'quiz') ? `[Question Format]: ${questionStyle}` : '',
          `\n${AUDIENCE_DIRECTIVE}`,
        ].filter(Boolean).join('\n');
      }

      // NotebookLM Logic: If source text is provided, enforce strictly using it.
      if (sourceText.trim()) {
        userPrompt += `\n\n=== STRICT SOURCE MATERIAL ANCHOR ===\nCRITICAL DIRECTIVE: You MUST base all generated content, worksheets, questions, facts, and slide information STRICTLY on the text provided below. Do not invent external historical facts or contexts outside of this text.\n\n[SOURCE TEXT START]\n${sourceText.trim()}\n[SOURCE TEXT END]`;
      }

      let html = await generateWorkbook({
        systemPrompt: fullSystemPrompt,
        userPrompt,
        onChunk: (text) => setStreamText(text),
        signal: controller.signal,
      });

      if (!html.trimStart().startsWith('<!DOCTYPE') && !html.trimStart().startsWith('<html')) {
        const title = `${unitTopic.trim()} - ${modConfig.label}`;
        html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<title>${title}</title>\n<style>\n${PRINT_ENGINE_CSS}\n</style>\n</head>\n<body>\n${html}\n</body>\n</html>`;
      }

      const meta = {
        unitTopic: unitTopic.trim(),
        dayNumber: modality === 'unit' ? dayNumber : null,
        dayFocus: modality === 'unit' ? getDayScope(dayNumber)?.label : `${selectedStandard} (${modConfig.label})`,
        readingLevel,
        generationMode: modality,
        standard: selectedStandard
      };

      setPreviewHtml(html); setPreviewMeta(meta); setSaved(false); setView('preview');
    } catch (err) {
      if (err.name === 'AbortError') setView('form');
      else setGenError(err.message || 'Generation failed.');
    }
  };

  const handleCancel = () => { abortRef.current?.abort(); setView('form'); };

  // ─── SAVE / REPAIR / EXPORT ─────────────────────────────────────────────
  
  const handleSave = async () => {
    if (!previewMeta || !previewHtml) return;
    setSaving(true); setSaveError(null);
    try {
      const savedRecord = await databaseService.saveWorkbook({
        ...previewMeta, htmlContent: previewHtml,
      });
      setSaved(true);
      if (savedRecord) {
        setAllWorkbooks(prev => {
          const exists = prev.some(w => w.id === savedRecord.id);
          return exists ? prev.map(w => w.id === savedRecord.id ? savedRecord : w) : [...prev, savedRecord];
        });
      }
      await databaseService.logAudit(user, 'WORKBOOK_GENERATED', `${previewMeta.unitTopic} - ${previewMeta.generationMode}`);
    } catch (err) { setSaveError(err.message); } finally { setSaving(false); }
  };

  const handleRepair = () => {
    if (!previewHtml || repairing) return;
    setRepairing(true); setRepairMsg(null);
    setTimeout(() => {
      try {
        const { html, fixes } = repairWorkbook(previewHtml, PRINT_ENGINE_CSS);
        setPreviewHtml(html); setSaved(false);
        setRepairMsg({ type: 'success', text: fixes.length === 0 ? 'No structural issues.' : `Repaired ${fixes.length} issues.` });
      } catch (err) { setRepairMsg({ type: 'error', text: 'Repair failed: ' + err.message }); }
      finally { setRepairing(false); setTimeout(() => setRepairMsg(null), 4000); }
    }, 50);
  };

  const handleDownload = () => {
    if (!previewHtml || !previewMeta) return;
    let html = previewHtml;
    try { const { html: rep } = repairWorkbook(previewHtml, PRINT_ENGINE_CSS); html = rep; } catch { }
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    saveAs(blob, `${previewMeta.unitTopic.replace(/\s+/g, '_')}_${previewMeta.generationMode}.html`);
  };

  const handlePrint = () => iframeRef.current?.contentWindow?.print();
  
  const handleDelete = async (id) => {
    await databaseService.deleteWorkbook(id);
    setAllWorkbooks(prev => prev.filter(w => w.id !== id));
  };

  const handleOpenSaved = (wb) => {
    setPreviewHtml(wb.htmlContent); setPreviewMeta(wb); setSaved(true); setView('preview');
  };

  // ─── FILTERED LIBRARY ────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const filtered = libSearch ? allWorkbooks.filter(w => w.unitTopic?.toLowerCase().includes(libSearch.toLowerCase()) || w.dayFocus?.toLowerCase().includes(libSearch.toLowerCase())) : allWorkbooks;
    const map = {};
    for (const wb of filtered) {
      const key = wb.unitTopic || 'Untitled';
      if (!map[key]) map[key] = { unit: [], single: [] };
      if (wb.generationMode === 'unit') map[key].unit.push(wb);
      else map[key].single.push(wb); // group all singles/reports
    }
    return map;
  }, [allWorkbooks, libSearch]);

  // ─── RENDER BLOCKS ────────────────────────────────────────────────────────

  if (view === 'setup' || showSettings) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Key className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">{showSettings ? 'Settings' : 'Connect to Gemini'}</h2>
              <p className="text-xs text-slate-500">Your API key is safe in this browser.</p>
            </div>
          </div>
          <input type={showKey ? 'text' : 'password'} value={keyInput} onChange={e => { setKeyInput(e.target.value); setTestResult(null); }} placeholder="Gemini API Key..." className="w-full px-3 py-2.5 mb-4 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-400 outline-none" />
          <div className="flex gap-2">
            <button onClick={async () => { setTesting(true); setApiKey(keyInput); setTestResult(await testConnection()); setTesting(false); }} disabled={!keyInput || testing} className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-slate-50 text-xs font-bold text-slate-600 flex items-center justify-center gap-1.5">{testing ? 'Testing...' : 'Test Key'}</button>
            <button onClick={() => { setApiKey(keyInput); setView('library'); setShowSettings(false); }} disabled={!keyInput} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-bold">Save</button>
          </div>
          {testResult && <p className={`mt-3 text-xs font-bold ${testResult.ok ? 'text-green-600' : 'text-red-500'}`}>{testResult.ok ? 'OK' : testResult.error}</p>}
          {showSettings && <button onClick={() => setShowSettings(false)} className="w-full mt-3 px-4 py-2 text-xs font-bold text-slate-500">Cancel</button>}
        </div>
      </div>
    );
  }

  if (view === 'library') {
    return (
      <div className="h-full flex flex-col bg-slate-50/30">
        <div className="shrink-0 px-6 py-4 bg-white border-b flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
             <NotebookPen className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
             <h1 className="text-lg font-extrabold text-slate-900 leading-tight">Notebook Generator</h1>
             <p className="text-[11px] text-slate-500">Curricula & Artifacts via Gemini</p>
          </div>
          <button onClick={() => { setKeyInput(getApiKey()); setShowSettings(true); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><Settings className="w-4 h-4"/></button>
          <button onClick={() => setView('form')} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center gap-1.5 shadow-sm"><Plus className="w-3.5 h-3.5" /> Create New</button>
        </div>
        <div className="flex-1 overflow-auto p-6 space-y-5">
           {libLoading ? <Loader2 className="animate-spin text-blue-500 mx-auto" /> : Object.keys(grouped).length === 0 ? <p className="text-center text-slate-500 text-sm mt-10">No artifacts generated yet.</p> : Object.entries(grouped).map(([u, blocks]) => (
             <div key={u} className="bg-white border rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-3">{u}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   {blocks.unit.map(w => (
                     <div key={w.id} onClick={() => handleOpenSaved(w)} className="border rounded-lg p-2 cursor-pointer hover:border-blue-400 bg-slate-50 group">
                       <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1 py-0.5 rounded">Day {w.dayNumber} (Unit)</span>
                       <p className="text-xs font-medium text-slate-700 mt-1 truncate">{w.dayFocus}</p>
                     </div>
                   ))}
                   {document && blocks.unit.length > 0 && blocks.unit.length < 8 && (
                     <div onClick={() => { setUnitTopic(u); setModality('unit'); setDayNumber(blocks.unit.length+1); setView('form'); }} className="border border-dashed rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 group"><Plus className="w-4 h-4 text-slate-400"/></div>
                   )}
                   {blocks.single.map(w => (
                     <div key={w.id} onClick={() => handleOpenSaved(w)} className="border border-purple-200 rounded-lg p-2 cursor-pointer hover:border-purple-400 bg-purple-50 group">
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-1 py-0.5 rounded">{w.generationMode?.toUpperCase()}</span>
                        <p className="text-xs font-medium text-slate-700 mt-1 truncate">{w.dayFocus}</p>
                     </div>
                   ))}
                </div>
             </div>
           ))}
        </div>
      </div>
    );
  }

  if (view === 'form') {
    const canGenerate = unitTopic.trim();
    return (
      <div className="h-full flex flex-col bg-slate-50/50">
        <div className="shrink-0 px-6 py-4 bg-white border-b flex items-center gap-3 shadow-sm z-10">
           <button onClick={() => setView('library')} className="p-2 -ml-2 text-slate-400 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-4 h-4"/></button>
           <h2 className="text-lg font-extrabold text-slate-800 flex-1">Configure Artifact</h2>
           <button onClick={handleGenerate} disabled={!canGenerate} className="px-6 py-2 bg-slate-900 text-white font-extrabold text-sm rounded-lg hover:bg-black disabled:opacity-50 flex items-center gap-2">
              <Sparkles className="w-4 h-4"/> Generate
           </button>
        </div>
        <div className="flex-1 overflow-auto p-4 md:p-6">
           <div className="max-w-2xl mx-auto space-y-6">
             
             {/* TOPIC & MODE BLOCK */}
             <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                <div>
                   <label className="block text-xs font-bold text-slate-600 mb-1">Topic / Title</label>
                   <input type="text" value={unitTopic} onChange={e => setUnitTopic(e.target.value)} placeholder="e.g. The Gilded Age, Cellular Mitosis..." className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-600 mb-1">Output Modality</label>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                     {MODALITIES.map(m => {
                       const Icon = m.icon;
                       return (
                         <button key={m.id} onClick={() => setModality(m.id)} className={`px-2 py-3 rounded-lg border text-left flex flex-col items-center justify-center gap-2 ${modality === m.id ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-600'}`}>
                           <Icon className="w-5 h-5"/>
                           <span className="text-[10px] text-center leading-tight">{m.label}</span>
                         </button>
                       );
                     })}
                   </div>
                </div>
             </div>

             {/* SOURCE / NOTEBOOK LM BLOCK */}
             <div className="bg-white p-5 rounded-2xl border shadow-sm">
                <div className="flex justify-between items-end mb-2">
                   <label className="block text-xs font-bold text-slate-600">Source Material (Notebook Context)</label>
                   <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Optional</span>
                </div>
                <p className="text-[10px] text-slate-500 mb-3 leading-tight">Paste text or upload documents to force Gemini to build the artifact exclusively from your provided sources.</p>
                <textarea value={sourceText} onChange={e => setSourceText(e.target.value)} placeholder="Paste article text, transcript, or document contents here..." className="w-full h-32 px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none resize-none mb-2" />
                
                <div className="flex items-center gap-3">
                   <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx,.txt,.csv,.md" onChange={handleFileUpload} />
                   <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 border border-dashed border-slate-300 rounded-md text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
                     <UploadCloud className="w-4 h-4 text-blue-500"/> Upload PDF, DOCX, or TXT
                   </button>
                   <span className="text-[10px] text-slate-500 font-medium">{fileStatus}</span>
                </div>
             </div>

             {/* SETTINGS BLOCK */}
             <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                <div>
                   <label className="block text-xs font-bold text-slate-600 mb-1">Reading / Lexile Target</label>
                   <select value={readingLevel} onChange={e => setReadingLevel(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white outline-none">
                     {READING_LEVELS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                   </select>
                </div>

                {modality === 'unit' && (
                   <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Unit Sequence</label>
                      <select value={dayNumber} onChange={e => setDayNumber(parseInt(e.target.value, 10))} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 outline-none">
                         {DAY_SCOPE_SEQUENCE.map(s => <option key={s.day} value={s.day}>Day {s.day}: {s.label}</option>)}
                      </select>
                   </div>
                )}

                {modality !== 'unit' && (
                  <div className="pt-2">
                     <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Subject</label>
                          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50">
                             <option value="ELA">ELA</option><option value="SocialStudies">Social Studies</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Grade Band</label>
                          <select value={selectedGradeBand} onChange={e => setSelectedGradeBand(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50">
                             <option value="6-8">Grades 6-8</option><option value="9-12">Grades 9-12</option>
                          </select>
                        </div>
                     </div>
                     <div className="mb-3">
                        <label className="block text-xs font-bold text-slate-600 mb-1">Target Standard (MLS)</label>
                        <select value={selectedStandard} onChange={e => setSelectedStandard(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-[11px] bg-slate-50">
                          {MLS_STANDARDS[selectedSubject]?.gradeBands[selectedGradeBand]?.map(std => (
                            <option key={std.id} value={std.id}>{std.id}: {std.text.substring(0, 80)}...</option>
                          ))}
                        </select>
                     </div>
                     {(modality === 'single' || modality === 'quiz') && (
                       <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Text Style</label>
                            <select value={textStyle} onChange={e => setTextStyle(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50">
                               {TEXT_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Question Style</label>
                            <select value={questionStyle} onChange={e => setQuestionStyle(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50">
                               {QUESTION_STYLES.map(q => <option key={q} value={q}>{q}</option>)}
                            </select>
                         </div>
                       </div>
                     )}
                  </div>
                )}
             </div>

           </div>
        </div>
      </div>
    );
  }

  if (view === 'generating') {
    const m = MODALITIES.find(x => x.id === modality);
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        {genError ? (
           <div className="bg-white p-6 rounded-2xl shadow-sm border max-w-md w-full">
             <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3"/>
             <h3 className="font-bold mb-2">{genError}</h3>
             <button onClick={() => setView('form')} className="mt-4 px-4 py-2 bg-slate-100 rounded-lg text-sm font-bold">Back</button>
           </div>
        ) : (
           <div className="bg-white p-8 rounded-2xl shadow-sm border max-w-lg w-full">
             <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4"/>
             <h2 className="text-xl font-extrabold">Drafting {m?.label}...</h2>
             <p className="text-[10px] text-slate-500 mt-2 font-bold px-4 py-1 bg-slate-100 rounded-full inline-block uppercase tracking-wider">{sourceText.length > 0 ? 'NotebookLM Mode Active' : 'Generative Concept Mode Active'}</p>
             <pre ref={streamContainerRef} className="mt-6 text-[10px] text-left bg-slate-900 text-green-400 p-3 rounded-lg h-40 overflow-auto truncate font-mono">
               {streamText || 'Initiating connection...'}
             </pre>
             <button onClick={handleCancel} className="mt-6 text-xs text-slate-400 hover:text-slate-600 font-bold">Cancel</button>
           </div>
        )}
      </div>
    );
  }

  if (view === 'preview') {
    return (
      <div className="h-full flex flex-col">
         <div className="shrink-0 p-3 bg-white border-b flex gap-2 items-center flex-wrap">
            <button onClick={() => { setView('library'); setPreviewHtml(''); }} className="p-2 mr-2 border rounded-lg hover:bg-slate-50"><ArrowLeft className="w-4 h-4"/></button>
            <div className="flex-1 min-w-0 mr-4">
              <h2 className="text-sm font-bold truncate">{previewMeta?.unitTopic}</h2>
              <p className="text-[10px] text-slate-500 truncate">{previewMeta?.dayFocus}</p>
            </div>
            {!saved && <button onClick={handleSave} className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700">Save Artifact</button>}
            <button onClick={handleRepair} className="px-3 py-1.5 border rounded-md text-xs font-bold hover:bg-slate-50 text-slate-700"><Wrench className="w-3.5 h-3.5 inline mr-1"/> Check Logic</button>
            <button onClick={handleDownload} className="px-3 py-1.5 border rounded-md text-xs font-bold hover:bg-slate-50 text-slate-700">Download HTML</button>
            <button onClick={handlePrint} className="px-3 py-1.5 border rounded-md text-xs font-bold hover:bg-slate-50 text-slate-700"><Printer className="w-3.5 h-3.5 inline mr-1"/> Print</button>
         </div>
         <div className="flex-1 overflow-hidden bg-slate-200 p-2 sm:p-4">
            <div className="w-full h-full max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl border border-slate-300">
               <iframe ref={iframeRef} srcDoc={previewHtml} className="w-full h-full border-0 bg-white" />
            </div>
         </div>
      </div>
    );
  }
  return null;
};

export default WorkbookGenerator;
