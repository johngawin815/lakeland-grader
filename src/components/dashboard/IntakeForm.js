import React from 'react';
import { useForm } from 'react-hook-form';
import { Save } from 'lucide-react';

const IntakeForm = ({ onSave, units }) => {
  const { register, handleSubmit } = useForm();

  // Define consistent styling for form elements
  const labelClasses = "block text-sm font-bold text-slate-500 mb-1.5 uppercase tracking-wide";
  const inputClasses = "w-full p-3.5 rounded-xl border border-slate-300/80 text-base focus:ring-4 focus:ring-indigo-500/20 bg-white/80 outline-none transition-all duration-300";

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-2xl shadow-slate-300/60 p-8 animate-in fade-in-5 zoom-in-95 duration-300">
        <h3 className="m-0 mb-6 text-xl font-extrabold text-slate-800">New Intake Form</h3>
        <form onSubmit={handleSubmit(onSave)}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Student Name */}
                <div className="md:col-span-2">
                    <label className={labelClasses}>Full Name</label>
                    <input {...register("studentName")} className={inputClasses} placeholder="e.g., Johnathan Doe" />
                </div>

                {/* Grade Level */}
                <div>
                    <label className={labelClasses}>Grade</label>
                    <select {...register("gradeLevel")} className={`${inputClasses} bg-white`}>
                        <option>9</option>
                        <option>10</option>
                        <option>11</option>
                        <option>12</option>
                    </select>
                </div>
                
                {/* Unit */}
                <div>
                    <label className={labelClasses}>Unit</label>
                    <select {...register("unitName")} className={`${inputClasses} bg-white`}>
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
                    <input type="date" {...register("dischargeDate")} className={inputClasses} />
                </div>

                {/* District */}
                <div className="md:col-span-2">
                    <label className={labelClasses}>Home District</label>
                    <input {...register("district")} className={inputClasses} placeholder="e.g., Lakeland Regional" />
                </div>
                
                {/* IEP Status */}
                <div>
                    <label className={labelClasses}>IEP Status</label>
                    <select {...register("iepStatus")} className={`${inputClasses} bg-white`}>
                        <option>No</option>
                        <option>Yes</option>
                    </select>
                </div>
                
                {/* Save Button */}
                <div className="md:col-span-3 flex items-end pt-4 mt-2 border-t border-slate-200/80">
                    <button 
                        type="submit" 
                        className="w-full bg-indigo-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 ease-in-out disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        Save New Student
                    </button>
                </div>

            </div>
        </form>
    </div>
  );
};

export default IntakeForm;