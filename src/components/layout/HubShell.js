import React, { useState } from 'react';
import {
  LayoutDashboard, FileText, Map, ChevronRight, School,
  ClipboardList, Shield, BookOpen, FileSpreadsheet, GraduationCap,
  Calendar, Sparkles, ArrowRight, UserPlus, ScrollText,
  Database, Loader2, CheckCircle2, FileCheck, NotebookPen
} from 'lucide-react';
import { seedDemoData } from '../../data/seedDatabase';

// --- MODULE IMPORTS ---
import KTEAReporter from '../ktea/KTEAReporter';
import DischargeNarrativeBuilder from '../discharge/DischargeNarrativeBuilder';
import CurriculumMaps from '../curriculum/CurriculumMaps';
import StudentMasterDashboard from '../dashboard/StudentMasterDashboard';
import GradeGenerator from '../grading/GradeGenerator';
import GradeSpreadsheetModal from '../grading/GradeSpreadsheetModal';
import AuditLog from './AuditLog';
import IEPGenerator from '../iep/IEPGenerator';
import TranscriptGenerator from '../transcript/TranscriptGenerator';
import WorkbookGenerator from '../workbook/WorkbookGenerator';

import { getAcademicQuarter, getCurrentSchoolYear } from '../../utils/smartUtils';

// --- HELPER FUNCTIONS ---

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const formatDate = () => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};


// --- COLOR-CODED MODULE DEFINITIONS ---

const modules = [
  {
    id: 'dashboard', title: 'Dashboard', desc: 'Rosters & Profiles',
    icon: LayoutDashboard,
    color: {
      icon: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100',
      hoverShadow: 'hover:shadow-blue-200/50', hoverBorder: 'hover:border-blue-300/60',
      accent: 'from-blue-500 to-blue-600', chevronHover: 'group-hover:text-blue-600',
    }
  },
  {
    id: 'gradebook', title: 'Class Gradebook', desc: 'Assignments & Attendance',
    icon: BookOpen,
    color: {
      icon: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100',
      hoverShadow: 'hover:shadow-emerald-200/50', hoverBorder: 'hover:border-emerald-300/60',
      accent: 'from-emerald-500 to-emerald-600', chevronHover: 'group-hover:text-emerald-600',
    }
  },
  {
    id: 'gradecards', title: 'Grade Cards', desc: 'Generate & Export',
    icon: GraduationCap,
    color: {
      icon: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100',
      hoverShadow: 'hover:shadow-violet-200/50', hoverBorder: 'hover:border-violet-300/60',
      accent: 'from-violet-500 to-violet-600', chevronHover: 'group-hover:text-violet-600',
    }
  },
  {
    id: 'ktea', title: 'KTEA Reporter', desc: 'Assessments',
    icon: ClipboardList,
    color: {
      icon: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100',
      hoverShadow: 'hover:shadow-amber-200/50', hoverBorder: 'hover:border-amber-300/60',
      accent: 'from-amber-500 to-amber-600', chevronHover: 'group-hover:text-amber-600',
    }
  },
  {
    id: 'discharge', title: 'Discharge Writer', desc: 'Exit Summaries',
    icon: FileText,
    color: {
      icon: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100',
      hoverShadow: 'hover:shadow-rose-200/50', hoverBorder: 'hover:border-rose-300/60',
      accent: 'from-rose-500 to-rose-600', chevronHover: 'group-hover:text-rose-600',
    }
  },
  {
    id: 'curriculum', title: 'Curriculum', desc: 'Maps & Standards',
    icon: Map,
    color: {
      icon: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100',
      hoverShadow: 'hover:shadow-teal-200/50', hoverBorder: 'hover:border-teal-300/60',
      accent: 'from-teal-500 to-teal-600', chevronHover: 'group-hover:text-teal-600',
    }
  },
  {
    id: 'iep', title: 'IEP Generator', desc: 'Smart IEP Builder',
    icon: FileCheck,
    color: {
      icon: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100',
      hoverShadow: 'hover:shadow-cyan-200/50', hoverBorder: 'hover:border-cyan-300/60',
      accent: 'from-cyan-500 to-cyan-600', chevronHover: 'group-hover:text-cyan-600',
    }
  },
  {
    id: 'transcript', title: 'Transcripts', desc: 'Graduation Plans',
    icon: ScrollText,
    color: {
      icon: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100',
      hoverShadow: 'hover:shadow-orange-200/50', hoverBorder: 'hover:border-orange-300/60',
      accent: 'from-orange-500 to-orange-600', chevronHover: 'group-hover:text-orange-600',
    }
  },
  {
    id: 'workbook', title: 'Unit Generator', desc: 'AI Workbooks',
    icon: NotebookPen,
    color: {
      icon: 'text-lime-600', bg: 'bg-lime-50', border: 'border-lime-100',
      hoverShadow: 'hover:shadow-lime-200/50', hoverBorder: 'hover:border-lime-300/60',
      accent: 'from-lime-500 to-lime-600', chevronHover: 'group-hover:text-lime-600',
    }
  },
  {
    id: 'audit', title: 'Audit Log', desc: 'Security & Compliance',
    icon: Shield, adminOnly: true,
    color: {
      icon: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200',
      hoverShadow: 'hover:shadow-slate-200/50', hoverBorder: 'hover:border-slate-300/60',
      accent: 'from-slate-500 to-slate-600', chevronHover: 'group-hover:text-slate-600',
    }
  },
];

