import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  NotebookPen, Key, Eye, EyeOff, Sparkles, ArrowLeft, Printer,
  Download, Save, CheckCircle2, Loader2, Trash2, Search, Plus,
  BookOpen, AlertTriangle, X, Settings, ChevronRight
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { databaseService } from '../../services/databaseService';
import {
  hasApiKey, getApiKey, setApiKey,
  generateWorkbook, testConnection, suggestDayFocus
} from '../../services/geminiService';
import { PRINT_ENGINE_CSS, STRUCTURAL_REFERENCE } from '../../data/workbookCssTemplate';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const READING_LEVELS = [
  { value: '3rd-5th Grade Reading Level', label: '3rd–5th Grade Reading Level' },
  { value: '6th-8th Grade Reading Level', label: '6th–8th Grade Reading Level' },
  { value: '9th-10th Grade Reading Level', label: '9th–10th Grade Reading Level' },
  { value: '11th-12th Grade Reading Level', label: '11th–12th Grade Reading Level' },
];

const DAY_SCOPE_SEQUENCE = [
  {
    day: 1,
    label: 'Overview & Introduction',
    directive: 'Activate schema and build background knowledge. Introduce the unit essential question and foundational vocabulary through an anticipatory set and guided exploration of the topic\'s historical context.',
    standards: 'ELA: RI.1 cite textual evidence, L.4 determine word meaning, L.6 academic vocabulary / SS: Developing questions and planning inquiries',
  },
  {
    day: 2,
    label: 'Historical Narrative I',
    directive: 'Immersive high-interest historical fiction — Part 1. Students experience a key event or era through a compelling narrative protagonist, building historical empathy and temporal-spatial understanding.',
    standards: 'ELA: RL.3 analyze character/event development, RL.5 analyze text structure, W.3 narrative writing / SS: Historical empathy, cause and effect, contextualization',
  },
  {
    day: 3,
    label: 'Historical Narrative II',
    directive: 'Continuation of the narrative arc from Day 2. Deepen the central conflict, introduce a turning point, and connect personal experience to historical consequence through guided close reading.',
    standards: 'ELA: RL.2 determine theme/central idea, RL.6 analyze point of view, W.3 narrative writing / SS: Continuity and change, multiple historical perspectives',
  },
  {
    day: 4,
    label: 'Primary Source Analysis',
    directive: 'Examine authentic primary documents — speeches, letters, photographs, political cartoons, or data. Apply sourcing, contextualization, corroboration, and close-reading protocols.',
    standards: 'ELA: RI.6 author\'s purpose/point of view, RI.8 evaluate argument/claims, RI.9 analyze seminal U.S. documents / SS: Gathering and evaluating sources, using evidence',
  },
  {
    day: 5,
    label: 'Opinion & Persuasion',
    directive: 'Read opinion/editorial texts, identify rhetorical moves (ethos, pathos, logos), then craft evidence-based argumentative writing using a clear claim-evidence-reasoning framework.',
    standards: 'ELA: W.1 write arguments, RI.8 evaluate reasoning, SL.3 evaluate speaker\'s point of view / SS: Civic literacy, evaluating perspectives, evidence-based reasoning',
  },
  {
    day: 6,
    label: 'Engaging Activity I',
    directive: 'High-interest creative activity integrating reading and writing — simulation, role-play, collaborative problem-solving, or gamified challenge that reinforces unit concepts.',
    standards: 'ELA: SL.1 collaborative discussion, W.4 produce clear/coherent writing, RI.7 integrate multiple sources / SS: Applying disciplinary concepts, communicating conclusions',
  },
  {
    day: 7,
    label: 'Engaging Activity II',
    directive: 'Second high-interest activity using a different modality from Day 6 — visual literacy, debate, Socratic seminar, multimedia creation, or design challenge.',
    standards: 'ELA: SL.4 present information clearly, RI.7 analyze accounts in different mediums, W.6 use technology / SS: Constructing explanations, reasoning with evidence',
  },
  {
    day: 8,
    label: 'Informational Writing',
    directive: 'Synthesize unit learning into a structured informational/explanatory text. Scaffold with planning organizers, model introductions, and revision protocols.',
    standards: 'ELA: W.2 write informative/explanatory texts, W.4 clear/coherent writing, W.5 develop writing through planning/revision / SS: Communicating conclusions, taking informed action',
  },
];

