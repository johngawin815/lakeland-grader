import React, { useEffect, useState } from 'react';
import { Target, Telescope, Bird, Leaf, Flame, Droplets, ChevronRight, Archive, BookOpen, UserCheck, X, Plus, Pencil, Trash2, Users, Loader2 } from 'lucide-react';
import ClassGradebook from '../grading/ClassGradebook';
import CourseFormModal from './CourseFormModal';
import EnrollmentManager from './EnrollmentManager';
import { databaseService } from '../../services/databaseService';
import { MOCK_STUDENTS } from '../../data/mockData';

// Mock user, as requested. In a real app, this would come from an auth context.
const MOCK_USER = { name: "John Gawin", unit: "Harmony", email: "john.gawin@lakeland.edu" };

// --- Main Dashboard Component ---
const StudentMasterDashboard = ({ activeStudentName, setActiveStudent, setView, user = MOCK_USER, onSelectCourse, initialTab }) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'roster');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [managingCourse, setManagingCourse] = useState(null);

  // Sync tab when initialTab prop changes (e.g., from HubShell gradebook nav)
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // If managing enrollment for a course, show EnrollmentManager
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

  // If a course is selected, render its gradebook
  if (selectedCourse) {
    return <ClassGradebook course={selectedCourse} onExit={() => setSelectedCourse(null)} user={user} onNavigateToGradeCards={() => { setSelectedCourse(null); if (setView) setView('gradecards'); }} />;
  }

  return (
    <div className="w-full min-h-full p-8 box-border flex flex-col font-sans max-w-7xl mx-auto relative">
      <div className="flex justify-between items-center mb-5 shrink-0">
        <div>
          <h2 className="m-0 text-slate-900 text-3xl font-extrabold tracking-tight">
            Teacher Dashboard
          </h2>
          <p className="m-1 text-slate-500 text-base">
            Welcome, {user.name}. Toggle between your unit and class responsibilities.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-0 border-b border-slate-200/80">
        <TabButton
          label="My Unit Roster"
          icon={<UserCheck />}
          isActive={activeTab === 'roster'}
          onClick={() => setActiveTab('roster')}
        />
        <TabButton
          label="My Classes"
          icon={<BookOpen />}
          isActive={activeTab === 'classes'}
          onClick={() => setActiveTab('classes')}
        />
      </div>

      {/* Tab Content */}
      <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-b-2xl rounded-tr-2xl shadow-2xl shadow-slate-200/60 min-h-[500px] p-6 relative z-0">
        {activeTab === 'roster' && <UnitRoster unitName={user.unit} setActiveStudent={setActiveStudent} />}
        {activeTab === 'classes' && (
          <MyClasses
            teacherName={user.name}
            user={user}
            onCourseSelect={setSelectedCourse}
            onManageEnrollment={setManagingCourse}
          />
        )}
      </div>
    </div>
  );
};

// --- Helper Components ---

