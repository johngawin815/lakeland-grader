import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { useStudent } from '../context/StudentContext';
import { getStudentInitials } from '../utils/studentUtils';

/**
 * A reusable component that enforces student privacy by only displaying initials,
 * but allows teachers to edit the full name which syncs globally.
 * 
 * @param {Object} props
 * @param {string} props.studentId - The unique ID of the student
 * @param {string} props.studentName - The current full name of the student
 * @param {string} [props.className] - Optional extra CSS classes for the container
 * @param {string} [props.size] - size of the circle: 'sm', 'md', 'lg' (default 'md')
 */
const EditableStudentName = ({ studentId, studentName, colorClass, className = '', size = 'md' }) => {
  const { updateStudentName } = useStudent();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(studentName || '');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);

  const initials = getStudentInitials(studentName);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = (e) => {
    e.stopPropagation();
    setEditValue(studentName || '');
    setIsEditing(true);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!editValue.trim() || editValue === studentName) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await updateStudentName(studentId, editValue.trim());
      setIsEditing(false);
    } catch (err) {
      alert("Failed to update name. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
  };

  if (isEditing) {
    return (
      <div 
        className={`flex items-center gap-2 bg-white border border-indigo-200 rounded-xl p-1 shadow-sm ring-4 ring-indigo-500/10 ${className}`}
        onClick={e => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave(e);
            if (e.key === 'Escape') handleCancel(e);
          }}
          className="px-2 py-1 text-xs font-bold text-slate-800 outline-none w-32 bg-transparent"
          placeholder="Full Name..."
          disabled={isSaving}
        />
        <div className="flex gap-1">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="p-1 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
            title="Save Name"
          >
            <Check size={14} />
          </button>
          <button 
            onClick={handleCancel}
            disabled={isSaving}
            className="p-1 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            title="Cancel"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`group/initials relative inline-flex items-center gap-3 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-black text-white ${colorClass || 'bg-slate-400'} border-2 border-white shadow-sm transition-all ${!colorClass ? 'group-hover/initials:bg-indigo-500 group-hover/initials:shadow-indigo-200' : 'group-hover/initials:brightness-110 group-hover/initials:shadow-md'} group-hover/initials:scale-105`}
        title={`Student: ${initials}`}
      >
        {initials || '?'}
      </div>
      
      <button 
        onClick={handleStartEdit}
        className="opacity-0 group-hover/initials:opacity-100 p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"
        title="Edit Full Name"
      >
        <Edit2 size={12} />
      </button>
    </div>
  );
};

export default EditableStudentName;
