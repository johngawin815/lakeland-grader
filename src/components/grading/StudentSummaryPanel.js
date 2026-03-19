import React, { useMemo, useState, useCallback } from 'react';
import { X, GraduationCap, Check, XCircle, Clock, RefreshCw } from 'lucide-react';
import { calculateLetterGrade } from '../../utils/gradeCalculator';
import { generateSmartComment } from '../../utils/commentGenerator';
import { useGrading } from '../../context/GradingContext';

const TONE_OPTIONS = [
  { key: 'encouraging', label: 'Encouraging' },
  { key: 'balanced', label: 'Balanced' },
  { key: 'formal', label: 'Formal' },
  { key: 'direct', label: 'Direct' },
];

const StudentSummaryPanel = ({ student, grades, assignments, categories, attendance, finalGrade, previousPercentage, onClose, onGenerateGradeCard, onGradeChange }) => {
  const { commentTone, setCommentTone } = useGrading();
  const [editedComment, setEditedComment] = useState(null); // null = use auto-generated

  const categoryBreakdown = useMemo(() => {
    return categories.map(cat => {
      const catAssignments = assignments.filter(a => a.categoryId === cat.id);
      let earned = 0, max = 0;
      catAssignments.forEach(a => {
        const score = grades[student.id]?.[a.id];
        if (score !== undefined && score !== null && score !== '') {
          earned += parseFloat(score);
          max += parseFloat(a.maxScore);
        }
      });
      return {
        name: cat.name,
        id: cat.id,
        weight: cat.weight,
        percentage: max > 0 ? (earned / max) * 100 : null,
        earned,
        max,
      };
    });
  }, [student, grades, assignments, categories]);

  const attendanceStats = useMemo(() => {
    let present = 0, absent = 0, tardy = 0;
    Object.values(attendance).forEach(dayRecord => {
      const status = dayRecord[student.id];
      if (status === 'Present') present++;
      else if (status === 'Absent') absent++;
      else if (status === 'Tardy') tardy++;
    });
    return { present, absent, tardy, total: present + absent + tardy };
  }, [student, attendance]);

  const autoComment = useMemo(() => {
    if (finalGrade === null || finalGrade === undefined) return '';
    return generateSmartComment({
      studentName: student.name,
      overallPercentage: finalGrade,
      categoryBreakdown: categoryBreakdown.filter(c => c.percentage !== null),
      totalAbsences: attendanceStats.absent,
      previousPercentage: previousPercentage ?? null,
      tone: commentTone,
      hasIep: student.iep === 'Yes',
      iepGoalAreas: student.iepGoalAreas || [],
    });
  }, [student, finalGrade, categoryBreakdown, attendanceStats, previousPercentage, commentTone]);

  const displayComment = editedComment !== null ? editedComment : autoComment;

  const handleRegenerate = useCallback(() => {
    setEditedComment(null);
  }, []);

  const handleScoreChange = useCallback((assignmentId, value) => {
    if (onGradeChange) {
      onGradeChange(student.id, assignmentId, value);
    }
  }, [student.id, onGradeChange]);

  const letterGrade = finalGrade !== null && finalGrade !== undefined ? calculateLetterGrade(finalGrade) : null;

  const getGradeColor = (pct) => {
    if (pct >= 90) return 'text-emerald-600';
    if (pct >= 80) return 'text-blue-600';
    if (pct >= 70) return 'text-amber-600';
    if (pct >= 60) return 'text-orange-600';
    return 'text-rose-600';
  };

  const getBarColor = (pct) => {
    if (pct >= 90) return 'bg-emerald-500';
    if (pct >= 80) return 'bg-blue-500';
    if (pct >= 70) return 'bg-amber-500';
    if (pct >= 60) return 'bg-orange-500';
    return 'bg-rose-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[420px] bg-white shadow-2xl shadow-slate-900/20 overflow-y-auto animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 p-6 flex items-start justify-between z-20 shadow-sm shadow-slate-200/20">
          <div className="flex gap-4">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100/50">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{student.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">ID: {student.id}</span>
                {student.iep === 'Yes' && (
                  <span className="text-[10px] font-black uppercase tracking-widest bg-violet-600 text-white px-2 py-0.5 rounded-md shadow-sm shadow-violet-200">IEP</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">

          {/* Overall Grade Card */}
          <div className="bg-slate-900 rounded-3xl p-8 text-center shadow-xl shadow-slate-900/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:bg-indigo-500/20" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full -ml-12 -mb-12 blur-2xl transition-all group-hover:bg-blue-500/20" />
            
            {finalGrade !== null && finalGrade !== undefined ? (
              <div className="relative z-10">
                <div className={`text-6xl font-black tracking-tighter ${getGradeColor(finalGrade).replace('text-', 'text-indigo-400')}`}>
                  {finalGrade.toFixed(1)}%
                </div>
                <div className="text-2xl font-black text-white mt-1 uppercase tracking-widest opacity-90">
                  Grade {letterGrade}
                </div>
                {previousPercentage != null && (
                  <div className={`text-[10px] font-black mt-3 px-3 py-1 inline-flex rounded-full border ${
                    finalGrade >= previousPercentage 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {finalGrade >= previousPercentage ? '↑' : '↓'} {(finalGrade - previousPercentage).toFixed(1)}% from last quarter
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-500 italic text-sm py-4">No grades recorded</div>
            )}
          </div>

          {/* Category Breakdown */}
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Performance by Category</h3>
            <div className="space-y-6">
              {categoryBreakdown.map(cat => {
                const catAssignments = assignments.filter(a => a.categoryId === cat.id);
                return (
                  <div key={cat.name} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-sm font-black text-slate-800">{cat.name}</span>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{cat.weight}% of Total Grade</div>
                      </div>
                      <span className={`text-base font-black px-3 py-1 rounded-xl ${cat.percentage !== null ? getGradeColor(cat.percentage).replace('text-', 'bg-').concat('/10 ').concat(getGradeColor(cat.percentage)) : 'bg-slate-100 text-slate-400'}`}>
                        {cat.percentage !== null ? `${cat.percentage.toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                      {cat.percentage !== null && (
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor(cat.percentage)}`}
                          style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                        />
                      )}
                    </div>
                    {/* Per-assignment scores */}
                    {onGradeChange && catAssignments.length > 0 && (
                      <div className="space-y-2 border-t border-slate-50 pt-3 mt-1">
                        {catAssignments.map(a => {
                          const score = grades[student.id]?.[a.id] ?? '';
                          return (
                            <div key={a.id} className="flex items-center gap-3">
                              <span className="text-xs font-medium text-slate-500 truncate flex-1">{a.name}</span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  max={a.maxScore}
                                  value={score}
                                  onChange={(e) => handleScoreChange(a.id, e.target.value)}
                                  className="w-16 text-xs text-center font-black py-1.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                  aria-label={`${student.name} - ${a.name}`}
                                />
                                <span className="text-[10px] font-bold text-slate-400">/ {a.maxScore}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attendance Stats */}
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Quarterly Attendance</h3>
            {attendanceStats.total > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm transition-all hover:bg-emerald-50 hover:border-emerald-100 group/att">
                  <Check className="w-4 h-4 text-emerald-600 mx-auto mb-2 transition-transform group-hover/att:scale-110" />
                  <div className="text-2xl font-black text-slate-900 leading-none">{attendanceStats.present}</div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 group-hover/att:text-emerald-600">Present</div>
                </div>
                <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm transition-all hover:bg-rose-50 hover:border-rose-100 group/att">
                  <XCircle className="w-4 h-4 text-rose-600 mx-auto mb-2 transition-transform group-hover/att:scale-110" />
                  <div className="text-2xl font-black text-slate-900 leading-none">{attendanceStats.absent}</div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 group-hover/att:text-rose-600">Absent</div>
                </div>
                <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm transition-all hover:bg-amber-50 hover:border-amber-100 group/att">
                  <Clock className="w-4 h-4 text-amber-600 mx-auto mb-2 transition-transform group-hover/att:scale-110" />
                  <div className="text-2xl font-black text-slate-900 leading-none">{attendanceStats.tardy}</div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 group-hover/att:text-amber-600">Tardy</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic bg-white border border-slate-100 rounded-2xl p-6 text-center">No attendance records logged yet.</p>
            )}
          </div>

          {/* Smart Comment with Tone Selector */}
          {(autoComment || editedComment) && (
            <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-indigo-900/40 uppercase tracking-[0.2em]">Generated Narrative</h3>
                <button
                  onClick={handleRegenerate}
                  className="p-2 rounded-xl bg-white text-indigo-600 hover:text-indigo-800 shadow-sm border border-indigo-100 transition-all hover:rotate-180"
                  title="Regenerate comment"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tone selector */}
              <div className="flex rounded-xl bg-indigo-100/50 p-1 mb-4">
                {TONE_OPTIONS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => { setCommentTone(t.key); setEditedComment(null); }}
                    className={`flex-1 text-[10px] uppercase font-black tracking-tighter py-2 rounded-lg transition-all ${commentTone === t.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-900/40 hover:text-indigo-700'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Editable comment textarea */}
              <div className="relative group/edit">
                <textarea
                  value={displayComment}
                  onChange={(e) => setEditedComment(e.target.value)}
                  rows={5}
                  className="w-full text-sm font-medium text-slate-700 leading-relaxed bg-white/80 rounded-2xl p-5 border border-indigo-100/50 resize-y min-h-[120px] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                  placeholder="Student comment for grade card..."
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-slate-200/80">
            <button
              onClick={() => onGenerateGradeCard(student)}
              disabled={finalGrade === null || finalGrade === undefined}
              className="w-full bg-indigo-600 text-white font-bold py-3 px-5 rounded-xl shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GraduationCap className="w-5 h-5" /> Generate Grade Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSummaryPanel;
