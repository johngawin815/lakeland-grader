// MIT Print Engine V69 Platinum — extracted from the reference workbooks
// (historyofmusic.html + the_labor_movement.html).
// This CSS is injected into the Gemini system prompt so the AI produces
// pixel-perfect, print-ready 11-page workbooks.

export const PRINT_ENGINE_CSS = `/* =========================================
   THE MIT PRINT ENGINE (V69 PLATINUM)
   ========================================= */
:root {
    --font-header: 'Georgia', serif;
    --font-body: 'Verdana', sans-serif;
    --line-height: 38px;
    --border-heavy: 2px solid black;
    --border-light: 1px solid #444;
}
body { margin: 0; padding: 0; background-color: #f5f5f5; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

/* PAGE CONTAINER */
.print-page {
    width: 8.5in; height: 11in; margin: 0 auto 20px auto; background: white;
    position: relative; display: flex; flex-direction: column;
    padding: 0.3in 0.5in;
    box-sizing: border-box; overflow: hidden; page-break-after: always;
}
@media print { body { background: white; } .print-page { margin: 0; box-shadow: none; page-break-after: always; height: 11in; } }

/* HEADERS */
h1 { font-family: var(--font-header); font-weight: 900; font-size: 18pt; border-bottom: 4px solid black; margin: 0 0 4px 0; line-height: 1.1; text-transform: uppercase; }
h2 { font-family: var(--font-header); font-weight: bold; font-size: 12pt; margin: 4px 0 2px 0; border-bottom: 1px solid black; padding-bottom: 1px; }
h3 { font-family: var(--font-body); font-weight: bold; font-size: 11pt; text-transform: uppercase; margin: 0 0 4px 0; color: #444; letter-spacing: 1px; }
p { font-family: var(--font-body); font-size: 11.5pt; line-height: 1.5; margin-bottom: 6px; text-align: justify; }

/* INPUTS */
.ruled-input {
    width: 100%; border: none; resize: none; outline: none;
    font-family: 'Verdana', sans-serif; font-size: 14px;
    line-height: var(--line-height);
    background-image: linear-gradient(to bottom, transparent 37px, #999 37px);
    background-size: 100% 38px; background-color: transparent;
    padding-top: 6px; box-sizing: border-box; overflow: hidden;
}

/* VOCAB GRID */
.vocab-grid { display: flex; flex-direction: column; gap: 3px; flex-grow: 1; padding-bottom: 0px; }
.vocab-item { border: var(--border-heavy); padding: 2px 6px; display: flex; flex-direction: column; background: #fff; flex-grow: 1; }
.vocab-item .ruled-input { flex-grow: 1; }
.vocab-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1px; border-bottom: 1px solid #000; padding-bottom: 1px; }
.term { font-weight: 900; font-size: 11pt; font-family: var(--font-body); }
.pos { font-style: italic; font-size: 9pt; color: #666; }
.vocab-details { font-size: 9pt; font-family: var(--font-body); background: #f9f9f9; padding: 2px 4px; margin-bottom: 2px; border-left: 3px solid #666; line-height: 1.2; }
.vocab-task { font-size: 9.5pt; font-family: var(--font-body); font-weight: bold; margin-top: 2px; color: #000; }

/* NARRATIVE & NOTES */
.narrative-container { border-left: 4px solid black; padding-left: 20px; margin-bottom: 8px; }
.scriptorium-notes {
    border: 1px dotted #666; background-color: #fdfdfd;
    padding: 6px 10px; margin-top: 8px; margin-bottom: 10px;
    font-family: var(--font-body); font-size: 10pt; display: flex; gap: 20px;
}
.note-col { flex: 1; }
.note-header { font-weight: 900; text-transform: uppercase; font-size: 0.8em; border-bottom: 2px solid #ccc; margin-bottom: 4px; }
.note-list { list-style-type: none; padding: 0; margin: 0; }
.note-list li { margin-bottom: 2px; position: relative; padding-left: 12px; }
.note-list li::before { content: "•"; position: absolute; left: 0; font-weight: bold; }

/* CHECKPOINTS (AUTO-EXPANDING) */
.checkpoint-box {
    margin-top: 10px; border: var(--border-heavy); padding: 8px; background-color: #fff;
    flex-grow: 1; display: flex; flex-direction: column; margin-bottom: 5px;
}
.question-stem { font-weight: bold; font-family: var(--font-header); font-size: 11pt; margin-bottom: 5px; }
.scaffold { font-weight: bold; font-size: 12pt; color: black; margin-bottom: 5px; font-style: normal; }
.checkpoint-box .ruled-input { flex-grow: 1; height: 100%; font-weight: 900; font-size: 13pt; color: #000; }

/* PAGE 9 & 10 SPECIFICS */
.job-deck-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-bottom: 8px; background: #eee; padding: 4px; border: var(--border-heavy); }
.job-tile { background: #fff; border: 1px solid #444; padding: 2px; text-align: center; font-size: 9pt; font-weight: bold; }
.pillar-container { display: flex; gap: 10px; height: 350px; margin-bottom: 12px; }
.pillar-column { flex: 1; border: var(--border-heavy); padding: 8px; display: flex; flex-direction: column; }
.pillar-header { text-align: center; font-weight: 900; border-bottom: 2px solid black; margin-bottom: 6px; padding-bottom: 6px; font-size: 9.5pt; text-transform: uppercase; }

.law-block { border: var(--border-heavy); margin-bottom: 10px; padding: 0; background: #fff; flex-grow: 1; display: flex; flex-direction: column; }
.law-header { background: black; color: white; padding: 4px 8px; font-weight: bold; font-family: var(--font-header); font-size: 10.5pt; }
.law-body { padding: 4px 8px; flex-grow: 1; }
.prompt-label { font-weight: bold; font-size: 9pt; margin-top: 2px; display: block; }

/* SHIELD & FOOTER */
.shield-canvas { width: 400px; height: 340px; flex-grow: 0; flex-shrink: 0; margin: 10px auto; border: 4px solid black; border-radius: 0 0 200px 200px; position: relative; background: #fff; }
.shield-instruction { display: none; }
.page-footer { margin-top: 5px; border-top: 2px solid black; padding-top: 4px; display: flex; justify-content: space-between; font-family: var(--font-body); font-size: 8pt; text-transform: uppercase; font-weight: bold; flex-shrink: 0; }
.header-row { display: flex; justify-content: space-between; font-family: var(--font-body); font-size: 9pt; border-bottom: var(--border-heavy); padding-bottom: 4px; margin-bottom: 8px; }`;

