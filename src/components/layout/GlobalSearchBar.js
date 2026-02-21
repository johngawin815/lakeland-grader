import React, { useState } from 'react';
import { Search, X, CheckCircle, Loader2 } from 'lucide-react';
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
      // Optional: navigate to dashboard on selection
      // navigate('/student-dashboard'); 
  };

  return (
    <div className="sticky top-0 z-50 shadow-sm">
      
      {/* Search Bar */}
      <div className="bg-white border-b border-slate-200 p-3 relative z-50">
        <form onSubmit={handleSearch} className="flex gap-3 max-w-4xl mx-auto relative">
          
          <button 
             type="button"
             onClick={() => navigate('/')} 
             className="font-extrabold text-slate-700 tracking-tight flex items-center px-3 hover:bg-slate-100 rounded-lg transition"
             title="Return to Dashboard"
          >
             LRS<span className="text-sky-600">Hub</span>
          </button>

          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search for a student..." 
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition bg-slate-50 focus:bg-white text-base"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setHasSearched(false); }}
            />
          </div>
          <button 
            type="submit" 
            disabled={isSearching}
            className="bg-sky-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-sky-700 transition text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 flex items-center gap-2"
          >
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin"/> : <Search className="w-5 h-5" />}
            {isSearching ? "Searching..." : "Find"}
          </button>
        </form>

        {/* Search Results Dropdown */}
        {(results.length > 0 || (hasSearched && !isSearching)) && (
          <div className="absolute top-full left-0 right-0 max-w-4xl mx-auto bg-white shadow-xl rounded-b-lg border border-slate-200 mt-0 overflow-hidden z-50">
            {results.map((student) => (
              <div 
                key={student.id}
                onClick={() => handleSelect(student)}
                className="p-4 hover:bg-sky-50 cursor-pointer border-b border-slate-100 last:border-0 flex justify-between items-center group transition"
              >
                <div>
                  <span className="font-bold text-slate-800 group-hover:text-sky-700">{student.studentName}</span>
                  <span className="text-sm text-slate-500 ml-3">Grade: {student.gradeLevel || "N/A"}</span>
                </div>
                <span className="text-sm bg-slate-100 text-slate-600 px-3 py-1 rounded-md group-hover:bg-sky-100 group-hover:text-sky-700 font-bold">Load</span>
              </div>
            ))}
            {hasSearched && results.length === 0 && (
              <div className="p-5 text-center text-slate-500 text-sm">No student found matching your search.</div>
            )}
          </div>
        )}
      </div>

      {/* Active Student Context Bar */}
      {activeStudent && (
        <div className="bg-sky-600 text-white px-4 py-2 flex justify-center items-center gap-4 text-sm shadow-inner relative z-40 transition-all duration-300">
           <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-teal-300" />
              <span className="opacity-80 uppercase text-xs font-bold tracking-wider">Active:</span>
              <span className="font-bold text-white">{activeStudent.studentName}</span>
           </div>
           
           <div className="hidden sm:flex items-center gap-4 text-sky-100 text-xs">
              <span>Admit: {activeStudent.admitDate || "N/A"}</span>
              <span>•</span>
              <span>Unit: {activeStudent.unitName || "N/A"}</span>
           </div>

           <button 
             onClick={clearStudent} 
             className="ml-2 hover:bg-sky-700 p-1.5 rounded-full text-sky-200 hover:text-white transition"
             title="Clear Active Student"
           >
             <X size={18} />
           </button>
        </div>
      )}
    </div>
  );
};

export default GlobalSearchBar;