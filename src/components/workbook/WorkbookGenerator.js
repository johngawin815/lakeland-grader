import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  NotebookPen, Key, Eye, EyeOff, Sparkles, ArrowLeft, Printer,
  Download, Save, CheckCircle2, Loader2, Trash2, Search, Plus,
  BookOpen, AlertTriangle, X, Settings, Wrench, FileDown, CloudUpload,
  ChevronDown, ChevronRight, Layers, LayoutTemplate
} from 'lucide-react';
import { useAutoSave } from '../../hooks/useAutoSave';
import { saveAs } from 'file-saver';
import { databaseService } from '../../services/databaseService';
import {
  hasApiKey, getApiKey, setApiKey,
  generateWorkbook, repairWorkbook, testConnection
} from '../../services/geminiService';
import { PRINT_ENGINE_CSS, STRUCTURAL_REFERENCE, SINGLE_ACTIVITY_REFERENCE } from '../../data/workbookCssTemplate';
import { MLS_STANDARDS } from '../../data/missouriStandards';
import { generatePdfBlob } from '../../services/pdfService';
import { uploadToOneDrive } from '../../services/oneDriveService';
import { isMsalConfigured } from '../../config/msalInstance';

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

const ACTIVITY_OPTIONS = {
  vocabulary: [
    { id: 'auto', label: 'Auto (AI Chooses)' }, { id: 'would-you-rather', label: 'Would You Rather Ethics Lab' },
    { id: 'advice-column', label: 'Historical Advice Column' }, { id: 'imagine-if', label: 'Imagine If Scenario Lab' },
    { id: 'visual-vocab-map', label: 'Visual Vocabulary Map' }, { id: 'meme-creator', label: 'Vocab Meme Creator' },
  ],
  synthesis: [
    { id: 'auto', label: 'Auto (AI Chooses)' }, { id: 'sort', label: 'Sort (6–9 words, 2 categories)' },
    { id: 'matching', label: 'Matching' }, { id: 'grouping', label: 'Grouping' },
    { id: 'picture', label: 'Word-Picture Association' },
  ],
  scenario: [
    { id: 'auto', label: 'Auto (AI Chooses)' }, { id: 'debate', label: 'Debate Prep Matrix' },
    { id: 'journalistic', label: 'Journalistic Inquiry' }, { id: 'psa', label: 'Public Service Announcement' },
    { id: 'restorative-circle', label: 'Restorative Circle Prep' },
  ],
  creative: [
    { id: 'auto', label: 'Auto (AI Chooses)' }, { id: 'protest-poster', label: 'Protest Poster' },
    { id: 'comic-strip', label: 'Comic Strip' }, { id: 'spoken-word', label: 'Spoken Word / Rap Lyrics' },
    { id: 'vision-board', label: 'Vision Board' }, { id: 'photo-essay', label: 'Photo Essay Storyboard' },
  ],
};

const ACTIVITY_SECTION_LABELS = {
  vocabulary: { title: 'Vocabulary Activity', pages: 'Page 1' },
  synthesis: { title: 'Synthesis Framework', pages: 'Page 8' },
  scenario: { title: 'Scenario Type', pages: 'Page 9' },
  creative: { title: 'Creative Canvas', pages: 'Page 10' },
};

