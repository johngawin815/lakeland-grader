import React from 'react';

const HonorRollCard = ({ students, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-30" onClick={onClose}></div>
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative animate-in fade-in slide-in-from-top-2">
        <button className="absolute top-2 right-2 text-slate-500 hover:text-slate-700" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4 text-indigo-700">Honor Roll - All As and/or Bs</h2>
        {students.length === 0 ? (
          <div className="text-slate-500 text-center">No students earned Honor Roll this quarter.</div>
        ) : (
          <ul className="space-y-2">
            {students.map((student, idx) => (
              <li key={idx} className="bg-indigo-50 rounded p-2 text-slate-800 font-medium">
                {student.name} <span className="text-xs text-slate-500">({student.status})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HonorRollCard;
