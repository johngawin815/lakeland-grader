
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { databaseService } from '../../services/databaseService';

const GradeSpreadsheet = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateSpreadsheet = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all students
      const allStudents = await databaseService.getAllStudents();
      
      // Filter for active students
      const activeStudents = allStudents.filter(student => student.active);

      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Create a worksheet
      const ws_data = [
        ["Student Name", "Grade Level", "Subject", "Q1 Grade", "Q2 Grade", "Midterm Exam", "Q3 Grade", "Q4 Grade", "Final Exam", "Final Grade"],
      ];

      for (const student of activeStudents) {
        if (student.grades && student.grades.length > 0) {
          student.grades.forEach(grade => {
            ws_data.push([
              student.name,
              student.gradeLevel,
              grade.subject,
              grade.Q1,
              grade.Q2,
              grade.midterm,
              grade.Q3,
              grade.Q4,
              grade.final,
              grade.finalGrade
            ]);
          });
        } else {
          ws_data.push([student.name, student.gradeLevel, "No grades recorded", "", "", "", "", "", "", ""]);
        }
      }

      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      XLSX.utils.book_append_sheet(wb, ws, "Grades");

      // Generate XLSX file and trigger download
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout], { type: "application/octet-stream" }), "grade_spreadsheet.xlsx");

    } catch (err) {
      console.error("Error generating spreadsheet:", err);
      setError("Failed to generate spreadsheet. Please check the console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={generateSpreadsheet}
        disabled={isLoading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        {isLoading ? 'Generating...' : 'Generate Mid-Quarter Spreadsheet'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default GradeSpreadsheet;
