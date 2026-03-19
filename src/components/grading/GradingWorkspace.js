import React, { useState, useEffect } from 'react';
import { BookOpen, FileSpreadsheet, FileBadge, Plus, Users, Pencil, Trash2, ChevronRight, Loader2 } from 'lucide-react';
import ClassGradebook from './ClassGradebook';
import CourseFormModal from '../dashboard/CourseFormModal';
import EnrollmentManager from '../dashboard/EnrollmentManager';
import { databaseService } from '../../services/databaseService';
import QuarterSpreadsheetView from './QuarterSpreadsheetView';
import GradeGenerator from './GradeGenerator';

const GradingWorkspace = ({ user, activeStudent }) => {
  const [activeTab, setActiveTab] = useState('classes');
  
  // State for 'My Classes' tab
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [managingCourse, setManagingCourse] = useState(null);

  if (managingCourse) {
    return (
      <div className="w-full min-h-full p-8 box-border font-sans max-w-7xl mx-auto">
        <EnrollmentManager
          course={managingCourse}
          user={user}
          onExit={() => setManagingCourse(null)}
        />
      </div>
    );
  }

  if (selectedCourse) {
    return (
      <ClassGradebook 
        course={selectedCourse} 
        onExit={() => setSelectedCourse(null)} 
        user={user} 
        onNavigateToGradeCards={() => { setSelectedCourse(null); setActiveTab('reportCards'); }}
      />
    );
  }

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
          label="My Classes"
          icon={<BookOpen />}
          isActive={activeTab === 'classes'}
          onClick={() => setActiveTab('classes')}
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
        {activeTab === 'classes' && (
          <div className="flex-1 overflow-y-auto p-6">
            <MyClasses
              teacherName={user.name}
              user={user}
              onCourseSelect={setSelectedCourse}
              onManageEnrollment={setManagingCourse}
            />
          </div>
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


// --- "My Classes" Tab Content (Extracted from StudentMasterDashboard) ---
const MyClasses = ({ teacherName, user, onCourseSelect, onManageEnrollment }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const teacherCourses = await databaseService.getCoursesByTeacher(teacherName);
            setCourses(teacherCourses);
        } catch (error) {
            console.error("Failed to fetch courses:", error);
            setCourses([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (teacherName) {
            fetchCourses();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teacherName]);

    const handleCreateCourse = () => {
        setEditingCourse(null);
        setIsCourseModalOpen(true);
    };

    const handleEditCourse = (course) => {
        setEditingCourse(course);
        setIsCourseModalOpen(true);
    };

    const handleDeleteCourse = async (course) => {
        if (!window.confirm(`Delete "${course.courseName}"? This cannot be undone.`)) return;
        try {
            await databaseService.deleteCourse(course.id);
            databaseService.logAudit(user, 'DeleteCourse', `Deleted course: ${course.courseName}`);
            fetchCourses();
        } catch (error) {
            console.error("Failed to delete course:", error);
            alert('Failed to delete course.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400 mr-3" />
                <span className="text-sm font-medium text-slate-400">Loading classes...</span>
            </div>
        );
    }

    return (
        <>
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {courses.length} Course{courses.length !== 1 ? 's' : ''}
                </h3>
                <button
                    onClick={handleCreateCourse}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-xs hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Plus className="w-3.5 h-3.5" /> Create Course
                </button>
            </div>

            {courses.length === 0 ? (
                <div className="text-center py-16">
                    <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm mb-4">No courses yet. Create your first course to get started.</p>
                    <button
                        onClick={handleCreateCourse}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-xs hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-3.5 h-3.5" /> Create Course
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map(course => (
                        <CourseCard
                            key={course.id}
                            course={course}
                            onOpen={() => onCourseSelect(course)}
                            onManage={() => onManageEnrollment(course)}
                            onEdit={() => handleEditCourse(course)}
                            onDelete={() => handleDeleteCourse(course)}
                        />
                    ))}
                </div>
            )}

            <CourseFormModal
                isOpen={isCourseModalOpen}
                onClose={() => { setIsCourseModalOpen(false); setEditingCourse(null); }}
                course={editingCourse}
                user={user}
                onSaved={fetchCourses}
            />
        </>
    );
};


const CourseCard = ({ course, onOpen, onManage, onEdit, onDelete }) => (
    <div className="p-5 border border-slate-200/60 rounded-xl shadow-sm bg-white transition-all group hover:shadow-md hover:border-slate-300 flex flex-col gap-3">
        <div className="flex justify-between items-start">
            <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-500">
                <BookOpen className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1.5">
                {course.subjectArea && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold">
                        {course.subjectArea}
                    </span>
                )}
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">
                    {parseFloat(course.credits)} cr
                </span>
            </div>
        </div>
        <div>
            <h3 className="font-semibold text-base text-slate-800">{course.courseName}</h3>
            {course.term && (
                <p className="text-xs text-slate-400 mt-0.5">{course.term}</p>
            )}
        </div>

        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <div className="flex gap-0.5">
                <button
                    onClick={(e) => { e.stopPropagation(); onManage(); }}
                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    title="Manage Students"
                >
                    <Users className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                    title="Edit Course"
                >
                    <Pencil className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    title="Delete Course"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
            <button
                onClick={onOpen}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
                Gradebook <ChevronRight className="w-3.5 h-3.5" />
            </button>
        </div>
    </div>
);

export default GradingWorkspace;
