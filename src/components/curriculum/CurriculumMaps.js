import React, { useState, useEffect } from 'react';
import { Globe, BookOpen, Calculator, FlaskConical, Shapes, Layers, FileText, Video, Printer } from 'lucide-react';

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
    { id: 'social', label: 'Social Studies', icon: Globe, colorClass: 'text-teal-700' },
    { id: 'english', label: 'English (6-12)', icon: BookOpen, colorClass: 'text-slate-600' },
    { id: 'math', label: 'Math (6-12)', icon: Calculator, colorClass: 'text-blue-600' },
    { id: 'science', label: 'Science (6-12)', icon: FlaskConical, colorClass: 'text-green-600' },
    { id: 'lower', label: 'Lower Elem', icon: Shapes, colorClass: 'text-orange-500' },
    { id: 'upper', label: 'Upper Elem', icon: Layers, colorClass: 'text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 pb-16 font-sans print:bg-white print:pb-0">
      {/* --- HEADER --- */}
      <header className="bg-gradient-to-br from-slate-800 to-black text-white py-12 px-4 text-center shadow-md relative print:hidden">
        <h1 className="text-4xl font-extrabold tracking-tight m-0">LAKELAND CURRICULUM HUB</h1>
        <p className="opacity-80 mt-1 text-sm tracking-widest">ACADEMIC YEAR 2024-2025</p>
        <button 
            onClick={() => window.print()}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-all print:hidden"
            title="Print Curriculum Map"
        >
            <Printer className="w-6 h-6" />
        </button>
      </header>

      {/* PRINT HEADER (Visible only when printing) */}
      <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4 pt-4">
          <h1 className="text-2xl font-bold uppercase">Lakeland Regional School</h1>
          <h2 className="text-xl">Curriculum Map: {subjects.find(s => s.id === activeSubject)?.label}</h2>
      </div>

      {/* --- NAVIGATION DECK --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 px-5 -mt-8 mb-8 max-w-6xl mx-auto relative z-10 print:hidden">
        {subjects.map((sub) => (
            <div 
              key={sub.id} 
              className={`bg-white p-4 rounded-xl text-center cursor-pointer transition-all duration-200 border-2 shadow-sm opacity-70 flex flex-col items-center justify-center gap-2 hover:-translate-y-1 hover:opacity-100 hover:shadow-lg ${activeSubject === sub.id ? `!opacity-100 !bg-white border-current !shadow-xl -translate-y-1 ${sub.colorClass}` : 'border-transparent text-slate-500'}`}
              onClick={() => setActiveSubject(sub.id)}
            >
                <sub.icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-bold">{sub.label}</span>
            </div>
        ))}
      </div>

      <div className="p-2 md:p-4 print:p-0">
        
        {/* --- DYNAMIC CONTENT SWITCHER --- */}
        {activeSubject === 'social' && <SocialStudiesContent />}
        {activeSubject === 'english' && <EnglishContent />}
        
        {/* Placeholders for future subjects */}
        {activeSubject === 'math' && <PlaceholderContent title="Math Curriculum" Icon={Calculator} colorClass="text-blue-600" />}
        {activeSubject === 'science' && <PlaceholderContent title="Science Curriculum" Icon={FlaskConical} colorClass="text-green-600" />}
        {activeSubject === 'lower' && <PlaceholderContent title="Lower Elementary" Icon={Shapes} colorClass="text-orange-500" />}
        {activeSubject === 'upper' && <PlaceholderContent title="Upper Elementary" Icon={Layers} colorClass="text-purple-600" />}

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function PlaceholderContent({ title, Icon, colorClass }) {
    return (
        <div className="text-center p-16 bg-white rounded-xl shadow-sm max-w-3xl mx-auto">
            <div className={`text-6xl mb-5 opacity-20 flex justify-center ${colorClass}`}>
                <Icon className="w-24 h-24" />
            </div>
            <h2 className="text-slate-700 text-2xl mb-2 font-bold">{title}</h2>
            <p className="text-slate-400">This curriculum map is currently under development.</p>
        </div>
    );
}

// 2. SOCIAL STUDIES CONTENT
function SocialStudiesContent() {
    
    // Helper to build Azure links
    const getRes = (folder, file) => `${AZURE_BASE_URL}${folder}/${file}`;
    
    // Common Classes
    const tableClass = "w-full min-w-[1200px] border-collapse text-[13px] table-fixed print:min-w-0 print:w-full";
    const blockClass = "bg-white max-w-[1400px] mx-auto mb-10 rounded-xl shadow-sm border border-gray-200 overflow-x-auto print:shadow-none print:border-none print:overflow-visible print:mb-8";
    const thSubjectClass = "w-[120px] sticky left-0 bg-gray-50 z-20 font-extrabold text-gray-900 border-r-4 border-gray-400 text-center align-middle shadow-[2px_0_5px_rgba(0,0,0,0.05)] print:static print:shadow-none print:border-r";
    const thMonthClass = "text-white p-3 uppercase text-lg font-extrabold tracking-wider border-r border-white/20 print:text-black print:border-black";
    const thWeekClass = "bg-gray-700 text-gray-100 text-[11px] font-semibold p-1.5 text-center border-r border-gray-600 w-[11%]";
    const tdClass = "p-2 border-b border-r border-gray-300 align-top h-[120px] bg-white w-[11%]";
    const tdSubjectClass = "w-[120px] sticky left-0 bg-gray-50 z-20 font-extrabold border-r-4 border-gray-400 text-center align-middle shadow-[2px_0_5px_rgba(0,0,0,0.05)] print:static print:shadow-none print:border-r";
    const breakClass = "bg-slate-100 text-slate-400 text-center align-middle font-bold italic border border-dashed border-slate-300";
    
    const Topic = ({ name, code, desc, pdf, vid }) => (
        <div className="flex flex-col gap-1.5">
            <span className="font-bold text-gray-800 leading-tight text-xs">{name}</span>
            <div className="flex flex-wrap gap-1">
                {pdf && <a href={pdf} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 border border-green-300 hover:bg-green-200 transition-colors"><FileText className="w-3 h-3"/> PDF</a>}
                {vid && <a href={vid} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 transition-colors"><Video className="w-3 h-3"/> Video</a>}
            </div>
            {code && <span className="inline-block bg-gray-100 text-red-700 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-gray-200 mt-1 cursor-help relative group w-fit">
                {code}
                <span className="invisible group-hover:visible absolute bottom-[110%] left-1/2 -translate-x-1/2 bg-gray-800 text-white p-2 rounded text-[11px] w-44 z-50 text-center shadow-lg font-sans whitespace-normal pointer-events-none">
                    {desc}
                </span>
            </span>}
        </div>
    );

    return (
        <>
        {/* ==================== AUG & SEPT ==================== */}
        <div className={blockClass}>
            <table className={tableClass}>
                <thead>
                    <tr>
                        <th className={thSubjectClass} rowSpan="2">Subject</th>
                        <th colSpan="4" className={`${thMonthClass} bg-[#00695c]`}>August</th>
                        <th colSpan="4" className={`${thMonthClass} bg-[#0277bd]`}>September</th>
                    </tr>
                    <tr>
                        <th className={thWeekClass}>Week 1</th><th className={thWeekClass}>Week 2</th><th className={thWeekClass}>Week 3</th><th className={thWeekClass}>Week 4</th>
                        <th className={thWeekClass}>Week 1</th><th className={thWeekClass}>Week 2</th><th className={thWeekClass}>Week 3</th><th className={thWeekClass}>Week 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className={`${tdSubjectClass} text-green-700`}>World History</td>
                        <td className={tdClass}><Topic name="Telling Time / Early Humans" code="6-8.WH.1.CC.A" desc="Describe the impact of geography on hunter-gatherer societies and the development of the first civilizations." /></td>
                        <td className={tdClass}><Topic name="Early Humans / Stone Age" code="6-8.WH.2.GS.A" desc="Explain how physical geography influenced the migration and settlement of early human societies." /></td>
                        <td className={tdClass}><Topic name="Features of Civ" code="6-8.WH.2.PC.A" desc="Compare and contrast the defining characteristics (government, religion, specialized labor) of early river valley civilizations." /></td>
                        <td className={tdClass}><Topic name="Mesopotamia" code="6-8.WH.2.GS.B" desc="Locate major river systems and analyze their impact on the development of Mesopotamia." /></td>
                        <td className={tdClass}><Topic name="9/11 Context" code="6-8.AH.5.CC.D" desc="Analyze the causes and global consequences of modern terrorism, specifically the September 11 attacks." /></td>
                        <td className={tdClass}><Topic name="Timelines" code="6-8.WH.1.CC.A" desc="Create and use tools such as timelines and maps to analyze change and continuity over time." /></td>
                        <td className={tdClass}><Topic name="Sumer & Akkad" code="6-8.WH.2.GS.B" desc="Locate and describe the political development of Sumerian city-states and the Akkadian Empire." /></td>
                        <td className={tdClass}><Topic name="Babylon & Hittites" code="6-8.WH.2.EC.A" desc="Compare the economic systems and trade networks of the Babylonian and Hittite empires." /></td>
                    </tr>
                    <tr>
                        <td className={`${tdSubjectClass} text-blue-700`}>US History</td>
                        <td className={tdClass}><Topic name="Black Legend" pdf={getRes('us_history','ccush_01_black_legend.pdf')} vid="https://www.youtube.com/watch?v=6E9WU9TGrec" code="6-8.AH.1.CC.C" desc="Trace the development of colonial societies and analyze the impact of European exploration on Indigenous peoples." /></td>
                        <td className={tdClass}><Topic name="Colonization" pdf={getRes('us_history','ccush_02_colonizing_america.pdf')} vid="https://www.youtube.com/watch?v=o69TvQqyGdg" code="6-8.AH.3.GS.C" desc="Compare and contrast the physical geography, economy, and culture of the New England, Middle, and Southern colonies." /></td>
                        <td className={tdClass}><Topic name="Natives/English" pdf={getRes('us_history','ccush_03_natives_and_english.pdf')} vid="https://www.youtube.com/watch?v=TTYOQ05oOIc" code="6-8.AH.1.GS.B" desc="Analyze the sources of conflict and cooperation between Native American groups and European settlers." /></td>
                        <td className={tdClass}><Topic name="Quakers/Dutch" pdf={getRes('us_history','ccush_04_quakers_dutch_ladies.pdf')} vid="https://www.youtube.com/watch?v=p47tZLJbdag" code="6-8.AH.3.PC.E" desc="Analyze the diverse religious and cultural groups that settled in the colonies and their impact on society." /></td>
                        <td className={tdClass}><Topic name="9/11 Context" pdf={getRes('us_history','ush_911_background.pdf')} code="9-12.AH.6.PC.D" desc="Evaluate the impact of the September 11 attacks on American foreign and domestic policy." /></td>
                        <td className={tdClass}><Topic name="Timelines" code="6-8.AH.1.G.A" desc="Create and use geographic tools, maps, and timelines to interpret historical data." /></td>
                        <td className={tdClass}><Topic name="7 Years War" pdf={getRes('us_history','ccush_05_seven_years_war.pdf')} vid="https://www.youtube.com/watch?v=5vKGU3aEGss" code="6-8.AH.2.CC.A" desc="Analyze the causes of the American Revolution, including the impact of the French and Indian War." /></td>
                        <td className={tdClass}><Topic name="Taxes" pdf={getRes('us_history','ccush_06_taxes_and_smuggling.pdf')} vid="https://www.youtube.com/watch?v=Eytc9ZaNWyc" code="6-8.AH.2.CC.B" desc="Analyze British colonial policies and the colonial response to taxation without representation." /></td>
                    </tr>
                    <tr>
                        <td className={`${tdSubjectClass} text-red-700`}>Government</td>
                        <td className={tdClass}><Topic name="Why Gov?" pdf={getRes('government','ccgov_01_why_study_gov.pdf')} vid="https://www.youtube.com/watch?v=lrk4oY7UxpQ" code="9-12.GV.1.GS.A" desc="Apply the principles of constitutional democracy to historical and contemporary issues." /></td>
                        <td className={tdClass}><Topic name="Congress" pdf={getRes('government','ccgov_02_bicameral_congress.pdf')} vid="https://www.youtube.com/watch?v=n9defOwVWS8" code="9-12.GV.3.GS.A" desc="Analyze the structure, powers, and functions of the legislative branch." /></td>
                        <td className={tdClass}><Topic name="Checks & Balances" pdf={getRes('government','ccgov_03_checks_balances.pdf')} vid="https://www.youtube.com/watch?v=0bf3CwYCxXw" code="9-12.GV.1.PC.B" desc="Explain the concepts of separation of powers and checks and balances." /></td>
                        <td className={tdClass}><Topic name="Federalism" pdf={getRes('government','ccgov_04_federalism.pdf')} vid="https://www.youtube.com/watch?v=J0gosGXSgsI" code="9-12.GV.1.GS.B" desc="Analyze the system of federalism and the distribution of power between national and state governments." /></td>
                        <td className={tdClass}><Topic name="9/11 Context" code="9-12.GV.4.PC.D" desc="Analyze the changing relationship between national security and civil liberties in the post-9/11 era." /></td>
                        <td className={tdClass}><Topic name="Timeline" code="SS.9-12.G.1" desc="Create and use tools of social studies inquiry (timelines, maps) to organize information." /></td>
                        <td className={tdClass}><Topic name="Compromises" pdf={getRes('government','ccgov_05_con_compromise.pdf')} vid="https://www.youtube.com/watch?v=kCCmufZjayc" code="9-12.GV.1.CC.C" desc="Analyze the major debates and compromises at the Constitutional Convention." /></td>
                        <td className={tdClass}><Topic name="Elections" pdf={getRes('government','ccgov_06_congress_elections.pdf')} vid="https://www.youtube.com/watch?v=Publq_8KYms" code="9-12.GV.2.PC.A" desc="Analyze the election process and the role of political parties and voters." /></td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* ==================== OCT & NOV ==================== */}
        <div className={blockClass}>
            <table className={tableClass}>
                <thead>
                    <tr>
                        <th className={thSubjectClass} rowSpan="2">Subject</th>
                        <th colSpan="4" className={`${thMonthClass} bg-[#00695c]`}>October</th>
                        <th colSpan="4" className={`${thMonthClass} bg-[#0277bd]`}>November</th>
                    </tr>
                    <tr>
                        <th className={thWeekClass}>Week 1</th><th className={thWeekClass}>Week 2</th><th className={thWeekClass}>Week 3</th><th className={thWeekClass}>Week 4</th>
                        <th className={thWeekClass}>Week 1</th><th className={thWeekClass}>Week 2</th><th className={thWeekClass}>Week 3</th><th className={thWeekClass}>Week 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className={`${tdSubjectClass} text-green-700`}>World History</td>
                        <td className={tdClass}><Topic name="Egypt Old" code="6-8.WH.2.GS.B" desc="Locate and analyze the physical geography of the Nile River Valley." /></td>
                        <td className={tdClass}><Topic name="Egypt New" code="6-8.WH.2.PC.B" desc="Explain the concept of dynastic cycles and political power in Ancient Egypt." /></td>
                        <td className={tdClass}><Topic name="Egypt Culture" code="6-8.WH.2.PC.C" desc="Analyze the cultural achievements and religious beliefs of Ancient Egypt." /></td>
                        <td className={tdClass}><Topic name="Harappa" code="6-8.WH.2.GS.B" desc="Locate major river systems and analyze their impact on the Indus Valley Civilization." /></td>
                        <td className={tdClass}><Topic name="Caste System" code="6-8.WH.2.PC.D" desc="Analyze the social structure and development of the Caste System in ancient India." /></td>
                        <td className={tdClass}><Topic name="China Shang" code="6-8.WH.2.GS.B" desc="Locate major river systems and analyze their impact on the Shang Dynasty." /></td>
                        <td className={tdClass}><Topic name="China Zhou" code="6-8.WH.2.CC.C" desc="Trace the rise and fall of the Zhou Dynasty and the Mandate of Heaven." /></td>
                        <td className={breakClass}>🍂 Break</td>
                    </tr>
                    <tr>
                        <td className={`${tdSubjectClass} text-blue-700`}>US History</td>
                        <td className={tdClass}><Topic name="Revolution" pdf={getRes('us_history','ccush_07_revolution.pdf')} vid="https://www.youtube.com/watch?v=HlUiSBXQHCw" code="6-8.AH.2.CC.C" desc="Analyze the key events, battles, and turning points of the American Revolution." /></td>
                        <td className={tdClass}><Topic name="Constitution" pdf={getRes('us_history','ccush_08_constitution.pdf')} vid="https://www.youtube.com/watch?v=bO7FQsCcbD8" code="6-8.AH.2.GS.D" desc="Explain the major principles and structure of the US Constitution." /></td>
                        <td className={tdClass}><Topic name="Parties" pdf={getRes('us_history','ccush_09_political_parties.pdf')} vid="https://www.youtube.com/watch?v=_KnPB37YB7I" code="6-8.AH.3.CC.A" desc="Trace the development of the first political parties in the United States." /></td>
                        <td className={tdClass}><Topic name="Jefferson" pdf={getRes('us_history','ccush_10_jefferson.pdf')} vid="https://www.youtube.com/watch?v=_3Ox6vGteek" code="6-8.AH.3.GS.A" desc="Analyze the presidency of Thomas Jefferson, including the Louisiana Purchase." /></td>
                        <td className={tdClass}><Topic name="War of 1812" pdf={getRes('us_history','ccush_11_war_of_1812.pdf')} vid="https://www.youtube.com/watch?v=qMXqg2PKJZU" code="6-8.AH.3.CC.C" desc="Analyze the causes and outcomes of the War of 1812." /></td>
                        <td className={tdClass}><Topic name="Market Rev" pdf={getRes('us_history','ccush_12_market_revolution.pdf')} vid="https://www.youtube.com/watch?v=RNftCCwAol0" code="6-8.AH.3.EC.A" desc="Analyze the economic changes and technological innovations of the Market Revolution." /></td>
                        <td className={tdClass}><Topic name="Slavery" pdf={getRes('us_history','ccush_13_slavery.pdf')} vid="https://www.youtube.com/watch?v=Ajn9g5Gsv98" code="6-8.AH.3.PC.B" desc="Analyze the expansion of slavery and its impact on American society." /></td>
                        <td className={breakClass}>🍂 Break</td>
                    </tr>
                    <tr>
                        <td className={`${tdSubjectClass} text-red-700`}>Government</td>
                        <td className={tdClass}><Topic name="Committees" pdf={getRes('government','ccgov_07_congress_committees.pdf')} vid="https://www.youtube.com/watch?v=evLrZw4VKg" code="9-12.GV.3.GS.B" desc="Analyze the role and function of committees in the legislative process." /></td>
                        <td className={tdClass}><Topic name="Leadership" pdf={getRes('government','ccgov_08_congress_leadership.pdf')} vid="https://www.youtube.com/watch?v=L8urcMLgf4s" code="9-12.GV.3.GS.B" desc="Analyze the roles of congressional leadership (Speaker, Majority Leader, etc)." /></td>
                        <td className={tdClass}><Topic name="Making Laws" pdf={getRes('government','ccgov_09_bill_becomes_law.pdf')} vid="https://www.youtube.com/watch?v=66f4-Nkeyz4" code="9-12.GV.3.PC.A" desc="Explain the process of how a bill becomes a law." /></td>
                        <td className={tdClass}><Topic name="Decisions" pdf={getRes('government','ccgov_10_congress_decisions.pdf')} vid="https://www.youtube.com/watch?v=ZT9ipQdYLlo" code="9-12.GV.2.GS.B" desc="Analyze factors that influence congressional decision making." /></td>
                        <td className={tdClass}><Topic name="Pres. Power" pdf={getRes('government','ccgov_11_presidential_power.pdf')} vid="https://www.youtube.com/watch?v=5l02sK5LovI" code="9-12.GV.3.GS.C" desc="Analyze the formal powers of the presidency." /></td>
                        <td className={tdClass}><Topic name="Powers II" pdf={getRes('government','ccgov_12_pres_power_two.pdf')} vid="https://www.youtube.com/watch?v=fnYb-sb7w1k" code="9-12.GV.3.GS.C" desc="Analyze the informal powers of the president (executive orders, etc)." /></td>
                        <td className={tdClass}><Topic name="Delegation" pdf={getRes('government','ccgov_13_congress_delegation.pdf')} vid="https://www.youtube.com/watch?v=WynUSyARh4Q" code="9-12.GV.3.PC.B" desc="Explain the delegation of power to the federal bureaucracy." /></td>
                        <td className={breakClass}>🍂 Break</td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* ==================== DEC & JAN ==================== */}
        <div className={blockClass}>
            <table className={tableClass}>
                <thead>
                    <tr>
                        <th className={thSubjectClass} rowSpan="2">Subject</th>
                        <th colSpan="4" className={`${thMonthClass} bg-[#00695c]`}>December</th>
                        <th colSpan="4" className={`${thMonthClass} bg-[#0277bd]`}>January</th>
                    </tr>
                    <tr>
                        <th className={thWeekClass}>Week 1</th><th className={thWeekClass}>Week 2</th><th className={thWeekClass}>Week 3</th><th className={thWeekClass}>Week 4</th>
                        <th className={thWeekClass}>Week 1</th><th className={thWeekClass}>Week 2</th><th className={thWeekClass}>Week 3</th><th className={thWeekClass}>Week 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className={`${tdSubjectClass} text-green-700`}>World History</td>
                        <td className={tdClass}><Topic name="Minoans" code="6-8.WH.2.GS.B" desc="Locate and analyze the geography and culture of the Minoan civilization." /></td>
                        <td className={tdClass}><Topic name="Mycenaeans" code="6-8.WH.2.GS.B" desc="Locate and analyze the geography and culture of the Mycenaean civilization." /></td>
                        <td className={breakClass}>📝 Exams</td>
                        <td className={breakClass}>❄️ Break</td>
                        <td className={breakClass}>❄️ Break</td>
                        <td className={tdClass}><Topic name="Greek Polis" code="6-8.WH.2.GS.C" desc="Analyze how geography influenced the development of the Greek Polis." /></td>
                        <td className={tdClass}><Topic name="Sparta/Athens" code="6-8.WH.2.CC.C" desc="Compare and contrast the political and social structures of Sparta and Athens." /></td>
                        <td className={tdClass}><Topic name="Greek Wars" code="6-8.WH.2.CC.D" desc="Analyze the causes and effects of the Persian and Peloponnesian Wars." /></td>
                    </tr>
                    <tr>
                        <td className={`${tdSubjectClass} text-blue-700`}>US History</td>
                        <td className={tdClass}><Topic name="Jackson" pdf={getRes('us_history','ccush_14_age_of_jackson.pdf')} vid="https://www.youtube.com/watch?v=beN4qE-e5O8" code="6-8.AH.3.CC.E" desc="Analyze the political and social impact of the Age of Jackson." /></td>
                        <td className={tdClass}><Topic name="Reforms" pdf={getRes('us_history','ccush_15_reform_movements.pdf')} vid="https://www.youtube.com/watch?v=t62fUZJvjOs" code="6-8.AH.3.PC.E" desc="Evaluate the impact of Antebellum reform movements (Temperance, Abolition, etc)." /></td>
                        <td className={breakClass}>📝 Exams</td>
                        <td className={breakClass}>❄️ Break</td>
                        <td className={breakClass}>❄️ Break</td>
                        <td className={tdClass}><Topic name="Women's Mvmt" pdf={getRes('us_history','ccush_16_womens_movements.pdf')} vid="https://www.youtube.com/watch?v=fM1czS_VYDI" code="6-8.AH.3.GS.B" desc="Analyze the development of the Women's Rights Movement (Seneca Falls)." /></td>
                        <td className={tdClass}><Topic name="Westward" pdf={getRes('us_history','ccush_17_westward_expansion.pdf')} vid="https://www.youtube.com/watch?v=Q1654gQkEsm" code="6-8.AH.3.CC.F" desc="Evaluate the impact of Westward Expansion and Manifest Destiny." /></td>
                        <td className={tdClass}><Topic name="Election 1860" pdf={getRes('us_history','ccush_18_election_1860.pdf')} vid="https://www.youtube.com/watch?v=roNmeOOJCDY" code="6-8.AH.4.CC.A" desc="Analyze the Election of 1860 and the secession of Southern states." /></td>
                    </tr>
                    <tr>
                        <td className={`${tdSubjectClass} text-red-700`}>Government</td>
                        <td className={tdClass}><Topic name="Presidents" pdf={getRes('government','ccgov_14_how_presidents_govern.pdf')} vid="https://www.youtube.com/watch?v=5v7-b_Uf2H4" code="9-12.GV.3.GS.C" desc="Analyze how presidents govern and interact with other branches." /></td>
                        <td className={tdClass}><Topic name="Bureaucracy" pdf={getRes('government','ccgov_15_bureaucracy_basics.pdf')} vid="https://www.youtube.com/watch?v=I8tE048w0ro" code="9-12.GV.3.GS.E" desc="Explain the role and structure of the federal bureaucracy." /></td>
                        <td className={breakClass}>📝 Exams</td>
                        <td className={breakClass}>❄️ Break</td>
                        <td className={breakClass}>❄️ Break</td>
                        <td className={tdClass}><Topic name="Agencies" pdf={getRes('government','ccgov_16_types_of_bureaucracies.pdf')} vid="https://www.youtube.com/watch?v=t3qfM6Q_9K0" code="9-12.GV.3.PC.E" desc="Differentiate between types of bureaucratic agencies (Cabinet, Independent, etc)." /></td>
                        <td className={tdClass}><Topic name="Oversight" pdf={getRes('government','ccgov_17_controlling_bureaucracies.pdf')} vid="https://www.youtube.com/watch?v=RmSIV0G9d3Q" code="9-12.GV.3.CC.D" desc="Analyze congressional and presidential oversight of the bureaucracy." /></td>
                        <td className={tdClass}><Topic name="Legal Sys" pdf={getRes('government','ccgov_18_legal_system_basics.pdf')} vid="https://www.youtube.com/watch?v=mXw-hCQ5TE0" code="9-12.GV.3.GS.D" desc="Analyze the structure and function of the judicial branch." /></td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* ==================== FEB & MAR ==================== */}
        <div className={blockClass}>
            <table className={tableClass}>
                <thead>
                    <tr>
                        <th className={thSubjectClass} rowSpan="2">Subject</th>
                        <th colSpan="4" className={`${thMonthClass} bg-[#00695c]`}>February</th>
                        <th colSpan="4" className={`${thMonthClass} bg-[#0277bd]`}>March</th>
                    </tr>
                    <tr>
                        <th className={thWeekClass}>Week 1</th><th className={thWeekClass}>Week 2</th><th className={thWeekClass}>Week 3</th><th className={thWeekClass}>Week 4</th>
                        <th className={thWeekClass}>Week 1</th><th className={thWeekClass}>Week 2</th><th className={thWeekClass}>Week 3</th><th className={thWeekClass}>Week 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className={`${tdSubjectClass} text-green-700`}>World History</td>
                        <td className={tdClass}><Topic name="Rome Republic" code="6-8.WH.2.GS.C" desc="Locate and analyze the geography and government of the Roman Republic." /></td>
                        <td className={tdClass}><Topic name="Rome Empire" code="6-8.WH.2.PC.B" desc="Trace the transition from Roman Republic to Roman Empire." /></td>
                        <td className={tdClass}><Topic name="Christianity" code="6-8.WH.2.PC.C" desc="Analyze the rise and spread of Christianity in the Roman Empire." /></td>
                        <td className={tdClass}><Topic name="Rome Fall" code="6-8.WH.2.CC.D" desc="Analyze the political, economic, and social causes of the Fall of Rome." /></td>
                        <td className={tdClass}><Topic name="Feudalism" code="6-8.WH.3.GS.A" desc="Analyze the social and political structure of Feudalism in Europe." /></td>
                        <td className={tdClass}><Topic name="Crusades" code="6-8.WH.3.CC.A" desc="Analyze the causes and effects of the Crusades." /></td>
                        <td className={tdClass}><Topic name="Renaissance" code="6-8.WH.3.PC.B" desc="Trace the development of the Renaissance and its impact on Europe." /></td>
                        <td className={tdClass}><Topic name="Reformation" code="6-8.WH.3.PC.C" desc="Analyze the causes and effects of the Protestant Reformation." /></td>
                    </tr>
                    <tr>
                        <td className={`${tdSubjectClass} text-blue-700`}>US History</td>
                        <td className={tdClass}><Topic name="Gilded Age" pdf={getRes('us_history','ccush_26_gilded_age.pdf')} vid="https://www.youtube.com/watch?v=Spgdy3H_ens" code="9-12.AH.4.EC.C" desc="Analyze economic growth and industrialization during the Gilded Age." /></td>
                        <td className={tdClass}><Topic name="Progressive" pdf={getRes('us_history','ccush_27_progressive_era.pdf')} vid="https://www.youtube.com/watch?v=i0Q4zPR4G7M" code="9-12.AH.4.GS.C" desc="Evaluate the impact of the Progressive Era on American society." /></td>
                        <td className={tdClass}><Topic name="Imperialism" pdf={getRes('us_history','ccush_28_imperialism.pdf')} vid="https://www.youtube.com/watch?v=QfsfoFqsFk4" code="9-12.AH.4.CC.D" desc="Analyze the causes and consequences of American Imperialism." /></td>
                        <td className={tdClass}><Topic name="WWI" pdf={getRes('us_history','ccush_30_wwi.pdf')} vid="https://www.youtube.com/watch?v=y59wErqg4Xg" code="9-12.AH.4.CC.E" desc="Analyze the reasons for US entry into WWI and its impact." /></td>
                        <td className={tdClass}><Topic name="Homefront" code="9-12.AH.4.GS.D" desc="Analyze the impact of WWI on the American Homefront." /></td>
                        <td className={tdClass}><Topic name="Suffrage" pdf={getRes('us_history','ccush_31_womens_suffrage.pdf')} vid="https://www.youtube.com/watch?v=HGEMscZE5dY" code="9-12.AH.4.PC.E" desc="Analyze the struggle for and achievement of Women's Suffrage." /></td>
                        <td className={tdClass}><Topic name="Roaring 20s" pdf={getRes('us_history','ccush_32_roaring_20s.pdf')} vid="https://www.youtube.com/watch?v=VfOR1XCMf7A" code="9-12.AH.5.CC.A" desc="Analyze the cultural and social changes of the 1920s." /></td>
                        <td className={breakClass}>🌱 Break</td>
                    </tr>
                    <tr>
                        <td className={`${tdSubjectClass} text-red-700`}>Government</td>
                        <td className={tdClass}><Topic name="Courts" pdf={getRes('government','ccgov_19_structure_court_system.pdf')} vid="https://www.youtube.com/watch?v=IGsj6U2t108" code="9-12.GV.3.GS.D" desc="Analyze the structure and jurisdiction of the federal court system." /></td>
                        <td className={tdClass}><Topic name="SCOTUS" pdf={getRes('government','ccgov_20_supreme_court_pro.pdf')} vid="https://www.youtube.com/watch?v=7sUAeDk0p2g" code="9-12.GV.3.PC.C" desc="Analyze the procedures and processes of the Supreme Court." /></td>
                        <td className={tdClass}><Topic name="Review" pdf={getRes('government','ccgov_21_judicial_review.pdf')} vid="https://www.youtube.com/watch?v=mWYFwl93uCM" code="9-12.GV.3.CC.C" desc="Explain the concept and significance of Judicial Review." /></td>
                        <td className={tdClass}><Topic name="Decisions" pdf={getRes('government','ccgov_22_judicial_decisions.pdf')} vid="https://www.youtube.com/watch?v=hsx4Z7S_F80" code="9-12.GV.3.CC.D" desc="Analyze landmark Supreme Court decisions and their impact." /></td>
                        <td className={tdClass}><Topic name="Rights" pdf={getRes('government','ccgov_23_civil_rights_liberties.pdf')} vid="https://www.youtube.com/watch?v=kbwsF-A2sTg" code="9-12.GV.5.PC.A" desc="Analyze the protection of Civil Rights and Civil Liberties." /></td>
                        <td className={tdClass}><Topic name="Religion" pdf={getRes('government','ccgov_24_freedom_of_religion.pdf')} vid="https://www.youtube.com/watch?v=Y8dI1GTWCk4" code="9-12.GV.5.GS.B" desc="Analyze the Establishment and Free Exercise clauses." /></td>
                        <td className={tdClass}><Topic name="Speech" pdf={getRes('government','ccgov_25_freedom_of_speech.pdf')} vid="https://www.youtube.com/watch?v=ZleqRW7R9GE" code="9-12.GV.5.GS.B" desc="Analyze Freedom of Speech and its limitations." /></td>
                        <td className={breakClass}>🌱 Break</td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* ==================== APR & MAY ==================== */}
        <div className={blockClass}>
            <table className={tableClass}>
                <thead>
                    <tr>
                        <th className={thSubjectClass} rowSpan="2">Subject</th>
                        <th colSpan="4" className={`${thMonthClass} bg-[#00695c]`}>April</th>
                        <th colSpan="4" className={`${thMonthClass} bg-[#0277bd]`}>May</th>
                    </tr>
                    <tr>
                        <th className={thWeekClass}>Week 1</th><th className={thWeekClass}>Week 2</th><th className={thWeekClass}>Week 3</th><th className={thWeekClass}>Week 4</th>
                        <th className={thWeekClass}>Week 1</th><th className={thWeekClass}>Week 2</th><th className={thWeekClass}>Week 3</th><th className={thWeekClass}>Week 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className={`${tdSubjectClass} text-green-700`}>World History</td>
                        <td className={tdClass}><Topic name="Civil War" code="9-12.AH.4.CC.A" desc="Analyze the causes and key events of the US Civil War in a global context." /></td>
                        <td className={tdClass}><Topic name="Battles" code="9-12.AH.4.GS.B" desc="Analyze key battles and the role of geography in the Civil War." /></td>
                        <td className={tdClass}><Topic name="WWI Leadup" code="9-12.WH.4.CC.C" desc="Analyze the long-term and immediate causes of World War I." /></td>
                        <td className={tdClass}><Topic name="Trenches" code="9-12.WH.4.GS.C" desc="Analyze the impact of technology and trench warfare in WWI." /></td>
                        <td className={tdClass}><Topic name="WWII Lead" code="9-12.WH.4.PC.D" desc="Analyze the Treaty of Versailles and the rise of totalitarianism leading to WWII." /></td>
                        <td className={tdClass}><Topic name="WWII Start" code="9-12.WH.5.CC.A" desc="Analyze the causes and early events of World War II." /></td>
                        <td className={tdClass}><Topic name="D-Day/Holo" code="9-12.WH.5.GS.B" desc="Analyze the Holocaust and key battles like D-Day." /></td>
                        <td className={tdClass}><Topic name="Pearl Harbor" code="9-12.WH.5.PC.C" desc="Analyze the impact of the attack on Pearl Harbor and the Pacific Theater." /></td>
                    </tr>
                    <tr>
                        <td className={`${tdSubjectClass} text-blue-700`}>US History</td>
                        <td className={tdClass}><Topic name="Depression" pdf={getRes('us_history','ccush_33_great_depression.pdf')} vid="https://www.youtube.com/watch?v=GCQfMWAikyU" code="9-12.AH.5.EC.B" desc="Analyze the causes and effects of the Great Depression." /></td>
                        <td className={tdClass}><Topic name="New Deal" pdf={getRes('us_history','ccush_34_the_new_deal.pdf')} vid="https://www.youtube.com/watch?v=6bMq9Ek6jnA" code="9-12.AH.5.GS.B" desc="Evaluate the effectiveness of New Deal programs." /></td>
                        <td className={tdClass}><Topic name="WWII Pt 1" pdf={getRes('us_history','ccush_35_wwii_part1.pdf')} vid="https://www.youtube.com/watch?v=Objoad6rG6U" code="9-12.AH.5.CC.C" desc="Analyze US entry into WWII and early campaigns." /></td>
                        <td className={tdClass}><Topic name="WWII Pt 2" pdf={getRes('us_history','ccush_36_wwii_part2.pdf')} vid="https://www.youtube.com/watch?v=H_2FSgRyZQc" code="9-12.AH.5.GS.C" desc="Analyze the American homefront and the end of the war." /></td>
                        <td className={tdClass}><Topic name="Cold War" pdf={getRes('us_history','ccush_37_the_cold_war.pdf')} vid="https://www.youtube.com/watch?v=9C72ISMF_D0" code="9-12.AH.5.CC.D" desc="Analyze the origins and ideologies of the Cold War." /></td>
                        <td className={tdClass}><Topic name="CW Asia" pdf={getRes('us_history','ccush_38_the_cold_war_in_asia.pdf')} vid="https://www.youtube.com/watch?v=Y2IcmLkuhG0" code="9-12.AH.6.PC.A" desc="Analyze Cold War conflicts in Asia (Korea and Vietnam)." /></td>
                        <td className={tdClass}><Topic name="Civil Rights" pdf={getRes('us_history','ccush_39_civil_rights_and_the__1950s.pdf')} vid="https://www.youtube.com/watch?v=S64zRnnn4Po" code="9-12.AH.6.PC.C" desc="Trace the development of the Modern Civil Rights Movement." /></td>
                        <td className={tdClass}><Topic name="The 60s" pdf={getRes('us_history','ccush_40_the_1960s_in_america.pdf')} vid="https://www.youtube.com/watch?v=lkXFb1sMa38" code="9-12.AH.6.CC.D" desc="Analyze the social and political changes of the 1960s." /></td>
                    </tr>
                    <tr>
                        <td className={`${tdSubjectClass} text-red-700`}>Government</td>
                        <td className={tdClass}><Topic name="Press" pdf={getRes('government','ccgov_26_freedom_press.pdf')} vid="https://www.youtube.com/watch?v=hK5td7977QA" code="9-12.GV.5.PC.B" desc="Analyze Freedom of the Press and its role in democracy." /></td>
                        <td className={tdClass}><Topic name="Search" pdf={getRes('government','ccgov_27_search_seizure.pdf')} vid="https://www.youtube.com/watch?v=_4O1OlGyTuU" code="9-12.GV.5.GS.C" desc="Analyze the 4th Amendment regarding search and seizure." /></td>
                        <td className={tdClass}><Topic name="Due Process" pdf={getRes('government','ccgov_28_due_process.pdf')} vid="https://www.youtube.com/watch?v=U0kXF3a8sDA" code="9-12.GV.5.GS.C" desc="Analyze Due Process rights and the right to a fair trial." /></td>
                        <td className={tdClass}><Topic name="Equal Prot" pdf={getRes('government','ccgov_29_equal_protection.pdf')} vid="https://www.youtube.com/watch?v=qAgKP--3eCk" code="9-12.GV.5.CC.D" desc="Analyze the Equal Protection Clause of the 14th Amendment." /></td>
                        <td className={tdClass}><Topic name="Sex Discrim" pdf={getRes('government','ccgov_30_sex_discrimination.pdf')} vid="https://www.youtube.com/watch?v=1pyd4H887Ks" code="9-12.GV.5.PC.E" desc="Analyze laws and cases regarding gender discrimination." /></td>
                        <td className={tdClass}><Topic name="Discrim" pdf={getRes('government','ccgov_31_discrimination.pdf')} vid="https://www.youtube.com/watch?v=7lF702d7KQM" code="9-12.GV.5.PC.E" desc="Analyze landmark Civil Rights Acts and legal challenges." /></td>
                        <td className={tdClass}><Topic name="Affirm Act" pdf={getRes('government','ccgov_32_affirm_action.pdf')} vid="https://www.youtube.com/watch?v=gJgRRHgSJ08" code="9-12.GV.5.CC.E" desc="Evaluate the controversy and legality of Affirmative Action." /></td>
                        <td className={tdClass}><Topic name="Public Op" pdf={getRes('government','ccgov_33_public_opinion.pdf')} vid="https://www.youtube.com/watch?v=LEkiRP8TfBU" code="9-12.GV.2.PC.B" desc="Analyze the formation and measurement of public opinion." /></td>
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

    // Common Classes (reused)
    const tableClass = "w-full min-w-[1200px] border-collapse text-[13px] table-fixed print:min-w-0 print:w-full";
    const blockClass = "bg-white max-w-[1400px] mx-auto mb-10 rounded-xl shadow-sm border border-gray-200 overflow-x-auto print:shadow-none print:border-none print:overflow-visible print:mb-8";
    const thSubjectClass = "w-[120px] sticky left-0 bg-gray-50 z-20 font-extrabold text-gray-900 border-r-4 border-gray-400 text-center align-middle shadow-[2px_0_5px_rgba(0,0,0,0.05)] print:static print:shadow-none print:border-r";
    const thMonthClass = "text-white p-3 uppercase text-lg font-extrabold tracking-wider border-r border-white/20 print:text-black print:border-black";
    const thWeekClass = "bg-gray-700 text-gray-100 text-[11px] font-semibold p-1.5 text-center border-r border-gray-600 w-[11%]";
    const tdClass = "p-2 border-b border-r border-gray-300 align-top h-[120px] bg-white w-[11%]";
    const tdSubjectClass = "w-[120px] sticky left-0 bg-gray-50 z-20 font-extrabold border-r-4 border-gray-400 text-center align-middle shadow-[2px_0_5px_rgba(0,0,0,0.05)] print:static print:shadow-none print:border-r";
    const breakClass = "bg-slate-100 text-slate-400 text-center align-middle font-bold italic border border-dashed border-slate-300";

    const Topic = ({ name, code, desc, slides, keyPdf }) => (
        <div className="flex flex-col gap-1.5">
            <span className="font-bold text-gray-800 leading-tight text-xs">{name}</span>
            <div className="flex flex-wrap gap-1">
                {slides && <a href={slides} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 transition-colors">Slides</a>}
                {keyPdf && <a href={keyPdf} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-50 text-orange-700 border border-yellow-400 hover:bg-yellow-100 transition-colors">Key</a>}
            </div>
            {code && <span className="inline-block bg-gray-100 text-red-700 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-gray-200 mt-1 cursor-help relative group w-fit">
                {code}
                <span className="invisible group-hover:visible absolute bottom-[110%] left-1/2 -translate-x-1/2 bg-gray-800 text-white p-2 rounded text-[11px] w-44 z-50 text-center shadow-lg font-sans whitespace-normal pointer-events-none">
                    {desc}
                </span>
            </span>}
        </div>
    );

    return (
        <>
        <div className={blockClass}>
            <table className={tableClass}>
                <thead>
                    <tr>
                        <th className={thSubjectClass} rowSpan="2">Strand</th>
                        <th colSpan="4" className={`${thMonthClass} bg-[#5e35b1]`}>August</th>
                        <th colSpan="4" className={`${thMonthClass} bg-[#1e88e5]`}>September</th>
                    </tr>
                    <tr>
                        <th className={thWeekClass}>Week 1</th><th className={thWeekClass}>Week 2</th><th className={thWeekClass}>Week 3</th><th className={thWeekClass}>Week 4</th>
                        <th className={thWeekClass}>Week 1</th><th className={thWeekClass}>Week 2</th><th className={thWeekClass}>Week 3</th><th className={thWeekClass}>Week 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className={`${tdSubjectClass} text-[#4527a0]`}>Literature</td>
                        <td className={tdClass}><Topic name="Holes / Out of My Mind" code="RL.1.A" desc="Read and comprehend literature, including stories, dramas, and poems." /></td>
                        <td className={tdClass}><Topic name="Novel Study" code="RL.1.D" desc="Determine a theme or central idea of a text and analyze its development." /></td>
                        <td className={tdClass}><Topic name="Character vs. Nature" code="RL.1.B" desc="Analyze how complex characters develop over the course of a text." /></td>
                        <td className={tdClass}><Topic name="Realistic Fiction" code="RL.2.D" desc="Analyze how particular elements of a story interact (e.g., setting vs plot)." /></td>
                        <td className={tdClass}><Topic name="Conflict Types" code="RL.2.B" desc="Analyze how an author's choices concerning how to structure a text create effects." /></td>
                        <td className={tdClass}><Topic name="Character vs. Society" code="RL.3.A" desc="Analyze multiple interpretations of a story, drama, or poem." /></td>
                        <td className={tdClass}><Topic name="The Giver / Coraline" code="RL.3.D" desc="Read and comprehend literature in the 6-8 text complexity band." /></td>
                        <td className={tdClass}><Topic name="Dystopian Genre" code="RL.3.C" desc="Analyze how a modern work of fiction draws on themes, patterns of events, or character types." /></td>
                    </tr>
                    <tr>
                        <td className={`${tdSubjectClass} text-[#d84315]`}>Writing</td>
                        <td className={tdClass}><Topic name="RACES Intro" code="W.2.A" desc="Produce clear and coherent writing in which the development, organization, and style are appropriate." /></td>
                        <td className={tdClass}><Topic name="Restate & Answer" code="W.1.A" desc="Introduce a topic clearly, previewing what is to follow." /></td>
                        <td className={tdClass}><Topic name="Citing Evidence" code="W.1.B" desc="Develop the topic with relevant, well-chosen facts, definitions, and concrete details." /></td>
                        <td className={tdClass}><Topic name="Explaining Evidence" code="W.1.C" desc="Use appropriate and varied transitions to create cohesion." /></td>
                        <td className={tdClass}><Topic name="Paragraph Structure" code="W.1.E" desc="Provide a concluding statement or section that follows from the information presented." /></td>
                        <td className={tdClass}><Topic name="Drafting" code="W.2.A" desc="Develop and strengthen writing as needed by planning, revising, editing, rewriting." /></td>
                        <td className={tdClass}><Topic name="Peer Review" code="W.2.E" desc="Use technology, including the Internet, to produce and publish writing." /></td>
                        <td className={tdClass}><Topic name="Final Polish" code="L.1.A" desc="Demonstrate command of the conventions of standard English grammar and usage." /></td>
                    </tr>
                    <tr>
                        <td className={`${tdSubjectClass} text-[#00695c]`}>Vocab & Lang</td>
                        <td className={tdClass}><Topic name="Parts of Speech" slides={getGrammar('01_aug', 'slides')} keyPdf={getGrammar('01_aug', 'key')} code="L.1.A" desc="Explain the function of phrases and clauses in general and their function in specific sentences." /></td>
                        <td className={tdClass}><Topic name="Punctuation" code="L.1.B" desc="Demonstrate command of the conventions of standard English capitalization, punctuation, and spelling." /></td>
                        <td className={tdClass}><Topic name="Doodle Vocab" code="L.1.B" desc="Determine or clarify the meaning of unknown and multiple-meaning words." /></td>
                        <td className={tdClass}><Topic name="Synonyms/Antonyms" code="L.2.A" desc="Demonstrate understanding of figurative language, word relationships, and nuances in word meanings." /></td>
                        <td className={tdClass}><Topic name="Definitions" slides={getGrammar('02_sept', 'slides')} keyPdf={getGrammar('02_sept', 'key')} code="L.2.B" desc="Acquire and use accurately grade-appropriate general academic and domain-specific words." /></td>
                        <td className={tdClass}><Topic name="Context Clues" code="L.1.B" desc="Use context (e.g., the overall meaning of a sentence or paragraph) as a clue to the meaning of a word." /></td>
                        <td className={tdClass}><Topic name="Grammar Usage" code="L.1.A" desc="Ensure that pronouns are in the proper case (subjective, objective, possessive)." /></td>
                        <td className={tdClass}><Topic name="Morphology Intro" code="L.1.B" desc="Use common, grade-appropriate Greek or Latin affixes and roots as clues to the meaning of a word." /></td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* ==================== OCT & NOV ==================== */}
        <div className={blockClass}>
            <table className={tableClass}>
                <thead>
                    <tr>
                        <th className={thSubjectClass} rowSpan="2">Strand</th>
                        <th colSpan="4" className={`${thMonthClass} bg-[#5e35b1]`}>October</th>
                        <th colSpan="4" className={`${thMonthClass} bg-[#1e88e5]`}>November</th>
                    </tr>
                    <tr>
                        <th className={thWeekClass}>Week 1</th><th className={thWeekClass}>Week 2</th><th className={thWeekClass}>Week 3</th><th className={thWeekClass}>Week 4</th>
                        <th className={thWeekClass}>Week 1</th><th className={thWeekClass}>Week 2</th><th className={thWeekClass}>Week 3</th><th className={thWeekClass}>Week 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className={`${tdSubjectClass} text-[#4527a0]`}>Literature</td>
                        <td className={tdClass}><Topic name="The Giver (Cont.)" code="RL.1.A" desc="Analyze how particular lines of dialogue or incidents in a story or drama propel the action." /></td>
                        <td className={tdClass}><Topic name="Sci-Fi Elements" code="RL.2.A" desc="Compare and contrast the structure of two or more texts." /></td>
                        <td className={tdClass}><Topic name="Theme: Memory" code="RL.1.D" desc="Determine a theme or central idea of a text and analyze its development over the course of the text." /></td>
                        <td className={tdClass}><Topic name="Symbolism" code="RL.2.B" desc="Analyze the impact of specific word choices on meaning and tone." /></td>
                        <td className={tdClass}><Topic name="The Outsiders" code="RL.2.C" desc="Analyze how differences in the points of view of the characters and the audience create such effects as suspense or humor." /></td>
                        <td className={tdClass}><Topic name="I Am Malala" code="RI.2.C" desc="Determine an author's point of view or purpose in a text." /></td>
                        <td className={tdClass}><Topic name="Autobiography" code="RI.1.C" desc="Analyze how a text makes connections among and distinctions between individuals, ideas, or events." /></td>
                        <td className={tdClass}><Topic name="Social Division" code="RI.2.D" desc="Delineate and evaluate the argument and specific claims in a text." /></td>
                    </tr>
                    <tr>
                        <td className={`${tdSubjectClass} text-[#d84315]`}>Writing</td>
                        <td className={tdClass}><Topic name="Expanded Paragraphs" code="W.1.A" desc="Write informative/explanatory texts to examine a topic and convey ideas." /></td>
                        <td className={tdClass}><Topic name="Topic Sentences" code="W.1.A" desc="Introduce a topic clearly, previewing what is to follow." /></td>
                        <td className={tdClass}><Topic name="Transitions" code="W.1.C" desc="Use appropriate and varied transitions to create cohesion." /></td>
                        <td className={tdClass}><Topic name="Word Choice" code="W.1.D" desc="Use precise language and domain-specific vocabulary to inform about or explain the topic." /></td>
                        <td className={tdClass}><Topic name="Narrative Intro" code="W.1.B" desc="Write narratives to develop real or imagined experiences or events." /></td>
                        <td className={tdClass}><Topic name="Dialogue Writing" code="W.1.B" desc="Use narrative techniques, such as dialogue, pacing, and description, to develop experiences." /></td>
                        <td className={tdClass}><Topic name="Sensory Details" code="W.1.B" desc="Use precise words and phrases, relevant descriptive details, and sensory language." /></td>
                        <td className={tdClass}><Topic name="Reflective Conclusion" code="W.1.B" desc="Provide a conclusion that follows from and reflects on the narrated experiences or events." /></td>
                    </tr>
                    <tr>
                        <td className={`${tdSubjectClass} text-[#00695c]`}>Vocab & Lang</td>
                        <td className={tdClass}><Topic name="Complex Sentences" slides={getGrammar('03_oct', 'slides')} keyPdf={getGrammar('03_oct', 'key')} code="L.1.A" desc="Produce complete sentences, recognizing and correcting inappropriate fragments and run-ons." /></td>
                        <td className={tdClass}><Topic name="Commas & Clauses" code="L.1.B" desc="Use punctuation (comma, ellipsis, dash) to indicate a pause or break." /></td>
                        <td className={tdClass}><Topic name="Doodle Vocab 2" code="L.2.B" desc="Acquire and use accurately grade-appropriate general academic words." /></td>
                        <td className={tdClass}><Topic name="Shades of Meaning" code="L.2.A" desc="Distinguish among the connotations (associations) of words with similar denotations (definitions)." /></td>
                        <td className={tdClass}><Topic name="Prefixes" slides={getGrammar('04_nov', 'slides')} keyPdf={getGrammar('04_nov', 'key')} code="L.1.B" desc="Use common, grade-appropriate Greek or Latin affixes as clues." /></td>
                        <td className={tdClass}><Topic name="Root Words" code="L.1.B" desc="Identify and correctly use patterns of word changes that indicate different meanings." /></td>
                        <td className={tdClass}><Topic name="Suffixes" code="L.1.B" desc="Determine or clarify the meaning of unknown and multiple-meaning words." /></td>
                        <td className={tdClass}><Topic name="Review" code="L.1.A" desc="Demonstrate command of the conventions of standard English grammar." /></td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* ==================== DEC & JAN ==================== */}
        <div className={blockClass}>
            <table className={tableClass}>
                <thead>
                    <tr>
                        <th className={thSubjectClass} rowSpan="2">Strand</th>
                        <th colSpan="4" className={`${thMonthClass} bg-[#5e35b1]`}>December</th>
                        <th colSpan="4" className={`${thMonthClass} bg-[#1e88e5]`}>January</th>
                    </tr>
                    <tr>
                        <th className={thWeekClass}>Week 1</th><th className={thWeekClass}>Week 2</th><th className={thWeekClass}>Week 3</th><th className={thWeekClass}>Week 4</th>
                        <th className={thWeekClass}>Week 1</th><th className={thWeekClass}>Week 2</th><th className={thWeekClass}>Week 3</th><th className={thWeekClass}>Week 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className={`${tdSubjectClass} text-[#4527a0]`}>Literature</td>
                        <td className={tdClass}><Topic name="Call of the Wild" code="RL.3.C" desc="Analyze how a modern work of fiction draws on themes from myths or traditional stories." /></td>
                        <td className={tdClass}><Topic name="Mrs. Frisby / NIMH" code="RL.1.B" desc="Analyze how particular elements of a story interact (e.g., how setting shapes the characters)." /></td>
                        <td className={tdClass}><Topic name="Survival Themes" code="RL.1.D" desc="Determine a theme or central idea of a text." /></td>
                        <td className={breakClass}>❄️ Break</td>
                        <td className={breakClass}>❄️ Break</td>
                        <td className={tdClass}><Topic name="Nature vs. Self" code="RL.1.B" desc="Analyze how complex characters develop over the course of a text." /></td>
                        <td className={tdClass}><Topic name="Fantasy/Sci-Fi" code="RL.3.B" desc="Compare and contrast a written story, drama, or poem to its audio, filmed, or staged version." /></td>
                        <td className={tdClass}><Topic name="Hero's Journey" code="RL.2.B" desc="Analyze how an author's choices create such effects as mystery, tension, or surprise." /></td>
                    </tr>
                    <tr>
                        <td className={`${tdSubjectClass} text-[#d84315]`}>Writing</td>
                        <td className={tdClass}><Topic name="Argument Intro" code="W.2.A" desc="Write arguments to support claims with clear reasons and relevant evidence." /></td>
                        <td className={tdClass}><Topic name="Claim Statements" code="W.2.A" desc="Introduce claim(s), acknowledge and distinguish the claim(s) from alternate or opposing claims." /></td>
                        <td className={tdClass}><Topic name="Counter-Claims" code="W.2.A" desc="Develop claim(s) and counterclaims fairly, supplying evidence." /></td>
                        <td className={breakClass}>❄️ Break</td>
                        <td className={breakClass}>❄️ Break</td>
                        <td className={tdClass}><Topic name="Evidence Sourcing" code="W.3.A" desc="Gather relevant information from multiple print and digital sources." /></td>
                        <td className={tdClass}><Topic name="Credibility" code="W.3.A" desc="Assess the credibility and accuracy of each source." /></td>
                        <td className={tdClass}><Topic name="Citations" code="W.3.A" desc="Quote or paraphrase the data and conclusions of others while avoiding plagiarism." /></td>
                    </tr>
                    <tr>
                        <td className={`${tdSubjectClass} text-[#00695c]`}>Vocab & Lang</td>
                        <td className={tdClass}><Topic name="Greek Roots" slides={getGrammar('05_dec', 'slides')} keyPdf={getGrammar('05_dec', 'key')} code="L.1.B" desc="Use common, grade-appropriate Greek or Latin affixes and roots." /></td>
                        <td className={tdClass}><Topic name="Latin Roots" code="L.1.B" desc="Use common, grade-appropriate Greek or Latin affixes and roots." /></td>
                        <td className={tdClass}><Topic name="Affixes Review" code="L.1.B" desc="Determine or clarify the meaning of unknown words." /></td>
                        <td className={breakClass}>❄️ Break</td>
                        <td className={breakClass}>❄️ Break</td>
                        <td className={tdClass}><Topic name="Active/Passive" slides={getGrammar('06_jan', 'slides')} keyPdf={getGrammar('06_jan', 'key')} code="L.1.A" desc="Form and use verbs in the active and passive voice." /></td>
                        <td className={tdClass}><Topic name="Verb Moods" code="L.1.A" desc="Form and use verbs in the indicative, imperative, interrogative, conditional, and subjunctive mood." /></td>
                        <td className={tdClass}><Topic name="Morphology Lab" code="L.2.A" desc="Demonstrate understanding of figurative language and word relationships." /></td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* ==================== FEB & MAR ==================== */}
        <div className={blockClass}>
            <table className={tableClass}>
                <thead>
                    <tr>
                        <th className={thSubjectClass} rowSpan="2">Strand</th>
                        <th colSpan="4" className={`${thMonthClass} bg-[#5e35b1]`}>February</th>
                        <th colSpan="4" className={`${thMonthClass} bg-[#1e88e5]`}>March</th>
                    </tr>
                    <tr>
                        <th className={thWeekClass}>Week 1</th><th className={thWeekClass}>Week 2</th><th className={thWeekClass}>Week 3</th><th className={thWeekClass}>Week 4</th>
                        <th className={thWeekClass}>Week 1</th><th className={thWeekClass}>Week 2</th><th className={thWeekClass}>Week 3</th><th className={thWeekClass}>Week 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className={`${tdSubjectClass} text-[#4527a0]`}>Literature</td>
                        <td className={tdClass}><Topic name="Ready Player One" code="RL.3.C" desc="Analyze how an author draws on and transforms source material in a specific work." /></td>
                        <td className={tdClass}><Topic name="Virtual Reality Themes" code="RL.3.B" desc="Evaluate the advantages and disadvantages of using different mediums." /></td>
                        <td className={tdClass}><Topic name="Quest Narratives" code="RL.2.B" desc="Analyze the structure of texts, including how specific sentences develop the concept." /></td>
                        <td className={tdClass}><Topic name="Maniac McGee" code="RL.1.B" desc="Analyze how complex characters develop over the course of a text." /></td>
                        <td className={tdClass}><Topic name="Tuck Everlasting" code="RL.2.A" desc="Determine the meaning of words and phrases as they are used in the text." /></td>
                        <td className={tdClass}><Topic name="Immortality Theme" code="RL.3.A" desc="Analyze multiple interpretations of a story, drama, or poem." /></td>
                        <td className={tdClass}><Topic name="Character Growth" code="RL.1.A" desc="Analyze how particular lines of dialogue or incidents in a story propel the action." /></td>
                        <td className={tdClass}><Topic name="Fantasy Elements" code="RL.3.C" desc="Analyze how a modern work of fiction draws on themes, patterns of events, or character types." /></td>
                    </tr>
                    <tr>
                        <td className={`${tdSubjectClass} text-[#d84315]`}>Writing</td>
                        <td className={tdClass}><Topic name="Research Skills" code="W.3.A" desc="Conduct short as well as more sustained research projects." /></td>
                        <td className={tdClass}><Topic name="Source Integration" code="W.3.A" desc="Gather relevant information from multiple print and digital sources." /></td>
                        <td className={tdClass}><Topic name="Paraphrasing" code="W.3.A" desc="Quote or paraphrase the data and conclusions of others." /></td>
                        <td className={tdClass}><Topic name="Annotated Bib" code="W.3.A" desc="Follow a standard format for citation." /></td>
                        <td className={tdClass}><Topic name="Multi-Paragraph" code="W.2.A" desc="Produce clear and coherent writing in which the development, organization, and style are appropriate." /></td>
                        <td className={tdClass}><Topic name="Editing Workshop" code="W.2.A" desc="Develop and strengthen writing as needed by planning, revising, editing." /></td>
                        <td className={tdClass}><Topic name="Publishing" code="W.2.E" desc="Use technology to produce and publish writing." /></td>
                        <td className={tdClass}><Topic name="Presentation" code="SL.2.A" desc="Present claims and findings, emphasizing salient points in a focused manner." /></td>
                    </tr>
                    <tr>
                        <td className={`${tdSubjectClass} text-[#00695c]`}>Vocab & Lang</td>
                        <td className={tdClass}><Topic name="Greek/Latin III" slides={getGrammar('07_feb', 'slides')} keyPdf={getGrammar('07_feb', 'key')} code="L.1.B" desc="Use common, grade-appropriate Greek or Latin affixes and roots." /></td>
                        <td className={tdClass}><Topic name="Analogies" code="L.2.A" desc="Demonstrate understanding of word relationships and nuances in word meanings." /></td>
                        <td className={tdClass}><Topic name="Figures of Speech" code="L.2.A" desc="Interpret figures of speech (e.g., euphemism, oxymoron) in context." /></td>
                        <td className={tdClass}><Topic name="Idioms" code="L.2.A" desc="Interpret figures of speech (e.g., irony, puns) in context." /></td>
                        <td className={tdClass}><Topic name="Doodle Vocab 3" slides={getGrammar('08_mar', 'slides')} keyPdf={getGrammar('08_mar', 'key')} code="L.2.B" desc="Acquire and use accurately grade-appropriate general academic words." /></td>
                        <td className={tdClass}><Topic name="Grammar Review" code="L.1.A" desc="Demonstrate command of the conventions of standard English grammar and usage." /></td>
                        <td className={tdClass}><Topic name="Mechanics Check" code="L.1.B" desc="Demonstrate command of the conventions of standard English capitalization and punctuation." /></td>
                        <td className={tdClass}><Topic name="Spelling Rules" code="L.1.B" desc="Spell correctly." /></td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* ==================== APR & MAY ==================== */}
        <div className={blockClass}>
            <table className={tableClass}>
                <thead>
                    <tr>
                        <th className={thSubjectClass} rowSpan="2">Strand</th>
                        <th colSpan="4" className={`${thMonthClass} bg-[#5e35b1]`}>April</th>
                        <th colSpan="4" className={`${thMonthClass} bg-[#1e88e5]`}>May</th>
                    </tr>
                    <tr>
                        <th className={thWeekClass}>Week 1</th><th className={thWeekClass}>Week 2</th><th className={thWeekClass}>Week 3</th><th className={thWeekClass}>Week 4</th>
                        <th className={thWeekClass}>Week 1</th><th className={thWeekClass}>Week 2</th><th className={thWeekClass}>Week 3</th><th className={thWeekClass}>Week 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className={`${tdSubjectClass} text-[#4527a0]`}>Literature</td>
                        <td className={tdClass}><Topic name="Greek Mythology" code="RL.3.C" desc="Analyze how a modern work of fiction draws on themes, patterns of events, or character types from myths." /></td>
                        <td className={tdClass}><Topic name="The Odyssey" code="RL.3.D" desc="Read and comprehend literature in the 6-12 text complexity band." /></td>
                        <td className={tdClass}><Topic name="Epic Heroes" code="RL.1.B" desc="Analyze how complex characters develop over the course of a text." /></td>
                        <td className={tdClass}><Topic name="Fate vs. Free Will" code="RL.1.D" desc="Determine a theme or central idea of a text and analyze its development." /></td>
                        <td className={tdClass}><Topic name="Oral Tradition" code="RL.3.A" desc="Analyze multiple interpretations of a story, drama, or poem." /></td>
                        <td className={tdClass}><Topic name="Modern Retellings" code="RL.3.C" desc="Analyze how an author draws on and transforms source material." /></td>
                        <td className={tdClass}><Topic name="Student Choice" code="RL.3.D" desc="Read and comprehend literature independently and proficiently." /></td>
                        <td className={tdClass}><Topic name="End of Year Review" code="RL.3.C" desc="Demonstrate knowledge of eighteenth-, nineteenth- and early-twentieth-century foundational works." /></td>
                    </tr>
                    <tr>
                        <td className={`${tdSubjectClass} text-[#d84315]`}>Writing</td>
                        <td className={tdClass}><Topic name="Creative Writing" code="W.1.B" desc="Write narratives to develop real or imagined experiences or events." /></td>
                        <td className={tdClass}><Topic name="Myth Creation" code="W.1.B" desc="Use narrative techniques, such as dialogue, pacing, and description." /></td>
                        <td className={tdClass}><Topic name="Descriptive Lang" code="W.1.B" desc="Use precise words and phrases, relevant descriptive details, and sensory language." /></td>
                        <td className={tdClass}><Topic name="RACES Review" code="W.2.A" desc="Produce clear and coherent writing in which the development, organization, and style are appropriate." /></td>
                        <td className={tdClass}><Topic name="Final Portfolio" code="W.2.A" desc="Develop and strengthen writing as needed by planning, revising, editing." /></td>
                        <td className={tdClass}><Topic name="Reflection" code="W.1.C" desc="Write routinely over extended time frames and shorter time frames." /></td>
                        <td className={tdClass}><Topic name="Goal Setting" code="W.2.A" desc="Produce clear and coherent writing." /></td>
                        <td className={tdClass}><Topic name="Summer Reading" code="RL.3.D" desc="Read and comprehend complex literary and informational texts proficiently." /></td>
                    </tr>
                    <tr>
                        <td className={`${tdSubjectClass} text-[#00695c]`}>Vocab & Lang</td>
                        <td className={tdClass}><Topic name="Mythology Vocab" slides={getGrammar('09_apr', 'slides')} keyPdf={getGrammar('09_apr', 'key')} code="L.2.B" desc="Acquire and use accurately grade-appropriate general academic and domain-specific words." /></td>
                        <td className={tdClass}><Topic name="Allusions" code="L.2.A" desc="Demonstrate understanding of figurative language, word relationships, and nuances." /></td>
                        <td className={tdClass}><Topic name="Etymology" code="L.1.B" desc="Use etymology (e.g., origin, history) as a clue to the meaning of a word." /></td>
                        <td className={tdClass}><Topic name="Roots Final" code="L.1.B" desc="Use common, grade-appropriate Greek or Latin affixes and roots." /></td>
                        <td className={tdClass}><Topic name="Grammar Final" slides={getGrammar('10_may', 'slides')} keyPdf={getGrammar('10_may', 'key')} code="L.1.A" desc="Demonstrate command of the conventions of standard English grammar and usage." /></td>
                        <td className={tdClass}><Topic name="Vocab Games" code="L.1.B" desc="Determine or clarify the meaning of unknown and multiple-meaning words." /></td>
                        <td className={tdClass}><Topic name="Presentation" code="SL.2.A" desc="Present claims and findings, emphasizing salient points." /></td>
                        <td className={tdClass}><Topic name="Wrap Up" code="SL.1.A" desc="Engage effectively in a range of collaborative discussions." /></td>
                    </tr>
                </tbody>
            </table>
        </div>
        </>
    );
}