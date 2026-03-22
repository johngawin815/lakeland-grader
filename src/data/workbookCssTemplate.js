// MIT Print Engine V70 Platinum — Apple-Inspired Minimalist B&W Edition
// Redesigned for stress-tested cross-browser print consistency, utilizing modern sans-serif fonts, 
// rounded Apple-like borders, clear chunking, and airiness for low cognitive load.

export const PRINT_ENGINE_CSS = `/* =========================================
   THE MIT PRINT ENGINE (V70 PLATINUM B&W APPLE STYLE)
   ========================================= */
:root {
    --font-heading: -apple-system, BlinkMacSystemFont, "San Francisco", "Helvetica Neue", Helvetica, Arial, sans-serif;
    --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    --line-height: 38px;
    --border-heavy: 2px solid black;
    --border-light: 1px solid #aaa;
    --radius-lg: 12px;
    --radius-sm: 8px;
    --text-primary: #000;
}
body { margin: 0; padding: 0; background-color: #f2f2f7; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

/* PAGE CONTAINER & PRINT STRESS-TEST SAFETIES */
.print-page {
    width: 8.5in; height: 11in; margin: 0 auto 20px auto; background: white;
    position: relative; display: flex; flex-direction: column;
    padding: 0.4in 0.5in;
    box-sizing: border-box; overflow: hidden; 
    page-break-after: always; break-after: page;
}
@media print { 
    @page { margin: 0; size: letter; }
    body { background: white; } 
    .print-page { margin: 0; box-shadow: none; height: 11in; border-radius: 0; padding: 0.4in 0.5in; page-break-after: always; } 
}

/* TYPOGRAPHY OVERHAUL */
h1 { font-family: var(--font-heading); font-weight: 800; font-size: 22pt; letter-spacing: -0.5px; border-bottom: 3px solid black; margin: 0 0 8px 0; line-height: 1.2; text-transform: uppercase; color: var(--text-primary); }
h2 { font-family: var(--font-heading); font-weight: 700; font-size: 15pt; letter-spacing: -0.3px; margin: 12px 0 6px 0; color: var(--text-primary); }
h3 { font-family: var(--font-body); font-weight: 600; font-size: 11pt; text-transform: uppercase; margin: 8px 0 4px 0; color: #333; letter-spacing: 0.5px; }
p { font-family: var(--font-body); font-size: 12pt; line-height: 1.6; margin-bottom: 12px; text-align: left; color: #111; }

strong, b { font-weight: 700; color: #000; }

/* INPUTS */
.ruled-input {
    width: 100%; border: none; resize: none; outline: none;
    font-family: var(--font-body); font-size: 14pt; font-weight: 500;
    line-height: var(--line-height);
    background-image: linear-gradient(to bottom, transparent 36px, #ccc 36px);
    background-size: 100% var(--line-height); background-color: transparent;
    padding-top: 6px; box-sizing: border-box; overflow: hidden; color: #000;
}

/* CARDS & CHUNKING (APPLE STYLE) */
.card {
    border: var(--border-heavy); border-radius: var(--radius-lg);
    padding: 14px; margin-bottom: 14px; background: #fff;
    break-inside: avoid; page-break-inside: avoid; flex-shrink: 0;
}
.card-title {
    font-family: var(--font-heading); font-weight: 800; font-size: 12pt;
    text-transform: uppercase; margin-bottom: 8px; border-bottom: var(--border-light); padding-bottom: 4px;
}
.highlight-box {
    background-color: #f8f8f8; border-left: 5px solid black;
    padding: 10px 14px; margin-bottom: 14px; border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    font-family: var(--font-body); font-size: 11pt; line-height: 1.5;
}

/* VOCAB GRID */
.vocab-grid { display: flex; flex-direction: column; gap: 8px; flex-grow: 1; margin-bottom: 0; }
.vocab-item { border: var(--border-heavy); border-radius: var(--radius-lg); padding: 10px 12px; display: flex; flex-direction: column; background: #fff; flex-grow: 1; break-inside: avoid; }
.vocab-item .ruled-input { flex-grow: 1; }
.vocab-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
.term { font-weight: 800; font-size: 13pt; font-family: var(--font-heading); letter-spacing: -0.3px; }
.pos { font-style: italic; font-size: 10pt; color: #555; font-family: var(--font-body); }
.vocab-details { font-size: 10.5pt; font-family: var(--font-body); padding: 4px 0; margin-bottom: 6px; line-height: 1.4; color: #222; }
.vocab-task { font-size: 11pt; font-family: var(--font-body); font-weight: 700; margin-top: 4px; color: #000; }

/* NARRATIVE DUAL COLUMN / MARGIN NOTES */
.narrative-container { margin-bottom: 12px; flex-grow: 1; }
.narrative-text {
    font-size: 12.5pt; line-height: 1.7; padding-right: 15px; text-align: left;
}
.scriptorium-notes {
    border: var(--border-heavy); border-radius: var(--radius-lg); background-color: #fbfbfb;
    padding: 12px; margin-top: 10px; margin-bottom: 12px;
    font-family: var(--font-body); font-size: 10.5pt; display: flex; gap: 20px;
    break-inside: avoid;
}
.note-col { flex: 1; }
.note-header { font-weight: 800; text-transform: uppercase; font-size: 0.85em; border-bottom: 2px solid #ccc; margin-bottom: 6px; padding-bottom: 2px; }
.note-list { list-style-type: none; padding: 0; margin: 0; }
.note-list li { margin-bottom: 4px; position: relative; padding-left: 14px; line-height: 1.3; }
.note-list li::before { content: "•"; position: absolute; left: 0; font-weight: bold; }

/* CHECKPOINTS (AUTO-EXPANDING) */
.checkpoint-box {
    margin-top: 5px; border: var(--border-heavy); border-radius: var(--radius-lg); padding: 12px; background-color: #fff;
    flex-grow: 1; display: flex; flex-direction: column; margin-bottom: 0; break-inside: avoid;
}
.question-stem { font-weight: 800; font-family: var(--font-heading); font-size: 12pt; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
.scaffold { font-weight: 600; font-size: 12pt; color: #111; margin-bottom: 6px; font-style: normal; }
.checkpoint-box .ruled-input { flex-grow: 1; height: 100%; color: #000; }

/* GRID LAYOUTS (Pillars, Job Decks) */
.job-deck-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 12px; background: #fff; padding: 6px; border: var(--border-heavy); border-radius: var(--radius-lg); }
.job-tile { background: #f8f8f8; border: 1px solid #ccc; border-radius: var(--radius-sm); padding: 4px; text-align: center; font-size: 10pt; font-weight: 600; }
.pillar-container { display: flex; gap: 12px; height: 350px; margin-bottom: 12px; }
.pillar-column { flex: 1; border: var(--border-heavy); border-radius: var(--radius-lg); padding: 10px; display: flex; flex-direction: column; }
.pillar-header { text-align: center; font-weight: 800; border-bottom: 2px solid black; margin-bottom: 8px; padding-bottom: 6px; font-size: 10.5pt; text-transform: uppercase; }

/* LAW BLOCKS (Scenarios) */
.law-block { border: var(--border-heavy); border-radius: var(--radius-lg); margin-bottom: 12px; padding: 0; background: #fff; flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; break-inside: avoid; }
.law-header { background: black; color: white; padding: 6px 12px; font-weight: 800; font-family: var(--font-heading); font-size: 11pt; text-transform: uppercase; }
.law-body { padding: 8px 12px; flex-grow: 1; display: flex; flex-direction: column; }
.prompt-label { font-weight: 700; font-size: 10.5pt; margin-top: 4px; display: block; color: #222; }

/* SHIELD / CREATIVE CANVAS */
.shield-canvas { width: 100%; height: 340px; flex-grow: 0; flex-shrink: 0; margin: 10px 0; border: var(--border-heavy); border-radius: var(--radius-lg); position: relative; background: #fff; }

/* HEADER & FOOTER */
.header-row { display: flex; justify-content: space-between; align-items: flex-end; font-family: var(--font-heading); font-size: 10.5pt; border-bottom: 3px solid black; padding-bottom: 6px; margin-bottom: 12px; font-weight: 800; flex-shrink: 0; }
.student-line { display: inline-block; width: 300px; border-bottom: 1px solid black; margin-left: 8px; }
.page-footer { margin-top: auto; border-top: 2px solid black; padding-top: 6px; display: flex; justify-content: space-between; font-family: var(--font-heading); font-size: 9pt; text-transform: uppercase; font-weight: 800; flex-shrink: 0; color: #444; }
`;

