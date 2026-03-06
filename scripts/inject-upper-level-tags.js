/**
 * Inject Template Tags into Upper Level Grade Card.docx
 *
 * Inserts {variable} placeholders into the blank Upper Level Grade Card template
 * so docxtemplater can render dynamic data for grades 9-12.
 *
 * Structure confirmed by inspect-upper-level.js:
 *   Table 0: Header (5 rows x 2 cols) - Student Name, School Year, Grade, Admit Date, Discharge Date
 *   Tables 1-5: Quarterly tables (First/Second/Third/Fourth Quarter, Summer Credit Recovery)
 *     Row 0: Quarter title (merged cell)
 *     Row 1: Column headers (Credits | Course | Grade | Instructor)
 *     Rows 2-7: 6 data rows (4 cells each) - these get template tags
 *     Row 8: Spacer row (1 merged cell, black fill)
 *     Row 9: Footer row (4 cells, black fill)
 *
 * Tags injected:
 *   Header: {student_name}, {school_year}, {grade}, {admit_date}, {discharge_date}
 *   Quarterly: {qN_rM_credits}, {qN_rM_course}, {qN_rM_grade}, {qN_rM_instructor}
 *     where N=1-5 (quarter), M=1-6 (row)
 *
 * Total: 5 header + 120 table = 125 tags
 */
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const TEMPLATE_PATH = path.join(__dirname, '..', 'public', 'templates', 'Upper Level Grade Card.docx');
const BACKUP_PATH = TEMPLATE_PATH + '.bak';

// Back up original
if (!fs.existsSync(BACKUP_PATH)) {
  fs.copyFileSync(TEMPLATE_PATH, BACKUP_PATH);
  console.log('Backup created:', BACKUP_PATH);
}

const content = fs.readFileSync(TEMPLATE_PATH);
const zip = new PizZip(content);
let xml = zip.file('word/document.xml').asText();

/**
 * Helper: Insert a template tag into an empty cell's paragraph.
 * Replaces `<w:p ... />` (self-closing) or `<w:p ...></w:p>` (empty) with
 * a paragraph containing a run with the tag text.
 */
function injectTagIntoCell(cellXml, tag) {
  // Case 1: Self-closing paragraph <w:p ... />
  const selfClosing = cellXml.match(/<w:p\s[^>]*\/>/);
  if (selfClosing) {
    // Extract attributes from the self-closing tag
    const attrs = selfClosing[0].slice(4, -2); // strip <w:p and />
    const replacement = `<w:p${attrs}><w:r><w:t>${tag}</w:t></w:r></w:p>`;
    return cellXml.replace(selfClosing[0], replacement);
  }

  // Case 2: Empty paragraph <w:p ...></w:p> (no text runs inside)
  const emptyPara = cellXml.match(/<w:p[\s>][^]*?<\/w:p>/);
  if (emptyPara) {
    const paraXml = emptyPara[0];
    // Check if it already has text content
    if (/<w:t[^>]*>/.test(paraXml)) {
      // Has text already, replace the text content
      return cellXml.replace(paraXml, paraXml.replace(
        /(<w:t[^>]*>)[^<]*(<\/w:t>)/,
        `$1${tag}$2`
      ));
    }
    // Insert a run before </w:p>
    return cellXml.replace(paraXml, paraXml.replace(
      /<\/w:p>/,
      `<w:r><w:t>${tag}</w:t></w:r></w:p>`
    ));
  }

  console.warn(`  WARNING: Could not inject "${tag}" - no paragraph found in cell`);
  return cellXml;
}

let totalInjected = 0;

// ============================
// HEADER TABLE (Table 0)
// ============================
const headerTags = ['student_name', 'school_year', 'grade', 'admit_date', 'discharge_date'];

// Find Table 0
const tableRegex = /<w:tbl[\s>][\s\S]*?<\/w:tbl>/g;
const tables = [];
let tblMatch;
while ((tblMatch = tableRegex.exec(xml)) !== null) {
  tables.push({ start: tblMatch.index, end: tblMatch.index + tblMatch[0].length, xml: tblMatch[0] });
}

console.log(`Found ${tables.length} tables`);

if (tables.length < 6) {
  console.error('ERROR: Expected 6 tables, found', tables.length);
  process.exit(1);
}

// Process Table 0 (header) - each row has 2 cells: [label, value]
// Inject tags into cell[1] (the value cell) of rows 0-4
let headerTable = tables[0].xml;
const headerRowRegex = /<w:tr[\s>][\s\S]*?<\/w:tr>/g;
let headerRows = [];
let hrMatch;
while ((hrMatch = headerRowRegex.exec(headerTable)) !== null) {
  headerRows.push({ start: hrMatch.index, xml: hrMatch[0] });
}

console.log(`\nHeader table: ${headerRows.length} rows`);