function getDayScope(dayNum) {
  if (dayNum >= 1 && dayNum <= 8) return DAY_SCOPE_SEQUENCE[dayNum - 1];
  return null;
}

const AUDIENCE_DIRECTIVE = `CRITICAL AUDIENCE CONSTRAINT: All students are HIGH SCHOOL TEENAGERS (ages 14-18), regardless of the reading level selected. The reading level controls ONLY vocabulary complexity, sentence length, and syntactic sophistication. It does NOT change the target age group. Even at a 3rd-5th grade reading level, content must use age-appropriate themes, scenarios, and emotional hooks that resonate with teenagers — not elementary-age children. References, examples, and narrative protagonists should reflect teenage life, concerns, and cultural awareness. Never "talk down" to the student; simplify the language, not the maturity of the ideas.`;

const FRAMEWORK_KEYWORDS = {
  vocab: [
    'Would You Rather', 'Historical Advice Column', 'Contextual Word Detective',
    'Imagine If', 'Agree or Disagree', 'Personal Empathy Connection', 'Guided Sentence Starters'
  ],
  analysis: [
    'Tri-Pillar', 'Hierarchy of Impact', 'Causal Chain', 'Odd One Out'
  ],
  scenario: [
    'Legislative Drafting', 'Executive Persuasion', 'Debate Preparation', 'Journalistic Inquiry'
  ],
  creative: [
    'Protest Poster', 'Editorial Cartoon', 'Monument', 'Memorial Design',
    'Comic Strip', 'Invention Blueprint'
  ],
};

function extractFrameworks(html) {
  const found = {};
  for (const [category, keywords] of Object.entries(FRAMEWORK_KEYWORDS)) {
    for (const kw of keywords) {
      if (html.includes(kw)) { found[category] = kw; break; }
    }
  }
  return found;
}

