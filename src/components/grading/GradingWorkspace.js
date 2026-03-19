import React, { useState, useMemo } from 'react';
import { BookOpen, FileSpreadsheet, FileBadge } from 'lucide-react';
import ClassGradebook from './ClassGradebook';
import QuarterSpreadsheetView from './QuarterSpreadsheetView';
import GradeGenerator from './GradeGenerator';

const GradingWorkspace = ({ user, activeStudent }) => {
  const [activeTab, setActiveTab] = useState('gradebook');
  
  const teacherCourse = useMemo(() => ({
    id: `teacher-${user?.name?.replace(/\\s+/g, '-') || 'default'}`,
    courseName: `${user?.name || 'My'} Gradebook`,
    teacherName: user?.name || ''
  }), [user]);

  return (
    <div className="w-full h-full box-border flex flex-col font-sans max-w-7xl mx-auto relative cursor-default">
      {/* Header */}
      <div className="flex justify-between items-center px-6 pt-5 pb-2 shrink-0">
        <div>
          <h2 className="text-slate-800 text-lg font-bold tracking-tight">
            Grading Workspace
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            {user.units?.join(', ')} &middot; {user.name}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-0 border-b border-slate-200/80 px-6 shrink-0">
        <TabButton
          label="My Gradebook"
          icon={<BookOpen />}
          isActive={activeTab === 'gradebook'}
          onClick={() => setActiveTab('gradebook')}
        />
        <TabButton
          label="Quarter Spreadsheet"
          icon={<FileSpreadsheet />}
          isActive={activeTab === 'spreadsheet'}
          onClick={() => setActiveTab('spreadsheet')}
        />
        <TabButton
          label="Report Cards"
          icon={<FileBadge />}
          isActive={activeTab === 'reportCards'}
          onClick={() => setActiveTab('reportCards')}
        />
      </div>

      {/* Tab Content */}
      <div className="bg-slate-50/80 backdrop-blur-xl border border-slate-200/40 rounded-b-2xl rounded-tr-2xl shadow-xl shadow-slate-200/40 flex-1 flex flex-col overflow-hidden relative z-0">
        {activeTab === 'gradebook' && (
          <ClassGradebook 
            course={teacherCourse} 
            user={user} 
            onNavigateToGradeCards={() => setActiveTab('reportCards')}
          />
        )}
        {activeTab === 'spreadsheet' && (
          <div className="flex-1 overflow-y-auto w-full h-full bg-slate-50">
            <QuarterSpreadsheetView />
          </div>
        )}
        {activeTab === 'reportCards' && (
          <div className="flex-1 overflow-y-auto w-full h-full bg-slate-50">
            <GradeGenerator user={user} activeStudent={activeStudent} />
          </div>
        )}
      </div>
    </div>
  );
};

// --- Helper Components ---
const TabButton = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2.5 rounded-t-lg font-semibold text-sm transition-all flex items-center gap-2 border-b-2 ${
      isActive
        ? 'border-indigo-500 text-indigo-600 bg-white/50'
        : 'border-transparent text-slate-400 hover:text-slate-600'
    }`}
  >
    {React.cloneElement(icon, { className: 'w-4 h-4' })}
    {label}
  </button>
);

export default GradingWorkspace;
