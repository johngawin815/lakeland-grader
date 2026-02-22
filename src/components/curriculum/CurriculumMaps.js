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
    { id: 'social', label: 'Social Studies', icon: Globe, colorClass: 'text-indigo-500' },
    { id: 'english', label: 'English (6-12)', icon: BookOpen, colorClass: 'text-indigo-500' },
    { id: 'math', label: 'Math (6-12)', icon: Calculator, colorClass: 'text-indigo-500' },
    { id: 'science', label: 'Science (6-12)', icon: FlaskConical, colorClass: 'text-indigo-500' },
    { id: 'lower', label: 'Lower Elem', icon: Shapes, colorClass: 'text-indigo-500' },
    { id: 'upper', label: 'Upper Elem', icon: Layers, colorClass: 'text-indigo-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-16 font-sans print:bg-white print:pb-0">
      {/* --- HEADER --- */}
      <header className="bg-slate-900 text-white py-12 px-4 text-center shadow-2xl shadow-slate-900/40 relative print:hidden">
        <h1 className="text-4xl font-extrabold tracking-tight m-0">LAKELAND CURRICULUM HUB</h1>
        <p className="opacity-80 mt-1 text-sm tracking-widest">ACADEMIC YEAR 2024-2025</p>
        <button 
            onClick={() => window.print()}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-all print:hidden border border-white/10"
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 px-5 -mt-10 mb-8 max-w-6xl mx-auto relative z-10 print:hidden">
        {subjects.map((sub) => (
            <div 
              key={sub.id} 
              className={`bg-white/60 backdrop-blur-lg p-4 rounded-2xl text-center cursor-pointer transition-all duration-300 border shadow-lg flex flex-col items-center justify-center gap-2 hover:-translate-y-1.5 hover:shadow-xl ${activeSubject === sub.id ? `shadow-indigo-200/50 border-indigo-300/50` : 'shadow-slate-200/50 border-slate-200/50'}`}
              onClick={() => setActiveSubject(sub.id)}
            >
                <div className={`p-3 rounded-xl bg-indigo-100/80 ${activeSubject === sub.id ? 'text-indigo-600' : 'text-slate-500'}`}>
                    <sub.icon className="w-7 h-7" />
                </div>
                <span className={`text-xs font-bold ${activeSubject === sub.id ? 'text-indigo-800' : 'text-slate-700'}`}>{sub.label}</span>
            </div>
        ))}
      </div>

      <div className="p-2 md:p-4 print:p-0">
        
        {/* --- DYNAMIC CONTENT SWITCHER --- */}
        {activeSubject === 'social' && <SocialStudiesContent />}
        {activeSubject === 'english' && <EnglishContent />}
        
        {/* Placeholders for future subjects */}
        {activeSubject === 'math' && <PlaceholderContent title="Math Curriculum" Icon={Calculator} />}
        {activeSubject === 'science' && <PlaceholderContent title="Science Curriculum" Icon={FlaskConical} />}
        {activeSubject === 'lower' && <PlaceholderContent title="Lower Elementary" Icon={Shapes} />}
        {activeSubject === 'upper' && <PlaceholderContent title="Upper Elementary" Icon={Layers} />}

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function PlaceholderContent({ title, Icon }) {
    return (
        <div className="text-center p-16 bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-2xl shadow-slate-200/60 max-w-3xl mx-auto">
            <div className="text-6xl mb-5 flex justify-center text-indigo-200">
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
    const tableClass = "w-full min-w-[1200px] border-collapse text-sm table-fixed print:min-w-0 print:w-full";
    const blockClass = "bg-white/70 backdrop-blur-xl max-w-[1400px] mx-auto mb-10 rounded-2xl shadow-2xl shadow-slate-200/60 border border-slate-200/50 overflow-x-auto print:shadow-none print:border-none print:overflow-visible print:mb-8";
    const thSubjectClass = "w-[120px] sticky left-0 bg-slate-100/80 backdrop-blur-sm z-20 font-extrabold text-slate-800 border-r-4 border-slate-300/50 text-center align-middle shadow-[2px_0_5px_rgba(0,0,0,0.05)] print:static print:shadow-none print:border-r";
    const thMonthClass = "text-white p-3 uppercase text-base font-extrabold tracking-wider border-r border-slate-700/50 print:text-black print:border-black";
    const thWeekClass = "bg-slate-700/80 text-slate-100 text-xs font-semibold p-1.5 text-center border-r border-slate-600/50 w-[11%]";
    const tdClass = "p-2.5 border-b border-r border-slate-200/50 align-top h-[120px] bg-white/80 w-[11%]";
    const tdSubjectClass = "w-[120px] sticky left-0 bg-slate-100/80 backdrop-blur-sm z-20 font-extrabold border-r-4 border-slate-300/50 text-center align-middle shadow-[2px_0_5px_rgba(0,0,0,0.05)] print:static print:shadow-none print:border-r";
    const breakClass = "bg-slate-100/50 text-slate-400 text-center align-middle font-bold italic border border-dashed border-slate-300/80";
    
    const Topic = ({ name, code, desc, pdf, vid }) => (
        <div className="flex flex-col gap-1.5">
            <span className="font-bold text-slate-800 leading-tight text-sm">{name}</span>
            <div className="flex flex-wrap gap-1">
                {pdf && <a href={pdf} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-200/80 transition-colors"><FileText className="w-3 h-3"/> PDF</a>}
                {vid && <a href={vid} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200/80 hover:bg-blue-200/80 transition-colors"><Video className="w-3 h-3"/> Video</a>}
            </div>
            {code && <span className="inline-block bg-slate-100 text-indigo-700 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-slate-200 mt-1 cursor-help relative group w-fit">
                {code}
                <span className="invisible group-hover:visible absolute bottom-[110%] left-1/2 -translate-x-1/2 bg-slate-800 text-white p-2 rounded-lg text-xs w-48 z-50 text-center shadow-lg font-sans whitespace-normal pointer-events-none">
                    {desc}
                </span>
            </span>}
        </div>
    );

    const EmptyBlock = ({ m1, m2 }) => (
        <div className={blockClass}>
            <table className={tableClass}>
                <thead className="sticky top-0 z-30">
                    <tr>
                        <th className={thSubjectClass} rowSpan="2">Subject</th>
                        <th colSpan="4" className={`${thMonthClass} bg-slate-800`}>{m1}</th>
                        <th colSpan="4" className={`${thMonthClass} bg-slate-800`}>{m2}</th>
                    </tr>
                    <tr>
                        <th className={thWeekClass}>Week 1</th><th className={thWeekClass}>Week 2</th><th className={thWeekClass}>Week 3</th><th className={thWeekClass}>Week 4</th>
                        <th className={thWeekClass}>Week 1</th><th className={thWeekClass}>Week 2</th><th className={thWeekClass}>Week 3</th><th className={thWeekClass}>Week 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td className={`${tdSubjectClass} text-green-700`}>World History</td>{[...Array(8)].map((_, i) => <td key={i} className={tdClass}></td>)}</tr>
                    <tr><td className={`${tdSubjectClass} text-blue-700`}>US History</td>{[...Array(8)].map((_, i) => <td key={i} className={tdClass}></td>)}</tr>
                    <tr><td className={`${tdSubjectClass} text-red-700`}>Government</td>{[...Array(8)].map((_, i) => <td key={i} className={tdClass}></td>)}</tr>
                </tbody>
            </table>
        </div>
    );

    return (
        <>
        {/* ==================== AUG & SEPT ==================== */}
        <div className={blockClass}>
            <table className={tableClass}>
                <thead className="sticky top-0 z-30">
                    <tr>
                        <th className={thSubjectClass} rowSpan="2">Subject</th>
                        <th colSpan="4" className={`${thMonthClass} bg-slate-800`}>August</th>
                        <th colSpan="4" className={`${thMonthClass} bg-slate-800`}>September</th>
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

        <EmptyBlock m1="October" m2="November" />
        <EmptyBlock m1="December" m2="January" />
        <EmptyBlock m1="February" m2="March" />
        <EmptyBlock m1="April" m2="May" />
        </>
    );
}

function EnglishContent() {
    const AZURE_BASE = "https://lrsstoragehub.blob.core.windows.net/curriculum-resources/";
    const getGrammar = (monthPrefix, type) => `${AZURE_BASE}grammar/all_grammar_${monthPrefix}_${type}.pdf`;

    // Common Classes (reused)
    const tableClass = "w-full min-w-[1200px] border-collapse text-sm table-fixed print:min-w-0 print:w-full";
    const blockClass = "bg-white/70 backdrop-blur-xl max-w-[1400px] mx-auto mb-10 rounded-2xl shadow-2xl shadow-slate-200/60 border border-slate-200/50 overflow-x-auto print:shadow-none print:border-none print:overflow-visible print:mb-8";
    const thSubjectClass = "w-[120px] sticky left-0 bg-slate-100/80 backdrop-blur-sm z-20 font-extrabold text-slate-800 border-r-4 border-slate-300/50 text-center align-middle shadow-[2px_0_5px_rgba(0,0,0,0.05)] print:static print:shadow-none print:border-r";
    const thMonthClass = "text-white p-3 uppercase text-base font-extrabold tracking-wider border-r border-slate-700/50 print:text-black print:border-black";
    const thWeekClass = "bg-slate-700/80 text-slate-100 text-xs font-semibold p-1.5 text-center border-r border-slate-600/50 w-[11%]";
    const tdClass = "p-2.5 border-b border-r border-slate-200/50 align-top h-[120px] bg-white/80 w-[11%]";
    const tdSubjectClass = "w-[120px] sticky left-0 bg-slate-100/80 backdrop-blur-sm z-20 font-extrabold border-r-4 border-slate-300/50 text-center align-middle shadow-[2px_0_5px_rgba(0,0,0,0.05)] print:static print:shadow-none print:border-r";
    const breakClass = "bg-slate-100/50 text-slate-400 text-center align-middle font-bold italic border border-dashed border-slate-300/80";

    const Topic = ({ name, code, desc, slides, keyPdf }) => (
        <div className="flex flex-col gap-1.5">
            <span className="font-bold text-slate-800 leading-tight text-sm">{name}</span>
            <div className="flex flex-wrap gap-1">
                {slides && <a href={slides} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200/80 hover:bg-blue-200/80 transition-colors">Slides</a>}
                {keyPdf && <a href={keyPdf} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200/80 hover:bg-amber-200/80 transition-colors">Key</a>}
            </div>
            {code && <span className="inline-block bg-slate-100 text-indigo-700 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-slate-200 mt-1 cursor-help relative group w-fit">
                {code}
                <span className="invisible group-hover:visible absolute bottom-[110%] left-1/2 -translate-x-1/2 bg-slate-800 text-white p-2 rounded-lg text-xs w-48 z-50 text-center shadow-lg font-sans whitespace-normal pointer-events-none">
                    {desc}
                </span>
            </span>}
        </div>
    );

    const EmptyBlock = ({ m1, m2 }) => (
        <div className={blockClass}>
            <table className={tableClass}>
                <thead className="sticky top-0 z-30">
                    <tr>
                        <th className={thSubjectClass} rowSpan="2">Strand</th>
                        <th colSpan="4" className={`${thMonthClass} bg-slate-800`}>{m1}</th>
                        <th colSpan="4" className={`${thMonthClass} bg-slate-800`}>{m2}</th>
                    </tr>
                    <tr>
                        <th className={thWeekClass}>Wk 1</th><th className={thWeekClass}>Wk 2</th><th className={thWeekClass}>Wk 3</th><th className={thWeekClass}>Wk 4</th>
                        <th className={thWeekClass}>Wk 1</th><th className={thWeekClass}>Wk 2</th><th className={thWeekClass}>Wk 3</th><th className={thWeekClass}>Wk 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td className={`${tdSubjectClass} text-purple-700`}>Literature</td>{[...Array(8)].map((_, i) => <td key={i} className={tdClass}></td>)}</tr>
                    <tr><td className={`${tdSubjectClass} text-orange-700`}>Writing</td>{[...Array(8)].map((_, i) => <td key={i} className={tdClass}></td>)}</tr>
                    <tr><td className={`${tdSubjectClass} text-emerald-700`}>Vocab & Lang</td>{[...Array(8)].map((_, i) => <td key={i} className={tdClass}></td>)}</tr>
                </tbody>
            </table>
        </div>
    );

    return (
        <>
        <div className={blockClass}>
            <table className={tableClass}>
                <thead className="sticky top-0 z-30">
                    <tr>
                        <th className={thSubjectClass} rowSpan="2">Strand</th>
                        <th colSpan="4" className={`${thMonthClass} bg-slate-800`}>August</th>
                        <th colSpan="4" className={`${thMonthClass} bg-slate-800`}>September</th>
                    </tr>
                    <tr>
                        <th className={thWeekClass}>Wk 1</th><th className={thWeekClass}>Wk 2</th><th className={thWeekClass}>Wk 3</th><th className={thWeekClass}>Wk 4</th>
                        <th className={thWeekClass}>Wk 1</th><th className={thWeekClass}>Wk 2</th><th className={thWeekClass}>Wk 3</th><th className={thWeekClass}>Wk 4</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className={`${tdSubjectClass} text-purple-700`}>Literature</td>
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
                        <td className={`${tdSubjectClass} text-orange-700`}>Writing</td>
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
                        <td className={`${tdSubjectClass} text-emerald-700`}>Vocab & Lang</td>
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

        <EmptyBlock m1="October" m2="November" />
        <EmptyBlock m1="December" m2="January" />
        <EmptyBlock m1="February" m2="March" />
        <EmptyBlock m1="April" m2="May" />
        </>
    );
}
