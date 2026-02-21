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
    { id: 'dashboard', title: 'Dashboard', desc: 'Rosters & Profiles', icon: <LayoutDashboard size={28} className="text-sky-600" /> },
    { id: 'grades', title: 'Grade Reporter', desc: 'Enter Grades', icon: <GraduationCap size={28} className="text-sky-600" /> },
    { id: 'ktea', title: 'KTEA Reporter', desc: 'Assessments', icon: <ClipboardList size={28} className="text-sky-600" /> },
    { id: 'discharge', title: 'Discharge Writer', desc: 'Exit Summaries', icon: <FileText size={28} className="text-sky-600" /> },
    { id: 'curriculum', title: 'Curriculum', desc: 'Maps & Standards', icon: <Map size={28} className="text-sky-600" /> },
    { id: 'audit', title: 'Audit Log', desc: 'Security & Compliance', icon: <Shield size={28} className="text-sky-600" /> },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans">
      
      {/* 1. TOP NAVIGATION BAR */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/80 h-20 flex items-center justify-between px-6 z-20 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
            <School size={32} className="text-sky-600" />
            <span className="text-xl font-extrabold text-slate-800 tracking-tight">LRS Hub</span>
          </div>
          <nav className="flex gap-2">
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Set Student Context..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition bg-slate-100 focus:bg-white text-sm"
                value={activeStudent || ""}
                onChange={(e) => setActiveStudent(e.target.value)} 
              />
              {activeStudent && (
                 <button onClick={() => setActiveStudent("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                   <X size={16} />
                 </button>
              )}
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center font-bold text-white text-sm">
                    {user.name.charAt(0)}
                </div>
                <div className="text-sm">
                    <div className="font-bold text-slate-800">{user.name}</div>
                    <button onClick={handleLogout} className="text-slate-500 hover:text-sky-600 font-semibold transition-colors">Sign Out</button>
                </div>
            </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto">
        {currentView === 'home' && (
          <div className="flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-extrabold text-slate-900">Welcome, {user.name.split(" ")[0]}</h1>
              <p className="text-lg text-slate-500 mt-2">Select a tool to begin your work.</p>
              {activeStudent && (
                 <div className="inline-flex items-center gap-2 mt-4 bg-teal-100 text-teal-700 font-bold px-4 py-2 rounded-full text-sm border border-teal-200">
                    <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                    Active Context: <strong>{activeStudent}</strong>
                 </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
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
            <div className="p-4 sm:p-6">
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
        className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-150 ${
          active 
          ? 'bg-sky-100 text-sky-700' 
          : 'bg-transparent text-slate-600 hover:bg-slate-100'
        }`}
    >
        {label}
    </button>
);

const LaunchCard = ({ icon, title, desc, onClick }) => (
    <div 
        onClick={onClick}
        className="bg-white/60 backdrop-blur-sm shadow-sm border border-slate-200 rounded-lg p-6 group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-sky-300 hover:-translate-y-1"
    >
        <div className="flex items-start justify-between">
            {icon}
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-600 transition-colors" />
        </div>
        <div className="mt-4">
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{desc}</p>
        </div>
    </div>
);

const LoginScreen = ({ onLogin }) => (
  <div className="w-full h-screen flex items-center justify-center bg-slate-100">
    <div className="bg-white/60 backdrop-blur-sm shadow-sm border border-slate-200 rounded-lg p-8 w-full max-w-sm text-center">
      <School size={48} className="text-sky-600 mx-auto mb-4" />
      <h1 className="text-2xl font-extrabold text-slate-800">Lakeland Secure Hub</h1>
      <p className="text-slate-500 mt-2 mb-8">Authorized staff access only.</p>
      <button 
        onClick={onLogin} 
        className="w-full bg-sky-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors duration-200 ease-in-out"
      >
        Sign in with Microsoft
      </button>
    </div>
  </div>
);

export default HubShell;