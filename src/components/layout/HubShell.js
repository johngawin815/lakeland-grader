import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  LayoutDashboard, FileText, Map, ChevronRight, School,
  ClipboardList, Shield, FileSpreadsheet,
  ScrollText,
  FileCheck, NotebookPen, Upload, Settings, Loader2
} from 'lucide-react';
import { getAcademicQuarter, getCurrentSchoolYear } from '../../utils/smartUtils';
import { databaseService } from '../../services/databaseService';

// --- LAZY-LOADED MODULE IMPORTS ---
const KTEAReporter = lazy(() => import('../ktea/KTEAReporter'));
const DischargeNarrativeBuilder = lazy(() => import('../discharge/DischargeNarrativeBuilder'));
const CurriculumMaps = lazy(() => import('../curriculum/CurriculumMaps'));
const StudentMasterDashboard = lazy(() => import('../dashboard/StudentMasterDashboard'));
const GradeSpreadsheetModal = lazy(() => import('../grading/GradeSpreadsheetModal'));
const AuditLog = lazy(() => import('./AuditLog'));
const IEPGenerator = lazy(() => import('../iep/IEPGenerator'));
const TranscriptGenerator = lazy(() => import('../transcript/TranscriptGenerator'));
const WorkbookGenerator = lazy(() => import('../workbook/WorkbookGenerator'));
const TeacherSettings = lazy(() => import('../settings/TeacherSettings'));
const DocumentUploadPortal = lazy(() => import('../upload/DocumentUploadPortal'));

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
    id: 'grades', title: 'Grades', desc: 'Unified Gradebook',
    icon: FileSpreadsheet,
    color: {
      icon: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100',
      hoverShadow: 'hover:shadow-indigo-200/50', hoverBorder: 'hover:border-indigo-300/60',
      accent: 'from-indigo-500 to-indigo-600', chevronHover: 'group-hover:text-indigo-600',
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
  const [showUploadPortal, setShowUploadPortal] = useState(false);
  const [gradesStats, setGradesStats] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setUser({ name: "John Gawin", units: ["Harmony"], email: "john.gawin@lakeland.edu", role: "admin" });
  };

  // Load persisted teacher record after login
  useEffect(() => {
    if (!user) return;
    const teacherId = `teacher_${user.email.split('@')[0].replace(/\./g, '-')}`;
    (async () => {
      try {
        const saved = await databaseService.getTeacher(teacherId);
        if (saved && saved.units) {
          setUser(prev => ({ ...prev, units: saved.units }));
        } else {
          // First login: persist defaults
          await databaseService.upsertTeacher({
            id: teacherId,
            name: user.name,
            email: user.email,
            units: user.units || ['Harmony'],
            role: user.role || 'teacher',
          });
        }
      } catch (err) {
        console.warn('Failed to load teacher record:', err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // Load grades stats for the hub card widget from the spreadsheet JSON
  // (JSON is the source of truth; database may not have grade data)
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch('/templates/Q3_GradeSpreadsheet_2025-2026.json');
        if (!res.ok) throw new Error('JSON unavailable');
        const json = await res.json();

        let studentCount = 0;
        let missingCount = 0;
        Object.values(json).forEach(rows => {
          rows.forEach(row => {
            studentCount++;
            // A student is "missing" if every grade column is null/empty
            const hasAnyGrade = [row[3], row[6], row[9], row[12]].some(g => g != null && g !== '');
            if (!hasAnyGrade) missingCount++;
          });
        });

        const lastSaved = localStorage.getItem('gradebook_last_saved');
        setGradesStats({
          studentCount,
          missingGrades: missingCount,
          quarter: getAcademicQuarter(),
          lastSaved: lastSaved || null,
        });
      } catch {
        // non-fatal — card still works without stats
      }
    })();
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    setCurrentView("home");
  };

  const navigateTo = (moduleId) => {
    if (moduleId === 'grades') {
      setIsSpreadsheetModalOpen(true);
    } else {
      setDashboardInitialTab(null);
      setCurrentView(moduleId);
    }
  };

  if (!user) {
    if (showUploadPortal) {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <DocumentUploadPortal onBack={() => setShowUploadPortal(false)} />
        </Suspense>
      );
    }
    return <LoginScreen onLogin={handleLogin} onUploadPortal={() => setShowUploadPortal(true)} />;
  }

  const visibleModules = modules.filter(m => !m.adminOnly || user.role === 'admin');

  return (
    <div className="flex h-screen bg-slate-200 font-sans overflow-hidden">

      {/* 1. SIDEBAR NAVIGATION */}
      <aside className={`transition-all duration-300 bg-slate-900 flex flex-col items-center py-3 shrink-0 border-r border-slate-700/50 z-20 ${sidebarCollapsed ? 'w-16' : 'w-48'}`}>
        {/* Collapse/Expand Button */}
        <button
          className="mb-2 p-1 rounded hover:bg-slate-800 text-slate-400 self-end mr-2"
          onClick={() => setSidebarCollapsed(v => !v)}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronRight size={18} className="rotate-180" />}
        </button>

        {/* Logo / Home */}
        <button
          onClick={() => setCurrentView('home')}
          className={`w-full flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-200 ${
            currentView === 'home'
              ? 'bg-indigo-600/20 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <School size={24} className="text-indigo-500" />
          {!sidebarCollapsed && <span className="text-[11px] font-bold tracking-tight">Home</span>}
        </button>

        <div className="w-8 h-px bg-slate-700/50 my-1" />

        {/* Module nav buttons */}
        <nav className="flex-1 flex flex-col items-center gap-0.5 overflow-y-auto w-full px-2 scrollbar-none">
          {visibleModules.map(m => (
            <SidebarButton
              key={m.id}
              label={sidebarCollapsed ? '' : m.title}
              icon={m.icon}
              color={m.color}
              active={currentView === m.id}
              onClick={() => navigateTo(m.id)}
            />
          ))}
        </nav>

        <div className="w-8 h-px bg-slate-700/50 my-1" />

        {/* Settings */}
        <SidebarButton
          label={sidebarCollapsed ? '' : 'Settings'}
          icon={Settings}
          active={currentView === 'settings'}
          onClick={() => { setDashboardInitialTab(null); setCurrentView('settings'); }}
        />

        <div className="w-8 h-px bg-slate-700/50 my-1" />

        {/* User */}
        <div className="flex flex-col items-center gap-1 mb-2">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-sm border-2 border-slate-700/80">
            {user.name.charAt(0)}
          </div>
          {!sidebarCollapsed && <span className="text-[10px] font-medium text-slate-400 truncate w-full text-center px-1">{user.name.split(' ')[0]}</span>}
          {!sidebarCollapsed && (
            <button onClick={handleLogout} className="text-[10px] font-semibold text-slate-500 hover:text-indigo-400 transition-colors">
              Sign Out
            </button>
          )}
        </div>
      </aside>


      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-white/70 backdrop-blur-md shadow-sm">
          <div className="text-lg font-semibold text-indigo-700">
            {formatDate()}
          </div>
          <div className="px-4 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
            {getAcademicQuarter()} · {getCurrentSchoolYear()}
          </div>
        </div>

        {currentView === 'home' && (
          <div className="hub-mesh-bg h-full flex flex-col">
            <div className="max-w-6xl mx-auto px-4 py-2 flex-1 flex flex-col justify-start">

              {/* === HERO SECTION === */}
              <div className="text-center mb-6 animate-slide-up">
                <h1 className="text-4xl font-extrabold text-slate-900 mb-2">
                  {getGreeting()},{' '}
                  <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-transparent">
                    {user.name.split(' ')[0]}
                  </span>
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Manage your {user.units?.join(' & ')} unit roster, gradebooks, and student assessments.
                </p>
              </div>

              {/* === MODULE GRID === */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 flex-1" style={{minHeight:0}}>
                {visibleModules.map((m, index) => (
                  <LaunchCard
                    key={m.id}
                    icon={m.icon}
                    title={m.title}
                    desc={m.desc}
                    color={m.color}
                    delay={400 + (index * 80)}
                    onClick={() => navigateTo(m.id)}
                    stats={m.id === 'grades' ? gradesStats : null}
                  />
                ))}
              </div>

            </div>
          </div>
        )}

        {currentView !== 'home' && (
          <Suspense fallback={<LoadingFallback />}>
            <div className="h-full overflow-y-auto">
              {currentView === 'dashboard' && <StudentMasterDashboard setView={setCurrentView} user={user} initialTab={dashboardInitialTab} />}
              {currentView === 'ktea' && <KTEAReporter user={user} />}
              {currentView === 'discharge' && <DischargeNarrativeBuilder user={user} />}
              {currentView === 'curriculum' && <CurriculumMaps />}
              {currentView === 'iep' && <IEPGenerator user={user} />}
              {currentView === 'transcript' && <TranscriptGenerator user={user} />}
              {currentView === 'workbook' && <WorkbookGenerator user={user} />}
              {currentView === 'audit' && user.role === 'admin' && <AuditLog />}
              {currentView === 'settings' && <TeacherSettings user={user} onUpdateUser={setUser} />}
              {/* All grading entry points now redirect to unified Quarter Spreadsheet Preview */}
              {currentView === 'grades' && (
                <GradeSpreadsheetModal
                  isOpen={true}
                  onClose={() => setCurrentView('home')}
                />
              )}
            </div>
          </Suspense>
        )}
      </main>
      <Suspense fallback={null}>
        <GradeSpreadsheetModal
          isOpen={isSpreadsheetModalOpen}
          onClose={() => setIsSpreadsheetModalOpen(false)}
        />
      </Suspense>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full w-full">
    <Loader2 size={32} className="animate-spin text-indigo-500" />
  </div>
);

const SidebarButton = ({ label, icon: Icon, active, onClick, color }) => (
  <button
    onClick={onClick}
    title={label}
    className={`w-full flex flex-col items-center gap-1.5 py-4 rounded-xl transition-all duration-200
      ${active
        ? 'bg-white/10 ring-1 ring-white/10 text-white'
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
  >
    <Icon size={28} className={color?.icon || undefined} />
    <span className="text-[14px] font-semibold leading-tight text-center px-1">
      {label}
    </span>
  </button>
);

const LaunchCard = ({ icon: Icon, title, desc, color, onClick, delay, stats }) => (
  <div
    onClick={onClick}
    className={`animate-slide-up bg-slate-50/80 backdrop-blur-lg shadow-lg shadow-slate-200/50 border ${color.border} rounded-2xl p-4 group cursor-pointer transition-all duration-300 hover:shadow-2xl ${color.hoverShadow} ${color.hoverBorder} hover:-translate-y-2 relative overflow-hidden`}
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
      {stats ? (
        <div className="mt-1.5 space-y-1">
          <p className="text-xs font-medium text-slate-500">
            {stats.quarter} &middot; {stats.studentCount} student{stats.studentCount !== 1 ? 's' : ''}
          </p>
          {stats.missingGrades > 0 && (
            <p className="text-xs font-semibold text-amber-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              {stats.missingGrades} missing grade{stats.missingGrades !== 1 ? 's' : ''}
            </p>
          )}
          {stats.missingGrades === 0 && (
            <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              All grades entered
            </p>
          )}
          {stats.lastSaved && (
            <p className="text-xs text-slate-400">Last saved {stats.lastSaved}</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500 mt-1">{desc}</p>
      )}
    </div>
  </div>
);

const LoginScreen = ({ onLogin, onUploadPortal }) => (
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

      <div className="border-t border-white/10 mt-6 pt-5">
        <button
          onClick={onUploadPortal}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
        >
          <Upload size={14} />
          Upload Educational Records
        </button>
        <p className="text-[11px] text-slate-500 mt-1.5">For home school contacts with a passcode</p>
      </div>
    </div>
  </div>
);

export default HubShell;
