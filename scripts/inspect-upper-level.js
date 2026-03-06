/**
 * Inspect Upper Level Grade Card.docx structure
 *
 * Prints all tables, rows, cells, and text content so we can identify
 * which table indices correspond to the 5 quarterly tables vs. header layout.
 */
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const TEMPLATE_PATH = path.join(__dirname, '..', 'public', 'templates', 'Upper Level Grade Card.docx');

const content = fs.readFileSync(TEMPLATE_PATH);
const zip = new PizZip(content);
const xml = zip.file('word/document.xml').asText();

// Find all tables
const tableRegex = /<w:tbl[\s>][\s\S]*?<\/w:tbl>/g;
let tableMatch;
let tableIndex = 0;

while ((tableMatch = tableRegex.exec(xml)) !== null) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TABLE ${tableIndex} (starts at char ${tableMatch.index})`);
  console.log('='.repeat(60));

  const tableXml = tableMatch[0];

  // Find all rows in this table
  const rowRegex = /<w:tr[\s>][\s\S]*?<\/w:tr>/g;
  let rowMatch;
  let rowIndex = 0;

  while ((rowMatch = rowRegex.exec(tableXml)) !== null) {
    const rowXml = rowMatch[0];

    // Find all cells in this row
    const cellRegex = /<w:tc[\s>][\s\S]*?<\/w:tc>/g;
    let cellMatch;
    let cellIndex = 0;
    const cellTexts = [];

    while ((cellMatch = cellRegex.exec(rowXml)) !== null) {
      const cellXml = cellMatch[0];

      // Extract text from <w:t> tags
      const textRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
      let textMatch;
      let cellText = '';

      while ((textMatch = textRegex.exec(cellXml)) !== null) {
        cellText += textMatch[1];
      }

      cellTexts.push(cellText || '(empty)');
      cellIndex++;
    }

    console.log(`  Row ${rowIndex} [${cellIndex} cells]: ${cellTexts.map((t, i) => `[${i}]"${t}"`).join(' | ')}`);
    rowIndex++;
  }

  console.log(`  Total rows: ${rowIndex}`);
  tableIndex++;
}

console.log(`\n\nTotal tables found: ${tableIndex}`);

// Also check paragraphs between tables for quarter labels
console.log('\n\n--- Paragraph text near tables ---');
const paraRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
let paraMatch;
while ((paraMatch = paraRegex.exec(xml)) !== null) {
  const paraXml = paraMatch[0];
  const textRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
  let textMatch;
  let paraText = '';
  while ((textMatch = textRegex.exec(paraXml)) !== null) {
    paraText += textMatch[1];
  }
  if (paraText.trim()) {
    // Only print paragraphs that contain relevant text
    const lower = paraText.toLowerCase();
    if (lower.includes('quarter') || lower.includes('summer') || lower.includes('student') ||
        lower.includes('school') || lower.includes('grade') || lower.includes('admit') ||
        lower.includes('discharge') || lower.includes('credits') || lower.includes('course') ||
        lower.includes('instructor') || lower.includes('scholarship') || lower.includes('lakeland') ||
        lower.includes('principal')) {
      console.log(`  [char ${paraMatch.index}] "${paraText.trim()}"`);
    }
  }
}
