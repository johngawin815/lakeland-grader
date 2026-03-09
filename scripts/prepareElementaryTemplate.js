/**
 * prepareElementaryTemplate.js
 *
 * Injects docxtemplater {placeholder} tags into the empty cells of
 * grade_card_elementary_grand.docx. Run this once to produce the
 * template that the app's export function will use.
 *
 * Usage: node scripts/prepareElementaryTemplate.js
 */
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'public', 'templates', 'grade_card_elementary_grand.docx');
const DEST = SRC; // overwrite in-place

const content = fs.readFileSync(SRC, 'binary');
const zip = new PizZip(content);
let xml = zip.file('word/document.xml').asText();

// ---------------------------------------------------------------------------
// Helper: insert a placeholder into the first empty <w:p> inside a <w:tc>
// We match on the cell's XML and add a <w:r><w:t>{tag}</w:t></w:r> inside <w:p>.
//
// Strategy:
//   1. Find the academic table (contains "Academic Subject Areas")
//   2. Find the behavior table (contains "Behaviors Affecting School Success")
//   3. Parse row-by-row, cell-by-cell, injecting tags where cells are empty
// ---------------------------------------------------------------------------

/**
 * Given a chunk of XML representing a <w:tbl>…</w:tbl>, extract all <w:tr>
 * blocks (rows). Returns an array of { start, end, xml } objects relative
 * to the input string.
 */
function extractRows(tableXml) {
  const rows = [];
  const openTag = '<w:tr ';
  const openTagShort = '<w:tr>';
  const closeTag = '</w:tr>';
  let pos = 0;

  while (pos < tableXml.length) {
    let start = tableXml.indexOf(openTag, pos);
    const startShort = tableXml.indexOf(openTagShort, pos);

    // pick whichever comes first
    if (start === -1 && startShort === -1) break;
    if (start === -1) start = startShort;
    else if (startShort !== -1 && startShort < start) start = startShort;

    const end = tableXml.indexOf(closeTag, start);
    if (end === -1) break;

    const rowXml = tableXml.substring(start, end + closeTag.length);
    rows.push({ start, end: end + closeTag.length, xml: rowXml });
    pos = end + closeTag.length;
  }

  return rows;
}

/**
 * Given a row's XML, extract all <w:tc> cells.
 */
function extractCells(rowXml) {
  const cells = [];
  const openTag = '<w:tc>';
  const openTagAttr = '<w:tc '; // some cells have attributes
  const closeTag = '</w:tc>';
  let pos = 0;

  while (pos < rowXml.length) {
    let start = rowXml.indexOf(openTag, pos);
    const startAttr = rowXml.indexOf(openTagAttr, pos);

    if (start === -1 && startAttr === -1) break;
    if (start === -1) start = startAttr;
    else if (startAttr !== -1 && startAttr < start) start = startAttr;

    // Need to handle nested tables — find the matching </w:tc>
    let depth = 0;
    let searchPos = start + 5;
    let end = -1;

    while (searchPos < rowXml.length) {
      const nextOpen = rowXml.indexOf('<w:tc>', searchPos);
      const nextOpenAttr = rowXml.indexOf('<w:tc ', searchPos);
      let nextOpenAny = -1;
      if (nextOpen !== -1 && nextOpenAttr !== -1) nextOpenAny = Math.min(nextOpen, nextOpenAttr);
      else if (nextOpen !== -1) nextOpenAny = nextOpen;
      else nextOpenAny = nextOpenAttr;

      const nextClose = rowXml.indexOf(closeTag, searchPos);
      if (nextClose === -1) break;

      if (nextOpenAny !== -1 && nextOpenAny < nextClose) {
        depth++;
        searchPos = nextOpenAny + 5;
      } else {
        if (depth === 0) {
          end = nextClose + closeTag.length;
          break;
        }
        depth--;
        searchPos = nextClose + closeTag.length;
      }
    }

    if (end === -1) break;

    cells.push({
      start,
      end,
      xml: rowXml.substring(start, end),
    });
    pos = end;
  }

  return cells;
}

