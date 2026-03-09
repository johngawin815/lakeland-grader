import React, { useState, useCallback, useEffect } from 'react';
import { useAutoSave } from '../../hooks/useAutoSave';
import { Save, Loader2, Settings, CheckSquare, Square } from 'lucide-react';
import { UNIT_CONFIG } from '../../config/unitConfig';
import { databaseService } from '../../services/databaseService';

const TeacherSettings = ({ user, onUpdateUser }) => {

  const [selectedUnits, setSelectedUnits] = useState(user?.units || []);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Auto-save integration
  const saveFn = useCallback(async () => {
    if (selectedUnits.length === 0) return;
    const teacherId = `teacher_${user.email.split('@')[0].replace(/\./g, '-')}`;
    const teacherDoc = {
      id: teacherId,
      name: user.name,
      email: user.email,
      units: selectedUnits,
      role: user.role || 'teacher',
    };
    await databaseService.upsertTeacher(teacherDoc);
    onUpdateUser(prev => ({ ...prev, units: selectedUnits }));
    setSavedMessage('Settings auto-saved.');
    setIsDirty(false);
  }, [selectedUnits, user, onUpdateUser]);

  const { saveStatus, lastSavedAt, forceSave } = useAutoSave(isDirty, saveFn, { delay: 3000, enabled: selectedUnits.length > 0 });

  // Mark dirty on unit change
  useEffect(() => {
    setIsDirty(true);
  }, [selectedUnits]);

  const assignableUnits = UNIT_CONFIG.filter(u => u.key !== 'Discharged');

  const toggleUnit = (unitKey) => {
    setSelectedUnits(prev =>
      prev.includes(unitKey)
        ? prev.filter(u => u !== unitKey)
        : [...prev, unitKey]
    );
    setSavedMessage('');
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (selectedUnits.length === 0) return;
    setSaving(true);
    setSavedMessage('');
    try {
      const teacherId = `teacher_${user.email.split('@')[0].replace(/\./g, '-')}`;
      const teacherDoc = {
        id: teacherId,
        name: user.name,
        email: user.email,
        units: selectedUnits,
        role: user.role || 'teacher',
      };
      await databaseService.upsertTeacher(teacherDoc);
      onUpdateUser(prev => ({ ...prev, units: selectedUnits }));
      setSavedMessage('Settings saved.');
    } catch (err) {
      console.error('Failed to save teacher settings:', err);
      setSavedMessage('Failed to save. Please try again.');
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-slate-100 rounded-xl">
          <Settings className="w-6 h-6 text-slate-600" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Teacher Settings</h2>
          <p className="text-sm text-slate-500">Configure your profile and unit assignments</p>
        </div>
      </div>

      {/* Profile Info (read-only) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mb-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Profile</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Name</div>
            <div className="text-sm font-bold text-slate-800">{user?.name || 'Unknown'}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</div>
            <div className="text-sm font-medium text-slate-600">{user?.email || 'N/A'}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role</div>
            <div className="text-sm font-medium text-slate-600 capitalize">{user?.role || 'Teacher'}</div>
          </div>
        </div>
      </div>

      {/* Unit Assignment */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assigned Units</h3>
        <p className="text-sm text-slate-500 mb-4">
          Select the residential unit(s) you manage. Students from these units will auto-populate your gradebooks.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {assignableUnits.map(unit => {
            const Icon = unit.icon;
            const isSelected = selectedUnits.includes(unit.key);
            return (
              <button
                key={unit.key}
                onClick={() => toggleUnit(unit.key)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? `${unit.tagBg} border-current shadow-sm`
                    : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                }`}
              >
                {isSelected
                  ? <CheckSquare className="w-5 h-5 shrink-0" />
                  : <Square className="w-5 h-5 shrink-0" />
                }
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-sm font-bold">{unit.label}</span>
              </button>
            );
          })}
        </div>

        {selectedUnits.length === 0 && (
          <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
            Please select at least one unit.
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving || selectedUnits.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {savedMessage && (
            <span className={`text-sm font-medium ${savedMessage.includes('Failed') ? 'text-rose-600' : 'text-emerald-600'}`}>
              {savedMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherSettings;