export const STRUCTURAL_REFERENCE = \`
MANDATORY HTML STRUCTURE REFERENCE — You MUST follow this exact DOM structure for EVERY PAGE.
CRITICAL: All bold formatting MUST use <strong> HTML tags. NEVER use markdown ** syntax.

EVERY PAGE STARTS & ENDS EXACTLY LIKE THIS:
<div class="print-page">
  <div class="header-row">
    <span>STUDENT: <span class="student-line"></span></span>
    <span>[PAGE LABEL / DAY X]</span>
  </div>
  ... page content ...
  <div class="page-footer">
    <span>Unit: [UNIT NAME]</span>
    <span>Day [N]</span>
    <span>Page [X] of 10</span>
  </div>
</div>

PAGE 1: VOCABULARY (5 Terms)
<h1>DAY [N]: [TITLE]</h1>
<div class="highlight-box">
  <strong>MISSION OBJECTIVE:</strong> [Brief 1-2 sentence objective]
</div>
<div class="vocab-grid">
  <!-- Repeat 5 times -->
  <div class="vocab-item">
    <div class="vocab-top"><span class="term">[N]. [WORD]</span><span class="pos">([Part of Speech])</span></div>
    <div class="vocab-details"><strong>Definition:</strong> [10 words max] <br> <strong>Example:</strong> [Short sentence]</div>
    <div class="vocab-task">[Task Prompt]</div>
    <textarea class="ruled-input" style="height: 58px;"></textarea>
  </div>
</div>

PAGES 2-7: NARRATIVE CHAPTERS
<h1>[CHAPTER TITLE]</h1>
<div class="narrative-container">
  <div class="narrative-text">
    <p>[150-200 word story chunk with <strong>Bold Terms</strong>]</p>
  </div>
</div>
<div class="scriptorium-notes">
  <div class="note-col">
    <div class="note-header">ACTIVE ANALYSIS</div>
    <ul class="note-list">
      <li><strong>Circle</strong> [term]</li>
      ...
    </ul>
  </div>
  <div class="note-col" style="border-left: 1px dotted #ccc; padding-left: 15px;">
    <div class="note-header">TERMS</div>
    <ul class="note-list"><li><strong>[Word]:</strong> [Definition]</li>...</ul>
  </div>
</div>
<div class="checkpoint-box">
  <div class="question-stem">CHECKPOINT [N]: [TITLE]</div>
  <div class="scaffold"><strong>Prompt:</strong> [Analytical Question]</div>
  <textarea class="ruled-input"></textarea>
</div>

... (Pages 8-10 Follow Job Deck, Scenario Law-Blocks, and Creative Shield structures exactly as previously mapped, utilizing .card, .law-block, and .job-deck-container classes)
\`;

export const SINGLE_ACTIVITY_REFERENCE = \`
MANDATORY HTML STRUCTURE REFERENCE FOR SINGLE WHOLE-GROUP ACTIVITY (1-2 Pages).
CRITICAL: All bold formatting MUST use <strong> HTML tags. NEVER use markdown ** syntax.

EVERY PAGE STARTS & ENDS EXACTLY LIKE THIS:
<div class="print-page">
  <div class="header-row">
    <span>STUDENT: <span class="student-line"></span></span>
    <span>[STANDARD ID]</span>
  </div>
  ... page content ...
  <div class="page-footer">
    <span>Activity: [ACTIVITY TITLE]</span>
    <span>[SUBJECT] Standard: [STANDARD ID]</span>
    <span>Page [X] of [TOTAL]</span>
  </div>
</div>

PAGE 1: CORE TEXT & ANALYSIS
<h1>[ACTIVITY/TEXT TITLE]</h1>
<div class="highlight-box">
  <strong>OBJECTIVE:</strong> [Direct student-facing goal connected to standard]
</div>
<div class="narrative-container">
  <div class="narrative-text">
    <p>[The requested primary/secondary source text or generated narrative, adapted perfectly for the Lexile level. Length: 200-300 words]</p>
  </div>
</div>
<div class="card">
  <div class="card-title">STANDARD ALIGNMENT TASK</div>
  <p><strong>INSTRUCTIONS:</strong> [Specific pedagogical instruction on how to decode the text based on the requested activity style]</p>
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <span class="prompt-label">1. [Text-dependent question]</span>
    <textarea class="ruled-input" style="height: 76px;"></textarea>
    <span class="prompt-label">2. [Higher-order thinking question]</span>
    <textarea class="ruled-input" style="height: 114px;"></textarea>
  </div>
</div>

PAGE 2 (Optional extensions based on activity type, e.g., synthesis, creative extension, debate prep matrix):
<!-- Usually uses an expanded .checkpoint-box, .law-block, or .shield-canvas based on the user's specific requested Activity Style. -->
<h2>[EXTENSION TITLE]</h2>
<div class="checkpoint-box">
  <div class="question-stem">[ACTIVITY TYPE LABEL]</div>
  <div class="scaffold"><strong>Prompt:</strong> [Activity Prompt]</div>
  <textarea class="ruled-input" style="height: 200px;"></textarea>
</div>
\`;
