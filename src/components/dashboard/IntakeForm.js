import React from 'react';
import { useForm } from 'react-hook-form';

const IntakeForm = ({ onSave, units }) => {
  const { register, handleSubmit } = useForm();

  return (
    <div className="bg-white p-6 rounded-2xl mb-5 shadow-xl border border-gray-100 absolute top-20 left-8 right-8 z-50">
        <h3 className="m-0 mb-4 text-sm text-slate-600 uppercase tracking-widest font-bold">New Intake Form</h3>
        <form onSubmit={handleSubmit(onSave)}>
            <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">Name</label><input {...register("studentName")} className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                <div><label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">Unit</label><select {...register("unitName")} className="w-full p-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">{units.map(u=><option key={u.key}>{u.key}</option>)}</select></div>
                <div><label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">Grade</label><select {...register("gradeLevel")} className="w-full p-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"><option>9</option><option>10</option><option>11</option><option>12</option></select></div>
                <div><label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">Admit</label><input type="date" {...register("admitDate")} className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                <div><label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">Discharge</label><input type="date" {...register("dischargeDate")} className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                <div><label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">IEP</label><select {...register("iepStatus")} className="w-full p-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"><option>No</option><option>Yes</option></select></div>
                <div className="col-span-2"><label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">District</label><input {...register("district")} className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                <div className="flex items-end"><button type="submit" className="w-full p-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors">Save</button></div>
            </div>
        </form>
    </div>
  );
};

export default IntakeForm;