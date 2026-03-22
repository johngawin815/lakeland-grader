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
ul, ol { font-family: var(--font-body); font-size: 12pt; line-height: 1.6; margin-bottom: 12px; padding-left: 24px; color: #111; }
li { margin-bottom: 6px; }

/* INPUTS & QUIZ FORMATS */
.ruled-input {
    width: 100%; border: none; resize: none; outline: none;
    font-family: var(--font-body); font-size: 14pt; font-weight: 500;
    line-height: var(--line-height);
    background-image: linear-gradient(to bottom, transparent 36px, #ccc 36px);
    background-size: 100% var(--line-height); background-color: transparent;
    padding-top: 6px; box-sizing: border-box; overflow: hidden; color: #000;
}
.quiz-option { font-size: 11.5pt; font-family: var(--font-body); margin-bottom: 8px; display: flex; gap: 8px; align-items: center; }
.quiz-bubble { width: 14px; height: 14px; border: 2px solid #000; border-radius: 50%; display: inline-block; flex-shrink: 0; }

/* TABLE FORMATTING */
.apple-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-family: var(--font-body); page-break-inside: avoid; border: var(--border-heavy); overflow: hidden; }
.apple-table th { background: #000; color: #fff; padding: 12px; font-weight: 800; font-family: var(--font-heading); text-align: left; text-transform: uppercase; }
.apple-table td { padding: 12px; border-bottom: 1px solid #ccc; font-size: 11pt; }
.apple-table tr:last-child td { border-bottom: none; }

/* SLIDE DECK */
.slide-box { border: 3px solid #000; border-radius: var(--radius-lg); margin-bottom: 20px; padding: 24px; box-shadow: 4px 4px 0px rgba(0,0,0,0.1); break-inside: avoid; background: #fff; }
.slide-title { font-size: 18pt; font-weight: 800; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 16px; font-family: var(--font-heading); text-transform: uppercase; }
.slide-bullets { padding-left: 20px; font-size: 13pt; line-height: 1.6; }
.slide-bullets li { margin-bottom: 10px; }
.slide-speaker-notes { margin-top: 12px; padding-top: 12px; border-top: 1px dashed #ccc; font-size: 10pt; font-style: italic; color: #555; }

/* FLASH CARDS */
.flashcard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin-bottom: 12px; border: 2px dashed #999; }
.flashcard { border: 1px dashed #999; padding: 24px; text-align: center; height: 220px; display: flex; flex-direction: column; justify-content: center; align-items: center; break-inside: avoid; }
.flashcard-front { font-size: 16pt; font-weight: 800; font-family: var(--font-heading); margin-bottom: 12px; }
.flashcard-back { font-size: 11pt; font-family: var(--font-body); line-height: 1.4; }

/* MIND MAP HIERARCHY */
.mindmap-level-1 { border: var(--border-heavy); border-radius: var(--radius-sm); padding: 12px; background: #000; color: #fff; font-weight: 900; text-align: center; margin-bottom: 12px; font-size: 14pt; font-family: var(--font-heading); }
.mindmap-level-2 { border: 2px solid #000; border-radius: var(--radius-sm); padding: 8px 12px; background: #eee; font-weight: 800; margin-top: 12px; margin-bottom: 8px; font-size: 12pt; margin-left: 20px; border-left: 6px solid #000; }
.mindmap-level-3 { padding: 4px 8px; font-size: 11pt; line-height: 1.4; margin-left: 40px; position: relative; }
.mindmap-level-3::before { content: "↳"; position: absolute; left: -15px; font-weight: bold; color: #666; }

/* CARDS & CHUNKING (APPLE STYLE) */
.card { border: var(--border-heavy); border-radius: var(--radius-lg); padding: 14px; margin-bottom: 14px; background: #fff; break-inside: avoid; page-break-inside: avoid; flex-shrink: 0; }
.card-title { font-family: var(--font-heading); font-weight: 800; font-size: 12pt; text-transform: uppercase; margin-bottom: 8px; border-bottom: var(--border-light); padding-bottom: 4px; }
.highlight-box { background-color: #f8f8f8; border-left: 5px solid black; padding: 10px 14px; margin-bottom: 14px; border-radius: 0 var(--radius-sm) var(--radius-sm) 0; font-family: var(--font-body); font-size: 11pt; line-height: 1.5; }

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
.narrative-text { font-size: 12.5pt; line-height: 1.7; padding-right: 15px; text-align: left; }
.scriptorium-notes { border: var(--border-heavy); border-radius: var(--radius-lg); background-color: #fbfbfb; padding: 12px; margin-top: 10px; margin-bottom: 12px; font-family: var(--font-body); font-size: 10.5pt; display: flex; gap: 20px; break-inside: avoid; }
.note-col { flex: 1; }
.note-header { font-weight: 800; text-transform: uppercase; font-size: 0.85em; border-bottom: 2px solid #ccc; margin-bottom: 6px; padding-bottom: 2px; }
.note-list { list-style-type: none; padding: 0; margin: 0; }
.note-list li { margin-bottom: 4px; position: relative; padding-left: 14px; line-height: 1.3; }
.note-list li::before { content: "•"; position: absolute; left: 0; font-weight: bold; }

/* CHECKPOINTS (AUTO-EXPANDING) */
.checkpoint-box { margin-top: 5px; border: var(--border-heavy); border-radius: var(--radius-lg); padding: 12px; background-color: #fff; flex-grow: 1; display: flex; flex-direction: column; margin-bottom: 0; break-inside: avoid; }
.question-stem { font-weight: 800; font-family: var(--font-heading); font-size: 12pt; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
.scaffold { font-weight: 600; font-size: 12pt; color: #111; margin-bottom: 6px; font-style: normal; }
.checkpoint-box .ruled-input { flex-grow: 1; height: 100%; color: #000; }

/* SCENARIO LAW BLOCKS */
.law-block { border: var(--border-heavy); border-radius: var(--radius-lg); margin-bottom: 12px; padding: 0; background: #fff; flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; break-inside: avoid; }
.law-header { background: black; color: white; padding: 6px 12px; font-weight: 800; font-family: var(--font-heading); font-size: 11pt; text-transform: uppercase; }
.law-body { padding: 8px 12px; flex-grow: 1; display: flex; flex-direction: column; }
.prompt-label { font-weight: 700; font-size: 10.5pt; margin-top: 4px; display: block; color: #222; }

/* HEADER & FOOTER */
.header-row { display: flex; justify-content: space-between; align-items: flex-end; font-family: var(--font-heading); font-size: 10.5pt; border-bottom: 3px solid black; padding-bottom: 6px; margin-bottom: 12px; font-weight: 800; flex-shrink: 0; }
.student-line { display: inline-block; width: 300px; border-bottom: 1px solid black; margin-left: 8px; }
.page-footer { margin-top: auto; border-top: 2px solid black; padding-top: 6px; display: flex; justify-content: space-between; font-family: var(--font-heading); font-size: 9pt; text-transform: uppercase; font-weight: 800; flex-shrink: 0; color: #444; }
`;

export const STRUCTURAL_REFERENCE = `
MANDATORY HTML STRUCTURE REFERENCE — You MUST follow this exact DOM structure for EVERY PAGE.
CRITICAL: All bold formatting MUST use <strong> HTML tags. NEVER use markdown ** syntax.

EVERY PAGE STARTS & ENDS EXACTLY LIKE THIS:
<div class="print-page">
  <div class="header-row"><span>STUDENT: <span class="student-line"></span></span><span>[PAGE LABEL]</span></div>
  ... content ...
  <div class="page-footer"><span>Unit: [UNIT]</span><span>Day [N]</span><span>Page [X] of [T]</span></div>
</div>

PAGE 1: VOCABULARY
<h1>DAY [N]: [TITLE]</h1>
<div class="highlight-box"><strong>MISSION OBJECTIVE:</strong> ...</div>
<div class="vocab-grid"> ... (5 .vocab-item blocks) ... </div>

PAGES 2-7: NARRATIVE CHAPTERS
<h1>[CHAPTER TITLE]</h1>
<div class="narrative-container"><div class="narrative-text"><p>...</p></div></div>
<div class="scriptorium-notes">... (Active Analysis & Terms) ...</div>
<div class="checkpoint-box">... (Question) ...</div>
`;

export const SINGLE_ACTIVITY_REFERENCE = `
MANDATORY HTML STRUCTURE FOR SINGLE ACTIVITY. 
<div class="print-page">
  <div class="header-row"><span>STUDENT: <span class="student-line"></span></span><span>[STANDARD]</span></div>
  <h1>[TITLE]</h1>
  <div class="highlight-box"><strong>OBJECTIVE:</strong> ...</div>
  <div class="narrative-container"><div class="narrative-text"><p>...</p></div></div>
  <div class="card">
    <div class="card-title">ANALYSIS</div>
    <span class="prompt-label">1. [Q]</span><textarea class="ruled-input" style="height: 76px;"></textarea>
  </div>
  <div class="page-footer"><span>[ACTIVITY]</span><span>[STD]</span><span>Page [X]</span></div>
</div>
`;

export const SLIDE_DECK_REFERENCE = `
MANDATORY HTML STRUCTURE FOR SLIDE DECK (TEACHER PLANNING).
<div class="print-page">
  <div class="header-row"><span>TEACHER GUIDE: SLIDE DECK</span><span>[TOPIC]</span></div>
  <!-- Usually 2-3 slide-boxes per printed page -->
  <div class="slide-box">
    <div class="slide-title">Slide 1: [Title]</div>
    <ul class="slide-bullets">
      <li>[Bullet point 1]</li>
      <li>[Bullet point 2]</li>
    </ul>
    <div class="slide-speaker-notes">Speaker Notes: [Instructions for the teacher]</div>
  </div>
  <div class="page-footer"><span>Source-Aligned</span><span>[TOPIC]</span><span>Page [X]</span></div>
</div>
`;

export const FLASH_CARD_REFERENCE = `
MANDATORY HTML STRUCTURE FOR FLASH CARDS. Maximize grid per page.
<div class="print-page">
  <div class="header-row"><span>FLASH CARDS</span><span>[TOPIC]</span></div>
  <div class="flashcard-grid">
    <div class="flashcard">
      <div class="flashcard-front">[Term or Concept]</div>
      <div class="flashcard-back">[Definition, Context, or Answer]</div>
    </div>
    <!-- 8 or 10 flashcards per page to fill the grid -->
  </div>
  <div class="page-footer"><span>Cut-out Grid</span><span>[TOPIC]</span><span>Page [X]</span></div>
</div>
`;

export const MIND_MAP_REFERENCE = `
MANDATORY HTML STRUCTURE FOR MIND MAP / CONCEPT STRUCTURE.
<div class="print-page">
  <div class="header-row"><span>CONCEPT MAP</span><span>[TOPIC]</span></div>
  <h1>[Core Central Theme]</h1>
  <div class="mindmap-level-1">[Primary Category/Branch]</div>
    <div class="mindmap-level-2">[Sub-Concept A]</div>
      <div class="mindmap-level-3">[Detail / Fact / Connection]</div>
      <div class="mindmap-level-3">[Detail / Fact / Connection]</div>
    <div class="mindmap-level-2">[Sub-Concept B]</div>
      <div class="mindmap-level-3">[Detail / Fact / Connection]</div>
  <div class="mindmap-level-1">[Second Primary Category/Branch]</div>
  <!-- Repeat for all branches -->
  <div class="page-footer"><span>Hierarchy Outline</span><span>[TOPIC]</span><span>Page [X]</span></div>
</div>
`;

export const TABLE_INFOGRAPHIC_REFERENCE = `
MANDATORY HTML STRUCTURE FOR DATA TABLES / INFOGRAPHICS.
<div class="print-page">
  <div class="header-row"><span>DATA / INFOGRAPHIC</span><span>[TOPIC]</span></div>
  <h1>[Table Title]</h1>
  <p>[Summary context paragraph]</p>
  <table class="apple-table">
    <thead>
      <tr><th>[Col 1]</th><th>[Col 2]</th><th>[Col 3]</th></tr>
    </thead>
    <tbody>
      <tr><td>[Data]</td><td>[Data]</td><td>[Data]</td></tr>
      <!-- Generate sufficient rows -->
    </tbody>
  </table>
  <div class="page-footer"><span>Data Presentation</span><span>[TOPIC]</span><span>Page [X]</span></div>
</div>
`;

export const QUIZ_REFERENCE = `
MANDATORY HTML STRUCTURE FOR MULTIPLE CHOICE / ASSESSMENT QUIZ.
<div class="print-page">
  <div class="header-row"><span>STUDENT: <span class="student-line"></span></span><span>ASSESSMENT</span></div>
  <h1>[Quiz Title]</h1>
  <div class="highlight-box"><strong>INSTRUCTIONS:</strong> Select the best answer for each question based on the text.</div>
  
  <div class="card">
    <div class="prompt-label">1. [Question Text]</div>
    <div class="quiz-option"><span class="quiz-bubble"></span> A) [Option]</div>
    <div class="quiz-option"><span class="quiz-bubble"></span> B) [Option]</div>
    <div class="quiz-option"><span class="quiz-bubble"></span> C) [Option]</div>
    <div class="quiz-option"><span class="quiz-bubble"></span> D) [Option]</div>
  </div>
  <!-- Repeat cards for questions -->
  
  <!-- If writing portion is needed, use standard ruled-input -->
  <div class="checkpoint-box">
    <div class="question-stem">SHORT ANSWER</div>
    <div class="scaffold"><strong>Prompt:</strong> [DBQ/Short Answer]</div>
    <textarea class="ruled-input" style="height: 150px;"></textarea>
  </div>
  
  <div class="page-footer"><span>Assessment</span><span>[TOPIC]</span><span>Page [X]</span></div>
</div>
`;

export const REPORT_REFERENCE = `
MANDATORY HTML STRUCTURE FOR TEACHER REPORT / ANALYTICAL SUMMARY.
<div class="print-page">
  <div class="header-row"><span>ANALYTICAL REPORT</span><span>[TOPIC]</span></div>
  <h1>[Report Title]</h1>
  <h2>EXECUTIVE SUMMARY</h2>
  <div class="highlight-box">[High-level synthesis]</div>
  <h2>[Section Heading]</h2>
  <div class="narrative-container"><div class="narrative-text"><p>...</p></div></div>
  <div class="page-footer"><span>Teacher Prep</span><span>[TOPIC]</span><span>Page [X]</span></div>
</div>
`;
