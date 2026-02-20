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
            <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                <Shield className="w-6 h-6 text-indigo-600" /> System Audit Log
            </h2>
            <p className="text-slate-500 text-sm mt-1">Track user activity and data access for compliance.</p>
        </div>
        <button className="bg-white border border-gray-300 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-colors">
            <Download className="w-4 h-4" /> Export Log
        </button>
      </div>

      {/* CONTROLS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input 
                type="text" 
                placeholder="Search user, action, or target..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        
        <div className="flex gap-2 items-center w-full lg:w-auto">
            <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 w-full lg:w-auto"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 w-full lg:w-auto"
            />
        </div>

        <div className="flex gap-2 w-full lg:w-auto">
            <button 
                onClick={() => setFilterType("ALL")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${filterType === "ALL" ? "bg-slate-800 text-white" : "bg-gray-100 text-slate-600 hover:bg-gray-200"}`}
            >
                All Events
            </button>
            <button 
                onClick={() => setFilterType("WARNING")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${filterType === "WARNING" ? "bg-amber-500 text-white" : "bg-gray-100 text-slate-600 hover:bg-gray-200"}`}
            >
                <AlertTriangle className="w-3 h-3" /> Warnings
            </button>
            {(searchTerm || filterType !== "ALL" || startDate || endDate) && (
                <button 
                    onClick={clearFilters}
                    className="px-4 py-2 rounded-lg text-xs font-bold transition-colors bg-white border border-gray-300 text-slate-600 hover:bg-gray-50 hover:text-red-600"
                >
                    Clear Filters
                </button>
            )}
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Timestamp</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">User</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Action</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Details</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {loading ? (
                        <tr><td colSpan="4" className="p-8 text-center text-gray-400">Loading audit records...</td></tr>
                    ) : filteredLogs.length === 0 ? (
                        <tr><td colSpan="4" className="p-8 text-center text-gray-400">No matching records found.</td></tr>
                    ) : (
                        currentLogs.map((log) => (
                            <tr key={log.id} className={`hover:bg-gray-50 transition-colors ${log.type === 'warning' ? 'bg-amber-50/30' : ''}`}>
                                <td className="p-4 text-sm text-slate-600 whitespace-nowrap flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="p-4 text-sm font-bold text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600">
                                            <User className="w-3 h-3" />
                                        </div>
                                        {log.user}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                        log.type === 'warning' 
                                        ? 'bg-red-100 text-red-700 border-red-200' 
                                        : 'bg-blue-50 text-blue-700 border-blue-100'
                                    }`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-slate-600">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{log.details}</span>
                                        <span className="text-xs text-gray-400">Target: {log.target}</span>
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
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredLogs.length)} of {filteredLogs.length}
                </span>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 bg-white text-slate-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-gray-300 rounded-lg flex items-center">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-300 bg-white text-slate-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;