/**
 * Check if a cell contains meaningful text.
 */
function getCellText(cellXml) {
  const texts = [];
  const re = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
  let m;
  while ((m = re.exec(cellXml)) !== null) {
    texts.push(m[1]);
  }
  return texts.join('').trim();
}

/**
 * Check if a cell spans multiple columns (gridSpan).
 */
function getGridSpan(cellXml) {
  const m = cellXml.match(/<w:gridSpan w:val="(\d+)"/);
  return m ? parseInt(m[1], 10) : 1;
}

/**
 * Insert a placeholder tag into an empty cell's first <w:p> element.
 * Creates a run with matching font size if found.
 */
function injectPlaceholder(cellXml, tag) {
  // Find the font size used in this table area
  const szMatch = cellXml.match(/<w:sz w:val="(\d+)"/);
  const sz = szMatch ? szMatch[1] : '20';

  // Build the run XML
  const runXml = `<w:r><w:rPr><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t>{${tag}}</w:t></w:r>`;

  // Find the first <w:p ...>...</w:p> and insert the run before </w:p>
  // Look for the last </w:p> that doesn't already contain a <w:t>
  const pCloseIdx = cellXml.lastIndexOf('</w:p>');
  if (pCloseIdx === -1) return cellXml;

  // Check if there's already text in this paragraph
  const pOpenIdx = cellXml.lastIndexOf('<w:p', pCloseIdx);
  const pContent = cellXml.substring(pOpenIdx, pCloseIdx);
  if (pContent.includes('<w:t')) return cellXml; // already has text

  return cellXml.substring(0, pCloseIdx) + runXml + cellXml.substring(pCloseIdx);
}

// ---------------------------------------------------------------------------
// STEP 1: Student Info Table (Table index 1)
// ---------------------------------------------------------------------------

// The student info table has these rows:
// Row 0: "Student Name:" | [empty span=3]   → {student_name}
// Row 1: "School Year:"  | [empty]  | "Grade:" | [empty]  → {school_year}, {grade_level}
// Row 2: "Teacher:"      | [empty span=3]   → {teacher}
// Row 3: "Admit Date:"   | [empty span=3]   → {admit_date}
// Row 4: "Discharge Date:"| [empty span=3]  → {discharge_date}

const studentInfoPlaceholders = [
  { row: 0, cell: 1, tag: 'student_name' },
  { row: 1, cell: 1, tag: 'school_year' },
  { row: 1, cell: 3, tag: 'grade_level' },
  { row: 2, cell: 1, tag: 'teacher' },
  { row: 3, cell: 1, tag: 'admit_date' },
  { row: 4, cell: 1, tag: 'discharge_date' },
];

// ---------------------------------------------------------------------------
// STEP 2: Academic Subjects Table (Table index 2, contains "Academic Subject Areas")
// ---------------------------------------------------------------------------
// Row 0: [empty header] | "Reporting Period" (span=4)
// Row 1: "Academic Subject Areas" (gray header) | 1 | 2 | 3 | 4
// Row 2: [full-width gray spacer]
// Row 3: "English/Language Arts" | [Q1] | [Q2] | [Q3] | [Q4]  → subj1
// Row 4: "Math"                 | [Q1] | [Q2] | [Q3] | [Q4]  → subj2
// Row 5: "Science"              | [Q1] | [Q2] | [Q3] | [Q4]  → subj3
// Row 6: "Social Studies"       | [Q1] | [Q2] | [Q3] | [Q4]  → subj4
// Row 7: "Physical Education"   | [Q1] | [Q2] | [Q3] | [Q4]  → subj5

const academicSubjectRows = [
  { rowOffset: 3, subjId: 1 }, // English/Language Arts
  { rowOffset: 4, subjId: 2 }, // Math
  { rowOffset: 5, subjId: 3 }, // Science
  { rowOffset: 6, subjId: 4 }, // Social Studies
  { rowOffset: 7, subjId: 5 }, // Physical Education
];

