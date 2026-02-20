import React, { useState } from 'react';
import { Search, LogOut, LayoutDashboard, GraduationCap, FileText, Map, X, ChevronRight, School, ClipboardList, Shield } from 'lucide-react';

// --- MODULE IMPORTS ---
import KTEAReporter from '../ktea/KTEAReporter';
import DischargeGenerator from '../discharge/DischargeGenerator';
import CurriculumMaps from '../curriculum/CurriculumMaps'; 
import StudentMasterDashboard from '../dashboard/StudentMasterDashboard'; 
import GradeReporter from '../grading/GradeReporter'; 
import AuditLog from '../audit/AuditLog';

const HubShell = () => {
  const [user, setUser] = useState(null); 
  const [currentView, setCurrentView] = useState("home"); 
  const [activeStudent, setActiveStudent] = useState(null); 
  const [hoveredCard, setHoveredCard] = useState(null);

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

  return (
    <div style={styles.layoutContainer}>
      
      {/* 1. TOP NAVIGATION BAR */}
      <header style={styles.topBar}>
        <div style={styles.brandingArea}>
          <div style={styles.logo} onClick={() => setCurrentView('home')}>
            <span style={{fontSize: "24px", marginRight: "10px"}}>🎓</span> 
            LRS HUB
          </div>
          <nav style={styles.navLinks}>
            <NavButton label="Dashboard" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
            <NavButton label="Grades" active={currentView === 'grades'} onClick={() => setCurrentView('grades')} />
            <NavButton label="KTEA-III" active={currentView === 'ktea'} onClick={() => setCurrentView('ktea')} />
            <NavButton label="Discharge" active={currentView === 'discharge'} onClick={() => setCurrentView('discharge')} />
            <NavButton label="Curriculum" active={currentView === 'curriculum'} onClick={() => setCurrentView('curriculum')} />
            <NavButton label="Audit" active={currentView === 'audit'} onClick={() => setCurrentView('audit')} />
          </nav>
        </div>

        <div style={styles.searchWrapper}>
            <div style={styles.searchIcon}>🔍</div>
            <input 
              placeholder="Search Student Context..." 
              style={styles.globalSearch}
              onChange={(e) => setActiveStudent(e.target.value)} 
              value={activeStudent || ""}
            />
            {activeStudent && (
              <button onClick={() => setActiveStudent("")} style={styles.clearBtn}>×</button>
            )}
        </div>

        <div style={styles.userArea}>
          <div style={styles.userAvatar}>{user.name.charAt(0)}</div>
          <button onClick={handleLogout} style={styles.logoutBtn}>Sign Out</button>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main style={styles.mainContent}>
        
        {/* VIEW: LAUNCHPAD (Optimized for Single View / No Scroll) */}
        {currentView === 'home' && (
          <div style={styles.launchpadContainer}>
            
            <div style={styles.heroSection}>
              <h1 style={styles.heroTitle}>Welcome, {user.name.split(" ")[0]}</h1>
              <p style={styles.heroSubtitle}>Select a tool to begin.</p>
              {activeStudent && (
                 <div style={styles.activeContextBadge}>
                    🟢 Context: <strong>{activeStudent}</strong>
                 </div>
              )}
            </div>
            
            <div style={styles.cardGrid}>
              
              <LaunchCard 
                icon="👥" color="#8E2DE2" title="Dashboard" desc="Rosters & Profiles"
                hovered={hoveredCard === 'dashboard'} 
                onEnter={() => setHoveredCard('dashboard')} onLeave={() => setHoveredCard(null)}
                onClick={() => setCurrentView('dashboard')}
              />

              <LaunchCard 
                icon="🏫" color="#F2994A" title="Grade Reporter" desc="Enter Grades"
                hovered={hoveredCard === 'grades'} 
                onEnter={() => setHoveredCard('grades')} onLeave={() => setHoveredCard(null)}
                onClick={() => setCurrentView('grades')}
              />

              <LaunchCard 
                icon="📝" color="#FF5E62" title="KTEA Reporter" desc="Assessments"
                hovered={hoveredCard === 'ktea'} 
                onEnter={() => setHoveredCard('ktea')} onLeave={() => setHoveredCard(null)}
                onClick={() => setCurrentView('ktea')}
              />

              <LaunchCard 
                icon="📄" color="#56CCF2" title="Discharge Writer" desc="Exit Summaries"
                hovered={hoveredCard === 'discharge'} 
                onEnter={() => setHoveredCard('discharge')} onLeave={() => setHoveredCard(null)}
                onClick={() => setCurrentView('discharge')}
              />

              <LaunchCard 
                icon="🗺️" color="#11998e" title="Curriculum" desc="Maps & Standards"
                hovered={hoveredCard === 'curriculum'} 
                onEnter={() => setHoveredCard('curriculum')} onLeave={() => setHoveredCard(null)}
                onClick={() => setCurrentView('curriculum')}
              />

              <LaunchCard 
                Icon={Shield} color="#475569" title="Audit Log" desc="Security & Compliance"
                hovered={hoveredCard === 'audit'} 
                onEnter={() => setHoveredCard('audit')} onLeave={() => setHoveredCard(null)}
                onClick={() => setCurrentView('audit')}
              />

            </div>
          </div>
        )}

        {/* VIEW: TOOLS CANVAS */}
        {currentView !== 'home' && (
            <div style={styles.toolCanvas}>
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

// --- HELPER COMPONENTS ---

const NavButton = ({ label, active, onClick }) => (
    <button 
        onClick={onClick}
        style={{
            background: active ? "rgba(255,255,255,0.2)" : "transparent",
            color: "white",
            border: active ? "1px solid rgba(255,255,255,0.4)" : "none",
            padding: "6px 12px",
            borderRadius: "20px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "600",
            transition: "all 0.2s ease",
            backdropFilter: active ? "blur(10px)" : "none",
            whiteSpace: "nowrap"
        }}
    >
        {label}
    </button>
);

const LaunchCard = ({ icon, color, title, desc, hovered, onEnter, onLeave, onClick }) => (
    <div 
        style={{
            ...styles.launchCard, 
            ...(hovered ? styles.launchCardHover : {})
        }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onClick={onClick}
    >
        <div style={{...styles.iconCircle, background: `linear-gradient(135deg, ${color}88 0%, ${color} 100%)`}}>{icon}</div>
        <h3 style={styles.cardTitle}>{title}</h3>
        <p style={styles.cardDesc}>{desc}</p>
        <div style={styles.cardAction}>Launch →</div>
    </div>
);

const LoginScreen = ({ onLogin }) => (
  <div style={styles.loginContainer}>
    <div style={styles.loginBox}>
      <h1 style={{color: "#003366", margin: "0 0 10px 0"}}>Lakeland Secure Hub</h1>
      <p style={{color: "#666", fontSize: "14px", marginBottom: "30px"}}>Authorized Staff Access Only</p>
      <button onClick={onLogin} style={styles.loginBtn}>Sign in with Microsoft</button>
    </div>
  </div>
);

// --- STYLES (COMPACT & MODERN) ---
const styles = {
  layoutContainer: { 
    display: "flex", flexDirection: "column", height: "100vh", 
    fontFamily: "'Segoe UI', 'Inter', sans-serif", 
    background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
    color: "white", overflow: "hidden" 
  },
  
  topBar: { 
    height: "60px", background: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", 
    justifyContent: "space-between", padding: "0 20px", zIndex: 100, flexShrink: 0
  },
  brandingArea: { display: "flex", alignItems: "center", gap: "20px" },
  logo: { fontWeight: "800", fontSize: "18px", cursor: "pointer", letterSpacing: "1px", display: "flex", alignItems: "center", whiteSpace: "nowrap" },
  navLinks: { display: "flex", gap: "5px" },

  searchWrapper: { position: "relative", width: "300px", display: "flex", alignItems: "center", margin: "0 20px" },
  searchIcon: { position: "absolute", left: "15px", opacity: 0.7, fontSize: "12px" },
  globalSearch: { 
    width: "100%", background: "rgba(0, 0, 0, 0.2)", border: "1px solid rgba(255,255,255,0.1)", 
    color: "white", padding: "8px 10px 8px 35px", borderRadius: "30px", outline: "none", fontSize: "12px", transition: "all 0.2s"
  },
  clearBtn: { position: "absolute", right: "10px", background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "14px" },

  userArea: { display: "flex", alignItems: "center", gap: "10px" },
  userAvatar: { width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(to right, #f12711, #f5af19)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "12px", boxShadow: "0 2px 5px rgba(0,0,0,0.2)" },
  logoutBtn: { background: "transparent", color: "rgba(255,255,255,0.7)", border: "none", fontSize: "11px", cursor: "pointer", fontWeight: "600" },

  mainContent: { flex: 1, overflowY: "auto", position: "relative", display: "flex", flexDirection: "column" },

  // COMPACT LAUNCHPAD
  launchpadContainer: { 
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", 
    padding: "20px", animation: "fadeIn 0.5s ease-in-out"
  },
  heroSection: { textAlign: "center", marginBottom: "30px" }, // Reduced margin
  heroTitle: { fontSize: "36px", fontWeight: "800", margin: "0 0 5px 0", background: "linear-gradient(to right, #fff, #b2bec3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  heroSubtitle: { fontSize: "14px", color: "rgba(255,255,255,0.6)", fontWeight: "400", margin: 0 },
  activeContextBadge: { marginTop: "10px", background: "rgba(46, 204, 113, 0.2)", color: "#2ecc71", padding: "5px 12px", borderRadius: "20px", fontSize: "11px", border: "1px solid rgba(46, 204, 113, 0.4)", display: "inline-block" },

  cardGrid: { display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center", maxWidth: "1200px" },
  
  // SMALLER GLASS CARDS
  launchCard: { 
    background: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(10px)",
    width: "180px", // Smaller width
    padding: "20px 15px", // Smaller padding
    borderRadius: "16px", textAlign: "center", 
    border: "1px solid rgba(255, 255, 255, 0.1)",
    cursor: "pointer", transition: "all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)",
    boxShadow: "0 10px 20px rgba(0,0,0,0.1)" 
  },
  launchCardHover: {
    transform: "translateY(-5px)",
    background: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    boxShadow: "0 15px 30px rgba(0,0,0,0.2)"
  },
  iconCircle: {
    width: "45px", height: "45px", borderRadius: "50%", margin: "0 auto 15px auto",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px",
    boxShadow: "0 5px 10px rgba(0,0,0,0.2)"
  },
  cardTitle: { fontSize: "15px", fontWeight: "700", margin: "0 0 5px 0", color: "white" },
  cardDesc: { fontSize: "11px", color: "rgba(255,255,255,0.6)", lineHeight: "1.4", marginBottom: "15px", minHeight: "30px" },
  cardAction: { fontSize: "10px", fontWeight: "bold", color: "#4facfe", textTransform: "uppercase", letterSpacing: "1px" },

  toolCanvas: { background: "#f4f6f8", height: "100%", width: "100%", overflowY: "auto", position: "relative" },

  loginContainer: { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#ecf0f1" },
  loginBox: { background: "white", padding: "50px", borderRadius: "10px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", textAlign: "center", width: "400px" },
  loginBtn: { background: "#003366", color: "white", padding: "12px 24px", border: "none", borderRadius: "4px", fontSize: "16px", cursor: "pointer", width: "100%", fontWeight: "bold" }
};

export default HubShell;