// Structural reference — a condensed skeleton showing the expected DOM for each page type.
// This is appended to the system prompt so the AI knows the exact HTML structure.
// Updated from the 8-day the_labor_movement.html reference workbook.
export const STRUCTURAL_REFERENCE = `
MANDATORY HTML STRUCTURE REFERENCE — You MUST follow this exact DOM structure for every page.
CRITICAL: All bold formatting MUST use <strong> HTML tags. NEVER use markdown ** syntax anywhere in the output.

EVERY PAGE starts with:
<div class="print-page">
  <div class="header-row"><span>STUDENT: ______________________________</span><span>[PAGE LABEL]</span></div>
  ... page content ...
  <div class="page-footer"><span>Unit: [UNIT NAME]</span><span>Day [N]</span><span>Page [X] of 11</span></div>
</div>

PAGE 1 (4 vocab terms, 76px textareas — BREVITY IS CRITICAL, definitions max 20 words, examples max 15 words, task prompts max 25 words):
<h1>DAY [N]: [TITLE]</h1>
<div style="border: 1px solid #000; padding: 8px; background: #eee; margin-bottom: 10px;">
  <strong>MISSION OBJECTIVE:</strong> [objective text]
</div>
<h2>I. THE VOCABULARY LAB (PART A)</h2>
<p style="font-size: 10pt; margin-bottom: 6px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">
  <strong>INSTRUCTIONS:</strong> [instructions]
</p>
<div class="vocab-grid">
  <div class="vocab-item">
    <div class="vocab-top"><span class="term">[N]. [WORD]</span><span class="pos">([Part of Speech])</span></div>
    <div class="vocab-details">
      <div><strong>Definition:</strong> ...</div>
      <div><strong>Forms:</strong> ...</div>
      <div><strong>Example:</strong> [sentence with <strong>word</strong> bolded]</div>
    </div>
    <div class="vocab-task">[TASK/CONNECTION/IMAGINE IF]: [custom, varied prompt]</div>
    <textarea class="ruled-input" style="height: 76px;">[MICRO-STEM or empty]</textarea>
  </div>
  ... (4 total vocab-items) ...
</div>

PAGE 2 (6 vocab terms, 38px textareas — THIS PAGE IS EXTREMELY TIGHT, definitions max 15 words, examples max 12 words, task prompts max 20 words):
CRITICAL: Page 2 must NOT include an <h1> title or a mission objective box. Go straight from header-row to <h2>.
<h2>II. VOCABULARY EXTENSION (PART B)</h2>
<p style="font-size: 10pt; margin-bottom: 4px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">
  <strong>INSTRUCTIONS:</strong> [instructions — keep SHORT, one sentence]
</p>
<div class="vocab-grid">
  <div class="vocab-item">
    <div class="vocab-top"><span class="term">[N]. [WORD]</span><span class="pos">([Part of Speech])</span></div>
    <div class="vocab-details">
      <div><strong>Definition:</strong> ...</div>
      <div><strong>Forms:</strong> ...</div>
      <div><strong>Example:</strong> [sentence with <strong>word</strong> bolded]</div>
    </div>
    <div class="vocab-task">[SHORT task prompt]</div>
    <textarea class="ruled-input" style="height: 38px;">[MICRO-STEM]</textarea>
  </div>
  ... (6 total vocab-items, numbering continues from Page 1: 5-10) ...
</div>

PAGES 3-8 (Narrative chapters):
<h3>CHAPTER [ROMAN NUMERAL]</h3><h1>[CHAPTER TITLE]</h1>
<div class="narrative-container">
  <p>[150-200 words with exactly 3 <strong>Bolded Key Terms</strong> per chapter, punctuation OUTSIDE bold tags]</p>
</div>
<div class="scriptorium-notes">
  <div class="note-col">
    <div class="note-header">ACTIVE ANALYSIS</div>
    <ul class="note-list">
      <li><strong>[Action verb]</strong> [task]</li>
      ... (exactly 4 items: Circle, Highlight, Underline, Box) ...
    </ul>
  </div>
  <div class="note-col" style="border-left: 1px dotted #ccc; padding-left: 15px;">
    <div class="note-header">TERMS</div>
    <ul class="note-list">
      <li><strong>[Word]:</strong> [Simple definition]</li>
      ... (exactly 2 items) ...
    </ul>
  </div>
</div>
<div class="checkpoint-box">
  <div class="question-stem">CHECKPOINT [N]: [TITLE]</div>
  <div class="scaffold"><strong>Prompt:</strong> [analytical question]</div>
  <textarea class="ruled-input">[2-4 word MICRO-STEM]...</textarea>
</div>

PAGE 9 (Synthesis — 18-item job deck + 3 pillar columns):
<h2>[SECTION TITLE]</h2>
<p><strong>INSTRUCTIONS:</strong> [categorization task]</p>
<div class="job-deck-container">
  <div class="job-tile">1. [Term]</div> ... (18 total job-tiles in a 3-column grid) ...
</div>
<div class="pillar-container">
  <div class="pillar-column"><div class="pillar-header">[COLUMN TITLE]</div><textarea class="ruled-input" style="flex-grow: 1;"></textarea></div>
  ... (3 pillar-columns) ...
</div>
<h3>CRITICAL THINKING</h3>
<p>[synthesis prompt requiring 2 specific words from the bank]</p>
<textarea class="ruled-input" style="flex-grow: 1; border: 2px solid black; padding: 10px; margin-bottom: 5px; font-weight: 900; font-size: 13pt; color: #000;">[MICRO-STEM]...</textarea>

PAGE 10 (Scenario — 3 law-blocks):
<h2>[SECTION TITLE]</h2>
<p><strong>SCENARIO:</strong> [scenario description]</p>
<div class="law-block">
  <div class="law-header">[RULE/BLOCK TITLE]</div>
  <div class="law-body">
    <span class="prompt-label">[LABEL]: [question]</span>
    <textarea class="ruled-input" style="height: 76px; font-weight: 900; font-size: 13pt;">[MICRO-STEM]...</textarea>
    <span class="prompt-label">[LABEL]: [question]</span>
    <textarea class="ruled-input" style="height: 114px; font-weight: 900; font-size: 13pt;">[MICRO-STEM]...</textarea>
  </div>
</div>
... (3 total law-blocks) ...

PAGE 11 (Creative + Reflection):
<h2>[SECTION TITLE]</h2>
<p><strong>TASK:</strong> [creative drawing/visual task with 2 required thematic symbols]</p>
<div class="shield-canvas"></div>
IMPORTANT: The shield-canvas div must be COMPLETELY EMPTY — do NOT put any text, instructions, or child elements inside it. It is a blank drawing area for the student.
<h3>PERSONAL CONNECTION</h3>
<p>[reflection prompt]</p>
<div style="margin-bottom: 15px;"><strong>[MICRO-STEM]...</strong><textarea class="ruled-input" style="height: 128px; font-weight: 900; font-size: 13pt;"></textarea></div>
<div><strong>[MICRO-STEM]...</strong><textarea class="ruled-input" style="height: 128px; font-weight: 900; font-size: 13pt;"></textarea></div>
`;
