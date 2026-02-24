import React, { useState, useEffect } from 'react';
import {
  Search, LayoutDashboard, FileText, Map, X, ChevronRight, School,
  ClipboardList, Shield, BookOpen, FileSpreadsheet, GraduationCap,
  Users, Calendar, FileBarChart, Sparkles, ArrowRight, TrendingUp, UserPlus,
  Database, Loader2, CheckCircle2
} from 'lucide-react';
import { seedDemoData } from '../../data/seedDatabase';

// --- MODULE IMPORTS ---
import KTEAReporter from '../ktea/KTEAReporter';
import DischargeGenerator from '../discharge/DischargeGenerator';
import CurriculumMaps from '../curriculum/CurriculumMaps';
import StudentMasterDashboard from '../dashboard/StudentMasterDashboard';
import GradeGenerator from '../grading/GradeGenerator';
import GradeSpreadsheetModal from '../grading/GradeSpreadsheetModal';
import AuditLog from './AuditLog';
import { databaseService } from '../../services/databaseService';
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

// --- COUNT-UP HOOK ---

const useCountUp = (target, duration = 1200) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === null || target === undefined) return;
    if (target === 0) { setCount(0); return; }

    let startTime = null;
    let raf;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return count;
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
    id: 'audit', title: 'Audit Log', desc: 'Security & Compliance',
    icon: Shield,
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
  const [activeStudent, setActiveStudent] = useState(null);
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
      setStatsLoaded(false); // refresh home stats
      setTimeout(() => setSeedStatus('idle'), 5000);
    } else {
      setSeedStatus('error');
      setSeedMessage(`Failed: ${result.error}`);
      setTimeout(() => setSeedStatus('idle'), 5000);
    }
  };

  // --- LIVE STATS ---
  const [hubStats, setHubStats] = useState({
    students: null, courses: null, enrollments: null, reports: null,
  });
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    if (currentView !== 'home' || statsLoaded || !user) return;

    let cancelled = false;
    const fetchStats = async () => {
      try {
        const [students, courses, reports] = await Promise.all([
          databaseService.getAllStudents(),
          databaseService.getCoursesByTeacher(user.name),
          databaseService.getAllKteaReports(),
        ]);

        let totalEnrollments = 0;
        if (courses.length > 0) {
          const enrollmentResults = await Promise.all(
            courses.map(c => databaseService.getEnrollmentsByCourse(c.id))
          );
          totalEnrollments = enrollmentResults.reduce((sum, arr) => sum + arr.length, 0);
        }

        if (!cancelled) {
          setHubStats({
            students: students.length,
            courses: courses.length,
            enrollments: totalEnrollments,
            reports: reports.length,
          });
          setStatsLoaded(true);
        }
      } catch (err) {
        console.error('Failed to fetch hub stats:', err);
        if (!cancelled) {
          setHubStats({ students: 0, courses: 0, enrollments: 0, reports: 0 });
          setStatsLoaded(true);
        }
      }
    };

    fetchStats();
    return () => { cancelled = true; };
  }, [currentView, statsLoaded, user]);

  const handleLogin = (e) => {
    e.preventDefault();
    setUser({ name: "John Gawin", unit: "Harmony", email: "john.gawin@lakeland.edu" });
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView("home");
    setActiveStudent(null);
    setStatsLoaded(false);
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
                onClick={() => navigateTo(m.id)}
              />
            ))}
            <button
              onClick={() => setIsSpreadsheetModalOpen(true)}
              className="px-4 py-1.5 rounded-md text-sm font-semibold transition-colors duration-200 bg-transparent text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 flex items-center gap-2"
            >
              <FileSpreadsheet size={16} />
              Mid-Quarter Spreadsheet
            </button>
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
          <div className="hub-mesh-bg min-h-full">
            <div className="max-w-6xl mx-auto px-8 py-12">

              {/* === HERO SECTION === */}
              <div className="text-center mb-10 animate-slide-up">
                <div className="inline-flex items-center gap-2 mb-4 text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5">
                  <Calendar size={14} />
                  {formatDate()}
                  <span className="w-1 h-1 bg-indigo-300 rounded-full" />
                  <span>{getAcademicQuarter()} &middot; {getCurrentSchoolYear()}</span>
                </div>

                <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                  {getGreeting()},{' '}
                  <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-transparent">
                    {user.name.split(' ')[0]}
                  </span>
                </h1>
                <p className="text-lg text-slate-500 mt-3 max-w-lg mx-auto">
                  Your command center for student management, grading, and assessments.
                </p>

                {activeStudent && (
                  <div
                    className="inline-flex items-center gap-3 mt-5 bg-indigo-100/80 text-indigo-800 font-bold px-5 py-2.5 rounded-full text-sm border border-indigo-200/80 shadow-sm animate-slide-up"
                    style={{ animationDelay: '100ms' }}
                  >
                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse" />
                    Active Context: <strong>{activeStudent}</strong>
                  </div>
                )}
              </div>

              {/* === STATS BAR === */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <StatCard icon={Users} value={hubStats.students} label="Total Students"
                  accentColor="bg-gradient-to-br from-blue-500 to-blue-600" delay={200} />
                <StatCard icon={BookOpen} value={hubStats.courses} label="My Courses"
                  accentColor="bg-gradient-to-br from-emerald-500 to-emerald-600" delay={300} />
                <StatCard icon={TrendingUp} value={hubStats.enrollments} label="Active Enrollments"
                  accentColor="bg-gradient-to-br from-violet-500 to-violet-600" delay={400} />
                <StatCard icon={FileBarChart} value={hubStats.reports} label="Reports Generated"
                  accentColor="bg-gradient-to-br from-amber-500 to-amber-600" delay={500} />
              </div>

              {/* === MODULE GRID === */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {modules.map((m, index) => (
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

              {/* === QUICK ACTIONS === */}
              <div className="animate-slide-up" style={{ animationDelay: '900ms' }}>
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
                  <SeedButton status={seedStatus} message={seedMessage} onClick={handleSeedDemoData} />
                </div>
              </div>

            </div>
          </div>
        )}

        {currentView !== 'home' && (
          <div className="p-0">
            {currentView === 'dashboard' && <StudentMasterDashboard activeStudentName={activeStudent} setActiveStudent={setActiveStudent} setView={setCurrentView} user={user} initialTab={dashboardInitialTab} />}
            {currentView === 'gradecards' && <GradeGenerator user={user} activeStudent={activeStudent} />}
            {currentView === 'ktea' && <KTEAReporter user={user} activeStudent={activeStudent} />}
            {currentView === 'discharge' && <DischargeGenerator user={user} activeStudent={activeStudent} />}
            {currentView === 'curriculum' && <CurriculumMaps />}
            {currentView === 'audit' && <AuditLog />}
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

const StatCard = ({ icon: Icon, value, label, accentColor, delay }) => {
  const displayValue = useCountUp(value);

  return (
    <div
      className="animate-shimmer-in flex items-center gap-4 bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition-shadow duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`p-2.5 rounded-xl ${accentColor}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-extrabold text-slate-800 tabular-nums">
          {value === null ? (
            <span className="inline-block w-8 h-6 bg-slate-200 rounded animate-pulse" />
          ) : (
            displayValue
          )}
        </div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          {label}
        </div>
      </div>
    </div>
  );
};

const LaunchCard = ({ icon: Icon, title, desc, color, onClick, delay }) => (
  <div
    onClick={onClick}
    className={`animate-slide-up bg-white/60 backdrop-blur-lg shadow-lg shadow-slate-200/50 border ${color.border} rounded-2xl p-6 group cursor-pointer transition-all duration-300 hover:shadow-2xl ${color.hoverShadow} ${color.hoverBorder} hover:-translate-y-2 relative overflow-hidden`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

    <div className="flex items-start justify-between">
      <div className={`p-3 ${color.bg} rounded-xl border border-white/80`}>
        <Icon size={28} className={color.icon} />
      </div>
      <ChevronRight className={`w-6 h-6 text-slate-300 ${color.chevronHover} group-hover:translate-x-1 transition-all duration-300`} />
    </div>
    <div className="mt-4">
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