// ---------------------------------------------------------------------------
// STEP 3: Behaviors Table (Table index 5, contains "Behaviors Affecting School Success")
// ---------------------------------------------------------------------------
// Row 0: [empty] | "Reporting Period" (span=4)
// Row 1: "Behaviors..." (gray header) | 1 | 2 | 3 | 4
// Row 2: "Personal & Social Growth" (sub-header, span=5)
// Row 3-13: 11 behavior items (beh 1-11)
// Row 14: "Work Habits" (sub-header, span=5)
// Row 15-25: 11 behavior items (beh 12-22)

const behaviorRows = [];
// Personal & Social Growth: rows 3-13 → beh 1-11
for (let i = 0; i < 11; i++) {
  behaviorRows.push({ rowOffset: 3 + i, behId: i + 1 });
}
// Work Habits: rows 15-25 → beh 12-22
for (let i = 0; i < 11; i++) {
  behaviorRows.push({ rowOffset: 15 + i, behId: 12 + i });
}

// ---------------------------------------------------------------------------
// LOCATE TABLES IN THE XML
// ---------------------------------------------------------------------------

function findTableBounds(xml, marker) {
  // Find the marker text position
  const markerPos = xml.indexOf(marker);
  if (markerPos === -1) throw new Error(`Marker "${marker}" not found in XML`);

  // Walk backward to find the enclosing <w:tbl>
  let start = markerPos;
  let depth = 0;
  while (start > 0) {
    const tblClose = xml.lastIndexOf('</w:tbl>', start);
    const tblOpen = xml.lastIndexOf('<w:tbl>', start);

    if (tblOpen > tblClose) {
      if (depth === 0) break;
      depth--;
      start = tblOpen - 1;
    } else if (tblClose > tblOpen) {
      depth++;
      start = tblClose - 1;
    } else {
      break;
    }
  }

  // Find the matching </w:tbl>
  const tblStart = xml.lastIndexOf('<w:tbl>', markerPos);
  let tblEnd = -1;
  let d = 0;
  let pos = tblStart + 7;
  while (pos < xml.length) {
    const nextOpen = xml.indexOf('<w:tbl>', pos);
    const nextClose = xml.indexOf('</w:tbl>', pos);
    if (nextClose === -1) break;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      d++;
      pos = nextOpen + 7;
    } else {
      if (d === 0) {
        tblEnd = nextClose + '</w:tbl>'.length;
        break;
      }
      d--;
      pos = nextClose + '</w:tbl>'.length;
    }
  }

  return { start: tblStart, end: tblEnd };
}

// ---------------------------------------------------------------------------
// PROCESS: Inject placeholders
// ---------------------------------------------------------------------------

// We work backwards so that position offsets remain valid after string splicing.

// Helper: inject into a specific table
function processTable(fullXml, tableBounds, rowPlaceholders) {
  const tableXml = fullXml.substring(tableBounds.start, tableBounds.end);
  const rows = extractRows(tableXml);

  // Build replacements
  const replacements = []; // { origCellXml, newCellXml, absolutePos }

  for (const { rowOffset, cells: cellDefs } of rowPlaceholders) {
    if (rowOffset >= rows.length) {
      console.warn(`Row ${rowOffset} out of range (table has ${rows.length} rows)`);
      continue;
    }

    const row = rows[rowOffset];
    const cells = extractCells(row.xml);

    for (const { cellIndex, tag } of cellDefs) {
      if (cellIndex >= cells.length) {
        console.warn(`Cell ${cellIndex} out of range (row ${rowOffset} has ${cells.length} cells), tag: ${tag}`);
        continue;
      }

      const cell = cells[cellIndex];
      const cellText = getCellText(cell.xml);

      if (cellText) {
        console.warn(`Cell [${rowOffset}][${cellIndex}] already has text "${cellText}", skipping tag: ${tag}`);
        continue;
      }

      const newCellXml = injectPlaceholder(cell.xml, tag);
      if (newCellXml !== cell.xml) {
        // Calculate absolute position in the full XML
        const absStart = tableBounds.start + row.start + cell.start;
        const absEnd = tableBounds.start + row.start + cell.end;
        replacements.push({ absStart, absEnd, orig: cell.xml, replacement: newCellXml, tag });
      }
    }
  }

  return replacements;
}