const TabButton = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 rounded-t-lg font-bold text-sm transition-all flex items-center gap-2.5 border-b-2 ${
      isActive
        ? 'border-indigo-600 text-indigo-600'
        : 'border-transparent text-slate-500 hover:text-slate-800'
    }`}
  >
    {React.cloneElement(icon, { className: 'w-5 h-5' })}
    {label}
  </button>
);


// --- "My Unit Roster" Tab Content ---
const UnitRoster = ({ unitName, setActiveStudent }) => {
    const [roster, setRoster] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);

    useEffect(() => {
        const fetchRoster = async () => {
            setLoading(true);
            try {
                const students = await databaseService.getStudentsByUnit(unitName);
                if (students && students.length > 0) {
                    setRoster(students);
                } else {
                    setRoster(generateMockRoster().filter(s => s.unitName === unitName));
                }
            } catch (error) {
                console.error("Failed to fetch unit roster:", error);
                setRoster(generateMockRoster().filter(s => s.unitName === unitName));
            }
            setLoading(false);
        };

        if (unitName) {
            fetchRoster();
        }
    }, [unitName]);

    if (loading) {
        return <div className="text-center py-20 text-slate-400">Loading roster...</div>;
    }

    if (roster.length === 0) {
        return <div className="text-center py-20 text-slate-400 italic">No students assigned to the {unitName} unit.</div>;
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {roster.map(student => (
                    <StudentCard
                        key={student.id}
                        student={student}
                        onSelect={() => {
                            setActiveStudent(student.studentName);
                            setSelectedStudentProfile(student);
                        }}
                    />
                ))}
            </div>

            {selectedStudentProfile && (
                <StudentProfileModal
                    student={selectedStudentProfile}
                    onClose={() => setSelectedStudentProfile(null)}
                />
            )}
        </>
    );
};

const StudentCard = ({ student, onSelect }) => {
    const unitStyle = UNIT_CONFIG.find(u => u.key === student.unitName);
    return (
        <div
            onClick={onSelect}
            className={`p-4 border ${unitStyle?.border || 'border-slate-200/80 hover:border-indigo-400/50'} rounded-xl shadow-sm bg-white/80 cursor-pointer transition-all group flex flex-col gap-2 hover:shadow-xl hover:bg-white`}
        >
            <div className="flex justify-between items-start">
                <div className={`font-bold text-lg group-hover:text-indigo-600 ${unitStyle?.color || 'text-slate-800'}`}>
                    {student.studentName}
                </div>
                {student.iep === "Yes" && <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">IEP</span>}
            </div>
            <div className="text-xs text-slate-500 font-medium flex justify-between items-center mt-auto">
                <span>Grade {student.gradeLevel}</span>
                <span className="text-slate-400">Admit: {student.admitDate}</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </div>
        </div>
    );
};


// --- "My Classes" Tab Content ---
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
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mr-3" />
                <span className="text-sm font-medium text-slate-400">Loading classes...</span>
            </div>
        );
    }

    return (
        <>
            {/* Create Course Button */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                    {courses.length} Course{courses.length !== 1 ? 's' : ''}
                </h3>
                <button
                    onClick={handleCreateCourse}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/10"
                >
                    <Plus className="w-4 h-4" /> Create Course
                </button>
            </div>

            {courses.length === 0 ? (
                <div className="text-center py-16">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 italic mb-4">No courses yet. Create your first course to get started.</p>
                    <button
                        onClick={handleCreateCourse}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/10"
                    >
                        <Plus className="w-4 h-4" /> Create Course
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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

            {/* Course Form Modal */}
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
    <div className="p-6 border border-slate-200/80 rounded-2xl shadow-lg bg-white/80 transition-all group hover:shadow-2xl hover:bg-white flex flex-col gap-3">
        <div className="flex justify-between items-start">
            <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600 border border-white">
                <BookOpen className="w-7 h-7" />
            </div>
            <div className="flex items-center gap-1.5">
                {course.subjectArea && (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 font-bold">
                        {course.subjectArea}
                    </span>
                )}
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-bold">
                    {course.credits} Credits
                </span>
            </div>
        </div>
        <div>
            <h3 className="font-bold text-xl text-slate-800">{course.courseName}</h3>
            <p className="text-sm text-slate-500">
                {course.term && <span className="font-medium">{course.term}</span>}
            </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <div className="flex gap-1">
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
                className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline"
            >
                Open Gradebook <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    </div>
);


// --- MOCK DATA AND CONFIGS ---

const UNIT_CONFIG = [
  { key: "Determination", label: "Determination", icon: Target, color: "text-purple-500", badge: "bg-purple-100 text-purple-800", border: "border-purple-200 hover:border-purple-400" },
  { key: "Discovery", label: "Discovery", icon: Telescope, color: "text-yellow-500", badge: "bg-yellow-100 text-yellow-800", border: "border-yellow-200 hover:border-yellow-400" },
  { key: "Freedom", label: "Freedom", icon: Bird, color: "text-sky-500", badge: "bg-sky-100 text-sky-800", border: "border-sky-200 hover:border-sky-400" },
  { key: "Harmony", label: "Harmony", icon: Leaf, color: "text-green-500", badge: "bg-green-100 text-green-800", border: "border-green-200 hover:border-green-400" },
  { key: "Integrity", label: "Integrity", icon: Flame, color: "text-orange-500", badge: "bg-orange-100 text-orange-800", border: "border-orange-200 hover:border-orange-400" },
  { key: "Serenity", label: "Serenity", icon: Droplets, color: "text-blue-500", badge: "bg-blue-100 text-blue-800", border: "border-blue-200 hover:border-blue-400" },
  { key: "Discharged", label: "Discharged Residents", icon: Archive, color: "text-slate-500", badge: "bg-slate-100 text-slate-600", border: "border-slate-200 hover:border-slate-400" }
];

const generateMockRoster = () => MOCK_STUDENTS.filter(s => s.active);

const StudentProfileModal = ({ student, onClose }) => (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl shadow-slate-900/10 w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200/60 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-extrabold text-slate-900">Student Profile</h3>
                    <p className="text-sm text-slate-500">{student.studentName}</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="p-6 space-y-3 text-sm">
                <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Student ID</span>
                    <span className="text-slate-900 font-bold">{student.id}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Grade Level</span>
                    <span className="text-slate-900 font-bold">{student.gradeLevel}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Unit</span>
                    <span className="text-slate-900 font-bold">{student.unitName}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Admit Date</span>
                    <span className="text-slate-900 font-bold">{student.admitDate}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">IEP</span>
                    <span className="text-slate-900 font-bold">{student.iep}</span>
                </div>
            </div>
        </div>
    </div>
);

export default StudentMasterDashboard;
