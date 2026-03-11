import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  NotebookPen, Key, Eye, EyeOff, Sparkles, ArrowLeft, Printer,
  Download, Save, CheckCircle2, Loader2, Trash2, Search, Plus,
  BookOpen, AlertTriangle, X, Settings, Wrench, FileDown, CloudUpload,
  ChevronDown, ChevronRight
} from 'lucide-react';
import { useAutoSave } from '../../hooks/useAutoSave';
import { saveAs } from 'file-saver';
import { databaseService } from '../../services/databaseService';
import {
  hasApiKey, getApiKey, setApiKey,
  generateWorkbook, repairWorkbook, testConnection
} from '../../services/ClaudeService';
import { PRINT_ENGINE_CSS, STRUCTURAL_REFERENCE } from '../../data/workbookCssTemplate';
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

const ACTIVITY_OPTIONS = {
  vocabulary: [
    { id: 'auto', label: 'Auto (AI Chooses)' },
    { id: 'would-you-rather', label: 'Would You Rather Ethics Lab' },
    { id: 'advice-column', label: 'Historical Advice Column' },
    { id: 'imagine-if', label: 'Imagine If Scenario Lab' },
    { id: 'courtroom', label: 'Vocab Courtroom' },
    { id: 'time-traveler', label: "Time Traveler's Dictionary" },
    { id: 'sentence-starters', label: 'Guided Sentence Starters' },
    { id: 'visual-vocab-map', label: 'Visual Vocabulary Map' },
    { id: 'meme-creator', label: 'Vocab Meme Creator' },
    { id: 'bilingual-bridge', label: 'Bilingual Bridge' },
    { id: 'word-sort', label: 'Word Sort & Categorize' },
    { id: 'personal-dictionary', label: 'My Life Dictionary' },
    { id: 'emoji-translator', label: 'Emoji-to-Word Translator' },
  ],
  synthesis: [
    { id: 'auto', label: 'Auto (AI Chooses)' },
    { id: 'sort', label: 'Sort (6–9 words, 2 categories)' },
    { id: 'matching', label: 'Matching' },
    { id: 'grouping', label: 'Grouping' },
    { id: 'fillblank', label: 'Fill-in-the-Blank' },
    { id: 'picture', label: 'Word-Picture Association' },
    { id: 'truefalse', label: 'True/False Sorting' },
    { id: 'focus', label: 'Word of the Day Focus' },
  ],
  scenario: [
    { id: 'auto', label: 'Auto (AI Chooses)' },
    { id: 'legislative', label: 'Legislative Drafting' },
    { id: 'executive', label: 'Executive Persuasion' },
    { id: 'debate', label: 'Debate Prep Matrix' },
    { id: 'journalistic', label: 'Journalistic Inquiry' },
    { id: 'community-action', label: 'Community Action Plan' },
    { id: 'future-self-letter', label: 'Letter to My Future Self' },
    { id: 'social-media-campaign', label: 'Social Media Campaign' },
    { id: 'psa', label: 'Public Service Announcement' },
    { id: 'restorative-circle', label: 'Restorative Circle Prep' },
  ],
  creative: [
    { id: 'auto', label: 'Auto (AI Chooses)' },
    { id: 'protest-poster', label: 'Protest Poster' },
    { id: 'editorial-cartoon', label: 'Editorial Cartoon' },
    { id: 'monument', label: 'Monument/Memorial Design' },
    { id: 'comic-strip', label: 'Comic Strip' },
    { id: 'invention', label: 'Invention Blueprint' },
    { id: 'spoken-word', label: 'Spoken Word / Rap Lyrics' },
    { id: 'vision-board', label: 'Vision Board' },
    { id: 'graphic-novel', label: 'Graphic Novel Page' },
    { id: 'album-cover', label: 'Album Cover Design' },
    { id: 'photo-essay', label: 'Photo Essay Storyboard' },
  ],
  spelling: [
    { id: 'auto', label: 'Auto (AI Chooses)' },
    { id: 'word-scramble', label: 'Word Scramble' },
    { id: 'spelling-bee', label: 'Spelling Bee Challenge' },
    { id: 'word-search', label: 'Word Search Puzzle' },
    { id: 'fill-in-blanks', label: 'Fill in the Blanks' },
    { id: 'dictation-prep', label: 'Dictation Prep Sentences' },
    { id: 'word-building', label: 'Word Building (Roots/Affixes)' },
    { id: 'look-say-cover', label: 'Look-Say-Cover-Write' },
    { id: 'spelling-patterns', label: 'Spelling Pattern Sort' },
    { id: 'proofreading', label: 'Proofreading Detective' },
  ],
  grammar: [
    { id: 'auto', label: 'Auto (AI Chooses)' },
    { id: 'sentence-combining', label: 'Sentence Combining' },
    { id: 'error-hunt', label: 'Grammar Error Hunt' },
    { id: 'parts-of-speech', label: 'Parts of Speech Sort' },
    { id: 'sentence-diagramming', label: 'Sentence Diagramming' },
    { id: 'punctuation-clinic', label: 'Punctuation Clinic' },
    { id: 'mentor-sentences', label: 'Mentor Sentences' },
    { id: 'rewrite-expand', label: 'Rewrite & Expand' },
    { id: 'parallel-structure', label: 'Parallel Structure Practice' },
    { id: 'syntax-remix', label: 'Syntax Remix' },
  ],
};

