import React, { useState, useEffect } from 'react';
import { Shield, Clock, User, AlertTriangle, Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
// import { cosmosService } from '../../services/cosmosService'; // Uncomment when connecting to real backend

const MOCK_LOGS = [
  { id: 1, user: "Teacher Account", action: "VIEW_STUDENT", target: "John Doe", timestamp: "2024-02-20T08:30:00", details: "Accessed Student Profile" },
  { id: 2, user: "Teacher Account", action: "UPDATE_GRADE", target: "Jane Smith", timestamp: "2024-02-20T09:15:00", details: "Updated Math Grade to 85%" },
  { id: 3, user: "Admin User", action: "EXPORT_REPORT", target: "KTEA Data", timestamp: "2024-02-19T14:20:00", details: "Downloaded Master Spreadsheet" },
  { id: 4, user: "Teacher Account", action: "CREATE_DISCHARGE", target: "Michael Brown", timestamp: "2024-02-18T11:00:00", details: "Generated Discharge Narrative" },
  { id: 5, user: "System", action: "LOGIN_FAILURE", target: "Unknown", timestamp: "2024-02-18T10:05:00", details: "Invalid password attempt", type: "warning" },
  { id: 6, user: "Teacher Account", action: "VIEW_CURRICULUM", target: "Social Studies", timestamp: "2024-02-18T09:30:00", details: "Viewed Curriculum Map" },
];

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // Simulate API call
    const fetchLogs = async () => {
      setLoading(true);
      try {
        // const data = await cosmosService.getAuditLogs(); 
        // setLogs(data);
        setTimeout(() => {
            setLogs(MOCK_LOGS);
            setLoading(false);
        }, 800);
      } catch (error) {
        console.error("Failed to fetch logs", error);
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, startDate, endDate]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "ALL" || (filterType === "WARNING" && log.type === "warning");
    
    const logDate = new Date(log.timestamp);
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;
    const matchesDate = (!start || logDate >= start) && (!end || logDate <= end);

    return matchesSearch && matchesType && matchesDate;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("ALL");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 p-8 font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <span className="p-2 bg-indigo-100 rounded-xl text-indigo-600"><Shield className="w-7 h-7" /></span>
              System Audit Log
            </h2>
            <p className="text-slate-500 text-base mt-2">Track user activity and data access for compliance.</p>
        </div>
        <button className="bg-white border border-slate-300/80 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-100/80 flex items-center gap-2 shadow-lg shadow-slate-300/20 transition-colors">
            <Download className="w-4 h-4" /> Export Log
        </button>
      </div>

      {/* CONTROLS */}
      <div className="bg-white/70 backdrop-blur-xl p-4 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 mb-6 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
                type="text" 
                placeholder="Search user, action, or target..." 
                className="w-full pl-11 pr-4 py-3 border border-slate-300/80 rounded-xl text-base focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all bg-white/80"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        
        <div className="flex gap-2 items-center w-full lg:w-auto">
            <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-slate-300/80 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/20 w-full lg:w-auto transition-all bg-white/80"
            />
            <span className="text-slate-400 text-sm font-bold">to</span>
            <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-slate-300/80 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/20 w-full lg:w-auto transition-all bg-white/80"
            />
        </div>

        <div className="flex gap-1 w-full lg:w-auto bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
            <button 
                onClick={() => setFilterType("ALL")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filterType === "ALL" ? "bg-white text-indigo-700 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-white/50"}`}
            >
                All Events
            </button>
            <button 
                onClick={() => setFilterType("WARNING")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${filterType === "WARNING" ? "bg-white text-amber-700 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-white/50"}`}
            >
                <AlertTriangle className="w-4 h-4" /> Warnings
            </button>
        </div>
        {(searchTerm || filterType !== "ALL" || startDate || endDate) && (
            <button 
                onClick={clearFilters}
                className="px-4 py-3 rounded-xl text-sm font-bold transition-colors bg-white border border-slate-300/80 text-red-600 hover:bg-red-50"
            >
                Clear
            </button>
        )}
      </div>

      {/* TABLE */}
      <div className="flex-1 bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-200/60 border border-slate-200/50 overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100/80 backdrop-blur-sm sticky top-0 z-10">
                    <tr>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">Timestamp</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">User</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">Action</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">Details</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50">
                    {loading ? (
                        <tr><td colSpan="4" className="p-8 text-center text-slate-400">Loading audit records...</td></tr>
                    ) : filteredLogs.length === 0 ? (
                        <tr><td colSpan="4" className="p-8 text-center text-slate-400">No matching records found.</td></tr>
                    ) : (
                        currentLogs.map((log) => (
                            <tr key={log.id} className={`hover:bg-slate-100/50 transition-colors duration-200 ${log.type === 'warning' ? 'bg-amber-50/30' : ''}`}>
                                <td className="p-4 text-sm text-slate-600 whitespace-nowrap flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="p-4 text-sm font-bold text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600 shadow-inner">
                                            <User className="w-4 h-4" />
                                        </div>
                                        {log.user}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                                        log.type === 'warning' 
                                        ? 'bg-red-100 text-red-800 border-red-200/80' 
                                        : 'bg-indigo-100 text-indigo-800 border-indigo-200/80'
                                    }`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-slate-600">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{log.details}</span>
                                        <span className="text-xs text-slate-400">Target: {log.target}</span>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
        
        {/* PAGINATION */}
        {!loading && filteredLogs.length > 0 && (
            <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex justify-between items-center">
                <span className="text-sm text-slate-500 font-medium">
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredLogs.length)} of {filteredLogs.length}
                </span>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2.5 rounded-lg border border-slate-300/80 bg-white text-slate-600 hover:bg-slate-100/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-300/80 rounded-lg flex items-center shadow-sm">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2.5 rounded-lg border border-slate-300/80 bg-white text-slate-600 hover:bg-slate-100/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;