// --- Student info table ---
const studentTableMarker = 'Student Name:';
const studentInfoBounds = findTableBounds(xml, studentTableMarker);
console.log('Student info table bounds:', studentInfoBounds.start, '-', studentInfoBounds.end);

const studentRowDefs = studentInfoPlaceholders.map(p => ({
  rowOffset: p.row,
  cells: [{ cellIndex: p.cell, tag: p.tag }],
}));
// Merge rows with same offset
const studentRowMap = {};
for (const def of studentRowDefs) {
  if (!studentRowMap[def.rowOffset]) studentRowMap[def.rowOffset] = [];
  studentRowMap[def.rowOffset].push(...def.cells);
}
const studentRowPlaceholders = Object.entries(studentRowMap).map(([k, v]) => ({
  rowOffset: parseInt(k),
  cells: v,
}));

const studentReplacements = processTable(xml, studentInfoBounds, studentRowPlaceholders);

// --- Academic table ---
const acadBounds = findTableBounds(xml, 'Academic Subject Areas');
console.log('Academic table bounds:', acadBounds.start, '-', acadBounds.end);

const acadRowPlaceholders = academicSubjectRows.map(({ rowOffset, subjId }) => ({
  rowOffset,
  cells: [
    { cellIndex: 1, tag: `q1_subj${subjId}` },
    { cellIndex: 2, tag: `q2_subj${subjId}` },
    { cellIndex: 3, tag: `q3_subj${subjId}` },
    { cellIndex: 4, tag: `q4_subj${subjId}` },
  ],
}));

const acadReplacements = processTable(xml, acadBounds, acadRowPlaceholders);

// --- Behavior table ---
const behBounds = findTableBounds(xml, 'Behaviors Affecting School Success');
console.log('Behavior table bounds:', behBounds.start, '-', behBounds.end);

const behRowPlaceholders = behaviorRows.map(({ rowOffset, behId }) => ({
  rowOffset,
  cells: [
    { cellIndex: 1, tag: `q1_beh${behId}` },
    { cellIndex: 2, tag: `q2_beh${behId}` },
    { cellIndex: 3, tag: `q3_beh${behId}` },
    { cellIndex: 4, tag: `q4_beh${behId}` },
  ],
}));

const behReplacements = processTable(xml, behBounds, behRowPlaceholders);

// --- Apply all replacements (in reverse order to preserve positions) ---
const allReplacements = [...studentReplacements, ...acadReplacements, ...behReplacements]
  .sort((a, b) => b.absStart - a.absStart); // reverse order

console.log(`\nTotal replacements: ${allReplacements.length}`);

for (const r of allReplacements) {
  xml = xml.substring(0, r.absStart) + r.replacement + xml.substring(r.absEnd);
  console.log(`  Injected {${r.tag}}`);
}

// --- Verify all tags are present ---
const tagRegex = /\{([^}]+)\}/g;
const foundTags = [];
let tm;
while ((tm = tagRegex.exec(xml)) !== null) {
  foundTags.push(tm[1]);
}
console.log(`\nVerification: ${foundTags.length} tags found in XML:`);
foundTags.forEach(t => console.log(`  {${t}}`));

// --- Save ---
zip.file('word/document.xml', xml);
const out = zip.generate({ type: 'nodebuffer' });
fs.writeFileSync(DEST, out);
console.log(`\nTemplate saved to: ${DEST}`);
