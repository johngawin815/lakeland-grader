import React from 'react';
import { useForm } from 'react-hook-form';
import { Save } from 'lucide-react';
import { STATE_OPTIONS } from '../../data/stateGraduationRequirements';

const IntakeForm = ({ onSave, units, defaultUnit }) => {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      unitName: defaultUnit || units[0]?.key || '',
    },
  });

  const labelClasses = "block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide";
  const inputClasses = "w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white outline-none transition-all placeholder:text-slate-400";

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-lg p-6 animate-slide-up">
        <h3 className="text-lg font-bold text-slate-800 mb-4">New Student Intake</h3>
        <form onSubmit={handleSubmit(onSave)}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Student Name */}
                <div className="md:col-span-2">
                    <label className={labelClasses}>Full Name</label>
                    <input {...register("studentName")} className={inputClasses} placeholder="e.g., Johnathan Doe" />
                </div>

                {/* Grade Level */}
                <div>
                    <label className={labelClasses}>Grade</label>
                    <select {...register("gradeLevel")} className={inputClasses}>
                        <option>8</option>
                        <option>9</option>
                        <option>10</option>
                        <option>11</option>
                        <option>12</option>
                    </select>
                </div>

                {/* Unit */}
                <div>
                    <label className={labelClasses}>Unit</label>
                    <select {...register("unitName")} className={inputClasses}>
                        {units.map(u=><option key={u.key}>{u.key}</option>)}
                    </select>
                </div>

                {/* Admit Date */}
                <div>
                    <label className={labelClasses}>Admit Date</label>
                    <input type="date" {...register("admitDate")} className={inputClasses} />
                </div>

                {/* Discharge Date */}
                <div>
                    <label className={labelClasses}>Exp. Discharge</label>
                    <input type="date" {...register("expectedDischargeDate")} className={inputClasses} />
                </div>

                {/* District */}
                <div>
                    <label className={labelClasses}>Home District</label>
                    <input {...register("district")} className={inputClasses} placeholder="e.g., Lakeland Regional" />
                </div>

                {/* Home State */}
                <div>
                    <label className={labelClasses}>Home State</label>
                    <select {...register("homeState")} className={inputClasses}>
                        <option value="">Select state...</option>
                        {STATE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                </div>

                {/* IEP Status */}
                <div>
                    <label className={labelClasses}>IEP Status</label>
                    <select {...register("iepStatus")} className={inputClasses}>
                        <option>No</option>
                        <option>Yes</option>
                    </select>
                </div>

                {/* Save Button */}
                <div className="md:col-span-3 flex items-end pt-3 mt-1 border-t border-slate-200/80">
                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm hover:bg-indigo-700 transition-all text-sm flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save New Student
                    </button>
                </div>

            </div>
        </form>
    </div>
  );
};

export default IntakeForm;
