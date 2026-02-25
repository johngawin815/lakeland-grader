/**
 * Fix DOCX Template Variable Fragmentation
 *
 * Word splits template tags like {variableName} across multiple XML <w:r> runs.
 * This script merges them back into single runs so docxtemplater can find them.
 */
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const TEMPLATE_PATH = path.join(__dirname, 'public', 'templates', 'IEP Master Form.docx');
const BACKUP_PATH = TEMPLATE_PATH + '.bak';

// Read the DOCX file
const content = fs.readFileSync(TEMPLATE_PATH);

// Back up original
if (!fs.existsSync(BACKUP_PATH)) {
  fs.copyFileSync(TEMPLATE_PATH, BACKUP_PATH);
  console.log('Backup created:', BACKUP_PATH);
}

const zip = new PizZip(content);
let xml = zip.file('word/document.xml').asText();

// Strategy: Work at the paragraph level (<w:p>...</w:p>)
// Within each paragraph, find text content that forms template variables
// when concatenated across runs, and merge those runs.

let fixCount = 0;

// Step 1: Remove proofErr tags that break template variables
const beforeProof = xml.length;
xml = xml.replace(/<w:proofErr[^/]*\/>/g, '');
const proofRemoved = (beforeProof - xml.length);
console.log(`Removed ${proofRemoved} bytes of proofErr tags`);

// Step 2: Process each paragraph to merge fragmented template variables
// Match each <w:p ...>...</w:p> block
xml = xml.replace(/<w:p[\s>][\s\S]*?<\/w:p>/g, (paragraph) => {
  // Extract all runs from this paragraph
  const runRegex = /<w:r[\s>][\s\S]*?<\/w:r>/g;
  const runs = [];
  let match;

  while ((match = runRegex.exec(paragraph)) !== null) {
    runs.push({
      fullMatch: match[0],
      index: match.index,
      // Extract text content from <w:t> tags
      text: (match[0].match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [])
        .map(t => t.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, ''))
        .join(''),
      // Extract formatting (rPr)
      rPr: (match[0].match(/<w:rPr>[\s\S]*?<\/w:rPr>/) || [''])[0],
    });
  }

  if (runs.length < 2) return paragraph;

  // Concatenate all text to see if it contains template variables
  const fullText = runs.map(r => r.text).join('');

  // Check if there are any template variables in the concatenated text
  if (!fullText.includes('{') || !fullText.includes('}')) return paragraph;

  // Find ranges of runs that form template variables
  // Build a character-to-run mapping
  const charToRun = [];
  runs.forEach((run, ri) => {
    for (let ci = 0; ci < run.text.length; ci++) {
      charToRun.push({ runIndex: ri, charIndex: ci });
    }
  });

  // Find all template variable positions in concatenated text
  const varRegex = /\{[#/]?[a-zA-Z_][a-zA-Z0-9_. ]*\}/g;
  let varMatch;
  const mergeRanges = [];

  while ((varMatch = varRegex.exec(fullText)) !== null) {
    const startChar = varMatch.index;
    const endChar = varMatch.index + varMatch[0].length - 1;
    const startRun = charToRun[startChar].runIndex;
    const endRun = charToRun[endChar].runIndex;

    if (startRun !== endRun) {
      // This variable spans multiple runs - needs merging
      mergeRanges.push({
        startRun,
        endRun,
        varText: varMatch[0],
      });
      fixCount++;
      console.log(`  Fixed fragmented variable: ${varMatch[0]} (spans runs ${startRun}-${endRun})`);
    }
  }

  if (mergeRanges.length === 0) return paragraph;

  // Apply merges in reverse order so indices stay valid
  mergeRanges.sort((a, b) => b.startRun - a.startRun);

  let modifiedParagraph = paragraph;

  for (const range of mergeRanges) {
    // Get all the text from the merged runs
    let mergedText = '';
    for (let i = range.startRun; i <= range.endRun; i++) {
      mergedText += runs[i].text;
    }

    // Use the formatting from the first run
    const firstRun = runs[range.startRun];
    const rPr = firstRun.rPr;

    // Build the replacement run with merged text
    // Use xml:space="preserve" to keep spaces
    const newRun = `<w:r>${rPr ? rPr : ''}<w:t xml:space="preserve">${mergedText}</w:t></w:r>`;

    // Replace all runs in this range with the merged run
    // We need to find and replace the actual XML runs in the paragraph
    // Replace first run with merged, remove subsequent runs
    const runsInRange = runs.slice(range.startRun, range.endRun + 1);

    // Build a regex that matches the sequence of runs (with possible content between them)
    let searchPattern = '';
    for (let i = 0; i < runsInRange.length; i++) {
      if (i > 0) searchPattern += '[\\s\\S]*?'; // Allow content between runs (bookmarks, etc)
      searchPattern += escapeRegex(runsInRange[i].fullMatch);
    }

    const combinedRegex = new RegExp(searchPattern);
    const matchResult = modifiedParagraph.match(combinedRegex);

    if (matchResult) {
      modifiedParagraph = modifiedParagraph.replace(matchResult[0], newRun);
    }
  }

  return modifiedParagraph;
});

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Save the fixed document
zip.file('word/document.xml', xml);
const output = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(TEMPLATE_PATH, output);

console.log(`\nDone! Fixed ${fixCount} fragmented template variables.`);

// Verify: list all template variables found in the fixed document
const verifyXml = zip.file('word/document.xml').asText();
const allVars = new Set();
const varCheck = /\{[#/]?[a-zA-Z_][a-zA-Z0-9_. ]*\}/g;
let v;
while ((v = varCheck.exec(verifyXml)) !== null) {
  allVars.add(v[0]);
}
console.log(`\nTemplate variables found (${allVars.size}):`);
[...allVars].sort().forEach(v => console.log(`  ${v}`));
