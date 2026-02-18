import React, { useState } from 'react';
import { Search, UserCheck, X, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { findStudentByName } from '../pages/studentService'; 
import { useStudent } from '../../context/StudentContext';

const GlobalSearchBar = () => {
  const { activeStudent, selectStudent, clearStudent } = useStudent();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    setResults([]); 

    try {
      const data = await findStudentByName(query); 
      const list = Array.isArray(data) ? data : (data ? [data] : []);
      setResults(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (student) => {
      selectStudent(student);
      setResults([]);
      setQuery("");
      setHasSearched(false);
      // We do NOT force navigation here, so you can stay on your current task
      // but if you want to go to dashboard immediately, uncomment line below:
      // navigate('/student-dashboard'); 
  };

  return (
    <div className="sticky top-0 z-50 shadow-md">
      
      {/* 1. TOP ROW: ALWAYS VISIBLE SEARCH BAR */}
      <div className="bg-white border-b border-gray-200 p-3 relative z-50">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-4xl mx-auto relative">
          
          {/* Logo / Home Button */}
          <button 
             type="button"
             onClick={() => navigate('/')} 
             className="font-extrabold text-slate-700 tracking-tight flex items-center px-2 hover:bg-slate-50 rounded-lg transition"
          >
             LRS<span className="text-blue-600">Hub</span>
          </button>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search student..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-slate-50 focus:bg-white text-sm"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setHasSearched(false); }}
            />
          </div>
          <button 
            type="submit" 
            disabled={isSearching}
            className="bg-slate-800 text-white px-5 py-2 rounded-lg font-bold hover:bg-slate-700 transition text-sm disabled:opacity-50"
          >
            {isSearching ? "..." : "Find"}
          </button>
        </form>

        {/* SEARCH RESULTS DROPDOWN */}
        {(results.length > 0 || (hasSearched && !isSearching)) && (
          <div className="absolute top-full left-0 right-0 max-w-4xl mx-auto bg-white shadow-2xl rounded-b-xl border border-gray-200 mt-0 overflow-hidden z-50">
            {results.map((student) => (
              <div 
                key={student.id}
                onClick={() => handleSelect(student)}
                className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 flex justify-between items-center group transition"
              >
                <div>
                  <span className="font-bold text-slate-700 group-hover:text-blue-700">{student.studentName}</span>
                  <span className="text-xs text-gray-400 ml-2">Grade: {student.gradeLevel || "?"}</span>
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded group-hover:bg-blue-100 group-hover:text-blue-700">Load</span>
              </div>
            ))}
            {hasSearched && results.length === 0 && (
              <div className="p-4 text-center text-slate-500 text-sm">No student found.</div>
            )}
          </div>
        )}
      </div>

      {/* 2. BOTTOM ROW: ACTIVE STUDENT CONTEXT (If Selected) */}
      {activeStudent && (
        <div className="bg-blue-600 text-white px-4 py-2 flex justify-center items-center gap-4 text-sm shadow-inner relative z-40 transition-all duration-300">
           <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-300" />
              <span className="opacity-80 uppercase text-xs font-bold tracking-wider">Active:</span>
              <span className="font-bold text-white">{activeStudent.studentName}</span>
           </div>
           
           <div className="hidden sm:flex items-center gap-4 text-blue-100 text-xs">
              <span>Admit: {activeStudent.admitDate || "N/A"}</span>
              <span>•</span>
              <span>Unit: {activeStudent.unitName || "N/A"}</span>
           </div>

           <button 
             onClick={clearStudent} 
             className="ml-2 hover:bg-blue-700 p-1 rounded-full text-blue-200 hover:text-white transition"
             title="Clear Active Student"
           >
             <X size={16} />
           </button>
        </div>
      )}

    </div>
  );
};

export default GlobalSearchBar;