for (let rowIdx = 0; rowIdx < headerTags.length && rowIdx < headerRows.length; rowIdx++) {
  const rowXml = headerRows[rowIdx].xml;
  const tag = `{${headerTags[rowIdx]}}`;

  // Find the second cell (value cell)
  const cellRegex = /<w:tc[\s>][\s\S]*?<\/w:tc>/g;
  const cells = [];
  let cMatch;
  while ((cMatch = cellRegex.exec(rowXml)) !== null) {
    cells.push({ start: cMatch.index, xml: cMatch[0] });
  }

  if (cells.length >= 2) {
    const oldCell = cells[1].xml;
    const newCell = injectTagIntoCell(oldCell, tag);
    if (oldCell !== newCell) {
      headerTable = headerTable.replace(oldCell, newCell);
      console.log(`  Injected ${tag} into header row ${rowIdx}, cell 1`);
      totalInjected++;
    } else {
      console.warn(`  WARN: No change for ${tag} in header row ${rowIdx}`);
    }
  } else {
    console.warn(`  WARN: Row ${rowIdx} has ${cells.length} cells, expected 2`);
  }
}

// Replace table 0 in the full XML
xml = xml.substring(0, tables[0].start) + headerTable + xml.substring(tables[0].end);

// Recalculate table positions after header modification
const lengthDiff = headerTable.length - tables[0].xml.length;

// ============================
// QUARTERLY TABLES (Tables 1-5)
// ============================
const quarterPrefixes = ['q1', 'q2', 'q3', 'q4', 'q5'];
const colNames = ['credits', 'course', 'grade', 'instructor'];

// Re-find tables after header modification
const reTableRegex = /<w:tbl[\s>][\s\S]*?<\/w:tbl>/g;
const updatedTables = [];
let rtMatch;
while ((rtMatch = reTableRegex.exec(xml)) !== null) {
  updatedTables.push({ start: rtMatch.index, end: rtMatch.index + rtMatch[0].length, xml: rtMatch[0] });
}

for (let qi = 0; qi < 5; qi++) {
  const tableIdx = qi + 1; // Tables 1-5
  const qPrefix = quarterPrefixes[qi];

  if (tableIdx >= updatedTables.length) {
    console.warn(`  WARN: Table ${tableIdx} not found`);
    continue;
  }

  let tableXml = updatedTables[tableIdx].xml;
  const originalTableXml = tableXml;

  // Find all rows in this table
  const rowRegex2 = /<w:tr[\s>][\s\S]*?<\/w:tr>/g;
  const rows = [];
  let rMatch;
  while ((rMatch = rowRegex2.exec(tableXml)) !== null) {
    rows.push({ start: rMatch.index, xml: rMatch[0] });
  }

  console.log(`\nQuarter table ${tableIdx} (${qPrefix}): ${rows.length} rows`);

  // Data rows are rows 2-7 (0=title, 1=headers, 2-7=data, 8=spacer, 9=footer)
  for (let dataRowIdx = 0; dataRowIdx < 6; dataRowIdx++) {
    const rowIndex = dataRowIdx + 2; // Actual row in the table
    const rowNum = dataRowIdx + 1;   // Row number in tag (1-6)

    if (rowIndex >= rows.length) {
      console.warn(`  WARN: Row ${rowIndex} not found in table ${tableIdx}`);
      continue;
    }

    let rowXml = rows[rowIndex].xml;

    // Find cells in this row
    const cellRegex2 = /<w:tc[\s>][\s\S]*?<\/w:tc>/g;
    const cells = [];
    let c2Match;
    while ((c2Match = cellRegex2.exec(rowXml)) !== null) {
      cells.push({ start: c2Match.index, xml: c2Match[0] });
    }

    if (cells.length < 4) {
      console.warn(`  WARN: Row ${rowIndex} has ${cells.length} cells, expected 4`);
      continue;
    }

    // Inject tags into each of the 4 cells
    for (let colIdx = 0; colIdx < 4; colIdx++) {
      const tag = `{${qPrefix}_r${rowNum}_${colNames[colIdx]}}`;
      const oldCell = cells[colIdx].xml;
      const newCell = injectTagIntoCell(oldCell, tag);

      if (oldCell !== newCell) {
        // Replace in the row, then replace in the table
        const newRowXml = rowXml.replace(oldCell, newCell);
        tableXml = tableXml.replace(rowXml, newRowXml);
        rowXml = newRowXml; // Update for next cell replacement in same row
        totalInjected++;
      } else {
        console.warn(`  WARN: No change for ${tag}`);
      }
    }

    console.log(`  Injected row ${rowNum}: {${qPrefix}_r${rowNum}_credits}, {${qPrefix}_r${rowNum}_course}, {${qPrefix}_r${rowNum}_grade}, {${qPrefix}_r${rowNum}_instructor}`);
  }

  // Replace this table in the full XML
  xml = xml.replace(originalTableXml, tableXml);
}

// Save the modified document
zip.file('word/document.xml', xml);
const output = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(TEMPLATE_PATH, output);

console.log(`\n${'='.repeat(50)}`);
console.log(`Done! Injected ${totalInjected} template tags.`);

// Verify: list all template variables found
const verifyXml = zip.file('word/document.xml').asText();
const allVars = new Set();
const varCheck = /\{[a-zA-Z_][a-zA-Z0-9_]*\}/g;
let v;
while ((v = varCheck.exec(verifyXml)) !== null) {
  allVars.add(v[0]);
}
console.log(`\nTemplate variables found (${allVars.size}):`);
[...allVars].sort().forEach(v => console.log(`  ${v}`));
