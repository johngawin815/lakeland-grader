import React, { useEffect, useState } from 'react';
import { Target, Telescope, Bird, Leaf, Flame, Droplets, ChevronRight, Archive, BookOpen, UserCheck, X, Plus, Pencil, Trash2, Users, Loader2, GraduationCap, Clock, MapPin } from 'lucide-react';
import ClassGradebook from '../grading/ClassGradebook';
import CourseFormModal from './CourseFormModal';
import EnrollmentManager from './EnrollmentManager';
import { databaseService } from '../../services/databaseService';
import { MOCK_STUDENTS } from '../../data/mockData';

// Mock user, as requested. In a real app, this would come from an auth context.
const MOCK_USER = { name: "John Gawin", unit: "Harmony", email: "john.gawin@lakeland.edu" };

// --- Main Dashboard Component ---
const StudentMasterDashboard = ({ setView, user = MOCK_USER, onSelectCourse, initialTab }) => {
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
        {activeTab === 'roster' && <UnitRoster defaultUnit={user.unit} />}
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
const UnitRoster = ({ defaultUnit }) => {
    const [selectedUnit, setSelectedUnit] = useState(defaultUnit || 'Determination');
    const [roster, setRoster] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);

    useEffect(() => {
        const fetchRoster = async () => {
            setLoading(true);
            try {
                const students = await databaseService.getStudentsByUnit(selectedUnit);
                if (students && students.length > 0) {
                    setRoster(students);
                } else {
                    setRoster(generateMockRoster().filter(s => s.unitName === selectedUnit));
                }
            } catch (error) {
                console.error("Failed to fetch unit roster:", error);
                setRoster(generateMockRoster().filter(s => s.unitName === selectedUnit));
            }
            setLoading(false);
        };

        fetchRoster();
    }, [selectedUnit]);

    return (
        <>
            {/* Unit Selector */}
            <div className="flex flex-wrap gap-2 mb-5">
                {UNIT_CONFIG.map(unit => {
                    const Icon = unit.icon;
                    const isActive = selectedUnit === unit.key;
                    return (
                        <button
                            key={unit.key}
                            onClick={() => setSelectedUnit(unit.key)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                                isActive
                                    ? `${unit.badge} border-current shadow-sm`
                                    : 'bg-white text-slate-500 border-slate-200/80 hover:bg-slate-50'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {unit.label}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mr-3" />
                    <span className="text-sm font-medium text-slate-400">Loading roster...</span>
                </div>
            ) : roster.length === 0 ? (
                <div className="text-center py-20 text-slate-400 italic">No students assigned to the {selectedUnit} unit.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {roster.map(student => (
                        <StudentCard
                            key={student.id}
                            student={student}
                            onSelect={() => {
                                setSelectedStudentProfile(student);
                            }}
                        />
                    ))}
                </div>
            )}

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
    const initials = (student.firstName?.[0] || '') + (student.lastName?.[0] || '');
    const Icon = unitStyle?.icon || UserCheck;

    // Days in program
    const admitDate = new Date(student.admitDate);
    const today = new Date();
    const daysIn = Math.max(0, Math.floor((today - admitDate) / (1000 * 60 * 60 * 24)));

    // Program progress (admit → expected discharge)
    let progressPct = 0;
    if (student.expectedDischargeDate) {
        const dischargeDate = new Date(student.expectedDischargeDate);
        const total = dischargeDate - admitDate;
        if (total > 0) progressPct = Math.min(100, Math.round(((today - admitDate) / total) * 100));
    }

    return (
        <div
            onClick={onSelect}
            className={`relative border-l-4 ${unitStyle?.accentBorder || 'border-l-slate-300'} border border-slate-200/60 rounded-2xl bg-white cursor-pointer transition-all duration-200 group hover:shadow-xl hover:-translate-y-0.5 hover:border-slate-300/80 overflow-hidden`}
        >
            {/* Card Body */}
            <div className="p-5">
                {/* Header Row: Avatar + Name + Badges */}
                <div className="flex items-start gap-3.5 mb-4">
                    <div className={`w-11 h-11 rounded-xl ${unitStyle?.avatarBg || 'bg-slate-400'} ring-2 ${unitStyle?.avatarRing || 'ring-slate-200'} ring-offset-1 flex items-center justify-center text-white font-extrabold text-sm tracking-wide shrink-0 shadow-sm`}>
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[15px] text-slate-900 leading-tight truncate group-hover:text-indigo-600 transition-colors">
                            {student.studentName}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${unitStyle?.tagBg || 'bg-slate-100 text-slate-600'}`}>
                                <Icon className="w-3 h-3" />
                                {student.unitName}
                            </span>
                            {student.iep === "Yes" && (
                                <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold border border-amber-200/60">
                                    IEP
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-4">
                    <div className="flex items-center gap-1.5 text-slate-500">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold">Grade {student.gradeLevel}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold">{daysIn} days</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5 text-slate-400 truncate">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate font-medium">{student.district || 'No district'}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Program Progress</span>
                        <span className="text-[10px] font-bold text-slate-500">{progressPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${progressPct >= 80 ? 'bg-emerald-500' : progressPct >= 50 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50/80 border-t border-slate-100 group-hover:bg-indigo-50/50 transition-colors">
                <span className="text-[11px] text-slate-400 font-medium">
                    Admitted {admitDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    View <ChevronRight className="w-3.5 h-3.5" />
                </div>
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
                    {parseFloat(course.credits)} Credits
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
  { key: "Determination", label: "Determination", icon: Target, color: "text-purple-500", badge: "bg-purple-100 text-purple-800", border: "border-purple-200 hover:border-purple-400", avatarBg: "bg-purple-500", avatarRing: "ring-purple-200", accentBorder: "border-l-purple-500", tagBg: "bg-purple-50 text-purple-700" },
  { key: "Discovery", label: "Discovery", icon: Telescope, color: "text-yellow-500", badge: "bg-yellow-100 text-yellow-800", border: "border-yellow-200 hover:border-yellow-400", avatarBg: "bg-amber-500", avatarRing: "ring-amber-200", accentBorder: "border-l-amber-500", tagBg: "bg-amber-50 text-amber-700" },
  { key: "Freedom", label: "Freedom", icon: Bird, color: "text-sky-500", badge: "bg-sky-100 text-sky-800", border: "border-sky-200 hover:border-sky-400", avatarBg: "bg-sky-500", avatarRing: "ring-sky-200", accentBorder: "border-l-sky-500", tagBg: "bg-sky-50 text-sky-700" },
  { key: "Harmony", label: "Harmony", icon: Leaf, color: "text-green-500", badge: "bg-green-100 text-green-800", border: "border-green-200 hover:border-green-400", avatarBg: "bg-emerald-500", avatarRing: "ring-emerald-200", accentBorder: "border-l-emerald-500", tagBg: "bg-emerald-50 text-emerald-700" },
  { key: "Integrity", label: "Integrity", icon: Flame, color: "text-orange-500", badge: "bg-orange-100 text-orange-800", border: "border-orange-200 hover:border-orange-400", avatarBg: "bg-orange-500", avatarRing: "ring-orange-200", accentBorder: "border-l-orange-500", tagBg: "bg-orange-50 text-orange-700" },
  { key: "Serenity", label: "Serenity", icon: Droplets, color: "text-blue-500", badge: "bg-blue-100 text-blue-800", border: "border-blue-200 hover:border-blue-400", avatarBg: "bg-blue-500", avatarRing: "ring-blue-200", accentBorder: "border-l-blue-500", tagBg: "bg-blue-50 text-blue-700" },
  { key: "Discharged", label: "Discharged Residents", icon: Archive, color: "text-slate-500", badge: "bg-slate-100 text-slate-600", border: "border-slate-200 hover:border-slate-400", avatarBg: "bg-slate-400", avatarRing: "ring-slate-200", accentBorder: "border-l-slate-400", tagBg: "bg-slate-100 text-slate-600" }
];

const generateMockRoster = () => MOCK_STUDENTS.filter(s => s.active);

const StudentProfileModal = ({ student, onClose }) => {
    const unitStyle = UNIT_CONFIG.find(u => u.key === student.unitName);
    const initials = (student.firstName?.[0] || '') + (student.lastName?.[0] || '');
    const Icon = unitStyle?.icon || UserCheck;

    const admitDate = new Date(student.admitDate);
    const today = new Date();
    const daysIn = Math.max(0, Math.floor((today - admitDate) / (1000 * 60 * 60 * 24)));

    let progressPct = 0;
    let daysRemaining = null;
    if (student.expectedDischargeDate) {
        const dischargeDate = new Date(student.expectedDischargeDate);
        const total = dischargeDate - admitDate;
        if (total > 0) progressPct = Math.min(100, Math.round(((today - admitDate) / total) * 100));
        const remaining = Math.max(0, Math.ceil((dischargeDate - today) / (1000 * 60 * 60 * 24)));
        daysRemaining = remaining;
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '---';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>

                {/* Hero Header */}
                <div className={`relative px-6 pt-7 pb-5 bg-gradient-to-br from-slate-800 to-slate-900 text-white`}>
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl ${unitStyle?.avatarBg || 'bg-slate-500'} ring-4 ring-white/20 flex items-center justify-center text-white font-extrabold text-xl tracking-wide shadow-lg`}>
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-extrabold leading-tight truncate">{student.studentName}</h3>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${unitStyle?.badge || 'bg-slate-100 text-slate-600'}`}>
                                    <Icon className="w-3.5 h-3.5" />
                                    {student.unitName}
                                </span>
                                {student.iep === "Yes" && (
                                    <span className="text-xs bg-amber-400/20 text-amber-300 px-2.5 py-1 rounded-lg font-bold border border-amber-400/30">
                                        IEP
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar in Header */}
                    <div className="mt-5">
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Program Progress</span>
                            <span className="text-[11px] font-bold text-white/70">{progressPct}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${progressPct >= 80 ? 'bg-emerald-400' : progressPct >= 50 ? 'bg-indigo-400' : 'bg-amber-400'}`}
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                    <div className="px-4 py-4 text-center">
                        <div className="text-2xl font-extrabold text-slate-900">{student.gradeLevel}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Grade</div>
                    </div>
                    <div className="px-4 py-4 text-center">
                        <div className="text-2xl font-extrabold text-slate-900">{daysIn}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Days In</div>
                    </div>
                    <div className="px-4 py-4 text-center">
                        <div className={`text-2xl font-extrabold ${daysRemaining !== null && daysRemaining <= 30 ? 'text-rose-600' : 'text-slate-900'}`}>
                            {daysRemaining !== null ? daysRemaining : '---'}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Days Left</div>
                    </div>
                </div>

                {/* Detail Fields */}
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <ProfileField icon={<MapPin className="w-4 h-4" />} label="District" value={student.district || '---'} />
                        <ProfileField icon={<GraduationCap className="w-4 h-4" />} label="Grade Level" value={`${student.gradeLevel}th Grade`} />
                        <ProfileField icon={<Clock className="w-4 h-4" />} label="Admit Date" value={formatDate(student.admitDate)} />
                        <ProfileField icon={<Clock className="w-4 h-4" />} label="Expected Discharge" value={formatDate(student.expectedDischargeDate)} />
                    </div>

                    {/* ID Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">ID: {student.id}</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${student.active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {student.active !== false ? 'Active' : 'Discharged'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProfileField = ({ icon, label, value }) => (
    <div className="flex items-start gap-2.5">
        <div className="mt-0.5 text-slate-400">{icon}</div>
        <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
            <div className="text-sm font-semibold text-slate-800 truncate mt-0.5">{value}</div>
        </div>
    </div>
);

export default StudentMasterDashboard;
