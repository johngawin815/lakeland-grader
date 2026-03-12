import React from 'react';

// FloatingSubjectCard: Reusable card for subject display
export default function FloatingSubjectCard({ icon: Icon, label, colorClass, children, onClick, active }) {
  return (
    <div
      className={`bg-white p-4 rounded-xl text-center cursor-pointer transition-all duration-200 border-2 shadow-sm opacity-70 flex flex-col items-center justify-center gap-2 hover:-translate-y-1 hover:opacity-100 hover:shadow-lg ${active ? `!opacity-100 !bg-white border-current !shadow-xl -translate-y-1 ${colorClass}` : 'border-transparent text-slate-500'}`}
      onClick={onClick}
    >
      {Icon && <Icon className="w-6 h-6 mb-1" />}
      <span className="text-xs font-bold">{label}</span>
      <div className="w-full mt-2">{children}</div>
    </div>
  );
}