const ACTIVITY_SECTION_LABELS = {
  vocabulary: { title: 'Vocabulary Activity', pages: 'Page 1' },
  synthesis: { title: 'Synthesis Framework', pages: 'Page 8' },
  scenario: { title: 'Scenario Type', pages: 'Page 9' },
  creative: { title: 'Creative Canvas', pages: 'Page 10' },
  spelling: { title: 'Spelling Activity', pages: 'Embedded' },
  grammar: { title: 'Grammar Activity', pages: 'Embedded' },
};

const AUDIENCE_DIRECTIVE = `CRITICAL AUDIENCE CONSTRAINT: All students are HIGH SCHOOL TEENAGERS (ages 14-18), regardless of the reading level selected. The reading level controls ONLY vocabulary complexity, sentence length, and syntactic sophistication. It does NOT change the target age group. Even at a 3rd-5th grade reading level, content must use age-appropriate themes, scenarios, and emotional hooks that resonate with teenagers — not elementary-age children. References, examples, and narrative protagonists should reflect teenage life, concerns, and cultural awareness. Never "talk down" to the student; simplify the language, not the maturity of the ideas.`;

const FRAMEWORK_KEYWORDS = {
  vocab: [
    'Would You Rather', 'Historical Advice Column', 'Contextual Word Detective',
    'Imagine If', 'Agree or Disagree', 'Personal Empathy Connection', 'Guided Sentence Starters',
    'Visual Vocabulary Map', 'Vocab Meme', 'Meme Creator', 'Bilingual Bridge',
    'Word Sort', 'Categorize', 'My Life Dictionary', 'Emoji-to-Word', 'Emoji Translator'
  ],
  analysis: [
    'Tri-Pillar', 'Hierarchy of Impact', 'Causal Chain', 'Odd One Out',
    'Diamond Ranking', 'Concept Sketch', 'Community Connection Web',
    'Gallery Walk', 'Response Cards', 'Think-Pair-Share'
  ],
  scenario: [
    'Legislative Drafting', 'Executive Persuasion', 'Debate Preparation', 'Journalistic Inquiry',
    'Community Action Plan', 'Letter to My Future Self', 'Future Self',
    'Social Media Campaign', 'Public Service Announcement', 'PSA',
    'Restorative Circle', 'Restorative Justice'
  ],
  creative: [
    'Protest Poster', 'Editorial Cartoon', 'Monument', 'Memorial Design',
    'Comic Strip', 'Invention Blueprint',
    'Spoken Word', 'Rap Lyrics', 'Vision Board', 'Graphic Novel',
    'Album Cover', 'Photo Essay', 'Storyboard'
  ],
  spelling: [
    'Word Scramble', 'Spelling Bee', 'Word Search', 'Fill in the Blank',
    'Dictation Prep', 'Word Building', 'Roots', 'Affixes',
    'Look-Say-Cover', 'Spelling Pattern', 'Proofreading Detective'
  ],
  grammar: [
    'Sentence Combining', 'Grammar Error Hunt', 'Parts of Speech',
    'Sentence Diagramming', 'Punctuation Clinic', 'Mentor Sentence',
    'Rewrite & Expand', 'Parallel Structure', 'Syntax Remix'
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
    if (fw.vocab) parts.push(`Page 1 used '${fw.vocab}'`);
    if (fw.analysis) parts.push(`Page 8 used '${fw.analysis}'`);
    if (fw.scenario) parts.push(`Page 9 used '${fw.scenario}'`);
    if (fw.creative) parts.push(`Page 10 used '${fw.creative}'`);
    if (fw.spelling) parts.push(`Spelling used '${fw.spelling}'`);
    if (fw.grammar) parts.push(`Grammar used '${fw.grammar}'`);
    return `- Day ${w.dayNumber}: ${parts.length ? parts.join(', ') : 'frameworks unknown'}`;
  }).join('\n');
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

  // Form
  const [unitTopic, setUnitTopic] = useState('');
  const [dayNumber, setDayNumber] = useState(1);
  const [dayFocus, setDayFocus] = useState('');
  const [readingLevel, setReadingLevel] = useState(READING_LEVELS[6].value);
  const [unitWorkbooks, setUnitWorkbooks] = useState([]);

  // Activity selections
  const [activityChoices, setActivityChoices] = useState({
    vocabulary: 'auto', synthesis: 'auto', scenario: 'auto', creative: 'auto',
    spelling: 'auto', grammar: 'auto',
  });

  // Auto-save integration
  const [isDirty, setIsDirty] = useState(false);
  const saveFn = useCallback(async () => {
    // Example: Save workbook draft (adjust as needed for your save logic)
    await databaseService.saveWorkbookDraft({
      unitTopic,
      dayNumber,
      dayFocus,
      readingLevel,
      activityChoices,
      lastModified: new Date().toISOString(),
      modifiedBy: user?.name || 'Unknown',
    });
    setIsDirty(false);
  }, [unitTopic, dayNumber, dayFocus, readingLevel, activityChoices, user]);

  useAutoSave(isDirty, saveFn, { delay: 3000, enabled: !!unitTopic });

  // Mark dirty on relevant changes
  useEffect(() => {
    if (unitTopic) setIsDirty(true);
  }, [unitTopic, dayNumber, dayFocus, readingLevel, activityChoices]);
  const [showActivities, setShowActivities] = useState(false);
  const setActivity = (section, id) => setActivityChoices(prev => ({ ...prev, [section]: id }));

  // Generation
  const [streamText, setStreamText] = useState('');
  const [genError, setGenError] = useState('');
  const abortRef = useRef(null);

  // Preview
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewMeta, setPreviewMeta] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [repairing, setRepairing] = useState(false);
  const iframeRef = useRef(null);

  // Settings overlay
  const [showSettings, setShowSettings] = useState(false);

  // OneDrive save
  const [oneDriveStatus, setOneDriveStatus] = useState(null); // null | 'generating' | 'uploading' | 'success' | 'error'
  const [oneDriveError, setOneDriveError] = useState(null);

  // Auto-clear OneDrive success/error status
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
      let userPrompt = [
        `[Unit Topic]: ${unitTopic.trim()}`,
        `[Day Number & Specific Focus]: Day ${dayNumber} — ${focusLabel}`,
        scope ? `[Pedagogical Day Type]: ${scope.label} — ${scope.directive}` : '',
        scope ? `[Standards Alignment]: ${scope.standards}` : '',
        `[Target Audience & Reading Level]: High school teenagers (ages 14-18) reading at a ${readingLevel}`,
        `\n${AUDIENCE_DIRECTIVE}`,
        prevContext ? `\n---\nPREVIOUS DAYS IN THIS UNIT (for the Absolute Variety Mandate — you MUST use different frameworks than these):\n${prevContext}` : '',
      ].filter(Boolean).join('\n');

      // Append any manually-selected activity directives
      const activityDirectives = Object.entries(activityChoices)
        .filter(([, id]) => id !== 'auto')
        .map(([section, id]) => {
          const option = ACTIVITY_OPTIONS[section].find(o => o.id === id);
          const sectionLabel = ACTIVITY_SECTION_LABELS[section];
          return `- ${sectionLabel.title} (${sectionLabel.pages}): You MUST use "${option.label}"`;
        });
      if (activityDirectives.length > 0) {
        userPrompt += '\n\n## MANDATORY ACTIVITY SELECTIONS (override the rotation for these sections):\n' + activityDirectives.join('\n');
      }

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
    setSaving(true);
    setSaveError(null);
    try {
      const savedRecord = await databaseService.saveWorkbook({
        ...previewMeta,
        htmlContent: previewHtml,
      });
      setSaved(true);
      // Update library state so the workbook appears without navigating away
      if (savedRecord) {
        setAllWorkbooks(prev => {
          const exists = prev.some(w => w.id === savedRecord.id);
          return exists
            ? prev.map(w => w.id === savedRecord.id ? savedRecord : w)
            : [...prev, savedRecord];
        });
      }
      await databaseService.logAudit(user, 'WORKBOOK_GENERATED', `${previewMeta.unitTopic} Day ${previewMeta.dayNumber}`);
    } catch (err) {
      console.error('[WorkbookGenerator] Save failed:', err);
      setSaveError(err.message || 'Failed to save workbook.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    if (!previewHtml || !previewMeta) return;
    // Auto-repair before download so the exported file is always structurally sound
    let html = previewHtml;
    try {
      const { html: repaired } = repairWorkbook(previewHtml, PRINT_ENGINE_CSS);
      html = repaired;
    } catch { /* fall back to unrepaired if repair somehow fails */ }
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const name = `${previewMeta.unitTopic.replace(/\s+/g, '_')}_Day${previewMeta.dayNumber}.html`;
    saveAs(blob, name);
  };

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  const handleSaveToOneDrive = async () => {
    if (!previewHtml || !previewMeta) return;

    if (!isMsalConfigured()) {
      setOneDriveStatus('error');
      setOneDriveError('OneDrive requires Microsoft account setup. Contact IT to configure Entra ID.');
      return;
    }

    try {
      setOneDriveStatus('generating');
      const pdfBlob = await generatePdfBlob(previewHtml);

      setOneDriveStatus('uploading');
      const fileName = `${previewMeta.unitTopic.replace(/\s+/g, '_')}_Day${previewMeta.dayNumber}.pdf`;
      await uploadToOneDrive(fileName, pdfBlob);

      setOneDriveStatus('success');
    } catch (err) {
      setOneDriveStatus('error');
      setOneDriveError(err.message || 'Failed to save to OneDrive.');
    }
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

  const handlePrintUnit = (unitName) => {
    const unitWbs = allWorkbooks
      .filter(w => w.unitTopic === unitName)
      .sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0));
    if (unitWbs.length === 0) return;
    const html = combineUnitHtml(unitWbs);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.srcdoc = html;
    iframe.onload = () => {
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
    document.body.appendChild(iframe);
  };

  const handleAddDay = async (unitName, existingReadingLevel) => {
    setUnitTopic(unitName);
    setReadingLevel(existingReadingLevel);
    const existing = await databaseService.getWorkbooksByUnit(unitName.trim());
    setUnitWorkbooks(existing);
    if (existing.length > 0) {
      const next = Math.max(...existing.map(w => w.dayNumber || 0)) + 1;
      setDayNumber(Math.min(next, 8));
    }
    setView('form');
  };

  // ─── REPAIR ─────────────────────────────────────────────────────────────────

  const handleRepair = () => {
    if (!previewHtml || repairing) return;
    setRepairing(true);

    try {
      const { html, fixes } = repairWorkbook(previewHtml, PRINT_ENGINE_CSS);
      setPreviewHtml(html);
      setSaved(false);
      if (fixes.length === 0) {
        alert('No structural issues detected — the workbook looks structurally correct.');
      }
    } catch (err) {
      alert(`Repair failed: ${err.message || 'Unknown error'}`);
    }
    setRepairing(false);
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
              <p className="text-sm text-slate-500 mb-4">Generate your first 10-page curriculum workbook.</p>
              <button onClick={() => setView('form')}
                className="px-5 py-2.5 rounded-lg bg-lime-600 text-white text-sm font-bold hover:bg-lime-700 transition flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Create Workbook
              </button>
            </div>
          ) : (
            <div className="space-y-5">
            {Object.entries(grouped).map(([unit, wbs]) => {
              const nextDay = Math.max(...wbs.map(w => w.dayNumber || 0)) + 1;
              const unitReadingLevel = wbs[0]?.readingLevel || READING_LEVELS[1].value;
              const isComplete = wbs.length >= 8;
              return (
              <div key={unit} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                {/* Unit card header */}
                <div className="px-5 pt-4 pb-3 flex items-center gap-3 flex-wrap">
                  <div className="w-8 h-8 rounded-lg bg-lime-50 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-lime-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-extrabold text-slate-800 truncate">{unit}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-semibold text-lime-600">{wbs.length} of 8 days</span>
                      <span className="text-[10px] text-slate-400">{unitReadingLevel}</span>
                    </div>
                  </div>
                  {!isComplete && (
                    <button onClick={() => handleAddDay(unit, unitReadingLevel)}
                      className="px-3 py-1.5 rounded-lg bg-lime-600 text-white text-xs font-bold hover:bg-lime-700 transition flex items-center gap-1.5 shadow-sm shadow-lime-200">
                      <Plus className="w-3.5 h-3.5" /> Add Day {nextDay}
                    </button>
                  )}
                  {isComplete && (
                    <button onClick={() => handlePrintUnit(unit)}
                      className="px-3 py-1.5 rounded-lg border border-lime-300 bg-lime-50 text-xs font-bold text-lime-700 hover:bg-lime-100 transition flex items-center gap-1.5"
                      title="Print all 8 days as a single document">
                      <FileDown className="w-3.5 h-3.5" /> Print Full Unit
                    </button>
                  )}
                </div>
                {/* Progress bar */}
                <div className="px-5 pb-3">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-lime-400 to-lime-500 rounded-full transition-all duration-500"
                      style={{ width: `${(wbs.length / 8) * 100}%` }} />
                  </div>
                </div>
                {/* Day cards grid */}
                <div className="px-5 pb-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {wbs.map(wb => (
                      <div key={wb.id}
                        className="group relative bg-slate-50 rounded-xl border border-slate-200/60 p-3 hover:shadow-md hover:border-lime-300/60 transition-all cursor-pointer"
                        onClick={() => handleOpenSaved(wb)}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-extrabold text-lime-600 bg-lime-50 px-1.5 py-0.5 rounded">
                            Day {wb.dayNumber}
                          </span>
                          <button
                            onClick={e => { e.stopPropagation(); if (window.confirm(`Delete Day ${wb.dayNumber}?`)) handleDelete(wb.id); }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-xs font-bold text-slate-700 truncate">{wb.dayFocus || 'Untitled'}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {wb.createdAt ? new Date(wb.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                        </p>
                      </div>
                    ))}
                    {/* Add next day placeholder card */}
                    {!isComplete && (
                      <div
                        onClick={() => handleAddDay(unit, unitReadingLevel)}
                        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-3 cursor-pointer hover:border-lime-400 hover:bg-lime-50/50 transition-all group">
                        <Plus className="w-5 h-5 text-slate-400 group-hover:text-lime-500 transition" />
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-lime-600 mt-1 transition">Day {nextDay}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
            </div>
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

              {/* Customize Activities */}
              <div className="border border-slate-200/60 rounded-lg overflow-hidden">
                <button type="button" onClick={() => setShowActivities(!showActivities)}
                  className="w-full px-3 py-2.5 flex items-center gap-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition select-none">
                  {showActivities
                    ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                  Customize Activities
                  {Object.values(activityChoices).some(v => v !== 'auto') && (
                    <span className="ml-auto text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {Object.values(activityChoices).filter(v => v !== 'auto').length} selected
                    </span>
                  )}
                </button>
                {showActivities && (
                  <div className="px-3 pb-3 pt-1 space-y-3 border-t border-slate-100">
                    {Object.entries(ACTIVITY_OPTIONS).map(([section, options]) => (
                      <div key={section}>
                        <div className="flex items-baseline gap-1.5 mb-1.5">
                          <span className="text-[11px] font-bold text-slate-700">
                            {ACTIVITY_SECTION_LABELS[section].title}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {ACTIVITY_SECTION_LABELS[section].pages}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {options.map(opt => {
                            const isSelected = activityChoices[section] === opt.id;
                            const isAuto = opt.id === 'auto';
                            return (
                              <button key={opt.id} type="button"
                                onClick={() => setActivity(section, opt.id)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                                  isSelected
                                    ? isAuto
                                      ? 'bg-slate-100 text-slate-600 border-slate-300'
                                      : 'bg-indigo-500 text-white border-indigo-500 shadow-sm shadow-indigo-200/50'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                                }`}>
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {Object.values(activityChoices).some(v => v !== 'auto') && (
                      <button type="button"
                        onClick={() => setActivityChoices({ vocabulary: 'auto', synthesis: 'auto', scenario: 'auto', creative: 'auto', spelling: 'auto', grammar: 'auto' })}
                        className="text-[10px] text-slate-400 hover:text-slate-600 underline transition">
                        Reset all to Auto
                      </button>
                    )}
                  </div>
                )}
              </div>

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
    const estPages = Math.min(10, Math.max(1, Math.round(chars / 3500)));
    return (
      <div className="h-full flex flex-col bg-slate-50/30">
        <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-lime-50 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-lime-500 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-extrabold text-slate-900 leading-tight">Generating Workbook...</h1>
            <p className="text-xs text-slate-500">
              {unitTopic} — Day {dayNumber} · ~{estPages} of 10 pages · {chars.toLocaleString()} chars
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
                  style={{ width: `${Math.min(100, (estPages / 10) * 100)}%` }} />
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
            <button onClick={handleSave} disabled={saving}
              className="px-3 py-1.5 rounded-lg bg-lime-600 text-white text-xs font-bold hover:bg-lime-700 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
          {saved && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          {saveError && (
            <span className="text-xs font-bold text-red-500 flex items-center gap-1 max-w-[200px] truncate" title={saveError}>
              <AlertTriangle className="w-3.5 h-3.5" /> {saveError}
            </span>
          )}

          <button onClick={handleRepair} disabled={repairing}
            className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-xs font-bold text-amber-700 hover:bg-amber-100 transition flex items-center gap-1.5 disabled:opacity-50">
            {repairing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
            {repairing ? 'Fixing...' : 'Fix'}
          </button>

          <button onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Download
          </button>

          <button onClick={handleSaveToOneDrive}
            disabled={oneDriveStatus === 'generating' || oneDriveStatus === 'uploading'}
            className="px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-xs font-bold text-blue-700 hover:bg-blue-100 transition flex items-center gap-1.5 disabled:opacity-50">
            {oneDriveStatus === 'generating' || oneDriveStatus === 'uploading'
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <CloudUpload className="w-3.5 h-3.5" />}
            {oneDriveStatus === 'generating' ? 'Creating PDF...'
              : oneDriveStatus === 'uploading' ? 'Uploading...'
              : 'OneDrive'}
          </button>
          {oneDriveStatus === 'success' && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved to OneDrive!
            </span>
          )}
          {oneDriveStatus === 'error' && oneDriveError && (
            <span className="text-xs font-bold text-red-500 max-w-[200px] truncate" title={oneDriveError}>
              {oneDriveError}
            </span>
          )}
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
