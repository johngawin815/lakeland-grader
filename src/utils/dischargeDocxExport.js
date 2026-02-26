/**
 * Discharge DOCX Export — Generates and downloads a formatted Word document
 * for the educational discharge narrative.
 *
 * Extracted from DischargeGenerator.js for standalone testability.
 */

import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import { BOILERPLATE } from './dischargeNarrativeGenerator';

// ─── PRIVATE HELPERS ────────────────────────────────────────────────────────

function getChange(pre, post) {
  const p1 = parseFloat(pre);
  const p2 = parseFloat(post);
  if (isNaN(p1) || isNaN(p2)) return "--";
  const diff = (p2 - p1).toFixed(1);
  return (diff > 0 ? "+" : "") + diff;
}

function createCell(text, bold = false) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text: text || "-", bold, size: 22 })],
      alignment: AlignmentType.CENTER,
    })],
    verticalAlign: "center",
  });
}

// ─── MAIN EXPORT ────────────────────────────────────────────────────────────

/**
 * Generate and download a discharge narrative Word document.
 *
 * @param {object} data - Form data with all narrative fields and scores
 * @param {string} data.studentName
 * @param {string} data.gradeLevel
 * @param {string} data.age
 * @param {string} data.admitDate
 * @param {string} data.dischargeDate
 * @param {string} data.admissionReason
 * @param {string} data.behaviorNarrative
 * @param {string} data.analysisNarrative
 * @param {string} data.preReadingGE
 * @param {string} data.postReadingGE
 * @param {string} data.preMathGE
 * @param {string} data.postMathGE
 * @param {string} data.preWritingGE
 * @param {string} data.postWritingGE
 */
export async function exportDischargeDocx(data) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // HEADER
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "LAKELAND REGIONAL SCHOOL", bold: true, size: 28 })],
          spacing: { after: 100 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "EDUCATIONAL DISCHARGE NARRATIVE", bold: true, size: 24 })],
          spacing: { after: 400 },
        }),

        // STUDENT INFO ROW 1
        new Paragraph({
          children: [
            new TextRun({ text: "Student Name: ", bold: true }),
            new TextRun({ text: data.studentName || "" }),
            new TextRun({ text: "\t\tGrade: ", bold: true }),
            new TextRun({ text: String(data.gradeLevel || "") }),
            new TextRun({ text: "\t\tDOB/Age: ", bold: true }),
            new TextRun({ text: data.age || "" }),
          ],
          tabStops: [
            { type: "left", position: 4000 },
            { type: "left", position: 7000 },
          ],
        }),
        // STUDENT INFO ROW 2
        new Paragraph({
          children: [
            new TextRun({ text: "Admission Date: ", bold: true }),
            new TextRun({ text: data.admitDate || "" }),
            new TextRun({ text: "\t\tDischarge Date: ", bold: true }),
            new TextRun({ text: data.dischargeDate || "" }),
          ],
          tabStops: [
            { type: "left", position: 4000 },
          ],
          spacing: { after: 400 },
        }),

        // ADMISSION REASON
        new Paragraph({ children: [new TextRun(data.admissionReason || "")] }),

        // BOILERPLATE
        new Paragraph({ children: [new TextRun(BOILERPLATE)], spacing: { before: 200 } }),

        // BEHAVIOR HEADER
        new Paragraph({
          children: [new TextRun({ text: "CLASSROOM PERFORMANCE & BEHAVIOR", bold: true, underline: { type: "single" } })],
          spacing: { before: 400, after: 100 },
        }),
        new Paragraph({ children: [new TextRun(data.behaviorNarrative || "")] }),

        // SCORES HEADER
        new Paragraph({
          children: [new TextRun({ text: "KTEA III ASSESSMENT RESULTS", bold: true, underline: { type: "single" } })],
          spacing: { before: 400, after: 100 },
        }),

        // SCORES TABLE
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [createCell("Subject", true), createCell("Pre Test (GE)", true), createCell("Post Test (GE)", true), createCell("Change", true)] }),
            new TableRow({ children: [createCell("Reading", true), createCell(data.preReadingGE), createCell(data.postReadingGE), createCell(getChange(data.preReadingGE, data.postReadingGE))] }),
            new TableRow({ children: [createCell("Math", true), createCell(data.preMathGE), createCell(data.postMathGE), createCell(getChange(data.preMathGE, data.postMathGE))] }),
            new TableRow({ children: [createCell("Writing", true), createCell(data.preWritingGE), createCell(data.postWritingGE), createCell(getChange(data.preWritingGE, data.postWritingGE))] }),
          ],
        }),

        // ANALYSIS
        new Paragraph({ children: [new TextRun(data.analysisNarrative || "")], spacing: { before: 200 } }),

        // CLOSING
        new Paragraph({
          children: [new TextRun(`${data.studentName || "The student"} was discharged successfully from residential care on ${data.dischargeDate || "[Date]"}. If further information is needed, please contact Lakeland Regional School.`)],
          spacing: { before: 600, after: 400 },
        }),

        // SIGNATURE
        new Paragraph({
          children: [new TextRun({ text: "John Gawin, MSEd, School Instructor", bold: true })],
        }),
        new Paragraph({ children: [new TextRun("Lakeland Regional School \u2013 1-417-680-0166")] }),
        new Paragraph({ children: [new TextRun("john.gawin@lakelandbehavioralhealth.com")] }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${data.studentName || "Student"}_Discharge_Narrative.docx`);
}
