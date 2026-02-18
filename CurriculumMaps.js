import React, { useState, useEffect } from 'react';

// --- CONFIGURATION: CLOUD STORAGE ---
// The centralized Base URL for your Azure container
const AZURE_BASE_URL = "https://lrsstoragehub.blob.core.windows.net/curriculum-resources/";

export default function CurriculumMaps() {
  
  // STATE: Determines which map is visible
  // Options: 'social', 'english', 'math', 'science', 'lower', 'upper'
  const [activeSubject, setActiveSubject] = useState('social');

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // SUBJECT CARDS DATA
  const subjects = [
    { id: 'social', label: 'Social Studies', icon: 'fa-globe-americas', color: '#00695c' },
    { id: 'english', label: 'English (6-12)', icon: 'fa-book-open', color: '#c0392b' },
    { id: 'math', label: 'Math (6-12)', icon: 'fa-calculator', color: '#2980b9' },
    { id: 'science', label: 'Science (6-12)', icon: 'fa-flask', color: '#27ae60' },
    { id: 'lower', label: 'Lower Elem', icon: 'fa-shapes', color: '#e67e22' },
    { id: 'upper', label: 'Upper Elem', icon: 'fa-layer-group', color: '#8e44ad' },
  ];

  return (
    <div style={{ paddingBottom: '4rem', fontFamily: 'Segoe UI, Roboto, sans-serif', backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
      
      {/* Load FontAwesome */}
      <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" />

      {/* --- STYLES --- */}
      <style>{`
        :root {
          --brand-teal: #00695c;
          --brand-blue: #0277bd;
          --bg-break: #eceff1;
          --text-break: #78909c;
          --border-color: #d1d5db;
        }

        /* Navigation Cards */
        .nav-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 10px;
          padding: 10px 20px;
          margin-top: -30px;
          margin-bottom: 30px;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
          position: relative;
          z-index: 10;
        }

        .nav-card {
          background: white;
          padding: 15px 10px;
          border-radius: 12px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid transparent;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          opacity: 0.7;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
        }

        .nav-card:hover { transform: translateY(-3px); opacity: 1; box-shadow: 0 8px 15px rgba(0,0,0,0.1); }
        .nav-card.active { opacity: 1; background: white; border-color: currentColor; box-shadow: 0 8px 20px rgba(0,0,0,0.15); transform: translateY(-5px); }
        .nav-card i { font-size: 1.5rem; margin-bottom: 5px; }
        .nav-card span { font-size: 0.85rem; font-weight: 700; }

        /* General UI */
        .main-header {
          background: linear-gradient(135deg, #2c3e50, #000000);
          color: white;
          padding: 3rem 1rem 4rem 1rem;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        
        .double-month-block, .curriculum-block {
          background: white; max-width: 1400px; margin: 0 auto 2.5rem auto;
          border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          border: 1px solid #e5e7eb; overflow-x: auto;
        }

        table { width: 100%; min-width: 1200px; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
        th.col-subject-header, td.col-subject { width: 120px; position: sticky; left: 0; background-color: #f9fafb; z-index: 20; font-weight: 800; color: #111827; border-right: 3px solid #9ca3af; text-align: center; vertical-align: middle; box-shadow: 2px 0 5px rgba(0,0,0,0.05); }
        th.week-header, td { width: 11%; }

        th.month-header { color: white; padding: 12px; text-transform: uppercase; font-size: 1.1rem; font-weight: 800; letter-spacing: 0.05em; border-right: 1px solid rgba(255,255,255,0.2); }
        .bg-teal { background-color: var(--brand-teal); }
        .bg-blue { background-color: var(--brand-blue); }

        th.week-header { background-color: #374151; color: #f3f4f6; font-size: 11px; font-weight: 600; padding: 6px; text-align: center; border-right: 1px solid #4b5563; }
        td { padding: 8px; border-bottom: 1px solid var(--border-color); border-right: 1px solid var(--border-color); vertical-align: top; height: 120px; background-color: white; }

        .cell-break { background-color: var(--bg-break); color: var(--text-break); text-align: center; vertical-align: middle; font-weight: 700; font-style: italic; border: 1px dashed #cfd8dc; }
        .topic-content { display: flex; flex-direction: column; gap: 6px; }
        .topic-name { font-weight: 700; color: #1f2937; line-height: 1.3; font-size: 12px; }

        /* Buttons & Tags */
        .btn { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-decoration: none; width: fit-content; margin-right: 4px; margin-bottom: 4px; transition: all 0.2s; cursor: pointer; }
        .btn-pdf { background:#dcfce7; color:#166534; border:1px solid #86efac; }
        .btn-pdf:hover { background:#bbf7d0; }
        .btn-vid { background:#dbeafe; color:#1e40af; border:1px solid #93c5fd; }
        .btn-vid:hover { background:#bfdbfe; }
        .mls { display: inline-block; background: #f3f4f6; color: #b91c1c; font-family: monospace; font-size: 9px; font-weight: 700; padding: 2px 5px; border-radius: 3px; border: 1px solid #e5e7eb; margin-top: 4px; cursor: help; position: relative; width: fit-content; }
        .mls:hover::after { content: attr(data-desc); position: absolute; bottom: 110%; left: 50%; transform: translateX(-50%); background: #1f2937; color: white; padding: 8px; border-radius: 4px; font-size: 11px; width: 180px; z-index: 50; text-align: center; pointer-events: none; box-shadow: 0 4px 10px rgba(0,0,0,0.2); font-family: sans-serif; white-space: normal; }
        .text-wh { color: #15803d; } .text-us { color: #1d4ed8; } .text-gov { color: #b91c1c; }
      `}</style>

      {/* --- HEADER --- */}
      <header className="main-header">
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, letterSpacing: '-1px' }}>LAKELAND CURRICULUM HUB</h1>
        <p style={{ opacity: 0.8, marginTop: '5px', fontSize: '14px', letterSpacing: '1px' }}>ACADEMIC YEAR 2024-2025</p>
      </header>

      {/* --- NAVIGATION DECK --- */}
      <div className="nav-grid">
        {subjects.map((sub) => (
            <div 
              key={sub.id} 
              className={`nav-card ${activeSubject === sub.id ? 'active' : ''}`}
              style={{ color: activeSubject === sub.id ? sub.color : '#64748b' }}
              onClick={() => setActiveSubject(sub.id)}
            >
                <i className={`fas ${sub.icon}`}></i>
                <span>{sub.label}</span>
            </div>
        ))}
      </div>

      <div className="p-2 md:p-4">
        
        {/* --- DYNAMIC CONTENT SWITCHER --- */}
        {activeSubject === 'social' && <SocialStudiesContent />}
        {activeSubject === 'english' && <EnglishContent />}
        
        {/* Placeholders for future subjects */}
        {activeSubject === 'math' && <PlaceholderContent title="Math Curriculum" icon="fa-calculator" color="#2980b9" />}
        {activeSubject === 'science' && <PlaceholderContent title="Science Curriculum" icon="fa-flask" color="#27ae60" />}
        {activeSubject === 'lower' && <PlaceholderContent title="Lower Elementary" icon="fa-shapes" color="#e67e22" />}
        {activeSubject === 'upper' && <PlaceholderContent title="Upper Elementary" icon="fa-layer-group" color="#8e44ad" />}

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function PlaceholderContent({ title, icon, color }) {
    return (
        <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ fontSize: '4rem', color: color, marginBottom: '20px', opacity: 0.2 }}>
                <i className={`fas ${icon}`}></i>
            </div>
            <h2 style={{ color: '#2c3e50', fontSize: '24px', marginBottom: '10px' }}>{title}</h2>
            <p style={{ color: '#7f8c8d' }}>This curriculum map is currently under development.</p>
        </div>
    );
}