// --- MAIN COMPONENT ---

const HubShell = () => {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState("home");
  const [isSpreadsheetModalOpen, setIsSpreadsheetModalOpen] = useState(false);
  const [dashboardInitialTab, setDashboardInitialTab] = useState(null);

  // --- SEED DEMO DATA ---
  const [seedStatus, setSeedStatus] = useState('idle'); // idle | seeding | done | error
  const [seedMessage, setSeedMessage] = useState('');

  const handleSeedDemoData = async () => {
    if (seedStatus === 'seeding') return;
    if (!window.confirm('Seed the database with 39 fictional character residents, 5 courses, gradebook data, and KTEA reports?\n\nExisting mock data will be updated (not duplicated).')) return;

    setSeedStatus('seeding');
    setSeedMessage('Starting...');

    const result = await seedDemoData((msg) => setSeedMessage(msg));

    if (result.success) {
      setSeedStatus('done');
      setSeedMessage(`Seeded ${result.stats.students} students, ${result.stats.courses} courses, ${result.stats.enrollments} enrollments, ${result.stats.gradebooks} gradebooks, ${result.stats.ktea} KTEA reports`);
      setTimeout(() => setSeedStatus('idle'), 5000);
    } else {
      setSeedStatus('error');
      setSeedMessage(`Failed: ${result.error}`);
      setTimeout(() => setSeedStatus('idle'), 5000);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setUser({ name: "John Gawin", unit: "Harmony", email: "john.gawin@lakeland.edu", role: "admin" });
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView("home");
  };

  const navigateTo = (moduleId) => {
    if (moduleId === 'gradebook') {
      setDashboardInitialTab('classes');
      setCurrentView('dashboard');
    } else {
      setDashboardInitialTab(null);
      setCurrentView(moduleId);
    }
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const visibleModules = modules.filter(m => !m.adminOnly || user.role === 'admin');

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">

      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-[140px] bg-slate-900 flex flex-col items-center py-4 shrink-0 border-r border-slate-700/50 z-20">
        {/* Logo / Home */}
        <button
          onClick={() => setCurrentView('home')}
          className={`w-14 flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-200 ${
            currentView === 'home'
              ? 'bg-indigo-600/20 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <School size={26} className="text-indigo-500" />
          <span className="text-[10px] font-bold tracking-tight">Home</span>
        </button>

        <div className="w-8 h-px bg-slate-700/50 my-2" />

        {/* Module nav buttons */}
        <nav className="flex-1 flex flex-col items-center gap-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full px-2">
          {visibleModules.map(m => (
            <SidebarButton
              key={m.id}
              label={m.title}
              icon={m.icon}
              color={m.color}
              active={currentView === m.id}
              onClick={() => navigateTo(m.id)}
            />
          ))}
        </nav>

        <div className="w-8 h-px bg-slate-700/50 my-2" />

        {/* Exports */}
        <SidebarButton
          label="Exports"
          icon={FileSpreadsheet}
          active={false}
          onClick={() => setIsSpreadsheetModalOpen(true)}
        />

        <div className="w-8 h-px bg-slate-700/50 my-2" />

        {/* User */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-sm border-2 border-slate-700/80">
            {user.name.charAt(0)}
          </div>
          <span className="text-[10px] font-medium text-slate-400 truncate w-full text-center px-1">{user.name.split(' ')[0]}</span>
          <button onClick={handleLogout} className="text-[10px] font-semibold text-slate-500 hover:text-indigo-400 transition-colors">
            Sign Out
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {currentView === 'home' && (
          <div className="hub-mesh-bg h-full flex flex-col">
            <div className="max-w-6xl mx-auto px-4 py-2 flex-1 flex flex-col justify-start">

              {/* === HERO SECTION === */}
              <div className="text-center mb-6 animate-slide-up">
                <div className="inline-flex items-center gap-2 mb-4 text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5">
                  <Calendar size={14} />
                  {formatDate()}
                  <span className="w-1 h-1 bg-indigo-300 rounded-full" />
                  <span>{getAcademicQuarter()} &middot; {getCurrentSchoolYear()}</span>
                </div>

                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {getGreeting()},{' '}
                  <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-transparent">
                    {user.name.split(' ')[0]}
                  </span>
                </h1>
                <p className="text-lg text-slate-500 mt-3 max-w-lg mx-auto">
                  Manage your {user.unit} unit roster, gradebooks, and student assessments.
                </p>
              </div>



              {/* === QUICK ACTIONS === */}
              <div className="animate-slide-up mb-2" style={{ animationDelay: '900ms' }}>
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles size={16} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Quick Actions
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <QuickAction icon={UserPlus} label="New Student Intake" delay={950}
                    onClick={() => navigateTo('dashboard')} />
                  <QuickAction icon={GraduationCap} label="Generate Grade Card" delay={1000}
                    onClick={() => navigateTo('gradecards')} />
                  <QuickAction icon={ClipboardList} label="Run KTEA Assessment" delay={1050}
                    onClick={() => navigateTo('ktea')} />
                  <QuickAction icon={FileCheck} label="Build IEP" delay={1100}
                    onClick={() => navigateTo('iep')} />
                  <SeedButton status={seedStatus} message={seedMessage} onClick={handleSeedDemoData} />
                </div>
              </div>

              {/* === MODULE GRID === */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 flex-1" style={{minHeight:0}}>
                {visibleModules.map((m, index) => (
                  <LaunchCard
                    key={m.id}
                    icon={m.icon}
                    title={m.title}
                    desc={m.desc}
                    color={m.color}
                    delay={400 + (index * 80)}
                    onClick={() => navigateTo(m.id)}
                  />
                ))}
              </div>

            </div>
          </div>
        )}

        {currentView !== 'home' && (
          <div className="h-full">
            {currentView === 'dashboard' && <StudentMasterDashboard setView={setCurrentView} user={user} initialTab={dashboardInitialTab} />}
            {currentView === 'gradecards' && <GradeGenerator user={user} />}
            {currentView === 'ktea' && <KTEAReporter user={user} />}
            {currentView === 'discharge' && <DischargeNarrativeBuilder user={user} />}
            {currentView === 'curriculum' && <CurriculumMaps />}
            {currentView === 'iep' && <IEPGenerator user={user} />}
            {currentView === 'transcript' && <TranscriptGenerator user={user} />}
            {currentView === 'workbook' && <WorkbookGenerator user={user} />}
            {currentView === 'audit' && user.role === 'admin' && <AuditLog />}
          </div>
        )}
      </main>
      <GradeSpreadsheetModal
        isOpen={isSpreadsheetModalOpen}
        onClose={() => setIsSpreadsheetModalOpen(false)}
      />
    </div>
  );
};

// --- HELPER COMPONENTS ---

const SidebarButton = ({ label, icon: Icon, active, onClick, color }) => (
  <button
    onClick={onClick}
    title={label}
    className={`w-full flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all duration-200
      ${active
        ? `${color?.bg || 'bg-indigo-600/20'} ring-1 ring-white/10 text-white`
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
  >
    <Icon size={26} className={color?.icon || undefined} />
    <span className="text-[11px] font-semibold leading-tight text-center px-1">
      {label}
    </span>
  </button>
);

const LaunchCard = ({ icon: Icon, title, desc, color, onClick, delay }) => (
  <div
    onClick={onClick}
    className={`animate-slide-up bg-white/60 backdrop-blur-lg shadow-lg shadow-slate-200/50 border ${color.border} rounded-2xl p-4 group cursor-pointer transition-all duration-300 hover:shadow-2xl ${color.hoverShadow} ${color.hoverBorder} hover:-translate-y-2 relative overflow-hidden`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

    <div className="flex items-start justify-between">
      <div className={`p-3 ${color.bg} rounded-xl border border-white/80`}>
        <Icon size={28} className={color.icon} />
      </div>
      <ChevronRight className={`w-6 h-6 text-slate-300 ${color.chevronHover} group-hover:translate-x-1 transition-all duration-300`} />
    </div>
    <div className="mt-2">
      <h3 className="text-lg font-bold text-slate-800 group-hover:text-slate-900 transition-colors">{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{desc}</p>
    </div>
  </div>
);

const QuickAction = ({ icon: Icon, label, onClick, delay }) => (
  <button
    onClick={onClick}
    className="animate-slide-up inline-flex items-center gap-2.5 px-5 py-2.5 bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-full text-sm font-semibold text-slate-600 hover:text-indigo-700 hover:border-indigo-200 hover:bg-indigo-50/80 hover:shadow-md shadow-sm transition-all duration-300 group"
    style={{ animationDelay: `${delay}ms` }}
  >
    <Icon size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
    {label}
    <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all duration-300" />
  </button>
);

const SeedButton = ({ status, message, onClick }) => {
  if (status === 'seeding') {
    return (
      <div className="animate-slide-up inline-flex items-center gap-2.5 px-5 py-2.5 bg-amber-50/80 border border-amber-200/60 rounded-full text-sm font-semibold text-amber-700 shadow-sm" style={{ animationDelay: '1100ms' }}>
        <Loader2 size={16} className="animate-spin" />
        {message}
      </div>
    );
  }
  if (status === 'done') {
    return (
      <div className="animate-slide-up inline-flex items-center gap-2.5 px-5 py-2.5 bg-emerald-50/80 border border-emerald-200/60 rounded-full text-sm font-semibold text-emerald-700 shadow-sm" style={{ animationDelay: '1100ms' }}>
        <CheckCircle2 size={16} />
        {message}
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="animate-slide-up inline-flex items-center gap-2.5 px-5 py-2.5 bg-red-50/80 border border-red-200/60 rounded-full text-sm font-semibold text-red-700 shadow-sm" style={{ animationDelay: '1100ms' }}>
        {message}
      </div>
    );
  }
  return (
    <button
      onClick={onClick}
      className="animate-slide-up inline-flex items-center gap-2.5 px-5 py-2.5 bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-full text-sm font-semibold text-slate-600 hover:text-violet-700 hover:border-violet-200 hover:bg-violet-50/80 hover:shadow-md shadow-sm transition-all duration-300 group"
      style={{ animationDelay: '1100ms' }}
    >
      <Database size={16} className="text-slate-400 group-hover:text-violet-500 transition-colors" />
      Seed Demo Data
      <ArrowRight size={14} className="text-slate-300 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all duration-300" />
    </button>
  );
};

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