const AUDIENCE_DIRECTIVE = \`CRITICAL AUDIENCE CONSTRAINT: All students are HIGH SCHOOL TEENAGERS (ages 14-18), regardless of the reading level selected. The reading level controls ONLY vocabulary complexity, sentence length, and syntactic sophistication. It does NOT change the target age group. References, examples, and narrative protagonists should reflect teenage life, concerns, and cultural awareness.\`;

function buildPreviousDaysContext(savedWorkbooks) {
  if (!savedWorkbooks || savedWorkbooks.length === 0) return '';
  return savedWorkbooks.map(w => \`- Day \${w.dayNumber}\`).join('\n');
}

function combineUnitHtml(workbooks) {
  const bodies = workbooks.map(wb => {
    const match = wb.htmlContent.match(/<body[^>]*>([\\s\\S]*)<\\/body>/i);
    return match ? match[1] : wb.htmlContent;
  });
  const title = workbooks[0]?.unitTopic || 'Unit';
  return \`<!DOCTYPE html>\\n<html lang="en"><head><meta charset="UTF-8">\\n<title>\${title} — Full Unit</title>\\n<style>\${PRINT_ENGINE_CSS}</style>\\n</head><body>\${bodies.join('\\n')}</body></html>\`;
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
  const [generationMode, setGenerationMode] = useState('unit'); // 'unit' | 'single'
  const [unitTopic, setUnitTopic] = useState('');
  const [readingLevel, setReadingLevel] = useState(READING_LEVELS[6].value);

  // Unit Mode Specifics
  const [dayNumber, setDayNumber] = useState(1);
  const [dayFocus] = useState('');
  const [unitWorkbooks, setUnitWorkbooks] = useState([]);
  const [activityChoices, setActivityChoices] = useState({
    vocabulary: 'auto', synthesis: 'auto', scenario: 'auto', creative: 'auto'
  });
  const [showActivities, setShowActivities] = useState(false);

  // Single Mode Specifics
  const [selectedSubject, setSelectedSubject] = useState('ELA');
  const [selectedGradeBand, setSelectedGradeBand] = useState('6-8');
  const [selectedStandard, setSelectedStandard] = useState('');
  const [textStyle, setTextStyle] = useState(TEXT_STYLES[0]);
  const [questionStyle, setQuestionStyle] = useState(QUESTION_STYLES[0]);

  // Set initial standard when subject/grade band changes
  useEffect(() => {
    const stz = MLS_STANDARDS[selectedSubject]?.gradeBands[selectedGradeBand];
    if (stz && stz.length > 0) setSelectedStandard(stz[0].id);
  }, [selectedSubject, selectedGradeBand]);

  // Auto-save integration
  const [isDirty, setIsDirty] = useState(false);
  const saveFn = useCallback(async () => {
    await databaseService.saveWorkbookDraft({
      unitTopic, dayNumber, dayFocus, readingLevel, activityChoices,
      generationMode, selectedSubject, selectedGradeBand, selectedStandard, textStyle, questionStyle,
      lastModified: new Date().toISOString(),
      modifiedBy: user?.name || 'Unknown',
    });
    setIsDirty(false);
  }, [unitTopic, dayNumber, dayFocus, readingLevel, activityChoices, generationMode, selectedSubject, selectedGradeBand, selectedStandard, textStyle, questionStyle, user]);

  useAutoSave(isDirty, saveFn, { delay: 3000, enabled: !!unitTopic });

  useEffect(() => { if (unitTopic) setIsDirty(true); }, [unitTopic, dayNumber, readingLevel, generationMode, selectedStandard, textStyle, questionStyle]);

  const setActivity = (section, id) => setActivityChoices(prev => ({ ...prev, [section]: id }));

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
  const [oneDriveStatus, setOneDriveStatus] = useState(null);
  const [oneDriveError, setOneDriveError] = useState(null);

  useEffect(() => {
    if (oneDriveStatus === 'success') {
      const t = setTimeout(() => setOneDriveStatus(null), 3000);
      return () => clearTimeout(t);
    }
    if (oneDriveStatus === 'error') {
      const t = setTimeout(() => { setOneDriveStatus(null); setOneDriveError(null); }, 5000);
      return () => clearTimeout(t);
    }
  }, [oneDriveStatus]);

  // ─── LOAD LIBRARY ────────────────────────────────────────────────────────

  const loadLibrary = useCallback(async () => {
    setLibLoading(true);
    try {
      const wbs = await databaseService.getAllWorkbooks();
      setAllWorkbooks(wbs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
    } catch { setAllWorkbooks([]); }
    setLibLoading(false);
  }, []);

  useEffect(() => {
    if (view === 'library') loadLibrary();
  }, [view, loadLibrary]);

  useEffect(() => {
    if (generationMode === 'unit' && unitTopic.trim()) {
      (async () => {
        const existing = await databaseService.getWorkbooksByUnit(unitTopic.trim());
        setUnitWorkbooks(existing);
        if (existing.length > 0) {
          const next = Math.max(...existing.map(w => w.dayNumber || 0)) + 1;
          setDayNumber(Math.min(next, 8));
        }
      })();
    } else {
      setUnitWorkbooks([]);
    }
  }, [unitTopic, generationMode]);

  // ─── GENERATE ─────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    setView('generating');
    setStreamText('');
    setGenError('');
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // 1. Fetch the master persona agent instructions
      const agentResp = await fetch('/curriculum_generator_agent.md');
      const agentSpec = await agentResp.text();

      // 2. Select HTML structure reference
      const htmlRef = generationMode === 'unit' ? STRUCTURAL_REFERENCE : SINGLE_ACTIVITY_REFERENCE;

      // 3. Construct the comprehensive system prompt
      const fullSystemPrompt = [
        agentSpec,
        '\\n\\n=== MANDATORY CSS (THE MIT PRINT ENGINE V70 PLATINUM B&W APPLE STYLE) ===',
        'You MUST embed this EXACT CSS inside a <style> tag in the <head> of the HTML. Do NOT modify or omit any part of it.\\n',
        PRINT_ENGINE_CSS,
        '\\n\\n=== MANDATORY HTML STRUCTURE REFERENCE ===',
        'You MUST follow this exact DOM structure. Do NOT deviate from these class names or nesting patterns.\\n',
        htmlRef,
      ].join('\\n');

      // 4. Construct user constraints based on mode
      let userPrompt = '';
      if (generationMode === 'unit') {
        const prevContext = buildPreviousDaysContext(unitWorkbooks);
        const scope = getDayScope(dayNumber);
        const focusLabel = dayFocus.trim() || scope?.label || '';
        
        userPrompt = [
          \`[MODE]: Complex 10-page Independent Study Unit\`,
          \`[Unit Topic]: \${unitTopic.trim()}\`,
          \`[Day Number & Pedagogical Focus]: Day \${dayNumber} — \${focusLabel} (\${scope ? scope.directive : ''})\`,
          \`[Target Audience & Reading Level]: High school teenagers (14-18) reading at \${readingLevel}\`,
          \`\\n\${AUDIENCE_DIRECTIVE}\`,
          prevContext ? \`\\n--- PREVIOUS DAYS (Avoid Repetition):\\n\${prevContext}\` : '',
        ].filter(Boolean).join('\\n');

        const activityDirectives = Object.entries(activityChoices)
          .filter(([, id]) => id !== 'auto')
          .map(([section, id]) => {
            const option = ACTIVITY_OPTIONS[section].find(o => o.id === id);
            return \`- \${ACTIVITY_SECTION_LABELS[section].title}: You MUST use "\${option.label}"\`;
          });
        if (activityDirectives.length > 0) {
          userPrompt += '\\n\\n## MANDATORY ACTIVITY OVERRIDES:\\n' + activityDirectives.join('\\n');
        }
      } else {
        const stdText = MLS_STANDARDS[selectedSubject]?.gradeBands[selectedGradeBand]?.find(s => s.id === selectedStandard)?.text || '';
        userPrompt = [
          \`[MODE]: 1-to-2 page Single Whole-Group Activity\`,
          \`[Topic]: \${unitTopic.trim()}\`,
          \`[Standard Alignment]: \${selectedSubject} (\${selectedGradeBand}): \${selectedStandard} - \${stdText}\`,
          \`[Target Audience & Reading Level]: High school teenagers (14-18) reading at \${readingLevel}\`,
          \`[Text Request Category]: \${textStyle}\`,
          \`[Question & Activity Formatting]: \${questionStyle}\`,
          \`\\n\${AUDIENCE_DIRECTIVE}\`,
        ].filter(Boolean).join('\\n');
      }

      let html = await generateWorkbook({
        systemPrompt: fullSystemPrompt,
        userPrompt,
        onChunk: (text) => setStreamText(text),
        signal: controller.signal,
      });

      if (!html.trimStart().startsWith('<!DOCTYPE') && !html.trimStart().startsWith('<html')) {
        const title = generationMode === 'unit' ? \`\${unitTopic.trim()} - Day \${dayNumber}\` : \`\${unitTopic.trim()} - \${selectedStandard}\`;
        html = \`<!DOCTYPE html>\\n<html lang="en">\\n<head>\\n<meta charset="UTF-8">\\n<title>\${title}</title>\\n<style>\\n\${PRINT_ENGINE_CSS}\\n</style>\\n</head>\\n<body>\\n\${html}\\n</body>\\n</html>\`;
      }

      const meta = {
        unitTopic: unitTopic.trim(),
        dayNumber: generationMode === 'unit' ? dayNumber : null,
        dayFocus: generationMode === 'unit' ? (dayFocus.trim() || getDayScope(dayNumber)?.label || '') : \`\${selectedStandard} Activity\`,
        readingLevel,
        generationMode,
        textStyle, questionStyle,
        standard: selectedStandard
      };

      setPreviewHtml(html);
      setPreviewMeta(meta);
      setSaved(false);
      setView('preview');
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
      await databaseService.logAudit(user, 'WORKBOOK_GENERATED', \`\${previewMeta.unitTopic} - \${previewMeta.generationMode}\`);
    } catch (err) {
      setSaveError(err.message || 'Failed to save workbook.');
    } finally { setSaving(false); }
  };

  const handleRepair = () => {
    if (!previewHtml || repairing) return;
    setRepairing(true); setRepairMsg(null);
    setTimeout(() => {
      try {
        const { html, fixes } = repairWorkbook(previewHtml, PRINT_ENGINE_CSS);
        setPreviewHtml(html); setSaved(false);
        setRepairMsg({ type: 'success', text: fixes.length === 0 ? 'No structural issues.' : \`Repaired \${fixes.length} issues.\` });
      } catch (err) { setRepairMsg({ type: 'error', text: 'Repair failed: ' + err.message }); }
      finally { setRepairing(false); setTimeout(() => setRepairMsg(null), 4000); }
    }, 50);
  };

  const handleDownload = () => {
    if (!previewHtml || !previewMeta) return;
    let html = previewHtml;
    try { const { html: rep } = repairWorkbook(previewHtml, PRINT_ENGINE_CSS); html = rep; } catch { }
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    saveAs(blob, \`\${previewMeta.unitTopic.replace(/\\s+/g, '_')}_\${previewMeta.generationMode}.html\`);
  };

  const handlePrint = () => iframeRef.current?.contentWindow?.print();

  const handleSaveToOneDrive = async () => {
    if (!previewHtml || !previewMeta) return;
    if (!isMsalConfigured()) {
      setOneDriveStatus('error'); setOneDriveError('OneDrive requires Microsoft account setup.'); return;
    }
    try {
      setOneDriveStatus('generating');
      const pdfBlob = await generatePdfBlob(previewHtml);
      setOneDriveStatus('uploading');
      await uploadToOneDrive(\`\${previewMeta.unitTopic.replace(/\\s+/g, '_')}_\${previewMeta.generationMode}.pdf\`, pdfBlob);
      setOneDriveStatus('success');
    } catch (err) { setOneDriveStatus('error'); setOneDriveError(err.message || 'Failed to save to OneDrive.'); }
  };

  const handleDelete = async (id) => {
    await databaseService.deleteWorkbook(id);
    setAllWorkbooks(prev => prev.filter(w => w.id !== id));
  };

  const handleOpenSaved = (wb) => {
    setPreviewHtml(wb.htmlContent); setPreviewMeta(wb); setSaved(true); setView('preview');
  };

  const handlePrintUnit = (unitName) => {
    const unitWbs = allWorkbooks.filter(w => w.unitTopic === unitName && w.generationMode === 'unit')
      .sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0));
    if (unitWbs.length === 0) return;
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;';
    iframe.srcdoc = combineUnitHtml(unitWbs);
    iframe.onload = () => { iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 1000); };
    document.body.appendChild(iframe);
  };

  const handleAddDay = async (unitName, existingLevel) => {
    setUnitTopic(unitName); setGenerationMode('unit'); setReadingLevel(existingLevel);
    const existing = await databaseService.getWorkbooksByUnit(unitName.trim());
    setUnitWorkbooks(existing); setDayNumber(Math.min(Math.max(...existing.map(w => w.dayNumber || 0)) + 1, 8));
    setView('form');
  };

  // ─── FILTERED LIBRARY ────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const filtered = libSearch ? allWorkbooks.filter(w => w.unitTopic?.toLowerCase().includes(libSearch.toLowerCase()) || w.dayFocus?.toLowerCase().includes(libSearch.toLowerCase())) : allWorkbooks;
    const map = {};
    for (const wb of filtered) {
      const key = wb.unitTopic || 'Untitled';
      if (!map[key]) map[key] = { unit: [], single: [] };
      if (wb.generationMode === 'single') map[key].single.push(wb);
      else map[key].unit.push(wb);
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
          {testResult && <p className={\`mt-3 text-xs font-bold \${testResult.ok ? 'text-green-600' : 'text-red-500'}\`}>{testResult.ok ? 'OK' : testResult.error}</p>}
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
             <h1 className="text-lg font-extrabold text-slate-900 leading-tight">Curriculum Generator</h1>
             <p className="text-[11px] text-slate-500">Units & Single Activities via Gemini</p>
          </div>
          <button onClick={() => { setKeyInput(getApiKey()); setShowSettings(true); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><Settings className="w-4 h-4"/></button>
          <button onClick={() => setView('form')} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center gap-1.5 shadow-sm"><Plus className="w-3.5 h-3.5" /> Create New</button>
        </div>
        <div className="flex-1 overflow-auto p-6 space-y-5">
           {libLoading ? <Loader2 className="animate-spin text-blue-500 mx-auto" /> : Object.keys(grouped).length === 0 ? <p className="text-center text-slate-500 text-sm mt-10">No curricula generated yet.</p> : Object.entries(grouped).map(([u, blocks]) => (
             <div key={u} className="bg-white border rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-3">{u}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   {blocks.unit.map(w => (
                     <div key={w.id} onClick={() => handleOpenSaved(w)} className="border rounded-lg p-2 cursor-pointer hover:border-blue-400 bg-slate-50 group">
                       <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1 py-0.5 rounded">Day {w.dayNumber} (Unit)</span>
                       <p className="text-xs font-medium text-slate-700 mt-1 truncate">{w.dayFocus}</p>
                     </div>
                   ))}
                   {document && blocks.unit.length > 0 && blocks.unit.length < 8 && (
                     <div onClick={() => handleAddDay(u, blocks.unit[0].readingLevel)} className="border border-dashed rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 group"><Plus className="w-4 h-4 text-slate-400"/></div>
                   )}
                   {blocks.single.map(w => (
                     <div key={w.id} onClick={() => handleOpenSaved(w)} className="border border-purple-200 rounded-lg p-2 cursor-pointer hover:border-purple-400 bg-purple-50 group">
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-1 py-0.5 rounded">Single Activity</span>
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
    const canGenerate = unitTopic.trim() && (generationMode === 'unit' ? dayNumber > 0 : selectedStandard);
    return (
      <div className="h-full flex flex-col bg-slate-50/50">
        <div className="shrink-0 px-6 py-4 bg-white border-b flex items-center gap-3">
           <button onClick={() => setView('library')} className="p-2 -ml-2 text-slate-400 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-4 h-4"/></button>
           <h2 className="text-lg font-extrabold text-slate-800">Configure Content</h2>
        </div>
        <div className="flex-1 overflow-auto p-4 md:p-6">
           <div className="max-w-xl mx-auto space-y-5 bg-white p-5 rounded-2xl border shadow-sm">
             
             {/* Mode Selector */}
             <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                <button onClick={() => setGenerationMode('unit')} className={\`flex-1 py-2 rounded-md text-xs font-bold flex justify-center items-center gap-2 \${generationMode === 'unit' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500'}\`}><Layers className="w-4 h-4"/> Independent Unit (10-pg)</button>
                <button onClick={() => setGenerationMode('single')} className={\`flex-1 py-2 rounded-md text-xs font-bold flex justify-center items-center gap-2 \${generationMode === 'single' ? 'bg-white shadow-sm text-purple-700' : 'text-slate-500'}\`}><LayoutTemplate className="w-4 h-4"/> Single Activity (1-2 pg)</button>
             </div>

             <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Topic / Title</label>
                <input type="text" value={unitTopic} onChange={e => setUnitTopic(e.target.value)} placeholder="e.g. The Gilded Age..." className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white" />
             </div>

             <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Reading / Lexile Target</label>
                <select value={readingLevel} onChange={e => setReadingLevel(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white">
                  {READING_LEVELS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
             </div>

             {/* Mode: Unit Inputs */}
             {generationMode === 'unit' && (
                <div>
                   <label className="block text-xs font-bold text-slate-600 mb-1">Unit Day (Sequence)</label>
                   <select value={dayNumber} onChange={e => setDayNumber(parseInt(e.target.value, 10))} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white">
                      {DAY_SCOPE_SEQUENCE.map(s => <option key={s.day} value={s.day}>Day {s.day}: {s.label}</option>)}
                   </select>
                   <p className="text-[10px] text-blue-600 mt-2 p-2 bg-blue-50 rounded-lg">{getDayScope(dayNumber)?.directive}</p>
                </div>
             )}

             {/* Mode: Single Activity Inputs */}
             {generationMode === 'single' && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="block text-xs font-bold text-slate-600 mb-1">Standard Subject</label>
                       <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white">
                          <option value="ELA">English Language Arts</option>
                          <option value="SocialStudies">Social Studies</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-600 mb-1">Grade Band</label>
                       <select value={selectedGradeBand} onChange={e => setSelectedGradeBand(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white">
                          <option value="6-8">Grades 6-8</option>
                          <option value="9-12">Grades 9-12</option>
                       </select>
                     </div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-600 mb-1">Target Standard (MLS)</label>
                     <select value={selectedStandard} onChange={e => setSelectedStandard(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white max-w-full">
                       {MLS_STANDARDS[selectedSubject]?.gradeBands[selectedGradeBand]?.map(std => (
                         <option key={std.id} value={std.id}>{std.id}: {std.text.substring(0, 50)}...</option>
                       ))}
                     </select>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-600 mb-1">Style of Text Source</label>
                     <select value={textStyle} onChange={e => setTextStyle(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white">
                        {TEXT_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-600 mb-1">Question & Pedagogy Format</label>
                     <select value={questionStyle} onChange={e => setQuestionStyle(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white">
                        {QUESTION_STYLES.map(q => <option key={q} value={q}>{q}</option>)}
                     </select>
                  </div>
                </div>
             )}

             <button onClick={handleGenerate} disabled={!canGenerate} className="w-full py-3 bg-slate-900 text-white font-extrabold text-sm rounded-xl hover:bg-black disabled:opacity-50 flex justify-center items-center gap-2">
                <Sparkles className="w-4 h-4"/> Generate Now
             </button>
           </div>
        </div>
      </div>
    );
  }

  if (view === 'generating') {
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
             <h2 className="text-xl font-extrabold">Drafting {generationMode === 'unit' ? 'Unit' : 'Activity'}...</h2>
             <p className="text-sm text-slate-500 mt-2">Connecting to Gemini for precise Lexile leveling and pedagogical structuring.</p>
             <pre ref={streamContainerRef} className="mt-6 text-[10px] text-left bg-slate-900 text-green-400 p-3 rounded-lg h-40 overflow-auto truncate">
               {streamText || 'Initiating...'}
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
            <button onClick={() => setView('library')} className="p-2 mr-2 border rounded-lg hover:bg-slate-50"><ArrowLeft className="w-4 h-4"/></button>
            <div className="flex-1 min-w-0 mr-4">
              <h2 className="text-sm font-bold truncate">{previewMeta?.unitTopic}</h2>
              <p className="text-[10px] text-slate-500 truncate">{previewMeta?.dayFocus}</p>
            </div>
            {!saved && <button onClick={handleSave} className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700">Save</button>}
            <button onClick={handleRepair} className="px-3 py-1.5 border rounded-md text-xs font-bold hover:bg-slate-50 text-slate-700"><Wrench className="w-3.5 h-3.5 inline mr-1"/> Fix HTML</button>
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
