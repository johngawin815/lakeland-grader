import React from 'react';

const GradeCardPreview = ({ formData }) => {
  const getGradeColor = (grade) => {
    if (!grade) return '';
    const g = grade.toUpperCase().charAt(0);
    if (g === 'A') return 'text-emerald-700 bg-emerald-50';
    if (g === 'B') return 'text-blue-700 bg-blue-50';
    if (g === 'C') return 'text-amber-700 bg-amber-50';
    if (g === 'D') return 'text-orange-700 bg-orange-50';
    if (g === 'F') return 'text-rose-700 bg-rose-50';
    if (g === 'P') return 'text-emerald-700 bg-emerald-50';
    return '';
  };

  const title = `${formData.quarterName} Grade Spreadsheet ${formData.schoolYear}`;

  const rows = [
    {
      name: formData.studentName,
      grade: formData.gradeLevel,
      socCourse: formData.socClass,
      socGrade: formData.socGrade,
      sciCourse: formData.sciClass,
      sciGrade: formData.sciGrade,
      mathCourse: formData.mathClass,
      mathGrade: formData.mathGrade,
      engCourse: formData.engClass,
      engGrade: formData.engGrade,
      pe: formData.elec1Grade || '',
      ap: formData.elec2Grade || '',
    },
  ];

  const Cell = ({ children, className = '', header = false }) => (
    <td className={`border border-slate-300 px-1.5 py-1 ${header ? 'font-bold text-[10px] uppercase tracking-wide text-slate-500 bg-slate-100' : 'text-xs text-slate-700'} ${className}`}>
      {children || <span className="text-slate-300">&mdash;</span>}
    </td>
  );

  const GradeCell = ({ value }) => (
    <td className={`border border-slate-300 px-1.5 py-1 text-xs text-center font-bold ${getGradeColor(value)}`}>
      {value || <span className="text-slate-300">&mdash;</span>}
    </td>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs" style={{ minWidth: 520 }}>
          {/* Title row */}
          <thead>
            <tr>
              <th colSpan={14} className="bg-slate-800 text-white text-xs font-bold py-2 px-3 text-left tracking-wide">
                {title}
              </th>
            </tr>
            {/* Empty spacer row */}
            <tr>
              <td colSpan={14} className="border border-slate-300 bg-white h-3"></td>
            </tr>
            {/* Column headers */}
            <tr className="bg-slate-100">
              <Cell header className="w-2"></Cell>
              <Cell header>Name</Cell>
              <Cell header className="text-center">Gr</Cell>
              <Cell header>Soc Studies</Cell>
              <Cell header className="text-center">Grade</Cell>
              <Cell header>Science</Cell>
              <Cell header className="text-center">Grade</Cell>
              <Cell header>Mathematics</Cell>
              <Cell header className="text-center">Grade</Cell>
              <Cell header>English</Cell>
              <Cell header className="text-center">Grade</Cell>
              <Cell header className="text-center">PE</Cell>
              <Cell header className="text-center">AP</Cell>
              <Cell header>Name</Cell>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const hasData = r.name || r.socGrade || r.sciGrade || r.mathGrade || r.engGrade;
              return (
                <tr key={i} className={hasData ? 'bg-white' : 'bg-slate-50/50'}>
                  <Cell className="w-2"></Cell>
                  <Cell className="font-semibold whitespace-nowrap">{r.name}</Cell>
                  <Cell className="text-center font-mono">{r.grade}</Cell>
                  <Cell className="whitespace-nowrap">{r.socCourse}</Cell>
                  <GradeCell value={r.socGrade} />
                  <Cell className="whitespace-nowrap">{r.sciCourse}</Cell>
                  <GradeCell value={r.sciGrade} />
                  <Cell className="whitespace-nowrap">{r.mathCourse}</Cell>
                  <GradeCell value={r.mathGrade} />
                  <Cell className="whitespace-nowrap">{r.engCourse}</Cell>
                  <GradeCell value={r.engGrade} />
                  <GradeCell value={r.pe} />
                  <GradeCell value={r.ap} />
                  <Cell className="font-semibold whitespace-nowrap">{r.name}</Cell>
                </tr>
              );
            })}
            {/* Empty placeholder rows to look like a real spreadsheet */}
            {[...Array(4)].map((_, i) => (
              <tr key={`empty-${i}`} className="bg-white">
                {[...Array(14)].map((_, j) => (
                  <td key={j} className="border border-slate-200 px-1.5 py-1.5 text-xs text-slate-300">&nbsp;</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400 font-medium">
        Preview of grade_spreadsheet.xlsx export
      </div>
    </div>
  );
};

export default GradeCardPreview;
