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
\`;

export const DYNAMIC_LAYOUT_REFERENCE = \`
MANDATORY HTML STRUCTURE REFERENCE — DYNAMIC GENERATIVE LAYOUT
CRITICAL INSTRUCTION: You are an expert in Curriculum and Instruction with a specialization in brain-friendly worksheet development. You MUST dynamically design the layout of the worksheet or workbook to best fit the subject matter, reading level, and chosen activities.

*** DO NOT MAKE EVERY OUTPUT FORMAT THE SAME. VARY THE LAYOUT. ***

However, you MUST strictly adhere to the following print rules for EVERY SINGLE PAGE:

1. EVERY PAGE MUST BEGIN AND END WITH THE EXACT FOLLOWING BOUNDARIES:
<div class="print-page">
  <div class="header-row"><span>STUDENT: <span class="student-line"></span></span><span>[TOPIC OR PAGE LABEL]</span></div>
  
  [YOUR DYNAMICALLY DESIGNED CONTENT GOES HERE]
  
  <div class="page-footer"><span>[UNIT OR MODALITY NAME]</span><span>[TOPIC]</span><span>Page [Number] of [Total]</span></div>
</div>

2. PAGINATION & AVOIDING BLEED: A single <div class="print-page"> represents one 8.5x11 inch sheet of paper. Do NOT overload a single page. If your content exceeds what can comfortably fit on one printed page natively, you MUST close the current <div class="print-page"> and start a NEW <div class="print-page"> for the next page. Do not let content bleed off the page!

3. NO HTML TAGS IN TEXTAREAS: NEVER put HTML tags (such as <strong>, <b>, <i>) inside <textarea> tags. Textareas only render plain text. If you want a bold label before a writing area, place it OUTSIDE the textarea (e.g., <span class="prompt-label"><strong>Word:</strong></span><textarea class="ruled-input"></textarea>).

4. CREATIVE FREEDOM: Inside each <div class="print-page">, you have full creative control. 
- Use standard HTML elements (h1, h2, p, ul, table) creatively combined with the provided CSS classes (e.g., .card, .highlight-box, .apple-table, .slide-box, .flashcard-grid, .vocab-grid, .checkpoint-box, .narrative-container, .ruled-input, etc.) dynamically.
- You DO NOT need to use every class on every page. You SHOULD mix and match them depending on the task (e.g., Flash Cards should use .flashcard-grid, Reading Passages should use .narrative-container).
- Think spatially: chunk information logically so as not to overwhelm a student. Use whitespace.
\`;
