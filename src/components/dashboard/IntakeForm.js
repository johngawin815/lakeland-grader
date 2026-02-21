import React from 'react';
import { useForm } from 'react-hook-form';
import { Save } from 'lucide-react';

const IntakeForm = ({ onSave, units }) => {
  const { register, handleSubmit } = useForm();

  // Define consistent styling for form elements
  const labelClasses = "block text-sm font-bold text-slate-600 mb-1 uppercase tracking-wide";
  const inputClasses = "w-full p-3 rounded-lg border border-slate-300 text-base focus:ring-2 focus:ring-sky-500 outline-none transition";

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 absolute top-20 left-8 right-8 z-50">
        <h3 className="m-0 mb-5 text-lg font-bold text-slate-800">New Intake Form</h3>
        <form onSubmit={handleSubmit(onSave)}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Student Name */}
                <div>
                    <label className={labelClasses}>Name</label>
                    <input {...register("studentName")} className={inputClasses} />
                </div>

                {/* Unit */}
                <div>
                    <label className={labelClasses}>Unit</label>
                    <select {...register("unitName")} className={`${inputClasses} bg-white`}>
                        {units.map(u=><option key={u.key}>{u.key}</option>)}
                    </select>
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

                {/* Admit Date */}
                <div>
                    <label className={labelClasses}>Admit</label>
                    <input type="date" {...register("admitDate")} className={inputClasses} />
                </div>

                {/* Discharge Date */}
                <div>
                    <label className={labelClasses}>Discharge</label>
                    <input type="date" {...register("dischargeDate")} className={inputClasses} />
                </div>

                {/* IEP Status */}
                <div>
                    <label className={labelClasses}>IEP</label>
                    <select {...register("iepStatus")} className={`${inputClasses} bg-white`}>
                        <option>No</option>
                        <option>Yes</option>
                    </select>
                </div>
                
                {/* District */}
                <div className="md:col-span-2">
                    <label className={labelClasses}>District</label>
                    <input {...register("district")} className={inputClasses} />
                </div>
                
                {/* Save Button */}
                <div className="flex items-end">
                    <button 
                        type="submit" 
                        className="w-full bg-sky-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        Save Student
                    </button>
                </div>

            </div>
        </form>
    </div>
  );
};

export default IntakeForm;