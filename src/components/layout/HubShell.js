import React, { useState } from 'react';
import { Search, LogOut, LayoutDashboard, GraduationCap, FileText, Map, X, ChevronRight, School, ClipboardList, Shield } from 'lucide-react';

// --- MODULE IMPORTS ---
import KTEAReporter from '../ktea/KTEAReporter';
import DischargeGenerator from '../discharge/DischargeGenerator';
import CurriculumMaps from '../curriculum/CurriculumMaps'; 
import StudentMasterDashboard from '../dashboard/StudentMasterDashboard'; 
import GradeReporter from '../grading/GradeReporter'; 
import AuditLog from './AuditLog';

const HubShell = () => {
  const [user, setUser] = useState(null); 
  const [currentView, setCurrentView] = useState("home"); 
  const [activeStudent, setActiveStudent] = useState(null); 

  const handleLogin = (e) => {
    e.preventDefault();
    setUser({ name: "Teacher Account", email: "teacher@lakeland.edu" });
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView("home");
    setActiveStudent(null);
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Define the module data in an array to simplify rendering
  const modules = [
    { id: 'dashboard', title: 'Dashboard', desc: 'Rosters & Profiles', icon: <LayoutDashboard size={28} className="text-indigo-500" /> },
    { id: 'grades', title: 'Grade Reporter', desc: 'Enter Grades', icon: <GraduationCap size={28} className="text-indigo-500" /> },
    { id: 'ktea', title: 'KTEA Reporter', desc: 'Assessments', icon: <ClipboardList size={28} className="text-indigo-500" /> },
    { id: 'discharge', title: 'Discharge Writer', desc: 'Exit Summaries', icon: <FileText size={28} className="text-indigo-500" /> },
    { id: 'curriculum', title: 'Curriculum', desc: 'Maps & Standards', icon: <Map size={28} className="text-indigo-500" /> },
    { id: 'audit', title: 'Audit Log', desc: 'Security & Compliance', icon: <Shield size={28} className="text-indigo-500" /> },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      
      {/* 1. TOP NAVIGATION BAR */}
      <header className="bg-slate-900 border-b border-slate-700/50 h-20 flex items-center justify-between px-6 z-20 shrink-0 shadow-2xl shadow-slate-900/40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
            <School size={32} className="text-indigo-500" />
            <span className="text-xl font-extrabold text-white tracking-tight">LRS Hub</span>
          </div>
          <nav className="flex gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
            {modules.map(m => (
              <NavButton 
                key={m.id}
                label={m.title} 
                active={currentView === m.id} 
                onClick={() => setCurrentView(m.id)} 
              />
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Set Student Context..." 
                className="w-full pl-11 pr-4 py-2.5 border border-slate-700 rounded-lg focus:ring-4 focus:ring-indigo-500/40 outline-none transition duration-300 bg-slate-800/80 focus:bg-slate-800 text-sm text-slate-100 placeholder:text-slate-500"
                value={activeStudent || ""}
                onChange={(e) => setActiveStudent(e.target.value)} 
              />
              {activeStudent && (
                 <button onClick={() => setActiveStudent("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                   <X size={16} />
                 </button>
              )}
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-700/50">
                <div className="w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-base border-2 border-slate-700/80">
                    {user.name.charAt(0)}
                </div>
                <div className="text-sm">
                    <div className="font-bold text-slate-200">{user.name}</div>
                    <button onClick={handleLogout} className="text-slate-400 hover:text-indigo-400 font-semibold transition-colors">Sign Out</button>
                </div>
            </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto">
        {currentView === 'home' && (
          <div className="flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
            <div className="text-center mb-10">
              <h1 className="text-5xl font-extrabold text-slate-900">Welcome, {user.name.split(" ")[0]}</h1>
              <p className="text-lg text-slate-500 mt-2">Select a tool to begin your work.</p>
              {activeStudent && (
                 <div className="inline-flex items-center gap-3 mt-4 bg-indigo-100 text-indigo-800 font-bold px-4 py-2 rounded-full text-sm border border-indigo-200/80">
                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></span>
                    Active Context: <strong>{activeStudent}</strong>
                 </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
              {modules.map(m => (
                 <LaunchCard 
                    key={m.id}
                    icon={m.icon} 
                    title={m.title} 
                    desc={m.desc}
                    onClick={() => setCurrentView(m.id)}
                 />
              ))}
            </div>
          </div>
        )}

        {currentView !== 'home' && (
            <div className="p-0">
                {currentView === 'dashboard' && <StudentMasterDashboard activeStudentName={activeStudent} setActiveStudent={setActiveStudent} setView={setCurrentView} />}
                {currentView === 'grades' && <GradeReporter activeStudent={activeStudent} />}
                {currentView === 'ktea' && <KTEAReporter user={user} activeStudent={activeStudent} />}
                {currentView === 'discharge' && <DischargeGenerator user={user} activeStudent={activeStudent} />}
                {currentView === 'curriculum' && <CurriculumMaps />}
                {currentView === 'audit' && <AuditLog />}
            </div>
        )}
      </main>
    </div>
  );
};

// --- HELPER COMPONENTS (Refactored with Tailwind CSS) ---

const NavButton = ({ label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors duration-200 ${
          active 
          ? 'bg-slate-700/80 text-white shadow-inner shadow-black/20' 
          : 'bg-transparent text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
        }`}
    >
        {label}
    </button>
);

const LaunchCard = ({ icon, title, desc, onClick }) => (
    <div 
        onClick={onClick}
        className="bg-white/60 backdrop-blur-lg shadow-lg shadow-slate-200/50 border border-slate-200/50 rounded-2xl p-6 group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-200/50 hover:border-indigo-300/50 hover:-translate-y-1.5"
    >
        <div className="flex items-start justify-between">
            <div className="p-3 bg-indigo-100/80 rounded-xl border border-white">
                {icon}
            </div>
            <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 transition-colors" />
        </div>
        <div className="mt-4">
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{desc}</p>
        </div>
    </div>
);

const LoginScreen = ({ onLogin }) => (
  <div className="w-full h-screen flex items-center justify-center bg-slate-900">
    <div className="bg-white/10 backdrop-blur-lg shadow-2xl shadow-black/20 border border-white/20 rounded-2xl p-8 w-full max-w-sm text-center">
      <School size={48} className="text-indigo-400 mx-auto mb-4" />
      <h1 className="text-2xl font-extrabold text-white">Lakeland Secure Hub</h1>
      <p className="text-slate-400 mt-2 mb-8">Authorized staff access only.</p>
      <button 
        onClick={onLogin} 
        className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-400/50 transition-all duration-300 ease-in-out"
      >
        Sign in with Microsoft
      </button>
    </div>
  </div>
);

export default HubShell;