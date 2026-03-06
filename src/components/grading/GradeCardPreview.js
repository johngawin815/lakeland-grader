import React from 'react';

const GradeCardPreview = ({ formData, templateConfig }) => {
  const getGradeColor = (grade) => {
    if (!grade) return 'text-slate-400';
    const g = grade.toUpperCase().charAt(0);
    if (g === 'A') return 'text-emerald-600';
    if (g === 'B') return 'text-blue-600';
    if (g === 'C') return 'text-amber-600';
    if (g === 'D') return 'text-orange-600';
    if (g === 'F') return 'text-rose-600';
    return 'text-slate-600';
  };

  const getGradeBg = (grade) => {
    if (!grade) return 'bg-slate-50';
    const g = grade.toUpperCase().charAt(0);
    if (g === 'A') return 'bg-emerald-50';
    if (g === 'B') return 'bg-blue-50';
    if (g === 'C') return 'bg-amber-50';
    if (g === 'D') return 'bg-orange-50';
    if (g === 'F') return 'bg-rose-50';
    return 'bg-slate-50';
  };

  const showCredits = templateConfig?.hasCredits;

  const coreClasses = [
    { label: formData.engClass || 'English', grade: formData.engGrade, pct: formData.engPct, credits: formData.engCredits },
    { label: formData.mathClass || 'Math', grade: formData.mathGrade, pct: formData.mathPct, credits: formData.mathCredits },
    { label: formData.sciClass || 'Science', grade: formData.sciGrade, pct: formData.sciPct, credits: formData.sciCredits },
    { label: formData.socClass || 'Social Studies', grade: formData.socGrade, pct: formData.socPct, credits: formData.socCredits },
  ];

  const electives = templateConfig?.hasElectives ? [
    { label: formData.elec1Class, grade: formData.elec1Grade, pct: formData.elec1Pct, credits: formData.elec1Credits },
    { label: formData.elec2Class, grade: formData.elec2Grade, pct: formData.elec2Pct, credits: formData.elec2Credits },
  ].filter(e => e.label || e.grade) : [];

  const allClasses = [...coreClasses, ...electives];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden text-sm">
      {/* Header Band */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200 mb-1">
          {templateConfig?.label || 'Grade Report'}
        </div>
        <h2 className="text-2xl font-black tracking-tight">
          {formData.studentName || 'Student Name'}
        </h2>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-indigo-200">
          {formData.quarterName && <span><strong className="text-white">{formData.quarterName}</strong></span>}
          {templateConfig?.hasSchoolYear && formData.schoolYear && <span>{formData.schoolYear}</span>}
          {templateConfig?.hasGradeLevel && formData.gradeLevel && <span>Grade {formData.gradeLevel}</span>}
          {formData.reportDate && <span>{formData.reportDate}</span>}
        </div>
      </div>

      {/* Info Grid */}
      <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200/60 flex flex-wrap gap-x-8 gap-y-2 text-xs">
        {templateConfig?.hasTeacher && formData.teacherName && (
          <div><span className="text-slate-400 font-semibold">Teacher:</span> <span className="text-slate-700 font-bold">{formData.teacherName}</span></div>
        )}
        {templateConfig?.hasCredits && formData.totalCredits && (
          <div><span className="text-slate-400 font-semibold">Credits:</span> <span className="text-slate-700 font-bold">{formData.totalCredits}</span></div>
        )}
      </div>

      {/* Grades Table */}
      <div className="p-6">
        <table className="w-full">
          <thead>
            <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              <th className="text-left pb-3 pl-3">Class</th>
              <th className="text-center pb-3 w-20">Grade</th>
              <th className="text-center pb-3 w-20">%</th>
              {showCredits && <th className="text-center pb-3 w-16">Cr</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allClasses.map((cls, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 pl-3 font-bold text-slate-700">{cls.label || '—'}</td>
                <td className="py-3 text-center">
                  {cls.grade ? (
                    <span className={`inline-block px-3 py-1 rounded-lg font-black text-xs ${getGradeBg(cls.grade)} ${getGradeColor(cls.grade)}`}>
                      {cls.grade}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="py-3 text-center font-mono font-bold text-slate-500">
                  {cls.pct ? `${cls.pct}%` : '—'}
                </td>
                {showCredits && (
                  <td className="py-3 text-center font-mono font-bold text-slate-500">
                    {cls.credits || '—'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Comments */}
      {formData.comments && (
        <div className="px-6 pb-6">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Comments</div>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{formData.comments}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-3 bg-slate-50/70 border-t border-slate-200/60 text-center text-xs text-slate-400 font-medium">
        Lakeland Regional School &middot; Generated {new Date().toLocaleDateString()}
      </div>
    </div>
  );
};

export default GradeCardPreview;
