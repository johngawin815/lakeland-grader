import React, { useState } from 'react';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useForm } from 'react-hook-form';
import { Save, ChevronDown, ChevronUp, Heart, Users, School, BookOpen } from 'lucide-react';
import { STATE_OPTIONS } from '../../data/stateGraduationRequirements';

const IntakeForm = ({ onSave, units, defaultUnit }) => {
  // Local storage key for intake form
  const LS_KEY = `intakeForm_${defaultUnit || units[0]?.key || 'default'}`;
  const saved = localStorage.getItem(LS_KEY);
  const { register, handleSubmit, formState: { dirtyFields }, watch, reset } = useForm({
    defaultValues: saved ? JSON.parse(saved) : {
      unitName: defaultUnit || units[0]?.key || '',
    },
  });
  // Restore from localStorage on mount
  React.useEffect(() => {
    if (saved) reset(JSON.parse(saved));
  }, [saved, reset]);
  // Auto-save integration
  const isDirty = Object.keys(dirtyFields).length > 0;
  // Auto-save to localStorage after each edit
  React.useEffect(() => {
    const formData = watch();
    localStorage.setItem(LS_KEY, JSON.stringify(formData));
  }, [watch]);
  // Only save to DB when user clicks Save
  // Auto-save status feedback
  const autoSaveStatus = (
    <>
      {saveStatus === 'saving' && <div className="p-2 bg-indigo-50 border border-indigo-200 rounded text-indigo-700 text-xs font-semibold flex items-center gap-1.5">Auto-saving...</div>}
      {saveStatus === 'saved' && lastSavedAt && <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-700 text-xs font-semibold flex items-center gap-1.5">Auto-saved {lastSavedAt.toLocaleTimeString()}</div>}
      {saveStatus === 'error' && <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs font-semibold">Auto-save failed</div>}
    </>
  );

  const [openSections, setOpenSections] = useState({
    student: true,
    health: false,
    guardian1: false,
    homeSchool: false,
  });

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const labelClasses = "block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide";
  const inputClasses = "w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white outline-none transition-all placeholder:text-slate-400";

  const SectionHeader = ({ sectionKey, icon: Icon, label, color }) => (
    <button
      type="button"
      onClick={() => toggleSection(sectionKey)}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
        openSections[sectionKey]
          ? `${color} border border-current/20`
          : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'
      }`}
    >
      <span className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      {openSections[sectionKey] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
    </button>
  );

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-lg p-6 animate-slide-up">
        <h3 className="text-lg font-bold text-slate-800 mb-4">New Student Intake</h3>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">

            {/* === STUDENT INFO (always open by default) === */}
            <SectionHeader sectionKey="student" icon={Users} label="Student Information" color="bg-indigo-50 text-indigo-700" />
            {openSections.student && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-1">
                <div className="md:col-span-2">
                    <label className={labelClasses}>Full Name</label>
                    <input {...register("studentName")} className={inputClasses} placeholder="e.g., Johnathan Doe" />
                </div>
                <div>
                    <label className={labelClasses}>Grade</label>
                    <select {...register("gradeLevel")} className={inputClasses}>
                        <option>K</option>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => <option key={g}>{g}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelClasses}>Unit</label>
                    <select {...register("unitName")} className={inputClasses}>
                        {units.filter(u => u.key !== 'Discharged').map(u => <option key={u.key}>{u.key}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelClasses}>Admit Date</label>
                    <input type="date" {...register("admitDate")} className={inputClasses} />
                </div>
                <div>
                    <label className={labelClasses}>Exp. Discharge</label>
                    <input type="date" {...register("expectedDischargeDate")} className={inputClasses} />
                </div>
                <div>
                    <label className={labelClasses}>Home State</label>
                    <select {...register("homeState")} className={inputClasses}>
                        <option value="">Select state...</option>
                        {STATE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelClasses}>IEP Status</label>
                    <select {...register("iepStatus")} className={inputClasses}>
                        <option>No</option>
                        <option>Yes</option>
                    </select>
                </div>
                <div className="flex items-center gap-2 md:col-span-3 mt-1">
                    <input type="checkbox" id="autoEnrollDefaults" {...register("autoEnrollDefaults")} defaultChecked className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <label htmlFor="autoEnrollDefaults" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 cursor-pointer">
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                        Auto-enroll in default courses (based on grade level)
                    </label>
                </div>
              </div>
            )}

            {/* === HEALTH & ADMISSION === */}
            <SectionHeader sectionKey="health" icon={Heart} label="Health & Admission" color="bg-rose-50 text-rose-700" />
            {openSections.health && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-1">
                <div>
                    <label className={labelClasses}>Health Insurance</label>
                    <input {...register("healthInsurance")} className={inputClasses} placeholder="e.g., Medicaid, Aetna" />
                </div>
                <div>
                    <label className={labelClasses}>Therapist Name</label>
                    <input {...register("therapistName")} className={inputClasses} placeholder="e.g., Dr. Sarah Johnson" />
                </div>
                <div className="md:col-span-3">
                    <label className={labelClasses}>Reason for Admit</label>
                    <textarea {...register("reasonForAdmit")} className={inputClasses + " resize-vertical min-h-[60px]"} rows={2} placeholder="Describe reason for admission..." />
                </div>
              </div>
            )}

            {/* === GUARDIAN 1 === */}
            <SectionHeader sectionKey="guardian1" icon={Users} label="Guardian 1" color="bg-blue-50 text-blue-700" />
            {openSections.guardian1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-1">
                <div>
                    <label className={labelClasses}>Name</label>
                    <input {...register("guardian1Name")} className={inputClasses} placeholder="Full name" />
                </div>
                <div>
                    <label className={labelClasses}>Phone</label>
                    <input type="tel" {...register("guardian1Phone")} className={inputClasses} placeholder="(555) 123-4567" />
                </div>
                <div>
                    <label className={labelClasses}>Email</label>
                    <input type="email" {...register("guardian1Email")} className={inputClasses} placeholder="guardian@email.com" />
                </div>
                <div>
                    <label className={labelClasses}>Address</label>
                    <input {...register("guardian1Address")} className={inputClasses} placeholder="123 Main St, City, State ZIP" />
                </div>
              </div>
            )}

            {/* === HOME SCHOOL === */}
            <SectionHeader sectionKey="homeSchool" icon={School} label="Home School Information" color="bg-emerald-50 text-emerald-700" />
            {openSections.homeSchool && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-1">
                <div>
                    <label className={labelClasses}>School Name</label>
                    <input {...register("homeSchoolName")} className={inputClasses} placeholder="e.g., Lincoln High School" />
                </div>
                <div>
                    <label className={labelClasses}>District</label>
                    <input {...register("district")} className={inputClasses} placeholder="e.g., Lakeland Regional" />
                </div>
                <div>
                    <label className={labelClasses}>School Address</label>
                    <input {...register("homeSchoolAddress")} className={inputClasses} placeholder="123 School Rd, City, State ZIP" />
                </div>
                <div>
                    <label className={labelClasses}>Contact Name</label>
                    <input {...register("homeSchoolContactName")} className={inputClasses} placeholder="e.g., Jane Smith" />
                </div>
                <div>
                    <label className={labelClasses}>Position</label>
                    <input {...register("homeSchoolContactPosition")} className={inputClasses} placeholder="e.g., Guidance Counselor" />
                </div>
                <div>
                    <label className={labelClasses}>Phone</label>
                    <input type="tel" {...register("homeSchoolContactPhone")} className={inputClasses} placeholder="(555) 123-4567" />
                </div>
                <div>
                    <label className={labelClasses}>Email</label>
                    <input type="email" {...register("homeSchoolContactEmail")} className={inputClasses} placeholder="contact@school.edu" />
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex items-end pt-3 mt-1 border-t border-slate-200/80">
                <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm hover:bg-indigo-700 transition-all text-sm flex items-center justify-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    Save New Student
                </button>
            </div>

        </form>
    </div>
  );
};

export default IntakeForm;
