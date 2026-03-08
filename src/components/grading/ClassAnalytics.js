import React, { useMemo } from 'react';
import { TrendingUp, Users, Award, AlertTriangle, BarChart3, XCircle } from 'lucide-react';
import { calculateLetterGrade } from '../../utils/gradeCalculator';

const ClassAnalytics = ({ students, finalGrades, assignments, categories, grades, attendance }) => {

  const stats = useMemo(() => {
    const validGrades = students
      .map(s => finalGrades[s.id])
      .filter(g => g !== null && g !== undefined);

    if (validGrades.length === 0) {
      return { average: 0, median: 0, passing: 0, passingRate: 0, total: students.length, graded: 0 };
    }

    const sorted = [...validGrades].sort((a, b) => a - b);
    const average = validGrades.reduce((sum, g) => sum + g, 0) / validGrades.length;
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    const passing = validGrades.filter(g => g >= 60).length;

    return {
      average,
      median,
      passing,
      passingRate: (passing / validGrades.length) * 100,
      total: students.length,
      graded: validGrades.length,
    };
  }, [students, finalGrades]);

  const distribution = useMemo(() => {
    const bands = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    students.forEach(s => {
      const g = finalGrades[s.id];
      if (g !== null && g !== undefined) {
        bands[calculateLetterGrade(g)]++;
      }
    });
    return bands;
  }, [students, finalGrades]);

  const maxBand = Math.max(...Object.values(distribution), 1);

  const failingStudents = useMemo(() => {
    return students
      .filter(s => {
        const g = finalGrades[s.id];
        return g !== null && g !== undefined && g < 60;
      })
      .map(s => {
        const absences = Object.values(attendance).reduce((count, day) => {
          return day[s.id] === 'Absent' ? count + 1 : count;
        }, 0);
        return { ...s, grade: finalGrades[s.id], absences };
      })
      .sort((a, b) => a.grade - b.grade);
  }, [students, finalGrades, attendance]);

  const assignmentStats = useMemo(() => {
    return assignments.map(a => {
      const scores = students
        .map(s => grades[s.id]?.[a.id])
        .filter(v => v !== undefined && v !== null && v !== '');

      if (scores.length === 0) return { ...a, avg: null, count: 0 };

      const numScores = scores.map(Number);
      const avg = numScores.reduce((sum, v) => sum + v, 0) / numScores.length;
      const pct = (avg / a.maxScore) * 100;
      const category = categories.find(c => c.id === a.categoryId);

      return { ...a, avg, pct, count: scores.length, categoryName: category?.name || '' };
    })
    .filter(a => a.avg !== null)
    .sort((a, b) => a.pct - b.pct);
  }, [assignments, students, grades, categories]);

  const absenceCorrelation = useMemo(() => {
    return students
      .map(s => {
        const absences = Object.values(attendance).reduce((count, day) => {
          return day[s.id] === 'Absent' ? count + 1 : count;
        }, 0);
        return { ...s, grade: finalGrades[s.id], absences };
      })
      .filter(s => s.absences >= 3 && s.grade !== null && s.grade < 70)
      .sort((a, b) => b.absences - a.absences);
  }, [students, finalGrades, attendance]);

  const bandColors = {
    A: { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
    B: { bar: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
    C: { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
    D: { bar: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50' },
    F: { bar: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' },
  };

  return (
    <div className="p-6 space-y-8 overflow-y-auto">

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}
          label="Class Average"
          value={stats.graded > 0 ? `${stats.average.toFixed(1)}%` : 'N/A'}
          sub={stats.graded > 0 ? calculateLetterGrade(stats.average) : ''}
          color="indigo"
        />
        <StatCard
          icon={<BarChart3 className="w-5 h-5 text-blue-500" />}
          label="Median Grade"
          value={stats.graded > 0 ? `${stats.median.toFixed(1)}%` : 'N/A'}
          sub={stats.graded > 0 ? calculateLetterGrade(stats.median) : ''}
          color="blue"
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-emerald-500" />}
          label="Passing Rate"
          value={stats.graded > 0 ? `${stats.passingRate.toFixed(0)}%` : 'N/A'}
          sub={`${stats.passing}/${stats.graded} students`}
          color="emerald"
        />
        <StatCard
          icon={<XCircle className="w-5 h-5 text-rose-500" />}
          label="Absence Rate"
          value={(() => {
            const totalDays = Object.keys(attendance).length;
            if (totalDays === 0) return 'N/A';
            const totalAbsences = Object.values(attendance).reduce((sum, day) => {
              return sum + Object.values(day).filter(s => s === 'Absent').length;
            }, 0);
            const rate = (totalAbsences / (totalDays * students.length)) * 100;
            return `${rate.toFixed(1)}%`;
          })()}
          sub={`${Object.keys(attendance).length} days tracked`}
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Grade Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-500" /> Grade Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(distribution).map(([letter, count]) => (
              <div key={letter} className="flex items-center gap-3">
                <span className={`w-8 text-center text-sm font-black ${bandColors[letter].text}`}>{letter}</span>
                <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden relative">
                  <div
                    className={`h-full rounded-lg transition-all duration-700 ${bandColors[letter].bar}`}
                    style={{ width: `${(count / maxBand) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-bold text-slate-600">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Failing Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Students Below 60%
          </h3>
          {failingStudents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">&#127881;</div>
              <p className="text-sm font-bold text-emerald-600">All students are passing!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {failingStudents.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-rose-50 rounded-xl px-4 py-3 border border-rose-100">
                  <div>
                    <span className="text-sm font-bold text-slate-800">{s.name}</span>
                    {s.absences > 0 && (
                      <span className="ml-2 text-xs font-bold text-rose-500 bg-rose-100 px-2 py-0.5 rounded-full">
                        {s.absences} absences
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-black text-rose-600">{s.grade.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assignment Analysis */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-500" /> Assignment Analysis
          <span className="text-xs font-medium text-slate-400 normal-case tracking-normal ml-1">sorted by difficulty (hardest first)</span>
        </h3>
        {assignmentStats.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-4">No graded assignments yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
                  <th className="text-left p-3">Assignment</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-center p-3">Responses</th>
                  <th className="text-center p-3">Avg Score</th>
                  <th className="p-3 w-48">Class Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignmentStats.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-bold text-slate-800">{a.name}</td>
                    <td className="p-3">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold">{a.categoryName}</span>
                    </td>
                    <td className="p-3 text-center text-slate-600 font-medium">{a.count}/{students.length}</td>
                    <td className="p-3 text-center font-bold text-slate-700">{a.avg.toFixed(1)}/{a.maxScore}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${a.pct >= 80 ? 'bg-emerald-500' : a.pct >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min(a.pct, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold w-12 text-right ${a.pct >= 80 ? 'text-emerald-600' : a.pct >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {a.pct.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Absence Correlation */}
      {absenceCorrelation.length > 0 && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200/80 p-6">
          <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Attendance Concerns
          </h3>
          <p className="text-xs text-amber-700 mb-4">
            Students with 3+ absences and grades below 70% — attendance may be impacting academic progress.
          </p>
          <div className="space-y-2">
            {absenceCorrelation.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-slate-50/80 rounded-xl px-4 py-3 border border-amber-200/50">
                <span className="text-sm font-bold text-slate-800">{s.name}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-bold text-amber-700">{s.absences} absences</span>
                  <span className="font-bold text-rose-600">{s.grade.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const STAT_COLORS = {
  indigo:  { bg: 'bg-indigo-50/50',  border: 'border-indigo-100/50',  text: 'text-indigo-700' },
  blue:    { bg: 'bg-blue-50/50',    border: 'border-blue-100/50',    text: 'text-blue-700' },
  emerald: { bg: 'bg-emerald-50/50', border: 'border-emerald-100/50', text: 'text-emerald-700' },
  rose:    { bg: 'bg-rose-50/50',    border: 'border-rose-100/50',    text: 'text-rose-700' },
};

const StatCard = ({ icon, label, value, sub, color }) => {
  const colors = STAT_COLORS[color] || STAT_COLORS.indigo;
  return (
    <div className={`${colors.bg} rounded-2xl p-5 border ${colors.border}`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl font-black ${colors.text}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 font-medium mt-1">{sub}</div>}
    </div>
  );
};

export default ClassAnalytics;