function buildPreviousDaysContext(savedWorkbooks) {
  if (!savedWorkbooks || savedWorkbooks.length === 0) return '';
  return savedWorkbooks.map(w => {
    const fw = w.frameworksUsed || {};
    const parts = [];
    if (fw.vocab) parts.push(`Pages 1-2 used '${fw.vocab}'`);
    if (fw.analysis) parts.push(`Page 9 used '${fw.analysis}'`);
    if (fw.scenario) parts.push(`Page 10 used '${fw.scenario}'`);
    if (fw.creative) parts.push(`Page 11 used '${fw.creative}'`);
    return `- Day ${w.dayNumber}: ${parts.length ? parts.join(', ') : 'frameworks unknown'}`;
  }).join('\n');
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

  // Form
  const [unitTopic, setUnitTopic] = useState('');
  const [dayNumber, setDayNumber] = useState(1);
  const [dayFocus, setDayFocus] = useState('');
  const [readingLevel, setReadingLevel] = useState(READING_LEVELS[1].value);
  const [unitWorkbooks, setUnitWorkbooks] = useState([]);
  const suggestTimeoutRef = useRef(null);

  // Generation
  const [streamText, setStreamText] = useState('');
  const [genError, setGenError] = useState('');
  const abortRef = useRef(null);

  // Preview
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewMeta, setPreviewMeta] = useState(null);
  const [saved, setSaved] = useState(false);
  const iframeRef = useRef(null);

  // Settings overlay
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

  useEffect(() => {
    if (view === 'library') loadLibrary();
  }, [view, loadLibrary]);

  // ─── AUTO-INCREMENT DAY ──────────────────────────────────────────────────

  useEffect(() => {
    if (unitTopic.trim()) {
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
  }, [unitTopic]);

  // ─── SMART DAY FOCUS SUGGESTION ───────────────────────────────────────────

  useEffect(() => {
    if (!unitTopic.trim() || !hasApiKey()) return;

    clearTimeout(suggestTimeoutRef.current);
    suggestTimeoutRef.current = setTimeout(async () => {
      try {
        const suggestion = await suggestDayFocus({
          unitTopic: unitTopic.trim(),
          dayNumber,
          previousDays: unitWorkbooks,
          dayDirective: getDayScope(dayNumber)?.directive || '',
        });
        if (suggestion) {
          setDayFocus(suggestion);
        }
      } catch { /* silent — suggestion is optional */ }
    }, 800);

    return () => clearTimeout(suggestTimeoutRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitTopic, dayNumber, unitWorkbooks]);

  // ─── API KEY HANDLERS ────────────────────────────────────────────────────

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setApiKey(keyInput);
    const result = await testConnection();
    setTestResult(result);
    setTesting(false);
  };

  const handleSaveKey = () => {
    setApiKey(keyInput);
    setView('library');
  };

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

      // Build the full system prompt: agent spec + exact CSS + structural HTML reference
      const fullSystemPrompt = [
        agentSpec,
        '\n\n=== MANDATORY CSS (THE MIT PRINT ENGINE V69 PLATINUM) ===',
        'You MUST embed this EXACT CSS inside a <style> tag in the <head> of the HTML. Do NOT modify, optimize, or omit any part of it.\n',
        PRINT_ENGINE_CSS,
        '\n\n=== MANDATORY HTML STRUCTURE REFERENCE ===',
        'You MUST follow this exact DOM structure for every page. Do NOT deviate from these class names or nesting patterns.\n',
        STRUCTURAL_REFERENCE,
      ].join('\n');

      const prevContext = buildPreviousDaysContext(unitWorkbooks);
      const scope = getDayScope(dayNumber);
      const focusLabel = dayFocus.trim() || scope?.label || '';
      const userPrompt = [
        `[Unit Topic]: ${unitTopic.trim()}`,
        `[Day Number & Specific Focus]: Day ${dayNumber} — ${focusLabel}`,
        scope ? `[Pedagogical Day Type]: ${scope.label} — ${scope.directive}` : '',
        scope ? `[Standards Alignment]: ${scope.standards}` : '',
        `[Target Audience & Reading Level]: High school teenagers (ages 14-18) reading at a ${readingLevel}`,
        `\n${AUDIENCE_DIRECTIVE}`,
        prevContext ? `\n---\nPREVIOUS DAYS IN THIS UNIT (for the Absolute Variety Mandate — you MUST use different frameworks than these):\n${prevContext}` : '',
      ].filter(Boolean).join('\n');

      let html = await generateWorkbook({
        systemPrompt: fullSystemPrompt,
        userPrompt,
        onChunk: (text) => setStreamText(text),
        signal: controller.signal,
      });

      // Safety net: if the AI omitted the full HTML document wrapper, add it.
      // The print engine CSS is required for proper page rendering and printing.
      if (!html.trimStart().startsWith('<!DOCTYPE') && !html.trimStart().startsWith('<html')) {
        const title = `${unitTopic.trim()} - Day ${dayNumber}`;
        html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>${title}</title>\n<style>\n${PRINT_ENGINE_CSS}\n</style>\n</head>\n<body>\n${html}\n</body>\n</html>`;
      }

      const meta = {
        unitTopic: unitTopic.trim(),
        dayNumber,
        dayFocus: focusLabel,
        readingLevel,
        frameworksUsed: extractFrameworks(html),
      };

      setPreviewHtml(html);
      setPreviewMeta(meta);
      setSaved(false);
      setView('preview');
    } catch (err) {
      if (err.name === 'AbortError') {
        setView('form');
      } else {
        setGenError(err.message || 'Generation failed.');
      }
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setView('form');
  };

  // ─── SAVE / EXPORT / DELETE ──────────────────────────────────────────────

  const handleSave = async () => {
    if (!previewMeta || !previewHtml) return;
    await databaseService.saveWorkbook({
      ...previewMeta,
      htmlContent: previewHtml,
    });
    setSaved(true);
    await databaseService.logAudit(user, 'WORKBOOK_GENERATED', `${previewMeta.unitTopic} Day ${previewMeta.dayNumber}`);
  };

  const handleDownload = () => {
    if (!previewHtml || !previewMeta) return;
    const blob = new Blob([previewHtml], { type: 'text/html;charset=utf-8' });
    const name = `${previewMeta.unitTopic.replace(/\s+/g, '_')}_Day${previewMeta.dayNumber}.html`;
    saveAs(blob, name);
  };

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  const handleDelete = async (id) => {
    await databaseService.deleteWorkbook(id);
    setAllWorkbooks(prev => prev.filter(w => w.id !== id));
  };

  const handleOpenSaved = (wb) => {
    setPreviewHtml(wb.htmlContent);
    setPreviewMeta(wb);
    setSaved(true);
    setView('preview');
  };

  // ─── FILTERED LIBRARY ────────────────────────────────────────────────────

  const grouped = useMemo(() => {
    const filtered = libSearch
      ? allWorkbooks.filter(w =>
          w.unitTopic?.toLowerCase().includes(libSearch.toLowerCase()) ||
          w.dayFocus?.toLowerCase().includes(libSearch.toLowerCase()))
      : allWorkbooks;
    const map = {};
    for (const wb of filtered) {
      const key = wb.unitTopic || 'Untitled';
      if (!map[key]) map[key] = [];
      map[key].push(wb);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0));
    }
    return map;
  }, [allWorkbooks, libSearch]);

  // ─── RENDER: API KEY SETUP ───────────────────────────────────────────────

  if (view === 'setup' || showSettings) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-lime-50 flex items-center justify-center">
              <Key className="w-6 h-6 text-lime-600" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {showSettings ? 'API Key Settings' : 'Connect to Google Gemini'}
              </h2>
              <p className="text-xs text-slate-500">Your key is stored locally in this browser only.</p>
            </div>
          </div>

          <label className="block text-xs font-bold text-slate-600 mb-1.5">Gemini API Key</label>
          <div className="relative mb-4">
            <input
              type={showKey ? 'text' : 'password'}
              value={keyInput}
              onChange={e => { setKeyInput(e.target.value); setTestResult(null); }}
              placeholder="AIza..."
              className="w-full px-3 py-2.5 pr-10 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-lime-400 focus:border-lime-400 outline-none"
            />
            <button type="button" onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {testResult && (
            <div className={`mb-4 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${testResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {testResult.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {testResult.ok ? 'Connection successful!' : testResult.error}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={handleTestConnection} disabled={!keyInput.trim() || testing}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50 flex items-center justify-center gap-1.5">
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Test Connection
            </button>
            <button onClick={() => { handleSaveKey(); setShowSettings(false); }} disabled={!keyInput.trim()}
              className="flex-1 px-4 py-2.5 rounded-lg bg-lime-600 text-white text-xs font-bold hover:bg-lime-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5">
              <Save className="w-3.5 h-3.5" />
              {showSettings ? 'Update Key' : 'Save & Continue'}
            </button>
          </div>

          {showSettings && (
            <button onClick={() => setShowSettings(false)}
              className="w-full mt-3 px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition">
              Cancel
            </button>
          )}

          {!showSettings && (
            <p className="mt-4 text-[11px] text-slate-400 text-center">
              Get your key from{' '}
              <span className="font-semibold text-lime-600">Google AI Studio</span>
              {' '}→ API Keys
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── RENDER: LIBRARY ─────────────────────────────────────────────────────

  if (view === 'library') {
    return (
      <div className="h-full flex flex-col bg-slate-50/30">
        {/* Toolbar */}
        <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-lime-50 flex items-center justify-center">
            <NotebookPen className="w-5 h-5 text-lime-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-extrabold text-slate-900 leading-tight">Unit Generator</h1>
            <p className="text-xs text-slate-500">AI-powered curriculum workbooks</p>
          </div>
          <button onClick={() => { setKeyInput(getApiKey()); setShowSettings(true); }}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            title="API Key Settings">
            <Settings className="w-4.5 h-4.5" />
          </button>
          <button onClick={() => setView('form')}
            className="px-4 py-2 rounded-lg bg-lime-600 text-white text-xs font-bold hover:bg-lime-700 transition flex items-center gap-1.5 shadow-sm shadow-lime-200">
            <Plus className="w-3.5 h-3.5" /> New Workbook
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0 px-6 py-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text" value={libSearch} onChange={e => setLibSearch(e.target.value)}
              placeholder="Search units..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-lime-400 focus:border-lime-400 outline-none"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {libLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-lime-500" />
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-lime-50 flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-lime-400" />
              </div>
              <h3 className="text-base font-bold text-slate-700 mb-1">No workbooks yet</h3>
              <p className="text-sm text-slate-500 mb-4">Generate your first 11-page curriculum workbook.</p>
              <button onClick={() => setView('form')}
                className="px-5 py-2.5 rounded-lg bg-lime-600 text-white text-sm font-bold hover:bg-lime-700 transition flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Create Workbook
              </button>
            </div>
          ) : (
            Object.entries(grouped).map(([unit, wbs]) => (
              <div key={unit} className="mb-6">
                <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-lime-500" />
                  {unit}
                  <span className="text-xs font-medium text-slate-400 normal-case">({wbs.length} {wbs.length === 1 ? 'day' : 'days'})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {wbs.map(wb => (
                    <div key={wb.id}
                      className="group relative bg-white rounded-xl border border-slate-200/60 p-4 hover:shadow-lg hover:shadow-lime-100/50 hover:border-lime-300/60 transition-all cursor-pointer"
                      onClick={() => handleOpenSaved(wb)}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-extrabold text-lime-600 bg-lime-50 px-2 py-0.5 rounded-md">
                          Day {wb.dayNumber}
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); if (window.confirm(`Delete Day ${wb.dayNumber}?`)) handleDelete(wb.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-bold text-slate-800 truncate mb-1">{wb.dayFocus || 'Untitled'}</p>
                      <p className="text-[11px] text-slate-500 truncate">{wb.readingLevel}</p>
                      <p className="text-[10px] text-slate-400 mt-2">
                        {wb.createdAt ? new Date(wb.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </p>
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-hover:text-lime-500 transition" />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ─── RENDER: GENERATOR FORM ──────────────────────────────────────────────

  if (view === 'form') {
    const canGenerate = unitTopic.trim() && dayNumber > 0;
    return (
      <div className="h-full flex flex-col bg-slate-50/30">
        <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200/60 flex items-center gap-3">
          <button onClick={() => setView('library')}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <h1 className="text-lg font-extrabold text-slate-900">New Workbook</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 space-y-5">
              {/* Unit Topic */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Unit Topic</label>
                <input type="text" value={unitTopic} onChange={e => setUnitTopic(e.target.value)}
                  placeholder="e.g., The Industrial Revolution"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-lime-400 focus:border-lime-400 outline-none" />
              </div>

              {/* Day Scope & Reading Level */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Day & Scope</label>
                  <select value={dayNumber}
                    onChange={e => setDayNumber(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-lime-400 focus:border-lime-400 outline-none bg-white">
                    {DAY_SCOPE_SEQUENCE.map(s => (
                      <option key={s.day} value={s.day}>Day {s.day}: {s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Reading Level</label>
                  <select value={readingLevel} onChange={e => setReadingLevel(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-lime-400 focus:border-lime-400 outline-none bg-white">
                    {READING_LEVELS.map(rl => <option key={rl.value} value={rl.value}>{rl.label}</option>)}
                  </select>
                </div>
              </div>
              {getDayScope(dayNumber) && (
                <div className="bg-indigo-50 border border-indigo-200/60 rounded-lg p-3 -mt-1">
                  <p className="text-[11px] font-semibold text-indigo-700 leading-snug">
                    {getDayScope(dayNumber).directive}
                  </p>
                  <p className="text-[9px] text-indigo-500 mt-1.5 leading-snug">
                    {getDayScope(dayNumber).standards}
                  </p>
                </div>
              )}

              {/* Generate Button */}
              <button onClick={handleGenerate} disabled={!canGenerate}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-lime-500 to-lime-600 text-white font-extrabold text-sm hover:from-lime-600 hover:to-lime-700 transition-all shadow-lg shadow-lime-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <Sparkles className="w-4.5 h-4.5" />
                Generate 11-Page Workbook
              </button>
            </div>

            {/* Previous Days Context */}
            {unitWorkbooks.length > 0 && (
              <div className="mt-5 bg-lime-50 border border-lime-200/60 rounded-xl p-4">
                <h3 className="text-xs font-bold text-lime-700 mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Previously Generated Days for "{unitTopic.trim()}"
                </h3>
                <div className="space-y-1">
                  {unitWorkbooks.map(w => (
                    <div key={w.id} className="text-xs text-lime-800 flex items-center gap-2">
                      <span className="font-bold text-lime-600 bg-white px-1.5 py-0.5 rounded text-[10px]">Day {w.dayNumber}</span>
                      <span className="truncate">{w.dayFocus}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-lime-600 mt-2">
                  Gemini will automatically use different pedagogical frameworks for the new day.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER: GENERATING ──────────────────────────────────────────────────

  if (view === 'generating') {
    const chars = streamText.length;
    const estPages = Math.min(11, Math.max(1, Math.round(chars / 3500)));
    return (
      <div className="h-full flex flex-col bg-slate-50/30">
        <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-lime-50 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-lime-500 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-extrabold text-slate-900 leading-tight">Generating Workbook...</h1>
            <p className="text-xs text-slate-500">
              {unitTopic} — Day {dayNumber} · ~{estPages} of 11 pages · {chars.toLocaleString()} chars
            </p>
          </div>
          <button onClick={handleCancel}
            className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>

        {genError ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md bg-white rounded-2xl shadow-sm border border-red-200/60 p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 mb-2">Generation Failed</h3>
              <p className="text-xs text-red-600 mb-4">{genError}</p>
              <button onClick={() => setView('form')}
                className="px-4 py-2 rounded-lg bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 transition">
                Back to Form
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            {/* Progress bar */}
            <div className="max-w-2xl mx-auto mb-4">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-lime-400 to-lime-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (estPages / 11) * 100)}%` }} />
              </div>
            </div>
            {/* Stream preview */}
            <pre className="max-w-2xl mx-auto bg-slate-900 text-lime-400 text-[11px] font-mono p-4 rounded-xl overflow-auto max-h-[60vh] leading-relaxed whitespace-pre-wrap">
              {streamText || 'Waiting for response...'}
            </pre>
          </div>
        )}
      </div>
    );
  }

  // ─── RENDER: PREVIEW ─────────────────────────────────────────────────────

  if (view === 'preview') {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Toolbar */}
        <div className="shrink-0 px-4 py-2.5 bg-white border-b border-slate-200/60 flex items-center gap-3">
          <button onClick={() => { setView('library'); loadLibrary(); }}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-extrabold text-slate-900 truncate">
              {previewMeta?.unitTopic} — Day {previewMeta?.dayNumber}
            </h2>
            <p className="text-[11px] text-slate-500 truncate">{previewMeta?.dayFocus}</p>
          </div>
          <span className="text-[10px] font-bold text-lime-600 bg-lime-50 px-2 py-1 rounded-md hidden sm:block">
            {previewMeta?.readingLevel}
          </span>

          {!saved && (
            <button onClick={handleSave}
              className="px-3 py-1.5 rounded-lg bg-lime-600 text-white text-xs font-bold hover:bg-lime-700 transition flex items-center gap-1.5 shadow-sm">
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          )}
          {saved && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}

          <button onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Download
          </button>
        </div>

        {/* Iframe */}
        <div className="flex-1 overflow-hidden bg-slate-100">
          <iframe
            ref={iframeRef}
            srcDoc={previewHtml}
            title="Workbook Preview"
            sandbox="allow-same-origin allow-modals"
            className="w-full h-full border-0 bg-white"
          />
        </div>
      </div>
    );
  }

  return null;
};

export default WorkbookGenerator;
