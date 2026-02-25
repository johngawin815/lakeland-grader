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
        <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-slate-200/80 p-5 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{student.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-slate-400 font-medium">ID: {student.id}</p>
              {student.iep === 'Yes' && (
                <span className="text-xs font-bold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded">IEP</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">

          {/* Overall Grade Card */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200/80 text-center">
            {finalGrade !== null && finalGrade !== undefined ? (
              <>
                <div className={`text-5xl font-black ${getGradeColor(finalGrade)}`}>
                  {finalGrade.toFixed(1)}%
                </div>
                <div className={`text-2xl font-bold mt-1 ${getGradeColor(finalGrade)}`}>
                  {letterGrade}
                </div>
                {previousPercentage != null && (
                  <div className={`text-xs font-bold mt-1.5 ${finalGrade >= previousPercentage ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {finalGrade >= previousPercentage ? '+' : ''}{(finalGrade - previousPercentage).toFixed(1)}% from last quarter
                  </div>
                )}
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-2">Overall Grade</div>
              </>
            ) : (
              <div className="text-slate-400 italic text-sm">No grades recorded</div>
            )}
          </div>

          {/* Category Breakdown with Editable Scores */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Category Breakdown</h3>
            <div className="space-y-4">
              {categoryBreakdown.map(cat => {
                const catAssignments = assignments.filter(a => a.categoryId === cat.id);
                return (
                  <div key={cat.name}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">{cat.weight}% weight</span>
                        <span className={`text-sm font-bold ${cat.percentage !== null ? getGradeColor(cat.percentage) : 'text-slate-400'}`}>
                          {cat.percentage !== null ? `${cat.percentage.toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                      {cat.percentage !== null && (
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getBarColor(cat.percentage)}`}
                          style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                        />
                      )}
                    </div>
                    {/* Per-assignment scores */}
                    {onGradeChange && catAssignments.length > 0 && (
                      <div className="ml-2 space-y-1">
                        {catAssignments.map(a => {
                          const score = grades[student.id]?.[a.id] ?? '';
                          return (
                            <div key={a.id} className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 truncate flex-1">{a.name}</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max={a.maxScore}
                                  value={score}
                                  onChange={(e) => handleScoreChange(a.id, e.target.value)}
                                  className="w-14 text-xs text-right p-1 rounded border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                  aria-label={`${student.name} - ${a.name}`}
                                />
                                <span className="text-xs text-slate-400">/ {a.maxScore}</span>
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
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Attendance</h3>
            {attendanceStats.total > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                  <Check className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <div className="text-xl font-black text-emerald-700">{attendanceStats.present}</div>
                  <div className="text-xs font-bold text-emerald-600 uppercase">Present</div>
                </div>
                <div className="bg-rose-50 rounded-xl p-3 text-center border border-rose-100">
                  <XCircle className="w-4 h-4 text-rose-600 mx-auto mb-1" />
                  <div className="text-xl font-black text-rose-700">{attendanceStats.absent}</div>
                  <div className="text-xs font-bold text-rose-600 uppercase">Absent</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                  <Clock className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                  <div className="text-xl font-black text-amber-700">{attendanceStats.tardy}</div>
                  <div className="text-xs font-bold text-amber-600 uppercase">Tardy</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No attendance records</p>
            )}
          </div>

          {/* Smart Comment with Tone Selector */}
          {(autoComment || editedComment) && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Comment</h3>
                <button
                  onClick={handleRegenerate}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  title="Regenerate comment"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                </button>
              </div>

              {/* Tone selector */}
              <div className="flex rounded-lg bg-slate-100 p-0.5 mb-3">
                {TONE_OPTIONS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => { setCommentTone(t.key); setEditedComment(null); }}
                    className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${commentTone === t.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Editable comment textarea */}
              <textarea
                value={displayComment}
                onChange={(e) => setEditedComment(e.target.value)}
                rows={4}
                className="w-full text-sm text-slate-800 leading-relaxed bg-indigo-50 rounded-xl p-4 border border-indigo-100 resize-y min-h-[100px] focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
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