// 2. SOCIAL STUDIES CONTENT
function SocialStudiesContent() {
    
    // Helper to build Azure links
    const getRes = (folder, file) => `${AZURE_BASE_URL}${folder}/${file}`;

    return (
        <>
        {/* ==================== AUG & SEPT ==================== */}
        <div className="double-month-block">
            <table>
                <thead>
                    <tr>
                        <th className="col-subject-header" rowSpan="2">Subject</th>
                        <th colSpan="4" className="month-header bg-teal">August</th>
                        <th colSpan="4" className="month-header bg-blue">September</th>
                    </tr>
                    <tr>
                        <th className="week-header">Week 1</th><th className="week-header">Week 2</th><th className="week-header">Week 3</th><th className="week-header">Week 4</th>
                        <th className="week-header">Week 1</th><th className="week-header">Week 2</th><th className="week-header">Week 3</th><th className="week-header">Week 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="col-subject text-wh">World History</td>
                        <td><div className="topic-content"><span className="topic-name">Telling Time / Early Humans</span><span className="mls" data-desc="Describe the impact of geography on hunter-gatherer societies and the development of the first civilizations.">6-8.WH.1.CC.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Early Humans / Stone Age</span><span className="mls" data-desc="Explain how physical geography influenced the migration and settlement of early human societies.">6-8.WH.2.GS.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Features of Civ</span><span className="mls" data-desc="Compare and contrast the defining characteristics (government, religion, specialized labor) of early river valley civilizations.">6-8.WH.2.PC.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Mesopotamia</span><span className="mls" data-desc="Locate major river systems and analyze their impact on the development of Mesopotamia.">6-8.WH.2.GS.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">9/11 Context</span><span className="mls" data-desc="Analyze the causes and global consequences of modern terrorism, specifically the September 11 attacks.">6-8.AH.5.CC.D</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Timelines</span><span className="mls" data-desc="Create and use tools such as timelines and maps to analyze change and continuity over time.">6-8.WH.1.CC.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Sumer & Akkad</span><span className="mls" data-desc="Locate and describe the political development of Sumerian city-states and the Akkadian Empire.">6-8.WH.2.GS.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Babylon & Hittites</span><span className="mls" data-desc="Compare the economic systems and trade networks of the Babylonian and Hittite empires.">6-8.WH.2.EC.A</span></div></td>
                    </tr>
                    <tr>
                        <td className="col-subject text-us">US History</td>
                        <td><div className="topic-content"><span className="topic-name">Black Legend</span><a href={getRes('us_history','ccush_01_black_legend.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=6E9WU9TGrec" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Trace the development of colonial societies and analyze the impact of European exploration on Indigenous peoples.">6-8.AH.1.CC.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Colonization</span><a href={getRes('us_history','ccush_02_colonizing_america.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=o69TvQqyGdg" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Compare and contrast the physical geography, economy, and culture of the New England, Middle, and Southern colonies.">6-8.AH.3.GS.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Natives/English</span><a href={getRes('us_history','ccush_03_natives_and_english.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=TTYOQ05oOIc" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the sources of conflict and cooperation between Native American groups and European settlers.">6-8.AH.1.GS.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Quakers/Dutch</span><a href={getRes('us_history','ccush_04_quakers_dutch_ladies.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=p47tZLJbdag" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the diverse religious and cultural groups that settled in the colonies and their impact on society.">6-8.AH.3.PC.E</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">9/11 Context</span><a href={getRes('us_history','ush_911_background.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><span className="mls" data-desc="Evaluate the impact of the September 11 attacks on American foreign and domestic policy.">9-12.AH.6.PC.D</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Timelines</span><span className="mls" data-desc="Create and use geographic tools, maps, and timelines to interpret historical data.">6-8.AH.1.G.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">7 Years War</span><a href={getRes('us_history','ccush_05_seven_years_war.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=5vKGU3aEGss" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the causes of the American Revolution, including the impact of the French and Indian War.">6-8.AH.2.CC.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Taxes</span><a href={getRes('us_history','ccush_06_taxes_and_smuggling.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=Eytc9ZaNWyc" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze British colonial policies and the colonial response to taxation without representation.">6-8.AH.2.CC.B</span></div></td>
                    </tr>
                    <tr>
                        <td className="col-subject text-gov">Government</td>
                        <td><div className="topic-content"><span className="topic-name">Why Gov?</span><a href={getRes('government','ccgov_01_why_study_gov.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=lrk4oY7UxpQ" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Apply the principles of constitutional democracy to historical and contemporary issues.">9-12.GV.1.GS.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Congress</span><a href={getRes('government','ccgov_02_bicameral_congress.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=n9defOwVWS8" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the structure, powers, and functions of the legislative branch.">9-12.GV.3.GS.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Checks & Balances</span><a href={getRes('government','ccgov_03_checks_balances.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=0bf3CwYCxXw" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Explain the concepts of separation of powers and checks and balances.">9-12.GV.1.PC.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Federalism</span><a href={getRes('government','ccgov_04_federalism.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=J0gosGXSgsI" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the system of federalism and the distribution of power between national and state governments.">9-12.GV.1.GS.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">9/11 Context</span><span className="mls" data-desc="Analyze the changing relationship between national security and civil liberties in the post-9/11 era.">9-12.GV.4.PC.D</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Timeline</span><span className="mls" data-desc="Create and use tools of social studies inquiry (timelines, maps) to organize information.">SS.9-12.G.1</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Compromises</span><a href={getRes('government','ccgov_05_con_compromise.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=kCCmufZjayc" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the major debates and compromises at the Constitutional Convention.">9-12.GV.1.CC.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Elections</span><a href={getRes('government','ccgov_06_congress_elections.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=Publq_8KYms" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the election process and the role of political parties and voters.">9-12.GV.2.PC.A</span></div></td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* ==================== OCT & NOV ==================== */}
        <div className="double-month-block">
            <table>
                <thead>
                    <tr>
                        <th className="col-subject-header" rowSpan="2">Subject</th>
                        <th colSpan="4" className="month-header bg-teal">October</th>
                        <th colSpan="4" className="month-header bg-blue">November</th>
                    </tr>
                    <tr>
                        <th className="week-header">Week 1</th><th className="week-header">Week 2</th><th className="week-header">Week 3</th><th className="week-header">Week 4</th>
                        <th className="week-header">Week 1</th><th className="week-header">Week 2</th><th className="week-header">Week 3</th><th className="week-header">Week 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="col-subject text-wh">World History</td>
                        <td><div className="topic-content"><span className="topic-name">Egypt Old</span><span className="mls" data-desc="Locate and analyze the physical geography of the Nile River Valley.">6-8.WH.2.GS.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Egypt New</span><span className="mls" data-desc="Explain the concept of dynastic cycles and political power in Ancient Egypt.">6-8.WH.2.PC.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Egypt Culture</span><span className="mls" data-desc="Analyze the cultural achievements and religious beliefs of Ancient Egypt.">6-8.WH.2.PC.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Harappa</span><span className="mls" data-desc="Locate major river systems and analyze their impact on the Indus Valley Civilization.">6-8.WH.2.GS.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Caste System</span><span className="mls" data-desc="Analyze the social structure and development of the Caste System in ancient India.">6-8.WH.2.PC.D</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">China Shang</span><span className="mls" data-desc="Locate major river systems and analyze their impact on the Shang Dynasty.">6-8.WH.2.GS.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">China Zhou</span><span className="mls" data-desc="Trace the rise and fall of the Zhou Dynasty and the Mandate of Heaven.">6-8.WH.2.CC.C</span></div></td>
                        <td className="cell-break">🍂 Break</td>
                    </tr>
                    <tr>
                        <td className="col-subject text-us">US History</td>
                        <td><div className="topic-content"><span className="topic-name">Revolution</span><a href={getRes('us_history','ccush_07_revolution.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=HlUiSBXQHCw" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the key events, battles, and turning points of the American Revolution.">6-8.AH.2.CC.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Constitution</span><a href={getRes('us_history','ccush_08_constitution.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=bO7FQsCcbD8" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Explain the major principles and structure of the US Constitution.">6-8.AH.2.GS.D</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Parties</span><a href={getRes('us_history','ccush_09_political_parties.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=_KnPB37YB7I" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Trace the development of the first political parties in the United States.">6-8.AH.3.CC.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Jefferson</span><a href={getRes('us_history','ccush_10_jefferson.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=_3Ox6vGteek" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the presidency of Thomas Jefferson, including the Louisiana Purchase.">6-8.AH.3.GS.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">War of 1812</span><a href={getRes('us_history','ccush_11_war_of_1812.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=qMXqg2PKJZU" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the causes and outcomes of the War of 1812.">6-8.AH.3.CC.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Market Rev</span><a href={getRes('us_history','ccush_12_market_revolution.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=RNftCCwAol0" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the economic changes and technological innovations of the Market Revolution.">6-8.AH.3.EC.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Slavery</span><a href={getRes('us_history','ccush_13_slavery.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=Ajn9g5Gsv98" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the expansion of slavery and its impact on American society.">6-8.AH.3.PC.B</span></div></td>
                        <td className="cell-break">🍂 Break</td>
                    </tr>
                    <tr>
                        <td className="col-subject text-gov">Government</td>
                        <td><div className="topic-content"><span className="topic-name">Committees</span><a href={getRes('government','ccgov_07_congress_committees.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=evLrZw4VKg" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the role and function of committees in the legislative process.">9-12.GV.3.GS.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Leadership</span><a href={getRes('government','ccgov_08_congress_leadership.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=L8urcMLgf4s" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the roles of congressional leadership (Speaker, Majority Leader, etc).">9-12.GV.3.GS.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Making Laws</span><a href={getRes('government','ccgov_09_bill_becomes_law.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=66f4-Nkeyz4" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Explain the process of how a bill becomes a law.">9-12.GV.3.PC.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Decisions</span><a href={getRes('government','ccgov_10_congress_decisions.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=ZT9ipQdYLlo" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze factors that influence congressional decision making.">9-12.GV.2.GS.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Pres. Power</span><a href={getRes('government','ccgov_11_presidential_power.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=5l02sK5LovI" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the formal powers of the presidency.">9-12.GV.3.GS.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Powers II</span><a href={getRes('government','ccgov_12_pres_power_two.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=fnYb-sb7w1k" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the informal powers of the president (executive orders, etc).">9-12.GV.3.GS.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Delegation</span><a href={getRes('government','ccgov_13_congress_delegation.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=WynUSyARh4Q" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Explain the delegation of power to the federal bureaucracy.">9-12.GV.3.PC.B</span></div></td>
                        <td className="cell-break">🍂 Break</td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* ==================== DEC & JAN ==================== */}
        <div className="double-month-block">
            <table>
                <thead>
                    <tr>
                        <th className="col-subject-header" rowSpan="2">Subject</th>
                        <th colSpan="4" className="month-header bg-teal">December</th>
                        <th colSpan="4" className="month-header bg-blue">January</th>
                    </tr>
                    <tr>
                        <th className="week-header">Week 1</th><th className="week-header">Week 2</th><th className="week-header">Week 3</th><th className="week-header">Week 4</th>
                        <th className="week-header">Week 1</th><th className="week-header">Week 2</th><th className="week-header">Week 3</th><th className="week-header">Week 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="col-subject text-wh">World History</td>
                        <td><div className="topic-content"><span className="topic-name">Minoans</span><span className="mls" data-desc="Locate and analyze the geography and culture of the Minoan civilization.">6-8.WH.2.GS.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Mycenaeans</span><span className="mls" data-desc="Locate and analyze the geography and culture of the Mycenaean civilization.">6-8.WH.2.GS.B</span></div></td>
                        <td className="cell-break">📝 Exams</td>
                        <td className="cell-break">❄️ Break</td>
                        <td className="cell-break">❄️ Break</td>
                        <td><div className="topic-content"><span className="topic-name">Greek Polis</span><span className="mls" data-desc="Analyze how geography influenced the development of the Greek Polis.">6-8.WH.2.GS.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Sparta/Athens</span><span className="mls" data-desc="Compare and contrast the political and social structures of Sparta and Athens.">6-8.WH.2.CC.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Greek Wars</span><span className="mls" data-desc="Analyze the causes and effects of the Persian and Peloponnesian Wars.">6-8.WH.2.CC.D</span></div></td>
                    </tr>
                    <tr>
                        <td className="col-subject text-us">US History</td>
                        <td><div className="topic-content"><span className="topic-name">Jackson</span><a href={getRes('us_history','ccush_14_age_of_jackson.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=beN4qE-e5O8" target="_blank" rel="noreferrer" className="btn btn-pdf">Video</a><span className="mls" data-desc="Analyze the political and social impact of the Age of Jackson.">6-8.AH.3.CC.E</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Reforms</span><a href={getRes('us_history','ccush_15_reform_movements.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=t62fUZJvjOs" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Evaluate the impact of Antebellum reform movements (Temperance, Abolition, etc).">6-8.AH.3.PC.E</span></div></td>
                        <td className="cell-break">📝 Exams</td>
                        <td className="cell-break">❄️ Break</td>
                        <td className="cell-break">❄️ Break</td>
                        <td><div className="topic-content"><span className="topic-name">Women's Mvmt</span><a href={getRes('us_history','ccush_16_womens_movements.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=fM1czS_VYDI" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the development of the Women's Rights Movement (Seneca Falls).">6-8.AH.3.GS.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Westward</span><a href={getRes('us_history','ccush_17_westward_expansion.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=Q1654gQkEsm" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Evaluate the impact of Westward Expansion and Manifest Destiny.">6-8.AH.3.CC.F</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Election 1860</span><a href={getRes('us_history','ccush_18_election_1860.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=roNmeOOJCDY" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the Election of 1860 and the secession of Southern states.">6-8.AH.4.CC.A</span></div></td>
                    </tr>
                    <tr>
                        <td className="col-subject text-gov">Government</td>
                        <td><div className="topic-content"><span className="topic-name">Presidents</span><a href={getRes('government','ccgov_14_how_presidents_govern.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=5v7-b_Uf2H4" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze how presidents govern and interact with other branches.">9-12.GV.3.GS.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Bureaucracy</span><a href={getRes('government','ccgov_15_bureaucracy_basics.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=I8tE048w0ro" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Explain the role and structure of the federal bureaucracy.">9-12.GV.3.GS.E</span></div></td>
                        <td className="cell-break">📝 Exams</td>
                        <td className="cell-break">❄️ Break</td>
                        <td className="cell-break">❄️ Break</td>
                        <td><div className="topic-content"><span className="topic-name">Agencies</span><a href={getRes('government','ccgov_16_types_of_bureaucracies.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=t3qfM6Q_9K0" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Differentiate between types of bureaucratic agencies (Cabinet, Independent, etc).">9-12.GV.3.PC.E</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Oversight</span><a href={getRes('government','ccgov_17_controlling_bureaucracies.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=RmSIV0G9d3Q" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze congressional and presidential oversight of the bureaucracy.">9-12.GV.3.CC.D</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Legal Sys</span><a href={getRes('government','ccgov_18_legal_system_basics.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=mXw-hCQ5TE0" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the structure and function of the judicial branch.">9-12.GV.3.GS.D</span></div></td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* ==================== FEB & MAR ==================== */}
        <div className="curriculum-block">
            <table>
                <thead>
                    <tr>
                        <th className="col-subject-header" rowSpan="2">Subject</th>
                        <th colSpan="4" className="month-header bg-teal">February</th>
                        <th colSpan="4" className="month-header bg-blue">March</th>
                    </tr>
                    <tr>
                        <th className="week-header">Week 1</th><th className="week-header">Week 2</th><th className="week-header">Week 3</th><th className="week-header">Week 4</th>
                        <th className="week-header">Week 1</th><th className="week-header">Week 2</th><th className="week-header">Week 3</th><th className="week-header">Week 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="col-subject text-wh">World History</td>
                        <td><div className="topic-content"><span className="topic-name">Rome Republic</span><span className="mls" data-desc="Locate and analyze the geography and government of the Roman Republic.">6-8.WH.2.GS.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Rome Empire</span><span className="mls" data-desc="Trace the transition from Roman Republic to Roman Empire.">6-8.WH.2.PC.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Christianity</span><span className="mls" data-desc="Analyze the rise and spread of Christianity in the Roman Empire.">6-8.WH.2.PC.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Rome Fall</span><span className="mls" data-desc="Analyze the political, economic, and social causes of the Fall of Rome.">6-8.WH.2.CC.D</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Feudalism</span><span className="mls" data-desc="Analyze the social and political structure of Feudalism in Europe.">6-8.WH.3.GS.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Crusades</span><span className="mls" data-desc="Analyze the causes and effects of the Crusades.">6-8.WH.3.CC.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Renaissance</span><span className="mls" data-desc="Trace the development of the Renaissance and its impact on Europe.">6-8.WH.3.PC.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Reformation</span><span className="mls" data-desc="Analyze the causes and effects of the Protestant Reformation.">6-8.WH.3.PC.C</span></div></td>
                    </tr>
                    <tr>
                        <td className="col-subject text-us">US History</td>
                        <td><div className="topic-content"><span className="topic-name">Gilded Age</span><a href={getRes('us_history','ccush_26_gilded_age.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=Spgdy3H_ens" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze economic growth and industrialization during the Gilded Age.">9-12.AH.4.EC.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Progressive</span><a href={getRes('us_history','ccush_27_progressive_era.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=i0Q4zPR4G7M" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Evaluate the impact of the Progressive Era on American society.">9-12.AH.4.GS.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Imperialism</span><a href={getRes('us_history','ccush_28_imperialism.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=QfsfoFqsFk4" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the causes and consequences of American Imperialism.">9-12.AH.4.CC.D</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">WWI</span><a href={getRes('us_history','ccush_30_wwi.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=y59wErqg4Xg" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the reasons for US entry into WWI and its impact.">9-12.AH.4.CC.E</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Homefront</span><span className="mls" data-desc="Analyze the impact of WWI on the American Homefront.">9-12.AH.4.GS.D</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Suffrage</span><a href={getRes('us_history','ccush_31_womens_suffrage.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=HGEMscZE5dY" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the struggle for and achievement of Women's Suffrage.">9-12.AH.4.PC.E</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Roaring 20s</span><a href={getRes('us_history','ccush_32_roaring_20s.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=VfOR1XCMf7A" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the cultural and social changes of the 1920s.">9-12.AH.5.CC.A</span></div></td>
                        <td className="cell-break">🌱 Break</td>
                    </tr>
                    <tr>
                        <td className="col-subject text-gov">Government</td>
                        <td><div className="topic-content"><span className="topic-name">Courts</span><a href={getRes('government','ccgov_19_structure_court_system.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=IGsj6U2t108" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the structure and jurisdiction of the federal court system.">9-12.GV.3.GS.D</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">SCOTUS</span><a href={getRes('government','ccgov_20_supreme_court_pro.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=7sUAeDk0p2g" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the procedures and processes of the Supreme Court.">9-12.GV.3.PC.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Review</span><a href={getRes('government','ccgov_21_judicial_review.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=mWYFwl93uCM" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Explain the concept and significance of Judicial Review.">9-12.GV.3.CC.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Decisions</span><a href={getRes('government','ccgov_22_judicial_decisions.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=hsx4Z7S_F80" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze landmark Supreme Court decisions and their impact.">9-12.GV.3.CC.D</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Rights</span><a href={getRes('government','ccgov_23_civil_rights_liberties.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=kbwsF-A2sTg" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the protection of Civil Rights and Civil Liberties.">9-12.GV.5.PC.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Religion</span><a href={getRes('government','ccgov_24_freedom_of_religion.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=Y8dI1GTWCk4" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the Establishment and Free Exercise clauses.">9-12.GV.5.GS.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Speech</span><a href={getRes('government','ccgov_25_freedom_of_speech.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=ZleqRW7R9GE" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze Freedom of Speech and its limitations.">9-12.GV.5.GS.B</span></div></td>
                        <td className="cell-break">🌱 Break</td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* ==================== APR & MAY ==================== */}
        <div className="curriculum-block">
            <table>
                <thead>
                    <tr>
                        <th className="col-subject-header" rowSpan="2">Subject</th>
                        <th colSpan="4" className="month-header bg-teal">April</th>
                        <th colSpan="4" className="month-header bg-blue">May</th>
                    </tr>
                    <tr>
                        <th className="week-header">Week 1</th><th className="week-header">Week 2</th><th className="week-header">Week 3</th><th className="week-header">Week 4</th>
                        <th className="week-header">Week 1</th><th className="week-header">Week 2</th><th className="week-header">Week 3</th><th className="week-header">Week 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="col-subject text-wh">World History</td>
                        <td><div className="topic-content"><span className="topic-name">Civil War</span><span className="mls" data-desc="Analyze the causes and key events of the US Civil War in a global context.">9-12.AH.4.CC.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Battles</span><span className="mls" data-desc="Analyze key battles and the role of geography in the Civil War.">9-12.AH.4.GS.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">WWI Leadup</span><span className="mls" data-desc="Analyze the long-term and immediate causes of World War I.">9-12.WH.4.CC.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Trenches</span><span className="mls" data-desc="Analyze the impact of technology and trench warfare in WWI.">9-12.WH.4.GS.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">WWII Lead</span><span className="mls" data-desc="Analyze the Treaty of Versailles and the rise of totalitarianism leading to WWII.">9-12.WH.4.PC.D</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">WWII Start</span><span className="mls" data-desc="Analyze the causes and early events of World War II.">9-12.WH.5.CC.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">D-Day/Holo</span><span className="mls" data-desc="Analyze the Holocaust and key battles like D-Day.">9-12.WH.5.GS.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Pearl Harbor</span><span className="mls" data-desc="Analyze the impact of the attack on Pearl Harbor and the Pacific Theater.">9-12.WH.5.PC.C</span></div></td>
                    </tr>
                    <tr>
                        <td className="col-subject text-us">US History</td>
                        <td><div className="topic-content"><span className="topic-name">Depression</span><a href={getRes('us_history','ccush_33_great_depression.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=GCQfMWAikyU" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the causes and effects of the Great Depression.">9-12.AH.5.EC.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">New Deal</span><a href={getRes('us_history','ccush_34_the_new_deal.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=6bMq9Ek6jnA" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Evaluate the effectiveness of New Deal programs.">9-12.AH.5.GS.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">WWII Pt 1</span><a href={getRes('us_history','ccush_35_wwii_part1.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=Objoad6rG6U" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze US entry into WWII and early campaigns.">9-12.AH.5.CC.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">WWII Pt 2</span><a href={getRes('us_history','ccush_36_wwii_part2.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=H_2FSgRyZQc" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the American homefront and the end of the war.">9-12.AH.5.GS.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Cold War</span><a href={getRes('us_history','ccush_37_the_cold_war.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=9C72ISMF_D0" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the origins and ideologies of the Cold War.">9-12.AH.5.CC.D</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">CW Asia</span><a href={getRes('us_history','ccush_38_the_cold_war_in_asia.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=Y2IcmLkuhG0" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze Cold War conflicts in Asia (Korea and Vietnam).">9-12.AH.6.PC.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Civil Rights</span><a href={getRes('us_history','ccush_39_civil_rights_and_the__1950s.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=S64zRnnn4Po" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Trace the development of the Modern Civil Rights Movement.">9-12.AH.6.PC.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">The 60s</span><a href={getRes('us_history','ccush_40_the_1960s_in_america.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=lkXFb1sMa38" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the social and political changes of the 1960s.">9-12.AH.6.CC.D</span></div></td>
                    </tr>
                    <tr>
                        <td className="col-subject text-gov">Government</td>
                        <td><div className="topic-content"><span className="topic-name">Press</span><a href={getRes('government','ccgov_26_freedom_press.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=hK5td7977QA" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze Freedom of the Press and its role in democracy.">9-12.GV.5.PC.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Search</span><a href={getRes('government','ccgov_27_search_seizure.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=_4O1OlGyTuU" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the 4th Amendment regarding search and seizure.">9-12.GV.5.GS.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Due Process</span><a href={getRes('government','ccgov_28_due_process.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=U0kXF3a8sDA" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze Due Process rights and the right to a fair trial.">9-12.GV.5.GS.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Equal Prot</span><a href={getRes('government','ccgov_29_equal_protection.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=qAgKP--3eCk" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the Equal Protection Clause of the 14th Amendment.">9-12.GV.5.CC.D</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Sex Discrim</span><a href={getRes('government','ccgov_30_sex_discrimination.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=1pyd4H887Ks" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze laws and cases regarding gender discrimination.">9-12.GV.5.PC.E</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Discrim</span><a href={getRes('government','ccgov_31_discrimination.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=7lF702d7KQM" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze landmark Civil Rights Acts and legal challenges.">9-12.GV.5.PC.E</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Affirm Act</span><a href={getRes('government','ccgov_32_affirm_action.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=gJgRRHgSJ08" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Evaluate the controversy and legality of Affirmative Action.">9-12.GV.5.CC.E</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Public Op</span><a href={getRes('government','ccgov_33_public_opinion.pdf')} target="_blank" rel="noreferrer" className="btn btn-pdf">PDF</a><a href="https://www.youtube.com/watch?v=LEkiRP8TfBU" target="_blank" rel="noreferrer" className="btn btn-vid">Video</a><span className="mls" data-desc="Analyze the formation and measurement of public opinion.">9-12.GV.2.PC.B</span></div></td>
                    </tr>
                </tbody>
            </table>
        </div>
        </>
    );
}

function EnglishContent() {
    const AZURE_BASE = "https://lrsstoragehub.blob.core.windows.net/curriculum-resources/";
    const getGrammar = (monthPrefix, type) => `${AZURE_BASE}grammar/all_grammar_${monthPrefix}_${type}.pdf`;

    return (
        <>
        <div className="double-month-block">
            <table>
                <thead>
                    <tr>
                        <th className="col-subject-header" rowSpan="2">Strand</th>
                        <th colSpan="4" className="month-header" style={{backgroundColor: '#c0392b'}}>August</th>
                        <th colSpan="4" className="month-header" style={{backgroundColor: '#e74c3c'}}>September</th>
                    </tr>
                    <tr>
                        <th className="week-header">Week 1</th><th className="week-header">Week 2</th><th className="week-header">Week 3</th><th className="week-header">Week 4</th>
                        <th className="week-header">Week 1</th><th className="week-header">Week 2</th><th className="week-header">Week 3</th><th className="week-header">Week 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="col-subject" style={{color: '#c0392b'}}>Literature</td>
                        <td><div className="topic-content"><span className="topic-name">Holes / Out of My Mind</span><span className="mls" data-desc="Read and comprehend literature, including stories, dramas, and poems.">RL.1.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Novel Study</span><span className="mls" data-desc="Determine a theme or central idea of a text and analyze its development.">RL.1.D</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Character vs. Nature</span><span className="mls" data-desc="Analyze how complex characters develop over the course of a text.">RL.1.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Realistic Fiction</span><span className="mls" data-desc="Analyze how particular elements of a story interact (e.g., setting vs plot).">RL.2.D</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Conflict Types</span><span className="mls" data-desc="Analyze how an author's choices concerning how to structure a text create effects.">RL.2.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Character vs. Society</span><span className="mls" data-desc="Analyze multiple interpretations of a story, drama, or poem.">RL.3.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">The Giver / Coraline</span><span className="mls" data-desc="Read and comprehend literature in the 6-8 text complexity band.">RL.3.D</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Dystopian Genre</span><span className="mls" data-desc="Analyze how a modern work of fiction draws on themes, patterns of events, or character types.">RL.3.C</span></div></td>
                    </tr>
                    <tr>
                        <td className="col-subject" style={{color: '#d35400'}}>Writing</td>
                        <td><div className="topic-content"><span className="topic-name">RACES Intro</span><span className="mls" data-desc="Produce clear and coherent writing in which the development, organization, and style are appropriate.">W.2.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Restate & Answer</span><span className="mls" data-desc="Introduce a topic clearly, previewing what is to follow.">W.1.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Citing Evidence</span><span className="mls" data-desc="Develop the topic with relevant, well-chosen facts, definitions, and concrete details.">W.1.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Explaining Evidence</span><span className="mls" data-desc="Use appropriate and varied transitions to create cohesion.">W.1.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Paragraph Structure</span><span className="mls" data-desc="Provide a concluding statement or section that follows from the information presented.">W.1.E</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Drafting</span><span className="mls" data-desc="Develop and strengthen writing as needed by planning, revising, editing, rewriting.">W.2.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Peer Review</span><span className="mls" data-desc="Use technology, including the Internet, to produce and publish writing.">W.2.E</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Final Polish</span><span className="mls" data-desc="Demonstrate command of the conventions of standard English grammar and usage.">L.1.A</span></div></td>
                    </tr>
                    <tr>
                        <td className="col-subject" style={{color: '#27ae60'}}>Vocab & Lang</td>
                        <td>
                            <div className="topic-content">
                                <span className="topic-name">Parts of Speech</span>
                                <a href={getGrammar('01_aug', 'slides')} target="_blank" rel="noreferrer" className="btn btn-vid">Slides</a>
                                <a href={getGrammar('01_aug', 'key')} target="_blank" rel="noreferrer" className="btn btn-pdf" style={{borderColor: '#f39c12', background:'#fef9e7', color:'#d35400'}}>Key</a>
                                <span className="mls" data-desc="Explain the function of phrases and clauses in general and their function in specific sentences.">L.1.A</span>
                            </div>
                        </td>
                        <td><div className="topic-content"><span className="topic-name">Punctuation</span><span className="mls" data-desc="Demonstrate command of the conventions of standard English capitalization, punctuation, and spelling.">L.1.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Doodle Vocab</span><span className="mls" data-desc="Determine or clarify the meaning of unknown and multiple-meaning words.">L.1.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Synonyms/Antonyms</span><span className="mls" data-desc="Demonstrate understanding of figurative language, word relationships, and nuances in word meanings.">L.2.A</span></div></td>
                        <td>
                            <div className="topic-content">
                                <span className="topic-name">Definitions</span>
                                <a href={getGrammar('02_sept', 'slides')} target="_blank" rel="noreferrer" className="btn btn-vid">Slides</a>
                                <a href={getGrammar('02_sept', 'key')} target="_blank" rel="noreferrer" className="btn btn-pdf" style={{borderColor: '#f39c12', background:'#fef9e7', color:'#d35400'}}>Key</a>
                                <span className="mls" data-desc="Acquire and use accurately grade-appropriate general academic and domain-specific words.">L.2.B</span>
                            </div>
                        </td>
                        <td><div className="topic-content"><span className="topic-name">Context Clues</span><span className="mls" data-desc="Use context (e.g., the overall meaning of a sentence or paragraph) as a clue to the meaning of a word.">L.1.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Grammar Usage</span><span className="mls" data-desc="Ensure that pronouns are in the proper case (subjective, objective, possessive).">L.1.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Morphology Intro</span><span className="mls" data-desc="Use common, grade-appropriate Greek or Latin affixes and roots as clues to the meaning of a word.">L.1.B</span></div></td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* ==================== OCT & NOV ==================== */}
        <div className="double-month-block">
            <table>
                <thead>
                    <tr>
                        <th className="col-subject-header" rowSpan="2">Strand</th>
                        <th colSpan="4" className="month-header" style={{backgroundColor: '#c0392b'}}>October</th>
                        <th colSpan="4" className="month-header" style={{backgroundColor: '#e74c3c'}}>November</th>
                    </tr>
                    <tr>
                        <th className="week-header">Week 1</th><th className="week-header">Week 2</th><th className="week-header">Week 3</th><th className="week-header">Week 4</th>
                        <th className="week-header">Week 1</th><th className="week-header">Week 2</th><th className="week-header">Week 3</th><th className="week-header">Week 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="col-subject" style={{color: '#c0392b'}}>Literature</td>
                        <td><div className="topic-content"><span className="topic-name">The Giver (Cont.)</span><span className="mls" data-desc="Analyze how particular lines of dialogue or incidents in a story or drama propel the action.">RL.1.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Sci-Fi Elements</span><span className="mls" data-desc="Compare and contrast the structure of two or more texts.">RL.2.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Theme: Memory</span><span className="mls" data-desc="Determine a theme or central idea of a text and analyze its development over the course of the text.">RL.1.D</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Symbolism</span><span className="mls" data-desc="Analyze the impact of specific word choices on meaning and tone.">RL.2.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">The Outsiders</span><span className="mls" data-desc="Analyze how differences in the points of view of the characters and the audience create such effects as suspense or humor.">RL.2.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">I Am Malala</span><span className="mls" data-desc="Determine an author's point of view or purpose in a text.">RI.2.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Autobiography</span><span className="mls" data-desc="Analyze how a text makes connections among and distinctions between individuals, ideas, or events.">RI.1.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Social Division</span><span className="mls" data-desc="Delineate and evaluate the argument and specific claims in a text.">RI.2.D</span></div></td>
                    </tr>
                    <tr>
                        <td className="col-subject" style={{color: '#d35400'}}>Writing</td>
                        <td><div className="topic-content"><span className="topic-name">Expanded Paragraphs</span><span className="mls" data-desc="Write informative/explanatory texts to examine a topic and convey ideas.">W.1.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Topic Sentences</span><span className="mls" data-desc="Introduce a topic clearly, previewing what is to follow.">W.1.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Transitions</span><span className="mls" data-desc="Use appropriate and varied transitions to create cohesion.">W.1.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Word Choice</span><span className="mls" data-desc="Use precise language and domain-specific vocabulary to inform about or explain the topic.">W.1.D</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Narrative Intro</span><span className="mls" data-desc="Write narratives to develop real or imagined experiences or events.">W.1.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Dialogue Writing</span><span className="mls" data-desc="Use narrative techniques, such as dialogue, pacing, and description, to develop experiences.">W.1.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Sensory Details</span><span className="mls" data-desc="Use precise words and phrases, relevant descriptive details, and sensory language.">W.1.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Reflective Conclusion</span><span className="mls" data-desc="Provide a conclusion that follows from and reflects on the narrated experiences or events.">W.1.B</span></div></td>
                    </tr>
                    <tr>
                        <td className="col-subject" style={{color: '#27ae60'}}>Vocab & Lang</td>
                        <td>
                            <div className="topic-content">
                                <span className="topic-name">Complex Sentences</span>
                                <a href={getGrammar('03_oct', 'slides')} target="_blank" rel="noreferrer" className="btn btn-vid">Slides</a>
                                <a href={getGrammar('03_oct', 'key')} target="_blank" rel="noreferrer" className="btn btn-pdf" style={{borderColor: '#f39c12', background:'#fef9e7', color:'#d35400'}}>Key</a>
                                <span className="mls" data-desc="Produce complete sentences, recognizing and correcting inappropriate fragments and run-ons.">L.1.A</span>
                            </div>
                        </td>
                        <td><div className="topic-content"><span className="topic-name">Commas & Clauses</span><span className="mls" data-desc="Use punctuation (comma, ellipsis, dash) to indicate a pause or break.">L.1.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Doodle Vocab 2</span><span className="mls" data-desc="Acquire and use accurately grade-appropriate general academic words.">L.2.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Shades of Meaning</span><span className="mls" data-desc="Distinguish among the connotations (associations) of words with similar denotations (definitions).">L.2.A</span></div></td>
                        <td>
                            <div className="topic-content">
                                <span className="topic-name">Prefixes</span>
                                <a href={getGrammar('04_nov', 'slides')} target="_blank" rel="noreferrer" className="btn btn-vid">Slides</a>
                                <a href={getGrammar('04_nov', 'key')} target="_blank" rel="noreferrer" className="btn btn-pdf" style={{borderColor: '#f39c12', background:'#fef9e7', color:'#d35400'}}>Key</a>
                                <span className="mls" data-desc="Use common, grade-appropriate Greek or Latin affixes as clues.">L.1.B</span>
                            </div>
                        </td>
                        <td><div className="topic-content"><span className="topic-name">Root Words</span><span className="mls" data-desc="Identify and correctly use patterns of word changes that indicate different meanings.">L.1.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Suffixes</span><span className="mls" data-desc="Determine or clarify the meaning of unknown and multiple-meaning words.">L.1.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Review</span><span className="mls" data-desc="Demonstrate command of the conventions of standard English grammar.">L.1.A</span></div></td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* ==================== DEC & JAN ==================== */}
        <div className="double-month-block">
            <table>
                <thead>
                    <tr>
                        <th className="col-subject-header" rowSpan="2">Strand</th>
                        <th colSpan="4" className="month-header" style={{backgroundColor: '#c0392b'}}>December</th>
                        <th colSpan="4" className="month-header" style={{backgroundColor: '#e74c3c'}}>January</th>
                    </tr>
                    <tr>
                        <th className="week-header">Week 1</th><th className="week-header">Week 2</th><th className="week-header">Week 3</th><th className="week-header">Week 4</th>
                        <th className="week-header">Week 1</th><th className="week-header">Week 2</th><th className="week-header">Week 3</th><th className="week-header">Week 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="col-subject" style={{color: '#c0392b'}}>Literature</td>
                        <td><div className="topic-content"><span className="topic-name">Call of the Wild</span><span className="mls" data-desc="Analyze how a modern work of fiction draws on themes from myths or traditional stories.">RL.3.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Mrs. Frisby / NIMH</span><span className="mls" data-desc="Analyze how particular elements of a story interact (e.g., how setting shapes the characters).">RL.1.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Survival Themes</span><span className="mls" data-desc="Determine a theme or central idea of a text.">RL.1.D</span></div></td>
                        <td className="cell-break">❄️ Break</td>
                        <td className="cell-break">❄️ Break</td>
                        <td><div className="topic-content"><span className="topic-name">Nature vs. Self</span><span className="mls" data-desc="Analyze how complex characters develop over the course of a text.">RL.1.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Fantasy/Sci-Fi</span><span className="mls" data-desc="Compare and contrast a written story, drama, or poem to its audio, filmed, or staged version.">RL.3.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Hero's Journey</span><span className="mls" data-desc="Analyze how an author's choices create such effects as mystery, tension, or surprise.">RL.2.B</span></div></td>
                    </tr>
                    <tr>
                        <td className="col-subject" style={{color: '#d35400'}}>Writing</td>
                        <td><div className="topic-content"><span className="topic-name">Argument Intro</span><span className="mls" data-desc="Write arguments to support claims with clear reasons and relevant evidence.">W.2.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Claim Statements</span><span className="mls" data-desc="Introduce claim(s), acknowledge and distinguish the claim(s) from alternate or opposing claims.">W.2.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Counter-Claims</span><span className="mls" data-desc="Develop claim(s) and counterclaims fairly, supplying evidence.">W.2.A</span></div></td>
                        <td className="cell-break">❄️ Break</td>
                        <td className="cell-break">❄️ Break</td>
                        <td><div className="topic-content"><span className="topic-name">Evidence Sourcing</span><span className="mls" data-desc="Gather relevant information from multiple print and digital sources.">W.3.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Credibility</span><span className="mls" data-desc="Assess the credibility and accuracy of each source.">W.3.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Citations</span><span className="mls" data-desc="Quote or paraphrase the data and conclusions of others while avoiding plagiarism.">W.3.A</span></div></td>
                    </tr>
                    <tr>
                        <td className="col-subject" style={{color: '#27ae60'}}>Vocab & Lang</td>
                        <td>
                            <div className="topic-content">
                                <span className="topic-name">Greek Roots</span>
                                <a href={getGrammar('05_dec', 'slides')} target="_blank" rel="noreferrer" className="btn btn-vid">Slides</a>
                                <a href={getGrammar('05_dec', 'key')} target="_blank" rel="noreferrer" className="btn btn-pdf" style={{borderColor: '#f39c12', background:'#fef9e7', color:'#d35400'}}>Key</a>
                                <span className="mls" data-desc="Use common, grade-appropriate Greek or Latin affixes and roots.">L.1.B</span>
                            </div>
                        </td>
                        <td><div className="topic-content"><span className="topic-name">Latin Roots</span><span className="mls" data-desc="Use common, grade-appropriate Greek or Latin affixes and roots.">L.1.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Affixes Review</span><span className="mls" data-desc="Determine or clarify the meaning of unknown words.">L.1.B</span></div></td>
                        <td className="cell-break">❄️ Break</td>
                        <td className="cell-break">❄️ Break</td>
                        <td>
                            <div className="topic-content">
                                <span className="topic-name">Active/Passive</span>
                                <a href={getGrammar('06_jan', 'slides')} target="_blank" rel="noreferrer" className="btn btn-vid">Slides</a>
                                <a href={getGrammar('06_jan', 'key')} target="_blank" rel="noreferrer" className="btn btn-pdf" style={{borderColor: '#f39c12', background:'#fef9e7', color:'#d35400'}}>Key</a>
                                <span className="mls" data-desc="Form and use verbs in the active and passive voice.">L.1.A</span>
                            </div>
                        </td>
                        <td><div className="topic-content"><span className="topic-name">Verb Moods</span><span className="mls" data-desc="Form and use verbs in the indicative, imperative, interrogative, conditional, and subjunctive mood.">L.1.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Morphology Lab</span><span className="mls" data-desc="Demonstrate understanding of figurative language and word relationships.">L.2.A</span></div></td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* ==================== FEB & MAR ==================== */}
        <div className="double-month-block">
            <table>
                <thead>
                    <tr>
                        <th className="col-subject-header" rowSpan="2">Strand</th>
                        <th colSpan="4" className="month-header" style={{backgroundColor: '#c0392b'}}>February</th>
                        <th colSpan="4" className="month-header" style={{backgroundColor: '#e74c3c'}}>March</th>
                    </tr>
                    <tr>
                        <th className="week-header">Week 1</th><th className="week-header">Week 2</th><th className="week-header">Week 3</th><th className="week-header">Week 4</th>
                        <th className="week-header">Week 1</th><th className="week-header">Week 2</th><th className="week-header">Week 3</th><th className="week-header">Week 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="col-subject" style={{color: '#c0392b'}}>Literature</td>
                        <td><div className="topic-content"><span className="topic-name">Ready Player One</span><span className="mls" data-desc="Analyze how an author draws on and transforms source material in a specific work.">RL.3.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Virtual Reality Themes</span><span className="mls" data-desc="Evaluate the advantages and disadvantages of using different mediums.">RL.3.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Quest Narratives</span><span className="mls" data-desc="Analyze the structure of texts, including how specific sentences develop the concept.">RL.2.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Maniac McGee</span><span className="mls" data-desc="Analyze how complex characters develop over the course of a text.">RL.1.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Tuck Everlasting</span><span className="mls" data-desc="Determine the meaning of words and phrases as they are used in the text.">RL.2.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Immortality Theme</span><span className="mls" data-desc="Analyze multiple interpretations of a story, drama, or poem.">RL.3.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Character Growth</span><span className="mls" data-desc="Analyze how particular lines of dialogue or incidents in a story propel the action.">RL.1.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Fantasy Elements</span><span className="mls" data-desc="Analyze how a modern work of fiction draws on themes, patterns of events, or character types.">RL.3.C</span></div></td>
                    </tr>
                    <tr>
                        <td className="col-subject" style={{color: '#d35400'}}>Writing</td>
                        <td><div className="topic-content"><span className="topic-name">Research Skills</span><span className="mls" data-desc="Conduct short as well as more sustained research projects.">W.3.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Source Integration</span><span className="mls" data-desc="Gather relevant information from multiple print and digital sources.">W.3.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Paraphrasing</span><span className="mls" data-desc="Quote or paraphrase the data and conclusions of others.">W.3.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Annotated Bib</span><span className="mls" data-desc="Follow a standard format for citation.">W.3.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Multi-Paragraph</span><span className="mls" data-desc="Produce clear and coherent writing in which the development, organization, and style are appropriate.">W.2.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Editing Workshop</span><span className="mls" data-desc="Develop and strengthen writing as needed by planning, revising, editing.">W.2.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Publishing</span><span className="mls" data-desc="Use technology to produce and publish writing.">W.2.E</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Presentation</span><span className="mls" data-desc="Present claims and findings, emphasizing salient points in a focused manner.">SL.2.A</span></div></td>
                    </tr>
                    <tr>
                        <td className="col-subject" style={{color: '#27ae60'}}>Vocab & Lang</td>
                        <td>
                            <div className="topic-content">
                                <span className="topic-name">Greek/Latin III</span>
                                <a href={getGrammar('07_feb', 'slides')} target="_blank" rel="noreferrer" className="btn btn-vid">Slides</a>
                                <a href={getGrammar('07_feb', 'key')} target="_blank" rel="noreferrer" className="btn btn-pdf" style={{borderColor: '#f39c12', background:'#fef9e7', color:'#d35400'}}>Key</a>
                                <span className="mls" data-desc="Use common, grade-appropriate Greek or Latin affixes and roots.">L.1.B</span>
                            </div>
                        </td>
                        <td><div className="topic-content"><span className="topic-name">Analogies</span><span className="mls" data-desc="Demonstrate understanding of word relationships and nuances in word meanings.">L.2.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Figures of Speech</span><span className="mls" data-desc="Interpret figures of speech (e.g., euphemism, oxymoron) in context.">L.2.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Idioms</span><span className="mls" data-desc="Interpret figures of speech (e.g., irony, puns) in context.">L.2.A</span></div></td>
                        <td>
                            <div className="topic-content">
                                <span className="topic-name">Doodle Vocab 3</span>
                                <a href={getGrammar('08_mar', 'slides')} target="_blank" rel="noreferrer" className="btn btn-vid">Slides</a>
                                <a href={getGrammar('08_mar', 'key')} target="_blank" rel="noreferrer" className="btn btn-pdf" style={{borderColor: '#f39c12', background:'#fef9e7', color:'#d35400'}}>Key</a>
                                <span className="mls" data-desc="Acquire and use accurately grade-appropriate general academic words.">L.2.B</span>
                            </div>
                        </td>
                        <td><div className="topic-content"><span className="topic-name">Grammar Review</span><span className="mls" data-desc="Demonstrate command of the conventions of standard English grammar and usage.">L.1.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Mechanics Check</span><span className="mls" data-desc="Demonstrate command of the conventions of standard English capitalization and punctuation.">L.1.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Spelling Rules</span><span className="mls" data-desc="Spell correctly.">L.1.B</span></div></td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* ==================== APR & MAY ==================== */}
        <div className="double-month-block">
            <table>
                <thead>
                    <tr>
                        <th className="col-subject-header" rowSpan="2">Strand</th>
                        <th colSpan="4" className="month-header" style={{backgroundColor: '#c0392b'}}>April</th>
                        <th colSpan="4" className="month-header" style={{backgroundColor: '#e74c3c'}}>May</th>
                    </tr>
                    <tr>
                        <th className="week-header">Week 1</th><th className="week-header">Week 2</th><th className="week-header">Week 3</th><th className="week-header">Week 4</th>
                        <th className="week-header">Week 1</th><th className="week-header">Week 2</th><th className="week-header">Week 3</th><th className="week-header">Week 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="col-subject" style={{color: '#c0392b'}}>Literature</td>
                        <td><div className="topic-content"><span className="topic-name">Greek Mythology</span><span className="mls" data-desc="Analyze how a modern work of fiction draws on themes, patterns of events, or character types from myths.">RL.3.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">The Odyssey</span><span className="mls" data-desc="Read and comprehend literature in the 6-12 text complexity band.">RL.3.D</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Epic Heroes</span><span className="mls" data-desc="Analyze how complex characters develop over the course of a text.">RL.1.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Fate vs. Free Will</span><span className="mls" data-desc="Determine a theme or central idea of a text and analyze its development.">RL.1.D</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Oral Tradition</span><span className="mls" data-desc="Analyze multiple interpretations of a story, drama, or poem.">RL.3.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Modern Retellings</span><span className="mls" data-desc="Analyze how an author draws on and transforms source material.">RL.3.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Student Choice</span><span className="mls" data-desc="Read and comprehend literature independently and proficiently.">RL.3.D</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">End of Year Review</span><span className="mls" data-desc="Demonstrate knowledge of eighteenth-, nineteenth- and early-twentieth-century foundational works.">RL.3.C</span></div></td>
                    </tr>
                    <tr>
                        <td className="col-subject" style={{color: '#d35400'}}>Writing</td>
                        <td><div className="topic-content"><span className="topic-name">Creative Writing</span><span className="mls" data-desc="Write narratives to develop real or imagined experiences or events.">W.1.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Myth Creation</span><span className="mls" data-desc="Use narrative techniques, such as dialogue, pacing, and description.">W.1.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Descriptive Lang</span><span className="mls" data-desc="Use precise words and phrases, relevant descriptive details, and sensory language.">W.1.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">RACES Review</span><span className="mls" data-desc="Produce clear and coherent writing in which the development, organization, and style are appropriate.">W.2.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Final Portfolio</span><span className="mls" data-desc="Develop and strengthen writing as needed by planning, revising, editing.">W.2.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Reflection</span><span className="mls" data-desc="Write routinely over extended time frames and shorter time frames.">W.1.C</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Goal Setting</span><span className="mls" data-desc="Produce clear and coherent writing.">W.2.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Summer Reading</span><span className="mls" data-desc="Read and comprehend complex literary and informational texts proficiently.">RL.3.D</span></div></td>
                    </tr>
                    <tr>
                        <td className="col-subject" style={{color: '#27ae60'}}>Vocab & Lang</td>
                        <td>
                            <div className="topic-content">
                                <span className="topic-name">Mythology Vocab</span>
                                <a href={getGrammar('09_apr', 'slides')} target="_blank" rel="noreferrer" className="btn btn-vid">Slides</a>
                                <a href={getGrammar('09_apr', 'key')} target="_blank" rel="noreferrer" className="btn btn-pdf" style={{borderColor: '#f39c12', background:'#fef9e7', color:'#d35400'}}>Key</a>
                                <span className="mls" data-desc="Acquire and use accurately grade-appropriate general academic and domain-specific words.">L.2.B</span>
                            </div>
                        </td>
                        <td><div className="topic-content"><span className="topic-name">Allusions</span><span className="mls" data-desc="Demonstrate understanding of figurative language, word relationships, and nuances.">L.2.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Etymology</span><span className="mls" data-desc="Use etymology (e.g., origin, history) as a clue to the meaning of a word.">L.1.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Roots Final</span><span className="mls" data-desc="Use common, grade-appropriate Greek or Latin affixes and roots.">L.1.B</span></div></td>
                        <td>
                            <div className="topic-content">
                                <span className="topic-name">Grammar Final</span>
                                <a href={getGrammar('10_may', 'slides')} target="_blank" rel="noreferrer" className="btn btn-vid">Slides</a>
                                <a href={getGrammar('10_may', 'key')} target="_blank" rel="noreferrer" className="btn btn-pdf" style={{borderColor: '#f39c12', background:'#fef9e7', color:'#d35400'}}>Key</a>
                                <span className="mls" data-desc="Demonstrate command of the conventions of standard English grammar and usage.">L.1.A</span>
                            </div>
                        </td>
                        <td><div className="topic-content"><span className="topic-name">Vocab Games</span><span className="mls" data-desc="Determine or clarify the meaning of unknown and multiple-meaning words.">L.1.B</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Presentation</span><span className="mls" data-desc="Present claims and findings, emphasizing salient points.">SL.2.A</span></div></td>
                        <td><div className="topic-content"><span className="topic-name">Wrap Up</span><span className="mls" data-desc="Engage effectively in a range of collaborative discussions.">SL.1.A</span></div></td>
                    </tr>
                </tbody>
            </table>
        </div>
        </>
    );
}